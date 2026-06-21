package com.example.subastas.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.subastas.model.ItemTimerEstado;

/**
 * Gestiona los timers de cuenta regresiva para ítems en subasta.
 *
 * Fase inicial (sin pujas): 5 minutos desde que el ítem se activa.
 * Fase activa  (con pujas): 1 minuto desde la última puja recibida.
 * Cooldown entre ítems   : 30 segundos entre la adjudicación de un ítem
 *                          y el inicio de las pujas del siguiente.
 *
 * El deadline (epoch millis) y el total de la fase se exponen para que
 * construirSalaResponse los incluya en cada broadcast.
 *
 * El timer del ítem activo además se persiste en item_timer_estado (ver
 * obtenerEstadoPersistido) porque la memoria (estos ConcurrentHashMap) se pierde en
 * cada reinicio del backend. Antes eso se interpretaba como "ya venció" y se cerraba
 * el ítem instantáneamente sin que pasara tiempo real — con esto, SubastaService puede
 * distinguir "se perdió la memoria pero todavía falta tiempo" de "de verdad venció".
 */
@Service
public class ItemTimerService {

    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(4);

    // Bean separado a propósito: corre la persistencia en su PROPIA transacción
    // (REQUIRES_NEW). Si esto falla (tabla no creada, etc.) y lo atrapáramos en la MISMA
    // transacción del que llama (ej. activarItem), Spring marca esa transacción entera
    // como rollback-only en el momento del error — atraparlo localmente no alcanza, igual
    // tira UnexpectedRollbackException al final. Aislado en su propia transacción, un
    // fallo ahí se queda contenido y nunca rompe la operación real de la subasta.
    @Autowired
    private ItemTimerEstadoService itemTimerEstadoService;

    // ── Timer del ítem activo ─────────────────────────────────────────────────
    private final ConcurrentHashMap<Integer, ScheduledFuture<?>> timers    = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, Long>               deadlines = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, Integer>            totales   = new ConcurrentHashMap<>();

    // Un lock por subasta (no uno global) para serializar TODO el tramo "leer estado del
    // timer → decidir si hay que recuperarlo/expirarlo → reiniciarlo o cancelarlo" frente a
    // pedidos concurrentes sobre la MISMA subasta. Con un solo postor pujando, las requests
    // llegan de a una y nunca se pisan; apenas hay 2+ personas pujando y polleando /live a la
    // vez sobre el mismo subastaId, la chance de que dos hilos lean/escriban el estado del
    // timer entrelazados crece mucho — y ahí es donde aparecían los cierres espurios. Subastas
    // DISTINTAS usan locks DISTINTOS, así que esto no serializa nada entre subastas diferentes.
    private final ConcurrentHashMap<Integer, ReentrantLock> locks = new ConcurrentHashMap<>();

    /**
     * Lock dedicado a esta subasta. Expuesto públicamente para que SubastaService.
     * construirSalaResponse pueda envolver con el MISMO lock su propio tramo de
     * lectura+decisión (¿recupero o expiro?), no solo las escrituras de acá adentro —
     * si no, dos hilos podrían pasar la lectura "deadline == null" al mismo tiempo y
     * los dos disparar una recuperación o expiración por separado.
     */
    public ReentrantLock lockFor(Integer subastaId) {
        return locks.computeIfAbsent(subastaId, k -> new ReentrantLock());
    }

    // ── Cooldown entre ítems ──────────────────────────────────────────────────
    private final ConcurrentHashMap<Integer, ScheduledFuture<?>> cooldownTimers    = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, Long>               cooldownDeadlines  = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, Integer>            cooldownNextItemIds = new ConcurrentHashMap<>();

    // ═════════════════════════════════════════════════════════════════════════
    // Timer del ítem activo
    // ═════════════════════════════════════════════════════════════════════════

    public void iniciarTimer(Integer subastaId, Integer itemId, int segundos, Runnable onExpiry) {
        ReentrantLock lock = lockFor(subastaId);
        lock.lock();
        try {
            // OJO: a propósito NO llamamos cancelarTimer() acá (eso fue un bug real, ver abajo).
            // cancelarTimer() hace deadlines.remove(subastaId) — si lo llamáramos primero, queda
            // un hueco brevísimo donde getDeadline() devuelve null ANTES de que pongamos el nuevo
            // valor. Cualquier request concurrente (poll de /live de OTRO dispositivo conectado,
            // pasa todo el tiempo con varios postores en la sala) que llame a construirSalaResponse
            // justo en ese hueco ve "no hay timer en memoria" y el safety-net lo interpreta como
            // "se perdió por un reinicio del backend" — disparando el cierre del ítem sin que haya
            // pasado el tiempo real. Esto explica el patrón reportado: pasa más seguido cuando hay
            // más gente conectada pujando/viendo a la vez (más polling concurrente = más chances de
            // pegarle al hueco), y por qué a veces una puja "no reinicia" el timer (una recuperación
            // espuria concurrente pisa el reset recién hecho).
            //
            // Acá solo cancelamos el ScheduledFuture viejo (que no dispare) pero NUNCA borramos el
            // deadline antes de tener el nuevo: deadlines.put(...) reemplaza directamente el valor
            // anterior por el nuevo en un solo paso atómico, sin pasar nunca por null en el medio.
            //
            // Además, TODO este método corre bajo el lock de la subasta (ver lockFor): esto es lo
            // que de verdad blinda contra 2+ postores pujando/polleando a la vez — sin el lock, dos
            // hilos podían entrelazar sus pasos (uno cancelando el future viejo justo cuando el otro
            // está leyendo el estado) sin que ningún paso individual fuera "incorrecto" por sí solo.
            // Con el lock, esta secuencia entera es atómica de punta a punta para esta subasta.
            ScheduledFuture<?> anterior = timers.get(subastaId);
            if (anterior != null) anterior.cancel(false);

            long deadline = System.currentTimeMillis() + (segundos * 1000L);
            deadlines.put(subastaId, deadline);
            totales.put(subastaId, segundos);
            persistir(subastaId, itemId, deadline, segundos);

            // AtomicReference (no un array/variable común) para que la escritura de futureRef.set(...)
            // de más abajo tenga garantía de visibilidad real entre el hilo que llama a iniciarTimer
            // y el hilo del executor que ejecuta la tarea programada.
            AtomicReference<ScheduledFuture<?>> futureRef = new AtomicReference<>();
            ScheduledFuture<?> future = executor.schedule(() -> {
                ReentrantLock lockExpiry = lockFor(subastaId);
                lockExpiry.lock();
                try {
                    // Blindaje extra: cancel(false) no interrumpe una ejecución que YA arrancó. Si
                    // justo en el límite llegó una puja que reemplazó este timer pero la tarea vieja
                    // ya había empezado a correr, confirmamos acá (ya con el lock tomado, sin que
                    // nadie más pueda estar tocando el estado al mismo tiempo) que seguimos siendo
                    // el timer vigente antes de procesar nada.
                    if (timers.get(subastaId) != futureRef.get()) return;
                    timers.remove(subastaId);
                    deadlines.remove(subastaId);
                    totales.remove(subastaId);
                    borrarPersistido(subastaId);
                    try {
                        onExpiry.run();
                    } catch (Exception e) {
                        System.err.println("[ItemTimerService] ERROR en onExpiry para subasta " + subastaId + ": " + e);
                        e.printStackTrace();
                    }
                } finally {
                    lockExpiry.unlock();
                }
            }, segundos, TimeUnit.SECONDS);
            futureRef.set(future);

            timers.put(subastaId, future);
        } finally {
            lock.unlock();
        }
    }

    public void cancelarTimer(Integer subastaId) {
        ReentrantLock lock = lockFor(subastaId);
        lock.lock();
        try {
            ScheduledFuture<?> f = timers.remove(subastaId);
            if (f != null) f.cancel(false);
            deadlines.remove(subastaId);
            totales.remove(subastaId);
            borrarPersistido(subastaId);
        } finally {
            lock.unlock();
        }
    }

    public Long getDeadline(Integer subastaId)         { return deadlines.get(subastaId); }
    public Integer getTotalSegundos(Integer subastaId) { return totales.get(subastaId); }

    /**
     * Estado persistido del timer activo de esta subasta (sobrevive a un reinicio del
     * backend), o null si no hay ninguno guardado. Ver SubastaService.construirSalaResponse:
     * si la memoria no tiene nada pero esto sí, hay que fijarse si el deadline real ya
     * pasó o no antes de decidir si el ítem efectivamente venció.
     */
    public ItemTimerEstado obtenerEstadoPersistido(Integer subastaId) {
        try {
            return itemTimerEstadoService.obtener(subastaId);
        } catch (Exception e) {
            // Si la tabla todavía no existe (no se corrió el SQL) o cualquier otro problema
            // de esa transacción aparte, no queremos romper toda la sala — solo perdemos la
            // recuperación ante reinicios, nada más.
            System.err.println("[ItemTimerService] No se pudo leer item_timer_estado: " + e);
            return null;
        }
    }

    private void persistir(Integer subastaId, Integer itemId, long deadlineEpochMs, int segundos) {
        try {
            itemTimerEstadoService.persistir(subastaId, itemId, deadlineEpochMs, segundos);
        } catch (Exception e) {
            System.err.println("[ItemTimerService] No se pudo persistir item_timer_estado: " + e);
        }
    }

    private void borrarPersistido(Integer subastaId) {
        try {
            itemTimerEstadoService.borrar(subastaId);
        } catch (Exception e) {
            System.err.println("[ItemTimerService] No se pudo borrar item_timer_estado: " + e);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Cooldown entre ítems
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Inicia un período de espera entre ítems.
     *
     * @param subastaId  id de la subasta
     * @param segundos   duración del cooldown (normalmente 30)
     * @param nextItemId id del ítem que se activará al terminar el cooldown
     * @param onEnd      callback que activa el siguiente ítem
     */
    public void iniciarCooldown(Integer subastaId, int segundos, Integer nextItemId, Runnable onEnd) {
        cancelarCooldown(subastaId);

        long deadline = System.currentTimeMillis() + (segundos * 1000L);
        cooldownDeadlines.put(subastaId, deadline);
        cooldownNextItemIds.put(subastaId, nextItemId);

        ScheduledFuture<?> future = executor.schedule(() -> {
            cooldownTimers.remove(subastaId);
            cooldownDeadlines.remove(subastaId);
            cooldownNextItemIds.remove(subastaId);
            try {
                onEnd.run();
            } catch (Exception e) {
                System.err.println("[ItemTimerService] ERROR en cooldown para subasta " + subastaId + ": " + e);
                e.printStackTrace();
            }
        }, segundos, TimeUnit.SECONDS);

        cooldownTimers.put(subastaId, future);
    }

    public void cancelarCooldown(Integer subastaId) {
        ScheduledFuture<?> f = cooldownTimers.remove(subastaId);
        if (f != null) f.cancel(false);
        cooldownDeadlines.remove(subastaId);
        cooldownNextItemIds.remove(subastaId);
    }

    /** Epoch millis cuando termina el cooldown, o null si no hay cooldown activo. */
    public Long getCooldownDeadline(Integer subastaId)     { return cooldownDeadlines.get(subastaId); }

    /** ID del ítem que se activará al finalizar el cooldown, o null si no hay cooldown. */
    public Integer getCooldownNextItemId(Integer subastaId) { return cooldownNextItemIds.get(subastaId); }
}

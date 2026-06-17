package com.example.subastas.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

/**
 * Gestiona los timers de cuenta regresiva para ítems en subasta.
 *
 * Fase inicial (sin pujas): 5 minutos desde que el admin activa el ítem.
 * Fase activa  (con pujas): 1 minuto desde la última puja recibida.
 *
 * El deadline (epoch millis) y el total de la fase se exponen para que
 * construirSalaResponse los incluya en cada broadcast — el frontend
 * calcula el tiempo restante localmente sin necesidad de ticks por WS.
 *
 * En memoria: se reinicia con el servidor (igual que las sesiones).
 */
@Service
public class ItemTimerService {

    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(4);

    // subastaId → tarea programada
    private final ConcurrentHashMap<Integer, ScheduledFuture<?>> timers   = new ConcurrentHashMap<>();
    // subastaId → epoch millis de vencimiento
    private final ConcurrentHashMap<Integer, Long>              deadlines = new ConcurrentHashMap<>();
    // subastaId → duración total de la fase en curso (300 o 60)
    private final ConcurrentHashMap<Integer, Integer>           totales   = new ConcurrentHashMap<>();

    /**
     * Inicia (o reinicia) el timer para la subasta indicada.
     *
     * @param subastaId id de la subasta
     * @param segundos  duración de la fase (300 para inicial, 60 para activa)
     * @param onExpiry  Runnable que se ejecuta cuando el timer vence
     */
    public void iniciarTimer(Integer subastaId, int segundos, Runnable onExpiry) {
        // Cancelar timer anterior si existe
        cancelarTimer(subastaId);

        long deadline = System.currentTimeMillis() + (segundos * 1000L);
        deadlines.put(subastaId, deadline);
        totales.put(subastaId, segundos);

        ScheduledFuture<?> future = executor.schedule(() -> {
            // Limpiar antes de ejecutar la acción para que getDeadline() devuelva null
            deadlines.remove(subastaId);
            totales.remove(subastaId);
            timers.remove(subastaId);
            try {
                onExpiry.run();
            } catch (Exception e) {
                // Loggear pero no propagar — el executor no debe morir por errores de negocio
                e.printStackTrace();
            }
        }, segundos, TimeUnit.SECONDS);

        timers.put(subastaId, future);
    }

    /**
     * Cancela el timer activo para la subasta (si existe).
     * Se llama cuando el admin adjudica manualmente o la subasta cierra.
     */
    public void cancelarTimer(Integer subastaId) {
        ScheduledFuture<?> f = timers.remove(subastaId);
        if (f != null) f.cancel(false);
        deadlines.remove(subastaId);
        totales.remove(subastaId);
    }

    /** Epoch millis cuando vence el timer activo, o null si no hay timer. */
    public Long getDeadline(Integer subastaId) {
        return deadlines.get(subastaId);
    }

    /** Duración total de la fase activa en segundos (300 o 60), o null si no hay timer. */
    public Integer getTotalSegundos(Integer subastaId) {
        return totales.get(subastaId);
    }
}

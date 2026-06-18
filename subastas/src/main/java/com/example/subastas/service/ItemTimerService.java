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
 * Fase inicial (sin pujas): 5 minutos desde que el ítem se activa.
 * Fase activa  (con pujas): 1 minuto desde la última puja recibida.
 * Cooldown entre ítems   : 30 segundos entre la adjudicación de un ítem
 *                          y el inicio de las pujas del siguiente.
 *
 * El deadline (epoch millis) y el total de la fase se exponen para que
 * construirSalaResponse los incluya en cada broadcast.
 */
@Service
public class ItemTimerService {

    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(4);

    // ── Timer del ítem activo ─────────────────────────────────────────────────
    private final ConcurrentHashMap<Integer, ScheduledFuture<?>> timers    = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, Long>               deadlines = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, Integer>            totales   = new ConcurrentHashMap<>();

    // ── Cooldown entre ítems ──────────────────────────────────────────────────
    private final ConcurrentHashMap<Integer, ScheduledFuture<?>> cooldownTimers    = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, Long>               cooldownDeadlines  = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, Integer>            cooldownNextItemIds = new ConcurrentHashMap<>();

    // ═════════════════════════════════════════════════════════════════════════
    // Timer del ítem activo
    // ═════════════════════════════════════════════════════════════════════════

    public void iniciarTimer(Integer subastaId, int segundos, Runnable onExpiry) {
        cancelarTimer(subastaId);

        long deadline = System.currentTimeMillis() + (segundos * 1000L);
        deadlines.put(subastaId, deadline);
        totales.put(subastaId, segundos);

        ScheduledFuture<?> future = executor.schedule(() -> {
            timers.remove(subastaId);
            deadlines.remove(subastaId);
            totales.remove(subastaId);
            try {
                onExpiry.run();
            } catch (Exception e) {
                System.err.println("[ItemTimerService] ERROR en onExpiry para subasta " + subastaId + ": " + e);
                e.printStackTrace();
            }
        }, segundos, TimeUnit.SECONDS);

        timers.put(subastaId, future);
    }

    public void cancelarTimer(Integer subastaId) {
        ScheduledFuture<?> f = timers.remove(subastaId);
        if (f != null) f.cancel(false);
        deadlines.remove(subastaId);
        totales.remove(subastaId);
    }

    public Long getDeadline(Integer subastaId)         { return deadlines.get(subastaId); }
    public Integer getTotalSegundos(Integer subastaId) { return totales.get(subastaId); }

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

package com.example.subastas.service;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/**
 * Manejo de sesiones activas en sala de subasta.
 *
 * La tabla "asistentes" en la DB cumple dos roles: sesión activa + historial de pujas.
 * Como los registros con pujas no pueden borrarse (FK constraint), este servicio es
 * la fuente de verdad para "¿está el usuario en sala AHORA?".
 *
 * Estado en memoria → se reinicia con el server, lo cual es correcto porque las
 * conexiones WebSocket también caen y los usuarios deben re-unirse.
 *
 * Latido (heartbeat): cada sesión guarda cuándo fue su última actividad confirmada
 * (poll exitoso de /live o puja). Si pasa demasiado tiempo sin actividad, la sesión
 * se considera abandonada y deja de "contar" — sin esto, un usuario que cierra la app,
 * pierde conexión, o navega de una forma que no dispara el "salir" explícito (ej. el
 * gesto nativo de swipe-back de iOS, que no siempre llama al handler de salida)
 * quedaría marcado "en sala" para siempre, bloqueado de entrar a cualquier otra subasta
 * hasta que el servidor reinicie.
 */
@Service
public class SesionSubastaService {

    /**
     * Tiempo máximo sin latido antes de considerar la sesión abandonada. Bastante mayor
     * al intervalo de polling del mobile (1.5s) para tolerar baches de red, pero chico
     * para no dejar a alguien "trabado" en sala por minutos si salió sin avisar.
     */
    private static final long TTL_MILLIS = 20_000;

    private static final class Sesion {
        final Integer subastaId;
        volatile long ultimoLatido;
        Sesion(Integer subastaId) {
            this.subastaId = subastaId;
            this.ultimoLatido = System.currentTimeMillis();
        }
    }

    // clienteId → sesión activa (subastaId + último latido)
    private final ConcurrentHashMap<Integer, Sesion> sesionesActivas = new ConcurrentHashMap<>();

    /** Registra que el cliente entró a la sala. */
    public void registrarEntrada(Integer clienteId, Integer subastaId) {
        sesionesActivas.put(clienteId, new Sesion(subastaId));
    }

    /** Marca la salida del cliente de cualquier sala. */
    public void registrarSalida(Integer clienteId) {
        sesionesActivas.remove(clienteId);
    }

    /**
     * ¿Está el cliente activo en esta subasta específica? Si la sesión sigue vigente
     * (no expiró) y coincide, además renueva el latido — por eso cada poll de /live o
     * cada puja exitosa "mantiene viva" la sesión mientras la app siga conectada.
     */
    public boolean estaEnSala(Integer clienteId, Integer subastaId) {
        Sesion s = vigente(clienteId);
        if (s == null || !subastaId.equals(s.subastaId)) return false;
        s.ultimoLatido = System.currentTimeMillis();
        return true;
    }

    /** ¿Está el cliente activo en alguna sala? Devuelve el subastaId si es así. */
    public Optional<Integer> getSalaActiva(Integer clienteId) {
        Sesion s = vigente(clienteId);
        return s == null ? Optional.empty() : Optional.of(s.subastaId);
    }

    /** Devuelve la sesión solo si todavía no expiró por falta de latido; si expiró, la limpia. */
    private Sesion vigente(Integer clienteId) {
        Sesion s = sesionesActivas.get(clienteId);
        if (s == null) return null;
        if (System.currentTimeMillis() - s.ultimoLatido > TTL_MILLIS) {
            sesionesActivas.remove(clienteId, s);
            return null;
        }
        return s;
    }
}

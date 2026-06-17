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
 */
@Service
public class SesionSubastaService {

    // clienteId → subastaId en la que está activo ahora mismo
    private final ConcurrentHashMap<Integer, Integer> sesionesActivas = new ConcurrentHashMap<>();

    /** Registra que el cliente entró a la sala. */
    public void registrarEntrada(Integer clienteId, Integer subastaId) {
        sesionesActivas.put(clienteId, subastaId);
    }

    /** Marca la salida del cliente de cualquier sala. */
    public void registrarSalida(Integer clienteId) {
        sesionesActivas.remove(clienteId);
    }

    /** ¿Está el cliente activo en esta subasta específica? */
    public boolean estaEnSala(Integer clienteId, Integer subastaId) {
        return subastaId.equals(sesionesActivas.get(clienteId));
    }

    /** ¿Está el cliente activo en alguna sala? Devuelve el subastaId si es así. */
    public Optional<Integer> getSalaActiva(Integer clienteId) {
        return Optional.ofNullable(sesionesActivas.get(clienteId));
    }
}

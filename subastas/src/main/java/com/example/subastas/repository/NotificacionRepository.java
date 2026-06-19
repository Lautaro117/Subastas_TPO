package com.example.subastas.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Notificacion;

public interface NotificacionRepository extends JpaRepository<Notificacion, Integer> {
    List<Notificacion> findByClienteIdAndLeidaFalseOrderByCreatedAtDesc(Integer clienteId);
    List<Notificacion> findByClienteIdOrderByCreatedAtDesc(Integer clienteId);
    List<Notificacion> findByClienteId(Integer clienteId);
    /** Usado para la "campanita": busca quién marcó un ítem puntual para que le avisen. */
    List<Notificacion> findByTipoAndMensajeAndLeidaFalse(String tipo, String mensaje);
}
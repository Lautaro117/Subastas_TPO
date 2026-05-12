package com.example.subastas.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Notificacion;

public interface NotificacionRepository extends JpaRepository<Notificacion, Integer> {
    List<Notificacion> findByClienteIdAndLeidaFalseOrderByCreatedAtDesc(Integer clienteId);
}
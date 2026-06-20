package com.example.subastas.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.MedioPagoSeleccionado;

public interface MedioPagoSeleccionadoRepository extends JpaRepository<MedioPagoSeleccionado, Integer> {
    Optional<MedioPagoSeleccionado> findByClienteIdAndItemId(Integer clienteId, Integer itemId);
}

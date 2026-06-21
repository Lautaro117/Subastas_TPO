package com.example.subastas.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.DetalleObra;

public interface DetalleObraRepository extends JpaRepository<DetalleObra, Integer> {
    Optional<DetalleObra> findByProducto(Integer producto);
}

package com.example.subastas.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.AdminProducto;

public interface AdminProductoRepository extends JpaRepository<AdminProducto, Integer> {
    Optional<AdminProducto> findByProductoId(Integer productoId);
}
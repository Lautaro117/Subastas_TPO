package com.example.subastas.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.CustodiaProductos;

public interface CustodiaProductoRepository extends JpaRepository<CustodiaProductos, Integer> {
    Optional<CustodiaProductos> findByProductoId(Integer productoId);
}
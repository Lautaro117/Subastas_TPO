package com.example.subastas.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.FotoProducto;

public interface FotoProductoRepository extends JpaRepository<FotoProducto, Integer> {
    List<FotoProducto> findByProducto(Integer producto);

} 
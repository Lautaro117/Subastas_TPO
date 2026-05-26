package com.example.subastas.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Producto;


public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    List<Producto> findByDuenio(Integer duenio);
}

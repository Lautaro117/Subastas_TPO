package com.example.subastas.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Multas;

public interface MultasRepository extends JpaRepository<Multas, Integer> {
    List<Multas> findByClienteIdAndEstado(Integer clienteId, String estado);
}
package com.example.subastas.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
}
package com.example.subastas.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Depositos;

public interface DepositoRepository extends JpaRepository<Depositos, Integer> {}
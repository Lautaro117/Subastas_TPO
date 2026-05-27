package com.example.subastas.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Seguro;

public interface SeguroRepository extends JpaRepository<Seguro, String> {}
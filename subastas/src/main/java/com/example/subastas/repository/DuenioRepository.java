package com.example.subastas.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Duenio;

public interface DuenioRepository extends JpaRepository<Duenio, Integer> {
}
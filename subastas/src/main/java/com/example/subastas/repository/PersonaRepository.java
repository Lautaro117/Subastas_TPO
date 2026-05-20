package com.example.subastas.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Persona;

public interface PersonaRepository extends JpaRepository<Persona, Integer> {
    
}


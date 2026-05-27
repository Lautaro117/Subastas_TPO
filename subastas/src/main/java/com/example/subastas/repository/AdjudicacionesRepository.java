package com.example.subastas.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Adjudicaciones;

public interface AdjudicacionesRepository extends JpaRepository<Adjudicaciones, Integer> {
    Optional<Adjudicaciones> findByItemIdAndAsistenteId(Integer itemId, Integer asistenteId);
    Optional<Adjudicaciones> findByItemId(Integer itemId);
    int countByAsistenteId(Integer asistenteId);
    List<Adjudicaciones> findAllByAsistenteId(Integer asistenteId);
}
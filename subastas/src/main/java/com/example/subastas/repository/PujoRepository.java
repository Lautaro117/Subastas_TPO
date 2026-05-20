package com.example.subastas.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Pujo;

public interface PujoRepository extends JpaRepository<Pujo, Integer> {
    List<Pujo> findByItemId(Integer itemId);
    Optional<Pujo> findTopByItemIdOrderByImporteDesc(Integer itemId);
    List<Pujo> findByAsistenteId(Integer asistenteId);
    Optional<Pujo> findByAsistenteIdAndItemIdAndGanador(Integer asistenteId, Integer itemId, String ganador);
    Optional<Pujo> findTopByAsistenteIdAndItemIdOrderByImporteDesc(Integer asistenteId, Integer itemId);
    
}
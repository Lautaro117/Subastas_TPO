package com.example.subastas.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Pujo;

public interface PujoRepository extends JpaRepository<Pujo, Integer> {
    List<Pujo> findByItemId(Integer itemId);
    Optional<Pujo> findTopByItemIdOrderByImporteDesc(Integer itemId);
}
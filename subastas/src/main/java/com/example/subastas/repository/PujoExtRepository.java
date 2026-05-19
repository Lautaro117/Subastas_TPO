package com.example.subastas.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.PujoExt;

public interface PujoExtRepository extends JpaRepository<PujoExt, Integer> {
    Optional<PujoExt> findByPujoId(Integer pujoId);
    boolean existsByPujoIdAndEstado(Integer pujoId, String estado);
}
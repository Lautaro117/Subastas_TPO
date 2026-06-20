package com.example.subastas.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.PagoAdjudicacion;

public interface PagoAdjudicacionRepository extends JpaRepository<PagoAdjudicacion, Integer> {
    Optional<PagoAdjudicacion> findByAdjudicacionId(Integer adjudicacionId);
}

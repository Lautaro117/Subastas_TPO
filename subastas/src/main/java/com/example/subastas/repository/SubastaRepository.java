package com.example.subastas.repository;

import com.example.subastas.model.Subasta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubastaRepository extends JpaRepository<Subasta, Integer> {
    List<Subasta> findByCategoria(String categoria);
    List<Subasta> findByEstado(String estado);
}
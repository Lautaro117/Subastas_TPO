package com.example.subastas.repository;

import com.example.subastas.model.Catalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CatalogoRepository extends JpaRepository<Catalogo, Integer> {
    Optional<Catalogo> findBySubastaId(Integer subastaId);
}
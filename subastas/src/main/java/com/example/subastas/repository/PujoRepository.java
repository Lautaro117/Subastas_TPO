package com.example.subastas.repository;

import com.example.subastas.model.Pujo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PujoRepository extends JpaRepository<Pujo, Integer> {
    List<Pujo> findByItemId(Integer itemId);
    Optional<Pujo> findTopByItemIdOrderByImporteDesc(Integer itemId);
}
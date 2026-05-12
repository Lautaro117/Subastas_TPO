package com.example.subastas.repository;

import com.example.subastas.model.ItemCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemCatalogoRepository extends JpaRepository<ItemCatalogo, Integer> {
    List<ItemCatalogo> findByCatalogoId(Integer catalogoId);
}
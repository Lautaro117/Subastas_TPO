package com.example.subastas.repository;

import com.example.subastas.model.ItemCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemCatalogoRepository extends JpaRepository<ItemCatalogo, Integer> {
    /** Devuelve los ítems ordenados por PK ascendente (= orden de ingreso al catálogo). */
    List<ItemCatalogo> findByCatalogoIdOrderByIdentificadorAsc(Integer catalogoId);
    /** Compat: alias sin ordering para los lugares que ya lo llaman sin ordenar. */
    default List<ItemCatalogo> findByCatalogoId(Integer catalogoId) {
        return findByCatalogoIdOrderByIdentificadorAsc(catalogoId);
    }
    java.util.Optional<ItemCatalogo> findByCatalogoIdAndEnVivo(Integer catalogoId, String enVivo);
}
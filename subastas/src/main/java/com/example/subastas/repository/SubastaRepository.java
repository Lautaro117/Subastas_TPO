package com.example.subastas.repository;

import com.example.subastas.model.Subasta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SubastaRepository extends JpaRepository<Subasta, Integer> {
    List<Subasta> findByCategoria(String categoria);
    List<Subasta> findByEstado(String estado);

    @Modifying
    @Query(value = "SELECT cerrar_subasta(:id)", nativeQuery = true)
    void cerrarSubasta(@Param("id") Integer id);
}
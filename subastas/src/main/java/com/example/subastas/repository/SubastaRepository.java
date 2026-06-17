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

    @Modifying(clearAutomatically = true)
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "INSERT INTO subastas_cierre (subasta_id) VALUES (:id) ON CONFLICT (subasta_id) DO NOTHING", nativeQuery = true)
    void cerrarSubasta(@Param("id") Integer id);

    /** True si la subasta ya fue registrada como cerrada en subastas_cierre. */
    @Query(value = "SELECT EXISTS(SELECT 1 FROM subastas_cierre WHERE subasta_id = :id)", nativeQuery = true)
    boolean existeEnCierre(@Param("id") Integer id);

    /** IDs de todas las subastas registradas como cerradas en subastas_cierre.
     *  Se devuelve List&lt;Object&gt; porque el tipo concreto del JDBC driver varía
     *  (Integer, Long, BigInteger) — el caller hace el cast via Number.intValue(). */
    @Query(value = "SELECT subasta_id FROM subastas_cierre", nativeQuery = true)
    List<Object> findAllCerradasIds();
}
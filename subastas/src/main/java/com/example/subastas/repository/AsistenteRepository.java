package com.example.subastas.repository;

import com.example.subastas.model.Asistente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AsistenteRepository extends JpaRepository<Asistente, Integer> {
    Optional<Asistente> findByClienteIdAndSubastaId(Integer clienteId, Integer subastaId);
    Optional<Asistente> findByClienteId(Integer clienteId);
    boolean existsByClienteId(Integer clienteId);
    void deleteByClienteIdAndSubastaId(Integer clienteId, Integer subastaId);
}
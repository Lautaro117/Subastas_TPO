package com.example.subastas.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.Asistente;

public interface AsistenteRepository extends JpaRepository<Asistente, Integer> {
    Optional<Asistente> findByClienteIdAndSubastaId(Integer clienteId, Integer subastaId);
    Optional<Asistente> findByClienteId(Integer clienteId);
    boolean existsByClienteId(Integer clienteId);
    void deleteByClienteIdAndSubastaId(Integer clienteId, Integer subastaId);
    List<Asistente> findAllByClienteId(Integer clienteId);
}
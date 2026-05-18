package com.example.subastas.repository;

import com.example.subastas.model.MedioPago;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedioPagoRepository extends JpaRepository<MedioPago, Integer> {
    List<MedioPago> findByClienteId(Integer clienteId);
}

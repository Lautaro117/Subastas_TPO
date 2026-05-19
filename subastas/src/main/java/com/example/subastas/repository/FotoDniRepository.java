package com.example.subastas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.subastas.model.FotoDni;
import java.util.Optional;

@Repository
public interface FotoDniRepository extends JpaRepository<FotoDni, Integer> {
    Optional<FotoDni> findByPersonaId(Integer personaId);
}

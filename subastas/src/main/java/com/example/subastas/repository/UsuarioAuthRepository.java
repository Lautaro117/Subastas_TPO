package com.example.subastas.repository;

import com.example.subastas.model.UsuarioAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioAuthRepository extends JpaRepository<UsuarioAuth, Integer> {
    Optional<UsuarioAuth> findByEmail(String email);
    boolean existsByEmail(String email);
}
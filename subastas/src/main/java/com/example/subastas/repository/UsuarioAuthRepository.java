package com.example.subastas.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.subastas.model.UsuarioAuth;

public interface UsuarioAuthRepository extends JpaRepository<UsuarioAuth, Integer> {
    Optional<UsuarioAuth> findByEmail(String email);
    boolean existsByEmail(String email);

    Optional<UsuarioAuth> findByTokenRegistro(String token);
    boolean existsByTokenRegistro(String token);
}


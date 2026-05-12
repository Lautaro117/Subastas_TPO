package com.example.subastas.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private final SecretKey key = Keys.hmacShaKeyFor(
        "subastas-secret-key-debe-tener-256-bits-minimo-ok".getBytes()
    );
    private final long EXPIRATION = 1000 * 60 * 60 * 24; // 24 horas

    public String generateToken(String email, String estado, String categoria) {
    return Jwts.builder()
            .subject(email)
            .claim("estado", estado)
            .claim("categoria", categoria)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + EXPIRATION))
            .signWith(key)
            .compact();
}

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractEstado(String token) {
        return (String) extractClaims(token).get("estado");
    }

    public String extractCategoria(String token) {
        return (String) extractClaims(token).get("categoria");
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
package com.example.subastas.dto;

public class LoginResponse {
    private String token;
    private String email;
    private String estado;
    private String categoria;

    public LoginResponse(String token, String email, String estado, String categoria) {
        this.token = token;
        this.email = email;
        this.estado = estado;
        this.categoria = categoria;
    }

    public String getToken() { return token; }
    public String getEmail() { return email; }
    public String getEstado() { return estado; }
    public String getCategoria() { return categoria; }
}
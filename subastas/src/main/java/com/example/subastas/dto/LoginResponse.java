package com.example.subastas.dto;

public class LoginResponse {
    private String token;
    private String email;
    private String estado;
    private String categoria;
    private int notificacionesPendientes;

    public LoginResponse(String token, String email, String estado, String categoria, int notificacionesPendientes) {
        this.token = token;
        this.email = email;
        this.estado = estado;
        this.categoria = categoria;
        this.notificacionesPendientes = notificacionesPendientes;
    }

    public String getToken() { return token; }
    public String getEmail() { return email; }
    public String getEstado() { return estado; }
    public String getCategoria() { return categoria; }
    public int getNotificacionesPendientes() { return notificacionesPendientes; }
}
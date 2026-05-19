package com.example.subastas.dto;

public class RegisterResponse {

    private Integer solicitudId;
    private String estado;
    private String mensaje;

    public RegisterResponse(Integer solicitudId, String estado) {
        this.solicitudId = solicitudId;
        this.estado = estado;
    }

    public Integer getSolicitudId() { return solicitudId; }
    public void setSolicitudId(Integer solicitudId) { this.solicitudId = solicitudId; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
}


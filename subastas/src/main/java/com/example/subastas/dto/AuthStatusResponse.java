package com.example.subastas.dto;

public class AuthStatusResponse {

    private Integer solicitudId;
    private String email;
    private String estado;
    private String admitido;
    private String tokenRegistro;

    public AuthStatusResponse(Integer solicitudId, String email, String estado, String admitido, String tokenRegistro) {
        this.solicitudId = solicitudId;
        this.email = email;
        this.estado = estado;
        this.admitido = admitido;
        this.tokenRegistro = tokenRegistro;
    }

    public Integer getSolicitudId() { return solicitudId; }
    public void setSolicitudId(Integer solicitudId) { this.solicitudId = solicitudId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getAdmitido() { return admitido; }
    public void setAdmitido(String admitido) { this.admitido = admitido; }

    public String getTokenRegistro() { return tokenRegistro; }
    public void setTokenRegistro(String tokenRegistro) { this.tokenRegistro = tokenRegistro; }
}

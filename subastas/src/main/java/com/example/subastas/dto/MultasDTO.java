package com.example.subastas.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MultasDTO {
    private Integer id;
    private String motivo;
    private BigDecimal importe;
    private String estado;
    private LocalDateTime createdAt;

    public MultasDTO(Integer id, String motivo, BigDecimal importe, String estado, LocalDateTime createdAt) {
        this.id = id;
        this.motivo = motivo;
        this.importe = importe;
        this.estado = estado;
        this.createdAt = createdAt;
    }

    public Integer getId() { return id; }
    public String getMotivo() { return motivo; }
    public BigDecimal getImporte() { return importe; }
    public String getEstado() { return estado; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
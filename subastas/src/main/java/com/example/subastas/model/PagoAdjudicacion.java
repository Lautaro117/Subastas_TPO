package com.example.subastas.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pagos_adjudicaciones")
public class PagoAdjudicacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "adjudicacion_id", nullable = false, unique = true)
    private Integer adjudicacionId;

    @Column(name = "item_id", nullable = false)
    private Integer itemId;

    @Column(name = "medio_pago_id")
    private Integer medioPagoId;

    // pendiente | aprobado | rechazado
    @Column(nullable = false)
    private String estado = "pendiente";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getAdjudicacionId() { return adjudicacionId; }
    public void setAdjudicacionId(Integer adjudicacionId) { this.adjudicacionId = adjudicacionId; }

    public Integer getItemId() { return itemId; }
    public void setItemId(Integer itemId) { this.itemId = itemId; }

    public Integer getMedioPagoId() { return medioPagoId; }
    public void setMedioPagoId(Integer medioPagoId) { this.medioPagoId = medioPagoId; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

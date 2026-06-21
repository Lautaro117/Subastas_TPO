package com.example.subastas.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "multas")
public class Multas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cliente_id", nullable = false)
    private Integer clienteId;

    // Vincula la multa con la adjudicación/pago que la generó (rechazo de pago final).
    // Nullable porque podría haber otros motivos de multa a futuro que no vengan de un
    // pago rechazado puntual. Permite, al pagar la multa, reabrir automáticamente el pago
    // rechazado (volverlo a "pendiente") sin tener que parsear el texto libre de "motivo".
    @Column(name = "adjudicacion_id")
    private Integer adjudicacionId;

    @Column(nullable = false)
    private String motivo;

    @Column(nullable = false)
    private BigDecimal importe;

    @Column(nullable = false)
    private String estado = "pendiente";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getClienteId() { return clienteId; }
    public void setClienteId(Integer clienteId) { this.clienteId = clienteId; }

    public Integer getAdjudicacionId() { return adjudicacionId; }
    public void setAdjudicacionId(Integer adjudicacionId) { this.adjudicacionId = adjudicacionId; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public BigDecimal getImporte() { return importe; }
    public void setImporte(BigDecimal importe) { this.importe = importe; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
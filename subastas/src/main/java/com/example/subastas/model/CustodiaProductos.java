package com.example.subastas.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "custodia_productos")
public class CustodiaProductos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "producto_id")
    private Integer productoId;

    @Column(name = "deposito_id")
    private Integer depositoId;

    private String estado;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getProductoId() { return productoId; }
    public void setProductoId(Integer productoId) { this.productoId = productoId; }

    public Integer getDepositoId() { return depositoId; }
    public void setDepositoId(Integer depositoId) { this.depositoId = depositoId; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
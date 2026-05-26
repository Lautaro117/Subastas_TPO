package com.example.subastas.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "admin_productos")
public class AdminProducto {

    @Id
    @Column(name = "producto_id")
    private Integer productoId;

    private String estado;

    @Column(name = "precio_propuesto")
    private BigDecimal precioPropuesto;

    @Column(name = "estado_propuesta")
    private String estadoPropuesta;

    // getters y setters
    public Integer getProductoId() { return productoId; }
    public void setProductoId(Integer productoId) { this.productoId = productoId; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public BigDecimal getPrecioPropuesto() { return precioPropuesto; }
    public void setPrecioPropuesto(BigDecimal precioPropuesto) { this.precioPropuesto = precioPropuesto; }

    public String getEstadoPropuesta() { return estadoPropuesta; }
    public void setEstadoPropuesta(String estadoPropuesta) { this.estadoPropuesta = estadoPropuesta; }
}
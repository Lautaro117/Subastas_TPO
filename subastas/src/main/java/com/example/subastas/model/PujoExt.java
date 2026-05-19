package com.example.subastas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pujos_ext")
public class PujoExt {

    @Id
    @Column(name = "pujo_id")
    private Integer pujoId;

    @Column(nullable = false)
    private String moneda;

    @Column(nullable = false)
    private String estado = "confirmada";

    @Column(name = "medio_pago_id")
    private Integer medioPagoId;

    public Integer getPujoId() { return pujoId; }
    public void setPujoId(Integer pujoId) { this.pujoId = pujoId; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Integer getMedioPagoId() { return medioPagoId; }
    public void setMedioPagoId(Integer medioPagoId) { this.medioPagoId = medioPagoId; }
}
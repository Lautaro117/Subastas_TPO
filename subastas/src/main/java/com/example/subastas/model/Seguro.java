package com.example.subastas.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "seguros")
public class Seguro {

    @Id
    private String nroPoliza;

    private String compania;

    @Column(name = "poliza_combinada")
    private String polizaCombinada;

    private BigDecimal importe;

    public String getNroPoliza() { return nroPoliza; }
    public String getCompania() { return compania; }
    public String getPolizaCombinada() { return polizaCombinada; }
    public BigDecimal getImporte() { return importe; }
}
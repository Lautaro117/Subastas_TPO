package com.example.subastas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "subastas_config")
public class SubastaConfig {

    @Id
    @Column(name = "subasta_id")
    private Integer subastaId;

    @Column(nullable = false)
    private String moneda = "ARS";

    public Integer getSubastaId() { return subastaId; }
    public void setSubastaId(Integer subastaId) { this.subastaId = subastaId; }

    public String getMoneda() { return moneda != null ? moneda : "ARS"; }
    public void setMoneda(String moneda) { this.moneda = moneda; }
}

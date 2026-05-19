package com.example.subastas.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "cheques_certificados")
@PrimaryKeyJoinColumn(name = "id")
public class ChequeCertificado extends MedioPago {

    @Column(name = "banco_emisor")
    private String bancoEmisor;

    private BigDecimal monto;
    private String moneda;

    @Column(name = "fecha_emision")
    private LocalDate fechaEmision;

    // Getters y Setters
    public String getBancoEmisor() { return bancoEmisor; }
    public void setBancoEmisor(String bancoEmisor) { this.bancoEmisor = bancoEmisor; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }

    public LocalDate getFechaEmision() { return fechaEmision; }
    public void setFechaEmision(LocalDate fechaEmision) { this.fechaEmision = fechaEmision; }
}

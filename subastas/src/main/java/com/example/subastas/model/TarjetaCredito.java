package com.example.subastas.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tarjetas_credito")
@PrimaryKeyJoinColumn(name = "id")
public class TarjetaCredito extends MedioPago {

    private String tipoTarjeta; // "nacional", "internacional"
    private String numeroEnmascarado; // ej: **** **** **** 1234
    private String vencimiento;
    private String titular;
    private String paisEmisor;

    // Getters y Setters
    public String getTipoTarjeta() { return tipoTarjeta; }
    public void setTipoTarjeta(String tipoTarjeta) { this.tipoTarjeta = tipoTarjeta; }

    public String getNumeroEnmascarado() { return numeroEnmascarado; }
    public void setNumeroEnmascarado(String numeroEnmascarado) { this.numeroEnmascarado = numeroEnmascarado; }

    public String getVencimiento() { return vencimiento; }
    public void setVencimiento(String vencimiento) { this.vencimiento = vencimiento; }

    public String getTitular() { return titular; }
    public void setTitular(String titular) { this.titular = titular; }

    public String getPaisEmisor() { return paisEmisor; }
    public void setPaisEmisor(String paisEmisor) { this.paisEmisor = paisEmisor; }
}

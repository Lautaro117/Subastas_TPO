package com.example.subastas.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cuentas_bancarias")
@PrimaryKeyJoinColumn(name = "id")
public class CuentaBancaria extends MedioPago {

    @Column(name = "pais_banco")
    private String paisBanco;

    @Column(name = "nombre_banco")
    private String nombreBanco;

    @Column(name = "cbu_iban")
    private String cbuIban;

    private String titular;

    @Column(name = "fondos_reservados")
    private BigDecimal fondosReservados;

    private String moneda;

    // Getters y Setters
    public String getPaisBanco() { return paisBanco; }
    public void setPaisBanco(String paisBanco) { this.paisBanco = paisBanco; }

    public String getNombreBanco() { return nombreBanco; }
    public void setNombreBanco(String nombreBanco) { this.nombreBanco = nombreBanco; }

    public String getCbuIban() { return cbuIban; }
    public void setCbuIban(String cbuIban) { this.cbuIban = cbuIban; }

    public String getTitular() { return titular; }
    public void setTitular(String titular) { this.titular = titular; }

    public BigDecimal getFondosReservados() { return fondosReservados; }
    public void setFondosReservados(BigDecimal fondosReservados) { this.fondosReservados = fondosReservados; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }
}

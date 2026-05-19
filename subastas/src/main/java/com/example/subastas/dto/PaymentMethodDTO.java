package com.example.subastas.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PaymentMethodDTO {
    // Campos comunes para Bank Account
    private String pais_banco;
    private String nombre_banco;
    private String cbu_iban;
    private String titular;
    private BigDecimal fondos_reservados;
    private String moneda;

    // Campos comunes para Credit Card
    private String tipo; // nacional | internacional
    private String numero;
    private String vencimiento;
    private String cvv;
    private String pais_emisor;

    // Campos comunes para Cheque
    private String banco_emisor;
    private BigDecimal monto;
    private String fecha_emision;
    private Boolean confirmacion_entrega;

    // Getters y Setters
    public String getPais_banco() { return pais_banco; }
    public void setPais_banco(String pais_banco) { this.pais_banco = pais_banco; }

    public String getNombre_banco() { return nombre_banco; }
    public void setNombre_banco(String nombre_banco) { this.nombre_banco = nombre_banco; }

    public String getCbu_iban() { return cbu_iban; }
    public void setCbu_iban(String cbu_iban) { this.cbu_iban = cbu_iban; }

    public String getTitular() { return titular; }
    public void setTitular(String titular) { this.titular = titular; }

    public BigDecimal getFondos_reservados() { return fondos_reservados; }
    public void setFondos_reservados(BigDecimal fondos_reservados) { this.fondos_reservados = fondos_reservados; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getVencimiento() { return vencimiento; }
    public void setVencimiento(String vencimiento) { this.vencimiento = vencimiento; }

    public String getCvv() { return cvv; }
    public void setCvv(String cvv) { this.cvv = cvv; }

    public String getPais_emisor() { return pais_emisor; }
    public void setPais_emisor(String pais_emisor) { this.pais_emisor = pais_emisor; }

    public String getBanco_emisor() { return banco_emisor; }
    public void setBanco_emisor(String banco_emisor) { this.banco_emisor = banco_emisor; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }

    public String getFecha_emision() { return fecha_emision; }
    public void setFecha_emision(String fecha_emision) { this.fecha_emision = fecha_emision; }

    public Boolean getConfirmacion_entrega() { return confirmacion_entrega; }
    public void setConfirmacion_entrega(Boolean confirmacion_entrega) { this.confirmacion_entrega = confirmacion_entrega; }
}

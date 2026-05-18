package com.example.subastas.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pujos")
//esta clase representa una puja realizada por un asistente en una subasta. Contiene información sobre el asistente, el item, el importe de la puja y si es el ganador o no.
public class Pujo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    @Column(name = "asistente", nullable = false)
    private Integer asistenteId;

    @Column(name = "item", nullable = false)
    private Integer itemId;

    @Column(nullable = false)
    private BigDecimal importe;

    @Column(nullable = false)
    private String moneda;

    private String ganador = "no";

    @Column(nullable = false)
    private String estado = "en_proceso"; // "en_proceso", "confirmada", "rechazada"

    @Column(name = "medio_pago_id")
    private Integer medioPagoId;

    // Getters y Setters
    public Integer getIdentificador() { return identificador; }
    public void setIdentificador(Integer identificador) { this.identificador = identificador; }

    public Integer getAsistenteId() { return asistenteId; }
    public void setAsistenteId(Integer asistenteId) { this.asistenteId = asistenteId; }

    public Integer getItemId() { return itemId; }
    public void setItemId(Integer itemId) { this.itemId = itemId; }

    public BigDecimal getImporte() { return importe; }
    public void setImporte(BigDecimal importe) { this.importe = importe; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }

    public String getGanador() { return ganador; }
    public void setGanador(String ganador) { this.ganador = ganador; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Integer getMedioPagoId() { return medioPagoId; }
    public void setMedioPagoId(Integer medioPagoId) { this.medioPagoId = medioPagoId; }
}
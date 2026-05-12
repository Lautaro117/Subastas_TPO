package com.example.subastas.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pujos")
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

    private String ganador = "no";

    // Getters y Setters
    public Integer getIdentificador() { return identificador; }
    public void setIdentificador(Integer identificador) { this.identificador = identificador; }

    public Integer getAsistenteId() { return asistenteId; }
    public void setAsistenteId(Integer asistenteId) { this.asistenteId = asistenteId; }

    public Integer getItemId() { return itemId; }
    public void setItemId(Integer itemId) { this.itemId = itemId; }

    public BigDecimal getImporte() { return importe; }
    public void setImporte(BigDecimal importe) { this.importe = importe; }

    public String getGanador() { return ganador; }
    public void setGanador(String ganador) { this.ganador = ganador; }
}
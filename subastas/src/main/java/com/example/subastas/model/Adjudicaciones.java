package com.example.subastas.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "adjudicaciones")
public class Adjudicaciones {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "item_id", nullable = false)
    private Integer itemId;

    @Column(name = "asistente_id", nullable = false)
    private Integer asistenteId;

    @Column(name = "importe", nullable = false)
    private BigDecimal importe;

    @Column(name = "comision", nullable = false)
    private BigDecimal comision;

    @Column(name = "costo_envio", nullable = false)
    private BigDecimal costoEnvio;

    @Column(name = "direccion_envio")
    private String direccionEnvio;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;


    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getItemId() { return itemId; }
    public void setItemId(Integer itemId) { this.itemId = itemId; }

    public Integer getAsistenteId() { return asistenteId; }
    public void setAsistenteId(Integer asistenteId) { this.asistenteId = asistenteId; }

    public BigDecimal getImporte() { return importe; }
    public void setImporte(BigDecimal importe) { this.importe = importe; }

    public BigDecimal getComision() { return comision; }
    public void setComision(BigDecimal comision) { this.comision = comision; }

    public BigDecimal getCostoEnvio() { return costoEnvio; }
    public void setCostoEnvio(BigDecimal costoEnvio) { this.costoEnvio = costoEnvio; }  

    public String getDireccionEnvio() { return direccionEnvio; }
    public void setDireccionEnvio(String direccionEnvio) { this.direccionEnvio = direccionEnvio; }  

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt;}

}

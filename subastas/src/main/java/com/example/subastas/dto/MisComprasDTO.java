package com.example.subastas.dto;

import java.math.BigDecimal;

public class MisComprasDTO {
    private Integer id;
    private Integer itemId;
    private String descripcion;
    private BigDecimal importe;
    private BigDecimal comision;
    private BigDecimal costoEnvio;
    private String direccionEnvio;

    public MisComprasDTO(Integer id, Integer itemId, String descripcion, BigDecimal importe,
                       BigDecimal comision, BigDecimal costoEnvio, String direccionEnvio) {
        this.id = id;
        this.itemId = itemId;
        this.descripcion = descripcion;
        this.importe = importe;
        this.comision = comision;
        this.costoEnvio = costoEnvio;
        this.direccionEnvio = direccionEnvio;
    }

    public Integer getId() { return id; }
    public Integer getItemId() { return itemId; }
    public String getDescripcion() { return descripcion; }
    public BigDecimal getImporte() { return importe; }
    public BigDecimal getComision() { return comision; }
    public BigDecimal getCostoEnvio() { return costoEnvio; }
    public String getDireccionEnvio() { return direccionEnvio; }
}
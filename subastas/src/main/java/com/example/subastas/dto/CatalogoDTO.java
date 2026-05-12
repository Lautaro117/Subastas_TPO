package com.example.subastas.dto;

import java.math.BigDecimal;

public class CatalogoDTO {
    private Integer itemId;
    private Integer productoId;
    private BigDecimal precioBase;
    private BigDecimal comision;
    private String subastado;

    public CatalogoDTO(Integer itemId, Integer productoId, BigDecimal precioBase, BigDecimal comision, String subastado) {
        this.itemId = itemId;
        this.productoId = productoId;
        this.precioBase = precioBase;
        this.comision = comision;
        this.subastado = subastado;
    }

    public Integer getItemId() { return itemId; }
    public Integer getProductoId() { return productoId; }
    public BigDecimal getPrecioBase() { return precioBase; }
    public BigDecimal getComision() { return comision; }
    public String getSubastado() { return subastado; }
}
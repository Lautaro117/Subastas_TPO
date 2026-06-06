package com.example.subastas.dto;

import java.math.BigDecimal;

public class CatalogoDTO {
    private Integer itemId;
    private Integer productoId;
    private BigDecimal precioBase;
    private BigDecimal comision;
    private String subastado;
    private String descripcionCatalogo;
    private String fotoPrincipal;

    public CatalogoDTO(Integer itemId, Integer productoId, BigDecimal precioBase, BigDecimal comision, String subastado, String descripcionCatalogo, String fotoPrincipal) {
        this.itemId = itemId;
        this.productoId = productoId;
        this.precioBase = precioBase;
        this.comision = comision;
        this.subastado = subastado;
        this.descripcionCatalogo = descripcionCatalogo;
        this.fotoPrincipal = fotoPrincipal;
    }

    public Integer getItemId() { return itemId; }
    public Integer getProductoId() { return productoId; }
    public BigDecimal getPrecioBase() { return precioBase; }
    public BigDecimal getComision() { return comision; }
    public String getSubastado() { return subastado; }
    public String getDescripcionCatalogo() { return descripcionCatalogo; }
    public String getFotoPrincipal() { return fotoPrincipal; }
}
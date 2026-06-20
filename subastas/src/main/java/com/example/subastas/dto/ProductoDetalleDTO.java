package com.example.subastas.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ProductoDetalleDTO {

    private Integer itemId;
    private Integer productoId;
    private BigDecimal precioBase;
    private BigDecimal comision;
    private String subastado;

    // Datos del producto
    private String descripcionCatalogo;
    private String descripcionCompleta;
    private LocalDate fecha;
    private String disponible;

    // Dueño
    private Integer duenioId;
    private String duenioNombre;

    // Fotos en base64
    private List<String> fotos;

    public ProductoDetalleDTO() {}

    public Integer getItemId() { return itemId; }
    public void setItemId(Integer itemId) { this.itemId = itemId; }

    public Integer getProductoId() { return productoId; }
    public void setProductoId(Integer productoId) { this.productoId = productoId; }

    public BigDecimal getPrecioBase() { return precioBase; }
    public void setPrecioBase(BigDecimal precioBase) { this.precioBase = precioBase; }

    public BigDecimal getComision() { return comision; }
    public void setComision(BigDecimal comision) { this.comision = comision; }

    public String getSubastado() { return subastado; }
    public void setSubastado(String subastado) { this.subastado = subastado; }

    public String getDescripcionCatalogo() { return descripcionCatalogo; }
    public void setDescripcionCatalogo(String descripcionCatalogo) { this.descripcionCatalogo = descripcionCatalogo; }

    public String getDescripcionCompleta() { return descripcionCompleta; }
    public void setDescripcionCompleta(String descripcionCompleta) { this.descripcionCompleta = descripcionCompleta; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public String getDisponible() { return disponible; }
    public void setDisponible(String disponible) { this.disponible = disponible; }

    public Integer getDuenioId() { return duenioId; }
    public void setDuenioId(Integer duenioId) { this.duenioId = duenioId; }

    public String getDuenioNombre() { return duenioNombre; }
    public void setDuenioNombre(String duenioNombre) { this.duenioNombre = duenioNombre; }

    public List<String> getFotos() { return fotos; }
    public void setFotos(List<String> fotos) { this.fotos = fotos; }
}
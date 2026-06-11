package com.example.subastas.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "items_catalogo")
public class ItemCatalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    @Column(name = "catalogo", nullable = false)
    private Integer catalogoId;

    @Column(name = "producto", nullable = false)
    private Integer productoId;

    @Column(name = "precio_base", nullable = false)
    private BigDecimal precioBase;

    @Column(nullable = false)
    private BigDecimal comision;

    private String subastado;

    @Column(name = "en_vivo")
    private String enVivo;

    // Getters y Setters
    public Integer getIdentificador() { return identificador; }
    public void setIdentificador(Integer identificador) { this.identificador = identificador; }

    public Integer getCatalogoId() { return catalogoId; }
    public void setCatalogoId(Integer catalogoId) { this.catalogoId = catalogoId; }

    public Integer getProductoId() { return productoId; }
    public void setProductoId(Integer productoId) { this.productoId = productoId; }

    public BigDecimal getPrecioBase() { return precioBase; }
    public void setPrecioBase(BigDecimal precioBase) { this.precioBase = precioBase; }

    public BigDecimal getComision() { return comision; }
    public void setComision(BigDecimal comision) { this.comision = comision; }

    public String getSubastado() { return subastado; }
    public void setSubastado(String subastado) { this.subastado = subastado; }

    public String getEnVivo() { return enVivo; }
    public void setEnVivo(String enVivo) { this.enVivo = enVivo; }
}
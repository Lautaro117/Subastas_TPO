package com.example.subastas.dto;

import java.math.BigDecimal;

public class CatalogoDTO {
    private Integer itemId;
    private Integer productoId;
    private BigDecimal precioBase;
    private BigDecimal comision;
    private String subastado;
    /** "si" cuando el ítem está siendo subastado en este momento. */
    private String enVivo;
    private String descripcionCatalogo;
    private String fotoPrincipal;
    /**
     * true cuando el ítem está cerrado (subastado='si') pero NO tiene una adjudicación real:
     * nadie pujó y venció el timer, así que la empresa lo "compró" simulando la subasta.
     * subastado solo admite 'si'/'no' por un CHECK constraint en la base (no hay un tercer
     * valor posible), por eso esta distinción se calcula acá en vez de guardarse en la DB.
     */
    private Boolean sinPostor;
    // "arte" | "diseno" | null (productos comunes)
    private String tipoObra;

    public CatalogoDTO(Integer itemId, Integer productoId, BigDecimal precioBase,
                       BigDecimal comision, String subastado, String enVivo,
                       String descripcionCatalogo, String fotoPrincipal, Boolean sinPostor) {
        this.itemId = itemId;
        this.productoId = productoId;
        this.precioBase = precioBase;
        this.comision = comision;
        this.subastado = subastado;
        this.enVivo = enVivo;
        this.descripcionCatalogo = descripcionCatalogo;
        this.fotoPrincipal = fotoPrincipal;
        this.sinPostor = sinPostor;
    }

    public Integer getItemId() { return itemId; }
    public Integer getProductoId() { return productoId; }
    public BigDecimal getPrecioBase() { return precioBase; }
    public BigDecimal getComision() { return comision; }
    public String getSubastado() { return subastado; }
    public String getEnVivo() { return enVivo; }
    public String getDescripcionCatalogo() { return descripcionCatalogo; }
    public String getFotoPrincipal() { return fotoPrincipal; }
    public Boolean getSinPostor() { return sinPostor; }
    public String getTipoObra() { return tipoObra; }
    public void setTipoObra(String tipoObra) { this.tipoObra = tipoObra; }
}

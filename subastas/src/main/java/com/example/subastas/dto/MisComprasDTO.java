package com.example.subastas.dto;

import java.math.BigDecimal;
import java.util.List;

public class MisComprasDTO {
    private Integer id;
    private Integer itemId;
    private String descripcion;
    private String descripcionCompleta;
    private BigDecimal importe;
    private BigDecimal comision;
    private BigDecimal costoEnvio;
    private String direccionEnvio;
    private String nroPoliza;
    private String companiaSeguro;
    private List<String> fotos;
    /** Medio de pago con el que ganó esta puja — fijo desde la adjudicación, no se puede cambiar. */
    private Integer medioPagoId;

    public MisComprasDTO(Integer id, Integer itemId, String descripcion, String descripcionCompleta,
                         BigDecimal importe, BigDecimal comision, BigDecimal costoEnvio,
                         String direccionEnvio, String nroPoliza, String companiaSeguro, List<String> fotos,
                         Integer medioPagoId) {
        this.id = id;
        this.itemId = itemId;
        this.descripcion = descripcion;
        this.descripcionCompleta = descripcionCompleta;
        this.importe = importe;
        this.comision = comision;
        this.costoEnvio = costoEnvio;
        this.direccionEnvio = direccionEnvio;
        this.nroPoliza = nroPoliza;
        this.companiaSeguro = companiaSeguro;
        this.fotos = fotos;
        this.medioPagoId = medioPagoId;
    }

    public Integer getId() { return id; }
    public Integer getItemId() { return itemId; }
    public String getDescripcion() { return descripcion; }
    public String getDescripcionCompleta() { return descripcionCompleta; }
    public BigDecimal getImporte() { return importe; }
    public BigDecimal getComision() { return comision; }
    public BigDecimal getCostoEnvio() { return costoEnvio; }
    public String getDireccionEnvio() { return direccionEnvio; }
    public String getNroPoliza() { return nroPoliza; }
    public String getCompaniaSeguro() { return companiaSeguro; }
    public List<String> getFotos() { return fotos; }
    public Integer getMedioPagoId() { return medioPagoId; }
}
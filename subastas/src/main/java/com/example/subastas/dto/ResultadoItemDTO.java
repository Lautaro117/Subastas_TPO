package com.example.subastas.dto;

import java.math.BigDecimal;

public class ResultadoItemDTO {

    private boolean gano;
    private BigDecimal montoPujado;

    // Si ganó
    private BigDecimal montoComision;
    private BigDecimal costoEnvio;
    private BigDecimal total;
    private String medioPagoUsado;
    private String direccionEnvio;

    // Si no ganó
    private CatalogoDTO siguienteItem;

    public boolean isGano() { return gano; }
    public void setGano(boolean gano) { this.gano = gano; }

    public BigDecimal getMontoPujado() { return montoPujado; }
    public void setMontoPujado(BigDecimal montoPujado) { this.montoPujado = montoPujado; }

    public BigDecimal getMontoComision() { return montoComision; }
    public void setMontoComision(BigDecimal montoComision) { this.montoComision = montoComision; }

    public BigDecimal getCostoEnvio() { return costoEnvio; }
    public void setCostoEnvio(BigDecimal costoEnvio) { this.costoEnvio = costoEnvio; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getMedioPagoUsado() { return medioPagoUsado; }
    public void setMedioPagoUsado(String medioPagoUsado) { this.medioPagoUsado = medioPagoUsado; }

    public String getDireccionEnvio() { return direccionEnvio; }
    public void setDireccionEnvio(String direccionEnvio) { this.direccionEnvio = direccionEnvio; }

    public CatalogoDTO getSiguienteItem() { return siguienteItem; }
    public void setSiguienteItem(CatalogoDTO siguienteItem) { this.siguienteItem = siguienteItem; }
}
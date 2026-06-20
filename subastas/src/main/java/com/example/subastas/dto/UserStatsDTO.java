package com.example.subastas.dto;

import java.math.BigDecimal;
import java.util.List;

import com.example.subastas.model.MedioPago;

public class UserStatsDTO {
    private int subastasParticipadas;
    private int pujasRealizadas;
    private int productosPublicados;
    private int articulosGanados;
    private BigDecimal importeTotalOfertado;
    private BigDecimal importeTotalPagado;
    private String categoria;
    private List<MedioPago> mediosPagoHabilitados;

    public UserStatsDTO(int subastasParticipadas, int pujasRealizadas, int productosPublicados,
                        int articulosGanados, BigDecimal importeTotalOfertado, BigDecimal importeTotalPagado,
                        String categoria, List<MedioPago> mediosPagoHabilitados) {
        this.subastasParticipadas = subastasParticipadas;
        this.pujasRealizadas = pujasRealizadas;
        this.productosPublicados = productosPublicados;
        this.articulosGanados = articulosGanados;
        this.importeTotalOfertado = importeTotalOfertado;
        this.importeTotalPagado = importeTotalPagado;
        this.categoria = categoria;
        this.mediosPagoHabilitados = mediosPagoHabilitados;
    }

    public int getSubastasParticipadas() { return subastasParticipadas; }
    public int getPujasRealizadas() { return pujasRealizadas; }
    public int getProductosPublicados() { return productosPublicados; }
    public int getArticulosGanados() { return articulosGanados; }
    public BigDecimal getImporteTotalOfertado() { return importeTotalOfertado; }
    public BigDecimal getImporteTotalPagado() { return importeTotalPagado; }
    public String getCategoria() { return categoria; }
    public List<MedioPago> getMediosPagoHabilitados() { return mediosPagoHabilitados; }
}

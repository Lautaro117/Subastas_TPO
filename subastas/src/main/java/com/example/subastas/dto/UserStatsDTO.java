package com.example.subastas.dto;

import java.util.List;

import com.example.subastas.model.MedioPago;

public class UserStatsDTO {
    private int subastasParticipadas;
    private int pujasRealizadas;
    private int productosPublicados;
    private int articulosGanados;
    private String categoria;
    private List<MedioPago> mediosPagoHabilitados;

    public UserStatsDTO(int subastasParticipadas, int pujasRealizadas, int productosPublicados,
                        int articulosGanados, String categoria, List<MedioPago> mediosPagoHabilitados) {
        this.subastasParticipadas = subastasParticipadas;
        this.pujasRealizadas = pujasRealizadas;
        this.productosPublicados = productosPublicados;
        this.articulosGanados = articulosGanados;
        this.categoria = categoria;
        this.mediosPagoHabilitados = mediosPagoHabilitados;
    }

    public int getSubastasParticipadas() { return subastasParticipadas; }
    public int getPujasRealizadas() { return pujasRealizadas; }
    public int getProductosPublicados() { return productosPublicados; }
    public int getArticulosGanados() { return articulosGanados; }
    public String getCategoria() { return categoria; }
    public List<MedioPago> getMediosPagoHabilitados() { return mediosPagoHabilitados; }
}
package com.example.subastas.dto;

import java.math.BigDecimal;

public class HistorialPujasDTO {

    private Integer id;
    private String fecha;
    private String ubicacion;
    private String categoria;
    private String estado;
    private BigDecimal ultimaPuja;

    public HistorialPujasDTO(Integer id, String fecha, String ubicacion, String categoria, String estado, BigDecimal ultimaPuja) {
        this.id = id;
        this.fecha = fecha;
        this.ubicacion = ubicacion;
        this.categoria = categoria;
        this.estado = estado;
        this.ultimaPuja = ultimaPuja;
    }

    public Integer getId() { return id; }
    public String getFecha() { return fecha; }
    public String getUbicacion() { return ubicacion; }
    public String getCategoria() { return categoria; }
    public String getEstado() { return estado; }
    public BigDecimal getUltimaPuja() { return ultimaPuja; }
}
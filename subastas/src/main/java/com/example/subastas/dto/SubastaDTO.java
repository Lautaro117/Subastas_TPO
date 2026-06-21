package com.example.subastas.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class SubastaDTO {

    private Integer identificador;
    private LocalDate fecha;
    private LocalTime hora;
    private String estado;
    private String ubicacion;
    private Integer capacidadAsistentes;
    private String tieneDeposito;
    private String seguridadPropia;
    private String categoria;
    private Integer subastadorId;
    private String subastadorNombre;
    private String moneda;

    public SubastaDTO() {}

    public Integer getIdentificador() { return identificador; }
    public void setIdentificador(Integer identificador) { this.identificador = identificador; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public LocalTime getHora() { return hora; }
    public void setHora(LocalTime hora) { this.hora = hora; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }

    public Integer getCapacidadAsistentes() { return capacidadAsistentes; }
    public void setCapacidadAsistentes(Integer capacidadAsistentes) { this.capacidadAsistentes = capacidadAsistentes; }

    public String getTieneDeposito() { return tieneDeposito; }
    public void setTieneDeposito(String tieneDeposito) { this.tieneDeposito = tieneDeposito; }

    public String getSeguridadPropia() { return seguridadPropia; }
    public void setSeguridadPropia(String seguridadPropia) { this.seguridadPropia = seguridadPropia; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public Integer getSubastadorId() { return subastadorId; }
    public void setSubastadorId(Integer subastadorId) { this.subastadorId = subastadorId; }

    public String getSubastadorNombre() { return subastadorNombre; }
    public void setSubastadorNombre(String subastadorNombre) { this.subastadorNombre = subastadorNombre; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }
}

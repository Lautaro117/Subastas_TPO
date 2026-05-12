package com.example.subastas.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "subastas")
public class Subasta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private LocalDate fecha;

    @Column(nullable = false)
    private LocalTime hora;

    private String estado;

    private String ubicacion;

    @Column(name = "capacidad_asistentes")
    private Integer capacidadAsistentes;

    @Column(name = "tiene_deposito")
    private String tieneDeposito;

    @Column(name = "seguridad_propia")
    private String seguridadPropia;

    private String categoria;

    @Column(name = "subastador")
    private Integer subastadorId;

    // Getters y Setters
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
}
package com.example.subastas.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private LocalDate fecha;
    private String disponible;

    @Column(name = "descripcion_catalogo")
    private String descripcionCatalogo;

    @Column(name = "descripcion_completa")
    private String descripcionCompleta;

    private Integer revisor;
    private Integer duenio;
    private Integer seguro;

    @Column(name = "estado_admin")
    private String estadoAdmin;

    public Integer getIdentificador() { return identificador; }
    public void setIdentificador(Integer identificador) { this.identificador = identificador; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public String getDisponible() { return disponible; }
    public void setDisponible(String disponible) { this.disponible = disponible; }

    public String getDescripcionCatalogo() { return descripcionCatalogo; }
    public void setDescripcionCatalogo(String descripcionCatalogo) { this.descripcionCatalogo = descripcionCatalogo; }

    public String getDescripcionCompleta() { return descripcionCompleta; }
    public void setDescripcionCompleta(String descripcionCompleta) { this.descripcionCompleta = descripcionCompleta; }

    public Integer getRevisor() { return revisor; }
    public void setRevisor(Integer revisor) { this.revisor = revisor; }

    public Integer getDuenio() { return duenio; }
    public void setDuenio(Integer duenio) { this.duenio = duenio; }

    public Integer getSeguro() { return seguro; }
    public void setSeguro(Integer seguro) { this.seguro = seguro; }

    public String getEstadoAdmin() { return estadoAdmin; }
    public void setEstadoAdmin(String estadoAdmin) { this.estadoAdmin = estadoAdmin; }
}
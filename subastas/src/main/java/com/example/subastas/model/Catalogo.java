package com.example.subastas.model;

import jakarta.persistence.*;

@Entity
@Table(name = "catalogos")
public class Catalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    @Column(nullable = false)
    private String descripcion;

    @Column(name = "subasta")
    private Integer subastaId;

    @Column(name = "responsable", nullable = false)
    private Integer responsable;

    // Getters y Setters
    public Integer getIdentificador() { return identificador; }
    public void setIdentificador(Integer identificador) { this.identificador = identificador; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Integer getSubastaId() { return subastaId; }
    public void setSubastaId(Integer subastaId) { this.subastaId = subastaId; }

    public Integer getResponsable() { return responsable; }
    public void setResponsable(Integer responsable) { this.responsable = responsable; }
}
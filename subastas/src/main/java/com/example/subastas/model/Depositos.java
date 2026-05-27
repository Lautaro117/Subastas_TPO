package com.example.subastas.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "depositos")
public class Depositos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nombre;
    private String direccion;
    private Boolean activo;

    public Integer getId() { return id; }
    public String getNombre() { return nombre; }
    public String getDireccion() { return direccion; }
    public Boolean getActivo() { return activo; }
}
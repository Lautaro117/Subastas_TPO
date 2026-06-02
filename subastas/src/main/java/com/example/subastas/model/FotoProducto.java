package com.example.subastas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "fotos")
public class FotoProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    @Column(name = "producto", nullable = false)
    private Integer producto;

    @Column(nullable = false)
    private byte[] foto;

    public Integer getId() { return identificador; }
    public void setId(Integer id) { this.identificador = id; }

    public Integer getProducto() { return producto; }
    public void setProducto(Integer producto) { this.producto = producto; }

    public byte[] getFoto() { return foto; }
    public void setFoto(byte[] foto) { this.foto = foto; }
}
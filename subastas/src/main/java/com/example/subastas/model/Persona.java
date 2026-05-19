package com.example.subastas.model;

import jakarta.persistence.*;

@Entity
@Table(name = "personas")
public class Persona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    @Column(nullable = false)
    private String documento;

    @Column(nullable = false)
    private String nombre;

    private String direccion;

    private String estado;

    @Column(name = "foto_frente")
    private byte[] fotoFrente;

    @Column(name = "foto_dorso")
    private byte[] fotoDorso;

    // Getters y Setters
    public Integer getIdentificador() { return identificador; }
    public void setIdentificador(Integer identificador) { this.identificador = identificador; }

    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public byte[] getFotoFrente() { return fotoFrente; }
    public void setFotoFrente(byte[] fotoFrente) { this.fotoFrente = fotoFrente; }

    public byte[] getFotoDorso() { return fotoDorso; }
    public void setFotoDorso(byte[] fotoDorso) { this.fotoDorso = fotoDorso; }
}
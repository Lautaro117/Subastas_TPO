package com.example.subastas.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "detalles_obra")
public class DetalleObra {

    @Id
    @Column(name = "producto")
    private Integer producto;

    private String tipo;

    @Column(name = "nombre_autor")
    private String nombreAutor;

    @Column(name = "fecha_creacion")
    private LocalDate fechaCreacion;

    @Column(name = "historia", length = 1000)
    private String historia;

    public Integer getProducto() { return producto; }
    public void setProducto(Integer producto) { this.producto = producto; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getNombreAutor() { return nombreAutor; }
    public void setNombreAutor(String nombreAutor) { this.nombreAutor = nombreAutor; }

    public LocalDate getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDate fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public String getHistoria() { return historia; }
    public void setHistoria(String historia) { this.historia = historia; }
}

package com.example.subastas.dto;

import java.time.LocalDate;

public class DetalleObraDTO {
    private String nombreAutor;
    private LocalDate fechaCreacion;
    private String historia;

    public DetalleObraDTO(String nombreAutor, LocalDate fechaCreacion, String historia) {
        this.nombreAutor = nombreAutor;
        this.fechaCreacion = fechaCreacion;
        this.historia = historia;
    }

    public String getNombreAutor() { return nombreAutor; }
    public LocalDate getFechaCreacion() { return fechaCreacion; }
    public String getHistoria() { return historia; }
}

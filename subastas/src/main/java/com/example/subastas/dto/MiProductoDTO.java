package com.example.subastas.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class MiProductoDTO {
    private Integer id;
    private String descripcionCatalogo;
    private String descripcionCompleta;
    private String estadoAdmin;
    private String estadoPropuesta;
    private BigDecimal precioPropuesto;
    private BigDecimal comision;
    private LocalDate fechaSubasta;
    private List<String> fotos;

    public MiProductoDTO(Integer id, String descripcionCatalogo, String descripcionCompleta,
                         String estadoAdmin, String estadoPropuesta, BigDecimal precioPropuesto,
                         BigDecimal comision, LocalDate fechaSubasta, List<String> fotos) {
        this.id = id;
        this.descripcionCatalogo = descripcionCatalogo;
        this.descripcionCompleta = descripcionCompleta;
        this.estadoAdmin = estadoAdmin;
        this.estadoPropuesta = estadoPropuesta;
        this.precioPropuesto = precioPropuesto;
        this.comision = comision;
        this.fechaSubasta = fechaSubasta;
        this.fotos = fotos;
    }

    public Integer getId() { return id; }
    public String getDescripcionCatalogo() { return descripcionCatalogo; }
    public String getDescripcionCompleta() { return descripcionCompleta; }
    public String getEstadoAdmin() { return estadoAdmin; }
    public String getEstadoPropuesta() { return estadoPropuesta; }
    public BigDecimal getPrecioPropuesto() { return precioPropuesto; }
    public BigDecimal getComision() { return comision; }
    public LocalDate getFechaSubasta() { return fechaSubasta; }
    public List<String> getFotos() { return fotos; }
}

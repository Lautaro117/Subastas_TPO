package com.example.subastas.dto;

import java.math.BigDecimal;

public class MiProductoDTO {
    private Integer id;
    private String descripcionCatalogo;
    private String descripcionCompleta;
    private String estadoAdmin;
    private String estadoPropuesta;
    private BigDecimal precioPropuesto;

    public MiProductoDTO(Integer id, String descripcionCatalogo, String descripcionCompleta, String estadoAdmin, String estadoPropuesta, BigDecimal precioPropuesto) {
        this.id = id;
        this.descripcionCatalogo = descripcionCatalogo;
        this.descripcionCompleta = descripcionCompleta;
        this.estadoAdmin = estadoAdmin;
        this.estadoPropuesta = estadoPropuesta;
        this.precioPropuesto = precioPropuesto;
    }

    public Integer getId() { 
        return id; }
    
    public String getDescripcionCatalogo() { 
        return descripcionCatalogo; }
    
    public String getDescripcionCompleta() { 
        return descripcionCompleta; }
    
    public String getEstadoAdmin() { 
        return estadoAdmin; }
    
    public String getEstadoPropuesta() { 
        return estadoPropuesta; }
    
    public BigDecimal getPrecioPropuesto() { 
        return precioPropuesto; }
}
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
    private String motivoRechazo;
    private String etapaRechazo;
    /** Nombre del depósito asignado (presente cuando estadoAdmin es enviar_deposito o en_deposito). */
    private String nombreDeposito;
    /** Dirección del depósito asignado. */
    private String direccionDeposito;
    /**
     * Resultado de la subasta para este producto, derivado de items_catalogo.subastado:
     * "vendido_subasta" (adjudicado a un postor), "comprado_empresa" (nadie pujó y se
     * agotó el timer, la empresa lo compra), o null si todavía no se subastó / no aplica.
     */
    private String resultadoVenta;
    /** Monto de la venta: importe de la adjudicación, o precioBase si lo compró la empresa. */
    private BigDecimal montoVenta;

    public MiProductoDTO(Integer id, String descripcionCatalogo, String descripcionCompleta,
                         String estadoAdmin, String estadoPropuesta, BigDecimal precioPropuesto,
                         BigDecimal comision, LocalDate fechaSubasta, List<String> fotos,
                         String motivoRechazo, String etapaRechazo,
                         String nombreDeposito, String direccionDeposito,
                         String resultadoVenta, BigDecimal montoVenta) {
        this.id = id;
        this.descripcionCatalogo = descripcionCatalogo;
        this.descripcionCompleta = descripcionCompleta;
        this.estadoAdmin = estadoAdmin;
        this.estadoPropuesta = estadoPropuesta;
        this.precioPropuesto = precioPropuesto;
        this.comision = comision;
        this.fechaSubasta = fechaSubasta;
        this.fotos = fotos;
        this.motivoRechazo = motivoRechazo;
        this.etapaRechazo = etapaRechazo;
        this.nombreDeposito = nombreDeposito;
        this.direccionDeposito = direccionDeposito;
        this.resultadoVenta = resultadoVenta;
        this.montoVenta = montoVenta;
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
    public String getMotivoRechazo() { return motivoRechazo; }
    public String getEtapaRechazo() { return etapaRechazo; }
    public String getNombreDeposito() { return nombreDeposito; }
    public String getDireccionDeposito() { return direccionDeposito; }
    public String getResultadoVenta() { return resultadoVenta; }
    public BigDecimal getMontoVenta() { return montoVenta; }
}

package com.example.subastas.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PropuestaAdminRequest {
    private BigDecimal precioPropuesto;
    private BigDecimal comision;
    private LocalDate fechaSubasta;
    private Integer depositoId;

    public BigDecimal getPrecioPropuesto() { return precioPropuesto; }
    public void setPrecioPropuesto(BigDecimal precioPropuesto) { this.precioPropuesto = precioPropuesto; }

    public BigDecimal getComision() { return comision; }
    public void setComision(BigDecimal comision) { this.comision = comision; }

    public LocalDate getFechaSubasta() { return fechaSubasta; }
    public void setFechaSubasta(LocalDate fechaSubasta) { this.fechaSubasta = fechaSubasta; }

    public Integer getDepositoId() { return depositoId; }
    public void setDepositoId(Integer depositoId) { this.depositoId = depositoId; }
}

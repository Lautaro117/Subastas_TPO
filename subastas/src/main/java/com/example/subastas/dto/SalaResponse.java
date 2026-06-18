package com.example.subastas.dto;

import java.math.BigDecimal;
import java.util.List;

public class SalaResponse {

    private CatalogoDTO itemActual;
    private String moneda;
    private MejorOferta mejorOferta;
    private List<PujoDisplay> pujas;
    private BigDecimal minPuja;
    private BigDecimal maxPuja;

    /** Epoch millis cuando vence el timer del ítem actual (null = sin timer activo). */
    private Long tiempoLimite;

    /** Duración total de la fase activa en segundos: 300 (sin pujas) o 60 (con pujas). */
    private Integer timerTotalSegundos;

    /** Epoch millis cuando termina el cooldown entre ítems (null = sin cooldown activo). */
    private Long cooldownHasta;

    /** Próximo ítem que se activará al terminar el cooldown (null si no hay cooldown). */
    private CatalogoDTO proximoItem;

    public SalaResponse() {}

    public CatalogoDTO getItemActual() { return itemActual; }
    public void setItemActual(CatalogoDTO itemActual) { this.itemActual = itemActual; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }

    public MejorOferta getMejorOferta() { return mejorOferta; }
    public void setMejorOferta(MejorOferta mejorOferta) { this.mejorOferta = mejorOferta; }

    public List<PujoDisplay> getPujas() { return pujas; }
    public void setPujas(List<PujoDisplay> pujas) { this.pujas = pujas; }

    public BigDecimal getMinPuja() { return minPuja; }
    public void setMinPuja(BigDecimal minPuja) { this.minPuja = minPuja; }

    public BigDecimal getMaxPuja() { return maxPuja; }
    public void setMaxPuja(BigDecimal maxPuja) { this.maxPuja = maxPuja; }

    public Long getTiempoLimite() { return tiempoLimite; }
    public void setTiempoLimite(Long tiempoLimite) { this.tiempoLimite = tiempoLimite; }

    public Integer getTimerTotalSegundos() { return timerTotalSegundos; }
    public void setTimerTotalSegundos(Integer timerTotalSegundos) { this.timerTotalSegundos = timerTotalSegundos; }

    public Long getCooldownHasta() { return cooldownHasta; }
    public void setCooldownHasta(Long cooldownHasta) { this.cooldownHasta = cooldownHasta; }

    public CatalogoDTO getProximoItem() { return proximoItem; }
    public void setProximoItem(CatalogoDTO proximoItem) { this.proximoItem = proximoItem; }

    // ── Mejor oferta actual ────────────────────────────────────────────────────
    public static class MejorOferta {
        private BigDecimal importe;
        private String postor;
        private String hace;
        private String moneda;

        public MejorOferta() {}

        public BigDecimal getImporte() { return importe; }
        public void setImporte(BigDecimal importe) { this.importe = importe; }

        public String getPostor() { return postor; }
        public void setPostor(String postor) { this.postor = postor; }

        public String getHace() { return hace; }
        public void setHace(String hace) { this.hace = hace; }

        public String getMoneda() { return moneda; }
        public void setMoneda(String moneda) { this.moneda = moneda; }
    }

    // ── Fila de historial ──────────────────────────────────────────────────────
    public static class PujoDisplay {
        private BigDecimal importe;
        private String postor;
        private String hace;
        private String moneda;

        public PujoDisplay() {}

        public PujoDisplay(BigDecimal importe, String postor, String hace, String moneda) {
            this.importe = importe;
            this.postor = postor;
            this.hace = hace;
            this.moneda = moneda;
        }

        public BigDecimal getImporte() { return importe; }
        public void setImporte(BigDecimal importe) { this.importe = importe; }

        public String getPostor() { return postor; }
        public void setPostor(String postor) { this.postor = postor; }

        public String getHace() { return hace; }
        public void setHace(String hace) { this.hace = hace; }

        public String getMoneda() { return moneda; }
        public void setMoneda(String moneda) { this.moneda = moneda; }
    }
}

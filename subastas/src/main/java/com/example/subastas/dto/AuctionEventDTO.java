package com.example.subastas.dto;

import java.math.BigDecimal;

public class AuctionEventDTO {
    private String tipo; // "bid.new", "bid.confirmed", "item.next", "item.sold", "auction.closed"
    private Object payload;

    public AuctionEventDTO(String tipo, Object payload) {
        this.tipo = tipo;
        this.payload = payload;
    }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }

    // Sub-clases para Payloads específicos
    public static class BidNewPayload {
        private BigDecimal monto;
        private String moneda;
        private Long haceSegundos;
        private Boolean esPropio;

        public BidNewPayload(BigDecimal monto, String moneda, Boolean esPropio) {
            this.monto = monto;
            this.moneda = moneda;
            this.haceSegundos = 0L;
            this.esPropio = esPropio;
        }

        public BigDecimal getMonto() { return monto; }
        public String getMoneda() { return moneda; }
        public Long getHaceSegundos() { return haceSegundos; }
        public Boolean getEsPropio() { return esPropio; }
    }

    public static class BidConfirmedPayload {
        private Integer bidId;
        private String estado;

        public BidConfirmedPayload(Integer bidId, String estado) {
            this.bidId = bidId;
            this.estado = estado;
        }

        public Integer getBidId() { return bidId; }
        public String getEstado() { return estado; }
    }
}

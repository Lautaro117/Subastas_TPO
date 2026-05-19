package com.example.subastas.dto;

import java.math.BigDecimal;
import java.util.List;

public class SalaResponse {
    private CatalogoDTO articuloActual;
    private MejorOferta mejorOferta;
    private List<PujoDTO> historialReciente;
    private String websocketUrl;

    public SalaResponse() {}

    public CatalogoDTO getArticuloActual() { return articuloActual; }
    public void setArticuloActual(CatalogoDTO articuloActual) { this.articuloActual = articuloActual; }

    public MejorOferta getMejorOferta() { return mejorOferta; }
    public void setMejorOferta(MejorOferta mejorOferta) { this.mejorOferta = mejorOferta; }

    public List<PujoDTO> getHistorialReciente() { return historialReciente; }
    public void setHistorialReciente(List<PujoDTO> historialReciente) { this.historialReciente = historialReciente; }

    public String getWebsocketUrl() { return websocketUrl; }
    public void setWebsocketUrl(String websocketUrl) { this.websocketUrl = websocketUrl; }

    public static class MejorOferta {
        private BigDecimal monto;
        private String moneda;
        private Long haceSegundos;

        public MejorOferta() {}

        public BigDecimal getMonto() { return monto; }
        public void setMonto(BigDecimal monto) { this.monto = monto; }

        public String getMoneda() { return moneda; }
        public void setMoneda(String moneda) { this.moneda = moneda; }

        public Long getHaceSegundos() { return haceSegundos; }
        public void setHaceSegundos(Long haceSegundos) { this.haceSegundos = haceSegundos; }
    }

    public static class PujoDTO {
        private Integer id;
        private BigDecimal monto;
        private String timestamp;
        private String estado;

        public PujoDTO() {}

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public BigDecimal getMonto() { return monto; }
        public void setMonto(BigDecimal monto) { this.monto = monto; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }
    }
}

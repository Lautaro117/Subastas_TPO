package com.example.subastas.dto;

import java.math.BigDecimal;

public class BidRequest {
    private Integer item_id;
    private BigDecimal monto;
    private String moneda;
    private Integer payment_method_id;

    public BidRequest() {}

    public Integer getItem_id() { return item_id; }
    public void setItem_id(Integer item_id) { this.item_id = item_id; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }

    public Integer getPayment_method_id() { return payment_method_id; }
    public void setPayment_method_id(Integer payment_method_id) { this.payment_method_id = payment_method_id; }
}

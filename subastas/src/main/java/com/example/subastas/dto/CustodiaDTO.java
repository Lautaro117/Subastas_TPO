package com.example.subastas.dto;

public class CustodiaDTO {
    private String nombreDeposito;
    private String direccionDeposito;
    private String estadoCustodia;
    private String nroPoliza;
    private String companiaSeguro;

    public CustodiaDTO(String nombreDeposito, String direccionDeposito, String estadoCustodia,
                       String nroPoliza, String companiaSeguro) {
        this.nombreDeposito = nombreDeposito;
        this.direccionDeposito = direccionDeposito;
        this.estadoCustodia = estadoCustodia;
        this.nroPoliza = nroPoliza;
        this.companiaSeguro = companiaSeguro;
    }

    public String getNombreDeposito() { return nombreDeposito; }
    public String getDireccionDeposito() { return direccionDeposito; }
    public String getEstadoCustodia() { return estadoCustodia; }
    public String getNroPoliza() { return nroPoliza; }
    public String getCompaniaSeguro() { return companiaSeguro; }
}

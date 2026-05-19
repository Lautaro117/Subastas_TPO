package com.example.subastas.model;

import jakarta.persistence.*;

@Entity
@Table(name = "asistentes")
//esta clase representa a un asistente a una subasta, quien es un cliente que participa en una subasta. Contiene información sobre el número de postor, el cliente y la subasta a la que asiste.
public class Asistente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    @Column(name = "numero_postor", nullable = false)
    private Integer numeroPostor;

    @Column(name = "cliente", nullable = false)
    private Integer clienteId;

    @Column(name = "subasta", nullable = false)
    private Integer subastaId;

    public Integer getIdentificador() { return identificador; }
    public void setIdentificador(Integer identificador) { this.identificador = identificador; }

    public Integer getNumeroPostor() { return numeroPostor; }
    public void setNumeroPostor(Integer numeroPostor) { this.numeroPostor = numeroPostor; }

    public Integer getClienteId() { return clienteId; }
    public void setClienteId(Integer clienteId) { this.clienteId = clienteId; }

    public Integer getSubastaId() { return subastaId; }
    public void setSubastaId(Integer subastaId) { this.subastaId = subastaId; }
}
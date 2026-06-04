package com.example.subastas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "duenios")
public class Duenio {

    @Id
    private Integer identificador;

    @Column(name = "numero_pais")
    private Integer numeroPais;

    @Column(name = "verificacion_financiera")
    private String verificacionFinanciera;

    @Column(name = "verificacion_judicial")
    private String verificacionJudicial;

    @Column(name = "calificacion_riesgo")
    private Integer calificacionRiesgo;

    private Integer verificador;

    public Integer getIdentificador() { return identificador; }
    public void setIdentificador(Integer identificador) { this.identificador = identificador; }

    public Integer getNumeroPais() { return numeroPais; }
    public void setNumeroPais(Integer numeroPais) { this.numeroPais = numeroPais; }

    public String getVerificacionFinanciera() { return verificacionFinanciera; }
    public void setVerificacionFinanciera(String verificacionFinanciera) { this.verificacionFinanciera = verificacionFinanciera; }

    public String getVerificacionJudicial() { return verificacionJudicial; }
    public void setVerificacionJudicial(String verificacionJudicial) { this.verificacionJudicial = verificacionJudicial; }

    public Integer getCalificacionRiesgo() { return calificacionRiesgo; }
    public void setCalificacionRiesgo(Integer calificacionRiesgo) { this.calificacionRiesgo = calificacionRiesgo; }

    public Integer getVerificador() { return verificador; }
    public void setVerificador(Integer verificador) { this.verificador = verificador; }
}
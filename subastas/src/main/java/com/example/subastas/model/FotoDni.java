package com.example.subastas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "fotos_dni")
public class FotoDni {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "persona_id", nullable = false)
    private Integer personaId;

    @Column(name = "frente_dni", nullable = false)
    private byte[] frenteDni;

    @Column(name = "dorso_dni", nullable = false)
    private byte[] dorsoDni;

    
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getPersonaId() { return personaId; }
    public void setPersonaId(Integer personaId) { this.personaId = personaId; }

    public byte[] getFrenteDni() { return frenteDni; }
    public void setFrenteDni(byte[] frenteDni) { this.frenteDni = frenteDni; }

    public byte[] getDorsoDni() { return dorsoDni; }
    public void setDorsoDni(byte[] dorsoDni) { this.dorsoDni = dorsoDni; }

}
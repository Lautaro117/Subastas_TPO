package com.example.subastas.model;

import jakarta.persistence.*;

@Entity
@Table(name = "foto_dni")
public class FotoDni {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "persona_id", nullable = false)
    private Integer personaId;

    @Lob
    @Column(name = "frente_id")
    private byte[] frenteId;

    @Lob
    @Column(name = "dorso_id")
    private byte[] dorsoId;

    // Constructores
    public FotoDni() {}

    public FotoDni(Integer personaId, byte[] frenteId, byte[] dorsoId) {
        this.personaId = personaId;
        this.frenteId = frenteId;
        this.dorsoId = dorsoId;
    }

    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getPersonaId() { return personaId; }
    public void setPersonaId(Integer personaId) { this.personaId = personaId; }

    public byte[] getFrenteId() { return frenteId; }
    public void setFrenteId(byte[] frenteId) { this.frenteId = frenteId; }

    public byte[] getDorsoId() { return dorsoId; }
    public void setDorsoId(byte[] dorsoId) { this.dorsoId = dorsoId; }
}

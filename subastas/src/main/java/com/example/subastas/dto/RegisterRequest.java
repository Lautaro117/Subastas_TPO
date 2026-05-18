package com.example.subastas.dto;

import org.springframework.web.multipart.MultipartFile;

public class RegisterRequest {

    private String nombre;
    private String apellido;
    private String email;
    private String domicilio;
    private String pais_origen;
    private MultipartFile dni_frente;
    private MultipartFile dni_dorso;
    private String password;
    private String password_confirmation;

    // opcional: username si el front lo envía
    private String usuario;

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDomicilio() { return domicilio; }
    public void setDomicilio(String domicilio) { this.domicilio = domicilio; }

    public String getPais_origen() { return pais_origen; }
    public void setPais_origen(String pais_origen) { this.pais_origen = pais_origen; }

    public MultipartFile getDni_frente() { return dni_frente; }
    public void setDni_frente(MultipartFile dni_frente) { this.dni_frente = dni_frente; }

    public MultipartFile getDni_dorso() { return dni_dorso; }
    public void setDni_dorso(MultipartFile dni_dorso) { this.dni_dorso = dni_dorso; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPassword_confirmation() { return password_confirmation; }
    public void setPassword_confirmation(String password_confirmation) { this.password_confirmation = password_confirmation; }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
}


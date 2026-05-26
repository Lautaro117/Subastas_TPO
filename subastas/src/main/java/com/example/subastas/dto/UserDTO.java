package com.example.subastas.dto;
public class UserDTO {

    private String nombre;
    private String apellido;
    private String email;
    private String categoria;
    private String estado;
    private Byte [] fotoPerfil;

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Byte[] getFotoPerfil() { return fotoPerfil; }
    public void setFotoPerfil(Byte[] fotoPerfil) { this.fotoPerfil = fotoPerfil; }
}
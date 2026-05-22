package com.example.subastas.dto;

import org.springframework.web.multipart.MultipartFile;

public class RegisterRequest {

    private String nombre;
    private String apellido;
    private String email;
    private String domicilio;
    private String documento;
    private Integer numeroPais;
    private MultipartFile frenteDni;
    private MultipartFile dorsoDni;


    

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDomicilio() { return domicilio; }
    public void setDomicilio(String domicilio) { this.domicilio = domicilio; }

    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }

    public Integer getNumeroPais() { return numeroPais; }
    public void setNumeroPais(Integer numeroPais) { this.numeroPais = numeroPais; }

    public MultipartFile getFrenteDni() { return frenteDni; }
    public void setFrenteDni(MultipartFile frenteDni) { this.frenteDni = frenteDni; }

    public MultipartFile getDorsoDni() { return dorsoDni; }
    public void setDorsoDni(MultipartFile dorsoDni) { this.dorsoDni = dorsoDni; }

}


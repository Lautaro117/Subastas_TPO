package com.example.subastas.service;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public void sendTokenRegistro(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Tu código de activación — Subastas");
        message.setText(
            "Hola,\n\n" +
            "Tu solicitud de registro fue recibida. Tu código de activación es:\n\n" +
            "    " + token + "\n\n" +
            "Usá este código para finalizar el registro una vez que tu cuenta sea aprobada.\n\n" +
            "Si no realizaste este registro, ignorá este email."
        );
        mailSender.send(message);
    }

    public void sendResetCode(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Código para restablecer tu contraseña");
        message.setText(
            "Hola,\n\n" +
            "Tu código para restablecer la contraseña es:\n\n" +
            "    " + code + "\n\n" +
            "Este código es válido por 15 minutos.\n\n" +
            "Si no solicitaste este cambio, ignorá este email."
        );
        mailSender.send(message);
    }

    // Le avisa al ganador de una puja lo que tiene que abonar: lo pujado, la comisión y el total.
    // El costo de envío no se incluye porque se calcula después, cuando declara la dirección.
    public void sendGanadorPuja(String toEmail, String descripcion, BigDecimal importe, BigDecimal comision) {
        String producto = descripcion != null ? descripcion : "el producto";
        BigDecimal importeVal = importe != null ? importe : BigDecimal.ZERO;
        BigDecimal comisionVal = comision != null ? comision : BigDecimal.ZERO;
        BigDecimal total = importeVal.add(comisionVal);

        StringBuilder texto = new StringBuilder();
        texto.append("Hola,\n\n");
        texto.append("¡Felicitaciones! Ganaste la subasta de \"").append(producto).append("\".\n\n");
        texto.append("Esto es lo que tenés que abonar:\n");
        texto.append("    Monto pujado: $").append(importeVal.toPlainString()).append("\n");
        texto.append("    Comisión: $").append(comisionVal.toPlainString()).append("\n");
        texto.append("    Total a pagar: $").append(total.toPlainString()).append("\n\n");
        texto.append("El costo de envío se calcula aparte, cuando confirmes la entrega e indiques la dirección.\n\n");
        texto.append("Ingresá a la app para completar el pago.");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Ganaste la subasta — detalle de pago");
        message.setText(texto.toString());
        mailSender.send(message);
    }
}

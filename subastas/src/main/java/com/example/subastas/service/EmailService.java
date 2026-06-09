package com.example.subastas.service;

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
}

package com.example.subastas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.subastas.model.Notificacion;
import com.example.subastas.security.JwtUtil;
import com.example.subastas.service.NotificacionService;

@RestController
@RequestMapping("/api/notifications")
public class NotificacionController {

    @Autowired
    private NotificacionService notificacionService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<Notificacion>> listar(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(notificacionService.listar(email));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Integer> marcarTodasLeidas(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        int count = notificacionService.marcarTodasLeidas(email);
        return ResponseEntity.ok(count);
    }


   @PatchMapping("/{id}/read")
    public ResponseEntity<Notificacion> marcarLeida(@PathVariable Integer id,
                                                   @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        Notificacion notificacion = notificacionService.marcarLeida(id, email);
        return ResponseEntity.ok(notificacion);
    }


}

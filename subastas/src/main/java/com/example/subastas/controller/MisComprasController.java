package com.example.subastas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.subastas.dto.MisComprasDTO;
import com.example.subastas.security.JwtUtil;
import com.example.subastas.service.MisComprasService;

@RestController
@RequestMapping("/api/my-purchases")
public class MisComprasController {

    @Autowired
    private MisComprasService misComprasService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<MisComprasDTO>> getMisCompras(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(misComprasService.getMisCompras(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MisComprasDTO> getDetalle(@PathVariable Integer id,
                                                   @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(misComprasService.getDetalle(email, id));
    }

    @PostMapping("/{id}/delivery")
    public ResponseEntity<Void> setDireccion(@PathVariable Integer id,
                                          @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        misComprasService.setDireccionEnvio(email, id);
    return ResponseEntity.ok().build();
    }
}
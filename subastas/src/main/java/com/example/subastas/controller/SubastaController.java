package com.example.subastas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.subastas.dto.CatalogoDTO;
import com.example.subastas.model.Subasta;
import com.example.subastas.security.JwtUtil;
import com.example.subastas.service.SubastaService;

@RestController
@RequestMapping("/api/auctions")
public class SubastaController {

    @Autowired
    private SubastaService subastaService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<Subasta>> listarSubastas(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String categoria = jwtUtil.extractCategoria(token);
        List<Subasta> subastas = subastaService.listarPorCategoria(categoria);
        return ResponseEntity.ok(subastas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subasta> detalle(@PathVariable Integer id) {
        return ResponseEntity.ok(subastaService.buscarPorId(id));
    }

    @GetMapping("/{id}/catalog")
    public ResponseEntity<List<CatalogoDTO>> catalogo(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String estado = jwtUtil.extractEstado(token);
        List<CatalogoDTO> items = subastaService.obtenerCatalogo(id, estado);
        return ResponseEntity.ok(items);
    }
}
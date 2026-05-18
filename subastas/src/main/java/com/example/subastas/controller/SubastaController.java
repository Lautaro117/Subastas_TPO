package com.example.subastas.controller;

import com.example.subastas.dto.BidRequest;
import com.example.subastas.dto.CatalogoDTO;
import com.example.subastas.dto.SalaResponse;
import com.example.subastas.model.Pujo;
import com.example.subastas.model.Subasta;
import com.example.subastas.security.JwtUtil;
import com.example.subastas.service.SubastaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping("/{id}/join")
    public ResponseEntity<SalaResponse> join(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        SalaResponse response = subastaService.unirseASala(id, email);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leave(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        subastaService.salirDeSala(id, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/bids")
    public ResponseEntity<Pujo> bids(
            @PathVariable Integer id,
            @RequestBody BidRequest request,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        Pujo pujo = subastaService.enviarPuja(id, email, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(pujo);
    }
}
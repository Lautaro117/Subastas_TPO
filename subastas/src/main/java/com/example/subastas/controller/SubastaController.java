package com.example.subastas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.subastas.dto.BidRequest;
import com.example.subastas.dto.CatalogoDTO;
import com.example.subastas.dto.ProductoDetalleDTO;
import com.example.subastas.dto.ResultadoItemDTO;
import com.example.subastas.dto.SalaResponse;
import com.example.subastas.model.Pujo;
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

    @GetMapping("/{id}/catalog/{itemId}")
    public ResponseEntity<CatalogoDTO> detalleItem(
            @PathVariable Integer id,
            @PathVariable Integer itemId,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String estado = jwtUtil.extractEstado(token);
        CatalogoDTO item = subastaService.obtenerItem(id, itemId, estado);
        return ResponseEntity.ok(item);
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

    @GetMapping("/{id}/items/{itemId}/bids")
    public ResponseEntity<List<Pujo>> obtenerpujas(
            @PathVariable Integer id,
            @PathVariable Integer itemId,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        List<Pujo> pujas = subastaService.obtenerPujaPorItem(id, itemId);
        return ResponseEntity.ok(pujas);
    }

    @GetMapping("/{id}/items/{itemId}/result")
    public ResponseEntity<ResultadoItemDTO> resultado(
        @PathVariable  Integer id,
        @PathVariable Integer itemId,
        @RequestHeader("Authorization") String authHeader){
            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);
            ResultadoItemDTO resultado = subastaService.obtenerResultadoItem(id, itemId, email);
            return ResponseEntity.ok(resultado);
        }
    
    

    @GetMapping("/{id}/live")
    public ResponseEntity<SalaResponse> getLive(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        SalaResponse response = subastaService.obtenerEstadoVivo(id, email);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/{id}/catalog/{itemId}/product")
    public ResponseEntity<ProductoDetalleDTO> detalleProducto(
            @PathVariable Integer id,
            @PathVariable Integer itemId,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String estado = jwtUtil.extractEstado(token);
        ProductoDetalleDTO dto = subastaService.obtenerDetalleProducto(id, itemId, estado);
        return ResponseEntity.ok(dto);
    }
}
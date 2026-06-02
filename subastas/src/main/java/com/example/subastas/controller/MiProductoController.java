package com.example.subastas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.subastas.dto.CustodiaDTO;
import com.example.subastas.dto.MiProductoDTO;
import com.example.subastas.model.Producto;
import com.example.subastas.security.JwtUtil;
import com.example.subastas.service.MiProductoService;

@RestController
@RequestMapping("/api/my-items")
public class MiProductoController {

    @Autowired
    private MiProductoService miProductoService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<MiProductoDTO>> getMisProductos(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(miProductoService.getMisProductos(email));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Producto> agregarProducto(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("descripcionCatalogo") String descripcionCatalogo,
            @RequestParam("descripcionCompleta") String descripcionCompleta,
            @RequestParam("fotos") List<MultipartFile> fotos) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(miProductoService.agregarProducto(email, descripcionCatalogo, descripcionCompleta, fotos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MiProductoDTO> getDetalle(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(miProductoService.getDetalle(email, id));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<Void> aceptarPropuesta(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer id) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        miProductoService.aceptarPropuesta(email, id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> rechazarPropuesta(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer id) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        miProductoService.rechazarPropuesta(email, id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/custody")
    public ResponseEntity<CustodiaDTO> getCustodia(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(miProductoService.getCustodia(email, id));
    }
}
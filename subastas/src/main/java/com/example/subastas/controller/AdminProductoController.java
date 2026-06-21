package com.example.subastas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.subastas.dto.PropuestaAdminRequest;
import com.example.subastas.service.MiProductoService;

@RestController
@RequestMapping("/api/admin")
public class AdminProductoController {

    @Autowired
    private MiProductoService miProductoService;

    /**
     * POST /api/admin/products/{id}/proposal
     * El admin envía una propuesta al dueño del producto incluyendo precio base,
     * comisión, fecha tentativa de subasta y el depósito al que debe enviarlo.
     */
    @PostMapping("/products/{id}/proposal")
    public ResponseEntity<Void> enviarPropuesta(
            @PathVariable Integer id,
            @RequestBody PropuestaAdminRequest body) {
        miProductoService.enviarPropuestaAdmin(id, body);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/admin/products/{id}/send-to-deposit
     * El admin asigna un depósito y mueve el producto al estado "enviar_deposito".
     * Body: { "depositoId": 1 }
     */
    @PostMapping("/products/{id}/send-to-deposit")
    public ResponseEntity<Void> enviarADeposito(
            @PathVariable Integer id,
            @RequestBody java.util.Map<String, Integer> body) {
        Integer depositoId = body.get("depositoId");
        miProductoService.asignarDepositoYEnviar(id, depositoId);
        return ResponseEntity.ok().build();
    }

}

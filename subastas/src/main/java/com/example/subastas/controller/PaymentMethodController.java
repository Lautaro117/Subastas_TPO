package com.example.subastas.controller;

import com.example.subastas.dto.PaymentMethodDTO;
import com.example.subastas.model.MedioPago;
import com.example.subastas.security.JwtUtil;
import com.example.subastas.service.PaymentMethodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {

    @Autowired
    private PaymentMethodService paymentMethodService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<MedioPago>> listar(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(paymentMethodService.listarMedios(email));
    }

    @PostMapping("/bank-account")
    public ResponseEntity<MedioPago> addBank(@RequestBody PaymentMethodDTO dto, 
                                             @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentMethodService.registrarCuentaBancaria(dto, email));
    }

    @PostMapping("/credit-card")
    public ResponseEntity<MedioPago> addCard(@RequestBody PaymentMethodDTO dto, 
                                             @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentMethodService.registrarTarjeta(dto, email));
    }

    @PostMapping("/certified-check")
    public ResponseEntity<MedioPago> addCheck(@RequestBody PaymentMethodDTO dto, 
                                              @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentMethodService.registrarCheque(dto, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id,
                                     @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        paymentMethodService.eliminar(id, email);
        return ResponseEntity.noContent().build();
}


}

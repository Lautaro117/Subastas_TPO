package com.example.subastas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.subastas.dto.PaymentMethodDTO;
import com.example.subastas.model.MedioPago;
import com.example.subastas.security.JwtUtil;
import com.example.subastas.service.PaymentMethodService;

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

    @PutMapping("/payout-account/{id}")
    public ResponseEntity<Void> setPayoutAccount(@PathVariable Integer id,
                                              @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        paymentMethodService.setPayoutAccount(id, email);
        return ResponseEntity.ok().build();
}


}

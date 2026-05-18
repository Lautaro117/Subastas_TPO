package com.example.subastas.controller;

import com.example.subastas.model.MedioPago;
import com.example.subastas.model.Subasta;
import com.example.subastas.model.UsuarioAuth;
import com.example.subastas.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // --- Usuarios ---

    @GetMapping("/users")
    public ResponseEntity<List<UsuarioAuth>> getUsers() {
        return ResponseEntity.ok(adminService.listarUsuarios());
    }

    @PutMapping("/users/{id}/estado")
    public ResponseEntity<UsuarioAuth> updateStatus(@PathVariable Integer id, @RequestParam String estado) {
        return ResponseEntity.ok(adminService.actualizarEstadoUsuario(id, estado));
    }

    // --- Medios de Pago ---

    @GetMapping("/payment-methods/pending")
    public ResponseEntity<List<MedioPago>> getPendingPayments() {
        return ResponseEntity.ok(adminService.listarMediosPendientes());
    }

    @PutMapping("/payment-methods/{id}/verify")
    public ResponseEntity<MedioPago> verifyPayment(@PathVariable Integer id) {
        return ResponseEntity.ok(adminService.verificarMedioPago(id));
    }

    // --- Subastas ---

    @PostMapping("/auctions")
    public ResponseEntity<Subasta> createAuction(@RequestBody Subasta subasta) {
        return ResponseEntity.ok(adminService.crearSubasta(subasta));
    }

    @PutMapping("/auctions/{id}/estado")
    public ResponseEntity<Subasta> updateAuctionStatus(@PathVariable Integer id, @RequestParam String estado) {
        return ResponseEntity.ok(adminService.cambiarEstadoSubasta(id, estado));
    }
}

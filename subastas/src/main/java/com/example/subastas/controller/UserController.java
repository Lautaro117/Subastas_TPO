package com.example.subastas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.subastas.dto.HistorialPujasDTO;
import com.example.subastas.dto.UserDTO;
import com.example.subastas.model.Pujo;
import com.example.subastas.security.JwtUtil;
import com.example.subastas.service.UserService;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/penalty")
    public ResponseEntity<Object> getPenalty() {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/auction-history")
    public ResponseEntity<List<HistorialPujasDTO>> getAuctionHistory(
            @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(userService.obtenerHistorial(email));
    }

    @GetMapping("/auction-history/{id}/bids")
    public ResponseEntity<List<Pujo>> getBidsByAuction(
            @PathVariable Integer id,
            @RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(userService.obtenerPujasPorSubasta(email, id));
    }

    @GetMapping
    public ResponseEntity<UserDTO> getMyProfile(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);
        return ResponseEntity.ok(userService.getMyProfile(email));
        
    }

    @PutMapping
    public ResponseEntity<UserDTO> updateMyProfile(
        @RequestHeader("Authorization") String authHeader,
        @RequestBody UserDTO datos) {
        var email = jwtUtil.extractEmail(authHeader.substring(7));
        return ResponseEntity.ok(userService.updateMyProfile(email, datos));
}


}
package com.example.subastas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.subastas.dto.AuthStatusResponse;
import com.example.subastas.dto.LoginRequest;
import com.example.subastas.dto.LoginResponse;
import com.example.subastas.dto.RegisterCountryDTO;
import com.example.subastas.dto.RegisterRequest;
import com.example.subastas.dto.RegisterRequestComplete;
import com.example.subastas.dto.RegisterResponse;
import com.example.subastas.dto.ResetRequestDTO;
import com.example.subastas.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@ModelAttribute RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/countries")
    public ResponseEntity<List<RegisterCountryDTO>> getRegisterCountries() {
        List<RegisterCountryDTO> countries = authService.getRegisterCountries();
        return ResponseEntity.ok(countries);
    }

    @GetMapping("/status/{solicitudId}")
    public ResponseEntity<AuthStatusResponse> getRegisterStatus(@PathVariable Integer solicitudId) {
        AuthStatusResponse response = authService.getRegisterStatus(solicitudId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register-complete")
    public ResponseEntity<Void> registerComplete(@RequestBody RegisterRequestComplete request) {
        authService.registerComplete(request, false);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password/reset-request")
    public ResponseEntity<String> resetRequest(@RequestBody ResetRequestDTO request) {
        String token = authService.resetRequest(request.getEmail());
        return ResponseEntity.ok(token != null ? token : "");
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@RequestBody RegisterRequestComplete request) {
        authService.registerComplete(request, true);
        return ResponseEntity.noContent().build();
    }

}


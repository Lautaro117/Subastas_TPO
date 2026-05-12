package com.example.subastas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.LoginRequest;
import com.example.subastas.dto.LoginResponse;
import com.example.subastas.model.Cliente;
import com.example.subastas.model.UsuarioAuth;
import com.example.subastas.repository.ClienteRepository;
import com.example.subastas.repository.NotificacionRepository;
import com.example.subastas.repository.UsuarioAuthRepository;
import com.example.subastas.security.JwtUtil;

@Service
public class AuthService {

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        UsuarioAuth usuario = usuarioAuthRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Credenciales incorrectas"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas");
        }

        Cliente cliente = clienteRepository.findById(usuario.getClienteId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Cliente no encontrado"));

        if ("no".equals(cliente.getAdmitido())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cuenta bloqueada");
        }

        String token = jwtUtil.generateToken(
                usuario.getEmail(),
                usuario.getEstado(),
                cliente.getCategoria()
        );

        int pendientes = notificacionRepository
                .findByClienteIdAndLeidaFalseOrderByCreatedAtDesc(usuario.getClienteId())
                .size();

        return new LoginResponse(token, usuario.getEmail(), usuario.getEstado(), cliente.getCategoria(), pendientes);
    }
}
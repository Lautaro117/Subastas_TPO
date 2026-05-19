package com.example.subastas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import com.example.subastas.dto.LoginRequest;
import com.example.subastas.dto.LoginResponse;
import com.example.subastas.dto.RegisterRequest;
import com.example.subastas.dto.RegisterResponse;
import com.example.subastas.model.Cliente;
import com.example.subastas.model.FotoDni;
import com.example.subastas.model.Persona;
import com.example.subastas.model.UsuarioAuth;
import com.example.subastas.repository.ClienteRepository;
import com.example.subastas.repository.FotoDniRepository;
import com.example.subastas.repository.NotificacionRepository;
import com.example.subastas.repository.PersonaRepository;
import com.example.subastas.repository.UsuarioAuthRepository;
import com.example.subastas.security.JwtUtil;

@Service
public class AuthService {

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PersonaRepository personaRepository;

    @Autowired
    private FotoDniRepository fotoDniRepository;

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

    // B1 — POST /api/auth/register
    public RegisterResponse register(RegisterRequest request) {
        // Validaciones mínimas
        if (request == null || isBlank(request.getEmail()) || isBlank(request.getPassword())
                || request.getDni_frente() == null || request.getDni_dorso() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos faltantes");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (usuarioAuthRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El email ya está registrado");
        }

        // Contrato: 413 si imagen muy grande (5MB)
        validarTamanio(request.getDni_frente(), 5 * 1024 * 1024);
        validarTamanio(request.getDni_dorso(), 5 * 1024 * 1024);

        // Contrato: 422 formato inválido
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Formato de email inválido");
        }

        if (isBlank(request.getNombre()) || isBlank(request.getApellido())
                || isBlank(request.getDomicilio()) || isBlank(request.getPais_origen())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos faltantes");
        }

        // Contrato: password regex (mín. 8 chars, 1 mayúscula, 1 número)
        if (!validarPassword(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "La contraseña no cumple los requisitos mínimos");
        }
        
        if (request.getPassword_confirmation() != null && !request.getPassword().equals(request.getPassword_confirmation())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "La confirmación de contraseña no coincide");
        }

        try {
            // Guardamos Persona (sin fotos de DNI)
            Persona persona = new Persona();
            persona.setDocumento("PEND-" + System.currentTimeMillis()); 
            persona.setNombre(request.getNombre().trim() + " " + request.getApellido().trim());
            persona.setDireccion(request.getDomicilio().trim());
            persona.setEstado("pendiente");
            // No seteamos persona.setFoto() aquí, es para perfil

            Persona savedPersona = personaRepository.save(persona);

            // Guardamos las fotos del DNI en la tabla dedicada
            FotoDni fotoDni = new FotoDni(
                savedPersona.getIdentificador(),
                request.getDni_frente().getBytes(),
                request.getDni_dorso().getBytes()
            );
            fotoDniRepository.save(fotoDni);

            // Guardamos Cliente (estado pendiente de verificación)
            Cliente cliente = new Cliente();
            cliente.setIdentificador(savedPersona.getIdentificador());
            cliente.setPersona(savedPersona);
            cliente.setNumeroPais(parsePais(request.getPais_origen()));
            cliente.setAdmitido("no");
            cliente.setCategoria("comun"); // Valor inicial por defecto
            cliente.setVerificador(1); // Verificador por defecto (ej. Admin)
            clienteRepository.save(cliente);

            // Guardamos UsuarioAuth en estado E1
            UsuarioAuth auth = new UsuarioAuth();
            auth.setEmail(email);
            auth.setClienteId(cliente.getIdentificador());
            auth.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            auth.setEstado("E1");
            usuarioAuthRepository.save(auth);

            return new RegisterResponse(savedPersona.getIdentificador(), "pendiente");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Error al procesar el registro");
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private void validarTamanio(MultipartFile f, long maxBytes) {
        if (f == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Faltan archivos");
        }
        if (f.getSize() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Imagen supera el tamaño máximo");
        }
    }

    private boolean validarPassword(String password) {
        // Mínimo 8 caracteres, 1 mayúscula, 1 número
        return password != null && password.length() >= 8 && 
               password.matches(".*[A-Z].*") && 
               password.matches(".*[0-9].*");
    }

    private Integer parsePais(String paisOr) {
        if (paisOr == null) return null;
        try {
            return Integer.parseInt(paisOr.trim());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "pais_origen inválido (debe ser numérico)");
        }
    }
}


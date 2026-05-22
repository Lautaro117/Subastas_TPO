package com.example.subastas.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.LoginRequest;
import com.example.subastas.dto.LoginResponse;
import com.example.subastas.dto.AuthStatusResponse;
import com.example.subastas.dto.RegisterRequest;
import com.example.subastas.dto.RegisterRequestComplete;
import com.example.subastas.dto.RegisterResponse;
import com.example.subastas.model.Cliente;
import com.example.subastas.model.FotoDni;
import com.example.subastas.model.Persona;
import com.example.subastas.model.UsuarioAuth;
import com.example.subastas.repository.ClienteRepository;
import com.example.subastas.repository.Foto_dniRepository;
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
    private Foto_dniRepository fotoDniRepository;

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

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

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        // Validar email
        if (request == null || isBlank(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos faltantes");
        }

        String email = request.getEmail().trim().toLowerCase();

        // 409 — email duplicado
        if (usuarioAuthRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El email ya está registrado");
        }

        // 422 — formato de email inválido
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Formato de email inválido");
        }

        // 400 — campos obligatorios faltantes
        if (isBlank(request.getNombre()) || isBlank(request.getApellido())
                || isBlank(request.getDomicilio()) || request.getNumeroPais() == null
                || request.getFrenteDni() == null || request.getDorsoDni() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos faltantes");
        }

        // 400 — numeroPais inexistente
        if (!existsPais(request.getNumeroPais())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo de pais no existe en la base de datos"
            );
        }

        // 503 — no hay verificador configurable para nuevas altas
        Integer verificadorId = 1;
        if (!existsEmpleado(verificadorId)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "No hay verificador disponible para procesar nuevos registros"
            );
        }

        // 413 — imagen muy grande (máx 5MB)
        validarTamanio(request.getFrenteDni(), 5 * 1024 * 1024);
        validarTamanio(request.getDorsoDni(), 5 * 1024 * 1024);

        try {
            // 1. INSERT en personas
            Persona persona = new Persona();
            persona.setDocumento("PEND-" + System.currentTimeMillis());
            persona.setNombre(request.getNombre().trim() + " " + request.getApellido().trim());
            persona.setDireccion(request.getDomicilio().trim());
            persona.setEstado("inactivo");
            Persona savedPersona = personaRepository.save(persona);

            // 2. INSERT en clientes
            Cliente cliente = new Cliente();
            cliente.setPersona(savedPersona);
            cliente.setNumeroPais(request.getNumeroPais());
            cliente.setAdmitido("no");
            cliente.setCategoria("comun");
            cliente.setVerificador(verificadorId);
            clienteRepository.save(cliente);

            // 3. INSERT en usuarios_auth (sin password, con token UUID)
            UsuarioAuth auth = new UsuarioAuth();
            auth.setEmail(email);
            auth.setApellido(request.getApellido().trim());
            auth.setClienteId(savedPersona.getIdentificador());
            auth.setEstado("E1");
            auth.setPasswordHash("PENDIENTE");
            auth.setTokenRegistro(UUID.randomUUID().toString());
            usuarioAuthRepository.save(auth);

            // 4. INSERT en fotos_dni
            FotoDni fotos = new FotoDni();
            fotos.setPersonaId(savedPersona.getIdentificador());
            fotos.setFrenteDni(request.getFrenteDni().getBytes());
            fotos.setDorsoDni(request.getDorsoDni().getBytes());
            fotoDniRepository.save(fotos);

            return new RegisterResponse(savedPersona.getIdentificador(), "pendiente");

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            String detail = e.getMessage() != null ? e.getMessage() : "Error desconocido";
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Error al procesar el registro: " + detail
            );
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private void validarTamanio(org.springframework.web.multipart.MultipartFile f, long maxBytes) {
        if (f.getSize() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Imagen supera el tamaño máximo permitido (5MB)");
        }
    }

    private boolean existsPais(Integer numeroPais) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM paises WHERE numero = ?",
                Integer.class,
                numeroPais
        );

        return count != null && count > 0;
    }

    private boolean existsEmpleado(Integer empleadoId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM empleados WHERE identificador = ?",
                Integer.class,
                empleadoId
        );

        return count != null && count > 0;
    }

    private boolean validarPassword(String password) {
        return password != null && password.length() >= 8 &&
            password.matches(".*[A-Z].*") &&
            password.matches(".*[0-9].*");
    }

    public String resetRequest(String email) {
        Optional<UsuarioAuth> usuario = usuarioAuthRepository.findByEmail(email);
        
        if (usuario.isPresent()) {
            String token = UUID.randomUUID().toString();
            usuario.get().setTokenRegistro(token);
            usuarioAuthRepository.save(usuario.get());
            return token;
        }
        
        return null; // Si no hay mail vuelve vacio, por seguridad no se muestra ningun mensaje 
}

    public AuthStatusResponse getRegisterStatus(Integer solicitudId) {
        if (solicitudId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solicitud invalida");
        }

        Cliente cliente = clienteRepository.findById(solicitudId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));

        UsuarioAuth usuario = usuarioAuthRepository.findByClienteId(solicitudId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        return new AuthStatusResponse(
                solicitudId,
                usuario.getEmail(),
                usuario.getEstado(),
                cliente.getAdmitido()
        );
    }

    @Transactional
    public void registerComplete(RegisterRequestComplete request, boolean esReset) {

        // 400 — campos faltantes
        if (request == null || isBlank(request.getToken()) || isBlank(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos faltantes");
        }

        // 401 — token inválido
        UsuarioAuth usuario = usuarioAuthRepository.findByTokenRegistro(request.getToken())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Token inválido"));

        // 422 — password no cumple requisitos
        if (!validarPassword(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 número");
        }

        // Actualizar password, estado y limpiar token
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        if (!esReset) {
            usuario.setEstado("E2");}
        usuario.setTokenRegistro(null);
        usuarioAuthRepository.save(usuario);
    }

}
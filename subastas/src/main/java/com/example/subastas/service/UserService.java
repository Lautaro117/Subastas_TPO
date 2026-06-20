package com.example.subastas.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.HistorialPujasDTO;
import com.example.subastas.dto.UserDTO;
import com.example.subastas.dto.UserStatsDTO;
import com.example.subastas.model.Adjudicaciones;
import com.example.subastas.model.Asistente;
import com.example.subastas.model.Cliente;
import com.example.subastas.model.MedioPago;
import com.example.subastas.model.Multas;
import com.example.subastas.model.Persona;
import com.example.subastas.model.Pujo;
import com.example.subastas.model.UsuarioAuth;
import com.example.subastas.repository.AdjudicacionesRepository;
import com.example.subastas.repository.AsistenteRepository;
import com.example.subastas.repository.ClienteRepository;
import com.example.subastas.repository.MedioPagoRepository;
import com.example.subastas.repository.MultasRepository;
import com.example.subastas.repository.PersonaRepository;
import com.example.subastas.repository.ProductoRepository;
import com.example.subastas.repository.PujoRepository;
import com.example.subastas.repository.SubastaRepository;
import com.example.subastas.repository.UsuarioAuthRepository;

@Service
public class UserService {

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    @Autowired
    private AsistenteRepository asistenteRepository;

    @Autowired
    private SubastaRepository subastaRepository;

    @Autowired
    private PujoRepository pujoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PersonaRepository personaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private MedioPagoRepository medioPagoRepository;

    @Autowired
    private AdjudicacionesRepository adjudicacionesRepository;

    @Autowired
    private MultasRepository multasRepository;

    @Autowired
    private PaymentMethodService paymentMethodService;

    public List<HistorialPujasDTO> obtenerHistorial(String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        List<Asistente> asistentes = asistenteRepository.findAllByClienteId(usuario.getClienteId());

        return asistentes.stream().map(asistente -> {
            var subasta = subastaRepository.findById(asistente.getSubastaId())
                    .orElse(null);

            if (subasta == null) return null;

            var ultimaPuja = pujoRepository
                    .findTopByAsistenteIdOrderByImporteDesc(asistente.getIdentificador())
                    .map(p -> p.getImporte())
                    .orElse(null);

            return new HistorialPujasDTO(
                    subasta.getIdentificador(),
                    subasta.getFecha() != null ? subasta.getFecha().toString() : null,
                    subasta.getUbicacion(),
                    subasta.getCategoria(),
                    subasta.getEstado(),
                    ultimaPuja
            );
        }).filter(dto -> dto != null).collect(Collectors.toList());
    }

    public List<Pujo> obtenerPujasPorSubasta(String email, Integer subastaId) {

    var usuario = usuarioAuthRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

    Asistente asistente = asistenteRepository
            .findByClienteIdAndSubastaId(usuario.getClienteId(), subastaId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "No participaste en esta subasta"));

    return pujoRepository.findByAsistenteId(asistente.getIdentificador());
    }

    public UserDTO getMyProfile(String email) {
    UsuarioAuth auth = usuarioAuthRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    Cliente cliente = clienteRepository.findById(auth.getClienteId())
        .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

    Persona persona = cliente.getPersona();

    UserDTO dto = new UserDTO();
    dto.setNombre(persona.getNombre());
    dto.setApellido(auth.getApellido());
    dto.setEmail(auth.getEmail());
    dto.setCategoria(cliente.getCategoria());
    dto.setEstado(auth.getEstado());

    if (persona.getFoto() != null) {
        byte[] raw = persona.getFoto();
        Byte[] boxed = new Byte[raw.length];
        for (int i = 0; i < raw.length; i++) boxed[i] = raw[i];
        dto.setFotoPerfil(boxed);
    }

    return dto;
    }
    
    public UserDTO updateMyProfile(String emailActual, UserDTO datos) {
        UsuarioAuth auth = usuarioAuthRepository.findByEmail(emailActual)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (datos.getEmail() != null && !datos.getEmail().equals(emailActual)) {
                if (usuarioAuthRepository.existsByEmail(datos.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El email ya está en uso");
                }
                auth.setEmail(datos.getEmail());
        }

        if (datos.getApellido() != null) auth.setApellido(datos.getApellido());
        usuarioAuthRepository.save(auth);

        Cliente cliente = clienteRepository.findById(auth.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Persona persona = cliente.getPersona();

        if (datos.getNombre() != null) persona.setNombre(datos.getNombre());
        if (datos.getFotoPerfil() != null) {
                byte[] raw = new byte[datos.getFotoPerfil().length];
                for (int i = 0; i < raw.length; i++) raw[i] = datos.getFotoPerfil()[i];
                persona.setFoto(raw);
        }
        personaRepository.save(persona);

        return getMyProfile(auth.getEmail());
        }

    public UserStatsDTO getMyStats(String email) {
        UsuarioAuth auth = usuarioAuthRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        Integer clienteId = auth.getClienteId();

        Cliente cliente = clienteRepository.findById(clienteId)
        .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        int subastasParticipadas = asistenteRepository.findAllByClienteId(clienteId).size();

        int pujasRealizadas = asistenteRepository.findAllByClienteId(clienteId).stream()
        .mapToInt(a -> pujoRepository.findByAsistenteId(a.getIdentificador()).size())
        .sum();

        int productosPublicados = productoRepository.findByDuenio(clienteId).size();

        List<Asistente> todosAsistentes = asistenteRepository.findAllByClienteId(clienteId);

        int articulosGanados = todosAsistentes.stream()
        .mapToInt(a -> adjudicacionesRepository.countByAsistenteId(a.getIdentificador()))
        .sum();

        BigDecimal importeTotalOfertado = todosAsistentes.stream()
        .flatMap(a -> pujoRepository.findByAsistenteId(a.getIdentificador()).stream())
        .map(Pujo::getImporte)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal importeTotalPagado = todosAsistentes.stream()
        .flatMap(a -> adjudicacionesRepository.findAllByAsistenteId(a.getIdentificador()).stream())
        .map(Adjudicaciones::getImporte)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<MedioPago> medios = medioPagoRepository.findByClienteId(clienteId).stream()
        .filter(m -> Boolean.TRUE.equals(m.getVerificado()))
        .collect(Collectors.toList());

        return new UserStatsDTO(subastasParticipadas, pujasRealizadas, productosPublicados,
                articulosGanados, importeTotalOfertado, importeTotalPagado,
                cliente.getCategoria(), medios);
        }

        public Multas getMultaActiva(String email) {
    UsuarioAuth auth = usuarioAuthRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

    return multasRepository.findByClienteIdAndEstado(auth.getClienteId(), "pendiente")
        .stream().findFirst().orElse(null);
}

public void pagarMulta(String email, Integer multaId, Integer medioPagoId) {
    UsuarioAuth auth = usuarioAuthRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

    Multas multa = multasRepository.findById(multaId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Multa no encontrada"));

    if (!multa.getClienteId().equals(auth.getClienteId())) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    if (!"pendiente".equals(multa.getEstado())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta multa ya fue procesada");
    }

    // Mismo criterio que para pujar: el medio tiene que ser propio, estar verificado, y
    // tener fondos suficientes (descontando lo que ya tenga reservado por otras compras
    // ganadas) para cubrir el importe de la multa.
    if (medioPagoId == null) {
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Debés seleccionar un medio de pago.");
    }
    MedioPago medio = medioPagoRepository.findById(medioPagoId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medio de pago no encontrado"));
    if (!medio.getClienteId().equals(auth.getClienteId())) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ese medio de pago no es tuyo");
    }
    if (!Boolean.TRUE.equals(medio.getVerificado())) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El medio de pago no está verificado");
    }
    BigDecimal disponible = paymentMethodService.fondosDisponibles(medio);
    if (disponible != null && multa.getImporte().compareTo(disponible) > 0) {
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Con el medio de pago seleccionado no tenés los fondos necesarios para abonar la multa.");
    }

    multa.setEstado("pagada");
    multasRepository.save(multa);

    // Si no le queda ninguna otra multa pendiente, vuelve a poder participar (E5 → E4).
    // Si todavía tiene otra multa pendiente, se queda en E5 hasta saldarlas todas.
    boolean tieneOtrasPendientes = !multasRepository
        .findByClienteIdAndEstado(auth.getClienteId(), "pendiente").isEmpty();
    if (!tieneOtrasPendientes && "E5".equals(auth.getEstado())) {
        auth.setEstado("E4");
        usuarioAuthRepository.save(auth);
    }
}

}
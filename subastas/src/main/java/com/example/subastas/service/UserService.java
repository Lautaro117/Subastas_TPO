package com.example.subastas.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.HistorialPujasDTO;
import com.example.subastas.dto.UserDTO;
import com.example.subastas.model.Asistente;
import com.example.subastas.model.Cliente;
import com.example.subastas.model.Persona;
import com.example.subastas.model.Pujo;
import com.example.subastas.model.UsuarioAuth;
import com.example.subastas.repository.AsistenteRepository;
import com.example.subastas.repository.ClienteRepository;
import com.example.subastas.repository.PersonaRepository;
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

}
package com.example.subastas.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.HistorialPujasDTO;
import com.example.subastas.model.Asistente;
import com.example.subastas.model.Pujo;
import com.example.subastas.repository.AsistenteRepository;
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
}
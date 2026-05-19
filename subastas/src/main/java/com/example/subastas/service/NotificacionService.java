package com.example.subastas.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.model.Notificacion;
import com.example.subastas.repository.NotificacionRepository;
import com.example.subastas.repository.UsuarioAuthRepository;

@Service
public class NotificacionService {

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    public List<Notificacion> listar(String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return notificacionRepository.findByClienteIdOrderByCreatedAtDesc(usuario.getClienteId());
    }

    public Notificacion marcarLeida(Integer id, String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificación no encontrada"));

        if (!notificacion.getClienteId().equals(usuario.getClienteId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        notificacion.setLeida(true);
        return notificacionRepository.save(notificacion);
    }

    public int marcarTodasLeidas(String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        List<Notificacion> pendientes = notificacionRepository
                .findByClienteIdAndLeidaFalseOrderByCreatedAtDesc(usuario.getClienteId());

        pendientes.forEach(n -> n.setLeida(true));
        notificacionRepository.saveAll(pendientes);

        return pendientes.size();
    }
}
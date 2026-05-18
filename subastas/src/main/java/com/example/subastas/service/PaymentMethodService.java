package com.example.subastas.service;

import com.example.subastas.dto.PaymentMethodDTO;
import com.example.subastas.model.*;
import com.example.subastas.repository.MedioPagoRepository;
import com.example.subastas.repository.UsuarioAuthRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentMethodService {

    @Autowired
    private MedioPagoRepository medioPagoRepository;

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    public List<MedioPago> listarMedios(String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return medioPagoRepository.findByClienteId(usuario.getClienteId());
    }

    public MedioPago registrarCuentaBancaria(PaymentMethodDTO dto, String email) {
        if (isBlank(dto.getPais_banco()) || isBlank(dto.getNombre_banco()) || 
            isBlank(dto.getCbu_iban()) || isBlank(dto.getTitular()) || 
            dto.getFondos_reservados() == null || isBlank(dto.getMoneda())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos obligatorios faltantes");
        }

        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        CuentaBancaria cuenta = new CuentaBancaria();
        cuenta.setClienteId(usuario.getClienteId());
        cuenta.setTipo("banco");
        cuenta.setPaisBanco(dto.getPais_banco());
        cuenta.setNombreBanco(dto.getNombre_banco());
        cuenta.setCbuIban(dto.getCbu_iban());
        cuenta.setTitular(dto.getTitular());
        cuenta.setFondosReservados(dto.getFondos_reservados());
        cuenta.setMoneda(dto.getMoneda());

        return medioPagoRepository.save(cuenta);
    }

    public MedioPago registrarTarjeta(PaymentMethodDTO dto, String email) {
        if (isBlank(dto.getTipo()) || isBlank(dto.getNumero()) || 
            isBlank(dto.getVencimiento()) || isBlank(dto.getCvv()) || 
            isBlank(dto.getTitular()) || isBlank(dto.getPais_emisor())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos faltantes");
        }

        if (dto.getNumero().length() < 13) { // Validación simple
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Número de tarjeta inválido");
        }

        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        TarjetaCredito tarjeta = new TarjetaCredito();
        tarjeta.setClienteId(usuario.getClienteId());
        tarjeta.setTipo("tarjeta");
        tarjeta.setTipoTarjeta(dto.getTipo());
        // Enmascaramos el número para seguridad (solo guardamos los últimos 4)
        String n = dto.getNumero();
        tarjeta.setNumeroEnmascarado("**** **** **** " + n.substring(n.length() - 4));
        tarjeta.setVencimiento(dto.getVencimiento());
        tarjeta.setTitular(dto.getTitular());
        tarjeta.setPaisEmisor(dto.getPais_emisor());

        return medioPagoRepository.save(tarjeta);
    }

    public MedioPago registrarCheque(PaymentMethodDTO dto, String email) {
        if (isBlank(dto.getBanco_emisor()) || dto.getMonto() == null || 
            isBlank(dto.getMoneda()) || isBlank(dto.getFecha_emision()) || 
            dto.getConfirmacion_entrega() == null || !dto.getConfirmacion_entrega()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos faltantes o confirmación es false");
        }

        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        ChequeCertificado cheque = new ChequeCertificado();
        cheque.setClienteId(usuario.getClienteId());
        cheque.setTipo("cheque");
        cheque.setBancoEmisor(dto.getBanco_emisor());
        cheque.setMonto(dto.getMonto());
        cheque.setMoneda(dto.getMoneda());
        try {
            cheque.setFechaEmision(LocalDate.parse(dto.getFecha_emision()));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Fecha mal formada");
        }
        cheque.setEstado("pendiente de entrega física");

        return medioPagoRepository.save(cheque);
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}

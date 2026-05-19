package com.example.subastas.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.PaymentMethodDTO;
import com.example.subastas.model.MedioPago;
import com.example.subastas.repository.MedioPagoRepository;
import com.example.subastas.repository.UsuarioAuthRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PaymentMethodService {

    @Autowired
    private MedioPagoRepository medioPagoRepository;

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

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

        MedioPago medio = new MedioPago();
        medio.setClienteId(usuario.getClienteId());
        medio.setTipo("cuenta_bancaria");
        medio.setDatos(toJson(Map.of(
                "pais_banco", dto.getPais_banco(),
                "nombre_banco", dto.getNombre_banco(),
                "cbu_iban", dto.getCbu_iban(),
                "titular", dto.getTitular(),
                "fondos_reservados", dto.getFondos_reservados(),
                "moneda", dto.getMoneda()
        )));

        return medioPagoRepository.save(medio);
    }

    public MedioPago registrarTarjeta(PaymentMethodDTO dto, String email) {
        if (isBlank(dto.getTipo()) || isBlank(dto.getNumero()) ||
            isBlank(dto.getVencimiento()) || isBlank(dto.getCvv()) ||
            isBlank(dto.getTitular()) || isBlank(dto.getPais_emisor())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos faltantes");
        }

        if (dto.getNumero().replaceAll("\\s", "").length() < 13) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Número de tarjeta inválido");
        }

        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        String n = dto.getNumero().replaceAll("\\s", "");
        String numeroEnmascarado = "************" + n.substring(n.length() - 4);

        MedioPago medio = new MedioPago();
        medio.setClienteId(usuario.getClienteId());
        medio.setTipo("tarjeta");
        medio.setDatos(toJson(Map.of(
                "tipo", dto.getTipo(),
                "numero", numeroEnmascarado,
                "vencimiento", dto.getVencimiento(),
                "titular", dto.getTitular(),
                "pais_emisor", dto.getPais_emisor()
        )));

        return medioPagoRepository.save(medio);
    }

    public MedioPago registrarCheque(PaymentMethodDTO dto, String email) {
        if (isBlank(dto.getBanco_emisor()) || dto.getMonto() == null ||
            isBlank(dto.getMoneda()) || isBlank(dto.getFecha_emision()) ||
            dto.getConfirmacion_entrega() == null || !dto.getConfirmacion_entrega()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos faltantes o confirmación es false");
        }

        try {
            LocalDate.parse(dto.getFecha_emision());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Fecha mal formada");
        }

        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        MedioPago medio = new MedioPago();
        medio.setClienteId(usuario.getClienteId());
        medio.setTipo("cheque");
        medio.setDatos(toJson(Map.of(
                "banco_emisor", dto.getBanco_emisor(),
                "monto", dto.getMonto(),
                "moneda", dto.getMoneda(),
                "fecha_emision", dto.getFecha_emision()
        )));

        return medioPagoRepository.save(medio);
    }

    public void eliminar(Integer id, String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        var medio = medioPagoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medio de pago no encontrado"));
        if (!medio.getClienteId().equals(usuario.getClienteId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tenés permiso para eliminar este medio");
        }
        medioPagoRepository.deleteById(id);
    }

    private String toJson(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al serializar datos");
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
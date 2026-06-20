package com.example.subastas.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.PaymentMethodDTO;
import com.example.subastas.model.MedioPago;
import com.example.subastas.repository.AdjudicacionesRepository;
import com.example.subastas.repository.MedioPagoRepository;
import com.example.subastas.repository.UsuarioAuthRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PaymentMethodService {

    @Autowired
    private MedioPagoRepository medioPagoRepository;

    @Autowired
    private UsuarioAuthRepository usuarioAuthRepository;

    @Autowired
    private AdjudicacionesRepository adjudicacionesRepository;

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

        // Validación de fondos positivos
        if (dto.getFondos_reservados().doubleValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Los fondos reservados deben ser mayores a cero");
        }

        // Validación de longitud de CBU/IBAN
        String cbuLimpio = dto.getCbu_iban().replaceAll("\\s", "");
        if (dto.getPais_banco().equalsIgnoreCase("Argentina") || dto.getPais_banco().equalsIgnoreCase("AR")) {
            if (cbuLimpio.length() != 22 || !cbuLimpio.matches("\\d+")) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "El CBU debe tener exactamente 22 dígitos");
            }
        } else if (cbuLimpio.length() < 15) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "El IBAN/Cuenta es demasiado corto");
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

        var auth = usuarioAuthRepository.findByEmail(email).orElse(null);
        if (auth != null && "E2".equals(auth.getEstado())) {
        auth.setEstado("E3");
        usuarioAuthRepository.save(auth);
        }

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


        var auth = usuarioAuthRepository.findByEmail(email).orElse(null);
        if (auth != null && "E2".equals(auth.getEstado())) {
        auth.setEstado("E3");
        usuarioAuthRepository.save(auth);
        }

        return medioPagoRepository.save(medio);
    }

    public MedioPago registrarCheque(PaymentMethodDTO dto, String email) {
        if (isBlank(dto.getBanco_emisor()) || dto.getMonto() == null ||
            isBlank(dto.getMoneda()) || isBlank(dto.getFecha_emision()) ||
            dto.getConfirmacion_entrega() == null || !dto.getConfirmacion_entrega()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campos faltantes o confirmación es false");
        }

        LocalDate fechaEmision;
        try {
            fechaEmision = LocalDate.parse(dto.getFecha_emision());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Fecha mal formada");
        }

        LocalDate hoy = LocalDate.now();
        if (fechaEmision.isAfter(hoy)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "La fecha de emisión no puede ser futura");
        }
        if (fechaEmision.isBefore(hoy.minusDays(30))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "El cheque tiene más de 30 días de antigüedad");
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

        var auth = usuarioAuthRepository.findByEmail(email).orElse(null);
        if (auth != null && "E2".equals(auth.getEstado())) {
            auth.setEstado("E3");
            usuarioAuthRepository.save(auth);
        }

        return medioPagoRepository.save(medio);
    }

    @Transactional
    public void eliminar(Integer id, String email) {
        var usuario = usuarioAuthRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        var medio = medioPagoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medio de pago no encontrado"));
        if (!medio.getClienteId().equals(usuario.getClienteId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tenés permiso para eliminar este medio");
        }
        medioPagoRepository.deleteById(id);

        // Recalcular el estado según lo que le queda DESPUÉS de borrar: sin esto, alguien
        // podía quedar en E4 (o E3) sin tener en realidad ningún medio de pago utilizable.
        // - Sin ninguno restante → E2.
        // - Le queda al menos uno verificado → E4.
        // - Le quedan algunos, pero ninguno verificado → E3.
        List<MedioPago> restantes = medioPagoRepository.findByClienteId(usuario.getClienteId());
        String nuevoEstado;
        if (restantes.isEmpty()) {
            nuevoEstado = "E2";
        } else if (restantes.stream().anyMatch(m -> Boolean.TRUE.equals(m.getVerificado()))) {
            nuevoEstado = "E4";
        } else {
            nuevoEstado = "E3";
        }
        if (!nuevoEstado.equals(usuario.getEstado())) {
            usuario.setEstado(nuevoEstado);
            usuarioAuthRepository.save(usuario);
        }
    }

    /**
     * Límite NOMINAL/total de un medio de pago — sin restar nada de lo que ya se ganó con
     * él. Se deriva del propio JSON `datos` que cada medio ya guarda, no agrega ninguna
     * columna nueva.
     * - "tarjeta": dinero infinito (sin límite) — ver requerimiento del cliente.
     * - "cuenta_bancaria": fondos_reservados.
     * - "cheque": monto.
     * - cualquier otro caso / datos mal formados: 0, por seguridad (mejor bloquear su uso
     *   que dejar pujar con un medio cuyo límite no podemos calcular).
     *
     * Para validar pujas o cambios de medio usar fondosDisponibles(), no este — este es
     * el total "de fábrica" del medio, no lo que realmente le queda libre ahora.
     *
     * @return null = sin límite (infinito). Un valor = tope nominal de ese medio.
     */
    public BigDecimal limiteDisponible(MedioPago medio) {
        if (medio == null) return BigDecimal.ZERO;
        String tipo = medio.getTipo();
        if ("tarjeta".equals(tipo)) {
            return null;
        }
        try {
            var nodo = objectMapper.readTree(medio.getDatos());
            if ("cuenta_bancaria".equals(tipo) && nodo.has("fondos_reservados")) {
                return new BigDecimal(nodo.get("fondos_reservados").asText());
            }
            if ("cheque".equals(tipo) && nodo.has("monto")) {
                return new BigDecimal(nodo.get("monto").asText());
            }
        } catch (Exception e) {
            // datos mal formados: tratamos como sin fondos antes que asumir infinito
        }
        return BigDecimal.ZERO;
    }

    /**
     * Lo que REALMENTE le queda libre a este medio de pago para pujar ahora: el límite
     * nominal menos todo lo que ya ganó (Adjudicaciones.importe) con ese mismo medio, EN
     * CUALQUIER subasta — no solo la actual. Esa plata queda reservada para esa compra
     * (todavía no "gastada" de verdad, eso es la próxima etapa) y no puede volver a
     * comprometerse en otra puja, sea de este ítem, otro ítem, u otra subasta distinta.
     *
     * Ej.: cheque de $10.000, ya ganó un ítem de $6.000 con él → disponible $4.000, en
     * cualquier subasta donde use este mismo medio.
     *
     * @return null = sin límite (infinito, hoy solo "tarjeta"). Un valor = lo disponible.
     */
    public BigDecimal fondosDisponibles(MedioPago medio) {
        BigDecimal limite = limiteDisponible(medio);
        if (limite == null) return null;
        BigDecimal reservado = adjudicacionesRepository.sumImporteByMedioPagoId(medio.getId());
        BigDecimal disponible = limite.subtract(reservado != null ? reservado : BigDecimal.ZERO);
        return disponible.max(BigDecimal.ZERO);
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

    public void setPayoutAccount(Integer medioId, String email) {
    var usuario = usuarioAuthRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

    var medio = medioPagoRepository.findById(medioId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medio de pago no encontrado"));

    if (!medio.getClienteId().equals(usuario.getClienteId())) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    medioPagoRepository.findByClienteId(usuario.getClienteId())
        .forEach(m -> { m.setCuentaCobro(false); medioPagoRepository.save(m); });

    medio.setCuentaCobro(true);
    medioPagoRepository.save(medio);
}

}
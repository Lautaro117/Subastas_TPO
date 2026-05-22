package com.example.subastas.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.transaction.TransactionSystemException;

import jakarta.persistence.PersistenceException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", ex.getStatusCode().value());
        body.put("error", status != null ? status.getReasonPhrase() : "HTTP Error");
        body.put("message", ex.getReason() != null ? ex.getReason() : "Error en la solicitud");

        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }

    @ExceptionHandler({
            TransactionSystemException.class,
            DataIntegrityViolationException.class,
            DataAccessException.class,
            JpaSystemException.class,
            PersistenceException.class
    })
    public ResponseEntity<Map<String, Object>> handlePersistenceException(Exception ex) {
        String detail = getRootCauseMessage(ex);
        log.error("Persistence error: {}", detail, ex);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.UNPROCESSABLE_ENTITY.value());
        body.put("error", HttpStatus.UNPROCESSABLE_ENTITY.getReasonPhrase());
        body.put("message", "Error de persistencia: " + detail);

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        String detail = getRootCauseMessage(ex);
        log.error("Unhandled server error: {}", detail, ex);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase());
        body.put("message", "Error interno del servidor: " + detail);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    private String getRootCauseMessage(Throwable t) {
        Throwable root = t;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }

        String msg = root.getMessage();
        if (msg == null || msg.isBlank()) {
            msg = t.getMessage();
        }

        if (msg == null || msg.isBlank()) {
            return "Error desconocido";
        }

        return msg;
    }
}

package com.example.subastas.model;

import java.time.LocalDateTime;
import java.time.ZoneId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Medio de pago que un cliente eligió para pujar por un ítem puntual. Queda fijo
 * (persistido en la base, no en memoria) aunque el usuario salga y vuelva a entrar
 * a la subasta — solo se puede cambiar a través de SubastaService.seleccionarMedioPago,
 * que valida que el nuevo medio tenga fondos suficientes antes de permitir el cambio.
 *
 * Tabla nueva (no es ninguna de las originales del TPO), creada porque "asistentes"
 * no tiene una columna para esto y no se puede modificar.
 */
@Entity
@Table(name = "medio_pago_seleccionado")
public class MedioPagoSeleccionado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    @Column(name = "cliente_id", nullable = false)
    private Integer clienteId;

    @Column(name = "item_id", nullable = false)
    private Integer itemId;

    @Column(name = "medio_pago_id", nullable = false)
    private Integer medioPagoId;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now(ZoneId.of("America/Argentina/Buenos_Aires"));

    public Integer getIdentificador() { return identificador; }
    public void setIdentificador(Integer identificador) { this.identificador = identificador; }

    public Integer getClienteId() { return clienteId; }
    public void setClienteId(Integer clienteId) { this.clienteId = clienteId; }

    public Integer getItemId() { return itemId; }
    public void setItemId(Integer itemId) { this.itemId = itemId; }

    public Integer getMedioPagoId() { return medioPagoId; }
    public void setMedioPagoId(Integer medioPagoId) { this.medioPagoId = medioPagoId; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

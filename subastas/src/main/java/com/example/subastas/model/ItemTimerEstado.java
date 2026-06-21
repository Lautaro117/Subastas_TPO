package com.example.subastas.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Copia persistida del deadline del timer activo de cada subasta (uno por vez, igual
 * que en memoria en ItemTimerService). Existe SOLO para sobrevivir un reinicio del
 * backend: la memoria (ConcurrentHashMap) se pierde en cada reinicio, y antes de este
 * fix eso se interpretaba como "el timer ya venció", cerrando ítems instantáneamente
 * sin que pasara el tiempo real — esta tabla permite distinguir "se perdió la memoria
 * pero todavía falta tiempo" de "de verdad venció", y recuperar el timer correctamente
 * en el primer caso.
 *
 * Tabla nueva (no es ninguna de las originales del TPO).
 */
@Entity
@Table(name = "item_timer_estado")
public class ItemTimerEstado {

    @Id
    @Column(name = "subasta_id")
    private Integer subastaId;

    @Column(name = "item_id", nullable = false)
    private Integer itemId;

    @Column(name = "deadline_epoch_ms", nullable = false)
    private Long deadlineEpochMs;

    @Column(name = "total_segundos", nullable = false)
    private Integer totalSegundos;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Integer getSubastaId() { return subastaId; }
    public void setSubastaId(Integer subastaId) { this.subastaId = subastaId; }

    public Integer getItemId() { return itemId; }
    public void setItemId(Integer itemId) { this.itemId = itemId; }

    public Long getDeadlineEpochMs() { return deadlineEpochMs; }
    public void setDeadlineEpochMs(Long deadlineEpochMs) { this.deadlineEpochMs = deadlineEpochMs; }

    public Integer getTotalSegundos() { return totalSegundos; }
    public void setTotalSegundos(Integer totalSegundos) { this.totalSegundos = totalSegundos; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

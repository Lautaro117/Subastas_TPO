package com.example.subastas.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.subastas.dto.CatalogoDTO;
import com.example.subastas.model.Catalogo;
import com.example.subastas.model.ItemCatalogo;
import com.example.subastas.model.Subasta;
import com.example.subastas.repository.CatalogoRepository;
import com.example.subastas.repository.ItemCatalogoRepository;
import com.example.subastas.repository.SubastaRepository;

@Service
public class SubastaService {

    @Autowired
    private SubastaRepository subastaRepository;

    @Autowired
    private CatalogoRepository catalogoRepository;

    @Autowired
    private ItemCatalogoRepository itemCatalogoRepository;

    private static final List<String> ORDEN_CATEGORIAS = Arrays.asList(
            "comun", "especial", "plata", "oro", "platino"
    );

    public List<Subasta> listarPorCategoria(String categoriaUsuario) {
        List<Subasta> todas = subastaRepository.findAll();
        int nivelUsuario = ORDEN_CATEGORIAS.indexOf(categoriaUsuario);

        return todas.stream()
                .filter(s -> ORDEN_CATEGORIAS.indexOf(s.getCategoria()) <= nivelUsuario)
                .toList();
    }

    public Subasta buscarPorId(Integer id) {
        return subastaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Subasta no encontrada"));
    }

    public List<CatalogoDTO> obtenerCatalogo(Integer subastaId, String estado) {
        Catalogo catalogo = catalogoRepository.findBySubastaId(subastaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Catálogo no encontrado"));

        List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoId(catalogo.getIdentificador());

        return items.stream().map(item -> new CatalogoDTO(
                item.getIdentificador(),
                item.getProductoId(),
                estado.equals("E2") ? null : item.getPrecioBase(),
                item.getComision(),
                item.getSubastado()
        )).toList();
    }
}
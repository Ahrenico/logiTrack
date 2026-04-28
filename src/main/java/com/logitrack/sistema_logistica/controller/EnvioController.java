package com.logitrack.sistema_logistica.controller;

import com.logitrack.sistema_logistica.dto.EnvioRequestDTO;
import com.logitrack.sistema_logistica.model.Envio;
import com.logitrack.sistema_logistica.service.EnvioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.logitrack.sistema_logistica.repository.EnvioRepository;

@RestController
@RequestMapping("/api/envios")
public class EnvioController {

    @Autowired
    private EnvioService envioService; // Llamamos al servicio, no al repositorio directamente

    // Endpoint para listar todos los envíos
    @GetMapping
    public ResponseEntity<List<Envio>> listarTodos() {
        // El controlador le pide la lista al Service
        List<Envio> envios = envioService.obtenerTodos();
        
        // Retornamos la lista con un estado 200 OK
        return ResponseEntity.ok(envios);
    }
}
package com.logitrack.sistema_logistica.controller;

import com.logitrack.sistema_logistica.dto.ErrorResponseDTO;
import com.logitrack.sistema_logistica.dto.EnvioRequestDTO;
import com.logitrack.sistema_logistica.model.Envio;
import com.logitrack.sistema_logistica.service.EnvioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.logitrack.sistema_logistica.repository.EnvioRepository;

@RestController
@RequestMapping("/api/envios")
public class EnvioController {

    @Autowired
    private EnvioService envioService;
    
    @Autowired
    private EnvioRepository envioRepository;

    // GET para listar (siempre es útil tenerlo)
    @GetMapping
    public List<Envio> listarEnvios() {
        return envioRepository.findAll();
    }

    // POST para crear
    @PostMapping
    public ResponseEntity<?> crearEnvio(@RequestBody EnvioRequestDTO dto) {
        try {
            Envio envioCreado = envioService.crearNuevoEnvio(dto);
            return new ResponseEntity<>(envioCreado, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            // Si falla una validación (ej: camión no existe), devolvemos un 400 Bad Request
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    //El Front va a llamar cuando el usuario escriba en la barra de búsqueda.
    @GetMapping("/buscar/{trackingCtg}")
    public ResponseEntity<?> obtenerEnvioPorTracking(@PathVariable String trackingCtg) {
        try {
            Envio envio = envioService.buscarPorTracking(trackingCtg);
            return ResponseEntity.ok(envio);
        } catch (RuntimeException e) {

            // reamos la instancia vacía
            ErrorResponseDTO error = new ErrorResponseDTO();

            // Le cargamos el mensaje 
            error.setMessage(e.getMessage());

            // Aprovechamos el ErrorResponseDTO que ya habiamos creado
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
}
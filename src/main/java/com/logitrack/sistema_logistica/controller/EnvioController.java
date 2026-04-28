package com.logitrack.sistema_logistica.controller;

import com.logitrack.sistema_logistica.dto.ErrorResponseDTO;
import com.logitrack.sistema_logistica.dto.EnvioRequestDTO;
import com.logitrack.sistema_logistica.model.Envio;
import com.logitrack.sistema_logistica.model.Historial_Estados;
import com.logitrack.sistema_logistica.service.EnvioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    // GET para listar, en este caso los estados para el supervisor
    @GetMapping("/{idEnvio}/historial")
    public ResponseEntity<Object> consultarHistorial(@PathVariable String idEnvio) {
        try {
            List<Historial_Estados> historial = envioService.obtenerHistorialPorEnvio(idEnvio);
            return ResponseEntity.ok(historial);
        } catch (Exception e) {
            // 1. Creamos el objeto vacío
            ErrorResponseDTO error = new ErrorResponseDTO();
            // 2. Le cargamos el mensaje con el setter
            error.setMessage("Error al obtener el historial: " + e.getMessage());
            
            // 3. Lo enviamos en el body
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
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
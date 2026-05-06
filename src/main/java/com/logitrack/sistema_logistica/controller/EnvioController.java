package com.logitrack.sistema_logistica.controller;

import com.logitrack.sistema_logistica.dto.ErrorResponseDTO;
import com.logitrack.sistema_logistica.dto.EnvioRequestDTO;
import com.logitrack.sistema_logistica.model.Envio;
import com.logitrack.sistema_logistica.model.Historial_Estados;
import com.logitrack.sistema_logistica.model.Usuario;
import com.logitrack.sistema_logistica.model.enums.Estado_Envio;
import com.logitrack.sistema_logistica.service.EnvioService;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

import com.logitrack.sistema_logistica.repository.EnvioRepository;
import com.logitrack.sistema_logistica.repository.Historial_EstadosRepository;
import com.logitrack.sistema_logistica.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/envios")
public class EnvioController {

    @Autowired
    private EnvioService envioService;

    @Autowired
    private EnvioRepository envioRepository;

    @Autowired
    private UsuarioRepository usuarioRepository; // Inyectar repositorio -> Necesario para no enviar el ID de usuario
                                                 // desde el
                                                 // frontend, sino que el EnvioController extraiga quién es el usuario
                                                 // directamente leyendo el Token JWT de la petición. El usuario es
                                                 // necesario para auditorias.

    // GET para listar (siempre es útil tenerlo)
    @GetMapping
    public List<Envio> listarEnvios() {
        return envioRepository.findAll();
    }

    // GET para buscar envíos con filtros opcionales por fecha y estado
    @GetMapping("/search")
    public ResponseEntity<?> buscarEnvios(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String fecha) {
        try {
            List<Envio> envios;
            LocalDate fechaFiltro = null;
            Estado_Envio estadoFiltro = null;

            // Parsear los parámetros
            if (fecha != null && !fecha.isBlank()) {
                fechaFiltro = LocalDate.parse(fecha);
            }

            if (estado != null && !estado.isBlank()) {
                estadoFiltro = Estado_Envio.valueOf(estado.toUpperCase());
            }

            // Determinar qué búsqueda hacer según los parámetros
            if (estadoFiltro != null && fechaFiltro != null) {
                // Búsqueda con ambos filtros
                envios = envioRepository.buscarPorEstadoYFecha(
                        estadoFiltro,
                        fechaFiltro.atStartOfDay(),
                        fechaFiltro.plusDays(1).atStartOfDay());
            } else if (estadoFiltro != null) {
                // Búsqueda solo por estado
                envios = envioRepository.buscarPorEstado(estadoFiltro);
            } else if (fechaFiltro != null) {
                // Búsqueda solo por fecha
                envios = envioRepository.buscarPorFecha(
                        fechaFiltro.atStartOfDay(),
                        fechaFiltro.plusDays(1).atStartOfDay());
            } else {
                // Sin filtros, traer todos
                envios = envioRepository.buscarTodos();
            }

            return ResponseEntity.ok(envios);
        } catch (DateTimeParseException e) {
            ErrorResponseDTO error = new ErrorResponseDTO();
            error.setMessage("Formato de fecha inválido. Use yyyy-MM-dd.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IllegalArgumentException e) {
            ErrorResponseDTO error = new ErrorResponseDTO();
            error.setMessage("Estado inválido. Use uno de los valores permitidos: PENDIENTE, EN_TRANSITO, ENTREGADO, CANCELADO");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
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

    // // POST para crear
    // @PostMapping
    // public ResponseEntity<?> crearEnvio(@RequestBody EnvioRequestDTO dto) {
    // try {
    // Envio envioCreado = envioService.crearNuevoEnvio(dto);
    // return new ResponseEntity<>(envioCreado, HttpStatus.CREATED);
    // } catch (RuntimeException e) {
    // // Si falla una validación (ej: camión no existe), devolvemos un 400 Bad
    // Request
    // return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    // }
    // }

    // Nuevo POST para crear envío. Necesario para no enviar el ID de usuario desde
    // el
    // frontend, sino que el EnvioController extraiga quién es el usuario
    // directamente leyendo el Token JWT de la petición. El ID de usuario es
    // necesario
    // para auditorias.
    @PostMapping
    // Se agrega el parámetro Authentication.
    public ResponseEntity<?> crearEnvio(@RequestBody EnvioRequestDTO dto, Authentication authentication) {
        try {
            // Extraer el email/username del token JWT
            String username = authentication.getName();

            // Buscar el ID del usuario en la Base de Datos
            Usuario usuario = usuarioRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Usuario autenticado no existe en el sistema"));

            // Asignarlo al DTO de forma segura antes de guardarlo
            dto.setId_usuario_creador(usuario.getId_usuario());

            Envio envioCreado = envioService.crearNuevoEnvio(dto);
            return new ResponseEntity<>(envioCreado, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    //El Front va a llamar cuando el usuario escriba en la barra de búsqueda.
    @GetMapping("/buscar/{id_envio}")
    public ResponseEntity<?> obtenerEnvioPorTracking(@PathVariable String id_envio) {
        try {
            Envio envio = envioService.buscarPorId(id_envio);
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

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Lo siguiente se agregó como recomendación de Gemini para
    // cumplir con las funciones que tiene el front.

    // ─── DTO INTERNO PARA ACTUALIZACIONES ───
    public static class UpdateEnvioDTO {
        private String estado;
        private String prioridad;

        public String getEstado() {
            return estado;
        }

        public void setEstado(String estado) {
            this.estado = estado;
        }

        public String getPrioridad() {
            return prioridad;
        }

        public void setPrioridad(String prioridad) {
            this.prioridad = prioridad;
        }
    }

    // ─── GET: BUSCAR POR ID INTERNO (LT-XXXXXX) ───
    @GetMapping("/{idEnvio}")
    public ResponseEntity<?> obtenerEnvioPorId(@PathVariable String idEnvio) {
        try {
            // Utilizamos el repository inyectado para buscar por su ID principal
            Envio envio = envioRepository.findById(idEnvio)
                    .orElseThrow(() -> new RuntimeException("El envío no existe en la base de datos"));
            return ResponseEntity.ok(envio);
        } catch (RuntimeException e) {
            ErrorResponseDTO error = new ErrorResponseDTO();
            error.setMessage(e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    // ─── PUT: ACTUALIZAR ESTADO Y PRIORIDAD ───
    @PutMapping("/{idEnvio}")
    public ResponseEntity<?> actualizarEnvio(
            @PathVariable String idEnvio,
            @RequestBody UpdateEnvioDTO dto,
            Authentication authentication) {
        try {
            // 1. Identificar al usuario que hace el cambio
            String username = authentication.getName();
            Usuario usuario = usuarioRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Usuario autenticado no válido"));

            // 2. Aquí llamamos a tu Servicio.
            // NOTA PARA TI: En tu EnvioService.java deberás crear este método.
            // Ese método debe buscar el envío, comparar los estados, crear el registro en
            // Historial_Estados con el 'usuario' capturado y guardar los cambios.
            Envio envioActualizado = envioService.actualizarEstadoYPrioridad(
                    idEnvio,
                    dto.getEstado(),
                    dto.getPrioridad(),
                    usuario);

            return ResponseEntity.ok(envioActualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }


    /* GEMINI:
     *El peligro del FetchType.LAZY (Error de Jackson)
     * Si observamos tu clase Historial_Estados.java, vemos esto:
     * 
     * 
     * @ManyToOne(fetch = FetchType.LAZY)
     * @JoinColumn(name = "id_envio", referencedColumnName = "id_envio")
     * private Envio envio;
     * 
     * @ManyToOne(fetch = FetchType.LAZY)
     * @JoinColumn(name = "id_usuario", referencedColumnName = "id_usuario")
     * private Usuario usuario;
     * 
     * 
     * En Spring Boot, cuando intentamos devolver por la API un objeto que tiene
     * relaciones marcadas como LAZY directamente a JSON, Spring lanza una de las
     * excepciones más famosas y temidas: LazyInitializationException (o se queda en
     * un bucle infinito de serialización de JSON).
     * 
     * Para evitar que tu aplicación se rompa, la mejor práctica es no devolver la
     * entidad Historial_Estados directamente, sino devolver un objeto simplificado
     * (DTO).
     */

    // 1. DTO Interno para evitar problemas de FetchType.LAZY
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistorialResponseDTO {
        private Integer idReg;
        private String idRastreo;
        private String estadoAnterior;
        private String estadoNuevo;
        private LocalDateTime fechaHora;
        private String responsable;
    }

    @Autowired
    private Historial_EstadosRepository historialEstadosRepository;

    // 2. Endpoint Global de Auditoría
    @GetMapping("/historial-completo")
    public ResponseEntity<List<HistorialResponseDTO>> obtenerHistorialCompleto() {
        // Obtenemos todos los registros ordenados por fecha descendente (más reciente
        // primero)
        List<Historial_Estados> listaCompleta = historialEstadosRepository.findAll();

        // Mapeamos a nuestro DTO para enviar solo lo necesario y evitar errores de JSON
        List<HistorialResponseDTO> respuesta = listaCompleta.stream()
                .map(h -> HistorialResponseDTO.builder()
                        .idReg(h.getId_historial())
                        .idRastreo(h.getEnvio().getId_envio())
                        .estadoAnterior(h.getEstado_anterior() != null ? h.getEstado_anterior().name() : "INICIAL")
                        .estadoNuevo(h.getEstado_nuevo().name())
                        .fechaHora(h.getFecha_hora())
                        .responsable(h.getUsuario().getUsername())
                        .build())
                .sorted((a, b) -> b.getFechaHora().compareTo(a.getFechaHora())) // Ordenar por fecha
                .collect(Collectors.toList());

        return ResponseEntity.ok(respuesta);
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////
}
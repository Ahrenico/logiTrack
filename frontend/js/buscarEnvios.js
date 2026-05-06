// Apuntamos al backend centralizado en frontend/js/config.js
const API_URL = `${API_BASE_URL}/envios`;

// Extraemos el token JWT de la sesión
const tokenAuth = sessionStorage.getItem("token");
const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${tokenAuth}`
};

// Referencias al DOM
const searchInput = document.getElementById("searchInput");
const stateSelect = document.getElementById("stateSelect");
const dateSelect = document.getElementById("dateSelect");
const resultsTable = document.getElementById("resultsTable");
const tbody = resultsTable.querySelector("tbody");
const emptyTable = document.getElementById("emptyTable");
const noResultsTable = document.getElementById("noResultsTable");
const btnBuscar = document.querySelector("form button[type='submit']");
const btnLimpiar = document.querySelector("form button[type='reset']");

// Nuevas Referencias para Paginación
const paginationInfo = document.getElementById("paginationInfo");
const liPrevPage = document.getElementById("liPrevPage");
const liNextPage = document.getElementById("liNextPage");
const btnPrevPage = document.getElementById("btnPrevPage");
const btnNextPage = document.getElementById("btnNextPage");

// Variable global para rastrear la página actual
let currentPage = 0;

// Función principal de búsqueda (ahora recibe la página objetivo)
async function buscar(pageNumber = 0) {
    const query = searchInput.value.trim().toLowerCase();
    const estadoFiltro = stateSelect.value; // Ej: "En tránsito"
    const fechaFiltro = dateSelect.value; // Captura la fecha en formato "YYYY-MM-DD"

    // Actualizamos el estado global
    currentPage = pageNumber;

    // Estado visual de carga
    btnBuscar.disabled = true;
    btnBuscar.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Buscando...`;

    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span> Obteniendo datos...</td></tr>`;
    emptyTable.classList.add("d-none");
    resultsTable.classList.remove("d-none");
    noResultsTable.classList.add("d-none");

    try {
        // 1. Armar la URL con los parámetros (para apuntar al nuevo endpoint paginado) y la página actual
        const urlParams = new URLSearchParams();
        if (query) urlParams.append("query", query);
        if (estadoFiltro) urlParams.append("estado", estadoFiltro);
        if (fechaFiltro) urlParams.append("fecha", fechaFiltro);

        // Paginación (Spring Boot usa índice 0 para la primera página)
        urlParams.append("page", currentPage);
        urlParams.append("size", 20); // Muestra 20 resultados por página

        // Petición al backend
        const res = await fetch(`${API_URL}/busqueda-avanzada?${urlParams.toString()}`, { headers: authHeaders });

        if (!res.ok) {
            if (res.status === 401) window.location.href = "../index.html";
            throw new Error("Error al obtener los envíos");
        }

        // 2. Leer la respuesta paginada de Spring Data. Spring Data Page devuelve los arrays dentro de la propiedad "content"
        const dataPaginada = await res.json();
        const envios = dataPaginada.content;

        // Actualizar interfaz de paginación
        actualizarControlesPaginacion(dataPaginada);

        // 3. Manejo de sin resultados
        if (envios.length === 0) {
            resultsTable.classList.add("d-none");
            noResultsTable.classList.remove("d-none");
            return;
        }

        // 4. Dibujar filas
        tbody.innerHTML = envios.map(e => {
            const nombreCliente = e.origen?.empresa?.razon_social || "Sin cliente";
            const pesoTn = e.kg_origen ? (e.kg_origen / 1000).toFixed(1) : "0";

            let estadoFormateado = "DESCONOCIDO";
            if (e.estado_actual) {
                estadoFormateado = e.estado_actual.replaceAll('_', ' ').toLowerCase();
                estadoFormateado = estadoFormateado.charAt(0).toUpperCase() + estadoFormateado.slice(1);
                if (estadoFormateado === "En transito") estadoFormateado = "En tránsito";
                if (estadoFormateado === "En punto de recoleccion") estadoFormateado = "En punto de recolección";
            }

            return `
            <tr>
                <td data-label="ID Rastreo" class="ps-md-4">
                    <div class="text-end text-md-start">
                        <span class="fw-bold text-success d-block">${e.id_envio}</span>
                        <small class="text-muted" style="font-size: 0.7rem;">CTG: ${e.tracking_ctg}</small>
                    </div>
                </td>
                <td data-label="Empresa Cliente">
                    <div class="text-end text-md-start">
                        <span class="d-block fw-medium text-dark">${nombreCliente}</span>
                        <small class="text-muted"><i class="bi bi-geo-alt"></i> ${e.destino?.nombre_lugar || "Destino pendiente"}</small>
                    </div>
                </td>
                <td data-label="Carga / Grano">
                    <div class="text-end text-md-start">
                        <span class="d-block fw-medium text-dark">${e.tipo_grano}</span>
                        <small class="text-muted">${pesoTn} Tn</small>
                    </div>
                </td>
                <td data-label="Estado">
                    <div class="text-end text-md-start">
                        <span class="badge ${getEstadoClass(e.estado_actual)} rounded-pill px-3">
                            ${estadoFormateado}
                        </span>
                    </div>
                </td>
                <td data-label="Acciones" class="text-end pe-md-4">
                    <a href="./detalleEnvio.html?id=${e.id_envio}" class="btn btn-sm btn-outline-success shadow-sm rounded-3 fw-medium w-100 w-md-auto">
                        <i class="bi bi-eye-fill me-1"></i> Ficha
                    </a>
                </td>
            </tr>
        `}).join("");

    } catch (error) {
        console.error("Error en la búsqueda:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle-fill me-2"></i> Error al conectar con el servidor.</td></tr>`;
    } finally {
        // Restaurar botón
        btnBuscar.disabled = false;
        btnBuscar.innerHTML = "Buscar";
    }
}

// Lógica para habilitar/deshabilitar botones y textos de paginación
function actualizarControlesPaginacion(data) {
    console.log(data);
    // Texto descriptivo (sumamos 1 porque Java usa 0 para la primera página)
    const totalPaginas = data.total_pages === 0 ? 1 : data.total_pages;
    paginationInfo.textContent = `Mostrando página ${data.number + 1} de ${totalPaginas}`;

    // Deshabilitar botón "Anterior" si es la primera página
    if (data.first) {
        liPrevPage.classList.add("disabled");
        btnPrevPage.classList.replace("text-success", "text-muted");
    } else {
        liPrevPage.classList.remove("disabled");
        btnPrevPage.classList.replace("text-muted", "text-success");
    }

    // Deshabilitar botón "Siguiente" si es la última página
    if (data.last) {
        liNextPage.classList.add("disabled");
        btnNextPage.classList.replace("text-success", "text-muted");
    } else {
        liNextPage.classList.remove("disabled");
        btnNextPage.classList.replace("text-muted", "text-success");
    }
}

// Función auxiliar para colorear los badges, usando los nombres exactos de tu Enum Java
function getEstadoClass(estadoEnum) {
    switch (estadoEnum) {
        case 'PENDIENTE': return 'bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle';
        case 'EN_TRANSITO': return 'bg-primary bg-opacity-10 text-primary border border-primary-subtle';
        case 'EN_PUNTO_DE_RECOLECCION': return 'bg-info bg-opacity-10 text-info border border-info-subtle';
        case 'EN_REPARTO': return 'bg-warning bg-opacity-10 text-warning-emphasis border border-warning-subtle';
        case 'ENTREGADO': return 'bg-success bg-opacity-10 text-success border border-success-subtle';
        case 'CANCELADO': return 'bg-danger bg-opacity-10 text-danger border border-danger-subtle';
        default: return 'bg-light text-dark border';
    }
}

// Eventos de los botones de paginación
btnPrevPage.addEventListener("click", () => {
    if (!liPrevPage.classList.contains("disabled")) {
        buscar(currentPage - 1);
    }
});

btnNextPage.addEventListener("click", () => {
    if (!liNextPage.classList.contains("disabled")) {
        buscar(currentPage + 1);
    }
});

// Evento: Enviar el formulario (Enter o Click en buscar) (Busca siempre desde la página 0)
document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    buscar(0);
});

// Evento: Botón limpiar restaura la vista al estado inicial
if (btnLimpiar) {
    btnLimpiar.addEventListener("click", function () {
        emptyTable.classList.remove("d-none");
        resultsTable.classList.add("d-none");
        noResultsTable.classList.add("d-none");
        currentPage = 0; // Reseteamos la página
    });
}
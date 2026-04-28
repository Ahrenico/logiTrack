const API_URL = "https://69c692f1f272266f3eaccdd0.mockapi.io/envios";

// ─── SIMULACIÓN DE BACKEND (Reemplazar luego con fetch al backend real) ───
const dbClientes = [
    { cuit: "30-11111111-1", razon_social: "Los Grobo Agropecuaria", tipo_empresa: "PRODUCTOR", ruca_estado: true },
    { cuit: "30-22222222-2", razon_social: "Cargill SACI", tipo_empresa: "ACOPIO", ruca_estado: true },
    { cuit: "30-33333333-3", razon_social: "Terminal Puerto Rosario", tipo_empresa: "PUERTO", ruca_estado: true }
];

const dbEstablecimientos = [
    { id_establecimiento: 101, empresa: { cuit: "30-11111111-1" }, nombre_lugar: "Estancia El Ombú", direccion: "Ruta 226 Km 150" },
    { id_establecimiento: 102, empresa: { cuit: "30-11111111-1" }, nombre_lugar: "Silo Las Margaritas", direccion: "Camino Rural 4" },
    { id_establecimiento: 201, empresa: { cuit: "30-22222222-2" }, nombre_lugar: "Planta Acopio Norte", direccion: "Ruta 9 Km 200" },
    { id_establecimiento: 301, empresa: { cuit: "30-33333333-3" }, nombre_lugar: "Puerto Dársena 2", direccion: "Av. Costanera Sur s/n" }
];

const dbGranos = [
    { id_grano: 1, nombre: "Soja (Primera)" },
    { id_grano: 2, nombre: "Soja (Segunda)" },
    { id_grano: 3, nombre: "Trigo" },
    { id_grano: 4, nombre: "Maíz" },
    { id_grano: 5, nombre: "Girasol" }
];
// ─────────────────────────────────────────────────────────────────────────

// Referencias DOM
const form = document.querySelector("form");
const btnCrear = document.getElementById("btnCrearEnvio");
const checkAcepto = document.getElementById("flexCheckChecked");

// Elementos Cliente
const inputBuscarCliente = document.getElementById("inputBuscarCliente");
const listaResultadosCliente = document.getElementById("listaResultadosCliente");
const clienteCuitSeleccionado = document.getElementById("clienteCuitSeleccionado");
const checkClienteEstrategico = document.getElementById("checkClienteEstrategico");

// Elementos Establecimientos
const selectOrigen = document.getElementById("selectOrigen");
const selectDestino = document.getElementById("selectDestino");
const direccionOrigenInfo = document.getElementById("direccionOrigenInfo");
const direccionDestinoInfo = document.getElementById("direccionDestinoInfo");
const distanciaContainer = document.getElementById("distanciaContainer");
const distanciaInfo = document.getElementById("distanciaInfo");
let distanciaSimuladaActual = 0; // Variable para almacenar la distancia calculada

// Elementos Grano
const inputBuscarGrano = document.getElementById("inputBuscarGrano");
const listaResultadosGrano = document.getElementById("listaResultadosGrano");
const granoIdSeleccionado = document.getElementById("granoIdSeleccionado");


// ─── Lógica Buscador de Cliente ──────────────────────────────────────
inputBuscarCliente.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();
    listaResultadosCliente.innerHTML = "";
    clienteCuitSeleccionado.value = ""; // Resetea si cambia el texto
    resetearEstablecimientos();

    if (texto.length < 2) {
        listaResultadosCliente.classList.add("d-none");
        return;
    }

    const resultados = dbClientes.filter(c =>
        c.razon_social.toLowerCase().includes(texto) || c.cuit.includes(texto)
    );

    if (resultados.length > 0) {
        listaResultadosCliente.classList.remove("d-none");
        resultados.forEach(cliente => {
            const li = document.createElement("li");
            li.className = "list-group-item cliente-item border-0 border-bottom py-2";
            li.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fw-bold text-dark d-block">${cliente.razon_social}</span>
                        <small class="text-muted">CUIT: ${cliente.cuit} | ${cliente.tipo_empresa}</small>
                    </div>
                </div>`;

            li.addEventListener("click", () => {
                inputBuscarCliente.value = cliente.razon_social;
                clienteCuitSeleccionado.value = cliente.cuit;
                listaResultadosCliente.classList.add("d-none");
                pristine.validate(inputBuscarCliente);
                cargarEstablecimientos(cliente.cuit);
            });
            listaResultadosCliente.appendChild(li);
        });
    } else {
        listaResultadosCliente.classList.add("d-none");
    }
});

// ─── Lógica Establecimientos (Dependientes del Cliente) ───────────────
function cargarEstablecimientos(cuit) {
    const establecimientos = dbEstablecimientos.filter(e => e.empresa.cuit === cuit);

    selectOrigen.innerHTML = '<option value="" selected>Seleccione el punto de carga...</option>';
    selectDestino.innerHTML = '<option value="" selected>Seleccione el punto de descarga...</option>';

    establecimientos.forEach(est => {
        const optionO = document.createElement("option");
        optionO.value = est.id_establecimiento;
        optionO.textContent = est.nombre_lugar;
        selectOrigen.appendChild(optionO);

        const optionD = document.createElement("option");
        optionD.value = est.id_establecimiento;
        optionD.textContent = est.nombre_lugar;
        selectDestino.appendChild(optionD);
    });

    selectOrigen.disabled = false;
    selectDestino.disabled = false;
}

function resetearEstablecimientos() {
    selectOrigen.innerHTML = '<option value="" selected>Seleccione un cliente primero...</option>';
    selectDestino.innerHTML = '<option value="" selected>Seleccione un cliente primero...</option>';
    selectOrigen.disabled = true;
    selectDestino.disabled = true;
    direccionOrigenInfo.textContent = "Dirección de carga no disponible.";
    direccionDestinoInfo.textContent = "Dirección de descarga no disponible.";

    // Novedades:
    distanciaSimuladaActual = 0;
    distanciaContainer.classList.add("d-none");
    checkClienteEstrategico.checked = false;
}

// Mostrar dirección al seleccionar establecimiento
selectOrigen.addEventListener("change", (e) => {
    const est = dbEstablecimientos.find(est => est.id_establecimiento == e.target.value);
    direccionOrigenInfo.textContent = est ? est.direccion : "Dirección de carga no disponible.";
    calcularDistanciaSimulada();
});

selectDestino.addEventListener("change", (e) => {
    const est = dbEstablecimientos.find(est => est.id_establecimiento == e.target.value);
    direccionDestinoInfo.textContent = est ? est.direccion : "Dirección de descarga no disponible.";
    calcularDistanciaSimulada();
});

// ─── Lógica Buscador de Granos ───────────────────────────────────────
inputBuscarGrano.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();
    listaResultadosGrano.innerHTML = "";
    granoIdSeleccionado.value = "";

    if (texto.length < 1) {
        listaResultadosGrano.classList.add("d-none");
        return;
    }

    const resultados = dbGranos.filter(g => g.nombre.toLowerCase().includes(texto));

    if (resultados.length > 0) {
        listaResultadosGrano.classList.remove("d-none");
        resultados.forEach(grano => {
            const li = document.createElement("li");
            li.className = "list-group-item cliente-item border-0 border-bottom py-2 fw-medium";
            li.textContent = grano.nombre;

            li.addEventListener("click", () => {
                inputBuscarGrano.value = grano.nombre;
                granoIdSeleccionado.value = grano.id_grano;
                listaResultadosGrano.classList.add("d-none");
                pristine.validate(inputBuscarGrano);
            });
            listaResultadosGrano.appendChild(li);
        });
    } else {
        listaResultadosGrano.classList.add("d-none");
    }
});

// Ocultar listas flotantes si se hace clic fuera
document.addEventListener("click", (e) => {
    if (!inputBuscarCliente.contains(e.target)) listaResultadosCliente.classList.add("d-none");
    if (!inputBuscarGrano.contains(e.target)) listaResultadosGrano.classList.add("d-none");
});

// ─── Checkbox de Habilitación ────────────────────────────────────────
checkAcepto.addEventListener('change', function () {
    btnCrear.disabled = !this.checked;
});


// ─── Envío del Formulario ────────────────────────────────────────────
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!pristine.validate()) {
        Swal.fire({
            icon: "warning",
            title: "Faltan datos obligatorios",
            text: "Por favor, complete los campos marcados en rojo.",
            confirmButtonText: "Entendido"
        });
        return;
    }

    // Datos simulados para el modelo predictivo (ya que quitaste los checkbox de frío/frágil)
    const datosPredictivos = {
        distancia_km: distanciaSimuladaActual, // <-- Ahora usa la calculada
        tipo_envio: "normal",
        peso_kg: document.getElementById('peso').value,
        volumen: 0,
        es_fragil: 0,
        requiere_frio: 0,
        saturacion_ruta: Math.floor(Math.random() * 5) + 1
    };

    let prioridad = "";

    try {
        const respuesta = await fetch("http://localhost:8000/predecir-prioridad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosPredictivos)
        });
        const resultado = await respuesta.json();
        prioridad = resultado.prioridad_asignada;
    } catch (error) {
        console.warn("API de predicción no disponible. Se asignará prioridad manual.");
    }

    // Objeto limpio para MockAPI
    const envio = {
        clienteCuit: clienteCuitSeleccionado.value,
        clienteNombre: inputBuscarCliente.value,
        clienteEstrategico: checkClienteEstrategico.checked, // <-- Nuevo dato
        origenId: selectOrigen.value,
        destinoId: selectDestino.value,
        distanciaKm: distanciaSimuladaActual,         // <-- Nuevo dato
        peso: parseFloat(document.getElementById('peso').value),
        granoId: granoIdSeleccionado.value,
        granoNombre: inputBuscarGrano.value,
        notas: document.getElementById('notas').value.trim(),
        estado: "Pendiente",
        prioridad: prioridad || "Sin determinar"
    };

    try {
        btnCrear.disabled = true;
        btnCrear.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Registrando...`;

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(envio)
        });

        if (!response.ok) throw new Error("Error al registrar el viaje");

        const data = await response.json();

        await crearRegistro(data.id, "creacion");

        form.reset();
        await Swal.fire({
            position: "center",
            icon: "success",
            title: "Viaje registrado con éxito",
            showConfirmButton: false,
            timer: 1500
        });
        window.location.href = "./menu.html";

    } catch (error) {
        console.error(error);
        Swal.fire({
            position: "center",
            icon: "error",
            title: "No se pudo registrar el viaje",
            text: "Verifique la conexión al servidor.",
            showConfirmButton: true
        });
    } finally {
        // Restaurar estado del botón solo si la página no se redirigió
        btnCrear.disabled = !checkAcepto.checked;
        btnCrear.innerHTML = "Registrar Viaje";
    }
});

// NUEVA: Función para calcular distancia
function calcularDistanciaSimulada() {
    const idOrigen = selectOrigen.value;
    const idDestino = selectDestino.value;

    if (idOrigen && idDestino) {
        if (idOrigen === idDestino) {
            distanciaSimuladaActual = 0;
            distanciaInfo.textContent = "0 km (Error: Mismo establecimiento)";
            distanciaInfo.classList.add("text-danger");
            distanciaInfo.classList.remove("text-dark");
        } else {
            // Simulamos una distancia aleatoria entre 15 y 900 km
            distanciaSimuladaActual = Math.floor(Math.random() * (900 - 15 + 1)) + 15;
            distanciaInfo.textContent = `${distanciaSimuladaActual} km`;
            distanciaInfo.classList.remove("text-danger");
            distanciaInfo.classList.add("text-dark");
        }
        distanciaContainer.classList.remove("d-none");
    } else {
        distanciaSimuladaActual = 0;
        distanciaContainer.classList.add("d-none");
    }
}
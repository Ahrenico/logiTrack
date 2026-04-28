const API_URL = "https://69c692f1f272266f3eaccdd0.mockapi.io/envios";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
    window.location.href = "./busqueda.html";
}

const form          = document.getElementById("formDetalle");
const btnEditar     = form.querySelector("button[type='submit']");
const selectEstado  = document.getElementById("selectEstado");
const selectPrioridad = document.getElementById("selectPrioridad");

let estadoOriginal    = null;
let prioridadOriginal = null;

function setSelectValue(selectEl, value) {
    const option = Array.from(selectEl.options).find(o => o.value === value);
    if (option) selectEl.value = value;
}

async function cargarDetalle() {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Envío no encontrado");

        const envio = await response.json();

        document.getElementById("trackingId").textContent        = envio.trackingId ?? envio.id;
        document.getElementById("remitente").value               = envio.remitente ?? "";
        document.getElementById("emailRemitente").value          = envio.emailRemitente ?? "";
        document.getElementById("telefonoRemitente").value       = envio.telefonoRemitente ?? "";
        document.getElementById("destinatario").value            = envio.destinatario ?? "";
        document.getElementById("emailDestinatario").value       = envio.emailDestinatario ?? "";
        document.getElementById("telefonoDestinatario").value    = envio.telefonoDestinatario ?? "";
        document.getElementById("direccionEntrega").value        = envio.direccionEntrega ?? "";
        document.getElementById("ciudadEntrega").value           = envio.ciudadEntrega ?? "";
        document.getElementById("codigoPostal").value            = envio.codigoPostal ?? "";
        document.getElementById("peso").value                    = envio.peso ?? "";
        document.getElementById("largo").value                   = envio.largo ?? "";
        document.getElementById("ancho").value                   = envio.ancho ?? "";
        document.getElementById("alto").value                    = envio.alto ?? "";
        document.getElementById("tipo").value                    = envio.envioExpress ? "Express" : "Normal";
        document.getElementById("checkFrio").checked             = envio.frio ?? false;
        document.getElementById("checkFragil").checked           = envio.fragil ?? false;
        document.getElementById("notasAdicionales").value        = envio.notasAdicionales ?? "";

        setSelectValue(selectEstado,    envio.estado);
        setSelectValue(selectPrioridad, envio.prioridad);

        // Guardar valores originales para detectar cambios al editar
        estadoOriginal    = envio.estado;
        prioridadOriginal = envio.prioridad;

        await cargarHistorial();

    } catch (error) {
        console.error(error);
        await Swal.fire({
            position:          "center",
            icon:              "error",
            title:             "Ocurrió un error al visualizar el envío",
            showConfirmButton: false,
            timer:             1500
        });
        window.location.href = "./busqueda.html";
    }
}

async function cargarHistorial() {
    const tbody = document.getElementById("tbodyHistorial");
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center text-muted small py-3">
                <span class="spinner-border spinner-border-sm me-1"></span> Cargando historial...
            </td>
        </tr>`;
 
    try {
        const response = await fetch(`${REGISTROS_URL}?envio=${id}`);
        if (!response.ok) throw new Error("Error al obtener registros");
 
        const todos = await response.json();
        // MockAPI filtra por substring, así que hay que asegurar igualdad exacta del lado del cliente
        const registros = todos.filter(reg => String(reg.envio) === String(id));
 
        if (!registros.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted small py-3">Sin registros de cambios</td>
                </tr>`;
            return;
        }
 
        tbody.innerHTML = registros.map((reg, index) => {
            const fecha = reg.createdAt ? new Date(reg.createdAt) : null;
            const fechaStr = fecha ? fecha.toLocaleDateString("es-AR") : "—";
            const horaStr  = fecha ? fecha.toLocaleTimeString("es-AR") : "—";
 
            return `
                <tr>
                    <td class="ps-4 small fw-medium">${String(reg.id).padStart(3, "0")}</td>
                    <td class="small">${reg.tipo ?? "—"}</td>
                    <td class="small">${fechaStr}</td>
                    <td class="small">${horaStr}</td>
                    <td class="small">${reg.usuario ?? "—"}</td>
                </tr>`;
        }).join("");
 
    } catch (error) {
        console.error("Error al cargar historial:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger small py-3">No se pudo cargar el historial</td>
            </tr>`;
    }
}

async function editarEnvio() {
    const nuevoEstado     = selectEstado.value;
    const nuevaPrioridad  = selectPrioridad.value;

    try {
        btnEditar.disabled  = true;
        btnEditar.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Guardando...`;

        const response = await fetch(`${API_URL}/${id}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ estado: nuevoEstado, prioridad: nuevaPrioridad })
        });

        if (!response.ok) throw new Error("Error al actualizar el envío");

        if (nuevoEstado === estadoOriginal && nuevaPrioridad === prioridadOriginal) {
            console.log("asdwa");
            
            Swal.fire({
            position:          "center",
            icon:              "error",
            title:             "No se ha modificado ningún valor",
            showConfirmButton: false,
            timer:             2000
        });
        }else{
            // Crear registros solo si hubo cambios efectivos
            if (nuevoEstado !== estadoOriginal) {
                await crearRegistro(id, "estado", estadoOriginal, nuevoEstado);
            }

            if (nuevaPrioridad !== prioridadOriginal) {
                await crearRegistro(id, "prioridad", prioridadOriginal, nuevaPrioridad);
        }

        await Swal.fire({
            position:          "center",
            icon:              "success",
            title:             "Envío actualizado correctamente.",
            showConfirmButton: false,
            timer:             1500
        });
        window.location.href = "./busqueda.html";
        } 

    } catch (error) {
        console.error(error);
        Swal.fire({
            position:          "center",
            icon:              "error",
            title:             "No se pudo actualizar el envío",
            showConfirmButton: false,
            timer:             1500
        });
    } finally {
        btnEditar.disabled  = false;
        btnEditar.innerHTML = "Editar";
    }
}

form.addEventListener("submit", function (e) {
    e.preventDefault();
    editarEnvio();
});

cargarDetalle();

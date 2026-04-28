const API_URL = "https://69c692f1f272266f3eaccdd0.mockapi.io/envios";
 
const inputBuscar = document.querySelector("form input[type='text']");
const selectEstado = document.querySelector("form select");
const btnBuscar = document.querySelector("form button[type='submit']");
const btnLimpiar = document.querySelector("form button[type='reset']");
 
const emptyTable = document.getElementById("emptyTable");
const resultsTable = document.getElementById("resultsTable");
const noResultsTable = document.getElementById("noResultsTable");
const tbody = resultsTable.querySelector("tbody");

function actualizarLista(estadoLista) {
    emptyTable.classList.add("d-none");
    resultsTable.classList.add("d-none");
    noResultsTable.classList.add("d-none");
 
    if (estadoLista === "vacia") emptyTable.classList.remove("d-none");
    if (estadoLista === "resultados") resultsTable.classList.remove("d-none");
    if (estadoLista === "sinResultados") noResultsTable.classList.remove("d-none");
}
 
function colorearEstado(estado) {
    const map = {
        "Pendiente":   { bg: "bg-warning",  text: "text-dark" },
        "En tránsito": { bg: "bg-primary",  text: "text-white" },
        "Entregado":   { bg: "bg-success",  text: "text-white" },
        "Cancelado":   { bg: "bg-danger",   text: "text-white" },
    };
    const clases = map[estado] || { bg: "bg-secondary", text: "text-white" };
    return `<span class="badge rounded-pill ${clases.bg} ${clases.text}">${estado ?? "—"}</span>`;
}
 
function listarResultados(envios) {
    tbody.innerHTML = "";
 
    envios.forEach(envio => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="ps-4 small fw-medium">#${envio.trackingId ?? "—"}</td>
            <td class="small">${envio.destinatario ?? "—"}</td>
            <td class="small d-md-table-cell text-muted">${envio.direccionEntrega ?? "—"}</td>
            <td>${colorearEstado(envio.estado)}</td>
            <td><a href="./detalleEnvio.html?id=${envio.trackingId}" class="btn btn-sm btn-outline-secondary">Ver</a></td>
        `;
        tbody.appendChild(tr);
    });
}

async function buscar() {
    try {
        destinatarioOID = document.getElementById('searchInput').value
        estado = document.getElementById('stateSelect').value

        btnBuscar.disabled = true;
        btnBuscar.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Cargando...`;
 
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Error al obtener los envíos");
 
        envios = await response.json();

        if (destinatarioOID != "") {
            if (estado == "Cualquier Estado") {
                if (esID(destinatarioOID)) {
                    envios = envios.filter(envio => envio.trackingId == destinatarioOID);
                }else{                
                    envios = envios.filter(envio => envio.destinatario == destinatarioOID);
                }
            }else{
                if (esID(destinatarioOID)) {
                    envios = envios.filter(envio => envio.trackingId == destinatarioOID);
                    envios = envios.filter(envio => envio.estado == estado)
                }else{
                    envios = envios.filter(envio => envio.destinatario == destinatarioOID);
                    envios = envios.filter(envio => envio.estado == estado)

                }
            }

            
        }else{
            if (estado != "Cualquier Estado") {
                envios = envios.filter(envio => envio.estado == estado);
            }
        }

        
 
        if (envios.length === 0) {
            actualizarLista("sinResultados");
        } else {
            listarResultados(envios);
            actualizarLista("resultados");
        }
 
    } catch (error) {
        console.error(error);
        actualizarLista("sinResultados");
    } finally {
        btnBuscar.disabled = false;
        btnBuscar.innerHTML = `<i class="bi bi-search me-1"></i> Buscar`;
    }
}



function esID(param){
    if (/\d/.test(param)) {
        return true;        
    }    
    return false;
}
 

 
btnBuscar.addEventListener("click", function (e) {    
    e.preventDefault();
    buscar();
});
 
btnLimpiar.addEventListener("click", function () {
    actualizarLista("vacia");
});
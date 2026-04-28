const REGISTROS_URL = "https://69d1575990cd06523d5e0bd4.mockapi.io/registros";

const tbody       = document.getElementById("tbodyHistorial");
const emptyState  = document.getElementById("emptyState");
const resultsCard = document.getElementById("resultsTable");

async function cargarHistorialDeCambios() {
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center text-muted small py-3">
                <span class="spinner-border spinner-border-sm me-1"></span> Cargando historial...
            </td>
        </tr>`;

    try {
        const response = await fetch(REGISTROS_URL);
        if (!response.ok) throw new Error("Error al obtener registros");

        const registros = await response.json();

        if (!registros.length) {
            resultsCard.classList.add("d-none");
            emptyState.classList.remove("d-none");
            return;
        }

        tbody.innerHTML = registros.map(reg => {
            const fecha    = reg.createdAt ? new Date(reg.createdAt) : null;
            const fechaStr = fecha ? fecha.toLocaleDateString("es-AR")  : "—";
            const horaStr  = fecha ? fecha.toLocaleTimeString("es-AR")  : "—";

            return `
                <tr>
                    <td class="ps-4 small">${reg.id}</td>
                    <td class="small">#${reg.envio}</td>
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
                <td colspan="6" class="text-center text-danger small py-3">No se pudo cargar el historial</td>
            </tr>`;
    }
}

cargarHistorialDeCambios();
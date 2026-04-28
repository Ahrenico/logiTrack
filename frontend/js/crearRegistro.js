const REGISTROS_URL = "https://69d1575990cd06523d5e0bd4.mockapi.io/registros";


async function crearRegistro(envioId, tipoAccion, valorAnterior = null, valorNuevo = null) {

    // Obtener usuario logueado desde sessionStorage
    
    const usuario = JSON.parse(sessionStorage.getItem("usuarioLogueado")).nombre || "Desconocido";

    let tipo;
    if (tipoAccion === "creacion") {
        tipo = "Creación de envío";
    } else if ((tipoAccion === "estado" || tipoAccion === "prioridad") && valorAnterior && valorNuevo) {
        tipo = `De ${valorAnterior} a ${valorNuevo}`;
    } else {
        tipo = "Acción desconocida";
    }

    const registro = {
        usuario,
        envio: envioId,
        tipo
    };

    try {
        const response = await fetch(REGISTROS_URL, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(registro)
        });

        if (!response.ok) throw new Error("Error al crear el registro");

        const data = await response.json();
        console.log("Registro creado:", data);
        return data;

    } catch (error) {
        console.error("No se pudo guardar el registro de auditoría:", error);
        return null;
    }
}


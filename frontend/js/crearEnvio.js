const API_URL = "https://69c692f1f272266f3eaccdd0.mockapi.io/envios";
const form = document.querySelector("form");
const btnCrear = form.querySelector("button[type='submit']");
 
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!pristine.validate()) {
        Swal.fire({
            icon: "warning",
            title: "Formulario inválido",
            text: "Por favor corregí los campos marcados antes de continuar",
            confirmButtonText: "OK"
    });
    return;
}

    const inputs = form.querySelectorAll("input, select, textarea");
 
    const [
        nombreRemitente, emailRemitente, telefonoRemitente,
        nombreDestinatario, emailDestinatario, telefonoDestinatario,
        direccionEntrega, ciudadEntrega, codigoPostal,
        peso, largo, ancho, alto,
        tipo,
        checkFrio, checkFragil,
         notasAdicionales,
    ] = inputs;

    const datos = {
        distancia_km:    Math.floor(Math.random() * (1000 - 100 + 1)) + 100, // random simulado
        tipo_envio:      tipo.value === "Express" ? "express" : "normal",
        peso_kg:         peso.value,
        volumen:         largo.value * ancho.value * alto.value,
        es_fragil:       checkFragil.checked ? 1 : 0,
        requiere_frio:   checkFrio.checked ? 1 : 0,
        saturacion_ruta: Math.floor(Math.random()) + 1 // random simulado
    };

    let prioridad = "";

    try {
        const respuesta = await fetch("http://localhost:8000/predecir-prioridad", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(datos)
        });

        const resultado = await respuesta.json();
        console.log(resultado);
        prioridad = resultado.prioridad_asignada;

    } catch (error) {
        console.error("Error al predecir prioridad:", error);
    }
 
    const envio = {
        remitente:            nombreRemitente.value.trim(),
        emailRemitente:       emailRemitente.value.trim(),
        telefonoRemitente:    telefonoRemitente.value.trim(),
        destinatario:         nombreDestinatario.value.trim(),
        emailDestinatario:    emailDestinatario.value.trim(),
        telefonoDestinatario: telefonoDestinatario.value.trim(),
        direccionEntrega:     direccionEntrega.value.trim(),
        ciudadEntrega:        ciudadEntrega.value.trim(),
        codigoPostal:         codigoPostal.value.trim(),
        peso:                 parseFloat(peso.value)  || 0,
        largo:                parseFloat(largo.value) || 0,
        ancho:                parseFloat(ancho.value) || 0,
        alto:                 parseFloat(alto.value)  || 0,
        envioExpress:         tipo.value === "Express",
        frio:                 checkFrio.checked,
        fragil:               checkFragil.checked,
        notasAdicionales:     notasAdicionales.value.trim(),
        estado:               "Pendiente",
        prioridad:            prioridad || "Sin determinar"
    };
 
    try {
        btnCrear.disabled = true;
        btnCrear.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Creando...`;
 
        const response = await fetch(API_URL, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(envio)
        });
 
        if (!response.ok) throw new Error("Error al crear el envío");
 
        const data = await response.json();

        console.log(data);
        
        // Registrar la creación del envío usando el ID devuelto por la API
        await crearRegistro(data.trackingId, "creacion");

        form.reset();
        await Swal.fire({
            position:          "center",
            icon:              "success",
            title:             "Envío creado con éxito",
            showConfirmButton: false,
            timer:             1500
        });
        window.location.href = "./menu.html";
        
    } catch (error) {
        console.error(error);
        Swal.fire({
            position:          "center",
            icon:              "error",
            title:             "No se pudo crear el envío",
            showConfirmButton: false,
            timer:             1500
        });
    } finally {
        btnCrear.disabled  = false;
        btnCrear.innerHTML = "Crear Envío";
    }
});

document.getElementById('flexCheckChecked').addEventListener('change', function() {
    document.getElementById('btnCrearEnvio').disabled = !this.checked;
});
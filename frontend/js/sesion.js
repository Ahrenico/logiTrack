// 1. Verificación de Seguridad (Auth Guard)
const usuarioJSON = sessionStorage.getItem("usuarioLogueado");
const token = sessionStorage.getItem("token");

// Si no hay usuario o no hay token, lo expulsamos al index
if (!usuarioJSON || !token) {
    window.location.href = "../index.html";
}

const usuario = JSON.parse(usuarioJSON);

// 2. Cargar datos en la Interfaz (Adaptado para Desktop y Mobile)
// Limpiamos el rol por si Spring Boot envía "ROLE_SUPERVISOR" y lo ponemos bonito
const rolMostrar = usuario.rol.replace('ROLE_', '').toLowerCase();

// Elementos Desktop
// Usamos usuario.username porque así lo devuelve tu LoginResponseDTO
const nombreUI = document.getElementById("nombreUsuario");
const elRol = document.getElementById("rolUsuario");
if (nombreUI) nombreUI.textContent = usuario.username;
if (elRol) elRol.textContent = rolMostrar;

// Elementos Mobile (Nuevos IDs en el HTML)
const nombreUIMovil = document.getElementById("nombreUsuarioMovil");
const elRolMovil = document.getElementById("rolUsuarioMovil");
if (nombreUIMovil) nombreUIMovil.textContent = usuario.username;
if (elRolMovil) elRolMovil.textContent = rolMostrar;

// 3. Lógica de Cierre de Sesión
const btnCerrar = document.getElementById("btnCerrarSesion");
if (btnCerrar) {
    btnCerrar.addEventListener("click", () => {
        // Confirmación sutil opcional, útil en móviles por toques accidentales
        if (confirm("¿Está seguro que desea cerrar sesión?")) {
            // Es vital eliminar el token JWT además de los datos del usuario
            sessionStorage.removeItem("usuarioLogueado");
            sessionStorage.removeItem("token");
            window.location.href = "../index.html";
        }
    });
}

// 4. Mostrar panel de historial en el Menú
// Normalizamos el rol a minúsculas
const rolNormalizado = usuario.rol.toLowerCase().replace('role_', '');
const cardHistorial = document.getElementById("cardHistorial");

if (cardHistorial) {
    // Si es supervisor, mostramos la tarjeta
    if (rolNormalizado === "supervisor") {
        cardHistorial.classList.remove("d-none");
    } else {
        cardHistorial.classList.add("d-none");
    }
}
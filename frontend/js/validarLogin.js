const API_URL = "https://69c692f1f272266f3eaccdd0.mockapi.io/usuarios";

async function login() {
    const email = document.getElementById("exampleInputEmail1").value.trim();
    const contrasenia = document.getElementById("exampleInputPassword1").value.trim();
    const mensajeError = document.getElementById("mensajeError");

    // Ocultar error previo
    mensajeError.classList.add("d-none");

    try {
        // Buscar usuario por email directamente en la API
        const res = await fetch(`${API_URL}?email=${encodeURIComponent(email)}`);

        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const usuarios = await res.json();

        // Verificar que exista el usuario y que la contraseña coincida
        const usuarioValido = usuarios.find(u => u.email === email && u.contrasenia === contrasenia);

        if (usuarioValido) {
            // Guardar datos de sesión y redirigir
            sessionStorage.setItem("usuarioLogueado", JSON.stringify(usuarioValido));
            window.location.href = "./menu.html";
        } else {
            mensajeError.classList.remove("d-none");
        }

    } catch (error) {
        console.log("Error al conectar con la API:", error);
        mensajeError.textContent = "Error al conectar con el servidor. Intente nuevamente.";
        mensajeError.classList.remove("d-none");
    }
}

document.getElementById("btnIngresar").addEventListener("click", login);
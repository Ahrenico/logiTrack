document.addEventListener("DOMContentLoaded", () => {

const form = document.querySelector("form");
pristine = new Pristine(form, {
    classTo: 'mb-3',
    errorClass: 'has-danger',
    successClass: 'has-success',
    errorTextParent: 'mb-3',
    errorTextTag: 'div',
    errorTextClass: 'text-danger small mt-1'
});

// ─── Campos ─────────────────────────────────────
const remitenteNombre      = document.getElementById('remitenteNombre');
const remitenteEmail       = document.getElementById('remitenteEmail');
const remitenteTelefono    = document.getElementById('remitenteTelefono');

const destinatarioNombre   = document.getElementById('destinatarioNombre');
const destinatarioEmail    = document.getElementById('destinatarioEmail');
const destinatarioTelefono = document.getElementById('destinatarioTelefono');

const direccion            = document.getElementById('direccion');
const ciudad               = document.getElementById('ciudad');
const codigoPostal         = document.getElementById('codigoPostal');

const peso                 = document.getElementById('peso');
const largo                = document.getElementById('largo');
const ancho                = document.getElementById('ancho');
const alto                 = document.getElementById('alto');
const notasAdicionales     = document.getElementById('notas');

// ─── Regex ─────────────────────────────────────
const regexNombre   = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'\-]+$/;
const regexTelefono = /^\+?[\d\s\-]{7,20}$/;
const regexPostal   = /^\d{4,10}$/;
const regexEmail    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Validadores ───────────────────────────────
pristine.addValidator(remitenteNombre,
    value => value.trim() !== '' && regexNombre.test(value),
    'El nombre del remitente es obligatorio y solo puede contener letras'
);

pristine.addValidator(remitenteEmail,
    value => value.trim() !== '' && regexEmail.test(value),
    'Ingresá un email válido'
);

pristine.addValidator(remitenteTelefono,
    value => value.trim() === '' || regexTelefono.test(value),
    'Ingresá un teléfono válido'
);

pristine.addValidator(destinatarioNombre,
    value => value.trim() !== '' && regexNombre.test(value),
    'El nombre del destinatario es obligatorio y solo puede contener letras'
);

pristine.addValidator(destinatarioEmail,
    value => value.trim() === '' || regexEmail.test(value),
    'Ingresá un email válido'
);

pristine.addValidator(destinatarioTelefono,
    value => value.trim() === '' || regexTelefono.test(value),
    'Ingresá un teléfono válido'
);

pristine.addValidator(direccion,
    value => value.trim() !== '',
    'La dirección es obligatoria'
);

pristine.addValidator(ciudad,
    value => value.trim() !== '',
    'La ciudad es obligatoria'
);

pristine.addValidator(codigoPostal,
    value => value.trim() === '' || regexPostal.test(value),
    'Ingresá un código postal válido'
);

pristine.addValidator(peso,
    value => value.trim() !== '' && parseFloat(value) > 1,
    'El peso debe ser mayor a 1'
);

pristine.addValidator(notasAdicionales,
    value => value.trim().length <= 200,
    'Las notas no pueden superar los 200 caracteres'
);

// ─── Validación dimensiones ─────────────────────
function dimensionesValidas() {
    const l = largo.value.trim();
    const a = ancho.value.trim();
    const h = alto.value.trim();

    const algunoIngresado = l !== '' || a !== '' || h !== '';

    if (!algunoIngresado) return true;

    return l !== '' && a !== '' && h !== '' &&
        parseFloat(l) > 1 &&
        parseFloat(a) > 1 &&
        parseFloat(h) > 1;
}

pristine.addValidator(largo, dimensionesValidas, 'Completar Largo, Ancho y Alto (>0)');
pristine.addValidator(ancho, dimensionesValidas, 'Completar Largo, Ancho y Alto (>0)');
pristine.addValidator(alto,  dimensionesValidas, 'Completar Largo, Ancho y Alto (>0)');


// ─── Validación al salir del campo ─────────────
form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('blur', () => pristine.validate(input));
});

});
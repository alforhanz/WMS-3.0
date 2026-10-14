document.addEventListener("DOMContentLoaded", function () {
  let usuario = document.getElementById("hUsuario") ? document.getElementById("hUsuario").value : "Usuario Desconocido";
  
  // Mensaje en consola
  console.log("Hola, " + usuario + ". Estás en CREACIÓN DE PAQUETES DE TRASLADO.");

  // Mensaje inyectado en el DOM
  const domMessageDiv = document.getElementById("mensajeDOM");
  if (domMessageDiv) {
    domMessageDiv.textContent = `¡Página cargada correctamente! Bienvenido, ${usuario}.`;
    domMessageDiv.style.display = "block";
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
      domMessageDiv.style.display = "none";
    }, 5000);
  }
});

// ============================================================================
// 1. LÓGICA DE LA LUPA (BUSCADOR DE ARTÍCULOS - PROTOTIPO UI)
// ============================================================================
window.abrirBuscadorArticulos = function() {
  const inputArticulo = document.getElementById("pArticulo").value.trim().toUpperCase();

  if (!inputArticulo) {
    Swal.fire("Atención", "Ingrese al menos una letra o número en el campo 'Artículo' para buscar.", "warning");
    return;
  }

  // MOCK DE DATOS: Simulamos lo que te devolverá tu API en el futuro
  const mockResultados = [
    { ARTICULO: inputArticulo + "01", DESCRIPCION: "LLANTA FALKEN ZIEX ZE914 ECORUN" },
    { ARTICULO: inputArticulo + "-XL", DESCRIPCION: "LLANTA FALKEN WILDPEAK A/T3W" },
    { ARTICULO: inputArticulo + "55R17", DESCRIPCION: "LLANTA FALKEN SINCERA SN250A" }
  ];

  // Construimos la tabla HTML que irá dentro del Swal.fire
  let htmTabla = `
    <div style="max-height: 300px; overflow-y: auto;">
      <table class="striped centered" style="font-size: 13px;">
        <thead>
          <tr>
            <th style="text-align: left;">Artículo</th>
            <th style="text-align: left;">Descripción</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
  `;

  mockResultados.forEach(item => {
    htmTabla += `
      <tr>
        <td style="text-align: left; font-weight: bold; color: var(--primary-teal);">${item.ARTICULO}</td>
        <td style="text-align: left;">${item.DESCRIPCION}</td>
        <td>
          <button class="btn-buscar-gradient" style="width: auto; height: 30px; line-height: 30px; padding: 0 10px; border-radius: 4px;" 
                  onclick="seleccionarArticuloDesdeBuscador('${item.ARTICULO}', '${item.DESCRIPCION}')">
            Elegir
          </button>
        </td>
      </tr>
    `;
  });
  htmTabla += `</tbody></table></div>`;

  // Disparamos el Modal
  Swal.fire({
    title: 'Resultados para: "' + inputArticulo + '"',
    html: htmTabla,
    width: '700px', // Un poco más ancho para que quepa la descripción
    showConfirmButton: false,
    showCloseButton: true
  });
};

// Función auxiliar: cuando el usuario da clic en "Elegir" dentro del modal
window.seleccionarArticuloDesdeBuscador = function(codigo, descripcion) {
  document.getElementById("pArticulo").value = codigo;
  document.getElementById("pDescripcion").value = descripcion;
  Swal.close(); // Cierra el modal de SweetAlert
  document.getElementById("pCantidad").focus(); // Pone el cursor en Cantidad automáticamente
};


// ============================================================================
// 2. LÓGICA DEL BOTÓN CARGAR (AGREGAR A LA TABLA)
// ============================================================================
window.cargarArticuloALaTabla = function() {
  const articulo = document.getElementById("pArticulo").value.trim();
  const descripcion = document.getElementById("pDescripcion").value.trim();
  const cantidad = document.getElementById("pCantidad").value.trim();

  // Validaciones básicas
  if (!articulo) {
    Swal.fire("Atención", "Debe buscar y seleccionar un artículo primero.", "warning");
    return;
  }
  if (!cantidad || parseFloat(cantidad) <= 0) {
    Swal.fire("Atención", "Debe ingresar una cantidad mayor a 0.", "warning");
    return;
  }

  const tbody = document.getElementById("tblbodyTraslado");

  // Creamos la nueva fila (<tr>)
  const tr = document.createElement("tr");
  
  // Le inyectamos el HTML de las celdas
  tr.innerHTML = `
    <td style="text-align: left;">
      <span style="font-weight: 600; color: var(--articulo-orange);">${articulo}</span>
    </td>
    <td style="text-align: left;">
      <span style="color: #475569;">${descripcion || 'Sin descripción'}</span>
    </td>
    <td>
      <input type="number" class="codigo-barras-input editable-cantidad" value="${cantidad}" min="1" autocomplete="off" onchange="actualizarCantidad(this)">
    </td>
    <td class="cell-center">
      <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFila(this)" title="Eliminar fila">delete</i>
    </td>
  `;

  // Añadimos la fila a la tabla
  tbody.prepend(tr); // prepend() lo pone de primero en la lista. Puedes usar appendChild() si lo quieres al final.

  // Limpiamos los inputs para la siguiente carga
  document.getElementById("pArticulo").value = "";
  document.getElementById("pDescripcion").value = "";
  document.getElementById("pCantidad").value = "";
  
  // Ponemos el foco de vuelta en Artículo
  document.getElementById("pArticulo").focus();

  // Actualizamos el contador visual
  actualizarContadorTraslado();
};


// ============================================================================
// 3. FUNCIONES AUXILIARES DE LA TABLA
// ============================================================================
window.actualizarCantidad = function(inputElement) {
  if (inputElement.value <= 0) {
    Swal.fire("Atención", "La cantidad debe ser al menos 1", "warning");
    inputElement.value = 1;
  }
  console.log("Nueva cantidad registrada:", inputElement.value);
};

window.eliminarFila = function(iconElement) {
  const tr = iconElement.closest("tr");
  if (tr) {
    tr.remove();
    actualizarContadorTraslado();
  }
};

window.actualizarContadorTraslado = function() {
  const tbody = document.getElementById("tblbodyTraslado");
  const filasTotales = tbody.querySelectorAll("tr").length;
  const badge = document.getElementById("progresoLecturaLabel");
  if (badge) {
    badge.innerText = "Artículos Cargados: " + filasTotales;
  }
};

// ============================================================================
// STUBS (Para que los otros botones no tiren error)
// ============================================================================
window.crearPaqueteMaestro = function() {
  Swal.fire("En Desarrollo", "Aquí se conectará con el API para Crear el Paquete", "info");
};

window.confirmarGuardadoParcial = function() {
  Swal.fire("En Desarrollo", "Aquí se guardará el estado de la tabla de lectura", "info");
};
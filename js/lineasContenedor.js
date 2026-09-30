// =============================================================================
// 1. VARIABLES GLOBALES E INICIALIZACIÓN
// =============================================================================
var detalleLineasContenedor = [];

document.addEventListener("DOMContentLoaded", function () {
  loadSwitchState();

  if (localStorage.getItem("contenedor")) {
    let contenedor = localStorage.getItem("contenedor");
    let bodegaSolicita = localStorage.getItem("bodega_solicita");
    let estado_Pdt = localStorage.getItem("estado_Pdt");
    cargarDetalleContenedor(contenedor, bodegaSolicita, estado_Pdt);
  } else {
    Swal.fire({
      icon: "info",
      title: "No hay contenedor seleccionado",
      text: "Por favor elija un contenedor en la pantalla de búsqueda.",
      confirmButtonColor: "#28a745"
    });
  }
});

window.onload = function () {
  guardarTablaEnArray();
};

function loadSwitchState() {
  let storedState = localStorage.getItem("switchLecturaState_Contenedor");
  let switchState = storedState !== null ? storedState === "true" : false;

  let toggleSwitch = document.getElementById("toggleSwitchLectura");
  if (toggleSwitch) {
    toggleSwitch.checked = switchState;
  }

  localStorage.setItem("switchLecturaState_Contenedor", switchState.toString());
}

function toggleSwitchLecturaState(checkbox) {
  localStorage.setItem("switchLecturaState_Contenedor", checkbox.checked);
}

// =============================================================================
// 2. CARGA DE DATOS (API & BD)
// =============================================================================
function cargarDetalleContenedor(contenedor, bodegaSolicita, estado_Pdt) {
  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let guardado = localStorage.getItem("guardado");

  let pOpcion = guardado ? "LW" : "L";
  let bodegaInput = document.getElementById("bodega");
  let pBodegaEnvia = bodegaInput ? bodegaInput.value : "";
  let pBodegaSolicita = bodegaSolicita;
  let pConsecutivo = contenedor;
  let pEstado = estado_Pdt;

  const elContenedor = document.getElementById("contenedor");
  const elBodega = document.getElementById("bodega_solicita");

  if (elContenedor) elContenedor.textContent = contenedor;
  if (elBodega) elBodega.textContent = bodegaSolicita;

  const params =
    "?pSistema=" + pSistema +
    "&pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pBodegaEnvia=" + pBodegaEnvia +
    "&pBodegaSolicita=" + pBodegaSolicita +
    "&pConsecutivo=" + pConsecutivo +
    "&pEstado=" + pEstado;

  if (typeof mostrarLoader === "function") mostrarLoader("Cargando líneas de contenedor...");

  fetch(env.API_URL + "contenedor" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log("==== RESPUESTA DEL API (Cargar Contenedor) ====");
      console.log(result);

      if (result.msg === "SUCCESS") {
        if (result.contenedor && result.contenedor.length !== 0) {
          detalleLineasContenedor = result.contenedor;
          const siGuardadoParcial = detalleLineasContenedor.some(
            (detalle) =>
              detalle.LineaContada != null &&
              detalle.LineaContada !== "" &&
              parseFloat(detalle.LineaContada) > 0
          );

          armarTablaVerificacion(detalleLineasContenedor);
          
          if (siGuardadoParcial) {
            guardarTablaEnArray();
          }

          // Se invoca verificación solo DESPUÉS de que la tabla está armada en el DOM
          verificacion();
        } else {
          Swal.fire({
            icon: "warning",
            title: "Contenedor sin líneas",
            text: "El contenedor " + contenedor + " no tiene líneas registradas para verificar.",
            confirmButtonColor: "#28a745"
          });
        }
      }
    })
    .catch((error) => {
      console.error("Error cargando detalle:", error);
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

// =============================================================================
// 3. PESTAÑA LECTURA (PISTOLEO Y FILAS DINÁMICAS)
// =============================================================================
function validarCodigoBarras(input) {
  var LineasContenedor = detalleLineasContenedor;
  const codbarra = input.value.toUpperCase().trim();
  let lecturaKitsActiva = localStorage.getItem("switchLecturaState_Contenedor") === "true";

  if (codbarra === "") return;

  const row = input.closest("tr");
  const span = row.cells[0].querySelector("span");
  const cantFila = row.cells[2].querySelector("input");

  var codigoValido = false;

  for (var i = 0; i < LineasContenedor.length; i++) {
    let item = LineasContenedor[i];

    let codigosUnidad = item.codigos_barras 
      ? item.codigos_barras.split("|").map(c => c.toUpperCase().trim()) 
      : [];
    let codigosKits = item.codigos_barras_kits 
      ? item.codigos_barras_kits.split("|").map(c => c.toUpperCase().trim()) 
      : [];

    let esCodigoUnidad = (item.Articulo && item.Articulo.toUpperCase() === codbarra) ||
                         (item.Codigo_Barra && item.Codigo_Barra.toUpperCase() === codbarra) ||
                         codigosUnidad.includes(codbarra);

    let esCodigoKit = (item.ARTICULO_PADRE && item.ARTICULO_PADRE.toUpperCase() === codbarra) ||
                       codigosKits.includes(codbarra);

    if (esCodigoUnidad || esCodigoKit) {
      if (parseFloat(item.total_cedi || 0) <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Artículo sin existencias",
          text: "La referencia " + item.Articulo + " no cuenta con stock disponible en CEDI.",
          confirmButtonColor: "#28a745"
        });
        input.value = "";
        return;
      }

      let cantidadASumar = 1;

      if (!lecturaKitsActiva) {
        if (esCodigoKit && !esCodigoUnidad) {
          input.value = "";
          Swal.fire({
            icon: "warning",
            title: "Modo Unidades activo",
            text: "Está intentando leer un código por Kit/Caja.",
            confirmButtonColor: "#28a745"
          });
          return;
        }
      } else {
        if (esCodigoUnidad && !esCodigoKit) {
          input.value = "";
          Swal.fire({
            icon: "warning",
            title: "Modo Kits activo",
            text: "Está intentando leer un código individual.",
            confirmButtonColor: "#28a745"
          });
          return;
        }
        cantidadASumar = parseFloat(item.cant_kits) || 1;
      }

      const totalCedi = parseFloat(item.total_cedi) || 0;
      const conteoBD = parseFloat(item.LineaContada) || 0;

      const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
      const lecturaSesionActual = dataArray
        .filter((el) => el.ARTICULO === item.Articulo)
        .reduce((acum, el) => acum + (parseFloat(el.CANTIDAD_LEIDA) || 0), 0);

      const nuevoTotalLeido = conteoBD + lecturaSesionActual + cantidadASumar;

      if (nuevoTotalLeido > totalCedi) {
        input.value = "";
        Swal.fire({
          icon: "warning",
          title: "Exceso de stock CEDI",
          html: `El artículo <b>${item.Articulo}</b> supera la existencia de CEDI.<br>` +
                `Existencia: <b>${totalCedi}</b><br>` +
                `Intento acumulado: <b>${nuevoTotalLeido}</b>`,
          confirmButtonColor: "#28a745"
        });
        return;
      }

      span.textContent = item.Articulo;
      cantFila.value = cantidadASumar;
      span.style.color = lecturaKitsActiva ? "#28a745" : "#1e293b";

      codigoValido = true;
      input.setAttribute("readonly", "readonly");
      crearNuevaFila();
      guardarTablaEnArray();
      verificacion();
      break;
    }
  }

  if (!codigoValido) {
    input.value = "";
    Swal.fire({
      icon: "warning",
      title: "Código no válido",
      text: "El código ingresado no coincide con ningún artículo del contenedor.",
      confirmButtonColor: "#28a745"
    });
  }
}

function crearNuevaFila() {
  actualizarProgresoLectura();
  const tableBody = document.querySelector("#tblbodyLectura");
  if (!tableBody) return;

  const nuevaFilaHTML = `<tr>
    <td class="cell-center" style="user-select: none;">
      <span style="font-weight: 600; color: #1e293b;"></span>
    </td>
    <td>
      <input type="text" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus autocomplete="off">
    </td>
    <td>
      <input type="text" class="codigo-barras-input" value="" onchange="validarCantidadPedida(this)" autocomplete="off">
    </td>
    <td class="cell-center">
      <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFila(this)">delete</i>
    </td>
  </tr>`;

  tableBody.insertAdjacentHTML("beforeend", nuevaFilaHTML);

  if (tableBody.lastElementChild) {
    const nuevoInput = tableBody.lastElementChild.cells[1].querySelector("input");
    if (nuevoInput) nuevoInput.focus();
  }
}

function validarCantidadPedida() {
  guardarTablaEnArray();
  verificacion(); // OBLIGATORIO: Forzar el chequeo para actualizar los botones
}

function eliminarFila(icon) {
  var row = icon.closest("tr");

  Swal.fire({
    title: "¿Estás seguro?",
    text: "Se eliminará esta línea de la lectura de contenedor.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Sí, eliminar"
  }).then((result) => {
    if (result.isConfirmed) {
      var isEmptyRow = true;
      var inputs = row.querySelectorAll("input");
      inputs.forEach(function (cell) {
        if (cell.value.trim() !== "") isEmptyRow = false;
      });

      if (isEmptyRow) {
        guardarTablaEnArray();
        Swal.fire({
          icon: "warning",
          title: "Línea vacía",
          text: "No es necesario eliminar una fila sin lecturas.",
          confirmButtonText: "Cerrar",
          confirmButtonColor: "#28a745"
        });
      } else {
        row.remove();
        const tableBody = document.querySelector("#tblbodyLectura");
        if (tableBody && tableBody.lastElementChild) {
          const ultimoInput = tableBody.lastElementChild.cells[1].querySelector("input");
          if (ultimoInput) ultimoInput.focus();
        }
        guardarTablaEnArray();
        verificacion();
      }
    }
  });
}

function limpiarMensajes() {
  localStorage.removeItem("mensajes");
  const mensajeTextArea = document.getElementById("mensajeText");
  if (mensajeTextArea) mensajeTextArea.value = "";
  guardarTablaEnArray();
}

// =============================================================================
// 4. PERSISTENCIA Y AGRUPACIÓN
// =============================================================================
function guardarTablaEnArray() {
  var dataArray = [];
  var localStoragePrevio = JSON.parse(localStorage.getItem("dataArray")) || [];
  var tiemposPreviosMap = {};

  localStoragePrevio.forEach(function (oldItem) {
    if (oldItem.ARTICULO && oldItem.TIEMPO_LECTURA) {
      tiemposPreviosMap[oldItem.ARTICULO] = oldItem.TIEMPO_LECTURA;
    }
  });

  var table = document.getElementById("myTableLectura");
  if (!table) return [];

  var rows = table.getElementsByTagName("tr");

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row.cells.length < 3) continue;

    var spanArticulo = row.cells[0].querySelector("span");
    var articulo = spanArticulo ? spanArticulo.textContent.trim() : "";

    var codigoBarraInput = row.cells[1].querySelector("input");
    var cantidadLeidaInput = row.cells[2].querySelector("input");

    if (!codigoBarraInput || !cantidadLeidaInput) continue;

    var codigoBarra = codigoBarraInput.value;
    var cantidadLeida = parseFloat(cantidadLeidaInput.value);

    if (articulo !== "" && !isNaN(cantidadLeida)) {
      var tiempoAsignado = tiemposPreviosMap[articulo] || new Date();

      dataArray.push({
        ARTICULO: articulo,
        CODIGO_BARRA: codigoBarra,
        CANTIDAD_LEIDA: cantidadLeida,
        TIEMPO_LECTURA: tiempoAsignado
      });
    }
  }

  localStorage.setItem("dataArray", JSON.stringify(dataArray));
  agrupar();
  return dataArray;
}

function agrupar() {
  var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  var cantidadesConsolidadas = {};

  dataArray.forEach(function (item) {
    var articulo = item.ARTICULO;
    var cantidad = item.CANTIDAD_LEIDA;
    var tiempoOriginal = item.TIEMPO_LECTURA || new Date();

    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      cantidadesConsolidadas[articulo].cantidad += cantidad;
    } else {
      cantidadesConsolidadas[articulo] = {
        cantidad: cantidad,
        tiempo: tiempoOriginal
      };
    }
  });

  var newArray = [];
  for (var articulo in cantidadesConsolidadas) {
    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      newArray.push({
        ARTICULO: articulo,
        CANTIDAD_LEIDA: cantidadesConsolidadas[articulo].cantidad,
        TIEMPO_LECTURA: cantidadesConsolidadas[articulo].tiempo
      });
    }
  }

  localStorage.setItem("dataArray", JSON.stringify(newArray));
}

// =============================================================================
// 5. PESTAÑA VERIFICACIÓN
// =============================================================================
function armarTablaVerificacion(detalleLineasContenedor) {
  actualizarProgresoLectura();

  var tbody = document.getElementById("tblbodyLineasContenedor");
  if (!tbody) return;
  tbody.innerHTML = "";

  var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
  if (cantidadDeRegistrosLabel) {
    cantidadDeRegistrosLabel.textContent =
      "Cantidad de registros: " + detalleLineasContenedor.length;
  }

  var esModificable = localStorage.getItem("contenDetalleOPC") !== "A";

  detalleLineasContenedor.forEach(function (detalle) {
    var newRow = document.createElement("tr");

    var consecutivo = parseFloat(detalle.LineaConsecutivo) || 0;
    var contada = parseFloat(detalle.LineaContada) || 0;
    var mostrarLineaContada = contada === 0 ? "" : contada.toFixed(2);
    var cediVal = parseFloat(detalle.total_cedi) || 0;

    var editableAttr = esModificable ? 'contenteditable="true" class="cell-number editable-cantidad"' : 'contenteditable="false" class="cell-number"';
    var onblurAttr = esModificable ? `onblur="modificarCantidadManual(this, '${detalle.Articulo}')"` : '';

    let colorArticulo = cediVal > 0 ? "#0284c7" : "#ef4444";

    newRow.innerHTML = `
      <td id="articulo" style="text-align: left;">
        <div class="cell-articulo-box">
          <span id="verifica-articulo" class="cell-articulo-code" style="color: ${colorArticulo};">${detalle.Articulo}</span>
          <span class="cell-articulo-desc">${detalle.Descripcion || ""}</span>
        </div>
      </td>
      <td id="codigoDeBarras" class="cell-center">${detalle.Codigo_Barra || ""}</td>
      <td id="cantidadPedida" class="cell-number">${consecutivo.toFixed(2)}</td>
      <td id="cantidadLeida" ${editableAttr} ${onblurAttr}>${mostrarLineaContada}</td> 
      <td id="totalCedi" class="cell-number">${cediVal.toFixed(2)}</td>
      <td id="verificado" class="cell-center"></td> 
      <td id="articulosEliminado" style="display: none;">${detalle.ARTICULO_ELIMINADO || ""}</td> 
      <td id="solicitud" style="display: none;">${detalle.Solicitud || ""}</td>
    `;

    tbody.appendChild(newRow);
  });
}

function verificacion() {
  const tabla = document.getElementById("myTableVerificacion");
  if (!tabla) return;

  const tbody = tabla.querySelector("tbody");
  if (!tbody) return;

  const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  const lecturasSesion = {};

  dataArray.forEach((item) => {
    if (item.ARTICULO) {
      const artKey = item.ARTICULO.trim();
      const cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
      lecturasSesion[artKey] = (lecturasSesion[artKey] || 0) + cant;
    }
  });

  const LineasContenedor = detalleLineasContenedor || [];
  const mensajesArray = [];
  const filas = tbody.querySelectorAll("tr");

  filas.forEach((fila) => {
    if (fila.classList.contains("total-row")) return;

    const celdaARTICULO = fila.querySelector("#verifica-articulo") || fila.querySelector("h5");
    if (!celdaARTICULO) return;

    const articuloCodigo = celdaARTICULO.textContent.trim();
    const celdaVerificado = fila.querySelector("#verificado");
    const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");
    const cantPedidaCell = fila.querySelector("#cantidadPedida");

    const pedido = LineasContenedor.find((p) => p.Articulo === articuloCodigo);

    let conteoBD = pedido ? (parseFloat(pedido.LineaContada) || 0) : 0;
    let lecturaSesionActual = parseFloat(lecturasSesion[articuloCodigo]) || 0;

    let totalAcumuladoReal = conteoBD + lecturaSesionActual;
    let cantidadSolicitada = cantPedidaCell ? (parseFloat(cantPedidaCell.textContent) || 0) : 0;

    if (cantidadVerificadaCell) {
      cantidadVerificadaCell.textContent = totalAcumuladoReal > 0 ? totalAcumuladoReal.toFixed(2) : "";
    }

    if (totalAcumuladoReal === 0) {
      if (celdaVerificado) celdaVerificado.innerHTML = "";
      return;
    }

    let colorEstado = conteoBD > 0 ? "#28a745" : "#ea580c";
    let diferencia = totalAcumuladoReal - cantidadSolicitada;

    if (Math.abs(diferencia) <= 0.001) {
      if (celdaVerificado) {
        celdaVerificado.innerHTML = `<i class="material-icons" style="color: ${colorEstado} !important; font-size: 22px; vertical-align: middle;">done_all</i>`;
      }
    } else if (diferencia > 0) {
      let textoDiferencia = "+" + diferencia.toFixed(2);
      if (celdaVerificado) {
        celdaVerificado.textContent = textoDiferencia;
        celdaVerificado.style.color = "#dc2626";
        celdaVerificado.style.fontWeight = "bold";
      }
      mensajesArray.push(`• El artículo ${articuloCodigo} supera lo solicitado (+${diferencia.toFixed(2)}).`);
    } else {
      let textoDiferencia = diferencia.toFixed(2);
      if (celdaVerificado) {
        celdaVerificado.textContent = textoDiferencia;
        celdaVerificado.style.color = "#ea580c";
        celdaVerificado.style.fontWeight = "bold";
      }
      mensajesArray.push(`• El artículo ${articuloCodigo} tiene pendiente (${diferencia.toFixed(2)}).`);
    }
  });

  localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
  actualizarTotalesTablaVerificacion();
  
  // Evaluar estado dinámico de los botones de acción
  verificarEstadoBotones();
}

// =============================================================================
// 6. TOTALES Y PROGRESO
// =============================================================================
function calcularTotalUnidadesApreparar() {
  let totalPedida = 0;
  if (Array.isArray(detalleLineasContenedor)) {
    detalleLineasContenedor.forEach(function (detalle) {
      let cantidadPedida = parseFloat(detalle.LineaConsecutivo) || 0;
      totalPedida += isNaN(cantidadPedida) ? 0 : cantidadPedida;
    });
  }
  return totalPedida;
}

function calcularTotalUnidadesLeidas() {
  let totalLeidoDB = 0;
  if (Array.isArray(detalleLineasContenedor)) {
    let pOpcion = localStorage.getItem("contenDetalleOPC");
    totalLeidoDB = detalleLineasContenedor.reduce((acum, item) => {
      let cant = pOpcion === "A" ? parseFloat(item.LineaPreparada) : parseFloat(item.LineaContada);
      return acum + (isNaN(cant) ? 0 : cant);
    }, 0);
  }

  let dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  let totalSesionActual = dataArray.reduce((acum, item) => {
    let cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
    return acum + cant;
  }, 0);

  return totalLeidoDB + totalSesionActual;
}

function actualizarProgresoLectura() {
  const totalUnidadesApreparar = calcularTotalUnidadesApreparar();
  const totalUnidadesLeidas = calcularTotalUnidadesLeidas();
  const labelProgreso = document.getElementById("progresoLecturaLabel");

  if (labelProgreso) {
    labelProgreso.textContent = `Progreso: ${totalUnidadesLeidas.toFixed(0)}/${totalUnidadesApreparar.toFixed(0)}`;

    if (totalUnidadesLeidas > 0 && totalUnidadesLeidas >= totalUnidadesApreparar) {
      labelProgreso.style.color = "#166534";
      labelProgreso.style.backgroundColor = "#dcfce7";
      labelProgreso.style.borderColor = "#86efac";
    } else {
      labelProgreso.style.color = "#475569";
      labelProgreso.style.backgroundColor = "#f1f5f9";
      labelProgreso.style.borderColor = "#cbd5e1";
    }
  }
}

function actualizarTotalesTablaVerificacion() {
  var tbody = document.getElementById("tblbodyLineasContenedor");
  if (!tbody) return;

  let totalPedida = calcularTotalUnidadesApreparar();
  let totales_cedi = 0;

  if (Array.isArray(detalleLineasContenedor)) {
    detalleLineasContenedor.forEach(function (detalle) {
      let cantidadCedi = parseFloat(detalle.total_cedi) || 0;
      totales_cedi += isNaN(cantidadCedi) ? 0 : cantidadCedi;
    });
  }

  let totalLeida = calcularTotalUnidadesLeidas();

  let totalRow = tbody.querySelector(".total-row");
  if (!totalRow) {
    totalRow = document.createElement("tr");
    totalRow.className = "total-row";
    totalRow.style.backgroundColor = "#fef9c3";
    tbody.appendChild(totalRow);
  }

  totalRow.innerHTML = `
    <td colspan="2" class="totales-label" style="text-align: center; font-weight: 700; color: #1e293b;">TOTALES GENERALES</td>        
    <td class="cell-number" style="font-weight: 700;">${totalPedida.toFixed(2)}</td>
    <td class="cell-number" style="font-weight: 700;">${totalLeida.toFixed(2)}</td>
    <td class="cell-number" style="font-weight: 700;">${totales_cedi.toFixed(2)}</td>
    <td class="cell-center"></td> 
    <td style="display: none;"></td> 
    <td style="display: none;"></td> 
  `;

  actualizarProgresoLectura();
}

// =============================================================================
// 7. GUARDADO Y PROCESAMIENTO (AHORA CON BLOQUES/CHUNKS Y FETCH LOGS)
// =============================================================================
function confirmarGuardadoParcial() {
  Swal.fire({
    icon: "info",
    title: "¿Desea guardar el avance del contenedor?",
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#0284c7"
  }).then((result) => {
    if (result.isConfirmed) {
      verificacion();
      guardaParcialMente();
    }
  });
}

function guardaParcialMente() {
  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pOpcion = "G";
  let pModulo = "WMS_BC";
  var pConsecutivo = localStorage.getItem("contenedor");

  let detalles = [];
  let pEstado = "";
  let bodegaInput = document.getElementById("bodega");
  let pBodegaEnvia = bodegaInput ? bodegaInput.value : "";
  let pBodegaDestino = localStorage.getItem("bodega_solicita");
  let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || "";

  var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
  var mapaTiempos = {};
  dataArrayLectura.forEach(function (item) {
    if (item.ARTICULO && item.TIEMPO_LECTURA) {
      mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
    }
  });

  let table = document.getElementById("myTableVerificacion");
  if (table) {
    for (let i = 1; i < table.rows.length; i++) {
      let row = table.rows[i];
      if (row.classList.contains("total-row")) continue;

      let solicitud = row.querySelector("#solicitud")?.textContent.trim() || "";
      let articulo = row.querySelector("#verifica-articulo")?.textContent.trim() || "";
      let cantidadPedida = row.querySelector("#cantidadPedida")?.textContent.trim() || 0;
      let cantidadLeida = row.querySelector("#cantidadLeida")?.textContent.trim() || 0;

      let tiempoLecturaAsociado = mapaTiempos[articulo] || "";

      detalles.push({
        SOLICITUD: solicitud,
        ARTICULO: articulo,
        CANT_CONSEC: cantidadPedida,
        CANT_LEIDA: cantidadLeida,
        TIEMPO_LECTURA: tiempoLecturaAsociado
      });
    }
  }

  if (detalles.length === 0) return;

  if (typeof mostrarLoader === "function") mostrarLoader("Guardando avance del contenedor...");

  // Bloques de 20 líneas para no saturar la URL en método GET
  const chunkSize = 20;
  const totalChunks = Math.ceil(detalles.length / chunkSize);
  let promesas = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunk = detalles.slice(i * chunkSize, (i + 1) * chunkSize);
    const jsonDetalles = encodeURIComponent(JSON.stringify(chunk));

    const params =
      "?pSistema=" + pSistema +
      "&pUsuario=" + pUsuario +
      "&pOpcion=" + pOpcion +
      "&pModulo=" + pModulo +
      "&pConsecutivo=" + pConsecutivo +
      "&jsonDetalles=" + jsonDetalles +
      "&pEstado=" + pEstado +
      "&pBodegaEnvia=" + pBodegaEnvia +
      "&pBodegaDestino=" + pBodegaDestino +
      "&pUsuarioAutorizacion=" + pUsuarioAutorizacion;

    promesas.push(
      fetch(env.API_URL + "contenedor" + params, myInit)
        .then((response) => response.json())
        .then((res) => {
          console.log(`==== RESPUESTA DEL API (Guardado Bloque ${i + 1}/${totalChunks}) ====`);
          console.log(res);
          return res;
        })
    );
  }

  Promise.all(promesas)
    .then((resultados) => {
      let fallo = resultados.some((res) => res.msg !== "SUCCESS");
      
      if (!fallo) {
        Swal.fire({
          icon: "success",
          title: "Avance guardado",
          text: "Los datos se registraron correctamente.",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#28a745"
        }).then((res) => {
          if (res.isConfirmed) {
            localStorage.setItem("guardado", true);
            window.location.reload();
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un problema guardando algunos bloques de datos.",
          confirmButtonColor: "#ef4444"
        });
      }
    })
    .catch((error) => {
      console.error("Error crítico en envío de bloques:", error);
      Swal.fire({
        icon: "error",
        title: "Fallo de conexión",
        text: "Error de comunicación con el servidor al guardar.",
        confirmButtonColor: "#ef4444"
      });
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function confirmaProcesar() {
  Swal.fire({
    icon: "warning",
    title: "¿Desea procesar el contenedor?",
    showCancelButton: true,
    confirmButtonText: "Continuar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881"
  }).then((result) => {
    if (result.isConfirmed) {
      if (validarVerificacion()) {
        procesarContenedor();
      } else {
        Swal.fire({
          title: "Requiere Autorización",
          html:
            '<p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">El contenedor presenta discrepancias con lo solicitado.</p>' +
            '<input id="swal-input1" class="swal2-input" placeholder="Usuario Supervisor" autocomplete="off">' +
            '<input id="swal-input2" class="swal2-input" placeholder="Contraseña" type="password" autocomplete="off">',
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: "Aprobar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#28a745",
          cancelButtonColor: "#6e7881",
          preConfirm: () => {
            const usuario = document.getElementById("swal-input1").value.toUpperCase();
            const pass = document.getElementById("swal-input2").value;
            return { usuario: usuario, contraseña: pass };
          }
        }).then((resAuth) => {
          if (!resAuth.isDismissed && resAuth.value && resAuth.value.usuario && resAuth.value.contraseña) {
            const params =
              "?pSistema=WMS&pUsuario=" +
              resAuth.value.usuario +
              "&pOpcion=" +
              resAuth.value.contraseña;

            fetch(env.API_URL + "wmsautorizaciones" + params)
              .then((response) => response.json())
              .then((resultado) => {
                console.log("==== RESPUESTA DEL API (Autorización) ====");
                console.log(resultado);

                if (resultado.autorizacion && resultado.autorizacion[0]?.mensaje === "OK") {
                  procesarContenedor();
                } else {
                  Swal.fire({
                    icon: "error",
                    title: "Credenciales inválidas",
                    text: "No se autorizó el procesamiento con discrepancias.",
                    confirmButtonColor: "#ef4444"
                  });
                }
              })
              .catch(() => {
                Swal.fire({
                  icon: "error",
                  title: "Error de red",
                  text: "No se pudo validar la autorización.",
                  confirmButtonColor: "#ef4444"
                });
              });
          }
        });
      }
    }
  });
}

function procesarContenedor() {
  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pOpcion = "P";
  let pModulo = "WMS_BC";
  var pConsecutivo = localStorage.getItem("contenedor");

  let detalles = [];
  let pEstado = "";
  let bodegaInput = document.getElementById("bodega");
  let pBodegaEnvia = bodegaInput ? bodegaInput.value : "";
  let pBodegaDestino = localStorage.getItem("bodega_solicita");
  let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || "";

  var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
  var mapaTiempos = {};
  dataArrayLectura.forEach(function (item) {
    if (item.ARTICULO && item.TIEMPO_LECTURA) {
      mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
    }
  });

  let table = document.getElementById("myTableVerificacion");
  if (table) {
    for (let i = 1; i < table.rows.length; i++) {
      let row = table.rows[i];
      if (row.classList.contains("total-row")) continue;

      let solicitud = row.querySelector("#solicitud")?.textContent.trim() || "";
      let articulo = row.querySelector("#verifica-articulo")?.textContent.trim() || "";
      let cantidadPedida = row.querySelector("#cantidadPedida")?.textContent.trim() || 0;
      let cantidadLeida = row.querySelector("#cantidadLeida")?.textContent.trim() || 0;
      let tiempoLecturaAsociado = mapaTiempos[articulo] || "";

      detalles.push({
        SOLICITUD: solicitud,
        ARTICULO: articulo,
        CANT_CONSEC: cantidadPedida,
        CANT_LEIDA: cantidadLeida,
        TIEMPO_LECTURA: tiempoLecturaAsociado
      });
    }
  }

  if (detalles.length === 0) return;

  if (typeof mostrarLoader === "function") mostrarLoader("Procesando contenedor...");

  const chunkSize = 20;
  const totalChunks = Math.ceil(detalles.length / chunkSize);
  let promesas = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunk = detalles.slice(i * chunkSize, (i + 1) * chunkSize);
    const jsonDetalles = encodeURIComponent(JSON.stringify(chunk));

    const params =
      "?pSistema=" + pSistema +
      "&pUsuario=" + pUsuario +
      "&pOpcion=" + pOpcion +
      "&pModulo=" + pModulo +
      "&pConsecutivo=" + pConsecutivo +
      "&jsonDetalles=" + jsonDetalles +
      "&pEstado=" + pEstado +
      "&pBodegaEnvia=" + pBodegaEnvia +
      "&pBodegaDestino=" + pBodegaDestino +
      "&pUsuarioAutorizacion=" + pUsuarioAutorizacion;

    promesas.push(
      fetch(env.API_URL + "contenedor" + params, myInit)
        .then((response) => response.json())
        .then((res) => {
          console.log(`==== RESPUESTA DEL API (Procesar Bloque ${i + 1}/${totalChunks}) ====`);
          console.log(res);
          return res;
        })
    );
  }

  Promise.all(promesas)
    .then((resultados) => {
      let fallo = resultados.some((res) => res.msg !== "SUCCESS");
      
      if (!fallo) {
        Swal.fire({
          icon: "success",
          title: "Contenedor procesado",
          text: "Procesamiento completado con éxito.",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#28a745"
        }).then((res) => {
          if (res.isConfirmed) {
            localStorage.removeItem("desprachoIniciado");
            window.location.href = "BusquedaDeContenedores.html";
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un problema procesando algunos bloques de datos.",
          confirmButtonColor: "#ef4444"
        });
      }
    })
    .catch((error) => {
      console.error("Error crítico en procesamiento de bloques:", error);
      Swal.fire({
        icon: "error",
        title: "Fallo de conexión",
        text: "Error de comunicación con el servidor al procesar.",
        confirmButtonColor: "#ef4444"
      });
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

// =============================================================================
// 8. UTILIDADES Y VALIDACIÓN DINÁMICA DE BOTONES
// =============================================================================
function verificarEstadoBotones() {
  const contenDetalleOPC = localStorage.getItem("contenDetalleOPC");
  const btnGuardar = document.getElementById("btnGuardar");
  const btnProcesar = document.getElementById("btnProcesar");
  const btnGuardarLectura = document.getElementById("btnGuardarLectura");

  // Si el contenedor ya fue procesado/autorizado ("A"), se bloquean las acciones
  if (contenDetalleOPC === "A") {
    if (btnProcesar) btnProcesar.style.display = "none";
    if (btnGuardar) btnGuardar.style.display = "none";
    if (btnGuardarLectura) btnGuardarLectura.style.display = "none";
    return;
  }

  const tablaVerificacion = document.getElementById("myTableVerificacion");
  if (!tablaVerificacion) return;

  // Seleccionar todas las filas ignorando la de totales
  const filas = tablaVerificacion.querySelectorAll("tbody tr:not(.total-row)");
  
  let hayAlMenosUnaLectura = false;
  let todasCompletadasSuficientes = true;

  if (filas.length === 0) {
    todasCompletadasSuficientes = false;
  }

  filas.forEach((fila) => {
    const cantPedida = parseFloat(fila.querySelector("#cantidadPedida")?.textContent) || 0;
    const cantLeida = parseFloat(fila.querySelector("#cantidadLeida")?.textContent) || 0;

    if (cantLeida > 0) {
      hayAlMenosUnaLectura = true;
    }
    
    // Si al menos una línea no alcanza lo solicitado, se bloquea el procesamiento
    if (cantLeida < cantPedida) {
      todasCompletadasSuficientes = false;
    }
  });

  // Habilitar Guardar si hay al menos una lectura
  if (btnGuardar) btnGuardar.style.display = hayAlMenosUnaLectura ? "inline-flex" : "none";
  if (btnGuardarLectura) btnGuardarLectura.style.display = hayAlMenosUnaLectura ? "inline-flex" : "none";

  // Habilitar Procesar solo si TODAS las líneas cumplen
  if (btnProcesar) btnProcesar.style.display = todasCompletadasSuficientes ? "inline-flex" : "none";
}

function validarVerificacion() {
  var celdasVerificacion = document.querySelectorAll("#tblbodyLineasContenedor td#verificado");
  if (celdasVerificacion.length === 0) return false;

  for (var i = 0; i < celdasVerificacion.length; i++) {
    var spanVerificacion = celdasVerificacion[i].querySelector("i.material-icons, span.material-icons");
    if (!spanVerificacion || spanVerificacion.textContent !== "done_all") {
      return false;
    }
  }
  return true;
}

function mostrarMensajesLocalStorage() {
  const mensajesStorage = localStorage.getItem("mensajes");
  const textarea = document.getElementById("mensajeText");
  if (!textarea) return;

  textarea.value = "";
  if (mensajesStorage) {
    const mensajes = JSON.parse(mensajesStorage);
    for (let i = 0; i < mensajes.length; i++) {
      textarea.value += mensajes[i] + "\n";
    }
  }
}

function retornarVistaAnterior() {
  localStorage.removeItem("mensajes");
  window.location.href = "BusquedaDeContenedores.html";
}

function mostrarInfoColores() {
  Swal.fire({
    title: "<strong>Guía de Operación y Colores</strong>",
    icon: "info",
    html: `
      <div style="text-align: left; font-size: 13.5px; line-height: 1.55; max-height: 400px; overflow-y: auto; padding-right: 6px;">
        <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 0;">
          Colores de Verificación
        </h6>
        <p style="margin: 4px 0;">• <strong style="color: #28a745;">Verde:</strong> Líneas verificadas que ya se encuentran guardadas en la Base de Datos.</p>
        <p style="margin: 4px 0;">• <strong style="color: #ea580c;">Naranja:</strong> Líneas completas en memoria técnica local pendientes de guardar.</p>
        <p style="margin: 4px 0;">• <strong style="color: #64748b;">Sin Color:</strong> Líneas sin conteo registrado.</p>

        <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 14px;">
          Flujo de Trabajo
        </h6>
        <p style="margin: 4px 0;">1. Escanee en la pestaña <strong>Lectura</strong> para sumar cantidades.</p>
        <p style="margin: 4px 0;">2. Puede editar manualmente la columna <strong>Cant. Leída</strong> en Verificación haciendo clic sobre la celda.</p>
        <p style="margin: 4px 0;">3. Presione <strong>Guardar</strong> para persistir su avance en la base de datos.</p>
      </div>
    `,
    showCloseButton: true,
    confirmButtonColor: "#28a745",
    confirmButtonText: "Entendido"
  });
}

function modificarCantidadManual(celda, articuloCodigo) {
  let nuevaCantidad = parseFloat(celda.textContent.trim());

  if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
    nuevaCantidad = 0;
    celda.textContent = "0.00";
  } else {
    celda.textContent = nuevaCantidad.toFixed(2);
  }

  if (Array.isArray(detalleLineasContenedor)) {
    let itemBD = detalleLineasContenedor.find(p => p.Articulo === articuloCodigo);
    if (itemBD) {
      itemBD.LineaContada = nuevaCantidad;
    }
  }

  let dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  dataArray = dataArray.filter(item => item.ARTICULO !== articuloCodigo);
  localStorage.setItem("dataArray", JSON.stringify(dataArray));

  verificacion();
  actualizarTotalesTablaVerificacion();
}

// // =============================================================================
// // 1. VARIABLES GLOBALES E INICIALIZACIÓN
// // =============================================================================
// var detalleLineasContenedor = [];

// document.addEventListener("DOMContentLoaded", function () {
//   loadSwitchState();

//   if (localStorage.getItem("contenedor")) {
//     let contenedor = localStorage.getItem("contenedor");
//     let bodegaSolicita = localStorage.getItem("bodega_solicita");
//     let estado_Pdt = localStorage.getItem("estado_Pdt");
//     cargarDetalleContenedor(contenedor, bodegaSolicita, estado_Pdt);
//   } else {
//     Swal.fire({
//       icon: "info",
//       title: "No hay contenedor seleccionado",
//       text: "Por favor elija un contenedor en la pantalla de búsqueda.",
//       confirmButtonColor: "#28a745"
//     });
//   }

//   // configurarBotonesPorEstado();
//   verificacion();
// });

// window.onload = function () {
//   guardarTablaEnArray();
// };

// function loadSwitchState() {
//   let storedState = localStorage.getItem("switchLecturaState_Contenedor");
//   let switchState = storedState !== null ? storedState === "true" : false;

//   let toggleSwitch = document.getElementById("toggleSwitchLectura");
//   if (toggleSwitch) {
//     toggleSwitch.checked = switchState;
//   }

//   localStorage.setItem("switchLecturaState_Contenedor", switchState.toString());
// }

// function toggleSwitchLecturaState(checkbox) {
//   localStorage.setItem("switchLecturaState_Contenedor", checkbox.checked);
// }

// // =============================================================================
// // 2. CARGA DE DATOS (API & BD)
// // =============================================================================
// function cargarDetalleContenedor(contenedor, bodegaSolicita, estado_Pdt) {
//   let pSistema = "WMS";
//   let hUser = document.getElementById("hUsuario");
//   let pUsuario = hUser ? hUser.value : "";
//   let guardado = localStorage.getItem("guardado");

//   let pOpcion = guardado ? "LW" : "L";
//   let bodegaInput = document.getElementById("bodega");
//   let pBodegaEnvia = bodegaInput ? bodegaInput.value : "";
//   let pBodegaSolicita = bodegaSolicita;
//   let pConsecutivo = contenedor;
//   let pEstado = estado_Pdt;

//   const elContenedor = document.getElementById("contenedor");
//   const elBodega = document.getElementById("bodega_solicita");

//   if (elContenedor) elContenedor.textContent = contenedor;
//   if (elBodega) elBodega.textContent = bodegaSolicita;

//   const params =
//     "?pSistema=" + pSistema +
//     "&pUsuario=" + pUsuario +
//     "&pOpcion=" + pOpcion +
//     "&pBodegaEnvia=" + pBodegaEnvia +
//     "&pBodegaSolicita=" + pBodegaSolicita +
//     "&pConsecutivo=" + pConsecutivo +
//     "&pEstado=" + pEstado;

//   if (typeof mostrarLoader === "function") mostrarLoader("Cargando líneas de contenedor...");

//   fetch(env.API_URL + "contenedor" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.contenedor && result.contenedor.length !== 0) {
//           detalleLineasContenedor = result.contenedor;
//           const siGuardadoParcial = detalleLineasContenedor.some(
//             (detalle) =>
//               detalle.LineaContada != null &&
//               detalle.LineaContada !== "" &&
//               parseFloat(detalle.LineaContada) > 0
//           );

//           armarTablaVerificacion(detalleLineasContenedor);
//           if (siGuardadoParcial) {
//             guardarTablaEnArray();
//           }
//         } else {
//           Swal.fire({
//             icon: "warning",
//             title: "Contenedor sin líneas",
//             text: "El contenedor " + contenedor + " no tiene líneas registradas para verificar.",
//             confirmButtonColor: "#28a745"
//           });
//         }
//       }
//     })
//     .finally(() => {
//       if (typeof ocultarLoader === "function") ocultarLoader();
//     });
// }

// // =============================================================================
// // 3. PESTAÑA LECTURA (PISTOLEO Y FILAS DINÁMICAS)
// // =============================================================================
// function validarCodigoBarras(input) {
//   var LineasContenedor = detalleLineasContenedor;
//   const codbarra = input.value.toUpperCase().trim();
//   let lecturaKitsActiva = localStorage.getItem("switchLecturaState_Contenedor") === "true";

//   if (codbarra === "") return;

//   const row = input.closest("tr");
//   const span = row.cells[0].querySelector("span");
//   const cantFila = row.cells[2].querySelector("input");

//   var codigoValido = false;

//   for (var i = 0; i < LineasContenedor.length; i++) {
//     let item = LineasContenedor[i];

//     let codigosUnidad = item.codigos_barras 
//       ? item.codigos_barras.split("|").map(c => c.toUpperCase().trim()) 
//       : [];
//     let codigosKits = item.codigos_barras_kits 
//       ? item.codigos_barras_kits.split("|").map(c => c.toUpperCase().trim()) 
//       : [];

//     let esCodigoUnidad = (item.Articulo && item.Articulo.toUpperCase() === codbarra) ||
//                          (item.Codigo_Barra && item.Codigo_Barra.toUpperCase() === codbarra) ||
//                          codigosUnidad.includes(codbarra);

//     let esCodigoKit = (item.ARTICULO_PADRE && item.ARTICULO_PADRE.toUpperCase() === codbarra) ||
//                        codigosKits.includes(codbarra);

//     if (esCodigoUnidad || esCodigoKit) {
//       if (parseFloat(item.total_cedi || 0) <= 0) {
//         Swal.fire({
//           icon: "warning",
//           title: "Artículo sin existencias",
//           text: "La referencia " + item.Articulo + " no cuenta con stock disponible en CEDI.",
//           confirmButtonColor: "#28a745"
//         });
//         input.value = "";
//         return;
//       }

//       let cantidadASumar = 1;

//       if (!lecturaKitsActiva) {
//         if (esCodigoKit && !esCodigoUnidad) {
//           input.value = "";
//           Swal.fire({
//             icon: "warning",
//             title: "Modo Unidades activo",
//             text: "Está intentando leer un código por Kit/Caja.",
//             confirmButtonColor: "#28a745"
//           });
//           return;
//         }
//       } else {
//         if (esCodigoUnidad && !esCodigoKit) {
//           input.value = "";
//           Swal.fire({
//             icon: "warning",
//             title: "Modo Kits activo",
//             text: "Está intentando leer un código individual.",
//             confirmButtonColor: "#28a745"
//           });
//           return;
//         }
//         cantidadASumar = parseFloat(item.cant_kits) || 1;
//       }

//       const totalCedi = parseFloat(item.total_cedi) || 0;
//       const conteoBD = parseFloat(item.LineaContada) || 0;

//       const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
//       const lecturaSesionActual = dataArray
//         .filter((el) => el.ARTICULO === item.Articulo)
//         .reduce((acum, el) => acum + (parseFloat(el.CANTIDAD_LEIDA) || 0), 0);

//       const nuevoTotalLeido = conteoBD + lecturaSesionActual + cantidadASumar;

//       if (nuevoTotalLeido > totalCedi) {
//         input.value = "";
//         Swal.fire({
//           icon: "warning",
//           title: "Exceso de stock CEDI",
//           html: `El artículo <b>${item.Articulo}</b> supera la existencia de CEDI.<br>` +
//                 `Existencia: <b>${totalCedi}</b><br>` +
//                 `Intento acumulado: <b>${nuevoTotalLeido}</b>`,
//           confirmButtonColor: "#28a745"
//         });
//         return;
//       }

//       span.textContent = item.Articulo;
//       cantFila.value = cantidadASumar;
//       span.style.color = lecturaKitsActiva ? "#28a745" : "#1e293b";

//       codigoValido = true;
//       input.setAttribute("readonly", "readonly");
//       crearNuevaFila();
//       guardarTablaEnArray();
//       verificacion();
//       break;
//     }
//   }

//   if (!codigoValido) {
//     input.value = "";
//     Swal.fire({
//       icon: "warning",
//       title: "Código no válido",
//       text: "El código ingresado no coincide con ningún artículo del contenedor.",
//       confirmButtonColor: "#28a745"
//     });
//   }
// }

// function crearNuevaFila() {
//   actualizarProgresoLectura();
//   const tableBody = document.querySelector("#tblbodyLectura");
//   if (!tableBody) return;

//   const nuevaFilaHTML = `<tr>
//     <td class="cell-center" style="user-select: none;">
//       <span style="font-weight: 600; color: #1e293b;"></span>
//     </td>
//     <td>
//       <input type="text" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus autocomplete="off">
//     </td>
//     <td>
//       <input type="text" class="codigo-barras-input" value="" onchange="validarCantidadPedida(this)" autocomplete="off">
//     </td>
//     <td class="cell-center">
//       <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFila(this)">delete</i>
//     </td>
//   </tr>`;

//   tableBody.insertAdjacentHTML("beforeend", nuevaFilaHTML);

//   if (tableBody.lastElementChild) {
//     const nuevoInput = tableBody.lastElementChild.cells[1].querySelector("input");
//     if (nuevoInput) nuevoInput.focus();
//   }
// }

// function validarCantidadPedida() {
//   guardarTablaEnArray();
// }

// function eliminarFila(icon) {
//   var row = icon.closest("tr");

//   Swal.fire({
//     title: "¿Estás seguro?",
//     text: "Se eliminará esta línea de la lectura de contenedor.",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//     confirmButtonText: "Sí, eliminar"
//   }).then((result) => {
//     if (result.isConfirmed) {
//       var isEmptyRow = true;
//       var inputs = row.querySelectorAll("input");
//       inputs.forEach(function (cell) {
//         if (cell.value.trim() !== "") isEmptyRow = false;
//       });

//       if (isEmptyRow) {
//         guardarTablaEnArray();
//         Swal.fire({
//           icon: "warning",
//           title: "Línea vacía",
//           text: "No es necesario eliminar una fila sin lecturas.",
//           confirmButtonText: "Cerrar",
//           confirmButtonColor: "#28a745"
//         });
//       } else {
//         row.remove();
//         const tableBody = document.querySelector("#tblbodyLectura");
//         if (tableBody && tableBody.lastElementChild) {
//           const ultimoInput = tableBody.lastElementChild.cells[1].querySelector("input");
//           if (ultimoInput) ultimoInput.focus();
//         }
//         guardarTablaEnArray();
//       }
//     }
//   });
// }

// function limpiarMensajes() {
//   localStorage.removeItem("mensajes");
//   const mensajeTextArea = document.getElementById("mensajeText");
//   if (mensajeTextArea) mensajeTextArea.value = "";
//   guardarTablaEnArray();
// }

// // =============================================================================
// // 4. PERSISTENCIA Y AGRUPACIÓN
// // =============================================================================
// function guardarTablaEnArray() {
//   var dataArray = [];
//   var localStoragePrevio = JSON.parse(localStorage.getItem("dataArray")) || [];
//   var tiemposPreviosMap = {};

//   localStoragePrevio.forEach(function (oldItem) {
//     if (oldItem.ARTICULO && oldItem.TIEMPO_LECTURA) {
//       tiemposPreviosMap[oldItem.ARTICULO] = oldItem.TIEMPO_LECTURA;
//     }
//   });

//   var table = document.getElementById("myTableLectura");
//   if (!table) return [];

//   var rows = table.getElementsByTagName("tr");

//   for (var i = 1; i < rows.length; i++) {
//     var row = rows[i];
//     if (row.cells.length < 3) continue;

//     var spanArticulo = row.cells[0].querySelector("span");
//     var articulo = spanArticulo ? spanArticulo.textContent.trim() : "";

//     var codigoBarraInput = row.cells[1].querySelector("input");
//     var cantidadLeidaInput = row.cells[2].querySelector("input");

//     if (!codigoBarraInput || !cantidadLeidaInput) continue;

//     var codigoBarra = codigoBarraInput.value;
//     var cantidadLeida = parseFloat(cantidadLeidaInput.value);

//     if (articulo !== "" && !isNaN(cantidadLeida)) {
//       var tiempoAsignado = tiemposPreviosMap[articulo] || new Date();

//       dataArray.push({
//         ARTICULO: articulo,
//         CODIGO_BARRA: codigoBarra,
//         CANTIDAD_LEIDA: cantidadLeida,
//         TIEMPO_LECTURA: tiempoAsignado
//       });
//     }
//   }

//   localStorage.setItem("dataArray", JSON.stringify(dataArray));
//   agrupar();
//   return dataArray;
// }

// function agrupar() {
//   var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
//   var cantidadesConsolidadas = {};

//   dataArray.forEach(function (item) {
//     var articulo = item.ARTICULO;
//     var cantidad = item.CANTIDAD_LEIDA;
//     var tiempoOriginal = item.TIEMPO_LECTURA || new Date();

//     if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
//       cantidadesConsolidadas[articulo].cantidad += cantidad;
//     } else {
//       cantidadesConsolidadas[articulo] = {
//         cantidad: cantidad,
//         tiempo: tiempoOriginal
//       };
//     }
//   });

//   var newArray = [];
//   for (var articulo in cantidadesConsolidadas) {
//     if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
//       newArray.push({
//         ARTICULO: articulo,
//         CANTIDAD_LEIDA: cantidadesConsolidadas[articulo].cantidad,
//         TIEMPO_LECTURA: cantidadesConsolidadas[articulo].tiempo
//       });
//     }
//   }

//   localStorage.setItem("dataArray", JSON.stringify(newArray));
// }

// // =============================================================================
// // 5. PESTAÑA VERIFICACIÓN
// // =============================================================================
// function armarTablaVerificacion(detalleLineasContenedor) {
//   actualizarProgresoLectura();

//   var tbody = document.getElementById("tblbodyLineasContenedor");
//   if (!tbody) return;
//   tbody.innerHTML = "";

//   var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
//   if (cantidadDeRegistrosLabel) {
//     cantidadDeRegistrosLabel.textContent =
//       "Cantidad de registros: " + detalleLineasContenedor.length;
//   }

//   var esModificable = localStorage.getItem("contenDetalleOPC") !== "A";

//   detalleLineasContenedor.forEach(function (detalle) {
//     var newRow = document.createElement("tr");

//     var consecutivo = parseFloat(detalle.LineaConsecutivo) || 0;
//     var contada = parseFloat(detalle.LineaContada) || 0;
//     var mostrarLineaContada = contada === 0 ? "" : contada.toFixed(2);
//     var cediVal = parseFloat(detalle.total_cedi) || 0;

//     var editableAttr = esModificable ? 'contenteditable="true" class="cell-number editable-cantidad"' : 'contenteditable="false" class="cell-number"';
//     var onblurAttr = esModificable ? `onblur="modificarCantidadManual(this, '${detalle.Articulo}')"` : '';

//     let colorArticulo = cediVal > 0 ? "#0284c7" : "#ef4444";

//     newRow.innerHTML = `
//       <td id="articulo" style="text-align: left;">
//         <div class="cell-articulo-box">
//           <span id="verifica-articulo" class="cell-articulo-code" style="color: ${colorArticulo};">${detalle.Articulo}</span>
//           <span class="cell-articulo-desc">${detalle.Descripcion || ""}</span>
//         </div>
//       </td>
//       <td id="codigoDeBarras" class="cell-center">${detalle.Codigo_Barra || ""}</td>
//       <td id="cantidadPedida" class="cell-number">${consecutivo.toFixed(2)}</td>
//       <td id="cantidadLeida" ${editableAttr} ${onblurAttr}>${mostrarLineaContada}</td> 
//       <td id="totalCedi" class="cell-number">${cediVal.toFixed(2)}</td>
//       <td id="verificado" class="cell-center"></td> 
//       <td id="articulosEliminado" style="display: none;">${detalle.ARTICULO_ELIMINADO || ""}</td> 
//       <td id="solicitud" style="display: none;">${detalle.Solicitud || ""}</td>
//     `;

//     tbody.appendChild(newRow);
//   });

//   verificacion();
// }

// function verificacion() {
//   const tabla = document.getElementById("myTableVerificacion");
//   if (!tabla) return;

//   const tbody = tabla.querySelector("tbody");
//   if (!tbody) return;

//   const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
//   const lecturasSesion = {};

//   dataArray.forEach((item) => {
//     if (item.ARTICULO) {
//       const artKey = item.ARTICULO.trim();
//       const cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
//       lecturasSesion[artKey] = (lecturasSesion[artKey] || 0) + cant;
//     }
//   });

//   const LineasContenedor = detalleLineasContenedor || [];
//   const mensajesArray = [];
//   const filas = tbody.querySelectorAll("tr");

//   filas.forEach((fila) => {
//     if (fila.classList.contains("total-row")) return;

//     const celdaARTICULO = fila.querySelector("#verifica-articulo") || fila.querySelector("h5");
//     if (!celdaARTICULO) return;

//     const articuloCodigo = celdaARTICULO.textContent.trim();
//     const celdaVerificado = fila.querySelector("#verificado");
//     const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");
//     const cantPedidaCell = fila.querySelector("#cantidadPedida");

//     const pedido = LineasContenedor.find((p) => p.Articulo === articuloCodigo);

//     let conteoBD = pedido ? (parseFloat(pedido.LineaContada) || 0) : 0;
//     let lecturaSesionActual = parseFloat(lecturasSesion[articuloCodigo]) || 0;

//     let totalAcumuladoReal = conteoBD + lecturaSesionActual;
//     let cantidadSolicitada = cantPedidaCell ? (parseFloat(cantPedidaCell.textContent) || 0) : 0;

//     if (cantidadVerificadaCell) {
//       cantidadVerificadaCell.textContent = totalAcumuladoReal > 0 ? totalAcumuladoReal.toFixed(2) : "";
//     }

//     if (totalAcumuladoReal === 0) {
//       if (celdaVerificado) celdaVerificado.innerHTML = "";
//       return;
//     }

//     let colorEstado = conteoBD > 0 ? "#28a745" : "#ea580c";
//     let diferencia = totalAcumuladoReal - cantidadSolicitada;

//     if (Math.abs(diferencia) <= 0.001) {
//       if (celdaVerificado) {
//         celdaVerificado.innerHTML = `<i class="material-icons" style="color: ${colorEstado} !important; font-size: 22px; vertical-align: middle;">done_all</i>`;
//       }
//     } else if (diferencia > 0) {
//       let textoDiferencia = "+" + diferencia.toFixed(2);
//       if (celdaVerificado) {
//         celdaVerificado.textContent = textoDiferencia;
//         celdaVerificado.style.color = "#dc2626";
//         celdaVerificado.style.fontWeight = "bold";
//       }
//       mensajesArray.push(`• El artículo ${articuloCodigo} supera lo solicitado (+${diferencia.toFixed(2)}).`);
//     } else {
//       let textoDiferencia = diferencia.toFixed(2);
//       if (celdaVerificado) {
//         celdaVerificado.textContent = textoDiferencia;
//         celdaVerificado.style.color = "#ea580c";
//         celdaVerificado.style.fontWeight = "bold";
//       }
//       mensajesArray.push(`• El artículo ${articuloCodigo} tiene pendiente (${diferencia.toFixed(2)}).`);
//     }
//   });

//   localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
//   actualizarTotalesTablaVerificacion();
//   // OBLIGATORIO: Validar habilitación de botones al terminar de pintar las tablas
//   verificarEstadoBotones();
// }

// // =============================================================================
// // 6. TOTALES Y PROGRESO
// // =============================================================================
// function calcularTotalUnidadesApreparar() {
//   let totalPedida = 0;
//   if (Array.isArray(detalleLineasContenedor)) {
//     detalleLineasContenedor.forEach(function (detalle) {
//       let cantidadPedida = parseFloat(detalle.LineaConsecutivo) || 0;
//       totalPedida += isNaN(cantidadPedida) ? 0 : cantidadPedida;
//     });
//   }
//   return totalPedida;
// }

// function calcularTotalUnidadesLeidas() {
//   let totalLeidoDB = 0;
//   if (Array.isArray(detalleLineasContenedor)) {
//     let pOpcion = localStorage.getItem("contenDetalleOPC");
//     totalLeidoDB = detalleLineasContenedor.reduce((acum, item) => {
//       let cant = pOpcion === "A" ? parseFloat(item.LineaPreparada) : parseFloat(item.LineaContada);
//       return acum + (isNaN(cant) ? 0 : cant);
//     }, 0);
//   }

//   let dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
//   let totalSesionActual = dataArray.reduce((acum, item) => {
//     let cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
//     return acum + cant;
//   }, 0);

//   return totalLeidoDB + totalSesionActual;
// }

// function actualizarProgresoLectura() {
//   const totalUnidadesApreparar = calcularTotalUnidadesApreparar();
//   const totalUnidadesLeidas = calcularTotalUnidadesLeidas();
//   const labelProgreso = document.getElementById("progresoLecturaLabel");

//   if (labelProgreso) {
//     labelProgreso.textContent = `Progreso: ${totalUnidadesLeidas.toFixed(0)}/${totalUnidadesApreparar.toFixed(0)}`;

//     if (totalUnidadesLeidas > 0 && totalUnidadesLeidas >= totalUnidadesApreparar) {
//       labelProgreso.style.color = "#166534";
//       labelProgreso.style.backgroundColor = "#dcfce7";
//       labelProgreso.style.borderColor = "#86efac";
//     } else {
//       labelProgreso.style.color = "#475569";
//       labelProgreso.style.backgroundColor = "#f1f5f9";
//       labelProgreso.style.borderColor = "#cbd5e1";
//     }
//   }
// }

// function actualizarTotalesTablaVerificacion() {
//   var tbody = document.getElementById("tblbodyLineasContenedor");
//   if (!tbody) return;

//   let totalPedida = calcularTotalUnidadesApreparar();
//   let totales_cedi = 0;

//   if (Array.isArray(detalleLineasContenedor)) {
//     detalleLineasContenedor.forEach(function (detalle) {
//       let cantidadCedi = parseFloat(detalle.total_cedi) || 0;
//       totales_cedi += isNaN(cantidadCedi) ? 0 : cantidadCedi;
//     });
//   }

//   let totalLeida = calcularTotalUnidadesLeidas();

//   let totalRow = tbody.querySelector(".total-row");
//   if (!totalRow) {
//     totalRow = document.createElement("tr");
//     totalRow.className = "total-row";
//     totalRow.style.backgroundColor = "#fef9c3";
//     tbody.appendChild(totalRow);
//   }

//   totalRow.innerHTML = `
//     <td colspan="2" class="totales-label" style="text-align: center; font-weight: 700; color: #1e293b;">TOTALES GENERALES</td>        
//     <td class="cell-number" style="font-weight: 700;">${totalPedida.toFixed(2)}</td>
//     <td class="cell-number" style="font-weight: 700;">${totalLeida.toFixed(2)}</td>
//     <td class="cell-number" style="font-weight: 700;">${totales_cedi.toFixed(2)}</td>
//     <td class="cell-center"></td> 
//     <td style="display: none;"></td> 
//     <td style="display: none;"></td> 
//   `;

//   actualizarProgresoLectura();
// }

// // =============================================================================
// // 7. GUARDADO Y PROCESAMIENTO
// // =============================================================================
// function confirmarGuardadoParcial() {
//   Swal.fire({
//     icon: "info",
//     title: "¿Desea guardar el avance del contenedor?",
//     showCancelButton: true,
//     confirmButtonText: "Guardar",
//     cancelButtonText: "Cancelar",
//     confirmButtonColor: "#0284c7"
//   }).then((result) => {
//     if (result.isConfirmed) {
//       verificacion();
//       guardaParcialMente();
//     }
//   });
// }

// function guardaParcialMente() {
//   let pSistema = "WMS";
//   let hUser = document.getElementById("hUsuario");
//   let pUsuario = hUser ? hUser.value : "";
//   let pOpcion = "G";
//   let pModulo = "WMS_BC";
//   var pConsecutivo = localStorage.getItem("contenedor");

//   let detalles = [];
//   let pEstado = "";
//   let bodegaInput = document.getElementById("bodega");
//   let pBodegaEnvia = bodegaInput ? bodegaInput.value : "";
//   let pBodegaDestino = localStorage.getItem("bodega_solicita");
//   let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || "";

//   var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
//   var mapaTiempos = {};
//   dataArrayLectura.forEach(function (item) {
//     if (item.ARTICULO && item.TIEMPO_LECTURA) {
//       mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
//     }
//   });

//   let table = document.getElementById("myTableVerificacion");
//   if (table) {
//     for (let i = 1; i < table.rows.length; i++) {
//       let row = table.rows[i];
//       if (row.classList.contains("total-row")) continue;

//       let solicitud = row.querySelector("#solicitud")?.textContent.trim() || "";
//       let articulo = row.querySelector("#verifica-articulo")?.textContent.trim() || "";
//       let cantidadPedida = row.querySelector("#cantidadPedida")?.textContent.trim() || 0;
//       let cantidadLeida = row.querySelector("#cantidadLeida")?.textContent.trim() || 0;

//       let tiempoLecturaAsociado = mapaTiempos[articulo] || "";

//       detalles.push({
//         SOLICITUD: solicitud,
//         ARTICULO: articulo,
//         CANT_CONSEC: cantidadPedida,
//         CANT_LEIDA: cantidadLeida,
//         TIEMPO_LECTURA: tiempoLecturaAsociado
//       });
//     }
//   }

//   var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));

//   const params =
//     "?pSistema=" + pSistema +
//     "&pUsuario=" + pUsuario +
//     "&pOpcion=" + pOpcion +
//     "&pModulo=" + pModulo +
//     "&pConsecutivo=" + pConsecutivo +
//     "&jsonDetalles=" + jsonDetalles +
//     "&pEstado=" + pEstado +
//     "&pBodegaEnvia=" + pBodegaEnvia +
//     "&pBodegaDestino=" + pBodegaDestino +
//     "&pUsuarioAutorizacion=" + pUsuarioAutorizacion;

//   if (typeof mostrarLoader === "function") mostrarLoader("Guardando avance del contenedor...");

//   fetch(env.API_URL + "contenedor" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         Swal.fire({
//           icon: "success",
//           title: "Avance guardado",
//           text: result.message || "Los datos se registraron correctamente.",
//           confirmButtonText: "Aceptar",
//           confirmButtonColor: "#28a745"
//         }).then((res) => {
//           if (res.isConfirmed) {
//             localStorage.setItem("guardado", true);
//             window.location.reload();
//           }
//         });
//       }
//     })
//     .finally(() => {
//       if (typeof ocultarLoader === "function") ocultarLoader();
//     });
// }

// function confirmaProcesar() {
//   Swal.fire({
//     icon: "warning",
//     title: "¿Desea procesar el contenedor?",
//     showCancelButton: true,
//     confirmButtonText: "Continuar",
//     cancelButtonText: "Cancelar",
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881"
//   }).then((result) => {
//     if (result.isConfirmed) {
//       if (validarVerificacion()) {
//         procesarContenedor();
//       } else {
//         Swal.fire({
//           title: "Requiere Autorización",
//           html:
//             '<p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">El contenedor presenta discrepancias con lo solicitado.</p>' +
//             '<input id="swal-input1" class="swal2-input" placeholder="Usuario Supervisor" autocomplete="off">' +
//             '<input id="swal-input2" class="swal2-input" placeholder="Contraseña" type="password" autocomplete="off">',
//           focusConfirm: false,
//           showCancelButton: true,
//           confirmButtonText: "Aprobar",
//           cancelButtonText: "Cancelar",
//           confirmButtonColor: "#28a745",
//           cancelButtonColor: "#6e7881",
//           preConfirm: () => {
//             const usuario = document.getElementById("swal-input1").value.toUpperCase();
//             const pass = document.getElementById("swal-input2").value;
//             return { usuario: usuario, contraseña: pass };
//           }
//         }).then((resAuth) => {
//           if (!resAuth.isDismissed && resAuth.value && resAuth.value.usuario && resAuth.value.contraseña) {
//             const params =
//               "?pSistema=WMS&pUsuario=" +
//               resAuth.value.usuario +
//               "&pOpcion=" +
//               resAuth.value.contraseña;

//             fetch(env.API_URL + "wmsautorizaciones" + params)
//               .then((response) => response.json())
//               .then((resultado) => {
//                 if (resultado.autorizacion && resultado.autorizacion[0]?.mensaje === "OK") {
//                   procesarContenedor();
//                 } else {
//                   Swal.fire({
//                     icon: "error",
//                     title: "Credenciales inválidas",
//                     text: "No se autorizó el procesamiento con discrepancias.",
//                     confirmButtonColor: "#ef4444"
//                   });
//                 }
//               })
//               .catch(() => {
//                 Swal.fire({
//                   icon: "error",
//                   title: "Error de red",
//                   text: "No se pudo validar la autorización.",
//                   confirmButtonColor: "#ef4444"
//                 });
//               });
//           }
//         });
//       }
//     }
//   });
// }

// function procesarContenedor() {
//   let pSistema = "WMS";
//   let hUser = document.getElementById("hUsuario");
//   let pUsuario = hUser ? hUser.value : "";
//   let pOpcion = "P";
//   let pModulo = "WMS_BC";
//   var pConsecutivo = localStorage.getItem("contenedor");

//   let detalles = [];
//   let pEstado = "";
//   let bodegaInput = document.getElementById("bodega");
//   let pBodegaEnvia = bodegaInput ? bodegaInput.value : "";
//   let pBodegaDestino = localStorage.getItem("bodega_solicita");
//   let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || "";

//   var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
//   var mapaTiempos = {};
//   dataArrayLectura.forEach(function (item) {
//     if (item.ARTICULO && item.TIEMPO_LECTURA) {
//       mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
//     }
//   });

//   let table = document.getElementById("myTableVerificacion");
//   if (table) {
//     for (let i = 1; i < table.rows.length; i++) {
//       let row = table.rows[i];
//       if (row.classList.contains("total-row")) continue;

//       let solicitud = row.querySelector("#solicitud")?.textContent.trim() || "";
//       let articulo = row.querySelector("#verifica-articulo")?.textContent.trim() || "";
//       let cantidadPedida = row.querySelector("#cantidadPedida")?.textContent.trim() || 0;
//       let cantidadLeida = row.querySelector("#cantidadLeida")?.textContent.trim() || 0;
//       let tiempoLecturaAsociado = mapaTiempos[articulo] || "";

//       detalles.push({
//         SOLICITUD: solicitud,
//         ARTICULO: articulo,
//         CANT_CONSEC: cantidadPedida,
//         CANT_LEIDA: cantidadLeida,
//         TIEMPO_LECTURA: tiempoLecturaAsociado
//       });
//     }
//   }

//   var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));

//   const params =
//     "?pSistema=" + pSistema +
//     "&pUsuario=" + pUsuario +
//     "&pOpcion=" + pOpcion +
//     "&pModulo=" + pModulo +
//     "&pConsecutivo=" + pConsecutivo +
//     "&jsonDetalles=" + jsonDetalles +
//     "&pEstado=" + pEstado +
//     "&pBodegaEnvia=" + pBodegaEnvia +
//     "&pBodegaDestino=" + pBodegaDestino +
//     "&pUsuarioAutorizacion=" + pUsuarioAutorizacion;

//   if (typeof mostrarLoader === "function") mostrarLoader("Procesando contenedor...");

//   fetch(env.API_URL + "contenedor" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         Swal.fire({
//           icon: "success",
//           title: "Contenedor procesado",
//           text: result.message || "Procesamiento completado con éxito.",
//           confirmButtonText: "Aceptar",
//           confirmButtonColor: "#28a745"
//         }).then((res) => {
//           if (res.isConfirmed) {
//             localStorage.removeItem("desprachoIniciado");
//             window.location.href = "BusquedaDeContenedores.html";
//           }
//         });
//       }
//     })
//     .finally(() => {
//       if (typeof ocultarLoader === "function") ocultarLoader();
//     });
// }

// // =============================================================================
// //8. VALIDACIÓN DINÁMICA DE BOTONES (GUARDAR Y PROCESAR)
// // =============================================================================
// function verificarEstadoBotones() {
//   const contenDetalleOPC = localStorage.getItem("contenDetalleOPC");
//   const btnGuardar = document.getElementById("btnGuardar");
//   const btnProcesar = document.getElementById("btnProcesar");
//   const btnGuardarLectura = document.getElementById("btnGuardarLectura");

//   // Si el contenedor ya fue procesado/autorizado ("A"), se bloquean las acciones
//   if (contenDetalleOPC === "A") {
//     if (btnProcesar) btnProcesar.style.display = "none";
//     if (btnGuardar) btnGuardar.style.display = "none";
//     if (btnGuardarLectura) btnGuardarLectura.style.display = "none";
//     return;
//   }

//   const tablaVerificacion = document.getElementById("myTableVerificacion");
//   if (!tablaVerificacion) return;

//   // Seleccionar todas las filas ignorando la de totales
//   const filas = tablaVerificacion.querySelectorAll("tbody tr:not(.total-row)");
  
//   let hayAlMenosUnaLectura = false;
//   let todasCompletadasSuficientes = true;

//   if (filas.length === 0) {
//     todasCompletadasSuficientes = false;
//   }

//   filas.forEach((fila) => {
//     const cantPedida = parseFloat(fila.querySelector("#cantidadPedida")?.textContent) || 0;
//     const cantLeida = parseFloat(fila.querySelector("#cantidadLeida")?.textContent) || 0;

//     if (cantLeida > 0) {
//       hayAlMenosUnaLectura = true;
//     }
    
//     // Si al menos una línea no alcanza lo solicitado, se bloquea el procesamiento
//     if (cantLeida < cantPedida) {
//       todasCompletadasSuficientes = false;
//     }
//   });

//   // Habilitar Guardar si hay al menos una lectura
//   if (btnGuardar) btnGuardar.style.display = hayAlMenosUnaLectura ? "inline-flex" : "none";
//   if (btnGuardarLectura) btnGuardarLectura.style.display = hayAlMenosUnaLectura ? "inline-flex" : "none";

//   // Habilitar Procesar solo si TODAS las líneas cumplen
//   if (btnProcesar) btnProcesar.style.display = todasCompletadasSuficientes ? "inline-flex" : "none";
// }

// function validarVerificacion() {
//   var celdasVerificacion = document.querySelectorAll("#tblbodyLineasContenedor td#verificado");
//   if (celdasVerificacion.length === 0) return false;

//   for (var i = 0; i < celdasVerificacion.length; i++) {
//     var spanVerificacion = celdasVerificacion[i].querySelector("i.material-icons, span.material-icons");
//     if (!spanVerificacion || spanVerificacion.textContent !== "done_all") {
//       return false;
//     }
//   }
//   return true;
// }

// function mostrarMensajesLocalStorage() {
//   const mensajesStorage = localStorage.getItem("mensajes");
//   const textarea = document.getElementById("mensajeText");
//   if (!textarea) return;

//   textarea.value = "";
//   if (mensajesStorage) {
//     const mensajes = JSON.parse(mensajesStorage);
//     for (let i = 0; i < mensajes.length; i++) {
//       textarea.value += mensajes[i] + "\n";
//     }
//   }
// }

// function retornarVistaAnterior() {
//   localStorage.removeItem("mensajes");
//   window.location.href = "BusquedaDeContenedores.html";
// }

// function mostrarInfoColores() {
//   Swal.fire({
//     title: "<strong>Guía de Operación y Colores</strong>",
//     icon: "info",
//     html: `
//       <div style="text-align: left; font-size: 13.5px; line-height: 1.55; max-height: 400px; overflow-y: auto; padding-right: 6px;">
//         <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 0;">
//           Colores de Verificación
//         </h6>
//         <p style="margin: 4px 0;">• <strong style="color: #28a745;">Verde:</strong> Líneas verificadas que ya se encuentran guardadas en la Base de Datos.</p>
//         <p style="margin: 4px 0;">• <strong style="color: #ea580c;">Naranja:</strong> Líneas completas en memoria técnica local pendientes de guardar.</p>
//         <p style="margin: 4px 0;">• <strong style="color: #64748b;">Sin Color:</strong> Líneas sin conteo registrado.</p>

//         <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 14px;">
//           Flujo de Trabajo
//         </h6>
//         <p style="margin: 4px 0;">1. Escanee en la pestaña <strong>Lectura</strong> para sumar cantidades.</p>
//         <p style="margin: 4px 0;">2. Puede editar manualmente la columna <strong>Cant. Leída</strong> en Verificación haciendo clic sobre la celda.</p>
//         <p style="margin: 4px 0;">3. Presione <strong>Guardar</strong> para persistir su avance en la base de datos.</p>
//       </div>
//     `,
//     showCloseButton: true,
//     confirmButtonColor: "#28a745",
//     confirmButtonText: "Entendido"
//   });
// }

// function modificarCantidadManual(celda, articuloCodigo) {
//   let nuevaCantidad = parseFloat(celda.textContent.trim());

//   if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
//     nuevaCantidad = 0;
//     celda.textContent = "0.00";
//   } else {
//     celda.textContent = nuevaCantidad.toFixed(2);
//   }

//   if (Array.isArray(detalleLineasContenedor)) {
//     let itemBD = detalleLineasContenedor.find(p => p.Articulo === articuloCodigo);
//     if (itemBD) {
//       itemBD.LineaContada = nuevaCantidad;
//     }
//   }

//   let dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
//   dataArray = dataArray.filter(item => item.ARTICULO !== articuloCodigo);
//   localStorage.setItem("dataArray", JSON.stringify(dataArray));

//   verificacion();
//   actualizarTotalesTablaVerificacion();
// }

// // // =============================================================================
// // // 1. VARIABLES GLOBALES E INICIALIZACIÓN
// // // =============================================================================
// // var detalleLineasContenedor = [];

// // document.addEventListener("DOMContentLoaded", function () {
// //   loadSwitchState();

// //   if (localStorage.getItem("contenedor")) {
// //     let contenedor = localStorage.getItem("contenedor");
// //     let bodegaSolicita = localStorage.getItem("bodega_solicita");
// //     let estado_Pdt = localStorage.getItem("estado_Pdt");
// //     cargarDetalleContenedor(contenedor, bodegaSolicita, estado_Pdt);
// //   } else {
// //     Swal.fire({
// //       icon: "info",
// //       title: "No hay contenedor seleccionado",
// //       text: "Por favor elija un contenedor en la pantalla de búsqueda.",
// //       confirmButtonColor: "#28a745"
// //     });
// //   }

// //   configurarBotonesPorEstado();
// //   verificacion();
// // });

// // window.onload = function () {
// //   guardarTablaEnArray();
// // };

// // function loadSwitchState() {
// //   let storedState = localStorage.getItem("switchLecturaState_Contenedor");
// //   let switchState = storedState !== null ? storedState === "true" : false;

// //   let toggleSwitch = document.getElementById("toggleSwitchLectura");
// //   if (toggleSwitch) {
// //     toggleSwitch.checked = switchState;
// //   }

// //   localStorage.setItem("switchLecturaState_Contenedor", switchState.toString());
// // }

// // function toggleSwitchLecturaState(checkbox) {
// //   localStorage.setItem("switchLecturaState_Contenedor", checkbox.checked);
// // }

// // // =============================================================================
// // // 2. CARGA DE DATOS (API & BD)
// // // =============================================================================
// // function cargarDetalleContenedor(contenedor, bodegaSolicita, estado_Pdt) {
// //   let pSistema = "WMS";
// //   let hUser = document.getElementById("hUsuario");
// //   let pUsuario = hUser ? hUser.value : "";
// //   let guardado = localStorage.getItem("guardado");

// //   let pOpcion = guardado ? "LW" : "L";
// //   let bodegaInput = document.getElementById("bodega");
// //   let pBodegaEnvia = bodegaInput ? bodegaInput.value : "";
// //   let pBodegaSolicita = bodegaSolicita;
// //   let pConsecutivo = contenedor;
// //   let pEstado = estado_Pdt;

// //   const elContenedor = document.getElementById("contenedor");
// //   const elBodega = document.getElementById("bodega_solicita");

// //   if (elContenedor) elContenedor.textContent = contenedor;
// //   if (elBodega) elBodega.textContent = bodegaSolicita;

// //   const params =
// //     "?pSistema=" + pSistema +
// //     "&pUsuario=" + pUsuario +
// //     "&pOpcion=" + pOpcion +
// //     "&pBodegaEnvia=" + pBodegaEnvia +
// //     "&pBodegaSolicita=" + pBodegaSolicita +
// //     "&pConsecutivo=" + pConsecutivo +
// //     "&pEstado=" + pEstado;

// //   if (typeof mostrarLoader === "function") mostrarLoader("Cargando líneas de contenedor...");

// //   fetch(env.API_URL + "contenedor" + params, myInit)
// //     .then((response) => response.json())
// //     .then((result) => {
// //       if (result.msg === "SUCCESS") {
// //         if (result.contenedor && result.contenedor.length !== 0) {
// //           detalleLineasContenedor = result.contenedor;
// //           const siGuardadoParcial = detalleLineasContenedor.some(
// //             (detalle) =>
// //               detalle.LineaContada != null &&
// //               detalle.LineaContada !== "" &&
// //               parseFloat(detalle.LineaContada) > 0
// //           );

// //           armarTablaVerificacion(detalleLineasContenedor);
// //           if (siGuardadoParcial) {
// //             guardarTablaEnArray();
// //           }
// //         } else {
// //           Swal.fire({
// //             icon: "warning",
// //             title: "Contenedor sin líneas",
// //             text: "El contenedor " + contenedor + " no tiene líneas registradas para verificar.",
// //             confirmButtonColor: "#28a745"
// //           });
// //         }
// //       }
// //     })
// //     .finally(() => {
// //       if (typeof ocultarLoader === "function") ocultarLoader();
// //     });
// // }

// // // =============================================================================
// // // 3. PESTAÑA LECTURA (PISTOLEO Y FILAS DINÁMICAS)
// // // =============================================================================
// // function validarCodigoBarras(input) {
// //   var LineasContenedor = detalleLineasContenedor;
// //   const codbarra = input.value.toUpperCase().trim();
// //   let lecturaKitsActiva = localStorage.getItem("switchLecturaState_Contenedor") === "true";

// //   if (codbarra === "") return;

// //   const row = input.closest("tr");
// //   const span = row.cells[0].querySelector("span");
// //   const cantFila = row.cells[2].querySelector("input");

// //   var codigoValido = false;

// //   for (var i = 0; i < LineasContenedor.length; i++) {
// //     let item = LineasContenedor[i];

// //     let codigosUnidad = item.codigos_barras 
// //       ? item.codigos_barras.split("|").map(c => c.toUpperCase().trim()) 
// //       : [];
// //     let codigosKits = item.codigos_barras_kits 
// //       ? item.codigos_barras_kits.split("|").map(c => c.toUpperCase().trim()) 
// //       : [];

// //     let esCodigoUnidad = (item.Articulo && item.Articulo.toUpperCase() === codbarra) ||
// //                          (item.Codigo_Barra && item.Codigo_Barra.toUpperCase() === codbarra) ||
// //                          codigosUnidad.includes(codbarra);

// //     let esCodigoKit = (item.ARTICULO_PADRE && item.ARTICULO_PADRE.toUpperCase() === codbarra) ||
// //                        codigosKits.includes(codbarra);

// //     if (esCodigoUnidad || esCodigoKit) {
// //       if (parseFloat(item.total_cedi || 0) <= 0) {
// //         Swal.fire({
// //           icon: "warning",
// //           title: "Artículo sin existencias",
// //           text: "La referencia " + item.Articulo + " no cuenta con stock disponible en CEDI.",
// //           confirmButtonColor: "#28a745"
// //         });
// //         input.value = "";
// //         return;
// //       }

// //       let cantidadASumar = 1;

// //       if (!lecturaKitsActiva) {
// //         if (esCodigoKit && !esCodigoUnidad) {
// //           input.value = "";
// //           Swal.fire({
// //             icon: "warning",
// //             title: "Modo Unidades activo",
// //             text: "Está intentando leer un código por Kit/Caja.",
// //             confirmButtonColor: "#28a745"
// //           });
// //           return;
// //         }
// //       } else {
// //         if (esCodigoUnidad && !esCodigoKit) {
// //           input.value = "";
// //           Swal.fire({
// //             icon: "warning",
// //             title: "Modo Kits activo",
// //             text: "Está intentando leer un código individual.",
// //             confirmButtonColor: "#28a745"
// //           });
// //           return;
// //         }
// //         cantidadASumar = parseFloat(item.cant_kits) || 1;
// //       }

// //       const totalCedi = parseFloat(item.total_cedi) || 0;
// //       const conteoBD = parseFloat(item.LineaContada) || 0;

// //       const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
// //       const lecturaSesionActual = dataArray
// //         .filter((el) => el.ARTICULO === item.Articulo)
// //         .reduce((acum, el) => acum + (parseFloat(el.CANTIDAD_LEIDA) || 0), 0);

// //       const nuevoTotalLeido = conteoBD + lecturaSesionActual + cantidadASumar;

// //       if (nuevoTotalLeido > totalCedi) {
// //         input.value = "";
// //         Swal.fire({
// //           icon: "warning",
// //           title: "Exceso de stock CEDI",
// //           html: `El artículo <b>${item.Articulo}</b> supera la existencia de CEDI.<br>` +
// //                 `Existencia: <b>${totalCedi}</b><br>` +
// //                 `Intento acumulado: <b>${nuevoTotalLeido}</b>`,
// //           confirmButtonColor: "#28a745"
// //         });
// //         return;
// //       }

// //       span.textContent = item.Articulo;
// //       cantFila.value = cantidadASumar;
// //       span.style.color = lecturaKitsActiva ? "#28a745" : "#1e293b";

// //       codigoValido = true;
// //       input.setAttribute("readonly", "readonly");
// //       crearNuevaFila();
// //       guardarTablaEnArray();
// //       verificacion();
// //       break;
// //     }
// //   }

// //   if (!codigoValido) {
// //     input.value = "";
// //     Swal.fire({
// //       icon: "warning",
// //       title: "Código no válido",
// //       text: "El código ingresado no coincide con ningún artículo del contenedor.",
// //       confirmButtonColor: "#28a745"
// //     });
// //   }
// // }

// // function crearNuevaFila() {
// //   actualizarProgresoLectura();
// //   const tableBody = document.querySelector("#tblbodyLectura");
// //   if (!tableBody) return;

// //   const nuevaFilaHTML = `<tr>
// //     <td class="cell-center" style="user-select: none;">
// //       <span style="font-weight: 600; color: #1e293b;"></span>
// //     </td>
// //     <td>
// //       <input type="text" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus autocomplete="off">
// //     </td>
// //     <td>
// //       <input type="text" class="codigo-barras-input" value="" onchange="validarCantidadPedida(this)" autocomplete="off">
// //     </td>
// //     <td class="cell-center">
// //       <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFila(this)">delete</i>
// //     </td>
// //   </tr>`;

// //   tableBody.insertAdjacentHTML("beforeend", nuevaFilaHTML);

// //   if (tableBody.lastElementChild) {
// //     const nuevoInput = tableBody.lastElementChild.cells[1].querySelector("input");
// //     if (nuevoInput) nuevoInput.focus();
// //   }
// // }

// // function validarCantidadPedida() {
// //   guardarTablaEnArray();
// // }

// // function eliminarFila(icon) {
// //   var row = icon.closest("tr");

// //   Swal.fire({
// //     title: "¿Estás seguro?",
// //     text: "Se eliminará esta línea de la lectura de contenedor.",
// //     icon: "warning",
// //     showCancelButton: true,
// //     confirmButtonColor: "#28a745",
// //     cancelButtonColor: "#6e7881",
// //     confirmButtonText: "Sí, eliminar"
// //   }).then((result) => {
// //     if (result.isConfirmed) {
// //       var isEmptyRow = true;
// //       var inputs = row.querySelectorAll("input");
// //       inputs.forEach(function (cell) {
// //         if (cell.value.trim() !== "") isEmptyRow = false;
// //       });

// //       if (isEmptyRow) {
// //         guardarTablaEnArray();
// //         Swal.fire({
// //           icon: "warning",
// //           title: "Línea vacía",
// //           text: "No es necesario eliminar una fila sin lecturas.",
// //           confirmButtonText: "Cerrar",
// //           confirmButtonColor: "#28a745"
// //         });
// //       } else {
// //         row.remove();
// //         const tableBody = document.querySelector("#tblbodyLectura");
// //         if (tableBody && tableBody.lastElementChild) {
// //           const ultimoInput = tableBody.lastElementChild.cells[1].querySelector("input");
// //           if (ultimoInput) ultimoInput.focus();
// //         }
// //         guardarTablaEnArray();
// //       }
// //     }
// //   });
// // }

// // function limpiarMensajes() {
// //   localStorage.removeItem("mensajes");
// //   const mensajeTextArea = document.getElementById("mensajeText");
// //   if (mensajeTextArea) mensajeTextArea.value = "";
// //   guardarTablaEnArray();
// // }

// // // =============================================================================
// // // 4. PERSISTENCIA Y AGRUPACIÓN
// // // =============================================================================
// // function guardarTablaEnArray() {
// //   var dataArray = [];
// //   var localStoragePrevio = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   var tiemposPreviosMap = {};

// //   localStoragePrevio.forEach(function (oldItem) {
// //     if (oldItem.ARTICULO && oldItem.TIEMPO_LECTURA) {
// //       tiemposPreviosMap[oldItem.ARTICULO] = oldItem.TIEMPO_LECTURA;
// //     }
// //   });

// //   var table = document.getElementById("myTableLectura");
// //   if (!table) return [];

// //   var rows = table.getElementsByTagName("tr");

// //   for (var i = 1; i < rows.length; i++) {
// //     var row = rows[i];
// //     if (row.cells.length < 3) continue;

// //     var spanArticulo = row.cells[0].querySelector("span");
// //     var articulo = spanArticulo ? spanArticulo.textContent.trim() : "";

// //     var codigoBarraInput = row.cells[1].querySelector("input");
// //     var cantidadLeidaInput = row.cells[2].querySelector("input");

// //     if (!codigoBarraInput || !cantidadLeidaInput) continue;

// //     var codigoBarra = codigoBarraInput.value;
// //     var cantidadLeida = parseFloat(cantidadLeidaInput.value);

// //     if (articulo !== "" && !isNaN(cantidadLeida)) {
// //       var tiempoAsignado = tiemposPreviosMap[articulo] || new Date();

// //       dataArray.push({
// //         ARTICULO: articulo,
// //         CODIGO_BARRA: codigoBarra,
// //         CANTIDAD_LEIDA: cantidadLeida,
// //         TIEMPO_LECTURA: tiempoAsignado
// //       });
// //     }
// //   }

// //   localStorage.setItem("dataArray", JSON.stringify(dataArray));
// //   agrupar();
// //   return dataArray;
// // }

// // function agrupar() {
// //   var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   var cantidadesConsolidadas = {};

// //   dataArray.forEach(function (item) {
// //     var articulo = item.ARTICULO;
// //     var cantidad = item.CANTIDAD_LEIDA;
// //     var tiempoOriginal = item.TIEMPO_LECTURA || new Date();

// //     if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
// //       cantidadesConsolidadas[articulo].cantidad += cantidad;
// //     } else {
// //       cantidadesConsolidadas[articulo] = {
// //         cantidad: cantidad,
// //         tiempo: tiempoOriginal
// //       };
// //     }
// //   });

// //   var newArray = [];
// //   for (var articulo in cantidadesConsolidadas) {
// //     if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
// //       newArray.push({
// //         ARTICULO: articulo,
// //         CANTIDAD_LEIDA: cantidadesConsolidadas[articulo].cantidad,
// //         TIEMPO_LECTURA: cantidadesConsolidadas[articulo].tiempo
// //       });
// //     }
// //   }

// //   localStorage.setItem("dataArray", JSON.stringify(newArray));
// // }

// // // =============================================================================
// // // 5. PESTAÑA VERIFICACIÓN
// // // =============================================================================
// // function armarTablaVerificacion(detalleLineasContenedor) {
// //   actualizarProgresoLectura();

// //   var tbody = document.getElementById("tblbodyLineasContenedor");
// //   if (!tbody) return;
// //   tbody.innerHTML = "";

// //   var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
// //   if (cantidadDeRegistrosLabel) {
// //     cantidadDeRegistrosLabel.textContent =
// //       "Cantidad de registros: " + detalleLineasContenedor.length;
// //   }

// //   var esModificable = localStorage.getItem("contenDetalleOPC") !== "A";

// //   detalleLineasContenedor.forEach(function (detalle) {
// //     var newRow = document.createElement("tr");

// //     var consecutivo = parseFloat(detalle.LineaConsecutivo) || 0;
// //     var contada = parseFloat(detalle.LineaContada) || 0;
// //     var mostrarLineaContada = contada === 0 ? "" : contada.toFixed(2);
// //     var cediVal = parseFloat(detalle.total_cedi) || 0;

// //     var editableAttr = esModificable ? 'contenteditable="true" class="cell-number editable-cantidad"' : 'contenteditable="false" class="cell-number"';
// //     var onblurAttr = esModificable ? `onblur="modificarCantidadManual(this, '${detalle.Articulo}')"` : '';

// //     let colorArticulo = cediVal > 0 ? "#0284c7" : "#ef4444";

// //     newRow.innerHTML = `
// //       <td id="articulo" style="text-align: left;">
// //         <div class="cell-articulo-box">
// //           <span id="verifica-articulo" class="cell-articulo-code" style="color: ${colorArticulo};">${detalle.Articulo}</span>
// //           <span class="cell-articulo-desc">${detalle.Descripcion || ""}</span>
// //         </div>
// //       </td>
// //       <td id="codigoDeBarras" class="cell-center">${detalle.Codigo_Barra || ""}</td>
// //       <td id="cantidadPedida" class="cell-number">${consecutivo.toFixed(2)}</td>
// //       <td id="cantidadLeida" ${editableAttr} ${onblurAttr}>${mostrarLineaContada}</td> 
// //       <td id="totalCedi" class="cell-number">${cediVal.toFixed(2)}</td>
// //       <td id="verificado" class="cell-center"></td> 
// //       <td id="articulosEliminado" style="display: none;">${detalle.ARTICULO_ELIMINADO || ""}</td> 
// //       <td id="solicitud" style="display: none;">${detalle.Solicitud || ""}</td>
// //     `;

// //     tbody.appendChild(newRow);
// //   });

// //   verificacion();
// // }

// // function verificacion() {
// //   const tabla = document.getElementById("myTableVerificacion");
// //   if (!tabla) return;

// //   const tbody = tabla.querySelector("tbody");
// //   if (!tbody) return;

// //   const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   const lecturasSesion = {};

// //   dataArray.forEach((item) => {
// //     if (item.ARTICULO) {
// //       const artKey = item.ARTICULO.trim();
// //       const cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
// //       lecturasSesion[artKey] = (lecturasSesion[artKey] || 0) + cant;
// //     }
// //   });

// //   const LineasContenedor = detalleLineasContenedor || [];
// //   const mensajesArray = [];
// //   const filas = tbody.querySelectorAll("tr");

// //   filas.forEach((fila) => {
// //     if (fila.classList.contains("total-row")) return;

// //     const celdaARTICULO = fila.querySelector("#verifica-articulo") || fila.querySelector("h5");
// //     if (!celdaARTICULO) return;

// //     const articuloCodigo = celdaARTICULO.textContent.trim();
// //     const celdaVerificado = fila.querySelector("#verificado");
// //     const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");
// //     const cantPedidaCell = fila.querySelector("#cantidadPedida");

// //     const pedido = LineasContenedor.find((p) => p.Articulo === articuloCodigo);

// //     let conteoBD = pedido ? (parseFloat(pedido.LineaContada) || 0) : 0;
// //     let lecturaSesionActual = parseFloat(lecturasSesion[articuloCodigo]) || 0;

// //     let totalAcumuladoReal = conteoBD + lecturaSesionActual;
// //     let cantidadSolicitada = cantPedidaCell ? (parseFloat(cantPedidaCell.textContent) || 0) : 0;

// //     if (cantidadVerificadaCell) {
// //       cantidadVerificadaCell.textContent = totalAcumuladoReal > 0 ? totalAcumuladoReal.toFixed(2) : "";
// //     }

// //     if (totalAcumuladoReal === 0) {
// //       if (celdaVerificado) celdaVerificado.innerHTML = "";
// //       return;
// //     }

// //     let colorEstado = conteoBD > 0 ? "#28a745" : "#ea580c";
// //     let diferencia = totalAcumuladoReal - cantidadSolicitada;

// //     if (Math.abs(diferencia) <= 0.001) {
// //       if (celdaVerificado) {
// //         celdaVerificado.innerHTML = `<i class="material-icons" style="color: ${colorEstado} !important; font-size: 22px; vertical-align: middle;">done_all</i>`;
// //       }
// //     } else if (diferencia > 0) {
// //       let textoDiferencia = "+" + diferencia.toFixed(2);
// //       if (celdaVerificado) {
// //         celdaVerificado.textContent = textoDiferencia;
// //         celdaVerificado.style.color = "#dc2626";
// //         celdaVerificado.style.fontWeight = "bold";
// //       }
// //       mensajesArray.push(`• El artículo ${articuloCodigo} supera lo solicitado (+${diferencia.toFixed(2)}).`);
// //     } else {
// //       let textoDiferencia = diferencia.toFixed(2);
// //       if (celdaVerificado) {
// //         celdaVerificado.textContent = textoDiferencia;
// //         celdaVerificado.style.color = "#ea580c";
// //         celdaVerificado.style.fontWeight = "bold";
// //       }
// //       mensajesArray.push(`• El artículo ${articuloCodigo} tiene pendiente (${diferencia.toFixed(2)}).`);
// //     }
// //   });

// //   localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
// //   actualizarTotalesTablaVerificacion();
// // }

// // // =============================================================================
// // // 6. TOTALES Y PROGRESO
// // // =============================================================================
// // function calcularTotalUnidadesApreparar() {
// //   let totalPedida = 0;
// //   if (Array.isArray(detalleLineasContenedor)) {
// //     detalleLineasContenedor.forEach(function (detalle) {
// //       let cantidadPedida = parseFloat(detalle.LineaConsecutivo) || 0;
// //       totalPedida += isNaN(cantidadPedida) ? 0 : cantidadPedida;
// //     });
// //   }
// //   return totalPedida;
// // }

// // function calcularTotalUnidadesLeidas() {
// //   let totalLeidoDB = 0;
// //   if (Array.isArray(detalleLineasContenedor)) {
// //     let pOpcion = localStorage.getItem("contenDetalleOPC");
// //     totalLeidoDB = detalleLineasContenedor.reduce((acum, item) => {
// //       let cant = pOpcion === "A" ? parseFloat(item.LineaPreparada) : parseFloat(item.LineaContada);
// //       return acum + (isNaN(cant) ? 0 : cant);
// //     }, 0);
// //   }

// //   let dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   let totalSesionActual = dataArray.reduce((acum, item) => {
// //     let cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
// //     return acum + cant;
// //   }, 0);

// //   return totalLeidoDB + totalSesionActual;
// // }

// // function actualizarProgresoLectura() {
// //   const totalUnidadesApreparar = calcularTotalUnidadesApreparar();
// //   const totalUnidadesLeidas = calcularTotalUnidadesLeidas();
// //   const labelProgreso = document.getElementById("progresoLecturaLabel");

// //   if (labelProgreso) {
// //     labelProgreso.textContent = `Progreso: ${totalUnidadesLeidas.toFixed(0)}/${totalUnidadesApreparar.toFixed(0)}`;

// //     if (totalUnidadesLeidas > 0 && totalUnidadesLeidas >= totalUnidadesApreparar) {
// //       labelProgreso.style.color = "#166534";
// //       labelProgreso.style.backgroundColor = "#dcfce7";
// //       labelProgreso.style.borderColor = "#86efac";
// //     } else {
// //       labelProgreso.style.color = "#475569";
// //       labelProgreso.style.backgroundColor = "#f1f5f9";
// //       labelProgreso.style.borderColor = "#cbd5e1";
// //     }
// //   }
// // }

// // function actualizarTotalesTablaVerificacion() {
// //   var tbody = document.getElementById("tblbodyLineasContenedor");
// //   if (!tbody) return;

// //   let totalPedida = calcularTotalUnidadesApreparar();
// //   let totales_cedi = 0;

// //   if (Array.isArray(detalleLineasContenedor)) {
// //     detalleLineasContenedor.forEach(function (detalle) {
// //       let cantidadCedi = parseFloat(detalle.total_cedi) || 0;
// //       totales_cedi += isNaN(cantidadCedi) ? 0 : cantidadCedi;
// //     });
// //   }

// //   let totalLeida = calcularTotalUnidadesLeidas();

// //   let totalRow = tbody.querySelector(".total-row");
// //   if (!totalRow) {
// //     totalRow = document.createElement("tr");
// //     totalRow.className = "total-row";
// //     totalRow.style.backgroundColor = "#fef9c3";
// //     tbody.appendChild(totalRow);
// //   }

// //   totalRow.innerHTML = `
// //     <td colspan="2" class="totales-label" style="text-align: center; font-weight: 700; color: #1e293b;">TOTALES GENERALES</td>        
// //     <td class="cell-number" style="font-weight: 700;">${totalPedida.toFixed(2)}</td>
// //     <td class="cell-number" style="font-weight: 700;">${totalLeida.toFixed(2)}</td>
// //     <td class="cell-number" style="font-weight: 700;">${totales_cedi.toFixed(2)}</td>
// //     <td class="cell-center"></td> 
// //     <td style="display: none;"></td> 
// //     <td style="display: none;"></td> 
// //   `;

// //   actualizarProgresoLectura();
// // }

// // // =============================================================================
// // // 7. GUARDADO Y PROCESAMIENTO
// // // =============================================================================
// // function confirmarGuardadoParcial() {
// //   Swal.fire({
// //     icon: "info",
// //     title: "¿Desea guardar el avance del contenedor?",
// //     showCancelButton: true,
// //     confirmButtonText: "Guardar",
// //     cancelButtonText: "Cancelar",
// //     confirmButtonColor: "#0284c7"
// //   }).then((result) => {
// //     if (result.isConfirmed) {
// //       verificacion();
// //       guardaParcialMente();
// //     }
// //   });
// // }

// // function guardaParcialMente() {
// //   let pSistema = "WMS";
// //   let hUser = document.getElementById("hUsuario");
// //   let pUsuario = hUser ? hUser.value : "";
// //   let pOpcion = "G";
// //   let pModulo = "WMS_BC";
// //   var pConsecutivo = localStorage.getItem("contenedor");

// //   let detalles = [];
// //   let pEstado = "";
// //   let bodegaInput = document.getElementById("bodega");
// //   let pBodegaEnvia = bodegaInput ? bodegaInput.value : "";
// //   let pBodegaDestino = localStorage.getItem("bodega_solicita");
// //   let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || "";

// //   var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   var mapaTiempos = {};
// //   dataArrayLectura.forEach(function (item) {
// //     if (item.ARTICULO && item.TIEMPO_LECTURA) {
// //       mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
// //     }
// //   });

// //   let table = document.getElementById("myTableVerificacion");
// //   if (table) {
// //     for (let i = 1; i < table.rows.length; i++) {
// //       let row = table.rows[i];
// //       if (row.classList.contains("total-row")) continue;

// //       let solicitud = row.querySelector("#solicitud")?.textContent.trim() || "";
// //       let articulo = row.querySelector("#verifica-articulo")?.textContent.trim() || "";
// //       let cantidadPedida = row.querySelector("#cantidadPedida")?.textContent.trim() || 0;
// //       let cantidadLeida = row.querySelector("#cantidadLeida")?.textContent.trim() || 0;

// //       let tiempoLecturaAsociado = mapaTiempos[articulo] || "";

// //       detalles.push({
// //         SOLICITUD: solicitud,
// //         ARTICULO: articulo,
// //         CANT_CONSEC: cantidadPedida,
// //         CANT_LEIDA: cantidadLeida,
// //         TIEMPO_LECTURA: tiempoLecturaAsociado
// //       });
// //     }
// //   }

// //   var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));

// //   const params =
// //     "?pSistema=" + pSistema +
// //     "&pUsuario=" + pUsuario +
// //     "&pOpcion=" + pOpcion +
// //     "&pModulo=" + pModulo +
// //     "&pConsecutivo=" + pConsecutivo +
// //     "&jsonDetalles=" + jsonDetalles +
// //     "&pEstado=" + pEstado +
// //     "&pBodegaEnvia=" + pBodegaEnvia +
// //     "&pBodegaDestino=" + pBodegaDestino +
// //     "&pUsuarioAutorizacion=" + pUsuarioAutorizacion;

// //   if (typeof mostrarLoader === "function") mostrarLoader("Guardando avance del contenedor...");

// //   fetch(env.API_URL + "contenedor" + params, myInit)
// //     .then((response) => response.json())
// //     .then((result) => {
// //       if (result.msg === "SUCCESS") {
// //         Swal.fire({
// //           icon: "success",
// //           title: "Avance guardado",
// //           text: result.message || "Los datos se registraron correctamente.",
// //           confirmButtonText: "Aceptar",
// //           confirmButtonColor: "#28a745"
// //         }).then((res) => {
// //           if (res.isConfirmed) {
// //             localStorage.setItem("guardado", true);
// //             window.location.reload();
// //           }
// //         });
// //       }
// //     })
// //     .finally(() => {
// //       if (typeof ocultarLoader === "function") ocultarLoader();
// //     });
// // }

// // function confirmaProcesar() {
// //   Swal.fire({
// //     icon: "warning",
// //     title: "¿Desea procesar el contenedor?",
// //     showCancelButton: true,
// //     confirmButtonText: "Continuar",
// //     cancelButtonText: "Cancelar",
// //     confirmButtonColor: "#28a745",
// //     cancelButtonColor: "#6e7881"
// //   }).then((result) => {
// //     if (result.isConfirmed) {
// //       if (validarVerificacion()) {
// //         procesarContenedor();
// //       } else {
// //         Swal.fire({
// //           title: "Requiere Autorización",
// //           html:
// //             '<p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">El contenedor presenta discrepancias con lo solicitado.</p>' +
// //             '<input id="swal-input1" class="swal2-input" placeholder="Usuario Supervisor" autocomplete="off">' +
// //             '<input id="swal-input2" class="swal2-input" placeholder="Contraseña" type="password" autocomplete="off">',
// //           focusConfirm: false,
// //           showCancelButton: true,
// //           confirmButtonText: "Aprobar",
// //           cancelButtonText: "Cancelar",
// //           confirmButtonColor: "#28a745",
// //           cancelButtonColor: "#6e7881",
// //           preConfirm: () => {
// //             const usuario = document.getElementById("swal-input1").value.toUpperCase();
// //             const pass = document.getElementById("swal-input2").value;
// //             return { usuario: usuario, contraseña: pass };
// //           }
// //         }).then((resAuth) => {
// //           if (!resAuth.isDismissed && resAuth.value && resAuth.value.usuario && resAuth.value.contraseña) {
// //             const params =
// //               "?pSistema=WMS&pUsuario=" +
// //               resAuth.value.usuario +
// //               "&pOpcion=" +
// //               resAuth.value.contraseña;

// //             fetch(env.API_URL + "wmsautorizaciones" + params)
// //               .then((response) => response.json())
// //               .then((resultado) => {
// //                 if (resultado.autorizacion && resultado.autorizacion[0]?.mensaje === "OK") {
// //                   procesarContenedor();
// //                 } else {
// //                   Swal.fire({
// //                     icon: "error",
// //                     title: "Credenciales inválidas",
// //                     text: "No se autorizó el procesamiento con discrepancias.",
// //                     confirmButtonColor: "#ef4444"
// //                   });
// //                 }
// //               })
// //               .catch(() => {
// //                 Swal.fire({
// //                   icon: "error",
// //                   title: "Error de red",
// //                   text: "No se pudo validar la autorización.",
// //                   confirmButtonColor: "#ef4444"
// //                 });
// //               });
// //           }
// //         });
// //       }
// //     }
// //   });
// // }

// // function procesarContenedor() {
// //   let pSistema = "WMS";
// //   let hUser = document.getElementById("hUsuario");
// //   let pUsuario = hUser ? hUser.value : "";
// //   let pOpcion = "P";
// //   let pModulo = "WMS_BC";
// //   var pConsecutivo = localStorage.getItem("contenedor");

// //   let detalles = [];
// //   let pEstado = "";
// //   let bodegaInput = document.getElementById("bodega");
// //   let pBodegaEnvia = bodegaInput ? bodegaInput.value : "";
// //   let pBodegaDestino = localStorage.getItem("bodega_solicita");
// //   let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || "";

// //   var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   var mapaTiempos = {};
// //   dataArrayLectura.forEach(function (item) {
// //     if (item.ARTICULO && item.TIEMPO_LECTURA) {
// //       mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
// //     }
// //   });

// //   let table = document.getElementById("myTableVerificacion");
// //   if (table) {
// //     for (let i = 1; i < table.rows.length; i++) {
// //       let row = table.rows[i];
// //       if (row.classList.contains("total-row")) continue;

// //       let solicitud = row.querySelector("#solicitud")?.textContent.trim() || "";
// //       let articulo = row.querySelector("#verifica-articulo")?.textContent.trim() || "";
// //       let cantidadPedida = row.querySelector("#cantidadPedida")?.textContent.trim() || 0;
// //       let cantidadLeida = row.querySelector("#cantidadLeida")?.textContent.trim() || 0;
// //       let tiempoLecturaAsociado = mapaTiempos[articulo] || "";

// //       detalles.push({
// //         SOLICITUD: solicitud,
// //         ARTICULO: articulo,
// //         CANT_CONSEC: cantidadPedida,
// //         CANT_LEIDA: cantidadLeida,
// //         TIEMPO_LECTURA: tiempoLecturaAsociado
// //       });
// //     }
// //   }

// //   var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));

// //   const params =
// //     "?pSistema=" + pSistema +
// //     "&pUsuario=" + pUsuario +
// //     "&pOpcion=" + pOpcion +
// //     "&pModulo=" + pModulo +
// //     "&pConsecutivo=" + pConsecutivo +
// //     "&jsonDetalles=" + jsonDetalles +
// //     "&pEstado=" + pEstado +
// //     "&pBodegaEnvia=" + pBodegaEnvia +
// //     "&pBodegaDestino=" + pBodegaDestino +
// //     "&pUsuarioAutorizacion=" + pUsuarioAutorizacion;

// //   if (typeof mostrarLoader === "function") mostrarLoader("Procesando contenedor...");

// //   fetch(env.API_URL + "contenedor" + params, myInit)
// //     .then((response) => response.json())
// //     .then((result) => {
// //       if (result.msg === "SUCCESS") {
// //         Swal.fire({
// //           icon: "success",
// //           title: "Contenedor procesado",
// //           text: result.message || "Procesamiento completado con éxito.",
// //           confirmButtonText: "Aceptar",
// //           confirmButtonColor: "#28a745"
// //         }).then((res) => {
// //           if (res.isConfirmed) {
// //             localStorage.removeItem("desprachoIniciado");
// //             window.location.href = "BusquedaDeContenedores.html";
// //           }
// //         });
// //       }
// //     })
// //     .finally(() => {
// //       if (typeof ocultarLoader === "function") ocultarLoader();
// //     });
// // }

// // // =============================================================================
// // // 8. UTILIDADES
// // // =============================================================================
// // function configurarBotonesPorEstado() {
// //   const contenDetalleOPC = localStorage.getItem("contenDetalleOPC");
// //   const btnProcesar = document.getElementById("btnProcesar");
// //   const btnGuardar = document.getElementById("btnGuardar");
// //   const btnGuardarLectura = document.getElementById("btnGuardarLectura");
// //   const btnRetornar = document.getElementById("btnRetornar");

// //   if (contenDetalleOPC === "A") {
// //     // Si ya está procesado/finalizado, solo permite lectura y retorno
// //     if (btnProcesar) btnProcesar.setAttribute("hidden", "hidden");
// //     if (btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
// //     if (btnGuardarLectura) btnGuardarLectura.setAttribute("hidden", "hidden");
// //     if (btnRetornar) btnRetornar.removeAttribute("hidden");
// //   } else {
// //     if (btnProcesar) btnProcesar.removeAttribute("hidden");
// //     if (btnGuardar) btnGuardar.removeAttribute("hidden");
// //     if (btnGuardarLectura) btnGuardarLectura.removeAttribute("hidden");
// //     if (btnRetornar) btnRetornar.setAttribute("hidden", "hidden");
// //   }
// // }

// // function validarVerificacion() {
// //   var celdasVerificacion = document.querySelectorAll("#tblbodyLineasContenedor td#verificado");
// //   if (celdasVerificacion.length === 0) return false;

// //   for (var i = 0; i < celdasVerificacion.length; i++) {
// //     var spanVerificacion = celdasVerificacion[i].querySelector("i.material-icons, span.material-icons");
// //     if (!spanVerificacion || spanVerificacion.textContent !== "done_all") {
// //       return false;
// //     }
// //   }
// //   return true;
// // }

// // function mostrarMensajesLocalStorage() {
// //   const mensajesStorage = localStorage.getItem("mensajes");
// //   const textarea = document.getElementById("mensajeText");
// //   if (!textarea) return;

// //   textarea.value = "";
// //   if (mensajesStorage) {
// //     const mensajes = JSON.parse(mensajesStorage);
// //     for (let i = 0; i < mensajes.length; i++) {
// //       textarea.value += mensajes[i] + "\n";
// //     }
// //   }
// // }

// // function retornarVistaAnterior() {
// //   localStorage.removeItem("mensajes");
// //   window.location.href = "BusquedaDeContenedores.html";
// // }

// // function mostrarInfoColores() {
// //   Swal.fire({
// //     title: "<strong>Guía de Operación y Colores</strong>",
// //     icon: "info",
// //     html: `
// //       <div style="text-align: left; font-size: 13.5px; line-height: 1.55; max-height: 400px; overflow-y: auto; padding-right: 6px;">
// //         <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 0;">
// //           Colores de Verificación
// //         </h6>
// //         <p style="margin: 4px 0;">• <strong style="color: #28a745;">Verde:</strong> Líneas verificadas que ya se encuentran guardadas en la Base de Datos.</p>
// //         <p style="margin: 4px 0;">• <strong style="color: #ea580c;">Naranja:</strong> Líneas completas en memoria técnica local pendientes de guardar.</p>
// //         <p style="margin: 4px 0;">• <strong style="color: #64748b;">Sin Color:</strong> Líneas sin conteo registrado.</p>

// //         <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 14px;">
// //           Flujo de Trabajo
// //         </h6>
// //         <p style="margin: 4px 0;">1. Escanee en la pestaña <strong>Lectura</strong> para sumar cantidades.</p>
// //         <p style="margin: 4px 0;">2. Puede editar manualmente la columna <strong>Cant. Leída</strong> en Verificación haciendo clic sobre la celda.</p>
// //         <p style="margin: 4px 0;">3. Presione <strong>Guardar</strong> para persistir su avance en la base de datos.</p>
// //       </div>
// //     `,
// //     showCloseButton: true,
// //     confirmButtonColor: "#28a745",
// //     confirmButtonText: "Entendido"
// //   });
// // }

// // function modificarCantidadManual(celda, articuloCodigo) {
// //   let nuevaCantidad = parseFloat(celda.textContent.trim());

// //   if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
// //     nuevaCantidad = 0;
// //     celda.textContent = "0.00";
// //   } else {
// //     celda.textContent = nuevaCantidad.toFixed(2);
// //   }

// //   if (Array.isArray(detalleLineasContenedor)) {
// //     let itemBD = detalleLineasContenedor.find(p => p.Articulo === articuloCodigo);
// //     if (itemBD) {
// //       itemBD.LineaContada = nuevaCantidad;
// //     }
// //   }

// //   let dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   dataArray = dataArray.filter(item => item.ARTICULO !== articuloCodigo);
// //   localStorage.setItem("dataArray", JSON.stringify(dataArray));

// //   verificacion();
// //   actualizarTotalesTablaVerificacion();
// // }
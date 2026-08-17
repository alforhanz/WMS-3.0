// =============================================================================
// 1. VARIABLES GLOBALES E INICIALIZACIÓN (DOM Y EVENTOS)
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
      title: "No hay contenedores",
      text: "Lo sentimos, no hay contenedores disponibles en este momento.",
    });
  }

  // Evento de cambio de pestaña para cargar mensajes
  const tabVerificacion = document.querySelector('a[href="#tabla-verificacion"]');
      if (tabVerificacion) {
        tabVerificacion.addEventListener("click", function () {
          verificacion();
          mostrarMensajesLocalStorage();
        });
      }
  // const tabVerificacion = document.querySelector('a[href="#tabla-verificacion"]');
  // if (tabVerificacion) {
  //   tabVerificacion.addEventListener("click", mostrarMensajesLocalStorage);
  // }

  // Ejecución inicial de verificación
  verificacion();
});

window.onload = function () {
  inicializarBotones();
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
  let pUsuario =
    document.getElementById("usuario")?.innerText ||
    document.getElementById("usuario")?.innerHTML || "";
  let guardado = localStorage.getItem("guardado");

  let pOpcion = guardado ? "LW" : "L";
  let pBodegaEnvia = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let pBodegaSolicita = bodegaSolicita;
  let pConsecutivo = contenedor;
  let pEstado = estado_Pdt;

  document.getElementById("contenedor").innerHTML = "Número de Contenedor: " + contenedor;
  document.getElementById("bodega_solicita").innerHTML = "Bodega destino: " + bodegaSolicita;

  const params =
    "?pSistema=" + pSistema +
    "&pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pBodegaEnvia=" + pBodegaEnvia +
    "&pBodegaSolicita=" + pBodegaSolicita +
    "&pConsecutivo=" + pConsecutivo +
    "&pEstado=" + pEstado;

  mostrarLoader();
  fetch(env.API_URL + "contenedor" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
            console.log('LINEAS DEL CONTENEDOR')
            console.log(result.contenedor)
        if (result.contenedor && result.contenedor.length !== 0) {
          detalleLineasContenedor = result.contenedor;
          const siGuardadoParcial = detalleLineasContenedor.some(
            (detalle) =>
              detalle.LineaContada != null &&
              detalle.LineaContada !== "" &&
              detalle.LineaContada != 0
          );
          
          armarTablaVerificacion(detalleLineasContenedor);
          if (siGuardadoParcial) {
            guardarTablaEnArray();
          }
        } else {
          Swal.fire({
            icon: "warning",
            title: "¡Contenedor sin líneas!",
            text: "El contenedor " + contenedor + " no cuenta con líneas para verificar",
            confirmButtonColor: "#28a745",
          });
        }
      }
    })
    .finally(() => {
      ocultarLoader();
    });
}

// =============================================================================
// 3. PESTAÑA LECTURA (PISTOLEO Y FILAS DINÁMICAS)
// =============================================================================
function validarCodigoBarras(input) {
  var LineasContenedor = detalleLineasContenedor;
  const codbarra = input.value.toUpperCase().trim();
  let lecturaKitsActiva = localStorage.getItem("switchLecturaState_Contenedor") === "true";

  const row = input.closest("tr");
  const firstTd = row.querySelector("td:first-child");
  const span = firstTd.querySelector("span");
  const siguienteTd = row.querySelector(".codigo-barras-cell2");
  const cantFila = siguienteTd.querySelector(".codigo-barras-input");

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
      if (item.total_cedi <= 0) {
        Swal.fire({
          icon: "warning",
          title: "¡Artículo sin Existencias!",
          text: "La referencia " + item.Articulo + " no cuenta con existencias",
          confirmButtonColor: "#28a745",
        });
        input.value = "";
        return;
      }

      if (!lecturaKitsActiva) {
        if (esCodigoKit && !esCodigoUnidad) {
          input.value = "";
          Swal.fire({
            icon: "warning",
            title: "Alerta: Lectura por Unidades activada",
            text: "Está intentando leer un código por kit o caja. Active el switch para lectura por Kit/Caja.",
            confirmButtonColor: "#28a745",
          });
          return;
        }

        span.textContent = item.Articulo;
        cantFila.value = 1;
        span.style.color = "";
      } else {
        if (esCodigoUnidad && !esCodigoKit) {
          input.value = "";
          Swal.fire({
            icon: "warning",
            title: "Alerta: Lectura por Kits/Cajas activada",
            text: "Está intentando leer un código individual. Desactive el switch para lectura por Unidad.",
            confirmButtonColor: "#28a745",
          });
          return;
        }

        let unidadesPorKit = parseFloat(item.cant_kits) || 1;
        span.textContent = item.Articulo;
        cantFila.value = unidadesPorKit;
        span.style.color = "#28a745";
      }

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
      title: "¡Código no válido!",
      text: "El código ingresado no coincide con ningún artículo del pedido. Intente nuevamente.",
      confirmButtonColor: "#28a745",
    });
  }
}

function crearNuevaFila() {
  actualizarProgresoLectura();
  const tableBody = document.querySelector("#tblbodyLectura");
  tableBody.classList.add("display", "centered");

  const nuevaFilaHTML = `<tr>
    <td class="sticky-column" style="text-align: center;"><span style="display: inline-block;"></span></td>
    <td class="codigo-barras-cell" style="text-align: center;">
        <input type="text" style="text-align: center;" id="codigo-barras" class="codigo-barras-input" 
        value="" onchange="validarCodigoBarras(this)" autofocus >
    </td>
    <td class="codigo-barras-cell2" style="text-align: center;">
        <input id="cant-pedida" style="text-align: center;" type="text" class="codigo-barras-input" 
        value="" onchange="validarCantidadPedida(this)" >
    </td>
    <td class="codigo-barras-cell2" style="text-align: center;">
        <i class="material-icons red-text" style="cursor: pointer;" onclick="eliminarFila(this)">clear</i>
    </td>
</tr>`;

  tableBody.insertAdjacentHTML("beforeend", nuevaFilaHTML);

  const nuevoCodigoBarrasInput = tableBody.querySelector(
    "tr:last-child .codigo-barras-input"
  );
  if (nuevoCodigoBarrasInput) {
    nuevoCodigoBarrasInput.focus();
  }
}

function validarCantidadPedida() {
  guardarTablaEnArray();
}

function eliminarFila(icon) {
  var row = icon.closest("tr");

  Swal.fire({
    title: "¿Estás seguro?",
    text: "A continuación se va a eliminar una fila de la pestaña lectura",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Sí, eliminar",
  }).then((result) => {
    if (result.isConfirmed) {
      var isEmptyRow = true;
      var cells = row.querySelectorAll(".codigo-barras-input");
      cells.forEach(function (cell) {
        if (cell.value.trim() !== "") {
          isEmptyRow = false;
        }
      });

      if (isEmptyRow) {
        guardarTablaEnArray();
        Swal.fire({
          icon: "warning",
          title: "Está intentando borrar una fila vacía",
          confirmButtonText: "Cerrar",
        });
      } else {
        row.remove();
        const tableBody = document.querySelector("#tblbodyLectura");
        const ultimoCodigoBarrasInput = tableBody.querySelector(
          "tr:last-child .codigo-barras-input"
        );
        if (ultimoCodigoBarrasInput) {
          ultimoCodigoBarrasInput.focus();
        }
        guardarTablaEnArray();
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
// 4. PERSISTENCIA DE DATOS Y AGRUPACIÓN EN LOCALSTORAGE
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
    var cells = row.getElementsByTagName("td");

    var articulo = cells[0].querySelector("span")?.textContent.trim();
    var codigoBarraInput = cells[1].querySelector(".codigo-barras-input");
    var cantidadLeidaInput = cells[2].querySelector(".codigo-barras-input");

    if (!codigoBarraInput || !cantidadLeidaInput) continue;

    var codigoBarra = codigoBarraInput.value;
    var cantidadLeida = parseFloat(cantidadLeidaInput.value);

    if (articulo !== null && articulo !== "" && !isNaN(cantidadLeida)) {
      var tiempoAsignado = tiemposPreviosMap[articulo] || new Date();

      var rowData = {
        ARTICULO: articulo,
        CODIGO_BARRA: codigoBarra,
        CANTIDAD_LEIDA: cantidadLeida,
        TIEMPO_LECTURA: tiempoAsignado,
      };

      dataArray.push(rowData);
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
        tiempo: tiempoOriginal,
      };
    }
  });

  var newArray = [];
  for (var articulo in cantidadesConsolidadas) {
    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      newArray.push({
        ARTICULO: articulo,
        CANTIDAD_LEIDA: cantidadesConsolidadas[articulo].cantidad,
        TIEMPO_LECTURA: cantidadesConsolidadas[articulo].tiempo,
      });
    }
  }

  localStorage.setItem("dataArray", JSON.stringify(newArray));
}

function registrarLecturaEnLocalStorage(articulo, cantidad) {
  let acumulado = JSON.parse(localStorage.getItem("acumuladoLecturas")) || {};
  let cant = parseFloat(cantidad) || 0;
  acumulado[articulo] = (acumulado[articulo] || 0) + cant;

  localStorage.setItem("acumuladoLecturas", JSON.stringify(acumulado));
  verificacion();
}

// =============================================================================
// 5. PESTAÑA VERIFICACIÓN Y CONTROL DE AVANCE
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

  detalleLineasContenedor.forEach(function (detalle) {
    var newRow = document.createElement("tr");

    var consecutivo = parseFloat(detalle.LineaConsecutivo) || 0;
    var contada = parseFloat(detalle.LineaContada) || 0;
    var mostrarLineaContada = contada === 0 ? "" : contada.toFixed(2);

    if (detalle.total_cedi > 0) {
      newRow.innerHTML = `
        <td id="articulo">
          <h5 id="verifica-articulo">
            <span class="blue-text text-darken-2 centered">${detalle.Articulo}</span>
          </h5>
          <h6>${detalle.Descripcion}</h6>
        </td>
        <td id="codigoDeBarras">${detalle.Codigo_Barra || ""}</td>
        <td id="cantidadPedida">${consecutivo.toFixed(2)}</td>
        <td id="cantidadLeida">${mostrarLineaContada}</td> 
        <td id="totalCedi">${
          isNaN(parseFloat(detalle.total_cedi))
            ? "0.00"
            : parseFloat(detalle.total_cedi).toFixed(2)
        }</td>
        <td id="verificado"></td> 
        <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
        <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
    } else {
      newRow.innerHTML = `
        <td id="articulo" contenteditable="false">
          <h5 id="verifica-articulo">
            <span class="red-text text-darken-4 centered">${detalle.Articulo}</span>
          </h5>
          <h6 class="red-text text-darken-4">${detalle.Descripcion}</h6>
        </td>
        <td id="codigoDeBarras" contenteditable="false" class="red-text text-darken-4">${detalle.Codigo_Barra || ""}</td>
        <td id="cantidadPedida" contenteditable="false" class="red-text text-darken-4">${consecutivo.toFixed(2)}</td>
        <td id="cantidadLeida" contenteditable="false" class="red-text text-darken-4">${mostrarLineaContada}</td> 
        <td id="totalCedi">0.00</td>
        <td id="verificado" contenteditable="false"></td> 
        <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
        <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
    }
    tbody.appendChild(newRow);
  }); 
  verificacion();
}

function verificacion() {
  const tabla = document.getElementById("myTableVerificacion");
  if (!tabla) return;

  const tbody = tabla.querySelector("tbody");
  if (!tbody) return;

  // 1. Obtener lecturas en memoria/sesión no guardadas desde dataArray
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

    const celdaARTICULO = fila.querySelector("#verifica-articulo span") || fila.querySelector("h5");
    if (!celdaARTICULO) return;

    const articuloCodigo = celdaARTICULO.textContent.trim();
    const celdaVerificado = fila.querySelector("#verificado");
    const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");
    const cantPedidaCell = fila.querySelector("#cantidadPedida");

    const pedido = LineasContenedor.find((p) => p.Articulo === articuloCodigo);

    // Conteo proveniente de la Base de Datos
    let conteoBD = pedido ? (parseFloat(pedido.LineaContada) || 0) : 0;
    // Conteo en memoria temporal de la sesión actual
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

    // Determinación del color según la fuente de datos:
    // Si viene guardado en BD es VERDE (#28a745). Si es solo memoria temporal es NARANJA (#e15e0e).
    let colorEstado = conteoBD > 0 ? "#28a745" : "#e15e0e";

    let diferencia = totalAcumuladoReal - cantidadSolicitada;

    if (diferencia === 0) {
      if (celdaVerificado) {
        celdaVerificado.innerHTML = `<span class="material-icons" style="color: ${colorEstado};">done_all</span>`;
      }

      // Pintar la fila completa con el color correspondiente (Verde o Naranja)
      fila.querySelectorAll("td").forEach((celda) => {
        celda.style.color = colorEstado;
        celda.querySelectorAll("h5, h6, span").forEach((el) => {
          el.style.color = colorEstado;
          el.className = el.className.replace(/\b(blue|red)-text\b/g, "");
        });
      });
    } else if (diferencia > 0) {
      let textoDiferencia = "+" + diferencia.toFixed(2);
      if (celdaVerificado) {
        celdaVerificado.textContent = textoDiferencia;
        celdaVerificado.style.color = "#d32f2f";
        celdaVerificado.style.fontWeight = "bold";
      }
      mensajesArray.push(`*La cantidad del artículo ${articuloCodigo} supera la solicitada (+${diferencia.toFixed(2)}).`);
    } else {
      let textoDiferencia = diferencia.toFixed(2);
      if (celdaVerificado) {
        celdaVerificado.textContent = textoDiferencia;
        celdaVerificado.style.color = "#f57c00";
        celdaVerificado.style.fontWeight = "bold";
      }
      mensajesArray.push(`>La cantidad del artículo ${articuloCodigo} es inferior a la solicitada (${diferencia.toFixed(2)}).`);
    }
  });

  localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
  actualizarTotalesTablaVerificacion();
}

// =============================================================================
// 6. CÁLCULO DE TOTALES Y PROGRESO DE LECTURA
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
      labelProgreso.style.color = "#28a745";
      labelProgreso.style.fontWeight = "bold";
    } else {
      labelProgreso.style.color = "initial";
      labelProgreso.style.fontWeight = "normal";
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
    totalRow.style.backgroundColor = "#fff9c4";
    tbody.appendChild(totalRow);
  }

  totalRow.innerHTML = `
    <td colspan="2" class="totales-label" style="text-align: center; font-weight: bold;"><em>Totales</em></td>        
    <td id="totalPedidaRow" style="font-weight: bold;"><em>${totalPedida.toFixed(2)}</em></td>
    <td id="totalLeidaRow" style="font-weight: bold;"><em>${totalLeida.toFixed(2)}</em></td>
    <td id="totalCediRow" style="font-weight: bold;"><em>${totales_cedi.toFixed(2)}</em></td>
    <td id="totalVerifRow"></td> 
    <td hidden></td> 
    <td hidden></td> 
  `;

  actualizarProgresoLectura();
}

// =============================================================================
// 7. ACCIONES DE GUARDADO Y PROCESAMIENTO (API)
// =============================================================================
function confirmarGuardadoParcial() {
  Swal.fire({
    icon: "info",
    title: "¿A continuación se guardarán los datos leídos del contenedor...?",
    showCancelButton: true,
    confirmButtonText: "Continuar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
  }).then((result) => {
    if (result.isConfirmed) {
      verificacion();
      guardaParcialMente();
    }
  });
}

function guardaParcialMente() {
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario") ? document.getElementById("hUsuario").value : "";
  let pOpcion = "G";
  let pModulo = "WMS_BC";
  var pConsecutivo = localStorage.getItem("contenedor");

  let detalles = [];
  let pEstado = "";
  let pBodegaEnvia = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
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
    for (let i = 1; i < table.rows.length - 1; i++) {
      let row = table.rows[i];
      let solicitud = row.querySelector("#solicitud")?.textContent.trim() || "";
      let articulo = row.querySelector("#verifica-articulo span")?.textContent.trim() || "";
      let cantidadPedida = row.querySelector("#cantidadPedida")?.textContent.trim() || 0;
      let cantidadLeida = row.querySelector("#cantidadLeida")?.textContent.trim() || 0;

      let tiempoLecturaAsociado = mapaTiempos[articulo] || "";

      var detalle = {
        SOLICITUD: solicitud,
        ARTICULO: articulo,
        CANT_CONSEC: cantidadPedida,
        CANT_LEIDA: cantidadLeida,
        TIEMPO_LECTURA: tiempoLecturaAsociado,
      };

      detalles.push(detalle);
    }
  }

  var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));

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
console.log("Parametros:"+params);
  mostrarLoader();
  fetch(env.API_URL + "contenedor" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.contenedor && result.contenedor.length !== 0) {
          Swal.fire({
            icon: "success",
            title: result.message,
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#28a745",
          }).then((res) => {
            if (res.isConfirmed) {
              localStorage.setItem("guardado", true);
              window.location.reload();
            }
          });
        }
      }
    })
    .finally(() => {
      ocultarLoader();
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
    cancelButtonColor: "#6e7881",
  }).then((result) => {
    if (result.isConfirmed) {
      if (validarVerificacion()) {
        procesarContenedor();
      } else {
        Swal.fire({
          title: "Ingrese sus credenciales",
          html:
            '<input id="swal-input1" class="swal2-input" placeholder="Usuario" autocomplete="off">' +
            '<input id="swal-input2" class="swal2-input" placeholder="Contraseña" type="password" autocomplete="off">',
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: "Aprobar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#28a745",
          cancelButtonColor: "#6e7881",
          preConfirm: () => {
            const usuario = document.getElementById("swal-input1").value.toUpperCase();
            const contraseña = document.getElementById("swal-input2").value;
            return { usuario: usuario, contraseña: contraseña };
          },
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
                if (resultado.autorizacion[0].mensaje === "OK") {
                  procesarContenedor();
                } else {
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Credenciales inválidas",
                  });
                }
              })
              .catch(() => {
                Swal.fire({
                  icon: "error",
                  title: "Error",
                  text: "No se pudo obtener los datos del API",
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
  let pUsuario = document.getElementById("hUsuario") ? document.getElementById("hUsuario").value : "";
  let pOpcion = "P";
  let pModulo = "WMS_BC";
  var pConsecutivo = localStorage.getItem("contenedor");

  let detalles = [];
  let pEstado = "";
  let pBodegaEnvia = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
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
    for (let i = 1; i < table.rows.length - 1; i++) {
      let row = table.rows[i];
      let solicitud = row.querySelector("#solicitud")?.textContent.trim() || "";
      let articulo = row.querySelector("#verifica-articulo span")?.textContent.trim() || "";
      let cantidadPedida = row.querySelector("#cantidadPedida")?.textContent.trim() || 0;
      let cantidadLeida = row.querySelector("#cantidadLeida")?.textContent.trim() || 0;
      let tiempoLecturaAsociado = mapaTiempos[articulo] || "";

      var detalle = {
        SOLICITUD: solicitud,
        ARTICULO: articulo,
        CANT_CONSEC: cantidadPedida,
        CANT_LEIDA: cantidadLeida,
        TIEMPO_LECTURA: tiempoLecturaAsociado,
      };

      detalles.push(detalle);
    }
  }

  var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));

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
      
    console.log("Parametros:"+params);
  fetch(env.API_URL + "contenedor" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.contenedor && result.contenedor.length !== 0) {
          Swal.fire({
            icon: "success",
            title: result.message,
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#28a745",
          }).then((res) => {
            if (res.isConfirmed) {
              localStorage.removeItem("desprachoIniciado");
              window.location.href = "BusquedaDeContenedores.html";
            }
          });
        }
      }
    });
}

// =============================================================================
// 8. UTILIDADES, VISTAS Y MODALES
// =============================================================================
function inicializarBotones() {
  const contenDetalleOPC = localStorage.getItem("contenDetalleOPC");

  const botonProcesar = document.createElement("button");
  const botonGuardarParcial = document.createElement("button");
  const retornar = document.createElement("button");

  botonProcesar.textContent = "Procesar";
  botonProcesar.id = "btnProcesar";
  botonProcesar.hidden = contenDetalleOPC === "A";
  botonProcesar.onclick = confirmaProcesar;

  botonGuardarParcial.textContent = "Guardar";
  botonGuardarParcial.id = "btnGuardar";
  botonGuardarParcial.hidden = contenDetalleOPC === "A";
  botonGuardarParcial.onclick = confirmarGuardadoParcial;

  retornar.textContent = "Retornar";
  retornar.id = "btnRetornar";
  retornar.hidden = contenDetalleOPC !== "A";
  retornar.onclick = retornarVistaAnterior;

  [botonGuardarParcial, botonProcesar, retornar].forEach((btn) => {
    btn.style.backgroundColor = "#28a745";
    btn.style.borderRadius = "5px";
    btn.style.color = "white";
    btn.style.marginTop = "16px";
    btn.style.marginLeft = "16px";
    btn.style.marginRight = "16px";
    btn.style.height = "36px";
    btn.style.width = "100px";
  });

  const pestañaLectura = document.getElementById("tabla-lectura");
  const pestañaVerificacion = document.getElementById("tabla-verificacion");

  if (pestañaLectura) {
    const divBotonesLectura = document.createElement("div");
    divBotonesLectura.appendChild(botonGuardarParcial);
    if (contenDetalleOPC === "A") divBotonesLectura.appendChild(retornar);
    pestañaLectura.appendChild(divBotonesLectura);
  }

  if (pestañaVerificacion) {
    const divBotonesVerif = document.createElement("div");
    divBotonesVerif.appendChild(botonProcesar);
    if (contenDetalleOPC === "A") {
      const retornarVerif = retornar.cloneNode(true);
      retornarVerif.onclick = retornarVistaAnterior;
      divBotonesVerif.appendChild(retornarVerif);
    }
    pestañaVerificacion.appendChild(divBotonesVerif);
  }
}

function validarVerificacion() {
  var celdasVerificacion = document.querySelectorAll(
    "#tblbodyLineasContenedor td#verificado"
  );
  for (var i = 0; i < celdasVerificacion.length; i++) {
    var spanVerificacion = celdasVerificacion[i].querySelector("span.material-icons");
    if (!spanVerificacion || spanVerificacion.textContent !== "done_all") {
      return false;
    }
  }
  return true;
}

function mostrarMensajesLocalStorage() {
  const mensajesStorage = localStorage.getItem("mensajes");
  if (mensajesStorage) {
    const mensajes = JSON.parse(mensajesStorage);
    const textarea = document.getElementById("mensajeText");
    if (textarea) {
      textarea.value = "";
      for (let i = 0; i < mensajes.length; i++) {
        textarea.value += mensajes[i] + "\n";
      }
    }
  }
}

function retornarVistaAnterior() {
  localStorage.removeItem("mensajes");
  window.location.href = "BusquedaDeContenedores.html";
}

function mostrarInfoColores() {
  Swal.fire({
    title: '<strong style="font-family:\'Oswald\',sans-serif;">Guía de Operación y Colores</strong>',
    icon: 'info',
    html: `
      <div style="text-align: left; font-size: 14px; font-family: 'Roboto', sans-serif; line-height: 1.5; max-height: 400px; overflow-y: auto; padding-right: 5px;">
        
        <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 0;">
          🎨 Estados y Colores en Verificación
        </h6>
        <div style="margin-bottom: 15px;">
          <p style="margin: 5px 0;">
            <span style="display:inline-block; width:18px; height:18px; background-color: #4caf50; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
            <strong>Verde:</strong> Líneas completas cuyo conteo ya se encuentra <strong>guardado con éxito en la Base de Datos</strong>.
          </p>
          <p style="margin: 5px 0;">
            <span style="display:inline-block; width:18px; height:18px; background-color: #ff9800; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
            <strong>Naranja:</strong> Líneas completas en memoria técnica que <strong>aún NO se han guardado</strong> en la Base de Datos.
          </p>
          <p style="margin: 5px 0;">
            <span style="display:inline-block; width:18px; height:18px; background-color: #ffffff; border: 1px solid #ccc; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
            <strong>Sin Color:</strong> Líneas del contenedor que todavía no registran ninguna lectura o conteo en el sistema.
          </p>
        </div>

        <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
          🔄 Flujo del Proceso (Picker)
        </h6>
        <ul style="padding-left: 15px; margin: 8px 0; list-style-type: disc;">
          <li style="margin-bottom: 6px;"><strong>Inicio:</strong> Al cargar el contenedor, la pestaña <em>Verificación</em> muestra la columna <strong>CANT Leída vacía</strong>.</li>
          <li style="margin-bottom: 6px;"><strong>Validación de Lectura:</strong> Al escanear una referencia en la pestaña <em>Lectura</em>, el sistema valida que exista en el contenedor y que su código de barras coincida de forma estricta.</li>
          <li style="margin-bottom: 6px;"><strong>Monitoreo en Vivo:</strong> El avance se puede inspeccionar en caliente usando el label <strong>Leído</strong> (Artículos leídos vs. Solicitados) o cambiando a la pestaña <em>Verificación</em>.</li>
          <li style="margin-bottom: 6px;"><strong>Guardado de Datos:</strong> Al pulsar "Guardar" desde la pestaña de lectura, los registros se insertan en la BD y se refresca la grilla.</li>
        </ul>

        <div style="margin-top: 15px; background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 10px; border-radius: 4px;">
          <strong style="color: #e65100; display: block; margin-bottom: 2px;">⚠️ ¡Atención con las recargas!</strong>
          Si la vista se llega a refrescar (F5 / Recargar) por cualquier motivo antes de presionar el botón <strong>Guardar</strong>, toda la información de las lecturas temporales en memoria se perderá de forma definitiva.
        </div>

      </div>
    `,
    showCloseButton: true,
    confirmButtonColor: '#1e88e5',
    confirmButtonText: 'Entendido'
  });
}


// // =============================================================================
// // 1. VARIABLES GLOBALES E INICIALIZACIÓN (DOM)
// // =============================================================================
// var detalleLineasContenedor = [];

// document.addEventListener("DOMContentLoaded", function () {
//   loadSwitchState(); // <-- Cargar estado del switch al iniciar
//   if (localStorage.getItem("contenedor")) {
//     let contenedor = localStorage.getItem("contenedor");
//     let bodegaSolicita = localStorage.getItem("bodega_solicita");
//     let estado_Pdt = localStorage.getItem("estado_Pdt");
//     cargarDetalleContenedor(contenedor, bodegaSolicita, estado_Pdt);
//   } else {
//     Swal.fire({
//       icon: "info",
//       title: "No hay contenedores",
//       text: "Lo sentimos, no hay contenedores disponibles en este momento.",
//     });
//   }
// });


// function loadSwitchState() {
//   let storedState = localStorage.getItem("switchLecturaState_Contenedor");
  
//   // Si no se ha guardado previamente (null o undefined), el valor predeterminado es false
//   let switchState = storedState !== null ? storedState === "true" : false;
  
//   let toggleSwitch = document.getElementById("toggleSwitchLectura");
//   if (toggleSwitch) {
//     toggleSwitch.checked = switchState;
//   }
  
//   // Guardamos el valor por defecto para mantener consistencia
//   localStorage.setItem("switchLecturaState_Contenedor", switchState.toString());
// }

// function toggleSwitchLecturaState(checkbox) {
//   localStorage.setItem("switchLecturaState_Contenedor", checkbox.checked);
// }

// window.onload = function () {
//   inicializarBotones();
//   guardarTablaEnArray();
// };

// document
//   .querySelector('a[href="#tabla-verificacion"]')
//   .addEventListener("click", mostrarMensajesLocalStorage);

// // =============================================================================
// // 2. CARGA DE DATOS (API & BD)
// // =============================================================================
// function cargarDetalleContenedor(contenedor, bodegaSolicita, estado_Pdt) {
//   let pSistema = "WMS";
//   let pUsuario =
//     document.getElementById("usuario").innerText ||
//     document.getElementById("usuario").innerHTML;
//   let guardado = localStorage.getItem("guardado");

//   let pOpcion = guardado ? "LW" : "L";

//   let pBodegaEnvia = document.getElementById("bodega").value;
//   let pBodegaSolicita = bodegaSolicita;
//   let pConsecutivo = contenedor;
//   let pEstado = estado_Pdt;

//   document.getElementById("contenedor").innerHTML =
//     "Número de Contenedor: " + contenedor;
//   document.getElementById("bodega_solicita").innerHTML =
//     "Bodega destino: " + bodegaSolicita;

//   const params =
//     "?pSistema=" +
//     pSistema +
//     "&pUsuario=" +
//     pUsuario +
//     "&pOpcion=" +
//     pOpcion +
//     "&pBodegaEnvia=" +
//     pBodegaEnvia +
//     "&pBodegaSolicita=" +
//     pBodegaSolicita +
//     "&pConsecutivo=" +
//     pConsecutivo +
//     "&pEstado=" +
//     pEstado;

//   mostrarLoader();
//   fetch(env.API_URL + "contenedor" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.contenedor.length !== 0) {
//             console.log('LINEAS DEL CONTENEDOR')
//             console.log(result.contenedor)
//           detalleLineasContenedor = result.contenedor;
//           const siGuardadoParcial = detalleLineasContenedor.some(
//             (detalle) =>
//               detalle.LineaContada != null &&
//               detalle.LineaContada !== "" &&
//               detalle.LineaContada != 0
//           );
//           if (siGuardadoParcial) {
//             armarTablaVerificacion(detalleLineasContenedor);
//             guardarTablaEnArray();
//           } else {
//             armarTablaVerificacion(detalleLineasContenedor);
//           }
//         } else {
//           Swal.fire({
//             icon: "warning",
//             title: "¡Contenedor sin líneas!",
//             text: "El contenedor " + contenedor + " no cuenta con líneas para verificar",
//             confirmButtonColor: "#28a745",
//           });
//         }
//       }
//     })
//     .finally(() => {
//       ocultarLoader();
//     });
// }

// // =============================================================================
// // 3. PESTAÑA LECTURA (PISTOLEO Y MANEJO DE FILAS)
// // =============================================================================
// function validarCodigoBarras(input) {
//   var LineasContenedor = detalleLineasContenedor;
//   const codbarra = input.value.toUpperCase().trim();
//   let lecturaKitsActiva = localStorage.getItem("switchLecturaState_Contenedor") === "true";

//   const row = input.closest("tr");
//   const firstTd = row.querySelector("td:first-child");
//   const span = firstTd.querySelector("span");
//   const siguienteTd = row.querySelector(".codigo-barras-cell2");
//   const cantFila = siguienteTd.querySelector(".codigo-barras-input");

//   var codigoValido = false;

//   for (var i = 0; i < LineasContenedor.length; i++) {
//     let item = LineasContenedor[i];

//     // Arrays para codigos normales y codigos de kits/cajas
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
//       if (item.total_cedi <= 0) {
//         Swal.fire({
//           icon: "warning",
//           title: "¡Artículo sin Existencias!",
//           text: "La referencia " + item.Articulo + " no cuenta con existencias",
//           confirmButtonColor: "#28a745",
//         });
//         input.value = "";
//         return;
//       }

//       // EVALUACIÓN SEGÚN EL MODO DEL SWITCH
//       if (!lecturaKitsActiva) {
//         // MODO LECTURA POR UNIDAD (Switch desmarcado)
//         if (esCodigoKit && !esCodigoUnidad) {
//           input.value = "";
//           Swal.fire({
//             icon: "warning",
//             title: "Alerta: Lectura por Unidades activada",
//             text: "Está intentando leer un código por kit o caja. Active el switch para lectura por Kit/Caja.",
//             confirmButtonColor: "#28a745",
//           });
//           return;
//         }

//         span.textContent = item.Articulo;
//         cantFila.value = 1;
//         span.style.color = "";
//       } else {
//         // MODO LECTURA POR KITS / CAJAS (Switch marcado)
//         if (esCodigoUnidad && !esCodigoKit) {
//           input.value = "";
//           Swal.fire({
//             icon: "warning",
//             title: "Alerta: Lectura por Kits/Cajas activada",
//             text: "Está intentando leer un código individual. Desactive el switch para lectura por Unidad.",
//             confirmButtonColor: "#28a745",
//           });
//           return;
//         }

//         let unidadesPorKit = parseFloat(item.cant_kits) || 1;
//         span.textContent = item.Articulo;
//         cantFila.value = unidadesPorKit;
//         span.style.color = "#28a745"; // Color diferenciador para lectura por kit
//       }

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
//       title: "¡Código no válido!",
//       text: "El código ingresado no coincide con ningún artículo del pedido. Intente nuevamente.",
//       confirmButtonColor: "#28a745",
//     });
//   }
// }

// // function validarCodigoBarras(input) {
// //   var LineasContenedor = detalleLineasContenedor;
// //   const codbarra = input.value.toUpperCase().trim();

// //   const row = input.closest("tr");
// //   const firstTd = row.querySelector("td:first-child");
// //   const span = firstTd.querySelector("span");
// //   const siguienteTd = row.querySelector(".codigo-barras-cell2");
// //   const cantFila = siguienteTd.querySelector(".codigo-barras-input");

// //   var codigoValido = false;

// //   for (var i = 0; i < LineasContenedor.length; i++) {
// //     let codigosArrayArticulo = [];
// //     if (LineasContenedor[i].codigos_barras) {
// //       codigosArrayArticulo = LineasContenedor[i].codigos_barras
// //         .split("|")
// //         .map((codigo) => codigo.toUpperCase().trim());
// //     }

// //     if (
// //       (LineasContenedor[i].Articulo &&
// //         LineasContenedor[i].Articulo.toUpperCase() === codbarra) ||
// //       (LineasContenedor[i].Codigo_Barra &&
// //         LineasContenedor[i].Codigo_Barra.toUpperCase() === codbarra) ||
// //       codigosArrayArticulo.includes(codbarra)
// //     ) {
// //       codigoValido = true;

// //       if (LineasContenedor[i].total_cedi > 0) {
// //         span.textContent = LineasContenedor[i].Articulo;
// //         cantFila.value = 1;
// //         input.setAttribute("readonly", "readonly");

// //         crearNuevaFila();
// //         guardarTablaEnArray();
// //         verificacion();
// //         break;
// //       } else {
// //         Swal.fire({
// //           icon: "warning",
// //           title: "¡Artículo sin Existencias!",
// //           text: "La referencia " + LineasContenedor[i].Articulo + " no cuenta con existencias",
// //           confirmButtonColor: "#28a745",
// //         });
// //         input.value = "";
// //         break;
// //       }
// //     }
// //   }

// //   if (!codigoValido) {
// //     input.value = "";
// //     Swal.fire({
// //       icon: "warning",
// //       title: "¡Código no válido!",
// //       text: "El código ingresado no coincide con ningún artículo del pedido. Intente nuevamente.",
// //       confirmButtonColor: "#28a745",
// //     });
// //   }
// // }

// function crearNuevaFila() {
//   actualizarProgresoLectura();
//   const tableBody = document.querySelector("#tblbodyLectura");
//   tableBody.classList.add("display", "centered");

//   const nuevaFilaHTML = `<tr>
//     <td class="sticky-column" style="text-align: center;"><span style="display: inline-block;"></span></td>
//     <td class="codigo-barras-cell" style="text-align: center;">
//         <input type="text" style="text-align: center;" id="codigo-barras" class="codigo-barras-input" 
//         value="" onchange="validarCodigoBarras(this)" autofocus >
//     </td>
//     <td class="codigo-barras-cell2" style="text-align: center;">
//         <input id="cant-pedida" style="text-align: center;" type="text" class="codigo-barras-input" 
//         value="" onchange="validarCantidadPedida(this)" >
//     </td>
//     <td class="codigo-barras-cell2" style="text-align: center;">
//         <i class="material-icons red-text" style="cursor: pointer;" onclick="eliminarFila(this)">clear</i>
//     </td>
// </tr>`;

//   tableBody.insertAdjacentHTML("beforeend", nuevaFilaHTML);

//   const nuevoCodigoBarrasInput = tableBody.querySelector(
//     "tr:last-child .codigo-barras-input"
//   );
//   if (nuevoCodigoBarrasInput) {
//     nuevoCodigoBarrasInput.focus();
//   }
// }

// function validarCantidadPedida() {
//   guardarTablaEnArray();
// }

// function eliminarFila(icon) {
//   var row = icon.closest("tr");

//   Swal.fire({
//     title: "¿Estás seguro?",
//     text: "A continuación se va a eliminar una fila de la pestaña lectura",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//     confirmButtonText: "Sí, eliminar",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       var isEmptyRow = true;
//       var cells = row.querySelectorAll(".codigo-barras-input");
//       cells.forEach(function (cell) {
//         if (cell.value.trim() !== "") {
//           isEmptyRow = false;
//         }
//       });

//       if (isEmptyRow) {
//         guardarTablaEnArray();
//         Swal.fire({
//           icon: "warning",
//           title: "Está intentando borrar una fila vacía",
//           confirmButtonText: "Cerrar",
//         });
//       } else {
//         row.remove();
//         const tableBody = document.querySelector("#tblbodyLectura");
//         const ultimoCodigoBarrasInput = tableBody.querySelector(
//           "tr:last-child .codigo-barras-input"
//         );
//         if (ultimoCodigoBarrasInput) {
//           ultimoCodigoBarrasInput.focus();
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
// // 4. ESTRUCTURA Y PERSISTENCIA DE DATOS (LOCALSTORAGE & AGRUPACIÓN)
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
//   var rows = table.getElementsByTagName("tr");

//   for (var i = 1; i < rows.length; i++) {
//     var row = rows[i];
//     var cells = row.getElementsByTagName("td");

//     var articulo = cells[0].querySelector("span").textContent.trim();
//     var codigoBarraInput = cells[1].querySelector(".codigo-barras-input");
//     var cantidadLeidaInput = cells[2].querySelector(".codigo-barras-input");

//     var codigoBarra = codigoBarraInput.value;
//     var cantidadLeida = parseFloat(cantidadLeidaInput.value);

//     if (articulo !== null && articulo !== "" && !isNaN(cantidadLeida)) {
//       var tiempoAsignado = tiemposPreviosMap[articulo] || new Date();

//       var rowData = {
//         ARTICULO: articulo,
//         CODIGO_BARRA: codigoBarra,
//         CANTIDAD_LEIDA: cantidadLeida,
//         TIEMPO_LECTURA: tiempoAsignado,
//       };

//       dataArray.push(rowData);
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
//         tiempo: tiempoOriginal,
//       };
//     }
//   });

//   var newArray = [];
//   for (var articulo in cantidadesConsolidadas) {
//     if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
//       newArray.push({
//         ARTICULO: articulo,
//         CANTIDAD_LEIDA: cantidadesConsolidadas[articulo].cantidad,
//         TIEMPO_LECTURA: cantidadesConsolidadas[articulo].tiempo,
//       });
//     }
//   }

//   localStorage.setItem("dataArray", JSON.stringify(newArray));
// }

// // =============================================================================
// // 5. PESTAÑA VERIFICACIÓN Y CONTROL DE AVANCE
// // =============================================================================
// function armarTablaVerificacion(detalleLineasContenedor) {
//   actualizarProgresoLectura();

//   var tbody = document.getElementById("tblbodyLineasContenedor");
//   tbody.innerHTML = "";

//   var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
//   if (cantidadDeRegistrosLabel) {
//     cantidadDeRegistrosLabel.textContent =
//       "Cantidad de registros: " + detalleLineasContenedor.length;
//   }

//   detalleLineasContenedor.forEach(function (detalle) {
//     var newRow = document.createElement("tr");

//     var consecutivo = parseFloat(detalle.LineaConsecutivo) || 0;
//     var contada = parseFloat(detalle.LineaContada) || 0;
//     var mostrarLineaContada = contada === 0 ? "" : contada.toFixed(2);
//     var estanCompletos = consecutivo === contada && consecutivo > 0;

//     var colorTextoHtml = estanCompletos ? 'style="color: #4caf50;"' : "";
//     var claseArticulo = estanCompletos ? "" : 'class="blue-text text-darken-2 centered"';
//     var contenidoVerificado = estanCompletos
//       ? '<span class="material-icons" style="color: #4caf50;">done_all</span>'
//       : "";

//     if (detalle.total_cedi > 0) {
//       newRow.innerHTML = `
//             <td id="articulo" ${colorTextoHtml}>
//               <h5 id="verifica-articulo">
//                 <span ${claseArticulo} ${estanCompletos ? 'style="color: #4caf50;"' : ""}>${detalle.Articulo}</span>
//               </h5>
//               <h6 ${estanCompletos ? 'style="color: #4caf50;"' : ""}>${detalle.Descripcion}</h6>
//             </td>
//             <td id="codigoDeBarras" ${colorTextoHtml}>${detalle.Codigo_Barra || ""}</td>
//             <td id="cantidadPedida" ${colorTextoHtml}>${consecutivo.toFixed(2)}</td>
//             <td id="cantidadLeida" ${colorTextoHtml}>${mostrarLineaContada}</td> 
//             <td id="totalCedi" ${colorTextoHtml}>${
//               isNaN(parseFloat(detalle.total_cedi))
//                 ? "0.00"
//                 : parseFloat(detalle.total_cedi).toFixed(2)
//             }</td>
//             <td id="verificado">${contenidoVerificado}</td> 
//             <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
//             <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
//     } else {
//       var claseArticuloRed = estanCompletos ? "" : 'class="red-text text-darken-4 centered"';
//       var claseDescripcionRed = estanCompletos ? "" : 'class="red-text text-darken-4"';
//       var claseCeldasRed = estanCompletos ? "" : 'class="red-text text-darken-4"';

//       newRow.innerHTML = `
//             <td id="articulo" contenteditable="false" ${colorTextoHtml}>
//               <h5 id="verifica-articulo">
//                 <span ${claseArticuloRed} ${estanCompletos ? 'style="color: #4caf50;"' : ""}>${detalle.Articulo}</span>
//               </h5>
//               <h6 ${claseDescripcionRed} ${estanCompletos ? 'style="color: #4caf50;"' : ""}>${detalle.Descripcion}</h6>
//             </td>
//             <td id="codigoDeBarras" contenteditable="false" ${estanCompletos ? colorTextoHtml : claseCeldasRed}>${
//               detalle.Codigo_Barra || ""
//             }</td>
//             <td id="cantidadPedida" contenteditable="false" ${estanCompletos ? colorTextoHtml : claseCeldasRed}>${consecutivo.toFixed(2)}</td>
//             <td id="cantidadLeida" contenteditable="false" ${estanCompletos ? colorTextoHtml : claseCeldasRed}>${mostrarLineaContada}</td> 
//             <td id="totalCedi" ${colorTextoHtml}>0.00</td>
//             <td id="verificado" contenteditable="false">${contenidoVerificado}</td> 
//             <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
//             <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
//     }
//     tbody.appendChild(newRow);
//   });

//   actualizarTotalesTablaVerificacion();
// }

// // =============================================================================
// // 5. PESTAÑA VERIFICACIÓN Y CONTROL DE AVANCE
// // =============================================================================
// // =============================================================================
// // FUNCIONES DE SOPORTE PARA LOCALSTORAGE Y VERIFICACIÓN
// // =============================================================================

// /**
//  * Registra o suma una cantidad leída a un artículo en el localStorage.
//  * Llama a esta función inmediatamente después de procesar/guardar una lectura.
//  */
// function registrarLecturaEnLocalStorage(articulo, cantidad) {
//   let acumulado = JSON.parse(localStorage.getItem("acumuladoLecturas")) || {};
  
//   let cant = parseFloat(cantidad) || 0;
//   acumulado[articulo] = (acumulado[articulo] || 0) + cant;

//   localStorage.setItem("acumuladoLecturas", JSON.stringify(acumulado));
  
//   // Ejecuta la verificación inmediatamente en vivo
//   verificacion();
// }

// /**
//  * Función principal para renderizar la tabla de verificación según los datos
//  * guardados en el localStorage y en detalleLineasContenedor.
//  */
// function verificacion() {
//   const tabla = document.getElementById("myTableVerificacion");
//   if (!tabla) return;

//   const tbody = tabla.querySelector("tbody");
//   if (!tbody) return;

//   // 1. Obtener acumulados procesados del localStorage
//   const acumuladoLecturas = JSON.parse(localStorage.getItem("acumuladoLecturas")) || {};
//   const LineasContenedor = detalleLineasContenedor || [];
//   const mensajesArray = [];

//   const filas = tbody.querySelectorAll("tr");

//   filas.forEach((fila) => {
//     const celdaARTICULO = fila.querySelector("h5");
//     if (!celdaARTICULO) return;

//     const articuloCodigo = celdaARTICULO.textContent.trim();
//     const celdaVerificado = fila.querySelector("#verificado");
//     const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");
//     const cantPedidaCell = fila.querySelector("#cantidadPedida");

//     // Buscar la línea correspondiente en los datos del servidor/pedido
//     const pedido = LineasContenedor.find((p) => p.Articulo === articuloCodigo);

//     let conteoBaseDatos = pedido ? (parseFloat(pedido.LineaContada) || 0) : 0;
//     let lecturaGuardadaLocalStorage = parseFloat(acumuladoLecturas[articuloCodigo]) || 0;
    
//     // Total Real = Lo que ya estaba en BD + lo que se ha leído y guardado localmente
//     let totalAcumuladoReal = conteoBaseDatos + lecturaGuardadaLocalStorage;
//     let cantidadSolicitada = cantPedidaCell ? (parseFloat(cantPedidaCell.textContent) || 0) : 0;

//     // Actualizar la celda de Cantidad Leída/Verificada
//     if (cantidadVerificadaCell) {
//       cantidadVerificadaCell.textContent = totalAcumuladoReal.toFixed(2);
//     }

//     // Si aún no hay lecturas acumuladas ni en BD, limpiar la celda
//     if (totalAcumuladoReal === 0 && lecturaGuardadaLocalStorage === 0 && conteoBaseDatos === 0) {
//       if (celdaVerificado) celdaVerificado.innerHTML = "";
//       return;
//     }

//     // CALCULO DE DIFERENCIA
//     let diferencia = totalAcumuladoReal - cantidadSolicitada;

//     if (diferencia === 0) {
//       // --- CANTIDADES IGUALES ---
//       if (celdaVerificado) {
//         celdaVerificado.innerHTML = "";
//         const spanVerificacion = document.createElement("span");
//         spanVerificacion.classList.add("material-icons");
//         spanVerificacion.textContent = "done_all";
//         spanVerificacion.style.color = "green";
//         celdaVerificado.appendChild(spanVerificacion);
//       }

//       fila.querySelectorAll("td").forEach((celda) => {
//         celda.style.color = "#e15e0e";
//         celda.querySelectorAll("h5, h6, span").forEach((el) => {
//           el.style.color = "#e15e0e";
//           el.className = el.className.replace(/\b(blue|red)-text\b/g, "");
//         });
//       });
//     } else if (diferencia > 0) {
//       // --- SOBRANTE (+DIFERENCIA) ---
//       let textoDiferencia = "+" + diferencia.toFixed(2);
//       if (celdaVerificado) {
//         celdaVerificado.textContent = textoDiferencia;
//         celdaVerificado.style.color = "#d32f2f";
//         celdaVerificado.style.fontWeight = "bold";
//       }
//       mensajesArray.push(`*La cantidad del artículo ${articuloCodigo} supera la solicitada (+${diferencia.toFixed(2)}).`);
//     } else {
//       // --- FALTANTE (-DIFERENCIA) ---
//       let textoDiferencia = diferencia.toFixed(2);
//       if (celdaVerificado) {
//         celdaVerificado.textContent = textoDiferencia;
//         celdaVerificado.style.color = "#f57c00";
//         celdaVerificado.style.fontWeight = "bold";
//       }
//       mensajesArray.push(`>La cantidad del artículo ${articuloCodigo} es inferior a la solicitada (${diferencia.toFixed(2)}).`);
//     }
//   });

//   localStorage.setItem("mensajes", JSON.stringify(mensajesArray));

//   if (typeof actualizarTotalesTablaVerificacion === "function") {
//     actualizarTotalesTablaVerificacion();
//   }
// }

// // =============================================================================
// // EVENTO DE CARGA AUTOMÁTICA AL REFRESCAR LA PÁGINA
// // =============================================================================
// document.addEventListener("DOMContentLoaded", function () {
//   verificacion();
// });

// // function verificacion() {
// //   var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   const tabla = document.getElementById("myTableVerificacion");

// //   if (tabla) {
// //     const tbody = tabla.querySelector("tbody");
// //     const filas = tbody.querySelectorAll("tr");

// //     filas.forEach((fila) => {
// //       const celdaARTICULO = fila.querySelector("h5");
// //       const verifcheck = fila.querySelector("#verificado");

// //       if (celdaARTICULO) {
// //         var articuloFila = celdaARTICULO.textContent.trim();
// //         var tieneLecturaActual = dataArray.some((item) => item.ARTICULO === articuloFila);

// //         if (tieneLecturaActual && verifcheck) {
// //           verifcheck.textContent = "";
// //         }
// //       }
// //     });
// //   }

// //   var cantidadesTotales = {};
// //   dataArray.forEach(function (item) {
// //     var articulo = item.ARTICULO;
// //     var cantidad = item.CANTIDAD_LEIDA;

// //     cantidadesTotales[articulo] = (cantidadesTotales[articulo] || 0) + cantidad;
// //   });

// //   var resultadoArray = [];
// //   for (var art in cantidadesTotales) {
// //     resultadoArray.push({
// //       ARTICULO: art,
// //       CANTIDAD_LEIDA: cantidadesTotales[art],
// //     });
// //   }

// //   var LineasContenedor = detalleLineasContenedor;
// //   const mensajesArray = [];

// //   resultadoArray.forEach((resultado) => {
// //     const pedido = LineasContenedor.find((p) => p.Articulo === resultado.ARTICULO);

// //     if (pedido && tabla) {
// //       const tbody = tabla.querySelector("tbody");
// //       const filas = tbody.querySelectorAll("tr");

// //       filas.forEach((fila) => {
// //         const celdaARTICULO = fila.querySelector("h5");

// //         if (celdaARTICULO && celdaARTICULO.textContent.trim() === resultado.ARTICULO) {
// //           const celdaVerificado = fila.querySelector("#verificado");
// //           const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");
// //           const cantPedida = fila.querySelector("#cantidadPedida");

// //           let conteoPrevioBaseDeDatos = parseFloat(pedido.LineaContada) || 0;
// //           let lecturaSesionActual = parseFloat(resultado.CANTIDAD_LEIDA) || 0;
// //           let totalAcumuladoReal = conteoPrevioBaseDeDatos + lecturaSesionActual;
// //           let cantidadSolicitada = parseFloat(cantPedida.textContent) || 0;

// //           if (cantidadVerificadaCell) {
// //             cantidadVerificadaCell.textContent = totalAcumuladoReal.toFixed(2);
// //           }

// //           if (totalAcumuladoReal === cantidadSolicitada) {
// //             if (celdaVerificado) {
// //               celdaVerificado.innerHTML = "";
// //               const spanVerificacion = document.createElement("span");
// //               spanVerificacion.classList.add("material-icons");
// //               spanVerificacion.textContent = "done_all";
// //               spanVerificacion.style.color = "green";
// //               celdaVerificado.appendChild(spanVerificacion);
// //             }

// //             const celdasFila = fila.querySelectorAll("td");
// //             celdasFila.forEach((celda) => {
// //               celda.style.color = "#e15e0e";
// //               const elementosInternos = celda.querySelectorAll("h5, h6, span");
// //               elementosInternos.forEach((el) => {
// //                 el.style.color = "#e15e0e";
// //                 el.className = el.className.replace(/\b(blue|red)-text\b/g, "");
// //               });
// //             });
// //           } else if (totalAcumuladoReal > cantidadSolicitada) {
// //             var resultadoOperacion = "+" + (totalAcumuladoReal - cantidadSolicitada).toFixed(2);
// //             if (celdaVerificado) celdaVerificado.textContent = resultadoOperacion;
// //             mensajesArray.push(`*La cantidad verificada del artículo ${resultado.ARTICULO} es mayor a la solicitada.`);
// //             fila.querySelectorAll("td").forEach((td) => (td.style.color = ""));
// //           } else if (totalAcumuladoReal < cantidadSolicitada && totalAcumuladoReal > 0) {
// //             var resultadoOperacion = (totalAcumuladoReal - cantidadSolicitada).toFixed(2);
// //             if (celdaVerificado) celdaVerificado.textContent = resultadoOperacion;
// //             mensajesArray.push(`>La cantidad verificada del artículo ${resultado.ARTICULO} es menor a la solicitada.`);
// //             fila.querySelectorAll("td").forEach((td) => (td.style.color = ""));
// //           }
// //         }
// //       });
// //       localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
// //     }
// //   });

// //   actualizarTotalesTablaVerificacion();
// // }

// // function verificacion() {
// //   var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   const tabla = document.getElementById("myTableVerificacion");

// //   if (tabla) {
// //     const tbody = tabla.querySelector("tbody");
// //     const filas = tbody.querySelectorAll("tr");

// //     filas.forEach((fila) => {
// //       const celdaARTICULO = fila.querySelector("h5");
// //       const verifcheck = fila.querySelector("#verificado");

// //       if (celdaARTICULO) {
// //         var articuloFila = celdaARTICULO.textContent.trim();
// //         var tieneLecturaActual = dataArray.some((item) => item.ARTICULO === articuloFila);

// //         if (tieneLecturaActual && verifcheck) {
// //           verifcheck.textContent = "";
// //         }
// //       }
// //     });
// //   }

// //   var cantidadesTotales = {};
// //   dataArray.forEach(function (item) {
// //     var articulo = item.ARTICULO;
// //     var cantidad = item.CANTIDAD_LEIDA;

// //     cantidadesTotales[articulo] = (cantidadesTotales[articulo] || 0) + cantidad;
// //   });

// //   var resultadoArray = [];
// //   for (var art in cantidadesTotales) {
// //     resultadoArray.push({
// //       ARTICULO: art,
// //       CANTIDAD_LEIDA: cantidadesTotales[art],
// //     });
// //   }

// //   var LineasContenedor = detalleLineasContenedor;
// //   const mensajesArray = [];

// //   resultadoArray.forEach((resultado) => {
// //     const pedido = LineasContenedor.find((p) => p.Articulo === resultado.ARTICULO);

// //     if (pedido && tabla) {
// //       const tbody = tabla.querySelector("tbody");
// //       const filas = tbody.querySelectorAll("tr");

// //       filas.forEach((fila) => {
// //         const celdaARTICULO = fila.querySelector("h5");

// //         if (celdaARTICULO && celdaARTICULO.textContent.trim() === resultado.ARTICULO) {
// //           const celdaVerificado = fila.querySelector("#verificado");
// //           const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");
// //           const cantPedida = fila.querySelector("#cantidadPedida");

// //           let conteoPrevioBaseDeDatos = parseFloat(pedido.LineaContada) || 0;
// //           let lecturaSesionActual = parseFloat(resultado.CANTIDAD_LEIDA) || 0;
// //           let totalAcumuladoReal = conteoPrevioBaseDeDatos + lecturaSesionActual;
// //           let cantidadSolicitada = parseFloat(cantPedida.textContent) || 0;

// //           if (cantidadVerificadaCell) {
// //             cantidadVerificadaCell.textContent = totalAcumuladoReal.toFixed(2);
// //           }

// //           // CALCULO DE DIFERENCIA PARA COLUMNA VERIF
// //           let diferencia = totalAcumuladoReal - cantidadSolicitada;

// //           if (diferencia === 0) {
// //             // --- SIN DIFERENCIA (CANTIDADES IGUALES) ---
// //             if (celdaVerificado) {
// //               celdaVerificado.innerHTML = "";
// //               const spanVerificacion = document.createElement("span");
// //               spanVerificacion.classList.add("material-icons");
// //               spanVerificacion.textContent = "done_all";
// //               spanVerificacion.style.color = "green";
// //               celdaVerificado.appendChild(spanVerificacion);
// //             }

// //             const celdasFila = fila.querySelectorAll("td");
// //             celdasFila.forEach((celda) => {
// //               celda.style.color = "#e15e0e";
// //               const elementosInternos = celda.querySelectorAll("h5, h6, span");
// //               elementosInternos.forEach((el) => {
// //                 el.style.color = "#e15e0e";
// //                 el.className = el.className.replace(/\b(blue|red)-text\b/g, "");
// //               });
// //             });
// //           } else if (diferencia > 0) {
// //             // --- SOBRANTE EN LECTURA (+DIFERENCIA) ---
// //             var resultadoOperacion = "+" + diferencia.toFixed(2);
// //             if (celdaVerificado) {
// //               celdaVerificado.textContent = resultadoOperacion;
// //               celdaVerificado.style.color = "#d32f2f"; // Rojo/Alerta por exceso
// //               celdaVerificado.style.fontWeight = "bold";
// //             }
// //             mensajesArray.push(`*La cantidad verificada del artículo ${resultado.ARTICULO} es mayor a la solicitada (+${diferencia.toFixed(2)}).`);
// //             fila.querySelectorAll("td").forEach((td) => {
// //               if (td.id !== "verificado") td.style.color = "";
// //             });
// //           } else {
// //             // --- FALTANTE EN LECTURA (-DIFERENCIA) ---
// //             var resultadoOperacion = diferencia.toFixed(2); // Ya incluye el signo '-'
// //             if (celdaVerificado) {
// //               celdaVerificado.textContent = resultadoOperacion;
// //               celdaVerificado.style.color = "#f57c00"; // Naranja/Alerta por faltante
// //               celdaVerificado.style.fontWeight = "bold";
// //             }
// //             mensajesArray.push(`>La cantidad verificada del artículo ${resultado.ARTICULO} es menor a la solicitada (${diferencia.toFixed(2)}).`);
// //             fila.querySelectorAll("td").forEach((td) => {
// //               if (td.id !== "verificado") td.style.color = "";
// //             });
// //           }
// //         }
// //       });
// //       localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
// //     }
// //   });

// //   actualizarTotalesTablaVerificacion();
// // }




// // =============================================================================
// // 6. CÁLCULO DE TOTALES Y PROGRESO DE LECTURA
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
//       labelProgreso.style.color = "#28a745";
//       labelProgreso.style.fontWeight = "bold";
//     } else {
//       labelProgreso.style.color = "initial";
//       labelProgreso.style.fontWeight = "normal";
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
//     totalRow.style.backgroundColor = "#fff9c4";
//     tbody.appendChild(totalRow);
//   }

//   totalRow.innerHTML = `
//     <td colspan="2" class="totales-label" style="text-align: center; font-weight: bold;"><em>Totales</em></td>        
//     <td id="totalPedidaRow" style="font-weight: bold;"><em>${totalPedida.toFixed(2)}</em></td>
//     <td id="totalLeidaRow" style="font-weight: bold;"><em>${totalLeida.toFixed(2)}</em></td>
//     <td id="totalCediRow" style="font-weight: bold;"><em>${totales_cedi.toFixed(2)}</em></td>
//     <td id="totalVerifRow"></td> 
//     <td hidden></td> 
//     <td hidden></td> 
//   `;

//   actualizarProgresoLectura();
// }

// // =============================================================================
// // 7. ACCIONES DE GUARDADO Y PROCESAMIENTO
// // =============================================================================
// function confirmarGuardadoParcial() {
//   Swal.fire({
//     icon: "info",
//     title: "¿A continuación se guardarán los datos leídos del contenedor...?",
//     showCancelButton: true,
//     confirmButtonText: "Continuar",
//     cancelButtonText: "Cancelar",
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       verificacion();
//       guardaParcialMente();
//     }
//   });
// }

// function guardaParcialMente() {
//   let pSistema = "WMS";
//   let pUsuario = document.getElementById("hUsuario") ? document.getElementById("hUsuario").value : "";
//   let pOpcion = "G";
//   let pModulo = "WMS_BC";
//   var pConsecutivo = localStorage.getItem("contenedor");

//   let detalles = [];
//   let pEstado = null;
//   let pBodegaEnvia = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
//   let pBodegaDestino = localStorage.getItem("bodega_solicita");
//   let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || null;

//   var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
//   var mapaTiempos = {};
//   dataArrayLectura.forEach(function (item) {
//     if (item.ARTICULO && item.TIEMPO_LECTURA) {
//       mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
//     }
//   });

//   let table = document.getElementById("myTableVerificacion");

//   for (let i = 1; i < table.rows.length - 1; i++) {
//     let row = table.rows[i];
//     let solicitud = row.querySelector("#solicitud").textContent.trim();
//     let articulo = row.querySelector("#verifica-articulo span").textContent.trim();
//     let cantidadPedida = row.querySelector("#cantidadPedida").textContent.trim();
//     let cantidadLeida = row.querySelector("#cantidadLeida").textContent.trim() || 0;

//     let tiempoLecturaAsociado = mapaTiempos[articulo] || null;

//     var detalle = {
//       SOLICITUD: solicitud,
//       ARTICULO: articulo,
//       CANT_CONSEC: cantidadPedida,
//       CANT_LEIDA: cantidadLeida,
//       TIEMPO_LECTURA: tiempoLecturaAsociado,
//     };

//     detalles.push(detalle);
//   }

//   var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));
//    console.log("JSONDetalles:\n\t:" + decodeURIComponent(jsonDetalles) );

//   const params =
//     "?pSistema=" +
//     pSistema +
//     "&pUsuario=" +
//     pUsuario +
//     "&pOpcion=" +
//     pOpcion +
//     "&pModulo=" +
//     pModulo +
//     "&pConsecutivo=" +
//     pConsecutivo +
//     "&jsonDetalles=" +
//     jsonDetalles +
//     "&pEstado=" +
//     pEstado +
//     "&pBodegaEnvia=" +
//     pBodegaEnvia +
//     "&pBodegaDestino=" +
//     pBodegaDestino +
//     "&pUsuarioAutorizacion=" +
//     pUsuarioAutorizacion;

//   mostrarLoader();
//   fetch(env.API_URL + "contenedor" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       console.log("Guardado message"+
//                   "\n"+result.contenedor[0].Respuesta+
//                   "\nRegistrosInsertados: "+result.contenedor[0].RegistrosInsertados+
//                    "\nRegistrosActualizados: "+result.contenedor[0].RegistrosActualizados);
//       if (result.msg === "SUCCESS") {
//         if (result.contenedor.length !== 0) {
//           Swal.fire({
//             icon: "success",
//             title: result.message,
//             confirmButtonText: "Aceptar",
//             confirmButtonColor: "#28a745",
//           }).then((res) => {
//             if (res.isConfirmed) {
//               localStorage.setItem("guardado", true);
//               window.location.reload();
//             }
//           });
//         }
//       }
//     })
//     .finally(() => {
//       ocultarLoader();
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
//     cancelButtonColor: "#6e7881",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       if (validarVerificacion()) {
//         procesarContenedor();
//       } else {
//         Swal.fire({
//           title: "Ingrese sus credenciales",
//           html:
//             '<input id="swal-input1" class="swal2-input" placeholder="Usuario" autocomplete="off">' +
//             '<input id="swal-input2" class="swal2-input" placeholder="Contraseña" type="password" autocomplete="off">',
//           focusConfirm: false,
//           showCancelButton: true,
//           confirmButtonText: "Aprobar",
//           cancelButtonText: "Cancelar",
//           confirmButtonColor: "#28a745",
//           cancelButtonColor: "#6e7881",
//           preConfirm: () => {
//             const usuario = document.getElementById("swal-input1").value.toUpperCase();
//             const contraseña = document.getElementById("swal-input2").value;
//             return { usuario: usuario, contraseña: contraseña };
//           },
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
//                 if (resultado.autorizacion[0].mensaje === "OK") {
//                   procesarContenedor();
//                 } else {
//                   Swal.fire({
//                     icon: "error",
//                     title: "Error",
//                     text: "Credenciales inválidas",
//                   });
//                 }
//               })
//               .catch(() => {
//                 Swal.fire({
//                   icon: "error",
//                   title: "Error",
//                   text: "No se pudo obtener los datos del API",
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
//   let pUsuario = document.getElementById("hUsuario") ? document.getElementById("hUsuario").value : "";
//   let pOpcion = "P";
//   let pModulo = "WMS_BC";
//   var pConsecutivo = localStorage.getItem("contenedor");

//   let detalles = [];
//   let pEstado = null;
//   let pBodegaEnvia = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
//   let pBodegaDestino = localStorage.getItem("bodega_solicita");
//   let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || null;

//   var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
//   var mapaTiempos = {};
//   dataArrayLectura.forEach(function (item) {
//     if (item.ARTICULO && item.TIEMPO_LECTURA) {
//       mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
//     }
//   });

//   let table = document.getElementById("myTableVerificacion");

//   for (let i = 1; i < table.rows.length - 1; i++) {
//     let row = table.rows[i];
//     let solicitud = row.querySelector("#solicitud").textContent.trim();
//     let articulo = row.querySelector("#verifica-articulo span").textContent.trim();
//     let cantidadPedida = row.querySelector("#cantidadPedida").textContent.trim();
//     let cantidadLeida = row.querySelector("#cantidadLeida").textContent.trim() || 0;
//     let tiempoLecturaAsociado = mapaTiempos[articulo] || null;

//     var detalle = {
//       SOLICITUD: solicitud,
//       ARTICULO: articulo,
//       CANT_CONSEC: cantidadPedida,
//       CANT_LEIDA: cantidadLeida,
//       TIEMPO_LECTURA: tiempoLecturaAsociado,
//     };

//     detalles.push(detalle);
//   }

//   var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));

//   const params =
//     "?pSistema=" +
//     pSistema +
//     "&pUsuario=" +
//     pUsuario +
//     "&pOpcion=" +
//     pOpcion +
//     "&pModulo=" +
//     pModulo +
//     "&pConsecutivo=" +
//     pConsecutivo +
//     "&jsonDetalles=" +
//     jsonDetalles +
//     "&pEstado=" +
//     pEstado +
//     "&pBodegaEnvia=" +
//     pBodegaEnvia +
//     "&pBodegaDestino=" +
//     pBodegaDestino +
//     "&pUsuarioAutorizacion=" +
//     pUsuarioAutorizacion;

//   fetch(env.API_URL + "contenedor" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.contenedor.length !== 0) {
//           Swal.fire({
//             icon: "success",
//             title: result.message,
//             confirmButtonText: "Aceptar",
//             confirmButtonColor: "#28a745",
//           }).then((res) => {
//             if (res.isConfirmed) {
//               localStorage.removeItem("desprachoIniciado");
//               window.location.href = "BusquedaDeContenedores.html";
//             }
//           });
//         }
//       }
//     });
// }

// // =============================================================================
// // 8. UTILIDADES Y VISTAS
// // =============================================================================
// function inicializarBotones() {
//   const contenDetalleOPC = localStorage.getItem("contenDetalleOPC");

//   const botonProcesar = document.createElement("button");
//   const botonGuardarParcial = document.createElement("button");
//   const retornar = document.createElement("button");

//   botonProcesar.textContent = "Procesar";
//   botonProcesar.id = "btnProcesar";
//   botonProcesar.hidden = contenDetalleOPC === "A";
//   botonProcesar.onclick = confirmaProcesar;

//   botonGuardarParcial.textContent = "Guardar";
//   botonGuardarParcial.id = "btnGuardar";
//   botonGuardarParcial.hidden = contenDetalleOPC === "A";
//   botonGuardarParcial.onclick = confirmarGuardadoParcial;

//   retornar.textContent = "Retornar";
//   retornar.id = "btnRetornar";
//   retornar.hidden = contenDetalleOPC !== "A";
//   retornar.onclick = retornarVistaAnterior;

//   // Estilos
//   [botonGuardarParcial, botonProcesar, retornar].forEach((btn) => {
//     btn.style.backgroundColor = "#28a745";
//     btn.style.borderRadius = "5px";
//     btn.style.color = "white";
//     btn.style.marginTop = "16px";
//     btn.style.marginLeft = "16px";
//     btn.style.marginRight = "16px";
//     btn.style.height = "36px";
//     btn.style.width = "100px";
//   });

//   const pestañaLectura = document.getElementById("tabla-lectura");
//   const pestañaVerificacion = document.getElementById("tabla-verificacion");

//   if (pestañaLectura) {
//     const divBotonesLectura = document.createElement("div");
//     divBotonesLectura.appendChild(botonGuardarParcial);
//     if (contenDetalleOPC === "A") divBotonesLectura.appendChild(retornar);
//     pestañaLectura.appendChild(divBotonesLectura);
//   }

//   if (pestañaVerificacion) {
//     const divBotonesVerif = document.createElement("div");
//     divBotonesVerif.appendChild(botonProcesar);
//     if (contenDetalleOPC === "A") {
//       const retornarVerif = retornar.cloneNode(true);
//       retornarVerif.onclick = retornarVistaAnterior;
//       divBotonesVerif.appendChild(retornarVerif);
//     }
//     pestañaVerificacion.appendChild(divBotonesVerif);
//   }
// }

// function validarVerificacion() {
//   var celdasVerificacion = document.querySelectorAll(
//     "#tblbodyLineasContenedor td#verificado"
//   );
//   for (var i = 0; i < celdasVerificacion.length; i++) {
//     var spanVerificacion = celdasVerificacion[i].querySelector("span.material-icons");
//     if (!spanVerificacion || spanVerificacion.textContent !== "done_all") {
//       return false;
//     }
//   }
//   return true;
// }

// function mostrarMensajesLocalStorage() {
//   const mensajesStorage = localStorage.getItem("mensajes");
//   if (mensajesStorage) {
//     const mensajes = JSON.parse(mensajesStorage);
//     const textarea = document.getElementById("mensajeText");
//     if (textarea) {
//       textarea.value = "";
//       for (let i = 0; i < mensajes.length; i++) {
//         textarea.value += mensajes[i] + "\n";
//       }
//     }
//   }
// }

// function retornarVistaAnterior() {
//   localStorage.removeItem("mensajes");
//   window.location.href = "BusquedaDeContenedores.html";
// }


// //_____________________________________________________________________________
// ///////// MOSTRAR MODAL INFORMATIVO SOBRE COLORES Y FLUJO DE DATOS /////////////
// //_____________________________________________________________________________
// function mostrarInfoColores() {
//   Swal.fire({
//     title: '<strong style="font-family:\'Oswald\',sans-serif;">Guía de Operación y Colores</strong>',
//     icon: 'info',
//     html: `
//       <div style="text-align: left; font-size: 14px; font-family: 'Roboto', sans-serif; line-height: 1.5; max-height: 400px; overflow-y: auto; padding-right: 5px;">
        
//         <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 0;">
//           🎨 Estados y Colores en Verificación
//         </h6>
//         <div style="margin-bottom: 15px;">
//           <p style="margin: 5px 0;">
//             <span style="display:inline-block; width:18px; height:18px; background-color:  #4caf50; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
//             <strong>Verde:</strong> Líneas completas cuyo conteo ya se encuentra <strong>guardado con éxito en la Base de Datos</strong>.
//           </p>
//           <p style="margin: 5px 0;">
//             <span style="display:inline-block; width:18px; height:18px; background-color: #ff9800 ; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
//             <strong>Naranja:</strong> Líneas completas en memoria técnica que <strong>aún NO se han guardado</strong> en la Base de Datos.
//           </p>
//           <p style="margin: 5px 0;">
//             <span style="display:inline-block; width:18px; height:18px; background-color: #ffffff; border: 1px solid #ccc; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
//             <strong>Sin Color:</strong> Líneas del contenedor que todavía no registran ninguna lectura o conteo en el sistema.
//           </p>
//         </div>

//         <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
//           🔄 Flujo del Proceso (Picker)
//         </h6>
//         <ul style="padding-left: 15px; margin: 8px 0; list-style-type: disc;">
//           <li style="margin-bottom: 6px;"><strong>Inicio:</strong> Al cargar el contenedor, la pestaña <em>Verificación</em> muestra la columna <strong>CANT Leída vacía</strong>.</li>
//           <li style="margin-bottom: 6px;"><strong>Validación de Lectura:</strong> Al escanear una referencia en la pestaña <em>Lectura</em>, el sistema valida que exista en el contenedor y que su código de barras coincida de forma estricta.</li>
//           <li style="margin-bottom: 6px;"><strong>Monitoreo en Vivo:</strong> El avance se puede inspeccionar en caliente usando el label <strong>Leído</strong> (Artículos leídos vs. Solicitados) o cambiando a la pestaña <em>Verificación</em>, la cual cruzará las tablas en tiempo real para poblar la columna de <strong>CANT Leída</strong>.</li>
//           <li style="margin-bottom: 6px;"><strong>Guardado de Datos:</strong> Al pulsar "Guardar" desde la pestaña de lectura, los registros se insertan en la BD, se refresca la grilla, las líneas completadas en base de datos cambian a color verde y desaparecen de la vista activa de verificación.</li>
//         </ul>

//         <div style="margin-top: 15px; background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 10px; border-radius: 4px;">
//           <strong style="color: #e65100; display: block; margin-bottom: 2px;">⚠️ ¡Atención con las recargas!</strong>
//           Si la vista se llega a refrescar (F5 / Recargar) por cualquier motivo antes de presionar el botón <strong>Guardar</strong> en la pestaña de lectura, toda la información de las lecturas temporales en memoria se perderá de forma definitiva.
//         </div>

//       </div>
//     `,
//     showCloseButton: true,
//     confirmButtonColor: '#1e88e5',
//     confirmButtonText: 'Entendido'
//   });
// }

// // function mostrarInfoColores() {
// //   Swal.fire({
// //     title: '<strong style="font-family:\'Oswald\',sans-serif;">Guía de Operación y Colores</strong>',
// //     icon: "info",
// //     html: `
// //       <div style="text-align: left; font-size: 14px; font-family: 'Roboto', sans-serif; line-height: 1.5; max-height: 400px; overflow-y: auto; padding-right: 5px;">
// //         <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 0;">
// //           🎨 Estados y Colores en Verificación
// //         </h6>
// //         <div style="margin-bottom: 15px;">
// //           <p style="margin: 5px 0;">
// //             <span style="display:inline-block; width:18px; height:18px; background-color: #4caf50; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
// //             <strong>Verde:</strong> Líneas completas cuyo conteo ya se encuentra <strong>guardado con éxito en la Base de Datos</strong>.
// //           </p>
// //           <p style="margin: 5px 0;">
// //             <span style="display:inline-block; width:18px; height:18px; background-color: #ff9800; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
// //             <strong>Naranja:</strong> Líneas completas en memoria técnica que <strong>aún NO se han guardado</strong> en la Base de Datos.
// //           </p>
// //           <p style="margin: 5px 0;">
// //             <span style="display:inline-block; width:18px; height:18px; background-color: #ffffff; border: 1px solid #ccc; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
// //             <strong>Sin Color:</strong> Líneas del contenedor que todavía no registran ninguna lectura o conteo en el sistema.
// //           </p>
// //         </div>
// //       </div>
// //     `,
// //     showCloseButton: true,
// //     confirmButtonColor: "#1e88e5",
// //     confirmButtonText: "Entendido",
// //   });
// // }


// // //_____________________________________________________________________________
// // //                        CARGA DEL //DOM
// // //_____________________________________________________________________________
// // var detalleLineasContenedor = [];

// // document.addEventListener("DOMContentLoaded", function () {
// //   if (localStorage.getItem("contenedor")) {
// //     let contenedor = localStorage.getItem("contenedor");
// //     let bodegaSolicita = localStorage.getItem("bodega_solicita");
// //     let estado_Pdt = localStorage.getItem("estado_Pdt");
// //     cargarDetalleContenedor(contenedor, bodegaSolicita, estado_Pdt);
// //   } else {
// //     Swal.fire({
// //       icon: "info",
// //       title: "No hay contenedores",
// //       text: "Lo sentimos, no hay contenedores disponibles en este momento.",
// //     });
// //   }
// // });
// // //_____________________________________________________________________________
// // //CARGA LAS LINEAS DEL CONTENEDOR AL LLAMAR AL sp DE LA BD MEDIANTE EL API
// // //_____________________________________________________________________________
// // function cargarDetalleContenedor(contenedor, bodegaSolicita, estado_Pdt) {
// //   let pSistema = "WMS";
// //   let pUsuario =
// //     document.getElementById("usuario").innerText ||
// //     document.getElementById("usuario").innerHTML;
// //   let opcion = localStorage.getItem("contenDetalleOPC");
// //   let guardado = localStorage.getItem('guardado');

// //   let pOpcion = "L";
// //       if(guardado){
// //         pOpcion="LW";
// //       }
 

// //   let pBodegaEnvia = document.getElementById("bodega").value;
// //   let pBodegaSolicita = bodegaSolicita;
// //   let pConsecutivo = contenedor;
// //   let pEstado = estado_Pdt;

// //   // Concatena la variable con texto y asigna el valor al label documento y pedido
// //   document.getElementById("contenedor").innerHTML =
// //     "Número de Contenedor: " + contenedor;
// //   document.getElementById("bodega_solicita").innerHTML =
// //     "Bodega destino: " + bodegaSolicita;

// //   const params =
// //     "?pSistema=" +
// //     pSistema +
// //     "&pUsuario=" +
// //     pUsuario +
// //     "&pOpcion=" +
// //     pOpcion +
// //     "&pBodegaEnvia=" +
// //     pBodegaEnvia +
// //     "&pBodegaSolicita=" +
// //     pBodegaSolicita +
// //     "&pConsecutivo=" +
// //     pConsecutivo +
// //     "&pEstado=" +
// //     pEstado;

// // mostrarLoader();
// //   fetch(env.API_URL + "contenedor" + params, myInit) //obtierne las lineas del contenedor
// //     .then((response) => response.json())
// //     .then((result) => {
// //       if (result.msg === "SUCCESS") {
// //             console.log('LINEAS DEL CONTENEDOR')
// //             console.log(result.contenedor)
// //         if (result.contenedor.length != 0) {
// //           detalleLineasContenedor = result.contenedor;
// //           const siGuardadoParcial = detalleLineasContenedor.some(
// //             (detalle) =>
// //               detalle.LineaContada != null && detalle.LineaContada !== "" && detalle.LineaContada !=0,);                     
// //                if (siGuardadoParcial) {
// //                       armarTablaVerificacion(detalleLineasContenedor); 
// //                       guardarTablaEnArray();
// //                     }else{                                               
// //                         armarTablaVerificacion(detalleLineasContenedor);  
// //                     }         

// //             } else {
// //               Swal.fire({
// //                 icon: "warning",
// //                 title: "¡Contenedor sin lineas!",
// //                 text:
// //                   "El contenedor " +
// //                   contenedor +
// //                   " no cuenta con lineas para verificar",
// //                 confirmButtonColor: "#28a745",
// //               });
// //             }

        
// //       }
// //     });
// //     ocultarLoader();
// // }

// // //_____________________________________________________________________________
// // /////////VALIDA EL CODIGO LEIDO EN LA PESTAÑA LECTURA//////////////////
// // //_____________________________________________________________________________

// // function validarCodigoBarras(input) {
// //   var LineasContenedor = detalleLineasContenedor;
// //   const codbarra = input.value.toUpperCase().trim(); // Convertir a mayúsculas y limpiar espacios

// //   const row = input.closest("tr");
// //   const firstTd = row.querySelector("td:first-child");
// //   const span = firstTd.querySelector("span");
// //   const siguienteTd = row.querySelector(".codigo-barras-cell2");
// //   const cantFila = siguienteTd.querySelector(".codigo-barras-input");

// //   var codigoValido = false;

// //   for (var i = 0; i < LineasContenedor.length; i++) {
// //     let codigosArrayArticulo = [];
// //     if (LineasContenedor[i].codigos_barras) {
// //       codigosArrayArticulo = LineasContenedor[i].codigos_barras
// //         .split("|")
// //         .map((codigo) => codigo.toUpperCase().trim());
// //     }

// //     // Comprobar coincidencia por Artículo, Código de Barra o código alternativo
// //     if (
// //       (LineasContenedor[i].Articulo &&
// //         LineasContenedor[i].Articulo.toUpperCase() === codbarra) ||
// //       (LineasContenedor[i].Codigo_Barra &&
// //         LineasContenedor[i].Codigo_Barra.toUpperCase() === codbarra) ||
// //       codigosArrayArticulo.includes(codbarra)
// //     ) {
// //       codigoValido = true; // El código pertenece a un artículo del contenedor

// //       // --- NUEVA VALIDACIÓN: CONTROL DE ARTÍCULO YA COMPLETADO ---
// //       let cantidadSolicitada = parseFloat(LineasContenedor[i].LineaConsecutivo) || 0;
// //       let conteoPrevioBaseDeDatos = parseFloat(LineasContenedor[i].LineaContada) || 0;

// //       // Consultamos qué lleva acumulado en la sesión de lectura actual el dataArray de localStorage
// //       var dataArrayActual = JSON.parse(localStorage.getItem("dataArray")) || [];
// //       let lecturaSesionActual = 0;
// //       dataArrayActual.forEach(function (item) {
// //         if (item.ARTICULO === LineasContenedor[i].Articulo) {
// //           lecturaSesionActual += parseFloat(item.CANTIDAD_LEIDA) || 0;
// //         }
// //       });

// //       // Calculamos el gran total procesado hasta el momento
// //       let totalProcesado = conteoPrevioBaseDeDatos + lecturaSesionActual;

// //       //Si el total procesado ya es igual o mayor a lo solicitado, bloqueamos el pistoleo
// //       if (totalProcesado >= cantidadSolicitada && cantidadSolicitada > 0) {
// //         // Swal.fire({
// //         //   icon: "error",
// //         //   title: "¡Artículo ya completado!",
// //         //   html: `El artículo <b>${LineasContenedor[i].Articulo}</b> ya alcanzó la cantidad solicitada (<b>${cantidadSolicitada}</b> de <b>${cantidadSolicitada}</b>) y se encuentra verificado.`,
// //         //   confirmButtonColor: "#4caf50", // Usamos tu color naranja distintivo para advertir el bloqueo
// //         // });

// //         //input.value = ""; // Limpiar el input para permitir reintento con otro artículo
// //         //return; // Rompe la ejecución completa para que no cree filas ni guarde datos
// //       }
// //       // -----------------------------------------------------------

// //       // Si pasa la validación, continúa el flujo regular del WMS
// //       if (LineasContenedor[i].total_cedi > 0) {
// //         span.textContent = LineasContenedor[i].Articulo;
// //         cantFila.value = 1;
// //         // Bloquear la celda del código de barras
// //         input.setAttribute("readonly", "readonly");
// //         // Aquí se genera una fila nueva vacía
// //         crearNuevaFila();
// //         // Llamar función que guarda artículos en la tabla
// //         guardarTablaEnArray();
// //         verificacion();
// //         break;
// //       } else {
// //         Swal.fire({
// //           icon: "warning",
// //           title: "¡Artículo sin Existencias!",
// //           text: "La referencia " + LineasContenedor[i].Articulo + " no cuenta con existencias",
// //           confirmButtonColor: "#28a745",
// //         });
        
// //         input.value = "";
// //         break;
// //       }
// //     }
// //   }

// //   if (!codigoValido) {
// //     input.value = ""; // Borrar de forma directa el input erróneo

// //     Swal.fire({
// //       icon: "warning",
// //       title: "¡Código no válido!",
// //       text: "El código ingresado no coincide con ningún artículo del pedido. Intente nuevamente.",
// //       confirmButtonColor: "#28a745",
// //     });
// //   }
// // }

// // //_____________________________________________________________________________
// // // Funcion que crea la nueva fila en la pestaña lectura
// // //_____________________________________________________________________________

// // function crearNuevaFila() {
// //   actualizarProgresoLectura();
// //   const tableBody = document.querySelector("#tblbodyLectura");

// //   // Agregar la clase deseada a la tabla
// //   tableBody.classList.add("display", "centered");

// //   const nuevaFilaHTML = `<tr>
// //     <td class="sticky-column" style="text-align: center;"><span style="display: inline-block;"></span></td>
// //     <td class="codigo-barras-cell" style="text-align: center;">
// //         <input type="text" style="text-align: center;" id="codigo-barras" class="codigo-barras-input" 
// //         value="" onchange="validarCodigoBarras(this)" autofocus >
// //     </td>
// //     <td class="codigo-barras-cell2" style="text-align: center;">
// //         <input id="cant-pedida" style="text-align: center;" type="text" class="codigo-barras-input" 
// //         value="" onchange="validarCantidadPedida(this)" >
// //     </td>
// //     <td class="codigo-barras-cell2" style="text-align: center;">
// //         <i class="material-icons red-text" style="cursor: pointer;" onclick="eliminarFila(this)">clear</i>
// //     </td>
// // </tr>`;
// //   tableBody.insertAdjacentHTML("beforeend", nuevaFilaHTML);

// //   // Obtén el último campo de entrada en la columna COD de la nueva fila
// //   const nuevoCodigoBarrasInput = tableBody.querySelector(
// //     "tr:last-child .codigo-barras-input"
// //   );

// //   // Establece el enfoque en el último campo de entrada
// //   if (nuevoCodigoBarrasInput) {
// //     nuevoCodigoBarrasInput.focus();
// //   }
// // }
// // //_____________________________________________________________________________
// // //VALIDA LA CANTIDAD LEIDA CONTRA LA CANTIDAD SOLICITADA
// // //_____________________________________________________________________________
// // function validarCantidadPedida() { 
// //   guardarTablaEnArray();
// // }
// // //_____________________________________________________________________________
// // //ALIMENTA EL ARREGLO DE LO LEIDO
// // //_____________________________________________________________________________
// // function guardarTablaEnArray() {
// //   var dataArray = [];

// //   // --- PASO CLAVE NUEVO ---
// //   // Antes de vaciar el localStorage, respaldamos lo que ya existía para no perder los tiempos originales
// //   var localStoragePrevio = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   // Creamos un mapa rápido de Artículo -> Tiempo de Lectura para buscar al instante
// //   var tiemposPreviosMap = {};
// //   localStoragePrevio.forEach(function(oldItem) {
// //     if (oldItem.ARTICULO && oldItem.TIEMPO_LECTURA) {
// //       tiemposPreviosMap[oldItem.ARTICULO] = oldItem.TIEMPO_LECTURA;
// //     }
// //   });
// //   // ------------------------

// //   var table = document.getElementById("myTableLectura");
// //   var rows = table.getElementsByTagName("tr");

// //   for (var i = 1; i < rows.length; i++) {
// //     var row = rows[i];
// //     var cells = row.getElementsByTagName("td");

// //     var articulo = cells[0].querySelector("span").textContent.trim();
// //     var codigoBarraInput = cells[1].querySelector(".codigo-barras-input");
// //     var cantidadLeidaInput = cells[2].querySelector(".codigo-barras-input");

// //     var codigoBarra = codigoBarraInput.value;
// //     var cantidadLeida = parseFloat(cantidadLeidaInput.value);

// //     if (articulo !== null && articulo !== "" && !isNaN(cantidadLeida)) {    
    
// //        var tiempoAsignado = tiemposPreviosMap[articulo] || new Date();

// //       var rowData = {
// //         ARTICULO: articulo,
// //         CODIGO_BARRA: codigoBarra,
// //         CANTIDAD_LEIDA: cantidadLeida,
// //         TIEMPO_LECTURA: tiempoAsignado // Aquí inyectamos el tiempo original preservado
// //       };

// //       dataArray.push(rowData);
// //     }
// //   }
  
// //   localStorage.setItem("dataArray", JSON.stringify(dataArray));

// //   agrupar();
// //   return dataArray;
// // }

// // //_____________________________________________________________________________
// // //AGRUPA LAS CANTIDADES LEIDAS EN UN ARREGLO PARA CONSOLIDAR LAS CANTIDADES LEIRAS Y PODER COMPARARLAS
// // //_____________________________________________________________________________

// // function agrupar() {
  
// //   var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];  
 
// //   var cantidadesConsolidadas = {};

// //   // Recorrer el arreglo dataArray
// //   dataArray.forEach(function (item) {
// //     var articulo = item.ARTICULO;
// //     var cantidad = item.CANTIDAD_LEIDA;
    
// //     // Si el item ya trae un tiempo previo de lecturas anteriores, lo preservamos; 
// //     // si no, usamos la hora exacta de este instante.
// //     //var tiempoOriginal = item.TIEMPO_LECTURA || new Date().toLocaleString('es-PA');
// //     var tiempoOriginal = item.TIEMPO_LECTURA || new Date();
// //     // Verificar si ya existe una cantidad para este artículo en nuestro objeto de control
// //     if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
// //       // Si existe, SOLO sumamos la cantidad (respetando el tiempo que se guardó primero)
// //       cantidadesConsolidadas[articulo].cantidad += cantidad;
// //     } else {
// //       // Si NO existe, creamos la entrada guardando la cantidad Y el tiempo original
// //       cantidadesConsolidadas[articulo] = {
// //         cantidad: cantidad,
// //         tiempo: tiempoOriginal
// //       };
// //     }
// //   });

// //   // Crear un nuevo arreglo con los resultados consolidados
// //   var newArray = [];
// //   for (var articulo in cantidadesConsolidadas) {
// //     if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
// //       newArray.push({
// //         ARTICULO: articulo,
// //         CANTIDAD_LEIDA: cantidadesConsolidadas[articulo].cantidad,
// //         TIEMPO_LECTURA: cantidadesConsolidadas[articulo].tiempo // Mantiene la primera fecha fija
// //       });
// //     }
// //   }

// //   // Actualizar el arreglo en localStorage con los resultados consolidados
// //   localStorage.setItem("dataArray", JSON.stringify(newArray));
// // }

// // //_____________________________________________________________________________
// // //// Funcion que elimina filas en la pestaña lectura
// // //_____________________________________________________________________________

// // function eliminarFila(icon) {
// //   var row = icon.closest("tr");
// //   //var articuloEliminado = row.querySelector('.sticky-column').innerText.trim();

// //   // Mostrar un SweetAlert antes de eliminar la fila
// //   Swal.fire({
// //     title: "¿Estás seguro?",
// //     text: "A continuación se va a eliminar una fila de la pestaña lectura",
// //     icon: "warning",
// //     showCancelButton: true,
// //     confirmButtonColor: "#28a745",
// //     cancelButtonColor: "#6e7881",
// //     confirmButtonText: "Sí, eliminar",
// //   }).then((result) => {
// //     if (result.isConfirmed) {
// //       // Verificar si la fila está vacía
// //       var isEmptyRow = true;
// //       var cells = row.querySelectorAll(".codigo-barras-input");
// //       var artic = row.querySelector;
// //       cells.forEach(function (cell) {
// //         if (cell.value.trim() !== "") {
// //           isEmptyRow = false;
// //         }
// //       });

// //       // Elimina la fila solo si no está vacía
// //       if (isEmptyRow) {
// //         // Llamar función que guarda artículos en la tabla
// //         var dataFromTable = guardarTablaEnArray();

// //         Swal.fire({
// //           icon: "warning",
// //           title: "Está intentando borrar una fila vacia",
// //           confirmButtonText: "Cerrar",
// //         });
// //       } else {
// //         row.remove();

// //         // Después de eliminar la fila, establecer el enfoque en el último campo de entrada en la columna COD
// //         const tableBody = document.querySelector("#tblbodyLectura");
// //         const ultimoCodigoBarrasInput = tableBody.querySelector(
// //           "tr:last-child .codigo-barras-input"
// //         );

// //         // Establecer el enfoque en el último campo de entrada
// //         if (ultimoCodigoBarrasInput) {
// //           ultimoCodigoBarrasInput.focus();
// //         }
// //         // Llamar a la función para actualizar filas eliminadas con el artículo eliminado como parámetro
// //         guardarTablaEnArray();
// //       }
// //     }
// //   });
// // }

// // //_____________________________________________________________________________
// // /////FUNCION QUE ARMA LA TABLA DE LA PESTAÑA VERIFICACION
// // //_____________________________________________________________________________

// // function armarTablaVerificacion(detalleLineasContenedor) {
// //     actualizarProgresoLectura();

// //   // Obtener la referencia del cuerpo de la tabla
// //   var tbody = document.getElementById("tblbodyLineasContenedor");

// //   // Limpiar el contenido actual del cuerpo de la tabla
// //   tbody.innerHTML = "";

// //   // Obtener la referencia del label cantidadDeRegistros
// //   var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
// //   // Actualizar el texto del label con la cantidad de registros
// //   cantidadDeRegistrosLabel.textContent =
// //     "Cantidad de registros: " + detalleLineasContenedor.length;

// //   // Iterar sobre cada elemento en detalleLineasContenedor
// //   detalleLineasContenedor.forEach(function (detalle) {
// //     // Crear una nueva fila
// //     var newRow = document.createElement("tr");

// //     // --- PARSEO DE VALORES ---
// //     var consecutivo = parseFloat(detalle.LineaConsecutivo) || 0;
// //     var contada = parseFloat(detalle.LineaContada) || 0;

// //     // --- LÓGICA PARA LA LÍNEA CONTADA (CANT LEÍDA) ---
// //     var mostrarLineaContada = contada === 0 ? "" : contada.toFixed(2);

// //     // --- EVALUAR SI COINCIDEN PARA EL EFECTO VISUAL ---
// //     var estanCompletos = consecutivo === contada && consecutivo > 0;
    
// //     // Determinamos el color y las clases del Artículo según el estado
// //     var colorTextoHtml = estanCompletos ? 'style="color: #4caf50 ;"' : '';
// //     var claseArticulo = estanCompletos ? '' : 'class="blue-text text-darken-2 centered"';
    
// //     // Si están completos, inyectamos el icono check, si no, se queda vacío
// //     var contenidoVerificado = estanCompletos 
// //       ? '<span class="material-icons" style="color: #4caf50;">done_all</span>' 
// //       : '';

// //     if (detalle.total_cedi > 0) {
// //       // Construir el contenido de la fila usando variables HTML
// //       newRow.innerHTML = `
// //             <td id="articulo" ${colorTextoHtml}>
// //               <h5 id="verifica-articulo">
// //                 <span ${claseArticulo} ${estanCompletos ? 'style="color: #4caf50;"' : ''}>${detalle.Articulo}</span>
// //               </h5>
// //               <h6 ${estanCompletos ? 'style="color: #4caf50;"' : ''}>${detalle.Descripcion}</h6>
// //             </td>
// //             <td id="codigoDeBarras" ${colorTextoHtml}>${detalle.Codigo_Barra || ""}</td>
// //             <td id="cantidadPedida" ${colorTextoHtml}>${consecutivo.toFixed(2)}</td>
// //             <td id="cantidadLeida" ${colorTextoHtml}>${mostrarLineaContada}</td> 
// //             <td id="totalCedi" ${colorTextoHtml}>${
// //               isNaN(parseFloat(detalle.total_cedi))
// //                 ? 0
// //                 : parseFloat(detalle.total_cedi).toFixed(2)
// //             }</td>
// //             <td id="verificado">${contenidoVerificado}</td> 
// //             <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
// //             <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
      
// //       tbody.appendChild(newRow);
// //     } else {
// //       // Bloque para cuando total_cedi <= 0 (Mantiene sus estilos rojos de alerta a menos que esté completo)
// //       var claseArticuloRed = estanCompletos ? '' : 'class="red-text text-darken-4 centered"';
// //       var claseDescripcionRed = estanCompletos ? '' : 'class="red-text text-darken-4"';
// //       var claseCeldasRed = estanCompletos ? '' : 'class="red-text text-darken-4"';

// //       newRow.innerHTML = `
// //                 <td id="articulo" contenteditable="false" ${colorTextoHtml}>
// //                   <h5 id="verifica-articulo">
// //                     <span ${claseArticuloRed} ${estanCompletos ? 'style="color: #4caf50;"' : ''}>${detalle.Articulo}</span>
// //                   </h5>
// //                   <h6 ${claseDescripcionRed} ${estanCompletos ? 'style="color: #4caf50;"' : ''}>${detalle.Descripcion}</h6>
// //                 </td>
// //                 <td id="codigoDeBarras" contenteditable="false" ${estanCompletos ? colorTextoHtml : claseCeldasRed}>${
// //                   detalle.Codigo_Barra || ""
// //                 }</td>
// //                 <td id="cantidadPedida" contenteditable="false" ${estanCompletos ? colorTextoHtml : claseCeldasRed}>${consecutivo.toFixed(2)}</td>
// //                 <td id="cantidadLeida" contenteditable="false" ${estanCompletos ? colorTextoHtml : claseCeldasRed}>${mostrarLineaContada}</td> 
// //                 <td id="totalCedi" ${colorTextoHtml}>${0.0}</td>
// //                 <td id="verificado" contenteditable="false">${contenidoVerificado}</td> 
// //                 <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
// //                 <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
      
// //       tbody.appendChild(newRow);
// //     }
// //   });
// //   actualizarTotalesTablaVerificacion();
// // }

// // //_____________________________________________________________________________
// // ////Funcion que limpia el area de mensajes de error
// // //_____________________________________________________________________________
// // function limpiarMensajes() {
// //   localStorage.removeItem("mensajes");
// //   const mensajeTextArea = document.getElementById("mensajeText");
// //   mensajeTextArea.value = "";
// //   // Limpiar la variable 'mensajes' del localStorage
// //   //window.location.reload();
// //   guardarTablaEnArray();
// // }

// // //_____________________________________________________________________________
// // // FUNCION QUE VERIFICA LAS COINCIDENCIAS,TOMA LOS VALORES DE LAS CANTIDADES
// // // POR ARTICULO, COMPARA LO QUE TIENE EL ARRAY Y VERIFICA LAS COINCIDENCIAS,
// // // PARA MOSTRARLO EN LA PESTAÑA VERIFICACION
// // //_____________________________________________________________________________

// // function verificacion() {
// //   var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];

// //   // Obtener la tabla por su ID
// //   const tabla = document.getElementById("myTableVerificacion");

// //   // 1. Limpiador inicial inteligente
// //   if (tabla) {
// //     const tbody = tabla.querySelector("tbody");
// //     const filas = tbody.querySelectorAll("tr");

// //     filas.forEach((fila) => {
// //       const celdaARTICULO = fila.querySelector("h5");
// //       const verifcheck = fila.querySelector("#verificado");
      
// //       if (celdaARTICULO) {
// //         var articuloFila = celdaARTICULO.textContent.trim();
// //         var tieneLecturaActual = dataArray.some(item => item.ARTICULO === articuloFila);
        
// //         if (tieneLecturaActual && verifcheck) {
// //           verifcheck.textContent = ""; 
// //         }
// //       }
// //     });
// //   }

// //   // Objeto para almacenar los totales de cantidades leídas en la sesión actual
// //   var cantidadesTotales = {};

// //   dataArray.forEach(function (item) {
// //     var articulo = item.ARTICULO;
// //     var cantidad = item.CANTIDAD_LEIDA;

// //     if (cantidadesTotales[articulo]) {
// //       cantidadesTotales[articulo] += cantidad;
// //     } else {
// //       cantidadesTotales[articulo] = cantidad;
// //     }
// //   });

// //   // Convertimos el mapa agrupado de la sesión a un array analizable
// //   var resultadoArray = [];
// //   for (var art in cantidadesTotales) {
// //     resultadoArray.push({
// //       ARTICULO: art,
// //       CANTIDAD_LEIDA: cantidadesTotales[art]
// //     });
// //   }

// //   var LineasContenedor = detalleLineasContenedor;
// //   const mensajesArray = [];

// //   // Analizar y contrastar cada resultado de la lectura física
// //   resultadoArray.forEach((resultado) => {
// //     const pedido = LineasContenedor.find(p => p.Articulo === resultado.ARTICULO);

// //     if (pedido) {
// //       if (tabla) {
// //         const tbody = tabla.querySelector("tbody");
// //         const filas = tbody.querySelectorAll("tr");

// //         filas.forEach((fila) => {
// //           const celdaARTICULO = fila.querySelector("h5");

// //           if (celdaARTICULO && celdaARTICULO.textContent.trim() === resultado.ARTICULO) {
// //             const celdaVerificado = fila.querySelector("#verificado");
// //             const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");
// //             const cantPedida = fila.querySelector("#cantidadPedida");

// //             // Extraemos valores para el cálculo
// //             let conteoPrevioBaseDeDatos = parseFloat(pedido.LineaContada) || 0;
// //             let lecturaSesionActual = parseFloat(resultado.CANTIDAD_LEIDA) || 0;
// //             let totalAcumuladoReal = conteoPrevioBaseDeDatos + lecturaSesionActual;
// //             let cantidadSolicitada = parseFloat(cantPedida.textContent) || 0;

// //             // Inyectamos el gran total acumulado en la celda
// //             if (cantidadVerificadaCell) {
// //               cantidadVerificadaCell.textContent = totalAcumuladoReal.toFixed(2);
// //             }

// //             // --- CASO 1: LAS CANTIDADES COINCIDEN (VERIFICADO) ---
// //             if (totalAcumuladoReal === cantidadSolicitada) {
// //               if (celdaVerificado) {
// //                 celdaVerificado.innerHTML = "";
// //                 const spanVerificacion = document.createElement("span");
// //                 spanVerificacion.classList.add("material-icons");
// //                 spanVerificacion.textContent = "done_all"; 
// //                 spanVerificacion.style.color = "green";
// //                 celdaVerificado.appendChild(spanVerificacion);
// //               }

// //               // --- NUEVO CAMBIO DE COLOR ---
// //               // Obtenemos todas las celdas de la fila y les aplicamos el color #e15e0e
// //               const celdasFila = fila.querySelectorAll("td");
// //               celdasFila.forEach((celda) => {
// //                 // Cambiar el color de texto de la celda
// //                 celda.style.color = "#e15e0e";
                
// //                 // Si la celda contiene etiquetas internas como h5, h6 o span (caso de la columna Artículo),
// //                 // forzamos también el color en ellas para sobreescribir estilos previos de Materialize.
// //                 const elementosInternos = celda.querySelectorAll("h5, h6, span");
// //                 elementosInternos.forEach((el) => {
// //                   el.style.color = "#e15e0e";
// //                   // Quitamos clases de Materialize que fuercen azul o rojo para que no hagan conflicto
// //                   el.className = el.className.replace(/\b(blue|red)-text\b/g, "");
// //                 });
// //               });
// //               // ------------------------------

// //             // --- CASO 2: LA CANTIDAD ES MAYOR ---
// //             } else if (totalAcumuladoReal > cantidadSolicitada) {
// //               var resultadoOperacion = "+" + (totalAcumuladoReal - cantidadSolicitada).toFixed(2);
// //               if (celdaVerificado) celdaVerificado.textContent = resultadoOperacion;
              
// //               const mensaje = `*La cantidad verificada del artículo ${resultado.ARTICULO} es mayor a la solicitada.`;
// //               mensajesArray.push(mensaje);

// //               // Resetear el color por si acaso la fila cambia de estado dinámicamente
// //               fila.querySelectorAll("td").forEach(td => td.style.color = "");

// //             // --- CASO 3: LA CANTIDAD ES MENOR ---
// //             } else if (totalAcumuladoReal < cantidadSolicitada && totalAcumuladoReal > 0) {
// //               var resultadoOperacion = (totalAcumuladoReal - cantidadSolicitada).toFixed(2);
// //               if (celdaVerificado) celdaVerificado.textContent = resultadoOperacion;
              
// //               const mensaje = `>La cantidad verificada del artículo ${resultado.ARTICULO} es menor a la solicitada.`;
// //               mensajesArray.push(mensaje);

// //               // Resetear el color por si acaso la fila cambia de estado dinámicamente
// //               fila.querySelectorAll("td").forEach(td => td.style.color = "");
// //             }
// //           }
// //         });
// //         localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
// //       }
// //     }
// //   });

// //   actualizarTotalesTablaVerificacion(detalleLineasContenedor);
// // }

// // //_____________________________________________________________________________
// // //CALCULA Y ACTUALIZA LOS TOTALES EN LA TABLA LECTURA
// // //_____________________________________________________________________________
// // /**
// //  * @function calcularTotalUnidadesLeidas
// //  * @description Suma el total de unidades leídas/verificadas desde el array en memoria o desde el DOM.
// //  * @returns {number} El total de unidades leídas.
// //  */
// // function calcularTotalUnidadesLeidas() {
// //   if (typeof detalleLineasContenedor !== "undefined" && Array.isArray(detalleLineasContenedor)) {
// //     const pOpcion = localStorage.getItem("contenDetalleOPC");
// //     return detalleLineasContenedor.reduce((acum, item) => {
// //       // Si la opción es "A" usa LineaPreparada, de lo contrario LineaContada
// //       const cant = pOpcion === "A" 
// //         ? parseFloat(item.LineaPreparada) 
// //         : parseFloat(item.LineaContada);
      
// //       return acum + (isNaN(cant) ? 0 : cant);
// //     }, 0);
// //   }

// //   // Respaldo desde el DOM si la estructura en memoria no está cargada
// //   const tbody = document.getElementById("tblbodyLineasContenedor");
// //   if (!tbody) return 0;

// //   let totalLeido = 0;
// //   const celdasCantidadLeida = tbody.querySelectorAll('tr:not(.total-row) td[id="cantidadLeida"]');

// //   celdasCantidadLeida.forEach((celda) => {
// //     const input = celda.querySelector('input');
// //     const valor = input ? parseFloat(input.value) : parseFloat(celda.textContent.trim());
// //     totalLeido += isNaN(valor) ? 0 : valor;
// //   });

// //   return totalLeido;
// // }

// // /**
// //  * @function actualizarProgresoLectura
// //  * @description Actualiza el label/badge de progreso en la pestaña Lectura de manera implícita.
// //  */
// // function actualizarProgresoLectura() {
// //   const lblProgreso = document.getElementById("lblProcesados") || document.getElementById("lblLeido");
// //   if (!lblProgreso) return;

// //   let totalSolicitado = 0;
// //   if (typeof detalleLineasContenedor !== "undefined" && Array.isArray(detalleLineasContenedor)) {
// //     totalSolicitado = detalleLineasContenedor.reduce((acum, item) => {
// //       const pedida = parseFloat(item.LineaConsecutivo) || 0;
// //       return acum + pedida;
// //     }, 0);
// //   }

// //   const totalLeido = calcularTotalUnidadesLeidas();

// //   // Actualización del texto del label implícito
// //   lblProgreso.textContent = `Leído (${totalLeido.toFixed(2)} / ${totalSolicitado.toFixed(2)})`;

// //   // Cambio dinámico de color según avance
// //   if (totalLeido >= totalSolicitado && totalSolicitado > 0) {
// //     lblProgreso.classList.remove("orange-text", "red-text");
// //     lblProgreso.classList.add("green-text");
// //   } else {
// //     lblProgreso.classList.remove("green-text");
// //     lblProgreso.classList.add("orange-text");
// //   }
// // }

// // /**
// //  * @function actualizarTotalesTablaVerificacion
// //  * @description Recalcula la fila de totales en el footer de la tabla y refresca el label de lectura.
// //  */
// // function actualizarTotalesTablaVerificacion() {
// //   var tbody = document.getElementById("tblbodyLineasContenedor");
// //   if (!tbody) return;

// //   let totalPedida = 0;
// //   let totales_cedi = 0;

// //   if (typeof detalleLineasContenedor !== "undefined" && Array.isArray(detalleLineasContenedor)) {
// //     detalleLineasContenedor.forEach(function (detalle) {
// //       let cantidadPedida = parseFloat(detalle.LineaConsecutivo) || 0;
// //       let cantidadCedi = parseFloat(detalle.total_cedi) || 0;

// //       totalPedida += isNaN(cantidadPedida) ? 0 : cantidadPedida;
// //       totales_cedi += isNaN(cantidadCedi) ? 0 : cantidadCedi;
// //     });
// //   }

// //   let totalLeida = calcularTotalUnidadesLeidas();

// //   let totalRow = tbody.querySelector(".total-row");
// //   if (!totalRow) {
// //     totalRow = document.createElement("tr");
// //     totalRow.className = "total-row";
// //     totalRow.style.backgroundColor = "#fff9c4";
// //     tbody.appendChild(totalRow);
// //   }

// //   totalRow.innerHTML = `
// //     <td colspan="2" class="totales-label" style="text-align: center; font-weight: bold;"><em>Totales</em></td>        
// //     <td id="totalPedidaRow" style="font-weight: bold;"><em>${totalPedida.toFixed(2)}</em></td>
// //     <td id="totalLeidaRow" style="font-weight: bold;"><em>${totalLeida.toFixed(2)}</em></td>
// //     <td id="totalCediRow" style="font-weight: bold;"><em>${totales_cedi.toFixed(2)}</em></td>
// //     <td id="totalVerifRow"></td> 
// //     <td hidden></td> 
// //     <td hidden></td> 
// //   `;

// //   // Actualizar también el indicador visual del progreso
// //   actualizarProgresoLectura();
// // }



// // // CALCULA Y ACTUALIZA LOS TOTALES EN LA TABLA VERIFICACIÓN Y EL PROGRESO
// // //_____________________________________________________________________________
// // // function actualizarTotalesTablaVerificacion() {
// // //   var tbody = document.getElementById("tblbodyLineasContenedor");

// // //   if (!tbody) {
// // //     console.error("Elemento 'tblbodyLineasContenedor' no encontrado en el DOM");
// // //     return;
// // //   }

// // //   // 1. Calcular totales desde el arreglo en memoria 'detalleLineasContenedor'
// // //   let totalPedida = 0;
// // //   let totales_cedi = 0;

// // //   if (typeof detalleLineasContenedor !== "undefined" && Array.isArray(detalleLineasContenedor)) {
// // //     detalleLineasContenedor.forEach(function (detalle) {
// // //       let cantidadPedida = parseFloat(detalle.LineaConsecutivo) || 0;
// // //       let cantidadCedi = parseFloat(detalle.total_cedi) || 0;

// // //       totalPedida += isNaN(cantidadPedida) ? 0 : cantidadPedida;
// // //       totales_cedi += isNaN(cantidadCedi) ? 0 : cantidadCedi;
// // //     });
// // //   }

// // //   // 2. Calcular total de cantidadLeida desde la función unificada
// // //   let totalLeida = calcularTotalUnidadesLeidas();

// // //   // 3. Renderizar / Actualizar la fila de totales en el tbody
// // //   let totalRow = tbody.querySelector(".total-row");

// // //   if (!totalRow) {
// // //     totalRow = document.createElement("tr");
// // //     totalRow.className = "total-row";
// // //     totalRow.style.backgroundColor = "#fff9c4"; // Fondo amarillo suave
// // //     tbody.appendChild(totalRow);
// // //   }

// // //   totalRow.innerHTML = `
// // //     <td colspan="2" class="totales-label" style="text-align: center; font-weight: bold;"><em>Totales</em></td>        
// // //     <td id="totalPedidaRow" style="font-weight: bold;"><em>${totalPedida.toFixed(2)}</em></td>
// // //     <td id="totalLeidaRow" style="font-weight: bold;"><em>${totalLeida.toFixed(2)}</em></td>
// // //     <td id="totalCediRow" style="font-weight: bold;"><em>${totales_cedi.toFixed(2)}</em></td>
// // //     <td id="totalVerifRow"></td> 
// // //     <td hidden></td> 
// // //     <td hidden></td> 
// // //   `;

// // //   // 4. Actualizar el indicador visual de progreso en la pestaña Lectura
// // //   actualizarProgresoLectura(totalLeida, totalPedida);
// // // }

// // // /**
// // //  * @function actualizarProgresoLectura
// // //  * @description Actualiza la etiqueta / badge de avance (e.g. Leído: 16.00 / 129.00)
// // //  */
// // // function actualizarProgresoLectura(totalLeido, totalSolicitado) {
// // //   // Ajusta 'lblProcesados' o 'lblLeido' al ID real de tu elemento UI en la pestaña Lectura
// // //   const lblProgreso = document.getElementById("lblProcesados") || document.getElementById("lblLeido");

// // //   if (lblProgreso) {
// // //     lblProgreso.textContent = `Leído (${totalLeido.toFixed(2)} / ${totalSolicitado.toFixed(2)})`;
    
// // //     // Opcional: Cambiar color dinámicamente si completó la lectura
// // //     if (totalLeido >= totalSolicitado && totalSolicitado > 0) {
// // //       lblProgreso.classList.remove("orange-text");
// // //       lblProgreso.classList.add("green-text");
// // //     } else {
// // //       lblProgreso.classList.remove("green-text");
// // //       lblProgreso.classList.add("orange-text");
// // //     }
// // //   }
// // // }



// // // function actualizarTotalesTablaVerificacion() {
// // //   // Obtener la referencia del cuerpo de la tabla
// // //   var tbody = document.getElementById("tblbodyLineasContenedor");

// // //   // Verificar que el tbody exista
// // //   if (!tbody) {
// // //     console.error("Elemento 'tblbodyLineasContenedor' no encontrado en el DOM");
// // //     return;
// // //   }

// // //   // 1. Calcular total de cantidadPedida desde detalleLineasContenedor
// // //   let totalPedida = 0;
// // //   detalleLineasContenedor.forEach(function (detalle) {
// // //     let cantidadPedida = parseFloat(detalle.LineaConsecutivo) || 0;
// // //     totalPedida += isNaN(cantidadPedida) ? 0 : cantidadPedida;
// // //   });

// // //   // 2. Calcular total de total_cedi desde detalleLineasContenedor
// // //   let totales_cedi = 0;
// // //   detalleLineasContenedor.forEach(function (detalle) {
// // //     let cantidadcedi = parseFloat(detalle.total_cedi) || 0;
// // //     totales_cedi += isNaN(cantidadcedi) ? 0 : cantidadcedi;
// // //   });

// // //   // 3. Calcular total de cantidadLeida desde las celdas del DOM (EXCLUYENDO LA FILA DE TOTALES)
// // //   let totalLeida = 0;
  
// // //   // Usamos el selector :not(.total-row) para asegurarnos de NO sumar la fila de totales vieja
// // //   const celdasCantidadLeida = tbody.querySelectorAll('tr:not(.total-row) td[id="cantidadLeida"]');
  
// // //   celdasCantidadLeida.forEach((celda) => {
// // //     let valor = parseFloat(celda.textContent) || 0;
// // //     totalLeida += isNaN(valor) ? 0 : valor;
// // //   });

// // //   // Buscar si ya existe una fila de totales para reciclarla
// // //   let totalRow = tbody.querySelector(".total-row");

// // //   // Si no existe, crear una nueva fila
// // //   if (!totalRow) {
// // //     totalRow = document.createElement("tr");
// // //     totalRow.className = "total-row";
// // //     // Le ponemos un fondo distinguido en línea si Materialize no lo toma por clase
// // //     totalRow.style.backgroundColor = "#fff9c4"; // Un amarillo suave y limpio
// // //     tbody.appendChild(totalRow);
// // //   }

// // //   // Actualizar el contenido de la fila de totales de forma limpia
// // //   totalRow.innerHTML = `
// // //         <td colspan="2" class="totales-label" style="text-align: center; font-weight: bold;"><em>Totales</em></td>       
// // //         <td id="totalPedidaRow" style="font-weight: bold;"><em>${totalPedida.toFixed(2)}</em></td>
// // //         <td id="totalLeidaRow" style="font-weight: bold;"><em>${totalLeida.toFixed(2)}</em></td>
// // //         <td id="totalCediRow" style="font-weight: bold;"><em>${totales_cedi.toFixed(2)}</em></td>
// // //         <td id="totalVerifRow"></td> <td hidden></td> 
// // //         <td hidden></td> 
// // //     `;
// // // }

// // //_____________________________________________________________________________
// // // FUNCION QUE VERIFICA LAS CANTIDASDES LEIDAS Y DEL PEDIDO PÁRA ACTIVAR EL 
// // // BOTON DE GUARDADO PARCIAL
// // //_____________________________________________________________________________

// // function activaGuardadoParcial() {
// //   // Obtener todas las filas de la tabla de verificación
// //   const filas = document.querySelectorAll("#myTableVerificacion tbody tr");

// //   for (let i = 0; i < filas.length; i++) {
// //     const fila = filas[i];

// //     // Obtener las celdas de "CANT PEDIDA" y "CANT LEIDA" en la fila actual
// //     const celdaCantidadPedida = fila.querySelector("td#cantidadPedida");
// //     const celdaCantidadLeida = fila.querySelector("td#cantidadLeida");

// //     // Verificar si la cantidad leída es mayor que la cantidad pedida en al menos una fila
// //     if (
// //       parseFloat(celdaCantidadLeida.textContent) >
// //       parseFloat(celdaCantidadPedida.textContent)
// //     ) {
// //       // Si encontramos una fila donde la cantidad leída es mayor, retornamos true
// //       return true;
// //     }
// //   }
// //   // Si ninguna fila tiene cantidad leída mayor que cantidad pedida, retornamos false
// //   return false;
// // }
// // //_____________________________________________________________________________
// // // Función para mostrar los mensajes almacenados en el localStorage en el 
// // // textarea
// // //_____________________________________________________________________________
// // function mostrarMensajesLocalStorage() {
// //   const mensajesStorage = localStorage.getItem("mensajes");
// //   if (mensajesStorage) {
// //     const mensajes = JSON.parse(mensajesStorage);
// //     const textarea = document.getElementById("mensajeText");
// //     // Limpiar el textarea antes de agregar nuevos mensajes
// //     textarea.value = "";
// //     // Agregar cada mensaje al textarea
// //     for (let i = 0; i < mensajes.length; i++) {
// //       textarea.value += mensajes[i] + "\n"; // Agregar el mensaje y un salto de línea
// //     }
// //   }
// // }

// // //_____________________________________________________________________________
// // // Llama a la función mostrarMensajesLocalStorage cuando se 
// // // hace clic en la pestaña "Verificación"
// // //_____________________________________________________________________________
// // document
// //   .querySelector('a[href="#tabla-verificacion"]')
// //   .addEventListener("click", mostrarMensajesLocalStorage);
// // //_____________________________________________________________________________
// // // FUNCION QUE INICIALIZA LOS VOTONES DE MANERA DINÁMICA
// // //_____________________________________________________________________________
// // function inicializarBotones() {
// //   const contenDetalleOPC = localStorage.getItem("contenDetalleOPC");

// //   // 1. Crear los botones independientes
// //   const botonProcesar = document.createElement("button");
// //   const botonGuardarParcial = document.createElement("button");
// //   const retornar = document.createElement("button");

// //   // Configurar propiedades de los botones
// //   botonProcesar.textContent = "Procesar";
// //   botonProcesar.id = "btnProcesar";
// //   botonProcesar.hidden = contenDetalleOPC === "A" ? true : false;
// //   botonProcesar.onclick = confirmaProcesar; 

// //   botonGuardarParcial.textContent = "Guardar";
// //   botonGuardarParcial.id = "btnGuardar";
// //   botonGuardarParcial.hidden = contenDetalleOPC === "A" ? true : false;
// //   botonGuardarParcial.onclick = confirmarGuardadoParcial; 

// //   retornar.textContent = "Retornar";
// //   retornar.id = "btnRetornar";
// //   retornar.hidden = contenDetalleOPC === "A" ? false : true;
// //   retornar.onclick = retornarVistaAnterior; 

// //   // --- ESTILOS GENERALES (Mantenemos tus medidas de WMS) ---
// //   botonGuardarParcial.style.backgroundColor = "#28a745";
// //   botonGuardarParcial.style.borderRadius = "5px";
// //   botonGuardarParcial.style.color = "white";
// //   botonGuardarParcial.style.marginTop = "16px";
// //   botonGuardarParcial.style.marginLeft = "16px";
// //   botonGuardarParcial.style.marginRight = "16px";
// //   botonGuardarParcial.style.height = "36px";
// //   botonGuardarParcial.style.width = "100px";

// //   botonProcesar.style.width = "100px";
// //   botonProcesar.style.backgroundColor = "#28a745";
// //   botonProcesar.style.borderRadius = "5px";
// //   botonProcesar.style.color = "white";
// //   botonProcesar.style.marginTop = "16px";
// //   botonProcesar.style.marginLeft = "16px"; // Ajustado para simetría individual
// //   botonProcesar.style.height = "36px";
// //   botonProcesar.style.marginBottom = "25px";

// //   retornar.style.backgroundColor = "#28a745";
// //   retornar.style.borderRadius = "5px";
// //   retornar.style.color = "white";
// //   retornar.style.marginTop = "16px";
// //   retornar.style.marginLeft = "16px";
// //   retornar.style.marginRight = "16px";
// //   retornar.style.height = "36px";
// //   retornar.style.width = "100px";

// //   // --- INYECCIÓN QUIRÚRGICA POR PESTAÑA ---

// //   // Obtener los contenedores de las pestañas del HTML
// //   const pestañaLectura = document.getElementById("tabla-lectura");
// //   const pestañaVerificacion = document.getElementById("tabla-verificacion");

// //   // A. Lo que va en la pestaña de LECTURA (Guardar)
// //   if (pestañaLectura) {
// //     const divBotonesLectura = document.createElement("div");
// //     divBotonesLectura.appendChild(botonGuardarParcial);
    
// //     // Si el flujo exige retornar, lo ponemos también en lectura
// //     if (contenDetalleOPC === "A") {
// //       divBotonesLectura.appendChild(retornar);
// //     }
    
// //     pestañaLectura.appendChild(divBotonesLectura);
// //   }

// //   // B. Lo que va en la pestaña de VERIFICACIÓN (Procesar)
// //   if (pestañaVerificacion) {
// //     const divBotonesVerif = document.createElement("div");
// //     divBotonesVerif.appendChild(botonProcesar);
    
// //     // Si necesitas que el retornar se vea en verificación cuando 'contenDetalleOPC' sea 'A'
// //     if (contenDetalleOPC === "A") {
// //       // Clonamos el botón o creamos otro para que no se mueva de pestaña
// //       const retornarVerif = retornar.cloneNode(true);
// //       retornarVerif.onclick = retornarVistaAnterior;
// //       divBotonesVerif.appendChild(retornarVerif);
// //     }

// //     pestañaVerificacion.appendChild(divBotonesVerif);
// //   }

// //   // Media query para pantallas grandes
// //   const mediaQuery = window.matchMedia("(min-width: 64em)");
// //   if (mediaQuery.matches) {
// //     botonGuardarParcial.style.marginLeft = "200px";
// //     botonProcesar.style.marginLeft = "200px"; 
// //   }
// // }
// // //_____________________________________________________________________________
// // // Llamar a la función para cargar y mostrar los mensajes 
// // // desde el localStorage al cargar la página
// // //_____________________________________________________________________________
// // window.onload = function () {
// //   inicializarBotones();
// //   guardarTablaEnArray();
// // };

// // //_____________________________________________________________________________
// // // Funcion de confirmación del guardado parcial
// // //_____________________________________________________________________________

// // function confirmarGuardadoParcial() {
// //   Swal.fire({
// //     icon: "info",
// //     title: "¿A continuación se guardaran los datos leidos del contenedor...?",
// //     showCancelButton: true,
// //     confirmButtonText: "Continuar",
// //     cancelButtonText: "Cancelar",
// //     confirmButtonColor: "#28a745",
// //     cancelButtonColor: "#6e7881",
// //   }).then((result) => {
// //     if (result.isConfirmed) {
// //       verificacion();
// //       guardaParcialMente();
// //       Swal.fire({
// //         icon: "info",
// //         title: "Guardado",
// //         text: "Esta guardado.",
// //       });
// //     }
// //   });
// // }
// // //_____________________________________________________________________________
// // // FUNCION DE GUARDADO PARCIAL
// // //_____________________________________________________________________________

// // function guardaParcialMente() {

// //   let pSistema = "WMS";
// //   let pUsuario = document.getElementById("hUsuario").value;
// //   let pOpcion = "G";
// //   let pModulo = "WMS_BC";
// //   var pConsecutivo = localStorage.getItem("contenedor");
// //   // Array para almacenar todas las cantidades y artículos
// //   let detalles = [];
// //   let pEstado = null;
// //   let pBodegaEnvia = document.getElementById("bodega").value;
// //   let pBodegaDestino = localStorage.getItem("bodega_solicita");
// //   let pUsuarioAutorizacion =
// //     localStorage.getItem("UsuarioAutorizacion") || null;
    
// //   // --- PASO CLAVE NUEVO ---
// //   // 1. Traer el dataArray con las estampas de tiempo originales de la lectura
// //   var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   // 2. Crear un mapa para indexar el tiempo por ARTICULO
// //   var mapaTiempos = {};
// //   dataArrayLectura.forEach(function (item) {
// //     if (item.ARTICULO && item.TIEMPO_LECTURA) {
// //       mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
// //     }
// //   });
// //   // ------------------------

// //   // Obtener la tabla
// //   let table = document.getElementById("myTableVerificacion");

// //   // Iterar sobre las filas de la tabla (excluyendo el encabezado)
// //   for (let i = 1; i < table.rows.length - 1; i++) {
// //     let row = table.rows[i];

// //     // Obtener la solicitud
// //     let solicitud = row.querySelector("#solicitud").textContent.trim();

// //     // Obtener el valor del artículo
// //     let articulo = row
// //       .querySelector("#verifica-articulo span")
// //       .textContent.trim();

// //     // Obtener la cantidad pedida
// //     let cantidadPedida = row
// //       .querySelector("#cantidadPedida")
// //       .textContent.trim();

// //     // Obtener la cantidad leída
// //     let cantidadLeida =
// //       row.querySelector("#cantidadLeida").textContent.trim() || 0;

// //     // 3. Buscar si este artículo tiene un tiempo de lectura guardado en nuestro mapa
// //     // Si no lo encuentra por alguna razón, podemos ponerle null o el tiempo actual como fallback
// //     let tiempoLecturaAsociado = mapaTiempos[articulo] || null;

// //     // Crear un objeto para cada fila incluyendo la propiedad TIEMPO_LECTURA
// //     var detalle = {
// //       SOLICITUD: solicitud,
// //       ARTICULO: articulo,
// //       CANT_CONSEC: cantidadPedida,
// //       CANT_LEIDA: cantidadLeida,
// //       TIEMPO_LECTURA: tiempoLecturaAsociado // <-- Inyección del dato
// //     };

// //     // Agregar el objeto al array
// //     detalles.push(detalle);
// //   }
  
// //   // Convertir el array de objetos a formato JSON
// //   var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));
// //   console.log("JSONDetalles:\n\t:" + decodeURIComponent(jsonDetalles) );
  
// //   const params =
// //     "?pSistema=" +
// //     pSistema +
// //     "&pUsuario=" +
// //     pUsuario +
// //     "&pOpcion=" +
// //     pOpcion +
// //     "&pModulo=" +
// //     pModulo +
// //     "&pConsecutivo=" +
// //     pConsecutivo +
// //     "&jsonDetalles=" +
// //     jsonDetalles +
// //     "&pEstado=" +
// //     pEstado +
// //     "&pBodegaEnvia=" +
// //     pBodegaEnvia +
// //     "&pBodegaDestino=" +
// //     pBodegaDestino +
// //     "&pUsuarioAutorizacion=" +
// //     pUsuarioAutorizacion;
// //     mostrarLoader();
// //   fetch(env.API_URL + "contenedor" + params, myInit)
// //     .then((response) => response.json())
// //     .then((result) => {
// //       if (result.msg === "SUCCESS") {
// //         if (result.contenedor.length != 0) {
// //           Swal.fire({
// //             icon: "success",
// //             title: result.message,
// //             confirmButtonText: "Aceptar",
// //             confirmButtonColor: "#28a745",
// //             cancelButtonColor: "#6e7881",
// //           }).then((result) => {
// //             if (result.isConfirmed) {
// //               localStorage.setItem('guardado', true);
// //               window.location.reload();
// //             }
// //           });
// //         }
// //       } else {
// //         console.log(result.message);
// //       }
// //     });
// //    ocultarLoader(); 
// // }

// // //_____________________________________________________________________________
// // //  ///////FUNCION PARA PROCESAR//////
// // //_____________________________________________________________________________

// // function confirmaProcesar() {
// //    // Obtener todas las celdas de verificación
// //   //var celdasVerificacion = document.querySelectorAll('#tblbodyLineasContenedor td#verificado');

// //   Swal.fire({
// //     icon: "warning",
// //     title: "¿Desea procesar el contenedor?",
// //     showCancelButton: true,
// //     confirmButtonText: "Continuar",
// //     cancelButtonText: "Cancelar",
// //     confirmButtonColor: "#28a745",
// //     cancelButtonColor: "#6e7881",
// //   }).then((result) => {
// //     if (result.isConfirmed) {
// //       // Verificar si todas las celdas de verificación están marcadas
// //       if (validarVerificacion()) {
// //         // Si todas están marcadas, procesar el contenedor
// //         //localStorage.removeItem("UsuarioAutorizacion");
// //         procesarContenedor();
// //       } else {
// //         Swal.fire({
// //           title: "Ingrese sus credenciales",
// //           html:
// //             '<input id="swal-input1" class="swal2-input" placeholder="Usuario" autocomplete="off">' +
// //             '<input id="swal-input2" class="swal2-input" placeholder="Contraseña" type="password" autocomplete="off">',
// //           focusConfirm: false,
// //           showCancelButton: true,
// //           confirmButtonText: "Aprobar",
// //           cancelButtonText: "Cancelar",
// //           confirmButtonColor: "#28a745",
// //           cancelButtonColor: "#6e7881",
// //           preConfirm: () => {
// //             const usuario = document.getElementById("swal-input1").value.toUpperCase();
// //             const contraseña = document.getElementById("swal-input2").value;
// //             return { usuario: usuario, contraseña: contraseña };
// //           },}).then((result) => {
          
// //           if (!result.isDismissed && result.value && result.value.usuario && result.value.contraseña) {
// //                const params = "?pSistema=" +
// //                               'WMS' +
// //                               "&pUsuario=" +
// //                               result.value.usuario  +
// //                               "&pOpcion=" +
// //                               result.value.contraseña;                  

// //              fetch(env.API_URL + "wmsautorizaciones"+params)
// //               .then((response) => response.json())
// //               .then((resultado) => {
// //                 console.log("Autorizacion Resultado: ");
// //                 console.log(resultado.autorizacion[0].mensaje);
               
// //               if(resultado.autorizacion[0].mensaje === "OK") {
// //                   console.log("Credenciales válidas");  

// //                  procesarContenedor();
// //                 } else {
// //                   console.log("Credenciales inválidas");
// //                   Swal.fire({
// //                     icon: "error",
// //                     title: "Error",
// //                     text: "Credenciales inválidas",
// //                   });
// //                 }
// //               })
// //               .catch((error) => {
// //                 console.error("Error al obtener los datos del API:", error);
// //                 Swal.fire({
// //                   icon: "error",
// //                   title: "Error",
// //                   text: "No se pudo obtener los datos del API",
// //                 });
// //               });
// //           } else {
// //             console.error(
// //               "Error: No se pudieron obtener los valores de usuario y contraseña del Swal"
// //             );
// //             Swal.fire({
// //               icon: "error",
// //               title: "Error",
// //               text: "No se pudieron obtener los valores de usuario y contraseña del Swal",
// //             });
// //           }
// //         });
// //       }
// //     }
// //   });
// // }

// // //_____________________________________________________________________________
// // // FUNCION PARA VERIFICAR EL CHECK EN LA COLUNA DE VERIFICACO
// // //_____________________________________________________________________________
// // function validarVerificacion() {
// //   // Obtener todas las celdas de verificación
// //   var celdasVerificacion = document.querySelectorAll(
// //     "#tblbodyLineasContenedor td#verificado"
// //   );

// //   // Iterar sobre cada celda de verificación
// //   for (var i = 0; i < celdasVerificacion.length; i++) {
// //     // Obtener el span dentro de la celda
// //     var spanVerificacion = celdasVerificacion[i].querySelector(
// //       "span.material-icons"
// //     );
// //     // Verificar si el span no está presente o su contenido no es 'done_all'
// //     if (!spanVerificacion || spanVerificacion.textContent !== "done_all") {
// //       // Si encuentra una celda sin verificar, retorna false
// //       return false;
// //     }
// //   }
// //   // Si todas las celdas están verificadas, retorna true
// //   return true;
// // }
// // //_____________________________________________________________________________
// // //
// // //_____________________________________________________________________________
// // function columnaEstaVacia() {
// //   // Selecciona todas las celdas con id "cantidadLeida" dentro del cuerpo de la tabla
// //   var celdasCantidadLeida = document.querySelectorAll(
// //     "#tblbodyLineasContenedor td#cantidadLeida"
// //   );

// //   // Recorremos cada celda y verificamos si alguna tiene contenido
// //   for (var i = 0; i < celdasCantidadLeida.length; i++) {
// //     if (celdasCantidadLeida[i].textContent.trim() !== "") {
// //       return false; // Al menos una celda tiene datos
// //     }
// //   }

// //   return true; // Todas las celdas están vacías
// // }

// // //_____________________________________________________________________________
// // //FUNCION DE PROCESAR LAS LINEAS LEIDAS EL CONTENEDOR
// // //_____________________________________________________________________________
// // function procesarContenedor() {
// //   let pSistema = "WMS";
// //   let pUsuario = document.getElementById("hUsuario").value;
// //   let pOpcion = "P";
// //   let pModulo = "WMS_BC";
// //   var pConsecutivo = localStorage.getItem("contenedor");
// //   // Array para almacenar todas las cantidades y artículos
// //   let detalles = [];
// //   let pEstado = null;
// //   let pBodegaEnvia = document.getElementById("bodega").value;
// //   let pBodegaDestino = localStorage.getItem("bodega_solicita");
// //   let pUsuarioAutorizacion =
// //     localStorage.getItem("UsuarioAutorizacion") || null;

// //   // --- PASO CLAVE: RECUPERACIÓN DE TIEMPOS DE LECTURA ---
// //   // 1. Traer el dataArray con las estampas de tiempo originales de la lectura
// //   var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   // 2. Crear un mapa para indexar el tiempo por ARTICULO
// //   var mapaTiempos = {};
// //   dataArrayLectura.forEach(function (item) {
// //     if (item.ARTICULO && item.TIEMPO_LECTURA) {
// //       mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
// //     }
// //   });
// //   // ------------------------------------------------------

// //   // Obtener la tabla
// //   let table = document.getElementById("myTableVerificacion");

// //   // Iterar sobre las filas de la tabla (excluyendo el encabezado)
// //   for (let i = 1; i < table.rows.length - 1; i++) {
// //     let row = table.rows[i];

// //     // Obtener la solicitud
// //     let solicitud = row.querySelector("#solicitud").textContent.trim();

// //     // Obtener el valor del artículo
// //     let articulo = row
// //       .querySelector("#verifica-articulo span")
// //       .textContent.trim();

// //     // Obtener la cantidad pedida
// //     let cantidadPedida = row
// //       .querySelector("#cantidadPedida")
// //       .textContent.trim();

// //     // Obtener la cantidad leída
// //     let cantidadLeida =
// //       row.querySelector("#cantidadLeida").textContent.trim() || 0;

// //     // 3. Buscar si este artículo tiene un tiempo de lectura guardado en nuestro mapa
// //     let tiempoLecturaAsociado = mapaTiempos[articulo] || null;

// //     // Crear un objeto para cada fila incluyendo la propiedad TIEMPO_LECTURA
// //     var detalle = {
// //       SOLICITUD: solicitud,
// //       ARTICULO: articulo,
// //       CANT_CONSEC: cantidadPedida,
// //       CANT_LEIDA: cantidadLeida,
// //       TIEMPO_LECTURA: tiempoLecturaAsociado // <-- Parámetro inyectado correctamente
// //     };

// //     // Agregar el objeto al array
// //     detalles.push(detalle);
// //   }
  
// //   //guardaProcesar();
  
// //   // Convertir el array de objetos a formato JSON
// //   var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));
// //   console.log("JSONDetalles:\n\t:" + decodeURIComponent(jsonDetalles));
  
// //   const params =
// //     "?pSistema=" +
// //     pSistema +
// //     "&pUsuario=" +
// //     pUsuario +
// //     "&pOpcion=" +
// //     pOpcion +
// //     "&pModulo=" +
// //     pModulo +
// //     "&pConsecutivo=" +
// //     pConsecutivo +
// //     "&jsonDetalles=" +
// //     jsonDetalles +
// //     "&pEstado=" +
// //     pEstado +
// //     "&pBodegaEnvia=" +
// //     pBodegaEnvia +
// //     "&pBodegaDestino=" +
// //     pBodegaDestino +
// //     "&pUsuarioAutorizacion=" +
// //     pUsuarioAutorizacion;
    
// //   console.log("Parametros: \n" + params);
  
// //   fetch(env.API_URL + "contenedor" + params, myInit)
// //     .then((response) => response.json())
// //     .then((result) => {
// //       console.log("Respuesta del SP");
// //       console.log(result.contenedor);
// //       console.log('mensaje ' + result.message);

// //       console.log("Respuesta Contenedor");
// //       console.log(result);

// //       if (result.msg === "SUCCESS") {
// //         if (result.contenedor.length != 0) {
// //           Swal.fire({
// //             icon: "success",
// //             title: result.message,
// //             confirmButtonText: "Aceptar",
// //             confirmButtonColor: "#28a745",
// //             cancelButtonColor: "#6e7881",
// //           }).then((result) => {
// //             if (result.isConfirmed) {
// //               localStorage.removeItem("desprachoIniciado");
// //               window.location.href = "BusquedaDeContenedores.html";
// //             }
// //           });
// //         }
// //       } else {
// //         console.log(result.message);
// //       }
// //     });
// // }



// // // function procesarContenedor() {
// // //   let pSistema = "WMS";
// // //   let pUsuario = document.getElementById("hUsuario").value;
// // //   let pOpcion = "P";
// // //   let pModulo = "WMS_BC";
// // //   var pConsecutivo = localStorage.getItem("contenedor");
// // //   // Array para almacenar todas las cantidades y artículos
// // //   let detalles = [];
// // //   let pEstado = null;
// // //   let pBodegaEnvia = document.getElementById("bodega").value;
// // //   let pBodegaDestino = localStorage.getItem("bodega_solicita");
// // //   let pUsuarioAutorizacion =
// // //     localStorage.getItem("UsuarioAutorizacion") || null;
// // //   // Obtener la tabla
// // //   let table = document.getElementById("myTableVerificacion");

// // //   // Iterar sobre las filas de la tabla (excluyendo el encabezado)
// // //   for (let i = 1; i < table.rows.length - 1; i++) {
// // //     let row = table.rows[i];

// // //     // Obtener lasolicitud
// // //     let solicitud = row.querySelector("#solicitud").textContent.trim();

// // //     // Obtener el valor del artículo
// // //     let articulo = row
// // //       .querySelector("#verifica-articulo span")
// // //       .textContent.trim();

// // //     // Obtener la cantidad pedida
// // //     let cantidadPedida = row
// // //       .querySelector("#cantidadPedida")
// // //       .textContent.trim();

// // //     // Obtener la cantidad leída
// // //     let cantidadLeida =
// // //       row.querySelector("#cantidadLeida").textContent.trim() || 0;

// // //     // Crear un objeto para cada fila con las propiedades ARTICULO y CANTCONSEC
// // //     var detalle = {
// // //       SOLICITUD: solicitud,
// // //       ARTICULO: articulo,
// // //       CANT_CONSEC: cantidadPedida,
// // //       CANT_LEIDA: cantidadLeida,
// // //     };

// // //     // Agregar el objeto al array
// // //     detalles.push(detalle);
// // //   }
// // //   guardaProcesar();
// // //   // Convertir el array de objetos a formato JSON
// // //   var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));
// // //   console.log("JSONDetalles:\n\t:" + decodeURIComponent(jsonDetalles));
// // //   const params =
// // //     "?pSistema=" +
// // //     pSistema +
// // //     "&pUsuario=" +
// // //     pUsuario +
// // //     "&pOpcion=" +
// // //     pOpcion +
// // //     "&pModulo=" +
// // //     pModulo +
// // //     "&pConsecutivo=" +
// // //     pConsecutivo +
// // //     "&jsonDetalles=" +
// // //     jsonDetalles +
// // //     "&pEstado=" +
// // //     pEstado +
// // //     "&pBodegaEnvia=" +
// // //     pBodegaEnvia +
// // //     "&pBodegaDestino=" +
// // //     pBodegaDestino +
// // //     "&pUsuarioAutorizacion=" +
// // //     pUsuarioAutorizacion;
// // //   console.log("Parametros: \n" + params);
// // //   fetch(env.API_URL + "contenedor" + params, myInit)
// // //     .then((response) => response.json())
// // //     .then((result) => {
// // //       console.log("Respuesta del SP");
// // //       console.log(result.contenedor);
// // //       console.log('mensaje '+result.message);

// // //       console.log("Respuesta Contenedor");
// // //       console.log(result);

// // //       if (result.msg === "SUCCESS") {
// // //         if (result.contenedor.length != 0) {
// // //           // Resto del código de éxito
// // //           Swal.fire({
// // //             icon: "success",
// // //             //title: "Datos guardados correctamente",
// // //             title: result.message,
// // //             confirmButtonText: "Aceptar",
// // //             confirmButtonColor: "#28a745",
// // //             cancelButtonColor: "#6e7881",
// // //           }).then((result) => {
// // //             if (result.isConfirmed) {
// // //               localStorage.removeItem("desprachoIniciado");
// // //               window.location.href = "BusquedaDeContenedores.html";
// // //             }
// // //           });
// // //         }
// // //       } else {
// // //         console.log(result.message);
// // //       }
// // //     });
// // // } 

// // //_____________________________________________________________________________
// // //
// // //_____________________________________________________________________________
// // function retornarVistaAnterior() {
// //   //localStorage.removeItem("desprachoIniciado");
// //   localStorage.removeItem("mensajes");
// //   window.location.href = "BusquedaDeContenedores.html";
// // }

// // //_____________________________________________________________________________
// // //devolverArticulo
// // //_____________________________________________________________________________

// // function devolverArticulo(articulo) {
// //   let table = document.getElementById("myTableVerificacion");
// //   let pPedido = localStorage.getItem("pedidoSelect");
// //   let pArticulo = articulo;

// //   // Mostrar mensaje con swal.fire
// //   swal
// //     .fire({
// //       title: "Devolver Artículo",
// //       text:
// //         "¿Estás seguro de devolver el artículo " +
// //         pArticulo +
// //         " del pedido número " +
// //         pPedido +
// //         "?",
// //       icon: "question",
// //       showCancelButton: true,
// //       confirmButtonText: "Sí, devolver",
// //       cancelButtonText: "Cancelar",
// //     })
// //     .then((result) => {
// //       // Si se hace clic en "Sí, devolver"
// //       if (result.isConfirmed) {
// //         const params = "?pPedido=" + pPedido + "&pArticulo=" + pArticulo;

// //         fetch(env.API_URL + "devolverarticulo/D" + params, myInit)
// //           .then((response) => response.json())
// //           .then((result) => {
// //             if (result.msg === "SUCCESS") {
// //               if (result.articulodevuelto.length != 0) {
// //                 Swal.fire({
// //                   icon: "warning",
// //                   title: "Articulo Devuelto con exito",
// //                   showCancelButton: true,
// //                   confirmButtonText: "Continuar",
// //                   cancelButtonText: "Cancelar",
// //                 });
// //                 // Iterar a través de las filas de la tabla (ignorando la fila de encabezado)
// //                 for (var i = 1; i < table.rows.length; i++) {
// //                   var articuloEnFila = table.rows[i].cells[0]
// //                     .querySelector("h5#verifica-articulo span")
// //                     .innerText.trim();

// //                   // Verificar si el artículo en la fila coincide con el artículo a devolver
// //                   if (articuloEnFila === articulo) {
// //                     // Eliminar la fila
// //                     table.deleteRow(i);

// //                     // Mostrar mensaje de éxito
// //                     swal.fire(
// //                       "Éxito",
// //                       "Artículo devuelto correctamente.",
// //                       "success"
// //                     );
// //                     break; // Salir del bucle después de eliminar la fila
// //                   }
// //                 }
// //               }
// //             } else {
// //               Swal.fire({
// //                 icon: "error",
// //                 title: "Error al procesar el pedido",
// //                 showCancelButton: true,
// //                 confirmButtonText: "Continuar",
// //                 cancelButtonText: "Cancelar",
// //               });
// //             }
// //           });
// //       }
// //     });
// // }
// // //_____________________________________________________________________________
// // // @function actualizarProgresoLectura
// // //_____________________________________________________________________________
// //   /**
// //  * @function actualizarProgresoLectura
// //  * @description Muestra el resumen de unidades leídas vs. total de unidades a leer.
// //  */
// // function actualizarProgresoLectura() {
// //     // 1. Obtener los totales de unidades
// //     const totalUnidadesApreparar = calcularTotalUnidadesApreparar(detalleLineasContenedor);
// //     const totalUnidadesLeidas = calcularTotalUnidadesLeidas();
    
// //     // 2. Obtener el Label
// //     const labelProgreso = document.getElementById("progresoLecturaLabel");

// //     if (labelProgreso) {
// //         labelProgreso.textContent = `Leído: ${totalUnidadesLeidas.toFixed(0)} / ${totalUnidadesApreparar.toFixed(0)}`;
// //            // console.log('Total Leido: '+totalUnidadesLeidas+'/'+totalUnidadesApreparar)
// //         // Opcional: Estilo basado en el progreso
// //         if (totalUnidadesLeidas > 0 && totalUnidadesLeidas >= totalUnidadesApreparar) {
// //              labelProgreso.style.color = "green";
// //         } else {
// //              labelProgreso.style.color = "initial"; // o el color por defecto
// //         }
// //     } else {
// //         console.warn("Elemento 'progresoLecturaLabel' no encontrado. Asegúrate de agregarlo al HTML.");
// //     }
// // }
// // //_____________________________________________________________________________
// // //calcularTotalUnidadesApreparar
// // //_____________________________________________________________________________
// // //////////////////////////////////////////////////////////////////////////////////////////////////////////
// // /**
// //  * @function calcularTotalUnidadesApreparar
// //  * @description Suma los valores de la columna 'Cant. Prep.' (Índice 3) en la tabla de Verificación.
// //  * @returns {number} El total de unidades (productos) que deben ser leídas.
// //  */
// // function calcularTotalUnidadesApreparar(detalleLineasContenedor) {

// //    // Calcular total de cantidadPedida desde detalleLineasContenedor
// //   let totalPedida = 0;
// //   detalleLineasContenedor.forEach(function (detalle) {
// //     let cantidadPedida = parseFloat(detalle.LineaConsecutivo) || 0;
// //     totalPedida += isNaN(cantidadPedida) ? 0 : cantidadPedida;
// //   });
// //     //console.log(' Total a leeer: ' +totalPedida)
// //     return totalPedida;
// // }
// // //_____________________________________________________________________________
// // //calcularTotalUnidadesLeidas
// // //_____________________________________________________________________________
// // //////////////////////////////////////////////////////////////////////////////////////////////////////////
// // /**
// //  * @function calcularTotalUnidadesLeidas
// //  * @description Suma los valores de la columna de cantidad (Índice 2) en la tabla de Lectura.
// //  * @returns {number} El total de unidades (productos) registradas como leídas.
// //  */

// // /**
// //  * @function calcularTotalUnidadesLeidas
// //  * @description Suma el total de unidades leídas/verificadas en la vista de contenedores.
// //  * @returns {number} El total acumulado de unidades leídas.
// //  */
// // // function calcularTotalUnidadesLeidas() {
// // //   // Preferencia 1: Calcular desde la fuente de datos en memoria si está disponible
// // //   if (typeof detalleLineasContenedor !== "undefined" && Array.isArray(detalleLineasContenedor)) {
// // //     const pOpcion = localStorage.getItem("contenDetalleOPC");
// // //     return detalleLineasContenedor.reduce((acum, item) => {
// // //       // Determina la propiedad a leer según el modo de operación ("A" -> LineaPreparada, otro -> LineaContada)
// // //       const cant = pOpcion === "A" 
// // //         ? parseFloat(item.LineaPreparada) 
// // //         : parseFloat(item.LineaContada);
      
// // //       return acum + (isNaN(cant) ? 0 : cant);
// // //     }, 0);
// // //   }

// // //   // Preferencia 2: Calcular directo del DOM (tabla de verificación)
// // //   const tbody = document.getElementById("tblbodyLineasContenedor");
// // //   if (!tbody) return 0;

// // //   let totalLeido = 0;
// // //   const celdasCantidadLeida = tbody.querySelectorAll('tr:not(.total-row) td[id="cantidadLeida"]');

// // //   celdasCantidadLeida.forEach((celda) => {
// // //     const input = celda.querySelector('input');
// // //     const valor = input ? parseFloat(input.value) : parseFloat(celda.textContent.trim());
// // //     totalLeido += isNaN(valor) ? 0 : valor;
// // //   });

// // //   return totalLeido;
// // // }
// // // function calcularTotalUnidadesLeidas() {
// // //      const tbodyLectura = document.getElementById("myTableVerificacion");
// // //     let totalLeido = 0;

// // //     if (tbodyLectura) {
// // //         // La columna de Cantidad en la tabla de Lectura es la tercera columna (índice 2)
// // //         // (Articulo[0], Cod[1], Cant[2], CL[3])
// // //         const indiceColumnaCantidad = 2; 

// // //         tbodyLectura.querySelectorAll('tr').forEach(fila => {
// // //             const celdas = fila.querySelectorAll('td');

// // //             if (celdas[indiceColumnaCantidad]) {
// // //                 // En la pestaña Lectura, la cantidad está dentro de un <input>
// // //                 const input = celdas[indiceColumnaCantidad].querySelector('input');
                
// // //                 let valor = input ? input.value : celdas[indiceColumnaCantidad].textContent.trim();

// // //                 // Usamos parseFloat y tratamos NaN como 0
// // //                 totalLeido += parseFloat(valor) || 0;
// // //             }
// // //         });
// // //     }
// // //     return totalLeido;
// // // }

// // //_____________________________________________________________________________
// // ///////// MOSTRAR MODAL INFORMATIVO SOBRE COLORES Y FLUJO DE DATOS /////////////
// // //_____________________________________________________________________________
// // function mostrarInfoColores() {
// //   Swal.fire({
// //     title: '<strong style="font-family:\'Oswald\',sans-serif;">Guía de Operación y Colores</strong>',
// //     icon: 'info',
// //     html: `
// //       <div style="text-align: left; font-size: 14px; font-family: 'Roboto', sans-serif; line-height: 1.5; max-height: 400px; overflow-y: auto; padding-right: 5px;">
        
// //         <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 0;">
// //           🎨 Estados y Colores en Verificación
// //         </h6>
// //         <div style="margin-bottom: 15px;">
// //           <p style="margin: 5px 0;">
// //             <span style="display:inline-block; width:18px; height:18px; background-color:  #4caf50; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
// //             <strong>Verde:</strong> Líneas completas cuyo conteo ya se encuentra <strong>guardado con éxito en la Base de Datos</strong>.
// //           </p>
// //           <p style="margin: 5px 0;">
// //             <span style="display:inline-block; width:18px; height:18px; background-color: #ff9800 ; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
// //             <strong>Naranja:</strong> Líneas completas en memoria técnica que <strong>aún NO se han guardado</strong> en la Base de Datos.
// //           </p>
// //           <p style="margin: 5px 0;">
// //             <span style="display:inline-block; width:18px; height:18px; background-color: #ffffff; border: 1px solid #ccc; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
// //             <strong>Sin Color:</strong> Líneas del contenedor que todavía no registran ninguna lectura o conteo en el sistema.
// //           </p>
// //         </div>

// //         <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
// //           🔄 Flujo del Proceso (Picker)
// //         </h6>
// //         <ul style="padding-left: 15px; margin: 8px 0; list-style-type: disc;">
// //           <li style="margin-bottom: 6px;"><strong>Inicio:</strong> Al cargar el contenedor, la pestaña <em>Verificación</em> muestra la columna <strong>CANT Leída vacía</strong>.</li>
// //           <li style="margin-bottom: 6px;"><strong>Validación de Lectura:</strong> Al escanear una referencia en la pestaña <em>Lectura</em>, el sistema valida que exista en el contenedor y que su código de barras coincida de forma estricta.</li>
// //           <li style="margin-bottom: 6px;"><strong>Monitoreo en Vivo:</strong> El avance se puede inspeccionar en caliente usando el label <strong>Leído</strong> (Artículos leídos vs. Solicitados) o cambiando a la pestaña <em>Verificación</em>, la cual cruzará las tablas en tiempo real para poblar la columna de <strong>CANT Leída</strong>.</li>
// //           <li style="margin-bottom: 6px;"><strong>Guardado de Datos:</strong> Al pulsar "Guardar" desde la pestaña de lectura, los registros se insertan en la BD, se refresca la grilla, las líneas completadas en base de datos cambian a color verde y desaparecen de la vista activa de verificación.</li>
// //         </ul>

// //         <div style="margin-top: 15px; background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 10px; border-radius: 4px;">
// //           <strong style="color: #e65100; display: block; margin-bottom: 2px;">⚠️ ¡Atención con las recargas!</strong>
// //           Si la vista se llega a refrescar (F5 / Recargar) por cualquier motivo antes de presionar el botón <strong>Guardar</strong> en la pestaña de lectura, toda la información de las lecturas temporales en memoria se perderá de forma definitiva.
// //         </div>

// //       </div>
// //     `,
// //     showCloseButton: true,
// //     confirmButtonColor: '#1e88e5',
// //     confirmButtonText: 'Entendido'
// //   });
// // }

// // function guardaProcesar() {

// //   let pSistema = "WMS";
// //   let pUsuario = document.getElementById("hUsuario").value;
// //   let pOpcion = "G";
// //   let pModulo = "WMS_BC";
// //   var pConsecutivo = localStorage.getItem("contenedor");
// //   // Array para almacenar todas las cantidades y artículos
// //   let detalles = [];
// //   let pEstado = null;
// //   let pBodegaEnvia = document.getElementById("bodega").value;
// //   let pBodegaDestino = localStorage.getItem("bodega_solicita");
// //   let pUsuarioAutorizacion =
// //     localStorage.getItem("UsuarioAutorizacion") || null;
    
// //   // --- PASO CLAVE NUEVO ---
// //   // 1. Traer el dataArray con las estampas de tiempo originales de la lectura
// //   var dataArrayLectura = JSON.parse(localStorage.getItem("dataArray")) || [];
// //   // 2. Crear un mapa para indexar el tiempo por ARTICULO
// //   var mapaTiempos = {};
// //   dataArrayLectura.forEach(function (item) {
// //     if (item.ARTICULO && item.TIEMPO_LECTURA) {
// //       mapaTiempos[item.ARTICULO.trim()] = item.TIEMPO_LECTURA;
// //     }
// //   });
// //   // ------------------------

// //   // Obtener la tabla
// //   let table = document.getElementById("myTableVerificacion");

// //   // Iterar sobre las filas de la tabla (excluyendo el encabezado)
// //   for (let i = 1; i < table.rows.length - 1; i++) {
// //     let row = table.rows[i];

// //     // Obtener la solicitud
// //     let solicitud = row.querySelector("#solicitud").textContent.trim();

// //     // Obtener el valor del artículo
// //     let articulo = row
// //       .querySelector("#verifica-articulo span")
// //       .textContent.trim();

// //     // Obtener la cantidad pedida
// //     let cantidadPedida = row
// //       .querySelector("#cantidadPedida")
// //       .textContent.trim();

// //     // Obtener la cantidad leída
// //     let cantidadLeida =
// //       row.querySelector("#cantidadLeida").textContent.trim() || 0;

// //     // 3. Buscar si este artículo tiene un tiempo de lectura guardado en nuestro mapa
// //     // Si no lo encuentra por alguna razón, podemos ponerle null o el tiempo actual como fallback
// //     let tiempoLecturaAsociado = mapaTiempos[articulo] || null;

// //     // Crear un objeto para cada fila incluyendo la propiedad TIEMPO_LECTURA
// //     var detalle = {
// //       SOLICITUD: solicitud,
// //       ARTICULO: articulo,
// //       CANT_CONSEC: cantidadPedida,
// //       CANT_LEIDA: cantidadLeida,
// //       TIEMPO_LECTURA: tiempoLecturaAsociado // <-- Inyección del dato
// //     };

// //     // Agregar el objeto al array
// //     detalles.push(detalle);
// //   }
  
// //   // Convertir el array de objetos a formato JSON
// //   var jsonDetalles = encodeURIComponent(JSON.stringify(detalles));
// //   console.log("JSONDetalles:\n\t:" + decodeURIComponent(jsonDetalles) );
  
// //   const params =
// //     "?pSistema=" +
// //     pSistema +
// //     "&pUsuario=" +
// //     pUsuario +
// //     "&pOpcion=" +
// //     pOpcion +
// //     "&pModulo=" +
// //     pModulo +
// //     "&pConsecutivo=" +
// //     pConsecutivo +
// //     "&jsonDetalles=" +
// //     jsonDetalles +
// //     "&pEstado=" +
// //     pEstado +
// //     "&pBodegaEnvia=" +
// //     pBodegaEnvia +
// //     "&pBodegaDestino=" +
// //     pBodegaDestino +
// //     "&pUsuarioAutorizacion=" +
// //     pUsuarioAutorizacion;
// //     mostrarLoader();
// //   fetch(env.API_URL + "contenedor" + params, myInit)
// //     .then((response) => response.json())
// //     .then((result) => {
// //       if (result.msg === "SUCCESS") {
// //         if (result.contenedor.length != 0) {
// //           // Swal.fire({
// //           //   icon: "success",
// //           //   title: result.message,
// //           //   confirmButtonText: "Aceptar",
// //           //   confirmButtonColor: "#28a745",
// //           //   cancelButtonColor: "#6e7881",
// //           // }).then((result) => {
// //           //   if (result.isConfirmed) {
// //           //     localStorage.setItem('guardado', true);
// //           //     window.location.reload();
// //           //   }
// //           // });
// //         }
// //       } else {
// //         console.log(result.message);
// //       }
// //     });
// //    ocultarLoader(); 
// // }
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

  // Evaluar si la vista permite edición (si la opción NO es procesado "A")
  var esModificable = localStorage.getItem("contenDetalleOPC") !== "A";

  detalleLineasContenedor.forEach(function (detalle) {
    var newRow = document.createElement("tr");

    var consecutivo = parseFloat(detalle.LineaConsecutivo) || 0;
    var contada = parseFloat(detalle.LineaContada) || 0;
    var mostrarLineaContada = contada === 0 ? "" : contada.toFixed(2);

    // Atributos dinámicos para habilitar la edición según el estado
    var editableAttr = esModificable ? 'contenteditable="true" class="editable-cantidad"' : 'contenteditable="false"';
    var onblurAttr = esModificable ? `onblur="modificarCantidadManual(this, '${detalle.Articulo}')"` : '';

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
        <td id="cantidadLeida" ${editableAttr} ${onblurAttr}>${mostrarLineaContada}</td> 
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
        <td id="cantidadLeida" ${editableAttr} ${onblurAttr} class="red-text text-darken-4">${mostrarLineaContada}</td> 
        <td id="totalCedi">0.00</td>
        <td id="verificado" contenteditable="false"></td> 
        <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
        <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
    }
    tbody.appendChild(newRow);
  }); 

  verificacion();
}


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

//   detalleLineasContenedor.forEach(function (detalle) {
//     var newRow = document.createElement("tr");

//     var consecutivo = parseFloat(detalle.LineaConsecutivo) || 0;
//     var contada = parseFloat(detalle.LineaContada) || 0;
//     var mostrarLineaContada = contada === 0 ? "" : contada.toFixed(2);

//     if (detalle.total_cedi > 0) {
//       newRow.innerHTML = `
//         <td id="articulo">
//           <h5 id="verifica-articulo">
//             <span class="blue-text text-darken-2 centered">${detalle.Articulo}</span>
//           </h5>
//           <h6>${detalle.Descripcion}</h6>
//         </td>
//         <td id="codigoDeBarras">${detalle.Codigo_Barra || ""}</td>
//         <td id="cantidadPedida">${consecutivo.toFixed(2)}</td>
//         <td id="cantidadLeida">${mostrarLineaContada}</td> 
//         <td id="totalCedi">${
//           isNaN(parseFloat(detalle.total_cedi))
//             ? "0.00"
//             : parseFloat(detalle.total_cedi).toFixed(2)
//         }</td>
//         <td id="verificado"></td> 
//         <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
//         <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
//     } else {
//       newRow.innerHTML = `
//         <td id="articulo" contenteditable="false">
//           <h5 id="verifica-articulo">
//             <span class="red-text text-darken-4 centered">${detalle.Articulo}</span>
//           </h5>
//           <h6 class="red-text text-darken-4">${detalle.Descripcion}</h6>
//         </td>
//         <td id="codigoDeBarras" contenteditable="false" class="red-text text-darken-4">${detalle.Codigo_Barra || ""}</td>
//         <td id="cantidadPedida" contenteditable="false" class="red-text text-darken-4">${consecutivo.toFixed(2)}</td>
//         <td id="cantidadLeida" contenteditable="false" class="red-text text-darken-4">${mostrarLineaContada}</td> 
//         <td id="totalCedi">0.00</td>
//         <td id="verificado" contenteditable="false"></td> 
//         <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
//         <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
//     }
//     tbody.appendChild(newRow);
//   }); 
//   verificacion();
// }

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

/**
 * Maneja la edición manual de la celda cantidadLeida en la tabla de verificación.
 * Sincroniza la memoria global, limpia temporales y recalcula totales visuales.
 */
function modificarCantidadManual(celda, articuloCodigo) {
  let nuevaCantidad = parseFloat(celda.textContent.trim());

  // Validar que sea un número válido y positivo
  if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
    nuevaCantidad = 0;
    celda.textContent = "0.00";
  } else {
    celda.textContent = nuevaCantidad.toFixed(2);
  }

  // 1. Actualizar el arreglo de respuesta global para mantener consistencia en vista
  if (typeof detalleLineasContenedor !== "undefined" && Array.isArray(detalleLineasContenedor)) {
    let itemBD = detalleLineasContenedor.find(p => p.Articulo === articuloCodigo);
    if (itemBD) {
      itemBD.LineaContada = nuevaCantidad;
    }
  }

  // 2. Limpiar las lecturas temporales acumuladas de este artículo en localStorage
  let dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  dataArray = dataArray.filter(item => item.ARTICULO !== articuloCodigo);
  localStorage.setItem("dataArray", JSON.stringify(dataArray));

  let acumulado = JSON.parse(localStorage.getItem("acumuladoLecturas")) || {};
  if (acumulado[articuloCodigo]) {
    delete acumulado[articuloCodigo];
    localStorage.setItem("acumuladoLecturas", JSON.stringify(acumulado));
  }

  // 3. Re-evaluar colores de estado y recálculo de totales en la UI
  if (typeof verificacion === "function") {
    verificacion();
  }
  if (typeof actualizarTotalesTablaVerificacion === "function") {
    actualizarTotalesTablaVerificacion();
  }
}
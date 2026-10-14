/**
 * @description Variable global que contiene el detalle de las líneas de contenedores
 */
var detalleLineasContenedoreses = [];

document.addEventListener("DOMContentLoaded", function () {
  const obs = localStorage.getItem("Observaciones");
  const observacionesElemento = document.getElementById("observaciones");

  if (observacionesElemento) {
    observacionesElemento.value = obs ? obs : "";
  }

  // Inicializar Datepickers de Materialize
  const dateInputs = document.querySelectorAll(".datepicker");
  M.Datepicker.init(dateInputs, {
    format: "yyyy-mm-dd",
    autoClose: true
  });

  cargarSelectPlacas();
  cargarSelectConductores();
  cargarBodegas();
});

window.onload = function () {
  guardarTablaEnArray();
};

function alternarEstadoBotonesAccion(habilitar) {
  const btnLectura = document.getElementById("btnGuardarLectura");
  const btnVerificacion = document.getElementById("btnGuardarVerificacion");
  const btnProcesar = document.getElementById("btnCrearPaqueteContenedor");

  if (btnLectura) btnLectura.disabled = !habilitar;
  if (btnVerificacion) btnVerificacion.disabled = !habilitar;
  if (btnProcesar) btnProcesar.disabled = !habilitar;
}

function validarBusquedaContenedor() {
  let bodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let pBodegaSolicita = document.getElementById("bodegaSelect").value;

  if (pBodegaSolicita === "" || bodega === "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor seleccione la bodega origen y la bodega de destino.",
      confirmButtonColor: "#28a745"
    });
    return;
  }

  if (typeof mostrarLoader === "function") mostrarLoader("Cargando líneas de contenedores...");

  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let chkporContenedor = document.getElementById("chk-mostrar-contenedor");
  let pOpcion = chkporContenedor && chkporContenedor.checked ? "B" : "D";

  let pBodegaEnvia = bodega;
  let pConsecutivo = $("#pContenedor").val() || "";
  let pEstado = "";
  let pFechaDesde = $("#fecha_ini").val() || "";
  let pArticulo = "";

  const params =
    "?pSistema=" + pSistema +
    "&pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pBodegaEnvia=" + pBodegaEnvia +
    "&pBodegaDestino=" + pBodegaSolicita +
    "&pContenedor=" + pConsecutivo +
    "&pEstado=" + pEstado +
    "&pFechaDesde=" + pFechaDesde +
    "&pArticulo=" + pArticulo;

  localStorage.setItem("parametrosBusquedaPaquete", params);
  enviarDatosControlador(params);
}

function enviarDatosControlador(params) {
  fetch(env.API_URL + "verificadordecontenedores" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        detalleLineasContenedoreses = result.respuesta || [];

        if (detalleLineasContenedoreses.length > 0) {
          alternarEstadoBotonesAccion(true);
          armarTablaLectura(detalleLineasContenedoreses);
          guardarTablaEnArray();
          armarTablaVerificacion(detalleLineasContenedoreses);
          mostrarPestanaLectura();

          Swal.fire({
            icon: "success",
            title: "Datos cargados",
            text: `Se cargaron ${detalleLineasContenedoreses.length} registros para verificación.`,
            confirmButtonColor: "#28a745"
          });
        } else {
          alternarEstadoBotonesAccion(false);
          limpiarResultadoGeneral();
          limpiarTblLectura();
          mostrarPestanaLectura();

          Swal.fire({
            icon: "info",
            title: "Sin registros",
            text: "No hay líneas asignadas bajo los criterios seleccionados.",
            confirmButtonColor: "#28a745"
          });
        }
      } else {
        alternarEstadoBotonesAccion(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Se registró un error al consultar el servicio.",
          confirmButtonColor: "#ef4444"
        });
      }
    })
    .catch((err) => {
      console.error("Error en verificadordecontenedores:", err);
      alternarEstadoBotonesAccion(false);
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblcontenedores");
  const resultadoPaginador = document.getElementById("resultadoPaginador");
  const totalRegistros = document.getElementById("cantidadDeRegistros");

  if (resultadoPaginador) resultadoPaginador.innerHTML = "";
  if (totalRegistros) totalRegistros.textContent = "Cantidad de registros: 0";

  if (tabla) {
    let tbody = tabla.querySelector("tbody");
    if (tbody) tbody.innerHTML = "";
    let tfoot = tabla.querySelector("tfoot");
    if (tfoot) tfoot.remove();
  }
}

function limpiarTblLectura() {
  const tabla = document.getElementById("myTableLectura");
  if (tabla) {
    let tbody = tabla.querySelector("tbody");
    if (tbody) tbody.innerHTML = "";
  }
  crearNuevaFila();
}

function cargarBodegas() {
  fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra")
    .then((response) => response.json())
    .then((data) => {
      const bodegasSelect = document.getElementById("bodegaSelect");
      if (!bodegasSelect) return;

      if (data.respuesta && Array.isArray(data.respuesta)) {
        bodegasSelect.innerHTML = '<option value="" disabled selected>Seleccione una bodega</option>';
        data.respuesta.forEach((bodega) => {
          const option = document.createElement("option");
          option.value = bodega.BODEGA;
          option.textContent = `${bodega.BODEGA} - ${bodega.NOMBRE}`;
          bodegasSelect.appendChild(option);
        });
      }
    })
    .catch((error) => console.error("Error al cargar las bodegas:", error));
}

// =============================================================================
// LECTURA Y PISTOLEO
// =============================================================================
function armarTablaLectura(detalleLineasContenedor) {
  var tbody = document.getElementById("tblbodyLectura");
  if (!tbody) return;
  tbody.innerHTML = "";

  detalleLineasContenedor.forEach(function (detalle) {
    let cantLeida = parseFloat(detalle.Cant_Leida) || 0;
    if (cantLeida > 0) {
      var newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td class="cell-center">
          <span style="font-weight: 600; color: #1e293b;">${detalle.Articulo}</span>
        </td>
        <td>
          <input type="text" class="codigo-barras-input" value="${detalle.Codigo_Barra || ""}" onchange="validarCodigoBarras(this)" autofocus autocomplete="off">
        </td>
        <td>
          <input type="text" class="codigo-barras-input" value="${cantLeida}" onchange="guardarTablaEnArray()">
        </td>
        <td class="cell-center">
          <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFila(this)">delete</i>
        </td>
      `;
      tbody.appendChild(newRow);
    }
  });

  guardarTablaEnArray();
  crearNuevaFila();
}

function validarCodigoBarras(input) {
  var LineasContenedor = detalleLineasContenedoreses;
  const codbarra = input.value.toUpperCase().trim();

  if (codbarra === "") return;

  const row = input.closest("tr");
  const span = row.cells[0].querySelector("span");
  const cantFila = row.cells[2].querySelector("input");

  var codigoValido = false;

  for (var i = 0; i < LineasContenedor.length; i++) {
    let codigosArrayArticulo = [];
    if (LineasContenedor[i].codigos_barras) {
      codigosArrayArticulo = LineasContenedor[i].codigos_barras
        .split("|")
        .map((codigo) => codigo.toUpperCase().trim());
    }

    if (
      (LineasContenedor[i].Articulo && LineasContenedor[i].Articulo.toUpperCase() === codbarra) ||
      (LineasContenedor[i].Codigo_Barra && LineasContenedor[i].Codigo_Barra.toUpperCase() === codbarra) ||
      codigosArrayArticulo.includes(codbarra)
    ) {
      if (parseFloat(LineasContenedor[i].total_cedi || 0) > 0) {
        span.textContent = LineasContenedor[i].Articulo;
        cantFila.value = 1;
        input.setAttribute("readonly", "readonly");
        crearNuevaFila();
        guardarTablaEnArray();
        codigoValido = true;
        break;
      } else {
        Swal.fire({
          icon: "warning",
          title: "Artículo sin existencias",
          text: `La referencia ${LineasContenedor[i].Articulo} no cuenta con existencias en CEDI.`,
          confirmButtonColor: "#28a745"
        });
        input.value = "";
        codigoValido = true;
        break;
      }
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
      <input type="text" class="codigo-barras-input" value="" onchange="actualizaLectura(this)" autocomplete="off">
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

function actualizaLectura() {
  guardarTablaEnArray();
}

function guardarTablaEnArray() {
  var dataArray = [];
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
      dataArray.push({
        ARTICULO: articulo,
        CODIGO_BARRA: codigoBarra,
        CANTIDAD_LEIDA: cantidadLeida
      });
    }
  }

  localStorage.setItem("dataArray", JSON.stringify(dataArray));
  agrupar();
  actualizarProgresoLectura();
  return dataArray;
}

function agrupar() {
  var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  var cantidadesConsolidadas = {};

  dataArray.forEach(function (item) {
    var articulo = item.ARTICULO;
    var cantidad = item.CANTIDAD_LEIDA;

    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      cantidadesConsolidadas[articulo] += cantidad;
    } else {
      cantidadesConsolidadas[articulo] = cantidad;
    }
  });

  var newArray = [];
  for (var articulo in cantidadesConsolidadas) {
    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      newArray.push({
        ARTICULO: articulo,
        CANTIDAD_LEIDA: cantidadesConsolidadas[articulo]
      });
    }
  }

  localStorage.setItem("dataArray", JSON.stringify(newArray));
}

function eliminarFila(icon) {
  var row = icon.closest("tr");

  Swal.fire({
    title: "¿Estás seguro?",
    text: "Se eliminará la fila de la pestaña de lectura.",
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
        Swal.fire({
          icon: "warning",
          title: "Fila vacía",
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
// CÁLCULO DE PROGRESO Y TOTALES
// =============================================================================
function calcularTotalUnidadesApreparar() {
  const tbodyVerificacion = document.getElementById("tblbodyLineasContenedor");
  let totalUnidades = 0;

  if (tbodyVerificacion) {
    tbodyVerificacion.querySelectorAll("tr").forEach((fila) => {
      const celdas = fila.querySelectorAll("td");
      if (celdas[3]) {
        totalUnidades += parseFloat(celdas[3].textContent.trim()) || 0;
      }
    });
  }
  return totalUnidades;
}

function calcularTotalUnidadesLeidas() {
  const tbodyLectura = document.getElementById("tblbodyLectura");
  let totalLeido = 0;

  if (tbodyLectura) {
    tbodyLectura.querySelectorAll("tr").forEach((fila) => {
      const input = fila.cells[2]?.querySelector("input");
      if (input) {
        totalLeido += parseFloat(input.value) || 0;
      }
    });
  }
  return totalLeido;
}

function actualizarProgresoLectura() {
  const totalUnidadesApreparar = calcularTotalUnidadesApreparar();
  const totalUnidadesLeidas = calcularTotalUnidadesLeidas();
  const labelProgreso = document.getElementById("progresoLecturaLabel");

  if (labelProgreso) {
    labelProgreso.textContent = `Progreso: ${totalUnidadesLeidas.toFixed(0)} / ${totalUnidadesApreparar.toFixed(0)}`;
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

// =============================================================================
// VERIFICACIÓN
// =============================================================================
function armarTablaVerificacion(detalleLineasContenedores) {
  const tbody = document.getElementById("tblbodyLineasContenedor");
  if (!tbody) return;
  tbody.innerHTML = "";

  const chkMostrarContenedor = document.getElementById("chk-mostrar-contenedor");
  const esModoContenedor = chkMostrarContenedor ? chkMostrarContenedor.checked : false;

  const lineasAProcesar = esModoContenedor
    ? detalleLineasContenedores
    : detalleLineasContenedores.filter((detalle) => detalle.Estado_ml !== "");

  lineasAProcesar.sort((a, b) => {
    const contenedorA = a.Contenedor || "";
    const contenedorB = b.Contenedor || "";
    return contenedorA.localeCompare(contenedorB);
  });

  const cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
  if (cantidadDeRegistrosLabel) {
    cantidadDeRegistrosLabel.textContent = "Cantidad de registros: " + lineasAProcesar.length;
  }

  lineasAProcesar.forEach((detalle) => {
    const newRow = document.createElement("tr");

    let cantPed = parseFloat(detalle.Cant_Pedida) || 0;
    let cantPrep = parseFloat(detalle.Cant_Verificada) || 0;

    newRow.innerHTML = `
      <td class="contenedor cell-center" style="font-weight: 700; color: #1e293b;">
        <div>${detalle.Contenedor || ""}</div>
        <small style="color: #64748b;">${detalle.Traslado || ""}</small>
        <span class="solicitud" style="display: none;">${detalle.Traslado || ""}</span>
      </td>
      <td class="articulo" style="text-align: left;">
        <div class="cell-articulo-box">
          <span class="cell-articulo-code verifica-articulo" style="color: #0284c7;">
            <span>${detalle.Articulo || ""}</span>
          </span>
          <span class="cell-articulo-desc">${detalle.Descripcion || ""}</span>
        </div>
      </td>
      <td class="cantidadPedida cell-number">${cantPed.toFixed(2)}</td>
      <td class="cantidadPreparada cell-number">${cantPrep.toFixed(2)}</td>
      <td class="cantidadLeida cell-number"></td>
      <td class="verificado cell-center"></td>
      <td class="devolver cell-center">
        <i class="material-icons"
           title="Devolver artículo"
           style="color: #ef4444; cursor: pointer; font-size: 20px;"
           onclick="autorizaDevolucion('${detalle.Articulo}', '${detalle.Contenedor}', '${cantPrep.toFixed(2)}')">
           reply
        </i>
      </td>
    `;
    tbody.appendChild(newRow);
  });

  verificacion();
}

function verificacion() {
  const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  const tabla = document.getElementById("tblcontenedores");
  if (!tabla) return;

  const filas = Array.from(tabla.querySelectorAll("tbody tr"));
  const mensajesArray = [];

  filas.forEach((fila) => {
    const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
    const verifcheck = fila.querySelector(".verificado");
    if (cantidadLeidaCell) cantidadLeidaCell.textContent = "";
    if (verifcheck) verifcheck.textContent = "";
  });

  const cantidadesTotalesLectura = {};
  dataArray.forEach((item) => {
    const art = item.ARTICULO ? item.ARTICULO.trim() : "";
    const cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
    if (art) {
      cantidadesTotalesLectura[art] = (cantidadesTotalesLectura[art] || 0) + cant;
    }
  });

  const chkPorContenedor = document.getElementById("chk-mostrar-contenedor");
  const esPorContenedor = chkPorContenedor ? chkPorContenedor.checked : false;

  if (esPorContenedor) {
    const saldosDisponibles = { ...cantidadesTotalesLectura };
    const filasPorArticulo = {};

    filas.forEach((fila) => {
      const articuloCell = fila.querySelector(".verifica-articulo span");
      if (articuloCell) {
        const art = articuloCell.textContent.trim();
        if (!filasPorArticulo[art]) filasPorArticulo[art] = [];
        filasPorArticulo[art].push(fila);
      }
    });

    Object.keys(filasPorArticulo).forEach((articulo) => {
      const listaFilas = filasPorArticulo[articulo];
      const totalFilas = listaFilas.length;

      listaFilas.forEach((fila, index) => {
        const cantPreparadaCell = fila.querySelector(".cantidadPreparada");
        const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
        const verificadoCell = fila.querySelector(".verificado");

        const cantPedida = parseFloat(cantPreparadaCell?.textContent) || 0;
        let saldoDisponible = saldosDisponibles[articulo] || 0;
        let cantLeidaAsignada = 0;

        const esUltimoContenedor = index === totalFilas - 1;

        if (esUltimoContenedor) {
          cantLeidaAsignada = saldoDisponible;
          saldosDisponibles[articulo] = 0;
        } else {
          if (saldoDisponible >= cantPedida) {
            cantLeidaAsignada = cantPedida;
            saldosDisponibles[articulo] -= cantPedida;
          } else {
            cantLeidaAsignada = saldoDisponible;
            saldosDisponibles[articulo] = 0;
          }
        }

        if (cantidadLeidaCell) {
          cantidadLeidaCell.textContent = cantLeidaAsignada > 0 ? cantLeidaAsignada.toFixed(2) : "";
        }

        if (Math.abs(cantLeidaAsignada - cantPedida) <= 0.001 && cantLeidaAsignada > 0) {
          if (verificadoCell) {
            verificadoCell.innerHTML = `<i class="material-icons" style="color: #28a745 !important; font-size: 22px; vertical-align: middle;">done_all</i>`;
          }
        } else if (cantLeidaAsignada > cantPedida) {
          const diff = (cantLeidaAsignada - cantPedida).toFixed(2);
          if (verificadoCell) {
            verificadoCell.textContent = `+${diff}`;
            verificadoCell.style.color = "#dc2626";
            verificadoCell.style.fontWeight = "bold";
          }
          mensajesArray.push(`• El artículo ${articulo} excede en +${diff} en su contenedor.`);
        } else if (cantLeidaAsignada < cantPedida && cantLeidaAsignada > 0) {
          const diff = (cantLeidaAsignada - cantPedida).toFixed(2);
          if (verificadoCell) {
            verificadoCell.textContent = diff;
            verificadoCell.style.color = "#ea580c";
            verificadoCell.style.fontWeight = "bold";
          }
          mensajesArray.push(`• El artículo ${articulo} presenta faltante de ${diff}.`);
        }
      });
    });
  } else {
    filas.forEach((fila) => {
      const articuloCell = fila.querySelector(".verifica-articulo span");
      const cantPreparadaCell = fila.querySelector(".cantidadPreparada");
      const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
      const verificadoCell = fila.querySelector(".verificado");

      if (!articuloCell || !cantPreparadaCell) return;

      const articulo = articuloCell.textContent.trim();
      const cantPedida = parseFloat(cantPreparadaCell.textContent) || 0;
      const cantLeida = cantidadesTotalesLectura.hasOwnProperty(articulo)
        ? cantidadesTotalesLectura[articulo]
        : 0;

      if (cantidadLeidaCell) {
        cantidadLeidaCell.textContent = cantLeida > 0 ? cantLeida.toFixed(2) : "";
      }

      if (Math.abs(cantLeida - cantPedida) <= 0.001 && cantLeida > 0) {
        if (verificadoCell) {
          verificadoCell.innerHTML = `<i class="material-icons" style="color: #28a745 !important; font-size: 22px; vertical-align: middle;">done_all</i>`;
        }
      } else if (cantLeida > cantPedida) {
        const diff = (cantLeida - cantPedida).toFixed(2);
        if (verificadoCell) {
          verificadoCell.textContent = `+${diff}`;
          verificadoCell.style.color = "#dc2626";
          verificadoCell.style.fontWeight = "bold";
        }
        mensajesArray.push(`• El artículo ${articulo} excede en +${diff}.`);
      } else if (cantLeida < cantPedida && cantLeida > 0) {
        const diff = (cantLeida - cantPedida).toFixed(2);
        if (verificadoCell) {
          verificadoCell.textContent = diff;
          verificadoCell.style.color = "#ea580c";
          verificadoCell.style.fontWeight = "bold";
        }
        mensajesArray.push(`• El artículo ${articulo} tiene pendiente ${diff}.`);
      }
    });
  }

  calcularTotalesVerificacion();
  localStorage.setItem("mensajes", JSON.stringify(mensajesArray));

  const mensajeText = document.getElementById("mensajeText");
  if (mensajeText) mensajeText.value = mensajesArray.join("\n");
}

function calcularTotalesVerificacion() {
  const tabla = document.getElementById("tblcontenedores");
  const tbody = document.getElementById("tblbodyLineasContenedor");
  if (!tabla || !tbody) return;

  const INDICES_SUMA = [2, 3, 4];
  const totales = INDICES_SUMA.map(() => 0);

  const filas = tbody.querySelectorAll("tr");
  filas.forEach((fila) => {
    const celdas = fila.querySelectorAll("td");
    INDICES_SUMA.forEach((indiceColumna, indiceTotal) => {
      if (celdas[indiceColumna]) {
        let valor = parseFloat(celdas[indiceColumna].textContent.trim()) || 0;
        totales[indiceTotal] += valor;
      }
    });
  });

  let tfoot = tabla.querySelector("tfoot");
  if (tfoot) tfoot.remove();
  tfoot = document.createElement("tfoot");

  const filaTotal = document.createElement("tr");
  filaTotal.style.fontWeight = "700";
  filaTotal.style.backgroundColor = "#fef9c3";

  let celdaLabel = document.createElement("td");
  celdaLabel.textContent = "TOTALES:";
  celdaLabel.setAttribute("colspan", 2);
  celdaLabel.style.textAlign = "center";
  filaTotal.appendChild(celdaLabel);

  INDICES_SUMA.forEach((_, indiceTotal) => {
    let celdaTotal = document.createElement("td");
    celdaTotal.className = "cell-number";
    celdaTotal.textContent = totales[indiceTotal].toFixed(2);
    filaTotal.appendChild(celdaTotal);
  });

  let celdaVerif = document.createElement("td");
  filaTotal.appendChild(celdaVerif);
  let celdaDev = document.createElement("td");
  filaTotal.appendChild(celdaDev);

  tfoot.appendChild(filaTotal);
  tabla.appendChild(tfoot);

  // Inicializar o refrescar paginador
  $("#resultadoPaginador").empty();
  if ($.fn.pageMe) {
    $("#tblcontenedores tbody").pageMe({
      pagerSelector: "#resultadoPaginador",
      perPage: typeof xPag !== "undefined" ? xPag : 20
    });
  }
}

function mostrarPestanaLectura() {
  const btnLec = document.getElementById("btnTabLectura");
  if (btnLec) btnLec.click();
}

function filtrarTablaVerificacion() {
  if (!detalleLineasContenedoreses || detalleLineasContenedoreses.length === 0) return;

  const textoBusqueda = document.getElementById("filtrarArticuloVerif").value.toLowerCase().trim();

  if (textoBusqueda === "") {
    armarTablaVerificacion(detalleLineasContenedoreses);
    return;
  }

  const datosFiltrados = detalleLineasContenedoreses.filter(function (detalle) {
    const contenedor = (detalle.Contenedor || "").toLowerCase();
    const articulo = (detalle.Articulo || "").toLowerCase();
    return contenedor.includes(textoBusqueda) || articulo.includes(textoBusqueda);
  });

  armarTablaVerificacion(datosFiltrados);
}

// =============================================================================
// GUARDADO Y PROCESAMIENTO
// =============================================================================
function confirmarGuardadoParcial() {
  Swal.fire({
    icon: "info",
    title: "¿Desea guardar el avance de lectura y verificación?",
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#0284c7"
  }).then((result) => {
    if (result.isConfirmed) {
      guardaParcialMente();
    }
  });
}

async function guardaParcialMente() {
  verificacion();
  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pOpcion = "L";
  let bodegaOrigen = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let pBodegaDestino = document.getElementById("bodegaSelect").value;
  let pFecha = new Date().toISOString().split("T")[0];
  let pPlaca = "";
  let pReferencia = "Ref o null";
  let pComentario = document.getElementById("observaciones").value;
  localStorage.setItem("Observaciones", pComentario);

  const table = document.getElementById("tblcontenedores");
  const detalles = [];

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    if (row.closest("tfoot")) continue;

    const contenedor = row.querySelector(".contenedor div")?.textContent.trim() || "0";
    const solicitud = row.querySelector(".solicitud")?.textContent.trim() || "0";
    const articulo = row.querySelector(".verifica-articulo span")?.textContent.trim() || "";
    const cantidadPedida = Number(row.querySelector(".cantidadPedida")?.textContent.trim() || 0);
    const cantidadPreparada = Number(row.querySelector(".cantidadPreparada")?.textContent.trim() || 0);
    const cantidadLeida = Number(row.querySelector(".cantidadLeida")?.textContent.trim() || 0);

    detalles.push({
      CONTENEDOR: contenedor,
      SOLICITUD: solicitud,
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_PREPARADA: cantidadPreparada,
      CANT_LEIDA: cantidadLeida
    });
  }

  const chunkSize = 20;
  const chunks = [];
  for (let i = 0; i < detalles.length; i += chunkSize) {
    chunks.push(detalles.slice(i, i + chunkSize));
  }

  if (typeof mostrarLoader === "function") mostrarLoader("Guardando datos en lotes...");

  let todoExitoso = true;
  for (let i = 0; i < chunks.length; i++) {
    const jsonPaquete = JSON.stringify(chunks[i]);
    const params =
      "?pSistema=" + pSistema +
      "&pUsuario=" + pUsuario +
      "&pOpcion=" + pOpcion +
      "&pBodegaOrigen=" + bodegaOrigen +
      "&pBodegaDestino=" + pBodegaDestino +
      "&pFecha=" + pFecha +
      "&pPlaca=" + pPlaca +
      "&jsonPaquete=" + encodeURIComponent(jsonPaquete) +
      "&pReferencia=" + pReferencia +
      "&pComentario=" + encodeURIComponent(pComentario);

    try {
      const response = await fetch(env.API_URL + "guardacreapaquete" + params, myInit);
      const result = await response.json();
      if (result.msg !== "SUCCESS") {
        todoExitoso = false;
        break;
      }
    } catch (err) {
      console.error(`Error enviando lote ${i + 1}:`, err);
      todoExitoso = false;
      break;
    }
  }

  if (typeof ocultarLoader === "function") ocultarLoader();

  if (todoExitoso) {
    Swal.fire({
      icon: "success",
      title: "Avance guardado con éxito",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#28a745"
    }).then((result) => {
      if (result.isConfirmed) {
        mostrarPestanaLectura();
      }
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Error al guardar",
      text: "No se pudieron procesar todos los lotes de guardado.",
      confirmButtonColor: "#ef4444"
    });
  }
}

async function guardaPaquete() {
  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pOpcion = "L";
  let pBodegaOrigen = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let pBodegaDestino = document.getElementById("bodegaSelect").value;
  let pFecha = new Date().toISOString().split("T")[0];
  let pPlaca = document.getElementById("placa-camion").value;
  let pReferencia = "Ref o null";
  let pComentario = document.getElementById("observaciones").value;

  const table = document.getElementById("tblcontenedores");
  const detalles = [];

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    if (row.closest("tfoot")) continue;

    const contenedor = row.querySelector(".contenedor div")?.textContent.trim() || "0";
    const solicitud = row.querySelector(".solicitud")?.textContent.trim() || "0";
    const articulo = row.querySelector(".verifica-articulo span")?.textContent.trim() || "";
    const cantidadPedida = Number(row.querySelector(".cantidadPedida")?.textContent.trim() || 0);
    const cantidadPreparada = Number(row.querySelector(".cantidadPreparada")?.textContent.trim() || 0);
    const cantidadLeida = Number(row.querySelector(".cantidadLeida")?.textContent.trim() || 0);

    detalles.push({
      CONTENEDOR: contenedor,
      SOLICITUD: solicitud,
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_PREPARADA: cantidadPreparada,
      CANT_LEIDA: cantidadLeida
    });
  }

  const chunkSize = 20;
  const chunks = [];
  for (let i = 0; i < detalles.length; i += chunkSize) {
    chunks.push(detalles.slice(i, i + chunkSize));
  }

  if (typeof mostrarLoader === "function") mostrarLoader("Guardando y verificando antes de paquetizar...");

  let fallo = false;
  for (let i = 0; i < chunks.length; i++) {
    const jsonPaquete = JSON.stringify(chunks[i]);
    const params =
      "?pSistema=" + pSistema +
      "&pUsuario=" + pUsuario +
      "&pOpcion=" + pOpcion +
      "&pBodegaOrigen=" + pBodegaOrigen +
      "&pBodegaDestino=" + pBodegaDestino +
      "&pFecha=" + pFecha +
      "&pPlaca=" + pPlaca +
      "&jsonPaquete=" + encodeURIComponent(jsonPaquete) +
      "&pReferencia=" + pReferencia +
      "&pComentario=" + encodeURIComponent(pComentario);

    try {
      const response = await fetch(env.API_URL + "guardacreapaquete" + params, myInit);
      const result = await response.json();

      if (result.msg !== "SUCCESS" || result.respuesta[0]?.Respuesta !== "OK") {
        fallo = true;
        Swal.fire({
          icon: "error",
          title: "Error de preparación",
          text: result.respuesta[0]?.Respuesta || "Fallo en el servicio.",
          confirmButtonColor: "#ef4444"
        });
        break;
      }
    } catch (err) {
      fallo = true;
      console.error(`Error al enviar lote ${i + 1}:`, err);
      break;
    }
  }

  if (typeof ocultarLoader === "function") ocultarLoader();

  if (!fallo) {
    ConfirmaCrearPaqueteContenedores();
  }
}

function ConfirmaCrearPaqueteContenedores() {
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
        CrearPaqueteContenedores();
      } else {
        Swal.fire({
          title: "Requiere Autorización",
          html:
            '<p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">Existen discrepancias en las cantidades leídas.</p>' +
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
        }).then((resultAuth) => {
          if (!resultAuth.isDismissed && resultAuth.value && resultAuth.value.usuario && resultAuth.value.contraseña) {
            const params = `?pSistema=WMS&pUsuario=${resultAuth.value.usuario}&pOpcion=${resultAuth.value.contraseña}`;

            fetch(env.API_URL + "wmsautorizaciones" + params)
              .then((response) => response.json())
              .then((resultado) => {
                if (resultado.autorizacion && resultado.autorizacion[0]?.mensaje === "OK") {
                  CrearPaqueteContenedores();
                } else {
                  Swal.fire({
                    icon: "error",
                    title: "Credenciales inválidas",
                    text: "No se autorizó la creación del paquete.",
                    confirmButtonColor: "#ef4444"
                  });
                }
              })
              .catch((error) => {
                console.error("Error al obtener autorización:", error);
                Swal.fire({
                  icon: "error",
                  title: "Error de red",
                  text: "No se pudo validar la autorización en el API.",
                  confirmButtonColor: "#ef4444"
                });
              });
          }
        });
      }
    }
  });
}

function CrearPaqueteContenedores() {
  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pOpcion = "R";
  let pBodegaOrigen = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let pBodegaDestino = document.getElementById("bodegaSelect").value;
  let pFecha = new Date().toISOString().split("T")[0];
  let conductor = document.getElementById("conductor-camion").value;
  let placa = document.getElementById("placa-camion").value;
  let pPlaca = placa + "|" + conductor;

  let jsonPaquete = "";
  let pReferencia = document.getElementById("pContenedor").value;
  let pComentario = document.getElementById("observaciones").value;

  if (pPlaca === "|" || placa === "") {
    Swal.fire({
      icon: "warning",
      title: "Parámetros incompletos",
      text: "Debe seleccionar la placa y el conductor del camión.",
      confirmButtonColor: "#28a745"
    });
    return;
  }

  const params =
    "?pSistema=" + pSistema +
    "&pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pBodegaOrigen=" + pBodegaOrigen +
    "&pBodegaDestino=" + pBodegaDestino +
    "&pFecha=" + pFecha +
    "&pPlaca=" + pPlaca +
    "&jsonPaquete=" + jsonPaquete +
    "&pReferencia=" + pReferencia +
    "&pComentario=" + encodeURIComponent(pComentario);

  if (typeof mostrarLoader === "function") mostrarLoader("Generando paquete...");

  fetch(env.API_URL + "guardacreapaquete" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta.length !== 0) {
          let respuesta = result.respuesta[0].Respuesta;
          if (respuesta.toUpperCase().startsWith("TRAS")) {
            Swal.fire({
              icon: "success",
              title: "Paquete creado con éxito",
              text: `Paquete N° ${respuesta}`,
              showDenyButton: true,
              confirmButtonText: "Aceptar",
              denyButtonText: "Imprimir PDF",
              confirmButtonColor: "#28a745",
              denyButtonColor: "#0284c7"
            }).then((resultSwal) => {
              if (resultSwal.isDenied) {
                imprimirPaqueteReporte(respuesta);
              }
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: respuesta,
              confirmButtonColor: "#ef4444"
            });
          }
        }
      }
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

const validarVerificacion = () => {
  const filas = document.querySelectorAll("#tblbodyLineasContenedor tr");
  if (filas.length === 0) return false;

  return Array.from(filas).every((row) => {
    const celdaVerif = row.cells[5];
    if (!celdaVerif) return false;
    const icono = celdaVerif.querySelector("i.material-icons, span.material-icons");
    return icono?.textContent?.trim() === "done_all";
  });
};

function mostrarMensajesLocalStorage() {
  const mensajesStorage = localStorage.getItem("mensajes");
  if (mensajesStorage) {
    const mensajes = JSON.parse(mensajesStorage);
    const textarea = document.getElementById("mensajeText");
    if (textarea) {
      textarea.value = mensajes.join("\n");
    }
  }
}

// =============================================================================
// DEVOLUCIÓN DE LÍNEAS
// =============================================================================
function autorizaDevolucion(articulo, contenedor, cantidadPreparada) {
  Swal.fire({
    title: "Autorización Requerida",
    html:
      '<p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">Ingrese credenciales de supervisor para devolver el artículo.</p>' +
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
      const pass = document.getElementById("swal-input2").value;
      return { usuario: usuario, contraseña: pass };
    }
  }).then((result) => {
    if (!result.isDismissed && result.value && result.value.usuario && result.value.contraseña) {
      const params = `?pSistema=WMS&pUsuario=${result.value.usuario}&pOpcion=${result.value.contraseña}`;

      fetch(env.API_URL + "wmsautorizaciones" + params)
        .then((response) => response.json())
        .then((resultado) => {
          if (resultado.autorizacion && resultado.autorizacion[0]?.mensaje === "OK") {
            devolverArticulo(articulo, contenedor, cantidadPreparada);
          } else {
            Swal.fire({
              icon: "error",
              title: "No autorizado",
              text: "Credenciales de supervisor inválidas.",
              confirmButtonColor: "#ef4444"
            });
          }
        })
        .catch(() => {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo conectar con el servicio de autorización.",
            confirmButtonColor: "#ef4444"
          });
        });
    }
  });
}

function devolverArticulo(articulo, contenedor, cantidadPreparada) {
  const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  const encontrado = dataArray.find(
    (item) => item.ARTICULO.trim().toUpperCase() === articulo.trim().toUpperCase()
  );

  if (!encontrado) {
    Swal.fire({
      title: "Sin lecturas previas",
      text: `El artículo ${articulo} no registra lecturas en la sesión. ¿Desea procesar la devolución de todas formas?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6e7881"
    }).then((result) => {
      if (result.isConfirmed) {
        ejecutarLogicaDevolucion(articulo, contenedor, cantidadPreparada, 0);
      }
    });
  } else {
    const cantidadLeida = parseFloat(encontrado.CANTIDAD_LEIDA) || 0;
    ejecutarLogicaDevolucion(articulo, contenedor, cantidadPreparada, cantidadLeida);
  }
}

function ejecutarLogicaDevolucion(articulo, contenedor, cantidadPreparada, cantidadLeida) {
  const cantidadPreparadaNum = parseFloat(cantidadPreparada) || 0;
  const diferencia = cantidadPreparadaNum - cantidadLeida;

  Swal.fire({
    title: "Devolver Artículo",
    html: `
      <div style="text-align: left; font-size: 13.5px; line-height: 1.6;">
        <p style="margin: 3px 0;">Artículo: <b>${articulo}</b></p>
        <p style="margin: 3px 0;">Contenedor: <b>${contenedor}</b></p>
        <p style="margin: 3px 0;">Cant. Preparada: <b>${cantidadPreparadaNum.toFixed(2)}</b></p>
        <p style="margin: 3px 0;">Cant. Leída: <b>${cantidadLeida.toFixed(2)}</b></p>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #cbd5e1;">
        <p style="margin: 3px 0; color: #dc2626;"><b>Diferencia a devolver: ${diferencia.toFixed(2)}</b></p>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, devolver",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881"
  }).then((result) => {
    if (result.isConfirmed) {
      let pSistema = "WMS";
      let hUser = document.getElementById("hUsuario");
      let pUsuario = hUser ? hUser.value : "";
      let pOpcion = "c";
      let pBodegaEnvia = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
      let pBodegaDestino = document.getElementById("bodegaSelect").value;
      let pConsecutivo = $("#pContenedor").val() || "";
      let pEstado = "";
      let pFechaDesde = $("#fecha_ini").val() || "";
      let pArticulo = articulo;

      const params = `?pSistema=${pSistema}&pUsuario=${pUsuario}&pOpcion=${pOpcion}&pBodegaEnvia=${pBodegaEnvia}&pBodegaDestino=${pBodegaDestino}&pContenedor=${pConsecutivo}&pEstado=${pEstado}&pFechaDesde=${pFechaDesde}&pArticulo=${pArticulo}`;
      localStorage.setItem("parametrosBusquedaContenedor", params);

      if (typeof mostrarLoader === "function") mostrarLoader("Consultando líneas para devolución...");

      fetch(env.API_URL + "verificadordecontenedores" + params, myInit)
        .then((response) => response.json())
        .then((res) => {
          if (res.msg === "SUCCESS" && res.respuesta && res.respuesta.length !== 0) {
            mostrarTablaEnSwal(res.respuesta);
          } else {
            Swal.fire({
              icon: "info",
              title: "Información",
              text: "No se encontraron líneas disponibles para devolución.",
              confirmButtonColor: "#28a745"
            });
          }
        })
        .finally(() => {
          if (typeof ocultarLoader === "function") ocultarLoader();
        });
    }
  });
}

async function mostrarTablaEnSwal(data) {
  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pOpcion = "D";
  let BodegaEnvia = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let BodegaSolic = document.getElementById("bodegaSelect").value;
  let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || "";
  let contenedor = document.getElementById("pContenedor").value;

  const articulo = data[0]?.Articulo || "Sin Artículo";

  const tableRows = data
    .map(
      (item, index) => `
      <tr>
        <td style="text-align: left;"><b>${item.Contenedor || ""}</b><br><small style="color:#64748b;">${item.Traslado || ""}</small></td>
        <td style="text-align: right;">${Number(item.Cant_Verificada || 0).toFixed(2)}</td>
        <td style="text-align: center;"><input type="number" min="0" class="devolver-input custom-text-input" data-index="${index}" placeholder="0" style="width: 80px; text-align: center;"></td>
      </tr>
    `
    )
    .join("");

  const htmlContent = `
    <table class="tabla-transacciones" style="width: 100%; margin-top: 10px;">
      <thead>
        <tr>
          <th style="text-align: left;">Contenedor</th>
          <th style="text-align: right;">Cant. Prep.</th>
          <th style="text-align: center;">Cant. Devolver</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;

  const { value: cantidades } = await Swal.fire({
    title: `Devolución - ${articulo}`,
    html: htmlContent,
    icon: "info",
    confirmButtonText: "Aplicar Devolución",
    confirmButtonColor: "#28a745",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const inputs = document.querySelectorAll(".devolver-input");
      return Array.from(inputs)
        .map((input) => {
          const index = parseInt(input.getAttribute("data-index"), 10);
          const cantLeida = parseFloat(input.value) || 0;
          const cantPreparada = Number(data[index].Cant_Verificada || 0);

          if (cantLeida > cantPreparada) {
            Swal.showValidationMessage(`La cantidad a devolver excede lo preparado en ${data[index].Contenedor}.`);
            return null;
          }

          return {
            CONTENEDOR: data[index].Contenedor,
            SOLICITUD: data[index].Traslado,
            ARTICULO: articulo,
            CANT_PREPARADA: cantPreparada,
            CANT_LEIDA: cantLeida
          };
        })
        .filter((c) => c && c.CANT_LEIDA > 0);
    }
  });

  if (cantidades && cantidades.length > 0) {
    const jsonDetalles = JSON.stringify(cantidades);

    const params =
      "?pSistema=" + pSistema +
      "&pUsuario=" + pUsuario +
      "&pOpcion=" + pOpcion +
      "&BodegaSolic=" + BodegaSolic +
      "&BodegaEnvia=" + BodegaEnvia +
      "&pUsuarioAutorizacion=" + pUsuarioAutorizacion +
      "&jsonDetalles=" + encodeURIComponent(jsonDetalles) +
      "&pContenedor=" + contenedor;

    try {
      await enviarCantidadesDevolucion(params);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al enviar la devolución.",
        confirmButtonColor: "#ef4444"
      });
    }
  }
}

async function enviarCantidadesDevolucion(parametros) {
  if (typeof mostrarLoader === "function") mostrarLoader("Procesando devolución...");

  try {
    const response = await fetch(env.API_URL + "devolverarticulocontenedor" + parametros, myInit);
    const result = await response.json();

    if (result.msg === "SUCCESS") {
      Swal.fire({
        icon: "success",
        title: "Devolución completada",
        text: "El artículo ha sido devuelto correctamente.",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#28a745"
      }).then(() => {
        actualizaTablaVerificacion();
      });
    }
  } finally {
    if (typeof ocultarLoader === "function") ocultarLoader();
  }
}

function actualizaTablaVerificacion() {
  const parametrosBusqueda = localStorage.getItem("parametrosBusquedaPaquete");
  if (parametrosBusqueda) {
    enviarDatosControlador(parametrosBusqueda);
  }
}

// =============================================================================
// PDF & REPORTES
// =============================================================================
async function imprimirPaqueteReporte(respuesta) {
  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pPaquete = respuesta;

  const params = `?pSistema=${pSistema}&pUsuario=${pUsuario}&pTipoConsulta=l&pPaquete=${pPaquete}`;

  if (typeof mostrarLoader === "function") mostrarLoader("Generando PDF del paquete...");

  fetch(env.API_URL + "imprimepaquete" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.respuesta && result.respuesta.length > 0) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("P", "pt", "a4");

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("CREACIÓN DE PAQUETES", doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });

        doc.setFontSize(13);
        doc.setFont("helvetica", "normal");
        doc.text("PAQUETE: " + pPaquete, doc.internal.pageSize.getWidth() / 2, 60, { align: "center" });

        doc.setFontSize(11);
        doc.text("Camión: " + (result.respuesta[0].REFERENCIA || "N/A"), 40, 90);

        const columnas = [
          "ARTÍCULO",
          "CÓDIGO\nBARRAS",
          "CANT\nSOLI",
          "CANT\nPREP.",
          "CANT\nVERIF.",
          "CONSECUTIVO\nCONTENEDOR",
          "FECHA\nCREACIÓN"
        ];

        const filas = result.respuesta.map((item) => [
          `${item.articulo}\n${item.descripcion}`,
          item.Codigo_Barra,
          item.LineaConsecutivo,
          item.LineaAprobada,
          item.LineaVerificada,
          item.Contenedor,
          item.Fecha_Aplicacion
        ]);

        doc.autoTable({
          head: [columnas],
          body: filas,
          startY: 120,
          styles: { fontSize: 8, cellWidth: "wrap" },
          headStyles: { fillColor: [27, 103, 107] },
          tableWidth: "auto",
          columnStyles: { 0: { cellWidth: 120 } }
        });

        doc.save(`Reporte_Paquete_${pPaquete}.pdf`);
      }
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

// =============================================================================
// SELECTS DE CABECERA (PLACAS Y CONDUCTORES)
// =============================================================================
async function cargarSelectPlacas() {
  const selectPlaca = document.getElementById("placa-camion");
  if (!selectPlaca) return;

  const hUser = document.getElementById("hUsuario");
  const pUsuario = hUser ? hUser.value : "PRUEBAPMA";
  const params = `?pSistema=WMS&pUsuario=${pUsuario}&pOpcion=S&pPlaca=`;

  try {
    const response = await fetch(env.API_URL + "selectcamion" + params, myInit);
    const data = await response.json();

    selectPlaca.innerHTML = '<option value="" disabled selected>Seleccione una placa</option>';
    const listaPlacas = data.respuesta || data;

    if (Array.isArray(listaPlacas)) {
      listaPlacas.forEach((placa) => {
        const option = document.createElement("option");
        const numPlaca = (placa.NUM_PLACA || "").trim();
        const descripcion = (placa.DESCRIPCION || "").trim();

        option.value = numPlaca;
        option.textContent = descripcion ? `${numPlaca} - ${descripcion}` : numPlaca;
        selectPlaca.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error al cargar placas:", error);
  }
}

async function cargarSelectConductores() {
  const selectConductor = document.getElementById("conductor-camion");
  if (!selectConductor) return;

  const hUser = document.getElementById("hUsuario");
  const pUsuario = hUser ? hUser.value : "PRUEBAPMA";
  const params = `?pSistema=WMS&pUsuario=${pUsuario}&pOpcion=S&pConductor=0`;

  try {
    const response = await fetch(env.API_URL + "selectconductor" + params, myInit);
    const data = await response.json();

    selectConductor.innerHTML = '<option value="" disabled selected>Seleccione un conductor</option>';
    const listaConductores = data.respuesta || data;

    if (Array.isArray(listaConductores)) {
      listaConductores.forEach((conductor) => {
        const option = document.createElement("option");
        option.value = conductor.ID_CONDUCTOR;
        option.textContent = (conductor.CONDUCTOR || "").trim();
        selectConductor.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error al cargar conductores:", error);
  }
}

function mostrarInfo() {
  Swal.fire({
    title: "<strong>Guía de Verificación de Contenedores</strong>",
    icon: "info",
    html: `
      <div style="text-align: left; font-size: 13.5px; line-height: 1.55; max-height: 420px; overflow-y: auto; padding-right: 6px;">
        <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 0;">
          Estados de Línea
        </h6>
        <p style="margin: 4px 0;">• <strong style="color: #28a745;">Doble check verde:</strong> Línea verificada completa (Cant. Despachada = Cant. Preparada).</p>
        <p style="margin: 4px 0;">• <strong style="color: #ea580c;">Naranja / Rojo:</strong> Diferencias o pendientes entre lo preparado y lo leído.</p>

        <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 14px;">
          Flujo Operativo
        </h6>
        <p style="margin: 4px 0;">1. Seleccione bodega destino, placa y conductor antes de cargar líneas.</p>
        <p style="margin: 4px 0;">2. Pistolee o capture en <strong>Lectura</strong> para acumular cantidades.</p>
        <p style="margin: 4px 0;">3. Guarde el avance parcial con <strong>Guardar Avance</strong>.</p>
        <p style="margin: 4px 0;">4. Finalice el proceso con <strong>Crear Paquete de Contenedor</strong>.</p>
      </div>
    `,
    showCloseButton: true,
    confirmButtonColor: "#28a745",
    confirmButtonText: "Entendido"
  });
}

////////////////////////////////////////////////////
////         VARIABLES GLOBALES              ///////
////////////////////////////////////////////////////
window.ArrayData = window.ArrayData || [];
window.ArrayDataFiltrado = window.ArrayDataFiltrado || [];
window.xPag = 20;

////////////////////////////////////////////////////
////             DOM                         ///////
////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  const busquedaFlag = localStorage.getItem("busquedaActiva") === "true";
  const hoy = new Date().toISOString().split("T")[0];
  const inputIni = document.getElementById("fecha_ini");
  const inputFin = document.getElementById("fecha_fin");

  if (!inputIni.value) inputIni.value = hoy;
  if (!inputFin.value) inputFin.value = hoy;

  if (busquedaFlag) {
    const busquedaPrevia = localStorage.getItem("parametrosBusqueda");
    if (busquedaPrevia) {
      console.log("Recuperando búsqueda previa...");
      const params = new URLSearchParams(busquedaPrevia);
      const pModulo = params.get("pModulo") ?? "";
      const pOpcion = params.get("pOpcion") ?? "";
      const typeRpt = params.get("typeRpt") ?? "";
      const fechaIni = params.get("fechaIni") ?? "";
      const fechaFin = params.get("fechaFin") ?? "";
      const bodegaOrigen = params.get("BodegaOrigen") ?? "";

      const trasladosSwitch = document.getElementById("trasladosSwitch");
      if (trasladosSwitch) {
        trasladosSwitch.checked = (pOpcion !== "E");
      }

      const toggleSwitch = document.getElementById("toggleSwitch");
      if (toggleSwitch) {
        toggleSwitch.checked = (typeRpt === "R");
      }

      if (fechaIni) inputIni.value = fechaIni;
      if (fechaFin) inputFin.value = fechaFin;

      const parametros = `?pModulo=${pModulo}&pOpcion=${pOpcion}&typeRpt=${typeRpt}&fechaIni=${fechaIni}&fechaFin=${fechaFin}&BodegaOrigen=${bodegaOrigen}`;
      consultaAPI(parametros, pOpcion);
    }
  } else {
    localStorage.clear();
  }

  setTimeout(() => {
    M.updateTextFields();
    M.Datepicker.init(document.querySelectorAll('.datepicker'), {
      format: 'yyyy-mm-dd',
      autoClose: true
    });
  }, 100);

  const switchTipo = document.getElementById("trasladosSwitch");
  if (switchTipo) {
    switchTipo.addEventListener("change", function () {
      limpiarResultadoGeneral();
    });
  }

  cargaInicialTraslados();
});

////////////////////////////////////////////////////
////         CARGA INICIAL                   ///////
////////////////////////////////////////////////////
function cargaInicialTraslados() {
  const bodegaOrigen = document.getElementById("bodega")?.value || "";
  if (!bodegaOrigen) {
    console.warn("Bodega no seleccionada en carga inicial.");
    return;
  }
  const pFechaHasta = document.getElementById("fecha_fin")?.value || "";
  const pFechaDesde = document.getElementById("fecha_ini")?.value || "";
  const pModulo = "WMS_VT";
  const toggleSwitch = document.getElementById("toggleSwitch");
  const trasladosProcesados = toggleSwitch ? toggleSwitch.checked : false;
  const typeRpt = trasladosProcesados ? "R" : "TP";
  const pOpcion = "";

  const params = `?pModulo=${pModulo}&pOpcion=${pOpcion}&typeRpt=${typeRpt}&fechaIni=${pFechaDesde}&fechaFin=${pFechaHasta}&BodegaOrigen=${bodegaOrigen}`;

  if (typeof mostrarLoader === "function") mostrarLoader("Consultando totales...");

  fetch(env.API_URL + "entradasalida" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        actualizarBadgesConteo(result.respuesta || []);
      }
    })
    .catch((error) => {
      console.error("Error en carga inicial:", error);
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

////////////////////////////////////////////////////
////         CARGA MANUAL                    ///////
////////////////////////////////////////////////////
function verTrasladosLista() {
  const bodegaOrigen = document.getElementById("bodega")?.value || "";

  if (!bodegaOrigen) {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor, seleccione su bodega de origen desde el selector de cabecera.",
      confirmButtonColor: "#28a745"
    });
    return false;
  }

  const pFechaHasta = document.getElementById("fecha_fin")?.value || "";
  const pFechaDesde = document.getElementById("fecha_ini")?.value || "";
  const pConsecutivo = document.getElementById("pContenedor")?.value.trim() || "";
  const pModulo = "WMS_VT";
  const toggleSwitch = document.getElementById("toggleSwitch");
  const trasladosProcesados = toggleSwitch ? toggleSwitch.checked : false;
  const typeRpt = trasladosProcesados ? "R" : "TP";

  localStorage.setItem("trasladosprocesados", trasladosProcesados ? "false" : "true");

  const switchTipo = document.getElementById("trasladosSwitch");
  const esEntrada = switchTipo ? switchTipo.checked : false;
  const pOpcion = esEntrada ? "S" : "E";

  const params = `?pModulo=${pModulo}&pOpcion=${pOpcion}&typeRpt=${typeRpt}&fechaIni=${pFechaDesde}&fechaFin=${pFechaHasta}&BodegaOrigen=${bodegaOrigen}&pConsecutivo=${pConsecutivo}`;
  localStorage.setItem("busquedaActiva", "true");
  localStorage.setItem("parametrosBusqueda", params);

  consultaAPI(params, pOpcion);
}

function consultaAPI(parametros, opcion) {
  if (typeof mostrarLoader === "function") mostrarLoader("Buscando traslados...");

  let urlcontroller = (opcion === "S") ? "wmsverificaciontrasladossalida" : "wmsverificaciontrasladosentrada";

  fetch(env.API_URL + urlcontroller + parametros, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      if (result.msg === "SUCCESS") {
        ArrayData = result.respuesta || [];
        ArrayDataFiltrado = [...ArrayData];

        cargaInicialTraslados();

        if (ArrayDataFiltrado.length === 0) {
          limpiarResultadoGeneral();
          Swal.fire({
            icon: "info",
            title: "Sin registros",
            text: "No se encontraron traslados para los filtros seleccionados.",
            confirmButtonColor: "#28a745",
          });
        } else {
          renderizarTablaConPaginacion();
        }
      } else {
        limpiarResultadoGeneral();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al consultar el servicio.",
          confirmButtonColor: "#ef4444",
        });
      }
    })
    .catch((error) => {
      limpiarResultadoGeneral();
      console.error("Error en la solicitud Fetch:", error);
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function actualizarBadgesConteo(data) {
  if (!Array.isArray(data)) return;

  const objEntrada = data.find((item) => (item.OPCION || "").toUpperCase() === "E");
  const objSalida = data.find((item) => (item.OPCION || "").toUpperCase() === "S");

  const cantEntradas = objEntrada ? (objEntrada.TOTAL_TRASLADO || 0) : 0;
  const cantSalidas = objSalida ? (objSalida.TOTAL_TRASLADO || 0) : 0;

  const lblEntradas = document.getElementById("lblCantEntradas");
  const lblSalidas = document.getElementById("lblCantSalidas");

  if (lblEntradas) lblEntradas.innerText = cantEntradas;
  if (lblSalidas) lblSalidas.innerText = cantSalidas;
}

function renderizarTablaConPaginacion() {
  const cantReg = ArrayDataFiltrado.length;
  const resultadoGeneral = document.getElementById("resultadoGeneral");

  if (resultadoGeneral) {
    resultadoGeneral.innerHTML = `Total de Registros: <span id="lblTotalRegistros">${cantReg}</span>`;
  }

  const esEntrada = document.getElementById("trasladosSwitch")?.checked || false;
  const thBodega = document.getElementById("thBodega");

  if (thBodega) {
    thBodega.innerHTML = esEntrada ? "Bodega Destino" : "Bodega Origen";
  }

  const tabla = document.getElementById("tbltraslados");
  if (!tabla) return;

  let tbody = tabla.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    tabla.appendChild(tbody);
  }

  tbody.innerHTML = "";
  let htm = "";

  for (let i = 0; i < ArrayDataFiltrado.length; i++) {
    const item = ArrayDataFiltrado[i];
    const bodegaMostrar = item.BODEGA_DESTINO || item.BODEGA_ORIGEN || item.BODEGA || "";
    const opcionActual = item.OPCION || (esEntrada ? "S" : "E");

    htm += `
      <tr onclick="irDetalleTraslado('${item.TRASLADO || ''}','${bodegaMostrar}','${item.ESTADO_TRASLADO || ''}','${opcionActual}');" style="cursor: pointer;">
        <td class="cell-center" style="font-weight: 700; color: #1e293b;">${item.TRASLADO || ""}</td>
        <td class="cell-center">${bodegaMostrar}</td>
        <td class="cell-number">${parseFloat(item.LINEAS_PREPARADAS || 0).toFixed(2)}</td>
        <td class="cell-number">${parseFloat(item.LINEAS_VERIFICADAS || 0).toFixed(2)}</td>
        
        <td class="cell-center cell-date">${item.FECHA || ""}</td>
      </tr>`;
  }

  tbody.innerHTML = htm;
  aplicarEstilosTabla();

  // Integración con el nuevo paginador desplegable tipo select
  const contenedorPaginador = $("#resultadoPaginador");
  contenedorPaginador.empty();

  if ($.fn.pageMe) {
    $("#tbltraslados tbody").pageMe({
      pagerSelector: "#resultadoPaginador",
      perPage: typeof xPag !== "undefined" ? xPag : 20
    });
  }
}

function irDetalleTraslado(documento, bodega, estadoPreparacion, opcion) {
  const bodegaOrigen = document.getElementById("bodega")?.value || "";
  const pFechaHasta = document.getElementById("fecha_fin")?.value || "";
  const pFechaDesde = document.getElementById("fecha_ini")?.value || "";
  const pModulo = "WMS_VP";
  const typeRpt = "D";

  const params = `?pModulo=${pModulo}&pOpcion=${opcion}&typeRpt=${typeRpt}&fechaIni=${pFechaDesde}&fechaFin=${pFechaHasta}&BodegaOrigen=${bodegaOrigen}`;

  localStorage.setItem("ListParamsDetalle", params);
  localStorage.setItem("traslado", documento);
  localStorage.setItem("tipoTraslado", opcion);
  localStorage.setItem("BodegaTraslado", bodega);
  localStorage.setItem("estadotraslado", estadoPreparacion);

  window.location.href = (opcion === "E") ? "detalleTrasladoEntrada.html" : "detalleTrasladoSalida.html";
}

function aplicarEstilosTabla() {
  $("#tbltraslados tbody tr").each(function () {
    const doc = $(this).find("td:eq(0)");
    if (doc.text().trim().startsWith("T")) {
      doc.css({ color: "#dc2626", "font-weight": "700" });
    }
  });
}

function limpiarResultadoGeneral() {
  const resultadoPaginador = document.getElementById("resultadoPaginador");
  if (resultadoPaginador) resultadoPaginador.innerHTML = "";

  const resultadoGeneral = document.getElementById("resultadoGeneral");
  if (resultadoGeneral) resultadoGeneral.innerHTML = "";

  const tbody = document.querySelector("#tbltraslados tbody");
  if (tbody) tbody.innerHTML = "";
}
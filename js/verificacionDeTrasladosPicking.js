document.addEventListener("DOMContentLoaded", function () {
  console.log("El DOM se ha cargado completamente para Picking de Traslados.");
  let busquedaFlag = localStorage.getItem("autoSearchTraslados") === "true";

  if (busquedaFlag) {
    let parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
    let mostrarPreparados = localStorage.getItem("trasladosprocesados");

    if (mostrarPreparados === "true") {
      $("#toggleSwitch").prop("checked", true);
    } else {
      $("#toggleSwitch").prop("checked", false);
    }

    const fechaIni = obtenerValorParametro(parametrosBusqueda, "fechaIni");
    const fechaFin = obtenerValorParametro(parametrosBusqueda, "fechaFin");

    if (fechaIni) document.getElementById("fecha_ini").value = fechaIni;
    if (fechaFin) document.getElementById("fecha_fin").value = fechaFin;

    setTimeout(() => {
      M.updateTextFields();
      const inputs = document.querySelectorAll(".datepicker");
      inputs.forEach((input) => {
        const fechaGuardada = input.id === "fecha_ini" ? fechaIni : fechaFin;

        if (fechaGuardada) {
          const dateParts = fechaGuardada.split("-");
          const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

          M.Datepicker.init(input, {
            format: "yyyy-mm-dd",
            defaultDate: d,
            setDefaultDate: true,
            autoClose: true
          });
        }
      });
    }, 100);

    listadoTraslados(parametrosBusqueda);
  } else {
    localStorage.clear();
  }

  const user = document.getElementById("hUsuario");
  const bodegaInput = document.getElementById("bodega");
  const bodega = bodegaInput ? bodegaInput.value : "";
  const switchEl = document.getElementById("toggleSwitch");
  const estadoSwitchTrasPrep = switchEl ? switchEl.checked : false;

  if (user) localStorage.setItem("username", user.value);
  localStorage.setItem("bodegaUser", bodega);
  localStorage.setItem("trasladosprocesados", estadoSwitchTrasPrep);
});

function obtenerValorParametro(parametros, nombreParametro) {
  if (!parametros) return null;
  const urlParams = new URLSearchParams(parametros);
  return urlParams.get(nombreParametro);
}

function verTrasladosLista() {
  const bodegaOrigen = document.getElementById("bodega") ? document.getElementById("bodega").value : "";

  if (bodegaOrigen === "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor, seleccione su bodega de origen desde el selector de cabecera.",
      confirmButtonColor: "#28a745"
    });
    return false;
  }

  const pFechaHasta = $("#fecha_fin").val() || "";
  const pFechaDesde = $("#fecha_ini").val() || "";
  const pConsecutivo = $("#pContenedor").val() || "";

  localStorage.setItem("autoSearchTraslados", "true");
  let pModulo = "WMS_PK";
  let pOpcion = "S";
  let typeRpt = "R";

  const trasladosPreparados = localStorage.getItem("trasladosprocesados");
  if (trasladosPreparados !== "true") {
    typeRpt = "TP";
  }

  const params =
    "?pModulo=" + pModulo +
    "&pOpcion=" + pOpcion +
    "&typeRpt=" + typeRpt +
    "&fechaIni=" + pFechaDesde +
    "&fechaFin=" + pFechaHasta +
    "&BodegaOrigen=" + bodegaOrigen +
    "&pConsecutivo=" + pConsecutivo;

  localStorage.setItem("parametrosBusqueda", params);
  console.log('Parametros: '+params);
  listadoTraslados(params);
}

function listadoTraslados(parametros) {
  if (typeof mostrarLoader === "function") mostrarLoader("Consultando traslados...");

  fetch(env.API_URL + "wmspreparaciondetraslados" + parametros, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta.length !== 0) {
          ArrayData = result.respuesta;
          ArrayDataFiltrado = result.respuesta;
            console.log(result);
          let resultadoGeneral = document.getElementById("resultadoGeneral");
          if (resultadoGeneral) {
            resultadoGeneral.innerHTML = `Total de Registros: <span id="lblTotalRegistros">${result.respuesta.length}</span>`;
          }

          renderizarTablaTrasladosCompleta();
          aplicarEstilosTabla();
        } else {
          limpiarResultadoGeneral();
          Swal.fire({
            icon: "info",
            title: "Sin registros",
            text: "No tiene traslados pendientes bajo estos criterios.",
            confirmButtonColor: "#28a745"
          });
        }
      } else {
        limpiarResultadoGeneral();
        console.error("Error devuelto por el SP");
      }
    })
    .catch((err) => {
      console.error("Error en la solicitud fetch de traslados:", err);
      limpiarResultadoGeneral();
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function renderizarTablaTrasladosCompleta() {
  if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) return;

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

    let cantPrep = parseFloat(item.LINEAS_PREPARADAS) || 0;
    let cantVerif = parseFloat(item.LINEAS_VERIFICADAS) || 0;

    htm += `<tr onclick="irDetalleTraslado('${item.TRASLADO}','${item.BODEGA_DESTINO}');" style="cursor: pointer;">`;
    htm += `<td class="cell-center" style="font-weight: 700; color: #1e293b;">${item.TRASLADO || ""}</td>`;
    htm += `<td class="cell-center">${item.BODEGA_DESTINO || ""}</td>`;
    htm += `<td class="cell-number">${cantPrep.toFixed(2)}</td>`;
    htm += `<td class="cell-number">${cantVerif.toFixed(2)}</td>`;
    htm += `<td class="cell-center cell-date">${item.FECHA || ""}</td>`;
    htm += `</tr>`;
  }

  tbody.innerHTML = htm;

  // Integración con el paginador de selector desplegable
  $("#resultadoPaginador").empty();
  if ($.fn.pageMe) {
    $("#tbltraslados tbody").pageMe({
      pagerSelector: "#resultadoPaginador",
      perPage: typeof xPag !== "undefined" ? xPag : 20
    });
  }
}

function irDetalleTraslado(documento, bodegaDestino) {
  let bodegaOrigen = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let pFechaHasta = $("#fecha_fin").val() || "";
  let pFechaDesde = $("#fecha_ini").val() || "";
  let pModulo = "WMS_PK";
  let pOpcion = "S";
  let typeRpt = "D";

  const params =
    "?pModulo=" + pModulo +
    "&pOpcion=" + pOpcion +
    "&typeRpt=" + typeRpt +
    "&fechaIni=" + pFechaDesde +
    "&fechaFin=" + pFechaHasta +
    "&BodegaOrigen=" + bodegaOrigen;

  localStorage.setItem("ListParamsDetalle", params);
  localStorage.setItem("traslado", documento);
  localStorage.setItem("destinoBodegaTraslado", bodegaDestino);
  window.location.href = "detalleTrasladoPicking.html";
}

const mostrar_procesados_checkbox = document.getElementById("toggleSwitch");
if (mostrar_procesados_checkbox) {
  mostrar_procesados_checkbox.addEventListener("change", function () {
    localStorage.setItem("trasladosprocesados", mostrar_procesados_checkbox.checked);
    if (!mostrar_procesados_checkbox.checked) {
      trasladosFinalizados();
    }
    limpiarResultadoGeneral();
  });
}

function trasladosFinalizados() {
  Swal.fire({
    title: "¿Desea ver solo los traslados preparados?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "No",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881"
  }).then((result) => {
    if (result.isConfirmed) {
      $("#toggleSwitch").prop("checked", false);
    } else {
      $("#toggleSwitch").prop("checked", true);
      localStorage.setItem("trasladosprocesados", "true");
    }
  });
}

function aplicarEstilosTabla() {
  $("#tbltraslados tbody tr").each(function () {
    var documentoValue = $(this).find("td:eq(0)").text().trim();
    if (documentoValue.startsWith("T")) {
      $(this).find("td:eq(0)").css({
        color: "#dc2626",
        "font-weight": "700"
      });
    }
  });
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tbltraslados");
  const resultadoPaginador = document.getElementById("resultadoPaginador");
  const totalRegistros = document.getElementById("resultadoGeneral");

  if (resultadoPaginador) resultadoPaginador.innerHTML = "";
  if (totalRegistros) totalRegistros.innerHTML = "";

  if (tabla) {
    let tbody = tabla.querySelector("tbody");
    if (tbody) tbody.innerHTML = "";
  }
}

const fecha_ini = document.getElementById("fecha_ini");
if (fecha_ini) {
  fecha_ini.addEventListener("change", limpiarResultadoGeneral);
}

const fecha_fin = document.getElementById("fecha_fin");
if (fecha_fin) {
  fecha_fin.addEventListener("change", limpiarResultadoGeneral);
}

document.addEventListener("DOMContentLoaded", function () {
  const busqueda = localStorage.getItem("autoSearchOrdenDeComprasList");
  localStorage.setItem("switchLecturaState", "true");

  if (busqueda === "true") {
    console.log("DOM cargado con búsqueda previa de OC procesadas.");

    const parametrosBusquedaOC = localStorage.getItem("parametrosBusquedaOrdenesDeCompraList");
    if (parametrosBusquedaOC) {
      const params = new URLSearchParams(parametrosBusquedaOC);
      const pSistema = params.get("pSistema") || "WMS";
      const pUsuario = params.get("pUsuario") || "";
      const pOpcion = params.get("pOpcion") || "P";
      const pBodega = "";
      const pEstado = "";
      const pOrden = params.get("pOrden") || "";
      const pFechaDesde = params.get("pFechaDesde") || "";
      const pFechaHasta = params.get("pFechaHasta") || "";

      if (pFechaDesde) document.getElementById("fecha_ini").value = pFechaDesde;
      if (pFechaHasta) document.getElementById("fecha_fin").value = pFechaHasta;

      if (pFechaDesde || pFechaHasta) {
        const chkFechas = document.getElementById("chkHabilitarFechas");
        if (chkFechas) {
          chkFechas.checked = true;
          document.getElementById("fecha_ini").disabled = false;
          document.getElementById("fecha_fin").disabled = false;
        }
      }

      setTimeout(() => {
        M.updateTextFields();
        const inputs = document.querySelectorAll(".datepicker");
        inputs.forEach((input) => {
          const fechaGuardada = input.id === "fecha_ini" ? pFechaDesde : pFechaHasta;
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

      enviarDatosControlador(pSistema, pUsuario, pOpcion, pBodega, pEstado, pOrden, pFechaDesde, pFechaHasta);
    }
  }

  inicializarFiltroFechas();
});

function ValidaOrdenesDeCompra() {
  const fechasHabilitadas = document.getElementById("chkHabilitarFechas")?.checked || false;
  const pSistema = "WMS";
  const hUser = document.getElementById("hUsuario");
  const pUsuario = hUser ? hUser.value : "";
  const pOpcion = "P";
  const pBodega = "";
  const pEstado = "";
  const pOrden = $("#pOrden").val() || "";

  let pFechaDesde = "";
  let pFechaHasta = "";

  if (fechasHabilitadas) {
    pFechaDesde = document.getElementById("fecha_ini").value;
    pFechaHasta = document.getElementById("fecha_fin").value;
  }

  enviarDatosControlador(pSistema, pUsuario, pOpcion, pBodega, pEstado, pOrden, pFechaDesde, pFechaHasta);
}

function enviarDatosControlador(pSistema, pUsuario, pOpcion, pBodega, pEstado, pOrden, pFechaDesde, pFechaHasta) {
  if (typeof mostrarLoader === "function") mostrarLoader("Consultando órdenes procesadas...");

  const params =
    "?pSistema=" + pSistema +
    "&pUsuario=" + pUsuario +
    "&pBodega=" + pBodega +
    "&pEstado=" + pEstado +
    "&pOrden=" + encodeURIComponent(pOrden) +
    "&pOpcion=" + pOpcion +
    "&pFechaDesde=" + pFechaDesde +
    "&pFechaHasta=" + pFechaHasta;

  localStorage.setItem("parametrosBusquedaOrdenesDeCompraList", params);
  localStorage.setItem("autoSearchOrdenDeComprasList", "true");

  fetch(env.API_URL + "wmsordenesdecompras" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log("Respuesta del servidor:", result);

      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta.length !== 0) {
          ArrayData = result.respuesta;
          ArrayDataFiltrado = result.respuesta;

          const resGeneral = document.getElementById("resultadoGeneral");
          if (resGeneral) {
            resGeneral.innerHTML = `Total de Registros: <span id="lblTotalRegistros">${result.respuesta.length}</span>`;
          }

          renderizarTablaOrdenesCompleta();
        } else {
          limpiarResultadoGeneral();
          Swal.fire({
            icon: "info",
            title: "Sin registros",
            text: "No se encontraron órdenes procesadas con los filtros indicados.",
            confirmButtonColor: "#28a745"
          });
        }
      } else {
        limpiarResultadoGeneral();
        Swal.fire({
          icon: "error",
          title: "Error de Servidor",
          text: "No se pudo procesar la solicitud de órdenes.",
          confirmButtonColor: "#ef4444"
        });
      }
    })
    .catch((error) => {
      console.error("Error en petición Fetch:", error);
      limpiarResultadoGeneral();
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function renderizarTablaOrdenesCompleta() {
  if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) return;

  const tabla = document.getElementById("tblordendecompra");
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

    let fechaFormateada = "";
    if (item.FECHA_ORDEN) {
      const fechaOrden = new Date(item.FECHA_ORDEN);
      if (!isNaN(fechaOrden)) {
        fechaFormateada = `${fechaOrden.getDate()}/${fechaOrden.getMonth() + 1}/${fechaOrden.getFullYear()}`;
      }
    }

    const obsParam = item.OBSERVACION ? encodeURIComponent(item.OBSERVACION) : "null";
    const cantSoli = !isNaN(item.cant_solicitada) && item.cant_solicitada !== null ? parseFloat(item.cant_solicitada).toFixed(2) : "0.00";
    const cantVerif = !isNaN(item.cant_verificada) && item.cant_verificada !== null ? parseFloat(item.cant_verificada).toFixed(2) : "0.00";
    const cantEmb = !isNaN(item.cant_embarcada) && item.cant_embarcada !== null ? parseFloat(item.cant_embarcada).toFixed(2) : "0.00";

    const sonIguales = parseFloat(cantSoli) === parseFloat(cantVerif);
    const iconoEstado = sonIguales
      ? '<i class="material-icons" style="color: #28a745 !important; font-size: 20px; vertical-align: middle;">done_all</i>'
      : '<i class="material-icons" style="color: #dc2626 !important; font-size: 20px; vertical-align: middle;">error_outline</i>';

    htm += `<tr onclick="irDetalleOC('${item.ORDEN_COMPRA || ""}', '${item.EMBARQUE || ""}', '${obsParam}');" style="cursor: pointer;">`;
    htm += `
      <td style="text-align: left;">
        <div class="cell-articulo-box">
          <span class="cell-articulo-code" style="color: #1e293b;">${item.ORDEN_COMPRA || ""}</span>
          <span style="color: #28a745; font-size: 10.5px; font-weight: 700;">${item.EMBARQUE || ""}</span>
          <span style="color: #64748b; font-size: 10px;">${fechaFormateada}</span>
        </div>
      </td>
    `;
    htm += `<td class="cell-center" style="font-size: 11px;">${item.BODEGA_DESTINO || ""}</td>`;
    htm += `<td style="text-align: left; white-space: normal; line-height: 1.2;">${item.NOMBRE || ""}</td>`;
    htm += `<td class="cell-number">${cantSoli}</td>`;
    htm += `<td class="cell-number">${cantVerif}</td>`;
    htm += `<td class="cell-number">${cantEmb}</td>`;
    htm += `<td class="cell-center">${iconoEstado}</td>`;
    htm += `</tr>`;
  }

  tbody.innerHTML = htm;

  // Integración con el nuevo paginador de selector desplegable
  $("#resultadoPaginador").empty();
  if ($.fn.pageMe) {
    $("#tblordendecompra tbody").pageMe({
      pagerSelector: "#resultadoPaginador",
      perPage: typeof xPag !== "undefined" ? xPag : 20
    });
  }
}

function irDetalleOC(pOrden, pEmbarque, OBSERVACION) {
  localStorage.setItem("embarque", pEmbarque);
  localStorage.setItem("OrdenDeCompra", pOrden);

  const obsDecoded = (OBSERVACION === "null" || !OBSERVACION) ? null : decodeURIComponent(OBSERVACION);
  localStorage.setItem("observacion", obsDecoded);

  window.location.href = "lineasOrdenCompraProcesada.html";
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblordendecompra");
  const resultadoPaginador = document.getElementById("resultadoPaginador");
  const totalRegistros = document.getElementById("resultadoGeneral");

  if (resultadoPaginador) resultadoPaginador.innerHTML = "";
  if (totalRegistros) totalRegistros.innerHTML = "";
  if (tabla) {
    const tbody = tabla.querySelector("tbody");
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

function inicializarFiltroFechas() {
  const chkHabilitarFechas = document.getElementById("chkHabilitarFechas");
  const fechaIni = document.getElementById("fecha_ini");
  const fechaFin = document.getElementById("fecha_fin");

  if (!chkHabilitarFechas || !fechaIni || !fechaFin) return;

  const toggleFechas = () => {
    const habilitado = chkHabilitarFechas.checked;
    fechaIni.disabled = !habilitado;
    fechaFin.disabled = !habilitado;

    if (!habilitado) {
      fechaIni.value = "";
      fechaFin.value = "";
    }
  };

  chkHabilitarFechas.addEventListener("change", toggleFechas);
  toggleFechas();
}

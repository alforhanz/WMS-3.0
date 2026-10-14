document.addEventListener("DOMContentLoaded", function () {
  const busqueda = localStorage.getItem("autoSearchOrdenDeComprasList");
  localStorage.setItem("switchLecturaState", "true");

  if (busqueda === "true") {
    console.log("DOM cargado con búsqueda automática de OC.");

    const parametrosBusquedaOC = localStorage.getItem("parametrosBusquedaOrdenesDeCompraList");
    if (parametrosBusquedaOC) {
      const params = new URLSearchParams(parametrosBusquedaOC);
      const pSistema = params.get("pSistema");
      const pUsuario = params.get("pUsuario");
      const pOpcion = params.get("pOpcion");

      const toggleSwitch = document.getElementById("toggleSwitch");
      if (toggleSwitch) {
        toggleSwitch.checked = (pOpcion !== "P");
      }

      const pBodega = params.get("pBodega");
      const pFechaDesde = params.get("pFechaDesde");
      const pFechaHasta = params.get("pFechaHasta");
      const pEstado = "";
      const pOrden = params.get("pOrden");

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

const checkbox = document.getElementById("toggleSwitch");
if (checkbox) {
  checkbox.addEventListener("change", function () {
    if (checkbox.checked === false) {
      ordenesDeComprasProcesadas();
    }
    limpiarResultadoGeneral();
  });
}

function ordenesDeComprasProcesadas() {
  Swal.fire({
    title: "¿Desea ver solo las órdenes de compra procesadas?",
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
    }
  });
}

function ValidaOrdenesDeCompra() {
  const fechasHabilitadas = document.getElementById("chkHabilitarFechas")?.checked || false;

  const pSistema = "WMS";
  const hUser = document.getElementById("hUsuario");
  const pUsuario = hUser ? hUser.value : "";
  const switchProcesadas = $("#toggleSwitch").prop("checked");
  const pOpcion = switchProcesadas ? "E" : "P";

  const pBodega = document.getElementById("bodega")?.value || "";
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
  if (typeof mostrarLoader === "function") mostrarLoader("Consultando órdenes de compra...");

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
        // 1. VALIDACIÓN DE EXCEPCIONES DEL STORED PROCEDURE
        if (result.respuesta && result.respuesta.length > 0) {
          const primerRegistro = result.respuesta[0];

          if (primerRegistro === "X" || (primerRegistro && primerRegistro.Respuesta === "X")) {
            Swal.fire({
              icon: "warning",
              title: "Orden No Existe",
              text: "La orden de compra ingresada no se encuentra creada en el sistema.",
              confirmButtonColor: "#28a745"
            });
            limpiarResultadoGeneral();
            return;
          }

          if (primerRegistro === "N" || (primerRegistro && primerRegistro.Respuesta === "N")) {
            Swal.fire({
              icon: "error",
              title: "Sin Embarque Asociado",
              text: "La orden de compra no se encuentra asociada a ningún embarque activo.",
              confirmButtonColor: "#28a745"
            });
            limpiarResultadoGeneral();
            return;
          }
        }

        // 2. CARGA DE REGISTROS VÁLIDOS
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
            text: "No hay registros asignados para los criterios especificados.",
            confirmButtonColor: "#28a745"
          });
        }
      } else {
        limpiarResultadoGeneral();
        Swal.fire({
          icon: "error",
          title: "Error de Servidor",
          text: "No se pudo procesar la solicitud de órdenes de compra.",
          confirmButtonColor: "#ef4444"
        });
      }
    })
    .catch((error) => {
      console.error("Error en la petición Fetch:", error);
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

   htm += `<tr onclick="irDetalleOC('${item.ORDEN_COMPRA}', '${obsParam}');" style="cursor: pointer;">`;
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

function irDetalleOC(pOrden, OBSERVACION) {
  const switchEl = document.getElementById("toggleSwitch");
  const finalizadas = switchEl ? switchEl.checked : false;

  localStorage.setItem("OrdenDeCompra_finalizadas", finalizadas);
  localStorage.setItem("OrdenDeCompra", pOrden);

  const obsDecoded = (OBSERVACION === "null" || !OBSERVACION) ? null : decodeURIComponent(OBSERVACION);
  localStorage.setItem("observacion", obsDecoded);

  window.location.href = "lineasOrdenCompra.html";
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

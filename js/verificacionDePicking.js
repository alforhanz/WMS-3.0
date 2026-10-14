const checkbox = document.getElementById("toggleSwitch");

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado para Verificación de Picking");
  const busqueda = localStorage.getItem("autoSearchPedidos");

  if (busqueda === "true") {
    const parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
    if (parametrosBusqueda) {
      const params = new URLSearchParams(parametrosBusqueda);

      const pBodega = params.get("pBodega");
      const pFechaDesde = params.get("pFechaDesde");
      const pFechaHasta = params.get("pFechaHasta");
      const pUsuario = params.get("pUsuario");
      const pPedido = params.get("pPedido");
      const pOpcion = params.get("pOpcion");

      if (pFechaDesde) document.getElementById("fecha_ini").value = pFechaDesde;
      if (pFechaHasta) document.getElementById("fecha_fin").value = pFechaHasta;

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

      if (pOpcion === "FPK") {
        $("#toggleSwitch").prop("checked", false);
      } else {
        $("#toggleSwitch").prop("checked", true);
      }

      listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion);
    } else {
      localStorage.clear();
    }
  }
});

function validarFormulario() {
  const bodegaInput = document.getElementById("bodega");
  const bodega = bodegaInput ? bodegaInput.value : "";

  if (bodega === "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor, seleccione una bodega.",
      confirmButtonColor: "#28a745"
    });
    return false;
  }

  const pBodega = bodega;
  const pPedido = $("#pPedido").val() || "";
  const pFechaHasta = $("#fecha_fin").val() || "";
  const pFechaDesde = $("#fecha_ini").val() || "";
  const hUser = document.getElementById("hUsuario");
  const pUsuario = hUser ? hUser.value : "";
  const switchActivo = $("#toggleSwitch").prop("checked");
  const pOpcion = switchActivo ? "EPK" : "FPK";

  listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion);
}

function listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion) {
  localStorage.setItem("autoSearchPedidos", "true");

  const params =
    "?pBodega=" + pBodega +
    "&pFechaDesde=" + pFechaDesde +
    "&pFechaHasta=" + pFechaHasta +
    "&pUsuario=" + pUsuario +
    "&pPedido=" + pPedido +
    "&pOpcion=" + pOpcion;

  localStorage.setItem("BodegaUsuario", pBodega);
  localStorage.setItem("parametrosBusqueda", params);

  if (typeof mostrarLoader === "function") mostrarLoader("Buscando pedidos para picking...");

  fetch(env.API_URL + "wmsverificacionpedidos/P" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.pedidos && result.pedidos.length !== 0) {
          ArrayData = result.pedidos;
          ArrayDataFiltrado = result.pedidos;
          console.log(result);

          const htm = `Total de Registros: <span id="lblTotalRegistros">${result.pedidos.length}</span>`;
          document.getElementById("resultadoGeneral").innerHTML = htm;

          renderizarTablaPickingCompleta();

          if (typeof ocultarLoader === "function") ocultarLoader();
          aplicarEstilosTablaPedidos();
        } else {
          Swal.fire({
            icon: "info",
            title: "Sin pedidos",
            text: "No tiene pedidos pendientes bajo estos criterios de picking.",
            confirmButtonColor: "#28a745"
          });
          limpiarResultadoGeneral();
          if (typeof ocultarLoader === "function") ocultarLoader();
        }
      } else {
        console.error("Error devuelto por el SP");
        if (typeof ocultarLoader === "function") ocultarLoader();
      }
    })
    .catch((error) => {
      console.error("Error Fetch en pedidos de picking:", error);
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function renderizarTablaPickingCompleta() {
  if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) return;

  const tabla = document.getElementById("tblpedido");
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

    // Sanitización de números (.00, 1.00000000, etc.)
    let rawSol = String(item.TOTAL_UNIDADES || "0").trim();
    let rawVer = String(item.LINEAS_VERIFICADAS || "0").trim();
    let rawPrep = String(item.LINEAS_PREPARADAS || "0").trim();

    if (rawSol.startsWith(".")) rawSol = "0" + rawSol;
    if (rawVer.startsWith(".")) rawVer = "0" + rawVer;
    if (rawPrep.startsWith(".")) rawPrep = "0" + rawPrep;

    const cantSolicitada = parseFloat(rawSol) || 0;
    const cantVerificada = parseFloat(rawVer) || 0;
    const cantPreparada = parseFloat(rawPrep) || 0;

    // Para picking se evalúa el avance contra lo preparado/verificado
    const cantControl = cantPreparada > 0 ? cantPreparada : cantVerificada;

    const documentoClase = item.ESTADO_PREPARACION === "A" ? "cell-origen" : "";

    htm += `<tr onclick="irDetallePedido('${item.DOCUMENTO}','${item.PEDIDO}','${item.ESTADO_PEDIDO}');" style="cursor: pointer;">`;
    htm += `<td class="cell-center ${documentoClase}">${item.DOCUMENTO || ""}</td>`;
    htm += `<td style="text-align: left; white-space: normal;">${item.DESCRIPCION || item.CLIENTE || ""}</td>`;
    htm += `<td class="cell-number">${cantSolicitada.toFixed(2)}</td>`;
    htm += `<td class="cell-number">${cantControl.toFixed(2)}</td>`;

    // Columna Verificado con done_all
    htm += `<td class="cell-center">`;
    if (cantControl === 0) {
      htm += ``;
    } else if (cantControl >= cantSolicitada) {
      htm += `<i class="material-icons" style="color: #28a745 !important; font-size: 22px; line-height: 1; vertical-align: middle; display: inline-block;">done_all</i>`;
    } else if (cantControl > 0 && cantControl < cantSolicitada) {
      htm += `<i class="material-icons" style="color: #e53935 !important; font-size: 22px; line-height: 1; vertical-align: middle; display: inline-block;">done_all</i>`;
    }
    htm += `</td>`;

    htm += `</tr>`;
  }

  tbody.innerHTML = htm;

  // Paginación con pageMe
  const contenedorPaginador = $("#resultadoPaginador");
  contenedorPaginador.empty();
  contenedorPaginador.html('<ul class="pagination" id="paginador-ul" style="display:flex; justify-content:center;"></ul>');

  try {
    if ($.fn.pageMe) {
      $("#tblpedido tbody").pageMe({
        pagerSelector: "#paginador-ul",
        showPrevNext: true,
        hidePageNumbers: false,
        perPage: typeof xPag !== "undefined" ? xPag : 20
      });
    }
  } catch (error) {
    console.error("Error inicializando paginador pageMe:", error);
  }
}

function irDetallePedido(documento, pedido, estado) {
  const switchEl = document.getElementById("toggleSwitch");
  const bodegaInput = document.getElementById("bodega");
  const bodega = bodegaInput ? bodegaInput.value : "";
  const matchNum = bodega.match(/\d+/);
  const bodegaNumero = matchNum ? parseInt(matchNum[0], 10) : 0;
  const bodegaRaw = matchNum ? matchNum[0] : "";

  localStorage.setItem("pedidos_finalizados", switchEl ? switchEl.checked : false);
  localStorage.setItem("documento", documento);
  localStorage.setItem("pedidoSelect", pedido);
  localStorage.setItem("estado", estado);

  // Redirección especial según la regla de bodegas de picking: >= 51 o 05
  if ((bodegaNumero >= 51 && bodegaNumero <= 55) || bodegaRaw === "05" || bodega.includes("05")) {
    window.location.href = "preparacionPicking.html";
  } else {
    Swal.fire({
      icon: "info",
      title: "Bodega no compatible",
      text: "La preparación de picking solo aplica para bodegas Norwing (>= 51) o bodega 05.",
      confirmButtonColor: "#28a745"
    });
  }
}

if (checkbox) {
  checkbox.addEventListener("change", function () {
    if (!checkbox.checked) {
      pedidosFinalizados();
    }
    limpiarResultadoGeneral();
  });
}

function pedidosFinalizados() {
  Swal.fire({
    title: "¿Desea ver solo los pedidos preparados?",
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

function aplicarEstilosTablaPedidos() {
  $("#tblpedido tbody tr").each(function () {
    const documentoValue = $(this).find("td:eq(0)").text().trim();
    if (documentoValue.startsWith("T")) {
      $(this).find("td:eq(0)").css({
        color: "#e51c23",
        "font-weight": "bold"
      });
    }
  });
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblpedido");
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

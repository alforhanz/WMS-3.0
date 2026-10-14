document.addEventListener("DOMContentLoaded", function () {
  localStorage.removeItem("switchLecturaState_Contenedor");

  const busqueda = localStorage.getItem("SearchParameterFlag");
  if (busqueda === "true") {
    const parametrosBusqueda = localStorage.getItem("parametrosBusquedaContenedor");

    if (parametrosBusqueda) {
      const params = new URLSearchParams(parametrosBusqueda);
      const pSistema = params.get("pSistema") ?? "";
      const pUsuario = params.get("pUsuario") ?? "";
      const pOpcion = params.get("pOpcion") ?? "";
      const pBodegaEnvia = params.get("pBodegaEnvia") ?? "";
      const pBodegaDestino = params.get("pBodegaSolicita") ?? "";
      const pConsecutivo = "";
      const pEstado = "";
      const pFechaDesde = params.get("pFechaDesde") ?? "";
      const pFechaHasta = params.get("pFechaHasta") ?? "";

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

      enviarDatosControlador(
        pSistema,
        pUsuario,
        pOpcion,
        pBodegaEnvia,
        pBodegaDestino,
        pConsecutivo,
        pEstado,
        pFechaDesde,
        pFechaHasta
      );
    }
  }
  cargarBodegas();
});

function cargarBodegas() {
  fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra")
    .then((response) => response.json())
    .then((data) => {
      const bodegasSelect = document.getElementById("bodegaSelectOC");
      if (!bodegasSelect) return;

      if (data.respuesta && Array.isArray(data.respuesta)) {
        bodegasSelect.innerHTML = '<option value="" disabled selected>Seleccione una bodega</option>';

        data.respuesta.forEach((bodega) => {
          const option = document.createElement("option");
          option.value = bodega.BODEGA;
          option.textContent = `${bodega.BODEGA} - ${bodega.NOMBRE}`;
          bodegasSelect.appendChild(option);
        });

        // Restaurar selección previa si existe en parámetros guardados
        const parametrosBusqueda = localStorage.getItem("parametrosBusquedaContenedor");
        if (parametrosBusqueda) {
          const params = new URLSearchParams(parametrosBusqueda);
          const pBodegaDestino = params.get("pBodegaSolicita");
          if (pBodegaDestino) bodegasSelect.value = pBodegaDestino;
        }
      }
    })
    .catch((error) => console.error("Error al cargar las bodegas:", error));
}

function validarBusquedaContenedor() {
  var bodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  if (bodega === "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor, seleccione una bodega origen desde el selector de cabecera.",
      confirmButtonColor: "#28a745"
    });
    return false;
  }

  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pOpcion = "E";
  let pBodegaEnvia = bodega;
  let pBodegaDestino = document.getElementById("bodegaSelectOC").value;
  let pConsecutivo = document.getElementById("pContenedor").value.trim();
  let pEstado = "";
  let pFechaDesde = $("#fecha_ini").val() || "";
  let pFechaHasta = $("#fecha_fin").val() || "";

  enviarDatosControlador(
    pSistema,
    pUsuario,
    pOpcion,
    pBodegaEnvia,
    pBodegaDestino,
    pConsecutivo,
    pEstado,
    pFechaDesde,
    pFechaHasta
  );
}

function enviarDatosControlador(
  pSistema,
  pUsuario,
  pOpcion,
  pBodegaEnvia,
  pBodegaDestino,
  pConsecutivo,
  pEstado,
  pFechaDesde,
  pFechaHasta
) {
  const params =
    "?pSistema=" + pSistema +
    "&pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pBodegaEnvia=" + pBodegaEnvia +
    "&pBodegaSolicita=" + pBodegaDestino +
    "&pConsecutivo=" + pConsecutivo +
    "&pEstado=" + pEstado +
    "&pFechaDesde=" + pFechaDesde +
    "&pFechaHasta=" + pFechaHasta;

  localStorage.setItem("parametrosBusquedaContenedor", params);
  localStorage.setItem("SearchParameterFlag", "true");

  if (typeof mostrarLoader === "function") mostrarLoader("Consultando contenedores...");

  fetch(env.API_URL + "contenedor" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta.length > 0) {
          ArrayData = result.contenerespuestador;
          ArrayDataFiltrado = result.respuesta;

          document.getElementById("resultadoGeneral").innerHTML = 
            `Total de Registros: <span id="lblTotalRegistros">${ArrayDataFiltrado.length}</span>`;

          renderizarTablaContenedoresCompleta();
          if (typeof ocultarLoader === "function") ocultarLoader();
        } else {
          limpiarResultadoGeneral();
          Swal.fire({
            icon: "info",
            title: "Sin registros",
            text: "No se encontraron contenedores para los criterios especificados.",
            confirmButtonColor: "#28a745"
          });
          if (typeof ocultarLoader === "function") ocultarLoader();
        }
      } else {
        limpiarResultadoGeneral();
        Swal.fire({
          icon: "error",
          title: "Consulta no completada",
          text: "El servicio no devolvió resultados válidos.",
          confirmButtonColor: "#ef4444"
        });
        if (typeof ocultarLoader === "function") ocultarLoader();
      }
    })
    .catch((error) => {
      console.error("Error en la solicitud fetch:", error);
      limpiarResultadoGeneral();
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "Ocurrió un error al consultar los datos del servidor.",
        confirmButtonColor: "#ef4444"
      });
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function renderizarTablaContenedoresCompleta() {
  if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) return;

  const tabla = document.getElementById("tblcontenedores");
  if (!tabla) return;

  let tbody = tabla.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    tabla.appendChild(tbody);
  }

  tbody.innerHTML = "";
  let htm = "";

  let parametrosBusqueda = localStorage.getItem("parametrosBusquedaContenedor");
  let pOpcion = "E";
  if (parametrosBusqueda) {
    const p = new URLSearchParams(parametrosBusqueda);
    pOpcion = p.get("pOpcion") || "E";
  }

  for (let i = 0; i < ArrayDataFiltrado.length; i++) {
    const key = ArrayDataFiltrado[i];

    let cantSol = parseFloat(key.LineaConsecutivo) || 0;
    let cantLeida = pOpcion === "A" 
      ? (parseFloat(key.LineaPreparada) || 0) 
      : (parseFloat(key.LineaContada) || 0);

    htm += `<tr onclick="irDetalleContenedor('${key.Contenedor}','${pOpcion}','${key.Bodega_Solicita}','${key.Estado_Pdt}')" style="cursor: pointer;">`;
    htm += `<td class="cell-center" style="font-weight: 700; color: #1e293b;">${key.Contenedor || ""}</td>`;
    htm += `<td class="cell-number">${cantSol.toFixed(2)}</td>`;
    htm += `<td class="cell-number">${cantLeida.toFixed(2)}</td>`;
    htm += `<td class="cell-center">${key.Bodega_Solicita || ""}</td>`;
    htm += `<td class="cell-center cell-date">${key.Fecha_Creacion || ""}</td>`;
    htm += `</tr>`;
  }

  tbody.innerHTML = htm;

  // Inicialización del nuevo paginador integrado
  $("#resultadoPaginador").empty();
  if ($.fn.pageMe) {
    $("#tblcontenedores tbody").pageMe({
      pagerSelector: "#resultadoPaginador",
      perPage: typeof xPag !== "undefined" ? xPag : 20
    });
  }
}

function irDetalleContenedor(pTraslado, pOpcion, Bodega_Solicita, Estado_Pdt) {
  localStorage.setItem("contenedor", pTraslado);
  localStorage.setItem("bodega_solicita", Bodega_Solicita);
  localStorage.setItem("contenDetalleOPC", pOpcion);
  localStorage.setItem("estado_Pdt", Estado_Pdt);
  window.location.href = "lineasContenedor.html";
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblcontenedores");
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

function refrescaPantalla() {
  localStorage.removeItem("SearchParameterFlag");
  localStorage.removeItem("parametrosBusquedaContenedor");
  window.location.reload();
}

function mostrarInfo() {
  Swal.fire({
    title: "<strong>Guía de Búsqueda de Contenedores</strong>",
    icon: "info",
    html: `
      <div style="text-align: left; font-size: 13.5px; line-height: 1.55; max-height: 400px; overflow-y: auto; padding-right: 6px;">
        <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 0;">
          Criterios de Consulta
        </h6>
        <p style="margin: 4px 0;">• <strong>N° de Contenedor:</strong> Opcional. Ingrese el código exacto para localizar un contenedor específico.</p>
        <p style="margin: 4px 0;">• <strong>Rango de Fechas:</strong> Filtra por el periodo en que fue creado el contenedor.</p>
        <p style="margin: 4px 0;">• <strong>Bodega Destino:</strong> Opcional. Permite segmentar por la sucursal de destino.</p>

        <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 14px;">
          Flujo de Trabajo
        </h6>
        <p style="margin: 4px 0;">1. Haga clic en <strong>Mostrar Contenedores</strong> para cargar la lista.</p>
        <p style="margin: 4px 0;">2. Seleccione cualquier fila para ingresar al detalle de líneas del contenedor (<code>lineasContenedor.html</code>).</p>
      </div>
    `,
    showCloseButton: true,
    confirmButtonColor: "#28a745",
    confirmButtonText: "Entendido"
  });
}

/////////////////////////////////////////////////////////////////////////////
// VARIABLES GLOBALES
/////////////////////////////////////////////////////////////////////////////
ArrayData = [];
ArrayDataFiltrado = [];
xPag = 20;
cantContadaTotales = 0;
cantVerificadaTotales = 0;
totalEntradasGlobal = 0;
totalSalidasGlobal = 0;

/////////////////////////////////////////////////////////////////////////////
// INICIALIZACIÓN
/////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar selectores de fecha con Materialize
  const datepickerElems = document.querySelectorAll(".datepicker");
  M.Datepicker.init(datepickerElems, {
    format: "yyyy-mm-dd",
    autoClose: true,
    i18n: {
      cancel: "Cancelar",
      clear: "Limpiar",
      done: "Ok",
      months: [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ],
      monthsShort: [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
      ],
      weekdays: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
      weekdaysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
      weekdaysAbbrev: ["D", "L", "M", "M", "J", "V", "S"]
    }
  });

  // Fechas por defecto: inicio de mes y fecha actual si no existen
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const primerDia = `${yyyy}-${mm}-01`;
  const ultimoDia = new Date(yyyy, hoy.getMonth() + 1, 0).toISOString().split("T")[0];

  if (!document.getElementById("fecha_ini").value) {
    document.getElementById("fecha_ini").value = primerDia;
  }
  if (!document.getElementById("fecha_fin").value) {
    document.getElementById("fecha_fin").value = ultimoDia;
  }

  // Verificar si existe una búsqueda previa guardada en localStorage
  let busquedaFlag = localStorage.getItem("autoSearchTransacciones") === "true";
  if (busquedaFlag) {
    let parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
    const pFechaDesde = obtenerValorParametro(parametrosBusqueda, "pFechaDesde");
    const pFechaHasta = obtenerValorParametro(parametrosBusqueda, "pFechaHasta");

    if (pFechaDesde) document.getElementById("fecha_ini").value = pFechaDesde;
    if (pFechaHasta) document.getElementById("fecha_fin").value = pFechaHasta;

    listadoTransacciones(parametrosBusqueda);
  }

  // Guardar usuario y bodega
  const userEl = document.getElementById("hUsuario");
  const bodegaEl = document.getElementById("bodega");
  if (userEl) localStorage.setItem("username", userEl.value);
  if (bodegaEl) localStorage.setItem("bodegaUser", bodegaEl.value);

  // Cargar listas desplegables de clasificación
  cargarClasificacionesCLase();
  cargarClasificacionesMarca();
  cargarClasificacionesTipo();
  cargarClasificacionesVenta();
  cargarClasificacionesEnvase();
  cargarClasificacionesSeis();

  // Estados iniciales de toggles
  habilitaclase();
  habilitamarca();
  habilitatipo();
  habilitaVenta();
  habilitaEnvase();
  habilitaSeis();
});

//---------------------------------------------------------------------------
// MANEJO DE PESTAÑAS (DATOS BÁSICOS / CLASIFICACIONES)
//---------------------------------------------------------------------------

function cambiarPestana(tabName) {
  const btnBasicos = document.getElementById("btnTabDatosBasicos");
  const btnClasif = document.getElementById("btnTabClasificaciones");
  const paneBasicos = document.getElementById("tabContentDatosBasicos");
  const paneClasif = document.getElementById("tabContentClasificaciones");

  if (tabName === "datos-basicos") {
    btnBasicos.classList.add("active");
    btnClasif.classList.remove("active");
    paneBasicos.classList.add("active");
    paneClasif.classList.remove("active");
  } else if (tabName === "clasificaciones") {
    btnClasif.classList.add("active");
    btnBasicos.classList.remove("active");
    paneClasif.classList.add("active");
    paneBasicos.classList.remove("active");
  }
}

//---------------------------------------------------------------------------
// OBTENER VALOR DE PARÁMETROS
//---------------------------------------------------------------------------

function obtenerValorParametro(parametros, nombreParametro) {
  if (!parametros) return null;
  const urlParams = new URLSearchParams(parametros);
  return urlParams.get(nombreParametro);
}

//---------------------------------------------------------------------------
// VALIDACIÓN Y DISPARO DE BÚSQUEDA
//---------------------------------------------------------------------------

function validaBusqueda() {
  const entradaChecked = document.getElementById("tEntrada").checked;
  const salidaChecked = document.getElementById("tSalida").checked;

  if (!entradaChecked && !salidaChecked) {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Debe seleccionar al menos un tipo de movimiento (Entradas o Salidas).",
      confirmButtonColor: "#28a745",
    });
    return;
  }

  verTransaccionesLista();
}

//---------------------------------------------------------------------------
// PREPARACIÓN DE PARÁMETROS Y LLAMADA A LA API
//---------------------------------------------------------------------------

function verTransaccionesLista() {
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario") ? document.getElementById("hUsuario").value : "USER";
  let pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let pOpcion = TrasladosEntradaSalida();
  let pFechaDesde = $("#fecha_ini").val();
  let pFechaHasta = $("#fecha_fin").val();

  let pTraslado = document.getElementById("pTaslado") ? document.getElementById("pTaslado").value.trim() : "";
  let pDocumento = document.getElementById("pDocumento") ? document.getElementById("pDocumento").value.trim() : "";
  let pArticulo = pDocumento;

  // Clasificaciones
  let pClase = document.getElementById("claseReporte") ? document.getElementById("claseReporte").value : "";
  let pMarca = document.getElementById("marcaReporte") ? document.getElementById("marcaReporte").value : "";
  let pTipo = document.getElementById("tipoReporte") ? document.getElementById("tipoReporte").value : "";
  let pEnvase = document.getElementById("envaseReporte") ? document.getElementById("envaseReporte").value : "";
  let pVentas = document.getElementById("ventasReporte") ? document.getElementById("ventasReporte").value : "";
  let pT6 = document.getElementById("seisReporte") ? document.getElementById("seisReporte").value : "";

  // Tipo de Transacción
  let pTipoTransaccion = getTipoTransaccion();

  const params =
    "?pSistema=" + encodeURIComponent(pSistema) +
    "&pUsuario=" + encodeURIComponent(pUsuario) +
    "&pOpcion=" + encodeURIComponent(pOpcion) +
    "&pBodega=" + encodeURIComponent(pBodega) +
    "&pFechaDesde=" + encodeURIComponent(pFechaDesde) +
    "&pFechaHasta=" + encodeURIComponent(pFechaHasta) +
    "&pTraslado=" + encodeURIComponent(pTraslado) +
    "&pArticulo=" + encodeURIComponent(pArticulo) +
    "&pDocumento=" + encodeURIComponent(pDocumento) +
    "&pClase=" + encodeURIComponent(pClase) +
    "&pMarca=" + encodeURIComponent(pMarca) +
    "&pTipo=" + encodeURIComponent(pTipo) +
    "&pEnvase=" + encodeURIComponent(pEnvase) +
    "&pVentas=" + encodeURIComponent(pVentas) +
    "&pT6=" + encodeURIComponent(pT6) +
    "&pTipoTransaccion=" + encodeURIComponent(pTipoTransaccion);

  localStorage.setItem("parametrosBusqueda", params);
  console.log("Parámetros búsqueda:\n" + params);

  listadoTransacciones(params);
}

//---------------------------------------------------------------------------
// OBTENCIÓN DE TIPO DE TRANSACCIÓN (TRASLADOS, PEDIDOS, OCTUBRES)
//---------------------------------------------------------------------------

function getTipoTransaccion() {
  const traslado = document.getElementById("tTraslado");
  const pedidos = document.getElementById("tVenta");
  const facturas = document.getElementById("tFactura");

  const tChecked = traslado ? traslado.checked : false;
  const pChecked = pedidos ? pedidos.checked : false;
  const fChecked = facturas ? facturas.checked : false;

  const count = (tChecked ? 1 : 0) + (pChecked ? 1 : 0) + (fChecked ? 1 : 0);

  if (count === 0 || count === 3) {
    return "";
  }

  let tipos = "";
  if (tChecked) tipos += "T";
  if (pChecked) tipos += "P";
  if (fChecked) tipos += "O";

  return tipos;
}

//---------------------------------------------------------------------------
// EVALUACIÓN DE ENTRADAS Y SALIDAS
//---------------------------------------------------------------------------

function TrasladosEntradaSalida() {
  const entradaChecked = document.getElementById("tEntrada").checked;
  const salidaChecked = document.getElementById("tSalida").checked;

  if (entradaChecked && salidaChecked) {
    return "T"; // Todas
  } else if (entradaChecked && !salidaChecked) {
    return "E"; // Solo Entradas
  } else if (!entradaChecked && salidaChecked) {
    return "S"; // Solo Salidas
  }
  return null;
}

//---------------------------------------------------------------------------
//--  GESTIÓN DEL LOADER / INDICADOR DE CONSULTA
//---------------------------------------------------------------------------
function mostrarLoader(mensaje) {
  const contenedor = document.getElementById("contenedorLoader");
  if (contenedor) {
    const txt = document.getElementById("loaderTexto");
    if (txt) {
      txt.textContent = mensaje || "Ejecutando consulta...";
    }
    contenedor.classList.add("activo");
    contenedor.style.display = "flex";
  }

  const btnBuscar = document.getElementById("btnBuscar");
  if (btnBuscar) {
    btnBuscar.disabled = true;
    btnBuscar.style.opacity = "0.65";
    btnBuscar.style.cursor = "wait";
  }
}

function ocultarLoader() {
  const contenedor = document.getElementById("contenedorLoader");
  if (contenedor) {
    contenedor.classList.remove("activo");
    contenedor.style.display = "none";
  }

  const btnBuscar = document.getElementById("btnBuscar");
  if (btnBuscar) {
    btnBuscar.disabled = false;
    btnBuscar.style.opacity = "";
    btnBuscar.style.cursor = "";
  }
}
//---------------------------------------------------------------------------
//-- CONSULTA A LA API Y PROCESAMIENTO DE RESULTADOS
//---------------------------------------------------------------------------
function listadoTransacciones(parametros) {
  mostrarLoader("Consultando transacciones...");
  fetch(env.API_URL + "wmsdetallesdetrasccionesverificadas" + parametros, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.resultado && result.resultado.length > 0) {
          ArrayData = result.resultado;
          ArrayDataFiltrado = result.resultado;
          let cantReg = result.resultado.length;
          let nPag = Math.ceil(cantReg / xPag);

          document.getElementById("lblTotalRegistros").textContent = cantReg;

          mostrarResultadosVerificacionTransacciones(nPag, 1);
          calcularTotalesGlobales();
          ocultarLoader();
        } else {
          ArrayData = [];
          ArrayDataFiltrado = [];
          limpiarResultadoGeneral();
          Swal.fire({
            icon: "info",
            title: "Sin resultados",
            text: "No se encontraron transacciones asociadas a los parámetros de búsqueda.",
            confirmButtonColor: "#28a745",
          });
          ocultarLoader();
        }
      } else {
        ocultarLoader();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.message || "Ocurrió un error al consultar el servicio.",
          confirmButtonColor: "#d33",
        });
      }
    })
    .catch((error) => {
      ocultarLoader();
      console.error("Error en fetch:", error);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo establecer comunicación con el servidor.",
        confirmButtonColor: "#d33",
      });
    });
}

//---------------------------------------------------------------------------
// MOSTRAR PÁGINA ESPECÍFICA
//---------------------------------------------------------------------------
function mostrarResultadosVerificacionTransacciones(nPag, pag) {
  let desde = (pag - 1) * xPag;
  let hasta = pag * xPag;

  armarTablaDetalleTransaccionesVerificados(desde, hasta);

  let htm = paginadorTablas(nPag, pag, "mostrarResultadosVerificacionTransacciones");
  document.getElementById("resultadoPaginador").innerHTML = htm;
}

//---------------------------------------------------------------------------
// CALCULAR TOTALES GLOBALES
//---------------------------------------------------------------------------
function calcularTotalesGlobales() {
  if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) {
    document.getElementById("totalesContainer").style.display = "none";
    return;
  }

  cantContadaTotales = 0;
  cantVerificadaTotales = 0;
  totalEntradasGlobal = 0;
  totalSalidasGlobal = 0;

  ArrayDataFiltrado.forEach((item) => {
    // Cantidad Contada
    const cantCont = item["CANT CONTADA"] ?? item["CANT_CONTADA"];
    if (cantCont !== undefined && cantCont !== null && !isNaN(cantCont) && cantCont !== "") {
      cantContadaTotales += Math.abs(Number(cantCont));
    }

    // Cantidad Verificada
    const cantVerif = item["CANT VERIFICADA"] ?? item["CANT_VERIFICADA"];
    if (cantVerif !== undefined && cantVerif !== null && !isNaN(cantVerif) && cantVerif !== "") {
      cantVerificadaTotales += Math.abs(Number(cantVerif));
    }

    // Cantidad Aplicada (Entradas / Salidas)
    const cantApli = item["CANT APLICADA"] ?? item["CANT_APLICADA"];
    if (cantApli !== undefined && cantApli !== null && !isNaN(cantApli) && cantApli !== "") {
      const numApli = Number(cantApli);
      if (numApli > 0) {
        totalEntradasGlobal += numApli;
      } else if (numApli < 0) {
        totalSalidasGlobal += Math.abs(numApli);
      }
    }
  });

  document.getElementById("txtCantContada").textContent = cantContadaTotales.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  document.getElementById("txtCantVerificada").textContent = cantVerificadaTotales.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  document.getElementById("txtTotalEntradas").textContent = totalEntradasGlobal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  document.getElementById("txtTotalSalidas").textContent = totalSalidasGlobal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  document.getElementById("totalesContainer").style.display = "flex";
}

//---------------------------------------------------------------------------
// RENDERIZADO DEL GRID DE RESULTADOS DINÁMICO SEGÚN EL SP
//---------------------------------------------------------------------------

function armarTablaDetalleTransaccionesVerificados(desde, hasta) {
  const thead = document.getElementById("theadDetallestrasladosVerif");
  const tbody = document.getElementById("busqueda_result");

  if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) {
    if (thead) thead.innerHTML = "";
    if (tbody) tbody.innerHTML = "";
    return;
  }

  // 1. Obtener todas las columnas y encabezados reales que vienen del SP
  const firstRow = ArrayDataFiltrado[0];
  const headers = Object.keys(firstRow);

  // 2. Generar encabezado thead dinámico usando el propio encabezado del SP
  let headerHtml = "<tr>";
  headers.forEach((header) => {
    headerHtml += `<th>${escapeHtml(header)}</th>`;
  });
  headerHtml += "</tr>";
  thead.innerHTML = headerHtml;

  // 3. Generar filas tbody dinámicas usando los mismos campos del SP
  let bodyHtml = "";
  for (let i = desde; i < hasta && i < ArrayDataFiltrado.length; i++) {
    const row = ArrayDataFiltrado[i];
    if (!row) continue;

    bodyHtml += "<tr>";
    headers.forEach((header) => {
      let value = row[header];
      const upperHeader = header.toUpperCase();

      if (value === null || value === undefined) {
        bodyHtml += `<td></td>`;
      } else if (
        (upperHeader.includes("CANT") ||
          upperHeader.includes("CANTIDAD") ||
          upperHeader.includes("TOTAL") ||
          upperHeader.includes("UNIDADES") ||
          upperHeader.includes("PRECIO") ||
          upperHeader.includes("COSTO") ||
          upperHeader.includes("MONTO") ||
          upperHeader.includes("VALOR")) &&
        !isNaN(value) &&
        value !== "" &&
        typeof value !== "boolean"
      ) {
        bodyHtml += `<td class="cell-number">${Number(value).toFixed(2)}</td>`;
      } else if (upperHeader.includes("FECHA") || upperHeader.includes("HORA")) {
        bodyHtml += `<td class="cell-date cell-center">${escapeHtml(value)}</td>`;
      } else if (
        upperHeader.includes("ORIGEN") ||
        (upperHeader.startsWith("CONSECUTIVO") && !upperHeader.includes("DESTINO"))
      ) {
        bodyHtml += `<td class="cell-origen">${escapeHtml(value)}</td>`;
      } else if (
        upperHeader.includes("DESTINO") ||
        upperHeader.includes("ENTRADA") ||
        upperHeader.includes("SALIDA") ||
        upperHeader.includes("MOVIMIENTO") ||
        upperHeader.includes("USUARIO") ||
        upperHeader.includes("VERIFICADO") ||
        upperHeader.includes("TIPO") ||
        upperHeader.includes("ESTADO")
      ) {
        bodyHtml += `<td class="cell-center">${escapeHtml(value)}</td>`;
      } else {
        bodyHtml += `<td>${escapeHtml(value)}</td>`;
      }
    });
    bodyHtml += "</tr>";
  }

  tbody.innerHTML = bodyHtml;
}

function formatNumber(val) {
  if (val === undefined || val === null || val === "" || isNaN(val)) {
    return "";
  }
  return Number(val).toFixed(2);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

//---------------------------------------------------------------------------
// ESTILOS DINÁMICOS Y LIMPIEZA
//---------------------------------------------------------------------------

function aplicarEstilosTabla() {
  // Los estilos ahora se aplican nativamente en el renderizado
}

function limpiarResultadoGeneral() {
  const thead = document.getElementById("theadDetallestrasladosVerif");
  if (thead) thead.innerHTML = "";

  const tbody = document.getElementById("busqueda_result");
  if (tbody) tbody.innerHTML = "";

  const resultadoPaginador = document.getElementById("resultadoPaginador");
  if (resultadoPaginador) resultadoPaginador.innerHTML = "";

  const lblTotal = document.getElementById("lblTotalRegistros");
  if (lblTotal) lblTotal.textContent = "0";

  const totalesContainer = document.getElementById("totalesContainer");
  if (totalesContainer) totalesContainer.style.display = "none";
}

//---------------------------------------------------------------------------
// DESCARGA DE ARCHIVOS: EXCEL
//---------------------------------------------------------------------------
function descargarExcel() {
  if (!ArrayData || ArrayData.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "No hay registros disponibles para exportar.",
      confirmButtonColor: "#28a745",
    });
    return;
  }

  const headers = Object.keys(ArrayData[0]);
  const encabezado = headers.map((h) => h.replace(/_/g, " "));

  const rows = ArrayData.map((item) =>
    headers.map((header) => {
      const value = item[header];

      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return new Date(value);
      }

      if (!isNaN(value) && value !== "" && value !== null) {
        return Number(value);
      }

      return value;
    })
  );

  const worksheetData = [encabezado, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = 1; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      if (cell && cell.v instanceof Date) {
        cell.t = "d";
        cell.z = "yyyy-mm-dd hh:mm:ss";
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");
  XLSX.writeFile(workbook, "Detalle_Transacciones_Verificadas.xlsx");
}

//---------------------------------------------------------------------------
// DESCARGA DE ARCHIVOS: PDF
//---------------------------------------------------------------------------
function descargarPDF() {
  if (!ArrayData || ArrayData.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "No hay datos para generar el reporte PDF.",
      confirmButtonColor: "#28a745",
    });
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "mm", "a4");

  const titulo = "CENTRAL DE LUBRICANTES, S.A.";
  const subtitulo = "Detalle de Transacciones Verificadas";
  const pBodega = document.getElementById("bodega")?.value || "N/A";
  const headers = Object.keys(ArrayData[0]);
  const headersLabels = headers.map((h) => String(h));

  const filas = ArrayData.map((item) => {
    return headers.map((h) => {
      let val = item[h];
      const upper = h.toUpperCase();
      if (
        (upper.includes("CANT") || upper.includes("TOTAL") || upper.includes("PRECIO") || upper.includes("VALOR")) &&
        !isNaN(val) &&
        val !== "" &&
        val !== null &&
        typeof val !== "boolean"
      ) {
        return Number(val).toFixed(2);
      }
      return val !== undefined && val !== null ? String(val) : "";
    });
  });

  const dibujarEncabezado = () => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(14);
    doc.text(titulo, pageWidth / 2, 14, { align: "center" });

    doc.setFontSize(11);
    doc.text(subtitulo, pageWidth / 2, 21, { align: "center" });

    doc.setFontSize(8.5);
    doc.text(`Bodega: ${pBodega}`, 12, 28);
    doc.text(`Fecha de impresión: ${fechaDescarga}`, pageWidth - 12, 28, { align: "right" });
  };

  const agregarPiePagina = (data) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7.5);
    doc.text(`Página ${data.pageNumber}`, pageWidth - 12, pageHeight - 6, { align: "right" });
  };

  doc.autoTable({
    head: [headersLabels],
    body: filas,
    startY: 32,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: {
      fillColor: [89, 102, 108],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center"
    },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "center" },
      2: { halign: "left" },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "center" },
      8: { halign: "center" },
      9: { halign: "center" },
      10: { halign: "center" }
    },
    didDrawPage: (data) => {
      dibujarEncabezado();
      agregarPiePagina(data);
    },
    margin: { top: 32, left: 10, right: 10, bottom: 12 }
  });

  doc.save("Detalle_Transacciones_Verificadas.pdf");
}

//---------------------------------------------------------------------------
// CARGA DE FILTROS DE CLASIFICACIÓN
//---------------------------------------------------------------------------

async function cargarClasificacionesCLase() {
  const selectClase = document.getElementById("claseReporte");
  if (!selectClase) return;

  fetch(env.API_URL + "filtroswms", myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros && result.filtros.length > 0) {
        selectClase.innerHTML = '<option value="" disabled selected>Seleccionar Clase</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION_1;
          option.textContent = item.DESCRIPCION;
          selectClase.appendChild(option);
        });
        habilitaclase();
      }
    })
    .catch((err) => console.error("Error cargando Clase:", err));
}

async function cargarClasificacionesMarca() {
  const clase = document.getElementById("claseReporte").value;
  const selectMarca = document.getElementById("marcaReporte");
  if (!selectMarca) return;

  const params = "?clase=" + encodeURIComponent(clase);

  fetch(env.API_URL + "filtroswms" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros && result.filtros.length > 0) {
        selectMarca.innerHTML = '<option value="" disabled selected>Seleccionar Marca</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION_2;
          option.textContent = item.DESCRIPCION;
          selectMarca.appendChild(option);
        });
        habilitamarca();
      }
    })
    .catch((err) => console.error("Error cargando Marca:", err));
}

async function cargarClasificacionesTipo() {
  const clase = document.getElementById("claseReporte").value;
  const marca = document.getElementById("marcaReporte").value;
  const selectTipo = document.getElementById("tipoReporte");
  if (!selectTipo) return;

  const params = "?clase=" + encodeURIComponent(clase) + "&marca=" + encodeURIComponent(marca);

  fetch(env.API_URL + "filtroswms" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros && result.filtros.length > 0) {
        selectTipo.innerHTML = '<option value="" disabled selected>Seleccionar Tipo</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION_3;
          option.textContent = item.DESCRIPCION;
          selectTipo.appendChild(option);
        });
        habilitatipo();
      }
    })
    .catch((err) => console.error("Error cargando Tipo:", err));
}

async function cargarClasificacionesVenta() {
  const clase = document.getElementById("claseReporte").value;
  const marca = document.getElementById("marcaReporte").value;
  const tipo = document.getElementById("tipoReporte").value;
  const selectVenta = document.getElementById("ventasReporte");
  if (!selectVenta) return;

  const params = "?clase=" + encodeURIComponent(clase) + "&marca=" + encodeURIComponent(marca) + "&tipo=" + encodeURIComponent(tipo);

  fetch(env.API_URL + "filtroswms" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros && result.filtros.length > 0) {
        selectVenta.innerHTML = '<option value="" disabled selected>Seleccionar Ventas</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION_4;
          option.textContent = item.DESCRIPCION;
          selectVenta.appendChild(option);
        });
        habilitaVenta();
      }
    })
    .catch((err) => console.error("Error cargando Ventas:", err));
}

async function cargarClasificacionesEnvase() {
  const clase = document.getElementById("claseReporte").value;
  const marca = document.getElementById("marcaReporte").value;
  const tipo = document.getElementById("tipoReporte").value;
  const subtipo = document.getElementById("ventasReporte").value;
  const selectEnvase = document.getElementById("envaseReporte");
  if (!selectEnvase) return;

  const params = "?clase=" + encodeURIComponent(clase) + "&marca=" + encodeURIComponent(marca) + "&tipo=" + encodeURIComponent(tipo) + "&subtipo=" + encodeURIComponent(subtipo);

  fetch(env.API_URL + "filtroswms" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros && result.filtros.length > 0) {
        selectEnvase.innerHTML = '<option value="" disabled selected>Seleccionar Envase</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION_5;
          option.textContent = item.DESCRIPCION;
          selectEnvase.appendChild(option);
        });
        habilitaEnvase();
      }
    })
    .catch((err) => console.error("Error cargando Envase:", err));
}

async function cargarClasificacionesSeis() {
  const clase = document.getElementById("claseReporte").value;
  const marca = document.getElementById("marcaReporte").value;
  const tipo = document.getElementById("tipoReporte").value;
  const subtipo = document.getElementById("ventasReporte").value;
  const subtipo2 = document.getElementById("envaseReporte").value;
  const selectSeis = document.getElementById("seisReporte");
  if (!selectSeis) return;

  const params =
    "?clase=" + encodeURIComponent(clase) +
    "&marca=" + encodeURIComponent(marca) +
    "&tipo=" + encodeURIComponent(tipo) +
    "&subtipo=" + encodeURIComponent(subtipo) +
    "&subtipo2=" + encodeURIComponent(subtipo2);

  fetch(env.API_URL + "filtroswms" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros && result.filtros.length > 0) {
        selectSeis.innerHTML = '<option value="" disabled selected>Seleccionar 6</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION;
          option.textContent = item.DESCRIPCION;
          selectSeis.appendChild(option);
        });
        habilitaSeis();
      }
    })
    .catch((err) => console.error("Error cargando Clasificación 6:", err));
}

//---------------------------------------------------------------------------
// FUNCIONES DE HABILITACIÓN/DESHABILITACIÓN DE CLASIFICACIONES
//---------------------------------------------------------------------------

function habilitaclase() {
  const checkClase = document.getElementById("clase-todas");
  const selectClase = document.getElementById("claseReporte");
  if (!checkClase || !selectClase) return;

  if (checkClase.checked) {
    selectClase.disabled = true;
    selectClase.value = "";
  } else {
    selectClase.disabled = false;
  }
}

function habilitamarca() {
  const checkMarca = document.getElementById("marca-todas");
  const selectMarca = document.getElementById("marcaReporte");
  if (!checkMarca || !selectMarca) return;

  if (checkMarca.checked) {
    selectMarca.disabled = true;
    selectMarca.value = "";
  } else {
    selectMarca.disabled = false;
  }
}

function habilitatipo() {
  const checkTipo = document.getElementById("tipo-todas");
  const selectTipo = document.getElementById("tipoReporte");
  if (!checkTipo || !selectTipo) return;

  if (checkTipo.checked) {
    selectTipo.disabled = true;
    selectTipo.value = "";
  } else {
    selectTipo.disabled = false;
  }
}

function habilitaVenta() {
  const checkVentas = document.getElementById("ventas-todas");
  const selectVentas = document.getElementById("ventasReporte");
  if (!checkVentas || !selectVentas) return;

  if (checkVentas.checked) {
    selectVentas.disabled = true;
    selectVentas.value = "";
  } else {
    selectVentas.disabled = false;
  }
}

function habilitaEnvase() {
  const checkEnvase = document.getElementById("envase-todas");
  const selectEnvase = document.getElementById("envaseReporte");
  if (!checkEnvase || !selectEnvase) return;

  if (checkEnvase.checked) {
    selectEnvase.disabled = true;
    selectEnvase.value = "";
  } else {
    selectEnvase.disabled = false;
  }
}

function habilitaSeis() {
  const checkSeis = document.getElementById("seis-todas");
  const selectSeis = document.getElementById("seisReporte");
  if (!checkSeis || !selectSeis) return;

  if (checkSeis.checked) {
    selectSeis.disabled = true;
    selectSeis.value = "";
  } else {
    selectSeis.disabled = false;
  }
}

//---------------------------------------------------------------------------
// EVENT LISTENERS DE CAMBIO DE FECHA
//---------------------------------------------------------------------------

const fIni = document.getElementById("fecha_ini");
if (fIni) {
  fIni.addEventListener("change", function () {
    limpiarResultadoGeneral();
  });
}

const fFin = document.getElementById("fecha_fin");
if (fFin) {
  fFin.addEventListener("change", function () {
    limpiarResultadoGeneral();
  });
}

//---------------------------------------------------------------------------
// EXPORTACIÓN A WINDOW
//---------------------------------------------------------------------------


window.cambiarPestana = cambiarPestana;
window.validaBusqueda = validaBusqueda;
window.verTransaccionesLista = verTransaccionesLista;
window.mostrarResultadosVerificacionTransacciones = mostrarResultadosVerificacionTransacciones;
window.armarTablaDetalleTransaccionesVerificados = armarTablaDetalleTransaccionesVerificados;
window.limpiarResultadoGeneral = limpiarResultadoGeneral;
window.descargarExcel = descargarExcel;
window.descargarPDF = descargarPDF;
window.habilitaclase = habilitaclase;
window.habilitamarca = habilitamarca;
window.habilitatipo = habilitatipo;
window.habilitaVenta = habilitaVenta;
window.habilitaEnvase = habilitaEnvase;
window.habilitaSeis = habilitaSeis;
window.cargarClasificacionesCLase = cargarClasificacionesCLase;
window.cargarClasificacionesMarca = cargarClasificacionesMarca;
window.cargarClasificacionesTipo = cargarClasificacionesTipo;
window.cargarClasificacionesVenta = cargarClasificacionesVenta;
window.cargarClasificacionesEnvase = cargarClasificacionesEnvase;
window.cargarClasificacionesSeis = cargarClasificacionesSeis;
window.mostrarLoader = mostrarLoader;
window.ocultarLoader = ocultarLoader;

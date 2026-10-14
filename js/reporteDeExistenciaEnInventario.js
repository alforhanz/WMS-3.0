var ArrayData = [];
var ArrayDataFiltrado = [];

document.addEventListener("DOMContentLoaded", function () {
  console.log("Reporte Existencias DOM cargado...");

  const checkClase = document.getElementById("clase-todas");
  if (checkClase) localStorage.setItem("check_Clase", checkClase.checked);

  const checkMarca = document.getElementById("marca-todas");
  if (checkMarca) localStorage.setItem("ckeck_Marca", checkMarca.checked);

  const checkTipo = document.getElementById("tipo-todas");
  if (checkTipo) localStorage.setItem("ckeck_Tipo", checkTipo.checked);

  const checkVentas = document.getElementById("ventas-todas");
  if (checkVentas) localStorage.setItem("ckeck_Ventas", checkVentas.checked);

  const checkEnvase = document.getElementById("envase-todas");
  if (checkEnvase) localStorage.setItem("ckeck_Envase", checkEnvase.checked);

  cargarClasificacionesCLase();
  cargarClasificacionesMarca();
  cargarClasificacionesTipo();
  cargarClasificacionesVenta();
  cargarClasificacionesEnvase();

  if (checkClase) checkClase.addEventListener("change", habilitaclase);
  if (checkMarca) checkMarca.addEventListener("change", habilitamarca);
  if (checkTipo) checkTipo.addEventListener("change", habilitatipo);
  if (checkVentas) checkVentas.addEventListener("change", habilitaVenta);
  if (checkEnvase) checkEnvase.addEventListener("change", habilitaEnvase);

  habilitaclase();
  habilitamarca();
  habilitatipo();
  habilitaVenta();
  habilitaEnvase();
});

// ─────────────────────────────────────────────
// CLASIFICACIONES DINÁMICAS
// ─────────────────────────────────────────────
async function cargarClasificacionesCLase() {
  const checkClase = document.getElementById("clase-todas");
  const selectClase = document.getElementById("claseReporte");
  if (!selectClase) return;

  const isChecked = localStorage.getItem("check_Clase") === "true";
  const isDisabled = localStorage.getItem("Selector_de_Clase") === "true";
  if (checkClase) checkClase.checked = isChecked;
  selectClase.disabled = isDisabled;

  fetch(env.API_URL + "filtroswms", myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros?.length > 0) {
        selectClase.innerHTML = '<option value="" disabled selected>Seleccionar</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION_1;
          option.textContent = item.DESCRIPCION;
          selectClase.appendChild(option);
        });
        habilitaclase();
      }
    })
    .catch((err) => console.error("Error al cargar clases:", err));
}

async function cargarClasificacionesMarca() {
  const clase = document.getElementById("claseReporte")?.value || "";
  const checkMarca = document.getElementById("marca-todas");
  const selectMarca = document.getElementById("marcaReporte");
  if (!selectMarca) return;

  const isChecked = localStorage.getItem("ckeck_Marca") === "true";
  const isDisabled = localStorage.getItem("Selector_de_Marca") === "true";
  if (checkMarca) checkMarca.checked = isChecked;
  selectMarca.disabled = isDisabled;

  const params = "?clase=" + encodeURIComponent(clase);

  fetch(env.API_URL + "filtroswms" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros?.length > 0) {
        selectMarca.innerHTML = '<option value="" disabled selected>Seleccionar</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION_2;
          option.textContent = item.DESCRIPCION;
          selectMarca.appendChild(option);
        });
        habilitamarca();
      }
    })
    .catch((err) => console.error("Error al cargar marcas:", err));
}

async function cargarClasificacionesTipo() {
  const clase = document.getElementById("claseReporte")?.value || "";
  const marca = document.getElementById("marcaReporte")?.value || "";
  const checkTipo = document.getElementById("tipo-todas");
  const selectTipo = document.getElementById("tipoReporte");
  if (!selectTipo) return;

  const isChecked = localStorage.getItem("ckeck_Tipo") === "true";
  const isDisabled = localStorage.getItem("Selector_de_Tipo") === "true";
  if (checkTipo) checkTipo.checked = isChecked;
  selectTipo.disabled = isDisabled;

  const params = `?clase=${encodeURIComponent(clase)}&marca=${encodeURIComponent(marca)}`;

  fetch(env.API_URL + "filtroswms" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros?.length > 0) {
        selectTipo.innerHTML = '<option value="" disabled selected>Seleccionar</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION_3;
          option.textContent = item.DESCRIPCION;
          selectTipo.appendChild(option);
        });
        habilitatipo();
      }
    })
    .catch((err) => console.error("Error al cargar tipos:", err));
}

async function cargarClasificacionesVenta() {
  const clase = document.getElementById("claseReporte")?.value || "";
  const marca = document.getElementById("marcaReporte")?.value || "";
  const tipo = document.getElementById("tipoReporte")?.value || "";
  const selectVenta = document.getElementById("ventasReporte");
  const checkVentas = document.getElementById("ventas-todas");
  if (!selectVenta) return;

  const isChecked = localStorage.getItem("ckeck_Ventas") === "true";
  const isDisabled = localStorage.getItem("Selector_de_Ventas") === "true";
  if (checkVentas) checkVentas.checked = isChecked;
  selectVenta.disabled = isDisabled;

  const params = `?clase=${encodeURIComponent(clase)}&marca=${encodeURIComponent(marca)}&tipo=${encodeURIComponent(tipo)}`;

  fetch(env.API_URL + "filtroswms" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros?.length > 0) {
        selectVenta.innerHTML = '<option value="" disabled selected>Seleccionar</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION_4;
          option.textContent = item.DESCRIPCION;
          selectVenta.appendChild(option);
        });
        habilitaVenta();
      }
    })
    .catch((err) => console.error("Error al cargar ventas:", err));
}

async function cargarClasificacionesEnvase() {
  const clase = document.getElementById("claseReporte")?.value || "";
  const marca = document.getElementById("marcaReporte")?.value || "";
  const tipo = document.getElementById("tipoReporte")?.value || "";
  const subtipo = document.getElementById("ventasReporte")?.value || "";
  const selectEnvase = document.getElementById("envaseReporte");
  const checkEnvase = document.getElementById("envase-todas");
  if (!selectEnvase) return;

  const isChecked = localStorage.getItem("ckeck_Envase") === "true";
  const isDisabled = localStorage.getItem("Selector_de_Envase") === "true";
  if (checkEnvase) checkEnvase.checked = isChecked;
  selectEnvase.disabled = isDisabled;

  const params = `?clase=${encodeURIComponent(clase)}&marca=${encodeURIComponent(marca)}&tipo=${encodeURIComponent(tipo)}&subtipo=${encodeURIComponent(subtipo)}`;

  fetch(env.API_URL + "filtroswms" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.filtros?.length > 0) {
        selectEnvase.innerHTML = '<option value="" disabled selected>Seleccionar</option>';
        result.filtros.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.CLASIFICACION_5;
          option.textContent = item.DESCRIPCION;
          selectEnvase.appendChild(option);
        });
        habilitaEnvase();
      }
    })
    .catch((err) => console.error("Error al cargar envases:", err));
}

// ─────────────────────────────────────────────
// TOGGLE DE SELECTS SEGÚN CHECKBOX
// ─────────────────────────────────────────────
function habilitaclase() {
  const selectClase = document.getElementById("claseReporte");
  const checkClase = document.getElementById("clase-todas");
  if (!selectClase || !checkClase) return;

  selectClase.disabled = checkClase.checked;
  if (checkClase.checked) selectClase.value = "";
  localStorage.setItem("check_Clase", checkClase.checked);
  localStorage.setItem("Selector_de_Clase", checkClase.checked ? "true" : "false");
}

function habilitamarca() {
  const checkMarca = document.getElementById("marca-todas");
  const selectMarca = document.getElementById("marcaReporte");
  if (!selectMarca || !checkMarca) return;

  selectMarca.disabled = checkMarca.checked;
  if (checkMarca.checked) selectMarca.value = "";
  localStorage.setItem("ckeck_Marca", checkMarca.checked);
  localStorage.setItem("Selector_de_Marca", checkMarca.checked ? "true" : "false");
}

function habilitatipo() {
  const checkTipo = document.getElementById("tipo-todas");
  const selectTipo = document.getElementById("tipoReporte");
  if (!selectTipo || !checkTipo) return;

  selectTipo.disabled = checkTipo.checked;
  if (checkTipo.checked) selectTipo.value = "";
  localStorage.setItem("ckeck_Tipo", checkTipo.checked);
  localStorage.setItem("Selector_de_Tipo", checkTipo.checked ? "true" : "false");
}

function habilitaVenta() {
  const checkVentas = document.getElementById("ventas-todas");
  const selectVentas = document.getElementById("ventasReporte");
  if (!selectVentas || !checkVentas) return;

  selectVentas.disabled = checkVentas.checked;
  if (checkVentas.checked) selectVentas.value = "";
  localStorage.setItem("ckeck_Ventas", checkVentas.checked);
  localStorage.setItem("Selector_de_Ventas", checkVentas.checked ? "true" : "false");
}

function habilitaEnvase() {
  const checkEnvase = document.getElementById("envase-todas");
  const selectEnvase = document.getElementById("envaseReporte");
  if (!selectEnvase || !checkEnvase) return;

  selectEnvase.disabled = checkEnvase.checked;
  if (checkEnvase.checked) selectEnvase.value = "";
  localStorage.setItem("ckeck_Envase", checkEnvase.checked);
  localStorage.setItem("Selector_de_Envase", checkEnvase.checked ? "true" : "false");
}

// ─────────────────────────────────────────────
// VALIDACIÓN Y CONSULTA
// ─────────────────────────────────────────────
function validarParametros() {
  const pSistema = "WMS";
  const pOpcion = "M";
  const hUser = document.getElementById("hUsuario");
  const pUsuario = hUser ? hUser.value.trim() : "";
  const pArticulo = document.getElementById("pArticulo")?.value.trim() || "";
  let pBodega = "";

  const pSoloExistencia = document.getElementById("solo-existencias")?.checked ? "S" : "N";
  const pTodasBodega = document.getElementById("todas-las-bodegas")?.checked ? "S" : "N";

  if (pTodasBodega === "N") {
    pBodega = document.getElementById("bodega")?.value.trim() || "";
  }

  const pClase = document.getElementById("claseReporte")?.value || "";
  const pMarca = document.getElementById("marcaReporte")?.value || "";
  const pTipo = document.getElementById("tipoReporte")?.value || "";
  const pSuptipo2 = document.getElementById("ventasReporte")?.value || "";
  const pEnvase = document.getElementById("envaseReporte")?.value || "";

  const paramsObj = {
    pSistema,
    pUsuario,
    pOpcion,
    pArticulo,
    pClase,
    pMarca,
    pTipo,
    pSuptipo2,
    pEnvase,
    pBodega,
    pSoloExistencia,
    pTodasBodega,
  };

  Object.keys(paramsObj).forEach((key) => {
    const valor = paramsObj[key];
    if (valor === null || valor === undefined || valor === "null") {
      paramsObj[key] = "";
    }
  });

  const params = new URLSearchParams(paramsObj).toString();

  if (typeof mostrarLoader === "function") mostrarLoader("Consultando existencias...");
  fetchRptExistencias(params);
}

function fetchRptExistencias(params) {
  fetch(`${env.API_URL}wmsrptexistencias?${params}`, myInit)
    .then((res) => res.json())
    .then((result) => {
      if (result.msg !== "SUCCESS") {
        alertInfo("Error al consultar el servicio de existencias.");
        return;
      }
      if (!result.resultado || result.resultado.length === 0) {
        alertInfo("No se obtuvieron resultados para los criterios seleccionados.");
        limpiarTablaReporte();
        return;
      }

      ArrayData = result.resultado;
      ArrayDataFiltrado = result.resultado;
      renderTablaReporte(ArrayData);
      inicializarBotonesDescarga();
    })
    .catch((err) => {
      console.error("Error en fetch existencias:", err);
      alertInfo("Error de conexión al cargar existencias.");
      limpiarTablaReporte();
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

// ─────────────────────────────────────────────
// PAGINACIÓN Y RENDERIZADO DE TABLA
// ─────────────────────────────────────────────
const REGISTROS_POR_PAGINA = 15;
let paginaActual = 1;

function renderTablaReporte(data) {
  _renderHeader();
  _renderPaginado(data);
  _renderTotales(data);
  const lblCant = document.getElementById("cantidadDeRegistros");
  if (lblCant) {
    lblCant.textContent = `Total de registros: ${data.length}`;
  }
}

function _renderPaginado(data) {
  const totalPaginas = Math.ceil(data.length / REGISTROS_POR_PAGINA);

  if (paginaActual < 1) paginaActual = 1;
  if (paginaActual > totalPaginas && totalPaginas > 0) paginaActual = totalPaginas;

  const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
  const fin = inicio + REGISTROS_POR_PAGINA;
  const slice = data.slice(inicio, fin);

  _renderBody(slice);
  _renderControlesPaginacion(totalPaginas);
}

function irAPagina(pagina) {
  paginaActual = pagina;
  _renderPaginado(ArrayDataFiltrado);
}

function _renderHeader() {
  const thead = document.getElementById("htblRptExist");
  if (!thead) return;

  thead.innerHTML = `
    <tr>
      <th style="width: 38%; text-align: left;">Artículo / Descripción</th>
      <th style="width: 20%; text-align: center;">Cód. Barra</th>
      <th style="width: 14%; text-align: right;">Disponible</th>
      <th style="width: 14%; text-align: right;">Remitida</th>
      <th style="width: 14%; text-align: right;">Reservada</th>
    </tr>
  `;
}

function _renderBody(data) {
  const tbody = document.getElementById("tblbodyRptExist");
  if (!tbody) return;
  tbody.innerHTML = "";

  data.forEach((row) => {
    const tr = document.createElement("tr");

    const disp = parseFloat(row.disponible || 0).toFixed(2);
    const rem = parseFloat(row.remitida || 0).toFixed(2);
    const res = parseFloat(row.reservada || 0).toFixed(2);

    tr.innerHTML = `
      <td style="text-align: left;">
        <div class="cell-articulo-box">
          <span class="cell-articulo-code" style="color: #0284c7;">${row.articulo || ""}</span>
          <span class="cell-articulo-desc">${row.descripcion || ""}</span>
        </div>
      </td>
      <td class="cell-center" style="font-size: 11px;">${row.codBarra || "—"}</td>
      <td class="cell-number" style="font-weight: 700; color: #16a34a;">${disp}</td>
      <td class="cell-number">${rem}</td>
      <td class="cell-number">${res}</td>
    `;

    tbody.appendChild(tr);
  });
}

function _renderTotales(data) {
  let tfoot = document.querySelector("#tblRptExist tfoot");
  if (!tfoot) {
    tfoot = document.createElement("tfoot");
    document.getElementById("tblRptExist").appendChild(tfoot);
  }
  tfoot.innerHTML = "";

  const camposNumericos = ["disponible", "remitida", "reservada"];
  const totales = camposNumericos.reduce((acc, campo) => {
    acc[campo] = data.reduce((sum, row) => sum + parseFloat(row[campo] || 0), 0);
    return acc;
  }, {});

  const tr = document.createElement("tr");
  tr.style.backgroundColor = "#e2e8f0";
  tr.style.fontWeight = "bold";
  tr.style.borderTop = "2px solid #cbd5e1";

  const tdLabel = document.createElement("td");
  tdLabel.colSpan = 2;
  tdLabel.textContent = "TOTALES (GENERAL)";
  tdLabel.style.textAlign = "left";
  tdLabel.style.paddingLeft = "12px";
  tdLabel.style.fontSize = "12px";
  tr.appendChild(tdLabel);

  camposNumericos.forEach((campo) => {
    const td = document.createElement("td");
    td.className = "cell-number";
    td.style.fontSize = "13px";
    td.textContent = totales[campo].toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    tr.appendChild(td);
  });

  tfoot.appendChild(tr);
}

function _renderControlesPaginacion(totalPaginas) {
  let contenedor = document.getElementById("contenedorPaginacion");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  if (totalPaginas <= 1) return;

  const btnAnterior = _crearBtnPagina("«", paginaActual - 1, paginaActual === 1);
  contenedor.appendChild(btnAnterior);

  const rango = _calcularRango(paginaActual, totalPaginas);
  rango.forEach((item) => {
    if (item === "...") {
      const span = document.createElement("span");
      span.className = "paginacion-ellipsis";
      span.textContent = "…";
      contenedor.appendChild(span);
    } else {
      const btn = _crearBtnPagina(item, item, item === paginaActual);
      if (item === paginaActual) btn.classList.add("paginacion-activa");
      contenedor.appendChild(btn);
    }
  });

  const btnSiguiente = _crearBtnPagina("»", paginaActual + 1, paginaActual === totalPaginas);
  contenedor.appendChild(btnSiguiente);

  const info = document.createElement("span");
  info.className = "paginacion-info";
  info.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  contenedor.appendChild(info);
}

function _crearBtnPagina(label, pagina, deshabilitado) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.className = "paginacion-btn";
  btn.disabled = deshabilitado;
  if (!deshabilitado) btn.onclick = () => irAPagina(pagina);
  return btn;
}

function _calcularRango(actual, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (actual <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (actual >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", actual - 1, actual, actual + 1, "...", total];
}

function alertInfo(texto) {
  Swal.fire({
    icon: "info",
    title: "Información",
    text: texto,
    confirmButtonColor: "#28a745",
  });
}

function limpiarTablaReporte() {
  const tbody = document.getElementById("tblbodyRptExist");
  const thead = document.getElementById("htblRptExist");
  const tfoot = document.querySelector("#tblRptExist tfoot");
  const pag = document.getElementById("contenedorPaginacion");
  const cant = document.getElementById("cantidadDeRegistros");

  if (tbody) tbody.innerHTML = "";
  if (thead) thead.innerHTML = "";
  if (tfoot) tfoot.innerHTML = "";
  if (pag) pag.innerHTML = "";
  if (cant) cant.textContent = "";

  const btnExcel = document.getElementById("btnDescargarExcel");
  const btnPDF = document.getElementById("btnDescargarPDF");
  if (btnExcel) btnExcel.hidden = true;
  if (btnPDF) btnPDF.hidden = true;
}

// ─────────────────────────────────────────────
// EXPORTACIÓN EXCEL & PDF
// ─────────────────────────────────────────────
const EMPRESA = {
  nombre: "CENTRAL DE LUBRICANTES, S.A.",
  direccion: "VIA FERNANDEZ DE CORDOBA",
  ciudad: "CIUDAD DE PANAMA",
  telefono: "(507) 261-4021/4022",
  logo: "img/icon/BREMEN.png"
};

function _getFechaHora() {
  const now = new Date();
  return {
    fecha: now.toLocaleDateString("es-PA"),
    hora: now.toLocaleTimeString("es-PA")
  };
}

function _getBodega() {
  return document.getElementById("bodega")?.value?.trim() || "—";
}

function _agruparPorMarca(data) {
  return data.reduce((acc, row) => {
    const marca = row.marca?.trim() || "SIN MARCA";
    if (!acc[marca]) acc[marca] = [];
    acc[marca].push(row);
    return acc;
  }, {});
}

const LINEA = "______";

function descargarExcel() {
  const { fecha } = _getFechaHora();
  const bodega = _getBodega();
  const grupos = _agruparPorMarca(ArrayDataFiltrado);

  const filasMeta = [
    [EMPRESA.nombre],
    [EMPRESA.direccion],
    [EMPRESA.ciudad],
    [EMPRESA.telefono],
    [],
    ["Reporte de Existencias en Inventario"],
    [],
    [`Por fecha de Documento. Corte: ${fecha}`],
    [`Bodega: ${bodega}`],
    [],
    ["Artículo", "Descripción", "Cód Barra", "Conteo", "Total", "Disponible", "Remitida", "Reservada", "Diferencia"]
  ];

  const filasDatos = [];

  Object.entries(grupos).forEach(([marca, articulos]) => {
    filasDatos.push([marca, "", "", "", "", "", "", "", ""]);

    articulos.forEach((row) => {
      filasDatos.push([
        row.articulo ?? "",
        row.descripcion ?? "",
        row.codBarra ?? LINEA,
        LINEA,
        LINEA,
        parseFloat(row.disponible ?? 0).toFixed(2),
        parseFloat(row.remitida ?? 0).toFixed(2),
        parseFloat(row.reservada ?? 0).toFixed(2),
        LINEA,
      ]);
    });
  });

  const totDisponible = ArrayDataFiltrado.reduce((s, r) => s + parseFloat(r.disponible ?? 0), 0);
  const totRemitida = ArrayDataFiltrado.reduce((s, r) => s + parseFloat(r.remitida ?? 0), 0);
  const totReservada = ArrayDataFiltrado.reduce((s, r) => s + parseFloat(r.reservada ?? 0), 0);

  filasDatos.push([]);
  filasDatos.push([
    "TOTALES", "", "", "", "",
    totDisponible.toFixed(2),
    totRemitida.toFixed(2),
    totReservada.toFixed(2),
    ""
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([...filasMeta, ...filasDatos]);

  ws["!cols"] = [
    { wch: 18 },
    { wch: 40 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Existencias");
  XLSX.writeFile(wb, `Existencias_${bodega}_${fecha.replace(/\//g, "-")}.xlsx`);
}

function descargarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const { fecha, hora } = _getFechaHora();
  const bodega = _getBodega();
  const grupos = _agruparPorMarca(ArrayDataFiltrado);
  const totalPaginas = "{total_pages_count_string}";
  let marcaActivaAlSaltar = "";
  const marcaPorFila = [];

  function _encabezado(doc, nPagina) {
    const pW = doc.internal.pageSize.getWidth();

    try {
      doc.addImage(EMPRESA.logo, "PNG", 10, 6, 22, 12);
    } catch (e) {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(EMPRESA.nombre, pW / 2, 11, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(EMPRESA.direccion, pW / 2, 16, { align: "center" });
    doc.text(EMPRESA.ciudad, pW / 2, 20, { align: "center" });
    doc.text(EMPRESA.telefono, pW / 2, 24, { align: "center" });

    doc.setFontSize(9);
    doc.text(`Fecha  : ${fecha}`, pW - 10, 11, { align: "right" });
    doc.text(`Hora   : ${hora}`, pW - 10, 16, { align: "right" });
    doc.text(`Página : ${nPagina}`, pW - 10, 21, { align: "right" });

    doc.setLineWidth(0.5);
    doc.line(10, 28, pW - 10, 28);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Reporte de Existencias en Inventario", pW / 2, 35, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Por fecha de Documento. Corte: ${fecha}`, pW / 2, 42, { align: "center" });
    doc.text(`Bodega: ${bodega}.`, pW / 2, 47, { align: "center" });

    if (marcaActivaAlSaltar) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Marca: ${marcaActivaAlSaltar}`, 10, 54);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
    }

    doc.setLineWidth(0.2);
    doc.line(10, 57, pW - 10, 57);
  }

  const body = [];
  Object.entries(grupos).forEach(([marca, articulos]) => {
    articulos.forEach((row) => {
      body.push([
        `${row.articulo ?? ""}\n${row.descripcion ?? ""}`,
        row.codBarra ?? LINEA,
        LINEA,
        LINEA,
        parseFloat(row.disponible ?? 0).toFixed(2),
        parseFloat(row.remitida ?? 0).toFixed(2),
        parseFloat(row.reservada ?? 0).toFixed(2),
        LINEA,
      ]);
      marcaPorFila.push(marca);
    });
  });

  const totDisponible = ArrayDataFiltrado.reduce((s, r) => s + parseFloat(r.disponible ?? 0), 0);
  const totRemitida = ArrayDataFiltrado.reduce((s, r) => s + parseFloat(r.remitida ?? 0), 0);
  const totReservada = ArrayDataFiltrado.reduce((s, r) => s + parseFloat(r.reservada ?? 0), 0);

  body.push([
    {
      content: "TOTALES",
      colSpan: 4,
      styles: {
        fontStyle: "bold",
        fillColor: [158, 158, 158],
        textColor: [255, 255, 255],
      },
    },
    {
      content: totDisponible.toFixed(2),
      styles: {
        fontStyle: "bold",
        fillColor: [158, 158, 158],
        textColor: [255, 255, 255],
        halign: "center",
      },
    },
    {
      content: totRemitida.toFixed(2),
      styles: {
        fontStyle: "bold",
        fillColor: [158, 158, 158],
        textColor: [255, 255, 255],
        halign: "center",
      },
    },
    {
      content: totReservada.toFixed(2),
      styles: {
        fontStyle: "bold",
        fillColor: [158, 158, 158],
        textColor: [255, 255, 255],
        halign: "center",
      },
    },
    { content: "", styles: { fontStyle: "bold", fillColor: [158, 158, 158] } },
  ]);

  let numeroPagina = 1;

  doc.autoTable({
    head: [
      [
        { content: "Artículo / Descripción", styles: { halign: "left" } },
        { content: "Cód Barra", styles: { halign: "center" } },
        { content: "Conteo", styles: { halign: "center" } },
        { content: "Total", styles: { halign: "center" } },
        { content: "Disponible", styles: { halign: "center" } },
        { content: "Remitida", styles: { halign: "center" } },
        { content: "Reservada", styles: { halign: "center" } },
        { content: "Diferencia", styles: { halign: "center" } },
      ],
    ],
    body,
    startY: 60,
    margin: { top: 60, left: 10, right: 10, bottom: 15 },
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: {
      fillColor: [27, 103, 107],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 45, halign: "left" },
      1: { cellWidth: 38, halign: "center" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
      7: { cellWidth: 0, halign: "center" },
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: (hookData) => {
      if (hookData.section === "body") {
        const idx = hookData.row.index;
        if (marcaPorFila[idx]) {
          marcaActivaAlSaltar = marcaPorFila[idx];
        }
      }
    },
    didDrawPage: () => {
      _encabezado(doc, numeroPagina);
      numeroPagina++;
    },
  });

  if (typeof doc.putTotalPages === "function") {
    doc.putTotalPages(totalPaginas);
  }

  doc.save(`Existencias_${bodega}_${fecha.replace(/\//g, "-")}.pdf`);
}

function inicializarBotonesDescarga() {
  const btnDescargarExcel = document.getElementById("btnDescargarExcel");
  const btnDescargarPDF = document.getElementById("btnDescargarPDF");

  if (btnDescargarExcel) btnDescargarExcel.hidden = false;
  if (btnDescargarPDF) btnDescargarPDF.hidden = false;
}

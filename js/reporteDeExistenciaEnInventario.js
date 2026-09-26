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

// var ArrayData = [];
// var ArrayDataFiltrado = [];

// // ─────────────────────────────────────────────
// // INIT DOM
// // ─────────────────────────────────────────────
// document.addEventListener("DOMContentLoaded", function () {
//     console.log("DOM Loaded...");

//         const checkClase = document.getElementById("clase-todas");
//         localStorage.setItem("check_Clase", checkClase.checked);
//         const checkMarca = document.getElementById("marca-todas");
//         localStorage.setItem("ckeck_Marca", checkMarca.checked);
//         const checkTipo = document.getElementById("tipo-todas");
//         localStorage.setItem("ckeck_Tipo", checkTipo.checked);
//         const checkVentas = document.getElementById("ventas-todas");
//         localStorage.setItem("ckeck_Ventas", checkVentas.checked);
//         const checkEnvase = document.getElementById("envase-todas");
//         localStorage.setItem("ckeck_Envase", checkEnvase.checked);
//         // const checkSeis = document.getElementById("seis-todas");
//         // localStorage.setItem("ckeck_Seis", checkSeis.checked);

//         cargarClasificacionesCLase();
//         cargarClasificacionesMarca();
//         cargarClasificacionesTipo();
//         cargarClasificacionesVenta();
//         cargarClasificacionesEnvase();
//         // cargarClasificacionesSeis();

//          // Inicializar tabs de Materialize
//         const tabs = document.querySelectorAll('.tabs');
//         M.Tabs.init(tabs);

//         // Inicializar los selects de Materialize
//         var elems = document.querySelectorAll("select");
//         M.FormSelect.init(elems);

//         // Agregar un evento para detectar cambios en el checkbox
//         checkClase.addEventListener("change", habilitaclase);
//         checkMarca.addEventListener("change", habilitamarca);
//         checkTipo.addEventListener("change", habilitatipo);
//         checkVentas.addEventListener("change", habilitaVenta);
//         checkEnvase.addEventListener("change", habilitaEnvase);
//         // checkSeis.addEventListener("change", habilitaSeis);

//         habilitaclase();
//         habilitamarca();
//         habilitatipo();
//         habilitaVenta();
//         habilitaEnvase();
//         // habilitaSeis();
// });


// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
// async function cargarClasificacionesCLase() {
//   const checkClase = document.getElementById("clase-todas");
//   const selectClase = document.getElementById("claseReporte");
//   const isChecked = localStorage.getItem("check_Clase") === "true";
//   const isDisabled = localStorage.getItem("Selector_de_Clase") === "true";
//   checkClase.checked = isChecked;
//   selectClase.disabled = isDisabled;

//   fetch(env.API_URL + "filtroswms", myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.filtros.length != 0) {
//           // Limpiar el select antes de agregar opciones
//           selectClase.innerHTML =
//             '<option value="" disabled selected>Seleccionar Clase</option>';

//           // Agregar opciones al select
//           result.filtros.forEach((item) => {
//             const option = document.createElement("option");
//             option.value = item.CLASIFICACION_1;
//             option.textContent = item.DESCRIPCION;
//             selectClase.appendChild(option);
//           });

//           // Inicializar el select (si usas Materialize)
//           M.FormSelect.init(selectClase);
//           habilitaclase();
          
//         }
//       } else {
//         console.log("Error en el SP");
//       }
//     });
// }
// async function cargarClasificacionesMarca() {
//   const clase = document.getElementById("claseReporte").value;
//   const checkMarca = document.getElementById("marca-todas");
//   const selectMArca = document.getElementById("marcaReporte");

//   const isChecked = localStorage.getItem("ckeck_Marca") === "true";
//   const isDisabled = localStorage.getItem("Selector_de_Marca") === "true";
//   checkMarca.checked = isChecked;
//   selectMArca.disabled = isDisabled;

//   const params = "?clase=" + clase;

//   try {
//   } catch (error) {
//     console.error("Error al cargar clasificaciones:", error.message);
//   }

//   return fetch(env.API_URL + "filtroswms" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.filtros.length != 0) {
//           // Limpiar el select antes de agregar opciones
//           selectMArca.innerHTML =
//             '<option value="" disabled selected>Seleccionar Clase</option>';

//           // Agregar opciones al select
//           result.filtros.forEach((item) => {
//             const option = document.createElement("option");
//             option.value = item.CLASIFICACION_2;
//             option.textContent = item.DESCRIPCION;
//             selectMArca.appendChild(option);
//           });

//           // Inicializar el select (si usas Materialize)
//           M.FormSelect.init(selectMArca);
//           habilitamarca();
          
//         }
//       } else {
//         console.log("Error en el SP");
//       }
//     });
// }
// async function cargarClasificacionesTipo() {
//   const clase = document.getElementById("claseReporte").value;
//   const marca = document.getElementById("marcaReporte").value;
//   const checkTipo = document.getElementById("tipo-todas");
//   const selectTipo = document.getElementById("tipoReporte");
//   const isChecked = localStorage.getItem("ckeck_Tipo") === "true";
//   const isDisabled = localStorage.getItem("Selector_de_Tipo") === "true";
//   checkTipo.checked = isChecked;
//   selectTipo.disabled = isDisabled;
//   const params = "?clase=" + clase + "&marca=" + marca;

//   try {
//   } catch (error) {
//     console.error("Error al cargar clasificaciones:", error.message);
//   }

//   fetch(env.API_URL + "filtroswms" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.filtros.length != 0) {
//           // Limpiar el select antes de agregar opciones
//           selectTipo.innerHTML =
//             '<option value="" disabled selected>Seleccionar Clase</option>';

//           // Agregar opciones al select
//           result.filtros.forEach((item) => {
//             const option = document.createElement("option");
//             option.value = item.CLASIFICACION_3;
//             option.textContent = item.DESCRIPCION;
//             selectTipo.appendChild(option);
//           });

//           // Inicializar el select (si usas Materialize)
//           M.FormSelect.init(selectTipo);
//           habilitatipo();
          
//         }
//       } else {
//         console.log("Error en el SP");
//       }
//     });
// }
// async function cargarClasificacionesVenta() {
//   const clase = document.getElementById("claseReporte").value;
//   const marca = document.getElementById("marcaReporte").value;
//   const tipo = document.getElementById("tipoReporte").value;
//   const selectVenta = document.getElementById("ventasReporte");
//   const checkVentas = document.getElementById("ventas-todas");
//   const isChecked = localStorage.getItem("ckeck_Ventas") === "true";
//   const isDisabled = localStorage.getItem("Selector_de_Ventas") === "true";
//   checkVentas.checked = isChecked;
//   selectVenta.disabled = isDisabled;

//   const params = "?clase=" + clase + "&marca=" + marca + "&tipo=" + tipo;

//   try {
//   } catch (error) {
//     console.error("Error al cargar clasificaciones:", error.message);
//   }

//   fetch(env.API_URL + "filtroswms" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.filtros.length != 0) {
//           // Limpiar el select antes de agregar opciones
//           selectVenta.innerHTML =
//             '<option value="" disabled selected>Seleccionar Clase</option>';

//           // Agregar opciones al select
//           result.filtros.forEach((item) => {
//             const option = document.createElement("option");
//             option.value = item.CLASIFICACION_4;
//             option.textContent = item.DESCRIPCION;
//             selectVenta.appendChild(option);
//           });

//           // Inicializar el select (si usas Materialize)
//           M.FormSelect.init(selectVenta);
//           habilitaVenta();
          
//         }
//       } else {
//         console.log("Error en el SP");
//       }
//     });
// }
// async function cargarClasificacionesEnvase() {
//   const clase = document.getElementById("claseReporte").value;
//   const marca = document.getElementById("marcaReporte").value;
//   const tipo = document.getElementById("tipoReporte").value;
//   const subtipo = document.getElementById("ventasReporte").value;
//   const selectEnvase = document.getElementById("envaseReporte");
//   const checkEnvase = document.getElementById("envase-todas");
//   const isChecked = localStorage.getItem("ckeck_Envase") === "true";
//   const isDisabled = localStorage.getItem("Selector_de_Envase") === "true";
//   checkEnvase.checked = isChecked;
//   selectEnvase.disabled = isDisabled;

//   const params =
//     "?clase=" +
//     clase +
//     "&marca=" +
//     marca +
//     "&tipo=" +
//     tipo +
//     "&subtipo=" +
//     subtipo;

//   try {
//   } catch (error) {
//     console.error("Error al cargar clasificaciones:", error.message);
//   }

//   fetch(env.API_URL + "filtroswms" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.filtros.length != 0) {
//           // Limpiar el select antes de agregar opciones
//           selectEnvase.innerHTML =
//             '<option value="" disabled selected>Seleccionar Clase</option>';

//           // Agregar opciones al select
//           result.filtros.forEach((item) => {
//             const option = document.createElement("option");
//             option.value = item.CLASIFICACION_5;
//             option.textContent = item.DESCRIPCION;
//             selectEnvase.appendChild(option);
//           });

//           // Inicializar el select (si usas Materialize)
//           M.FormSelect.init(selectEnvase);
//           habilitaEnvase();
          
//         }
//       } else {
//         console.log("Error en el SP");
//       }
//     });
// }
// // async function cargarClasificacionesSeis() {
// //   const clase = document.getElementById("claseReporte").value;
// //   const marca = document.getElementById("marcaReporte").value;
// //   const tipo = document.getElementById("tipoReporte").value;
// //   const subtipo = document.getElementById("ventasReporte").value;
// //   const subtipo2 = document.getElementById("envaseReporte").value;

// //   const selectSeis = document.getElementById("seisReporte");
// //   const checkSeis = document.getElementById("envase-todas");
// //   const isChecked = localStorage.getItem("ckeck_Seis") === "true";
// //   const isDisabled = localStorage.getItem("Selector_de_Seis") === "true";
// //   checkSeis.checked = isChecked;
// //   selectSeis.disabled = isDisabled;

// //   const params =
// //     "?clase=" +
// //     clase +
// //     "&marca=" +
// //     marca +
// //     "&tipo=" +
// //     tipo +
// //     "&subtipo=" +
// //     subtipo +
// //     "&subtipo2=" +
// //     subtipo2;

// //   try {
// //   } catch (error) {
// //     console.error("Error al cargar clasificaciones:", error.message);
// //   }

// //   fetch(env.API_URL + "filtroswms" + params, myInit)
// //     .then((response) => response.json())
// //     .then((result) => {
// //       if (result.msg === "SUCCESS") {
// //         if (result.filtros.length != 0) {
// //           // Limpiar el select antes de agregar opciones
// //           selectSeis.innerHTML =
// //             '<option value="" disabled selected>Seleccionar Clase</option>';

// //           // Agregar opciones al select
// //           result.filtros.forEach((item) => {
// //             const option = document.createElement("option");
// //             option.value = item.CLASIFICACION;
// //             option.textContent = item.DESCRIPCION;
// //             selectSeis.appendChild(option);
// //           });

// //           // Inicializar el select (si usas Materialize)
// //           M.FormSelect.init(selectSeis);
// //           habilitaSeis();
          
// //         }
// //       } else {
// //         console.log("Error en el SP");
// //       }
// //     });
// // }


// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
// // Función para habilitar o deshabilitar el select de clasificaciones según el estado del checkbox
// function habilitaclase() {
//   const selectClase = document.getElementById("claseReporte"); // Select
//   const checkClase = document.getElementById("clase-todas");

//   if (checkClase.checked) {
//     // Si el checkbox está marcado, deshabilitar el select
//     selectClase.disabled = true;

//     // Establecer el valor del select a null
//     selectClase.value = null;

//     // Guardar el estado del checkbox y del select en localStorage
//     localStorage.setItem("check_Clase", checkClase.checked);
//     localStorage.setItem("Selector_de_Clase", "true");
//   } else {
//     // Si el checkbox no está marcado, habilitar el select
//     selectClase.disabled = false;

//     // Guardar el estado del checkbox y del select en localStorage
//     localStorage.setItem("check_Clase", checkClase.checked);
//     localStorage.setItem("Selector_de_Clase", "false");
//   }

//   // Reiniciar el select de Materialize después de cambiar el estado
//   var elems = document.querySelectorAll("select");
//   M.FormSelect.init(elems);
// }
// function habilitamarca() {
//   const checkMArca = document.getElementById("marca-todas");
//   const selectMarca = document.getElementById("marcaReporte");

//   if (checkMArca.checked) {
//     // Si el checkbox está marcado, deshabilitar el select
//     selectMarca.disabled = true;

//     // Establecer el valor del select a null
//     selectMarca.value = null;

//     // Guardar el estado del checkbox y del select en localStorage
//     localStorage.setItem("ckeck_Marca", checkMArca.checked);
//     localStorage.setItem("Selector_de_Marca", "true");
//   } else {
//     // Si el checkbox no está marcado, habilitar el select
//     selectMarca.disabled = false;

//     // Guardar el estado del checkbox y del select en localStorage
//     localStorage.setItem("ckeck_Marca", checkMArca.checked);
//     localStorage.setItem("Selector_de_Marca", "false");
//   }

//   // Reiniciar el select de Materialize después de cambiar el estado
//   var elems = document.querySelectorAll("select");
//   M.FormSelect.init(elems);
// }
// function habilitatipo() {
//   const checkTipo = document.getElementById("tipo-todas");
//   const selectTipo = document.getElementById("tipoReporte");

//   if (checkTipo.checked) {
//     // Si el checkbox está Tipodo, deshabilitar el select
//     selectTipo.disabled = true;

//     // Establecer el valor del select a null
//     selectTipo.value = null;

//     // Guardar el estado del checkbox y del select en localStorage
//     localStorage.setItem("ckeck_Tipo", checkTipo.checked);
//     localStorage.setItem("Selector_de_Tipo", "true");
//   } else {
//     // Si el checkbox no está Tipodo, habilitar el select
//     selectTipo.disabled = false;

//     // Guardar el estado del checkbox y del select en localStorage
//     localStorage.setItem("ckeck_Tipo", checkTipo.checked);
//     localStorage.setItem("Selector_de_Tipo", "false");
//   }

//   // Reiniciar el select de Materialize después de cambiar el estado
//   var elems = document.querySelectorAll("select");
//   M.FormSelect.init(elems);
// }
// function habilitaVenta() {
//   const checkVentas = document.getElementById("ventas-todas");
//   const selectVentas = document.getElementById("ventasReporte");

//   if (checkVentas.checked) {
//     // Si el checkbox está Tipodo, deshabilitar el select
//     selectVentas.disabled = true;

//     // Establecer el valor del select a null
//     selectVentas.value = null;

//     // Guardar el estado del checkbox y del select en localStorage
//     localStorage.setItem("ckeck_Ventas", checkVentas.checked);
//     localStorage.setItem("Selector_de_Ventas", "true");
//   } else {
//     // Si el checkbox no está Tipodo, habilitar el select
//     selectVentas.disabled = false;

//     // Guardar el estado del checkbox y del select en localStorage
//     localStorage.setItem("ckeck_Ventas", checkVentas.checked);
//     localStorage.setItem("Selector_de_Ventas", "false");
//   }

//   // Reiniciar el select de Materialize después de cambiar el estado
//   var elems = document.querySelectorAll("select");
//   M.FormSelect.init(elems);
// }
// function habilitaEnvase() {
//   const checkEnvase = document.getElementById("envase-todas");
//   const selectEnvase = document.getElementById("envaseReporte");

//   if (checkEnvase.checked) {
//     // Si el checkbox está Tipodo, deshabilitar el select
//     selectEnvase.disabled = true;

//     // Establecer el valor del select a null
//     selectEnvase.value = null;

//     // Guardar el estado del checkbox y del select en localStorage
//     localStorage.setItem("ckeck_Envase", checkEnvase.checked);
//     localStorage.setItem("Selector_de_Envase", "true");
//   } else {
//     // Si el checkbox no está Tipodo, habilitar el select
//     selectEnvase.disabled = false;

//     // Guardar el estado del checkbox y del select en localStorage
//     localStorage.setItem("ckeck_Envase", checkEnvase.checked);
//     localStorage.setItem("Selector_de_Envase", "false");
//   }

//   // Reiniciar el select de Materialize después de cambiar el estado
//   var elems = document.querySelectorAll("select");
//   M.FormSelect.init(elems);
// }
// // function habilitaSeis() {
// //   const checkSeis = document.getElementById("seis-todas");
// //   const selectSeis = document.getElementById("seisReporte");

// //   if (checkSeis.checked) {
// //     // Si el checkbox está Tipodo, deshabilitar el select
// //     selectSeis.disabled = true;

// //     // Establecer el valor del select a null
// //     selectSeis.value = null;

// //     // Guardar el estado del checkbox y del select en localStorage
// //     localStorage.setItem("ckeck_Seis", checkSeis.checked);
// //     localStorage.setItem("Selector_de_Seis", "true");
// //   } else {
// //     // Si el checkbox no está Tipodo, habilitar el select
// //     selectSeis.disabled = false;

// //     // Guardar el estado del checkbox y del select en localStorage
// //     localStorage.setItem("ckeck_Seis", checkSeis.checked);
// //     localStorage.setItem("Selector_de_Seis", "false");
// //   }

// //   // Reiniciar el select de Materialize después de cambiar el estado
// //   var elems = document.querySelectorAll("select");
// //   M.FormSelect.init(elems);
// // }






// // ─────────────────────────────────────────────
// // 1. VALIDAR Y ARMAR PARÁMETROS
// // ─────────────────────────────────────────────
// // function validarParametros() {
// //     const pSistema = "WMS";
// //     const pOpcion = "M";
// //     const pUsuario = document.getElementById("hUsuario").value.trim();
// //     const pArticulo = document.getElementById("pArticulo").value.trim();
// //     let pBodega ="";
// //     const pSoloExistencia = document.getElementById("solo-existencias").checked ? "S" : "N";
// //     const pTodasBodega    = document.getElementById("todas-las-bodegas").checked    ? "S" : "N";
// //     if(pTodasBodega==="N"){
// //         pBodega = document.getElementById("bodega").value.trim();
// //     } 
       

// //         const pClase =document.getElementById("claseReporte").value;

// //         const pMarca =document.getElementById("marcaReporte").value;

// //         const pTipo =document.getElementById("tipoReporte").value;
        
// //         const pSuptipo2 =document.getElementById("ventasReporte").value;

// //         const pEnvase =document.getElementById("envaseReporte").value;

// //     const params = new URLSearchParams({
// //         pSistema,
// //         pUsuario,
// //         pOpcion,
// //         pArticulo,
// //         pClase,
// //         pMarca,
// //         pTipo,
// //         pSuptipo2,
// //         pEnvase,        
// //         pBodega,
// //         pSoloExistencia,
// //         pTodasBodega,
// //     }).toString();

// //     console.log("Parámetros:", params);
// //     mostrarLoader();
// //     fetchRptExistencias(params);
// // }

// // ─────────────────────────────────────────────
// // 2. FETCH AL API
// // ─────────────────────────────────────────────
// function validarParametros() {
//     const pSistema = "WMS";
//     const pOpcion = "M";
//     const pUsuario = document.getElementById("hUsuario").value.trim();
//     const pArticulo = document.getElementById("pArticulo").value.trim();
//     let pBodega ="";
//     const pSoloExistencia = document.getElementById("solo-existencias").checked ? "S" : "N";
//     const pTodasBodega    = document.getElementById("todas-las-bodegas").checked    ? "S" : "N";
    
//     if(pTodasBodega==="N"){
//         pBodega = document.getElementById("bodega").value.trim();
//     } 

//     const pClase = document.getElementById("claseReporte").value;
//     const pMarca = document.getElementById("marcaReporte").value;
//     const pTipo = document.getElementById("tipoReporte").value;
//     const pSuptipo2 = document.getElementById("ventasReporte").value;
//     const pEnvase = document.getElementById("envaseReporte").value;

//     // 1. Creamos un objeto con todos los parámetros
//     const materiasPrimas = {
//         pSistema,
//         pUsuario,
//         pOpcion,
//         pArticulo,
//         pClase,
//         pMarca,
//         pTipo,
//         pSuptipo2,
//         pEnvase,        
//         pBodega,
//         pSoloExistencia,
//         pTodasBodega,
//     };

//     // 2. Limpiamos el objeto: si el valor es null, undefined o el string "null", lo dejamos vacío ""
//     Object.keys(materiasPrimas).forEach(key => {
//         const valor = materiasPrimas[key];
//         if (valor === null || valor === undefined || valor === "null") {
//             materiasPrimas[key] = ""; 
//             // NOTA: Si prefieres que el parámetro ni siquiera se envíe en la URL, 
//             // puedes usar: delete materiasPrimas[key];
//         }
//     });

//     // 3. Ahora sí, se lo pasamos seguro a URLSearchParams
//     const params = new URLSearchParams(materiasPrimas).toString();

//     console.log("Parámetros limpios:", params);
//     mostrarLoader();
//     fetchRptExistencias(params);
// }

// function fetchRptExistencias(params) {
//     fetch(`${env.API_URL}wmsrptexistencias?${params}`, myInit)
//         .then((res) => res.json())
//         .then((result) => {
//             ocultarLoader();
//             if (result.msg !== "SUCCESS") {
//                 alertInfo("Fallo en el API.");
//                 return;
//             }
//             if (result.resultado.length === 0) {
//                 alertInfo("No se obtuvieron resultados.");
//                 return;
//             }

//             ArrayData = result.resultado;
//             ArrayDataFiltrado = result.resultado;
//             renderTablaReporte(ArrayData);
//             // Mostrar botones de descarga
//             //document.getElementById("botonesDescarga").removeAttribute("hidden");
//             inicializarBotonesDescarga();
//         })
//         .catch(() => {
//             ocultarLoader();
//             alertInfo("Error de conexión con el API.");
//         });
// }
// // ─────────────────────────────────────────────
// // PAGINACIÓN — configuración
// // ─────────────────────────────────────────────
// const REGISTROS_POR_PAGINA = 15;
// let paginaActual = 1;

// // ─────────────────────────────────────────────
// // 3. RENDER COMPLETO: HEADER + BODY + TOTALES + PAGINACIÓN
// // ─────────────────────────────────────────────
// function renderTablaReporte(data) {
//     _renderHeader();
//     _renderPaginado(data);
//     _renderTotales(data);
//     document.getElementById("cantidadDeRegistros").textContent =
//         `Total de registros: ${data.length}`;
// }

// // ─────────────────────────────────────────────
// // PAGINADO — calcula slice y llama a body + controles
// // ─────────────────────────────────────────────
// function _renderPaginado(data) {
//     const totalPaginas = Math.ceil(data.length / REGISTROS_POR_PAGINA);

//     // Corregir página fuera de rango
//     if (paginaActual < 1) paginaActual = 1;
//     if (paginaActual > totalPaginas) paginaActual = totalPaginas;

//     const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
//     const fin = inicio + REGISTROS_POR_PAGINA;
//     const slice = data.slice(inicio, fin);

//     _renderBody(slice);
//     _renderControlesPaginacion(totalPaginas);
// }

// function irAPagina(pagina) {
//     paginaActual = pagina;
//     _renderPaginado(ArrayDataFiltrado);
// }

// // ─────────────────────────────────────────────
// // HEADER
// // ─────────────────────────────────────────────
// function _renderHeader() {
//     const headers = [
//         { label: ["Artículo", "Descripción"], rotated: false },
//         { label: ["Cód Barra"], rotated: false },
//         { label: ["Disponible"], rotated: false },
//         { label: ["Remitida"], rotated: false },
//         { label: ["Reservada"], rotated: false },
//         //{ label: ["Diferencia"],              rotated: true  },
//     ];

//     const thead = document.getElementById("htblRptExist");
//     thead.innerHTML = "";
//     const tr = document.createElement("tr");

//     headers.forEach(({ label, rotated }) => {
//         const th = document.createElement("th");
//         if (rotated) {
//             th.classList.add("th-rotated");
//             const span = document.createElement("span");
//             span.textContent = label[0];
//             th.appendChild(span);
//         } else if (label.length === 2) {
//             const h4 = document.createElement("h4");
//             h4.textContent = label[0];
//             const h5 = document.createElement("h5");
//             h5.textContent = label[1];
//             th.append(h4, h5);
//         } else {
//             th.textContent = label[0];
//         }
//         tr.appendChild(th);
//     });

//     thead.appendChild(tr);
// }

// // ─────────────────────────────────────────────
// // BODY — solo el slice de la página actual
// // ─────────────────────────────────────────────
// function _renderBody(data) {
//     const tbody = document.getElementById("tblbodyRptExist");
//     tbody.innerHTML = "";

//     const camposNumericos = ["disponible", "remitida", "reservada"];

//     data.forEach((row) => {
//         const tr = document.createElement("tr");

//         // Celda Artículo + Descripción
//         const tdArt = document.createElement("td");
//         tdArt.classList.add("td-articulo");
//         const h4 = document.createElement("h4");
//         h4.textContent = row.articulo ?? "";
//         const h5 = document.createElement("h5");
//         h5.textContent = row.descripcion ?? "";
//         tdArt.append(h4, h5);
//         tr.appendChild(tdArt);

//         // Celda Código de Barras
//         const tdCod = document.createElement("td");
//         tdCod.classList.add("td-codbarra");
//         tdCod.textContent = row.codBarra ?? "—";
//         tr.appendChild(tdCod);

//         // Celdas numéricas
//         camposNumericos.forEach((campo) => {
//             const td = document.createElement("td");
//             const valor = parseFloat(row[campo] ?? 0);
//             td.classList.add("td-numero");
//             td.textContent = valor.toFixed(2);
//             //if (campo === "diferencia" && valor < 0) td.classList.add("td-negativo");
//             tr.appendChild(td);
//         });

//         tbody.appendChild(tr);
//     });
// }

// // ─────────────────────────────────────────────
// // TOTALES — suma sobre ArrayDataFiltrado completo
// // ─────────────────────────────────────────────
// function _renderTotales(data) {
//     let tfoot = document.querySelector("#tblRptExist tfoot");
//     if (!tfoot) {
//         tfoot = document.createElement("tfoot");
//         document.getElementById("tblRptExist").appendChild(tfoot);
//     }
//     tfoot.innerHTML = "";

//     const camposNumericos = ["disponible", "remitida", "reservada"];

//     const totales = camposNumericos.reduce((acc, campo) => {
//         acc[campo] = data.reduce(
//             (sum, row) => sum + parseFloat(row[campo] ?? 0),
//             0,
//         );
//         return acc;
//     }, {});

//     const tr = document.createElement("tr");
//     tr.classList.add("tr-totales");

//     const tdLabel = document.createElement("td");
//     tdLabel.colSpan = 2;
//     tdLabel.classList.add("td-totales-label");
//     tdLabel.textContent = "TOTALES";
//     tr.appendChild(tdLabel);

//     camposNumericos.forEach((campo) => {
//         const td = document.createElement("td");
//         td.classList.add("td-numero", "td-total");

//         // Formato con comas y 2 decimales
//         td.textContent = totales[campo].toLocaleString("en-US", {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//         });

//         // Alineación a la derecha
//         td.style.textAlign = "right";

//         tr.appendChild(td);
//     });

//     tfoot.appendChild(tr);
// }

// // function _renderTotales(data) {
// //     // Reutilizar tfoot o crearlo si no existe
// //     let tfoot = document.querySelector("#tblRptExist tfoot");
// //     if (!tfoot) {
// //         tfoot = document.createElement("tfoot");
// //         document.getElementById("tblRptExist").appendChild(tfoot);
// //     }
// //     tfoot.innerHTML = "";

// //     const camposNumericos = ["disponible", "remitida", "reservada"];

// //     // Calcular totales sobre el dataset completo (no solo la página)
// //     const totales = camposNumericos.reduce((acc, campo) => {
// //         acc[campo] = data.reduce(
// //             (sum, row) => sum + parseFloat(row[campo] ?? 0),
// //             0,
// //         );
// //         return acc;
// //     }, {});

// //     const tr = document.createElement("tr");
// //     tr.classList.add("tr-totales");

// //     // Celda etiqueta "TOTALES"
// //     const tdLabel = document.createElement("td");
// //     tdLabel.colSpan = 2;
// //     tdLabel.classList.add("td-totales-label");
// //     tdLabel.textContent = "TOTALES";
// //     tr.appendChild(tdLabel);

// //     // Celdas de totales
// //     camposNumericos.forEach((campo) => {
// //         const td = document.createElement("td");
// //         td.classList.add("td-numero", "td-total");
// //         td.textContent = totales[campo].toFixed(2);      
// //         tr.appendChild(td);
// //     });

// //     tfoot.appendChild(tr);
// // }


// // ─────────────────────────────────────────────
// // CONTROLES DE PAGINACIÓN
// // ─────────────────────────────────────────────
// function _renderControlesPaginacion(totalPaginas) {
//     // Reutilizar contenedor o crearlo
//     let contenedor = document.getElementById("contenedorPaginacion");
//     if (!contenedor) {
//         contenedor = document.createElement("div");
//         contenedor.id = "contenedorPaginacion";
//         document
//             .querySelector(".reporteExInv")
//             .insertAdjacentElement("afterend", contenedor);
//     }
//     contenedor.innerHTML = "";

//     if (totalPaginas <= 1) return; // sin paginación si cabe en una página

//     // Botón Anterior
//     const btnAnterior = _crearBtnPagina(
//         "«",
//         paginaActual - 1,
//         paginaActual === 1,
//     );
//     contenedor.appendChild(btnAnterior);

//     // Números de página — máximo 5 visibles con ellipsis
//     const rango = _calcularRango(paginaActual, totalPaginas);
//     rango.forEach((item) => {
//         if (item === "...") {
//             const span = document.createElement("span");
//             span.classList.add("paginacion-ellipsis");
//             span.textContent = "…";
//             contenedor.appendChild(span);
//         } else {
//             const btn = _crearBtnPagina(item, item, item === paginaActual);
//             if (item === paginaActual) btn.classList.add("paginacion-activa");
//             contenedor.appendChild(btn);
//         }
//     });

//     // Botón Siguiente
//     const btnSiguiente = _crearBtnPagina(
//         "»",
//         paginaActual + 1,
//         paginaActual === totalPaginas,
//     );
//     contenedor.appendChild(btnSiguiente);

//     // Info de página
//     const info = document.createElement("span");
//     info.classList.add("paginacion-info");
//     info.textContent = `Página ${paginaActual} de ${totalPaginas}`;
//     contenedor.appendChild(info);
// }

// function _crearBtnPagina(label, pagina, deshabilitado) {
//     const btn = document.createElement("button");
//     btn.textContent = label;
//     btn.classList.add("paginacion-btn");
//     btn.disabled = deshabilitado;
//     if (!deshabilitado) btn.onclick = () => irAPagina(pagina);
//     return btn;
// }

// function _calcularRango(actual, total) {
//     if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
//     if (actual <= 4) return [1, 2, 3, 4, 5, "...", total];
//     if (actual >= total - 3)
//         return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
//     return [1, "...", actual - 1, actual, actual + 1, "...", total];
// }

// // ─────────────────────────────────────────────
// // HELPER — Alertas
// // ─────────────────────────────────────────────
// function alertInfo(texto) {
//     Swal.fire({
//         icon: "info",
//         title: "Información",
//         text: texto,
//         confirmButtonColor: "#28a745",
//     });
// }

// // ─────────────────────────────────────────────
// // HELPERS COMPARTIDOS
// // ─────────────────────────────────────────────
// const EMPRESA = {
//     nombre: "CENTRAL DE LUBRICANTES, S.A.",
//     direccion: "VIA FERNANDEZ DE CORDOBA",
//     ciudad: "CIUDAD DE PANAMA",
//     telefono: "(507) 261-4021/4022",
//     logo: "img/icon/BREMEN.png"
// };

// function _getFechaHora() {
//     const now = new Date();
//     const fecha = now.toLocaleDateString("es-PA");
//     const hora = now.toLocaleTimeString("es-PA");
//     return { fecha, hora };
// }

// function _getBodega() {
//     return document.getElementById("bodega")?.value?.trim() || "—";
// }

// // Agrupa ArrayData por marca
// function _agruparPorMarca(data) {
//     return data.reduce((acc, row) => {
//         const marca = row.marca?.trim() || "SIN MARCA";
//         if (!acc[marca]) acc[marca] = [];
//         acc[marca].push(row);
//         return acc;
//     }, {});
// }

// const LINEA = "______";   // línea para celdas manuales

// // ─────────────────────────────────────────────
// // DESCARGAR EXCEL
// // ─────────────────────────────────────────────
// function descargarExcel() {
//     const { fecha, hora } = _getFechaHora();
//     const bodega = _getBodega();
//     const grupos = _agruparPorMarca(ArrayDataFiltrado);

//     // Filas del encabezado del documento
//     const filasMeta = [
//         [EMPRESA.nombre],
//         [EMPRESA.direccion],
//         [EMPRESA.ciudad],
//         [EMPRESA.telefono],
//         [],
//         ["Reporte de Existencias en Inventario"],
//         [],
//         [`Por fecha de Documento. Corte: ${fecha}`],
//         [`Bodega: ${bodega}`],
//         [],
//         // Cabecera de columnas
//         ["Artículo", "Descripción", "Cód Barra", "Conteo", "Total",
//             "Disponible", "Remitida", "Reservada", "Diferencia"]
//     ];

//     const filasDatos = [];

//     Object.entries(grupos).forEach(([marca, articulos]) => {
//         // Fila de marca
//         filasDatos.push([marca, "", "", "", "", "", "", "", ""]);

//         articulos.forEach(row => {
//             filasDatos.push([
//                 row.articulo ?? "",
//                 row.descripcion ?? "",
//                 row.codBarra ?? LINEA,
//                 LINEA,                          // Conteo — para escribir a mano
//                 LINEA,                          // Total  — para escribir a mano
//                 parseFloat(row.disponible ?? 0).toFixed(2),
//                 parseFloat(row.remitida ?? 0).toFixed(2),
//                 parseFloat(row.reservada ?? 0).toFixed(2),
//                 LINEA,                          // Diferencia — para escribir a mano
//             ]);
//         });
//     });

//     // Fila de totales
//     const totDisponible = ArrayDataFiltrado.reduce((s, r) => s + parseFloat(r.disponible ?? 0), 0);
//     const totRemitida = ArrayDataFiltrado.reduce((s, r) => s + parseFloat(r.remitida ?? 0), 0);
//     const totReservada = ArrayDataFiltrado.reduce((s, r) => s + parseFloat(r.reservada ?? 0), 0);

//     filasDatos.push([]);
//     filasDatos.push([
//         "TOTALES", "", "", "", "",
//         totDisponible.toFixed(2),
//         totRemitida.toFixed(2),
//         totReservada.toFixed(2),
//         ""
//     ]);

//     // Construir workbook con SheetJS
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.aoa_to_sheet([...filasMeta, ...filasDatos]);

//     // Anchos de columna
//     ws["!cols"] = [
//         { wch: 18 }, // Artículo
//         { wch: 40 }, // Descripción
//         { wch: 18 }, // Cód Barra
//         { wch: 12 }, // Conteo
//         { wch: 12 }, // Total
//         { wch: 12 }, // Disponible
//         { wch: 12 }, // Remitida
//         { wch: 12 }, // Reservada
//         { wch: 12 }, // Diferencia
//     ];

//     XLSX.utils.book_append_sheet(wb, ws, "Existencias");
//     XLSX.writeFile(wb, `Existencias_${bodega}_${fecha.replace(/\//g, "-")}.xlsx`);
// }


// // ─────────────────────────────────────────────
// // DESCARGAR PDF
// // ─────────────────────────────────────────────

// function descargarPDF() {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
//     const { fecha, hora } = _getFechaHora();
//     const bodega = _getBodega();
//     const grupos = _agruparPorMarca(ArrayDataFiltrado);
//     const totalPaginas = "{total_pages_count_string}";
//     let marcaActivaAlSaltar = "";
//     const marcaPorFila = [];


//     function _encabezado(doc, nPagina) {
//         const pW = doc.internal.pageSize.getWidth();

//         // Logo — esquina superior izquierda
//         try {
//             doc.addImage(EMPRESA.logo, "PNG", 10, 6, 22, 12);
//         } catch (e) { }

//         // ── Empresa — CENTRADO ──
//         doc.setFont("helvetica", "bold");
//         doc.setFontSize(13);
//         doc.text(EMPRESA.nombre, pW / 2, 11, { align: "center" }); // ← centrado
//         doc.setFont("helvetica", "normal");
//         doc.setFontSize(9);
//         doc.text(EMPRESA.direccion, pW / 2, 16, { align: "center" });
//         doc.text(EMPRESA.ciudad, pW / 2, 20, { align: "center" });
//         doc.text(EMPRESA.telefono, pW / 2, 24, { align: "center" });

//         // Fecha / Hora / Página — derecha
//         doc.setFontSize(9);
//         doc.text(`Fecha  : ${fecha}`, pW - 10, 11, { align: "right" });
//         doc.text(`Hora   : ${hora}`, pW - 10, 16, { align: "right" });
//         doc.text(`Página : ${nPagina}`, pW - 10, 21, { align: "right" });

//         // Línea separadora superior
//         doc.setLineWidth(0.5);
//         doc.line(10, 28, pW - 10, 28);

//         // Título
//         doc.setFont("helvetica", "bold");
//         doc.setFontSize(13);
//         doc.text("Reporte de Existencias en Inventario", pW / 2, 35, {
//             align: "center",
//         });

//         // Subtítulos
//         doc.setFont("helvetica", "normal");
//         doc.setFontSize(10);
//         doc.text(`Por fecha de Documento. Corte: ${fecha}`, pW / 2, 42, {
//             align: "center",
//         });
//         doc.text(`Bodega: ${bodega}.`, pW / 2, 47, { align: "center" });

//         // ── Marca activa — izquierda, debajo de Bodega ──
//         if (marcaActivaAlSaltar) {
//             doc.setFont("helvetica", "bold");
//             doc.setFontSize(10);
//             doc.setTextColor(50, 50, 50);
//             doc.text(`Marca: ${marcaActivaAlSaltar}`, 10, 54);
//             doc.setTextColor(0, 0, 0);
//             doc.setFont("helvetica", "normal");
//         }

//         // Línea separadora inferior
//         doc.setLineWidth(0.2);
//         doc.line(10, 57, pW - 10, 57); // ← bajó 7mm para dar espacio a la marca
//     }

//     // ── Construir filas agrupadas por marca ──
//     const body = [];

//     Object.entries(grupos).forEach(([marca, articulos]) => {
//         articulos.forEach((row) => {
//             body.push([
//                 `${row.articulo ?? ""}\n${row.descripcion ?? ""}`, // ← una sola celda
//                 row.codBarra ?? LINEA,
//                 LINEA,
//                 LINEA,
//                 parseFloat(row.disponible ?? 0).toFixed(2),
//                 parseFloat(row.remitida ?? 0).toFixed(2),
//                 parseFloat(row.reservada ?? 0).toFixed(2),
//                 LINEA,
//             ]);
//             marcaPorFila.push(marca);
//         });
//     });

//     // Fila de totales
//     const totDisponible = ArrayDataFiltrado.reduce(
//         (s, r) => s + parseFloat(r.disponible ?? 0),
//         0,
//     );
//     const totRemitida = ArrayDataFiltrado.reduce(
//         (s, r) => s + parseFloat(r.remitida ?? 0),
//         0,
//     );
//     const totReservada = ArrayDataFiltrado.reduce(
//         (s, r) => s + parseFloat(r.reservada ?? 0),
//         0,
//     );

//     body.push([
//         {
//             content: "TOTALES",
//             colSpan: 4, // ← era 5
//             styles: {
//                 fontStyle: "bold",
//                 fillColor: [158, 158, 158],
//                 textColor: [255, 255, 255],
//             },
//         },
//         {
//             content: totDisponible.toFixed(2),
//             styles: {
//                 fontStyle: "bold",
//                 fillColor: [158, 158, 158],
//                 textColor: [255, 255, 255],
//                 halign: "center",
//             },
//         },
//         {
//             content: totRemitida.toFixed(2),
//             styles: {
//                 fontStyle: "bold",
//                 fillColor: [158, 158, 158],
//                 textColor: [255, 255, 255],
//                 halign: "center",
//             },
//         },
//         {
//             content: totReservada.toFixed(2),
//             styles: {
//                 fontStyle: "bold",
//                 fillColor: [158, 158, 158],
//                 textColor: [255, 255, 255],
//                 halign: "center",
//             },
//         },
//         { content: "", styles: { fontStyle: "bold", fillColor: [158, 158, 158] } },
//     ]);

//     // ── Tabla con autoTable ──
//     let numeroPagina = 1;

//     doc.autoTable({
//         head: [
//             [
//                 { content: "Artículo / Descripción", styles: { halign: "left" } }, // ← una sola
//                 { content: "Cód Barra", styles: { halign: "center" } },
//                 { content: "Conteo", styles: { halign: "center" } },
//                 { content: "Total", styles: { halign: "center" } },
//                 { content: "Disponible", styles: { halign: "center" } },
//                 { content: "Remitida", styles: { halign: "center" } },
//                 { content: "Reservada", styles: { halign: "center" } },
//                 { content: "Diferencia", styles: { halign: "center" } },
//             ],
//         ],
   
//         body,
//         startY: 60,
//         margin: { top: 60, left: 10, right: 10, bottom: 15 },
//         styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
//         headStyles: {
//                 fillColor: [126, 129, 128],
//                 textColor: [255, 255, 255],
//                 fontStyle: "bold",
//                 fontSize: 8,
//                 halign: "center",
//                 valign: "middle",
//                 // minCellHeight: 12, 
//             },

//         columnStyles: {
//             0: { cellWidth: 45, halign: "left" }, // Artículo + Descripción
//             1: { cellWidth: 38, halign: "center" }, // Cód Barra
//             2: { cellWidth: 15, halign: "center" }, // Conteo
//             3: { cellWidth: 15, halign: "center" }, // Total
//             4: { cellWidth: 20, halign: "center" }, // Disponible
//             5: { cellWidth: 20, halign: "center" }, // Remitida
//             6: { cellWidth: 20, halign: "center" }, // Reservada
//             7: { cellWidth: 0, halign: "center" }, // Diferencia — auto
//         }, // TOTAL: ~175mm ✓

//       alternateRowStyles: { fillColor: [245, 245, 245] },

//         didParseCell: (hookData) => {
//             if (hookData.section === "body") {
//                 const idx = hookData.row.index;
//                 if (marcaPorFila[idx]) {
//                     marcaActivaAlSaltar = marcaPorFila[idx];
//                 }
//             }
//         },
//         didDrawPage: (hookData) => {
//             _encabezado(doc, numeroPagina);
//             numeroPagina++;
//         },
//     });

//     // Reemplazar placeholder de total de páginas
//     if (typeof doc.putTotalPages === "function") {
//         doc.putTotalPages(totalPaginas);
//     }

//     doc.save(`Existencias_${bodega}_${fecha.replace(/\//g, "-")}.pdf`);
// }

// //___________________________________________
// //      Activa btn descarga
// //___________________________________________
// function inicializarBotonesDescarga() {
//   const btnDescargarExcel = document.getElementById("btnDescargarExcel"); // Obtener el botón de Excel
//   const btnDescargarPDF = document.getElementById("btnDescargarPDF"); // Crear el botón de PDF
//   const lblExcel = (document.getElementById("lblExcel").style.display =
//     "block");
//   const lblPDF = (document.getElementById("lblPDF").style.display = "block");
//   btnDescargarExcel
//     ? (btnDescargarExcel.hidden = false)
//     : (btnDescargarExcel.hidden = true);
//   btnDescargarPDF
//     ? (btnDescargarPDF.hidden = false)
//     : (btnDescargarPDF.hidden = true);
// }


// // __________________________________________
// // Función para borrar la tabla
// // __________________________________________

// function limpiarValores() {
 
// }
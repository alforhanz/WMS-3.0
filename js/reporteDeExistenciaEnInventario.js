var ArrayData = [];
var ArrayDataFiltrado = [];

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM Loaded...");
});

// ─────────────────────────────────────────────
// 1. VALIDAR Y ARMAR PARÁMETROS
// ─────────────────────────────────────────────
function validarParametros() {
    const pSistema = "WMS";
    const pOpcion = "M";
    const pUsuario = document.getElementById("hUsuario").value.trim();
    const pArticulo = document.getElementById("pArticulo").value.trim();
    const pBodega = document.getElementById("bodega").value.trim();
    const pSoloExistencia = "";
    const pTodasBodega = "";

    if (!pUsuario) {
        alertInfo("Usuario no identificado.");
        return;
    }
    if (!pBodega) {
        alertInfo("Debe seleccionar una bodega.");
        return;
    }

    const params = new URLSearchParams({
        pSistema,
        pUsuario,
        pOpcion,
        pArticulo,
        pBodega,
        pSoloExistencia,
        pTodasBodega,
    }).toString();

    console.log("Parámetros:", params);
    mostrarLoader();
    fetchRptExistencias(params);
}

// ─────────────────────────────────────────────
// 2. FETCH AL API
// ─────────────────────────────────────────────
function fetchRptExistencias(params) {
    fetch(`${env.API_URL}wmsrptexistencias?${params}`, myInit)
        .then((res) => res.json())
        .then((result) => {
            ocultarLoader();
            if (result.msg !== "SUCCESS") {
                alertInfo("Fallo en el API.");
                return;
            }
            if (result.resultado.length === 0) {
                alertInfo("No se obtuvieron resultados.");
                return;
            }

            ArrayData = result.resultado;
            ArrayDataFiltrado = result.resultado;
            renderTablaReporte(ArrayData);
            // Mostrar botones de descarga
            document.getElementById("botonesDescarga").removeAttribute("hidden");
        })
        .catch(() => {
            ocultarLoader();
            alertInfo("Error de conexión con el API.");
        });
}
// ─────────────────────────────────────────────
// PAGINACIÓN — configuración
// ─────────────────────────────────────────────
const REGISTROS_POR_PAGINA = 15;
let paginaActual = 1;

// ─────────────────────────────────────────────
// 3. RENDER COMPLETO: HEADER + BODY + TOTALES + PAGINACIÓN
// ─────────────────────────────────────────────
function renderTablaReporte(data) {
    _renderHeader();
    _renderPaginado(data);
    _renderTotales(data);
    document.getElementById("cantidadDeRegistros").textContent =
        `Total de registros: ${data.length}`;
}

// ─────────────────────────────────────────────
// PAGINADO — calcula slice y llama a body + controles
// ─────────────────────────────────────────────
function _renderPaginado(data) {
    const totalPaginas = Math.ceil(data.length / REGISTROS_POR_PAGINA);

    // Corregir página fuera de rango
    if (paginaActual < 1) paginaActual = 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

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

// ─────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────
function _renderHeader() {
    const headers = [
        { label: ["Artículo", "Descripción"], rotated: false },
        { label: ["Cód Barra"], rotated: false },
        { label: ["Disponible"], rotated: true },
        { label: ["Remitida"], rotated: true },
        { label: ["Reservada"], rotated: true },
        //{ label: ["Diferencia"],              rotated: true  },
    ];

    const thead = document.getElementById("htblRptExist");
    thead.innerHTML = "";
    const tr = document.createElement("tr");

    headers.forEach(({ label, rotated }) => {
        const th = document.createElement("th");
        if (rotated) {
            th.classList.add("th-rotated");
            const span = document.createElement("span");
            span.textContent = label[0];
            th.appendChild(span);
        } else if (label.length === 2) {
            const h4 = document.createElement("h4");
            h4.textContent = label[0];
            const h5 = document.createElement("h5");
            h5.textContent = label[1];
            th.append(h4, h5);
        } else {
            th.textContent = label[0];
        }
        tr.appendChild(th);
    });

    thead.appendChild(tr);
}

// ─────────────────────────────────────────────
// BODY — solo el slice de la página actual
// ─────────────────────────────────────────────
function _renderBody(data) {
    const tbody = document.getElementById("tblbodyRptExist");
    tbody.innerHTML = "";

    const camposNumericos = ["disponible", "remitida", "reservada"];

    data.forEach((row) => {
        const tr = document.createElement("tr");

        // Celda Artículo + Descripción
        const tdArt = document.createElement("td");
        tdArt.classList.add("td-articulo");
        const h4 = document.createElement("h4");
        h4.textContent = row.articulo ?? "";
        const h5 = document.createElement("h5");
        h5.textContent = row.descripcion ?? "";
        tdArt.append(h4, h5);
        tr.appendChild(tdArt);

        // Celda Código de Barras
        const tdCod = document.createElement("td");
        tdCod.classList.add("td-codbarra");
        tdCod.textContent = row.codBarra ?? "—";
        tr.appendChild(tdCod);

        // Celdas numéricas
        camposNumericos.forEach((campo) => {
            const td = document.createElement("td");
            const valor = parseFloat(row[campo] ?? 0);
            td.classList.add("td-numero");
            td.textContent = valor.toFixed(2);
            //if (campo === "diferencia" && valor < 0) td.classList.add("td-negativo");
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// ─────────────────────────────────────────────
// TOTALES — suma sobre ArrayDataFiltrado completo
// ─────────────────────────────────────────────
function _renderTotales(data) {
    // Reutilizar tfoot o crearlo si no existe
    let tfoot = document.querySelector("#tblRptExist tfoot");
    if (!tfoot) {
        tfoot = document.createElement("tfoot");
        document.getElementById("tblRptExist").appendChild(tfoot);
    }
    tfoot.innerHTML = "";

    const camposNumericos = ["disponible", "remitida", "reservada"];

    // Calcular totales sobre el dataset completo (no solo la página)
    const totales = camposNumericos.reduce((acc, campo) => {
        acc[campo] = data.reduce(
            (sum, row) => sum + parseFloat(row[campo] ?? 0),
            0,
        );
        return acc;
    }, {});

    const tr = document.createElement("tr");
    tr.classList.add("tr-totales");

    // Celda etiqueta "TOTALES"
    const tdLabel = document.createElement("td");
    tdLabel.colSpan = 2;
    tdLabel.classList.add("td-totales-label");
    tdLabel.textContent = "TOTALES";
    tr.appendChild(tdLabel);

    // Celdas de totales
    camposNumericos.forEach((campo) => {
        const td = document.createElement("td");
        td.classList.add("td-numero", "td-total");
        td.textContent = totales[campo].toFixed(2);
        //if (campo === "diferencia" && totales[campo] < 0) td.classList.add("td-negativo");
        tr.appendChild(td);
    });

    tfoot.appendChild(tr);
}

// ─────────────────────────────────────────────
// CONTROLES DE PAGINACIÓN
// ─────────────────────────────────────────────
function _renderControlesPaginacion(totalPaginas) {
    // Reutilizar contenedor o crearlo
    let contenedor = document.getElementById("contenedorPaginacion");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "contenedorPaginacion";
        document
            .querySelector(".reporteExInv")
            .insertAdjacentElement("afterend", contenedor);
    }
    contenedor.innerHTML = "";

    if (totalPaginas <= 1) return; // sin paginación si cabe en una página

    // Botón Anterior
    const btnAnterior = _crearBtnPagina(
        "«",
        paginaActual - 1,
        paginaActual === 1,
    );
    contenedor.appendChild(btnAnterior);

    // Números de página — máximo 5 visibles con ellipsis
    const rango = _calcularRango(paginaActual, totalPaginas);
    rango.forEach((item) => {
        if (item === "...") {
            const span = document.createElement("span");
            span.classList.add("paginacion-ellipsis");
            span.textContent = "…";
            contenedor.appendChild(span);
        } else {
            const btn = _crearBtnPagina(item, item, item === paginaActual);
            if (item === paginaActual) btn.classList.add("paginacion-activa");
            contenedor.appendChild(btn);
        }
    });

    // Botón Siguiente
    const btnSiguiente = _crearBtnPagina(
        "»",
        paginaActual + 1,
        paginaActual === totalPaginas,
    );
    contenedor.appendChild(btnSiguiente);

    // Info de página
    const info = document.createElement("span");
    info.classList.add("paginacion-info");
    info.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    contenedor.appendChild(info);
}

function _crearBtnPagina(label, pagina, deshabilitado) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.classList.add("paginacion-btn");
    btn.disabled = deshabilitado;
    if (!deshabilitado) btn.onclick = () => irAPagina(pagina);
    return btn;
}

function _calcularRango(actual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (actual <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (actual >= total - 3)
        return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", actual - 1, actual, actual + 1, "...", total];
}

// ─────────────────────────────────────────────
// HELPER — Alertas
// ─────────────────────────────────────────────
function alertInfo(texto) {
    Swal.fire({
        icon: "info",
        title: "Información",
        text: texto,
        confirmButtonColor: "#28a745",
    });
}

// ─────────────────────────────────────────────
// HELPERS COMPARTIDOS
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
    const fecha = now.toLocaleDateString("es-PA");
    const hora = now.toLocaleTimeString("es-PA");
    return { fecha, hora };
}

function _getBodega() {
    return document.getElementById("bodega")?.value?.trim() || "—";
}

// Agrupa ArrayData por marca
function _agruparPorMarca(data) {
    return data.reduce((acc, row) => {
        const marca = row.marca?.trim() || "SIN MARCA";
        if (!acc[marca]) acc[marca] = [];
        acc[marca].push(row);
        return acc;
    }, {});
}

const LINEA = "_________________";   // línea para celdas manuales

// ─────────────────────────────────────────────
// DESCARGAR EXCEL
// ─────────────────────────────────────────────
function descargarExcel() {
    const { fecha, hora } = _getFechaHora();
    const bodega = _getBodega();
    const grupos = _agruparPorMarca(ArrayDataFiltrado);

    // Filas del encabezado del documento
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
        // Cabecera de columnas
        ["Artículo", "Descripción", "Cód Barra", "Conteo", "Total",
            "Disponible", "Remitida", "Reservada", "Diferencia"]
    ];

    const filasDatos = [];

    Object.entries(grupos).forEach(([marca, articulos]) => {
        // Fila de marca
        filasDatos.push([marca, "", "", "", "", "", "", "", ""]);

        articulos.forEach(row => {
            filasDatos.push([
                row.articulo ?? "",
                row.descripcion ?? "",
                row.codBarra ?? LINEA,
                LINEA,                          // Conteo — para escribir a mano
                LINEA,                          // Total  — para escribir a mano
                parseFloat(row.disponible ?? 0).toFixed(2),
                parseFloat(row.remitida ?? 0).toFixed(2),
                parseFloat(row.reservada ?? 0).toFixed(2),
                LINEA,                          // Diferencia — para escribir a mano
            ]);
        });
    });

    // Fila de totales
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

    // Construir workbook con SheetJS
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...filasMeta, ...filasDatos]);

    // Anchos de columna
    ws["!cols"] = [
        { wch: 18 }, // Artículo
        { wch: 40 }, // Descripción
        { wch: 18 }, // Cód Barra
        { wch: 12 }, // Conteo
        { wch: 12 }, // Total
        { wch: 12 }, // Disponible
        { wch: 12 }, // Remitida
        { wch: 12 }, // Reservada
        { wch: 12 }, // Diferencia
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Existencias");
    XLSX.writeFile(wb, `Existencias_${bodega}_${fecha.replace(/\//g, "-")}.xlsx`);
}

// ─────────────────────────────────────────────
// DESCARGAR PDF
// ─────────────────────────────────────────────
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

        // Logo — esquina superior izquierda
        try {
            doc.addImage(EMPRESA.logo, "PNG", 10, 6, 22, 12);
        } catch (e) { }

        // ── Empresa — CENTRADO ──
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(EMPRESA.nombre, pW / 2, 11, { align: "center" }); // ← centrado
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(EMPRESA.direccion, pW / 2, 16, { align: "center" });
        doc.text(EMPRESA.ciudad, pW / 2, 20, { align: "center" });
        doc.text(EMPRESA.telefono, pW / 2, 24, { align: "center" });

        // Fecha / Hora / Página — derecha
        doc.setFontSize(9);
        doc.text(`Fecha  : ${fecha}`, pW - 10, 11, { align: "right" });
        doc.text(`Hora   : ${hora}`, pW - 10, 16, { align: "right" });
        doc.text(`Página : ${nPagina}`, pW - 10, 21, { align: "right" });

        // Línea separadora superior
        doc.setLineWidth(0.5);
        doc.line(10, 28, pW - 10, 28);

        // Título
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Reporte de Existencias en Inventario", pW / 2, 35, {
            align: "center",
        });

        // Subtítulos
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Por fecha de Documento. Corte: ${fecha}`, pW / 2, 42, {
            align: "center",
        });
        doc.text(`Bodega: ${bodega}.`, pW / 2, 47, { align: "center" });

        // ── Marca activa — izquierda, debajo de Bodega ──
        if (marcaActivaAlSaltar) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            doc.text(`Marca: ${marcaActivaAlSaltar}`, 10, 54);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
        }

        // Línea separadora inferior
        doc.setLineWidth(0.2);
        doc.line(10, 57, pW - 10, 57); // ← bajó 7mm para dar espacio a la marca
    }

    // ── Construir filas agrupadas por marca ──
    const body = [];

    Object.entries(grupos).forEach(([marca, articulos]) => {
        articulos.forEach((row) => {
            body.push([
                `${row.articulo ?? ""}\n${row.descripcion ?? ""}`, // ← una sola celda
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

    // Fila de totales
    const totDisponible = ArrayDataFiltrado.reduce(
        (s, r) => s + parseFloat(r.disponible ?? 0),
        0,
    );
    const totRemitida = ArrayDataFiltrado.reduce(
        (s, r) => s + parseFloat(r.remitida ?? 0),
        0,
    );
    const totReservada = ArrayDataFiltrado.reduce(
        (s, r) => s + parseFloat(r.reservada ?? 0),
        0,
    );

    body.push([
        {
            content: "TOTALES",
            colSpan: 4, // ← era 5
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

    // ── Tabla con autoTable ──
    let numeroPagina = 1;

    doc.autoTable({
        head: [
            [
                { content: "Artículo / Descripción", styles: { halign: "left" } }, // ← una sola
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
                fillColor: [126, 129, 128],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 8,
                halign: "center",
                valign: "middle",
                // minCellHeight: 12, 
            },

        columnStyles: {
            0: { cellWidth: 45, halign: "left" }, // Artículo + Descripción
            1: { cellWidth: 38, halign: "center" }, // Cód Barra
            2: { cellWidth: 14, halign: "center" }, // Conteo
            3: { cellWidth: 14, halign: "center" }, // Total
            4: { cellWidth: 14, halign: "center" }, // Disponible
            5: { cellWidth: 14, halign: "center" }, // Remitida
            6: { cellWidth: 14, halign: "center" }, // Reservada
            7: { cellWidth: 0, halign: "center" }, // Diferencia — auto
        }, // TOTAL: ~175mm ✓

      alternateRowStyles: { fillColor: [245, 245, 245] },

        didParseCell: (hookData) => {
            if (hookData.section === "body") {
                const idx = hookData.row.index;
                if (marcaPorFila[idx]) {
                    marcaActivaAlSaltar = marcaPorFila[idx];
                }
            }
        },
        didDrawPage: (hookData) => {
            _encabezado(doc, numeroPagina);
            numeroPagina++;
        },
    });

    // Reemplazar placeholder de total de páginas
    if (typeof doc.putTotalPages === "function") {
        doc.putTotalPages(totalPaginas);
    }

    doc.save(`Existencias_${bodega}_${fecha.replace(/\//g, "-")}.pdf`);
}

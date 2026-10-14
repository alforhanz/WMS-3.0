let paquetesCreadosArray = []; // Tu data del fetch
let dataOriginal = [];         // El respaldo para el buscador
let columnaOrdenada = "";      // Columna activa para el sort
let ordenAscendente = true;    // Dirección del sort


document.addEventListener("DOMContentLoaded", function () {
  console.log("Consulta de creación de Paquetes DOM cargado...");
  let documento = document.getElementById("documento");
  documento.textContent = localStorage.getItem("ConsecutivoPaquete");
  //creaJsonPrueba()

  cargarParametros();
});

function cargarParametros() {
  mostrarLoader();
  const parametros = localStorage.getItem("parametrosBusquedaPaquete");
  if (parametros) {
    const params = new URLSearchParams(parametros);
    const pSistema = params.get("pSistema") ?? "";
    const pUsuario = params.get("pUsuario") ?? "";
    const pOpcion = "D";
    const fechaIni = params.get("fechaIni") ?? "";
    const fechaFin = params.get("fechaFin") ?? "";
    const BodegaOrigen = params.get("BodegaOrigen") ?? "";
    const Aplicacion = localStorage.getItem("ConsecutivoPaquete");

    const para =
      "?pSistema=" +
      pSistema +
      "&pUsuario=" +
      pUsuario +
      "&pOpcion=" +
      pOpcion +
      "&fechaIni=" +
      fechaIni +
      "&fechaFin=" +
      fechaFin +
      "&BodegaOrigen=" +
      BodegaOrigen +
      "&Aplicacion=" +
      Aplicacion;
    enviarDatosControlador(para);
  }
}
function enviarDatosControlador(params) {
   //armarTablaResultados(paquetesCreadosArray);
  fetch(env.API_URL + "busquedadePaquetes" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        // ocultarLoader();
        paquetesCreadosArray = result.respuesta;
        dataOriginal = result.respuesta;
        if (result.respuesta.length != 0) {
            console.log("REsultados:");
            console.log(paquetesCreadosArray);
          armarTablaResultados(paquetesCreadosArray);
         
        } else {
          // ocultarLoader();
          Swal.fire({
            icon: "info",
            title: "Información",
            text: "No hay registros asignados para el usuario",
            confirmButtonColor: "#28a745",
          });
        }
        document.getElementById("carga").innerHTML = "";
      } else {
        Swal.fire({
          icon: "error",
          title: "error",
          text: "Se registro un error en la aplicación",
          confirmButtonColor: "#28a745",
        });
      }
    });
  ocultarLoader();
}
function armarTablaResultados(data, esFiltro = false) {
    if (!esFiltro) dataOriginal = data;

    const tabla = document.getElementById('tblResultados');
    const tbody = document.getElementById("tblbodyResultados");
    const txtObservaciones = document.getElementById("observaciones");
    const cantidadLabel = document.getElementById("cantidadDeRegistros");

    if (!tabla || !tbody) return;

    const tableHeadRow = tabla.querySelector("thead tr");
    tableHeadRow.innerHTML = "";
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        if (cantidadLabel) cantidadLabel.textContent = "Registros: 0";
        if (txtObservaciones) txtObservaciones.value = "";
        return;
    }

    cantidadLabel.textContent = "Registros: " + data.length;

    // --- 1. LÓGICA DE OBSERVACIONES (Mantenemos tu lógica de unicidad) ---
    if (txtObservaciones) {
        const refsFiltradas = data
            .map(item => (item.REFERENCIA || item.referencia || "").toString().trim())
            .filter(val => val !== "" && val.toLowerCase() !== "comentario" && val.toLowerCase() !== "null");
        const refsUnicas = [...new Set(refsFiltradas)];
        txtObservaciones.value = refsUnicas.join(" | ");
        M.textareaAutoResize(txtObservaciones);
        M.updateTextFields();
    }

    // --- 2. FILTRAR COLUMNAS ---
    // Excluimos REFERENCIA y DESCRIPCION (porque la descripción irá dentro de ARTICULO)
    const columnas = Object.keys(data[0]).filter(col => {
        const c = col.toUpperCase();
        return c !== "REFERENCIA" && c !== "DESCRIPCION";
    });

    // --- 3. CONSTRUIR ENCABEZADOS ---
    columnas.forEach(columna => {
        const th = document.createElement("th");
        th.className = "lineasocstyle";
        th.style.cursor = "pointer";
        
        let indicador = (columna === columnaOrdenada) ? (ordenAscendente ? " 🔼" : " 🔽") : "";
        
        // Si la columna es ARTICULO, le ponemos un nombre más descriptivo
        if (columna.toUpperCase() === "ARTICULO") {
            th.textContent = "ARTÍCULO / DESCRIPCIÓN" + indicador;
        } else {
            th.textContent = columna.replace(/_/g, " ").toUpperCase() + indicador;
        }

        th.onclick = () => {
            ordenAscendente = (columnaOrdenada === columna) ? !ordenAscendente : true;
            columnaOrdenada = columna;
            
            const dataOrdenada = [...data].sort((a, b) => {
                let valA = a[columna] ?? "";
                let valB = b[columna] ?? "";
                if (!isNaN(valA) && !isNaN(valB) && valA !== "" && valB !== "") {
                    return ordenAscendente ? valA - valB : valB - valA;
                }
                return ordenAscendente ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
            });
            armarTablaResultados(dataOrdenada, true);
        };
        tableHeadRow.appendChild(th);
    });

    // --- 4. CONSTRUIR CUERPO DE LA TABLA ---
    data.forEach((item) => {
        const row = document.createElement("tr");
        row.onclick = () => {
            const idRef = item.TRASLADO || item.CONTENEDOR || "";
            if (idRef) irAlDetalle(idRef);
        };

        columnas.forEach(columna => {
            const td = document.createElement("td");
            td.className = "resultados-Tabla";

            if (columna.toUpperCase() === "ARTICULO") {
                // --- CONCATENACIÓN ARTÍCULO Y DESCRIPCIÓN ---
                const codigo = item[columna] ?? "";
                const descripcion = item["DESCRIPCION"] || item["descripcion"] || "";
                
                // Usamos innerHTML para insertar el salto de línea <br>
                td.innerHTML = `<strong>${codigo}</strong><br><span style="font-size: 0.85em; color: #555;">${descripcion}</span>`;
                td.style.textAlign = "left"; // Opcional: mejor lectura para descripciones largas
            } else {
                let valor = item[columna] ?? "";
                td.textContent = valor;

                // Resaltar diferencias
                if (columna.toUpperCase().includes("DIF")) {
                    const num = parseFloat(valor);
                    if (num < 0) td.style.color = "red";
                    else if (num > 0) td.style.color = "green";
                    if (num !== 0) td.style.fontWeight = "bold";
                }
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    armaTotales(data, columnas);
}

/**
 * Calcula y renderiza la fila de totales dinámicamente para columnas específicas
 * @param {Array} data - El JSON con los datos
 * @param {Array} columnas - Las columnas que se están mostrando (sin REFERENCIA)
 */
function armaTotales(data, columnas) {
    const tabla = document.getElementById('tblResultados');
    if (!tabla) return;

    // 1. Eliminar tfoot si ya existe para evitar duplicados
    let tfoot = tabla.querySelector("tfoot");
    if (tfoot) tfoot.remove();

    tfoot = document.createElement("tfoot");
    const row = document.createElement("tr");
    
    // Estilo para resaltar la fila de totales
    row.style.backgroundColor = "#86bfc4ff"; // Un verde muy claro (Materialize teal lighten-5)
    row.style.fontWeight = "bold";
    row.style.borderTop = "2px solid #26a69a";   

    // 2. Definir las columnas exactas que queremos sumar
    const columnasASumar = ["CANT_PREPARADA", "CANT_SOLICITADA", "CANT_VERIFICADA", "DIFERENCIA", "DIF"];

    columnas.forEach((columna, index) => {
        const td = document.createElement("td");
        td.className = "resultados-Tabla";
         td.style.fontSize = "16px";

        // Verificamos si la columna actual está en nuestra lista de permitidas
        const nombreCol = columna.toUpperCase();
        const debeSumar = columnasASumar.some(c => c.toUpperCase() === nombreCol);

        if (debeSumar) {
            const total = data.reduce((acc, item) => {
                const val = parseFloat(item[columna]) || 0;
                return acc + val;
            }, 0);
            
            // Si el total tiene decimales, podrías usar .toFixed(2), si no, dejarlo así
            td.textContent = Number.isInteger(total) ? total : total.toFixed(2);
        } else {
            // En la primera columna ponemos la etiqueta "TOTALES"
            if (index === 0) {
                td.textContent = "TOTALES";
                td.style.textAlign = "left";
                td.style.paddingLeft = "15px";
               
            } else {
                td.textContent = "";
            }

        }
        row.appendChild(td);
    });

    tfoot.appendChild(row);
    tabla.appendChild(tfoot);
}

async function imprimirPaqueteReporte() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "pt");

  const marginX = 40;
  let currentY = 40;

  const pPaquete = localStorage.getItem("ConsecutivoPaquete") || "N/D";
  const fecha = new Date();
  const fechaStr = fecha.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" });
  const horaStr = fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const fechaCompleta = `Fecha: ${fechaStr}  ${horaStr}`;
  const pageWidth = doc.internal.pageSize.width;

  // --- ENCABEZADOS DEL DOCUMENTO ---
  doc.setFont("helvetica", "normal").setFontSize(9);
  const fechaWidth = doc.getTextWidth(fechaCompleta);
  doc.text(fechaCompleta, pageWidth - fechaWidth - marginX, currentY);

  currentY += 25;
  doc.setFont("helvetica", "bold").setFontSize(16);
  doc.text("CENTRAL DE LUBRICANTES", pageWidth / 2, currentY, { align: "center" });

  currentY += 25;
  doc.setFontSize(14);
  doc.text("REPORTE DE DETALLE DE PAQUETE", pageWidth / 2, currentY, { align: "center" });

  currentY += 20;
  doc.setFontSize(12);
  doc.text(`N° de Traslado: ${pPaquete}`, pageWidth / 2, currentY, { align: "center" });

  // --- PREPARACIÓN DE DATOS Y CÁLCULO DE TOTALES ---
  const dataParaReporte = packagesDataForPDF();
  
  // Variables para acumular totales
  let totalSol = 0, totalPrep = 0, totalVer = 0, totalDif = 0;

  const rows = dataParaReporte.map(item => {
    const sol = parseFloat(item.CANT_SOLICITADA) || 0;
    const prep = parseFloat(item.CANT_PREPARADA) || 0;
    const ver = parseFloat(item.CANT_VERIFICADA) || 0;
    const dif = parseFloat(item.DIFERENCIA) || 0;

    totalSol += sol;
    totalPrep += prep;
    totalVer += ver;
    totalDif += dif;

    return [
      `${item.ARTICULO}\n${item.DESCRIPCION || ""}`,
      sol,
      prep,
      ver,
      dif
    ];
  });

  // --- CONFIGURACIÓN DE LA TABLA ---
  doc.autoTable({
    head: [["ARTÍCULO / DESCRIPCIÓN", "SOLICITADA", "PREPARADA", "VERIFICADA", "DIFERENCIA"]],
    body: rows,
    // AGREGAMOS EL PIE DE TABLA (FOOTER)
    foot: [[
      "TOTALES", 
      totalSol.toFixed(totalSol % 1 === 0 ? 0 : 2), 
      totalPrep.toFixed(totalPrep % 1 === 0 ? 0 : 2), 
      totalVer.toFixed(totalVer % 1 === 0 ? 0 : 2), 
      totalDif.toFixed(totalDif % 1 === 0 ? 0 : 2)
    ]],
    startY: currentY + 30,
    theme: 'grid',
    styles: { fontSize: 8, halign: "center", valign: "middle" },
    headStyles: { fillColor: [63, 81, 181], textColor: [255, 255, 255], fontStyle: 'bold' },
    // Estilo para la fila de totales
    footStyles: { fillColor: [224, 242, 241], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { halign: 'left', cellWidth: 220 } 
    }
  });

  // --- OBSERVACIONES ---
  const finalY = doc.lastAutoTable.finalY + 30;
  const obsText = document.getElementById("observaciones")?.value || "Sin observaciones";
  
  doc.setFontSize(10).setFont("helvetica", "bold");
  doc.text("Observaciones:", marginX, finalY);
  
  doc.setFont("helvetica", "normal").setFontSize(9);
  const splitObs = doc.splitTextToSize(obsText, pageWidth - (marginX * 2));
  doc.text(splitObs, marginX, finalY + 15);

  // --- PIE DE PÁGINA ---
  doc.setTextColor(100);
  doc.text("Documento generado automáticamente por el sistema WMS", marginX, doc.internal.pageSize.height - 20);

  const nombreArchivo = `Reporte_Detalle_${pPaquete}_${fechaStr.replace(/\//g, "-")}.pdf`;
  doc.save(nombreArchivo);
}
function exportarExcelPaquete() {
    const pPaquete = localStorage.getItem("ConsecutivoPaquete") || "N/D";
    // Usamos dataOriginal para asegurar que tenemos todas las propiedades (incluso REFERENCIA)
    const dataParaExcel = (typeof dataOriginal !== 'undefined' && dataOriginal.length > 0) ? dataOriginal : [];

    if (dataParaExcel.length === 0) {
        Swal.fire("Error", "No hay datos para exportar", "error");
        return;
    }

    // 1. Obtener todas las llaves (columnas) presentes en el primer objeto
    const todasLasColumnas = Object.keys(dataParaExcel[0]);

    // 2. Preparar los datos y calcular totales dinámicamente
    // Solo sumaremos las columnas que definimos previamente como numéricas
    const columnasASumar = ["CANT_PREPARADA", "CANT_SOLICITADA", "CANT_VERIFICADA", "DIFERENCIA", "DIF"];
    let totales = {};

    // Inicializar el objeto de totales con vacíos
    todasLasColumnas.forEach(col => totales[col] = "");

    const filas = dataParaExcel.map(item => {
        let filaModificada = { ...item }; // Copia el objeto original
        
        columnasASumar.forEach(col => {
            // Buscamos la columna (ignorando mayúsculas/minúsculas)
            const nombreReal = todasLasColumnas.find(c => c.toUpperCase() === col);
            if (nombreReal) {
                const valor = parseFloat(item[nombreReal]) || 0;
                totales[nombreReal] = (parseFloat(totales[nombreReal]) || 0) + valor;
            }
        });
        return filaModificada;
    });

    // 3. Formatear la fila de totales
    const primeraColumna = todasLasColumnas[0];
    totales[primeraColumna] = "TOTALES";

    // 4. Agregar la fila de totales al final del array
    filas.push(totales);

    // 5. Crear el libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas);

    // 6. Formatear encabezados (opcional: poner en mayúsculas y quitar guiones bajos)
    // Esto es automático con json_to_sheet, pero podrías personalizarlo.

    // 7. Auto-ajustar el ancho de las columnas basado en el contenido
    const wscols = todasLasColumnas.map(col => ({
        wch: Math.max(col.length, 12) // Mínimo 12 caracteres de ancho
    }));
    ws['!cols'] = wscols;

    // 8. Añadir la hoja y descargar
    XLSX.utils.book_append_sheet(wb, ws, "Datos Completos");
    
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Detalle_Completo_Paquete_${pPaquete}_${fecha}.xlsx`);
}


function packagesDataForPDF() {
    // Si tienes un buscador, aquí deberías retornar la data que el usuario está viendo.
    // Si no, retornamos el array global.
    return typeof dataOriginal !== 'undefined' && dataOriginal.length > 0 ? dataOriginal : [];
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblResultados");
  const resultadoPaginador = document.getElementById("resultadoPaginador");
  const totalRegistros = document.getElementById("cantidadDeRegistros");

  // Limpiar el contenido del paginador si existe
  if (resultadoPaginador) {
    resultadoPaginador.innerHTML = "";
  }

  // Limpiar el contenido de totalRegistros si existe
  if (totalRegistros) {
    totalRegistros.innerHTML = "";
  }

  // Limpiar el contenido del tbody de la tabla si la tabla existe
  if (tabla) {
    let tbody = tabla.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = "";
    }
  }
  localStorage.removeItem("SearchParameterFlag");
  localStorage.removeItem("parametrosBusquedaPaquete");
}

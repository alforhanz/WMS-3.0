var datosResumen = [];

document.addEventListener("DOMContentLoaded", function () {
  let hUser = document.getElementById("hUsuario");
  let usuario = hUser ? hUser.value : "";
  console.log("hUsuario:", usuario);

  fechasDeInventario();
});

function validarCodigoBarras(input) {
  const codBarra = input.value.toUpperCase().trim();
  const filaActual = input.closest("tr");
  const celdaArticulo = filaActual.cells[0].querySelector("span");
  const cantLeidaInput = filaActual.cells[2].querySelector("input");

  if (codBarra) {
    const params = "?pCodigoLectura=" + encodeURIComponent(codBarra);
    fetch(env.API_URL + "wmsverificacodigo" + params, myInit)
      .then((response) => response.json())
      .then((result) => {
        if (result.codigo && result.codigo[0]?.CodigoArticulo !== "ND") {
          celdaArticulo.textContent = result.codigo[0].CodigoArticulo;

          let cantidadActual = parseInt(cantLeidaInput.value, 10) || 0;
          cantLeidaInput.value = cantidadActual + 1;

          input.setAttribute("readonly", "readonly");

          crearNuevaFila();
          guardarTablaEnArray();
        } else {
          Swal.fire({
            icon: "warning",
            title: "Código no válido",
            text: "El código ingresado no existe en el catálogo. Verifíquelo nuevamente.",
            confirmButtonText: "Cerrar",
            confirmButtonColor: "#28a745"
          });
          input.value = "";
        }
      })
      .catch((err) => {
        console.error("Error al validar código:", err);
      });
  }
}

function crearNuevaFila() {
  const tableBody = document.querySelector("#tblbodyLectura");
  if (!tableBody) return;
  const uniqueId = Date.now();

  const nuevaFilaHTML = `<tr>
    <td class="cell-center" style="user-select: none;">
      <span style="font-weight: 600; color: #1e293b;"></span>
    </td>
    <td>
      <input type="text" id="codigo-barras-${uniqueId}" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus autocomplete="off">
    </td>
    <td>
      <input id="cant-leida-${uniqueId}" type="text" class="codigo-barras-input" value="" onchange="validarCantidades(this)" autocomplete="off">
    </td>
    <td class="cell-center">
      <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFila(this)">delete</i>
    </td>
  </tr>`;

  tableBody.insertAdjacentHTML("beforeend", nuevaFilaHTML);

  const nuevoCodigoBarrasInput = tableBody.querySelector(`#codigo-barras-${uniqueId}`);
  if (nuevoCodigoBarrasInput) {
    nuevoCodigoBarrasInput.focus();
  }
}

function validarCantidades() {
  guardarTablaEnArray();
}

function guardarTablaEnArray() {
  var dataArray = [];
  var table = document.getElementById("myTableLectura");
  if (!table) return [];

  var rows = table.getElementsByTagName("tr");

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row.cells.length < 3) continue;

    var spanArticulo = row.cells[0].querySelector("span");
    var articulo = spanArticulo ? spanArticulo.textContent.trim() : "";

    var codigoBarraInput = row.cells[1].querySelector("input");
    var cantidadLeidaInput = row.cells[2].querySelector("input");

    if (!codigoBarraInput || !cantidadLeidaInput) continue;

    var codigoBarra = codigoBarraInput.value.trim();
    var cantidadLeida = parseFloat(cantidadLeidaInput.value);

    if (articulo !== "" && !isNaN(cantidadLeida)) {
      dataArray.push({
        ARTICULO: articulo,
        CODIGO_BARRA: codigoBarra,
        CANTIDAD_LEIDA: cantidadLeida
      });
    }
  }

  localStorage.setItem("dataArray", JSON.stringify(dataArray));
  agrupar();
  return dataArray;
}

function agrupar() {
  var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  var cantidadesConsolidadas = {};

  dataArray.forEach(function (item) {
    let articulo = item.ARTICULO;
    let codBarra = item.CODIGO_BARRA;
    let cantidad = item.CANTIDAD_LEIDA;

    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      cantidadesConsolidadas[articulo].CANTIDAD_LEIDA += cantidad;
    } else {
      cantidadesConsolidadas[articulo] = {
        CODIGO_BARRA: codBarra,
        CANTIDAD_LEIDA: cantidad
      };
    }
  });

  var newArray = [];
  for (var articulo in cantidadesConsolidadas) {
    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      newArray.push({
        ARTICULO: articulo,
        CODIGO_BARRA: cantidadesConsolidadas[articulo].CODIGO_BARRA,
        CANTIDAD_LEIDA: cantidadesConsolidadas[articulo].CANTIDAD_LEIDA
      });
    }
  }

  localStorage.setItem("dataArray", JSON.stringify(newArray));
}

function eliminarFila(icon) {
  var row = icon.closest("tr");

  Swal.fire({
    title: "¿Estás seguro?",
    text: "Se eliminará esta línea de la lectura de inventario.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Sí, eliminar"
  }).then((result) => {
    if (result.isConfirmed) {
      var isEmptyRow = true;
      var inputs = row.querySelectorAll("input");
      inputs.forEach(function (cell) {
        if (cell.value.trim() !== "") isEmptyRow = false;
      });

      if (isEmptyRow) {
        guardarTablaEnArray();
        Swal.fire({
          icon: "warning",
          title: "Línea vacía",
          text: "No es necesario eliminar una fila sin lecturas.",
          confirmButtonText: "Cerrar",
          confirmButtonColor: "#28a745"
        });
      } else {
        row.remove();
        const tableBody = document.querySelector("#tblbodyLectura");
        if (tableBody && tableBody.lastElementChild) {
          const ultimoInput = tableBody.lastElementChild.cells[1].querySelector("input");
          if (ultimoInput) ultimoInput.focus();
        }
        guardarTablaEnArray();
      }
    }
  });
}

// =============================================================================
// PESTAÑA RESUMEN
// =============================================================================
// Alias de compatibilidad para evitar ReferenceError si el botón llama a resumenGeneral
window.resumenGeneral = function() {
  resumen();
};

async function resumen() {
  let btnFinalizar = document.getElementById("btnFinalizar");
  let btnGuardaConteo = document.getElementById("btnGuardaConteo");

  if (btnFinalizar) btnFinalizar.hidden = false;
  if (btnGuardaConteo) btnGuardaConteo.hidden = true;

  const tablaResumen = document.getElementById("myTableresumen");
  const tblBodyResumen = document.getElementById("tblbodyRersumen");
  const labelCantidadRegistros = document.getElementById("cantidadDeRegistros");
  if (!tablaResumen || !tblBodyResumen) return;

  tblBodyResumen.innerHTML = "";

  const thead = tablaResumen.querySelector("thead");
  thead.innerHTML = `
    <tr>
      <th style="width: 36%; text-align: left;">Artículo</th>
      <th style="width: 24%;">Código</th>
      <th style="width: 14%;">Cant.</th>
      <th style="width: 16%;">Ubicación</th>
      <th style="width: 10%;">Acción</th>
    </tr>
  `;

  try {
    const pSistema = "WMS";
    const hUser = document.getElementById("hUsuario");
    const pUsuario = hUser ? hUser.value : "";
    const pOpcion = "D";
    const pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
    const pFecha = document.getElementById("fecha_ini") ? document.getElementById("fecha_ini").value : "";
    const pSoloContados = "S";
    const params = `?pSistema=${pSistema}&pUsuario=${pUsuario}&pOpcion=${pOpcion}&pBodega=${pBodega}&pFecha=${pFecha}&pSoloContados=${pSoloContados}`;

    if (typeof mostrarLoader === "function") mostrarLoader("Cargando resumen de inventario...");

    const response = await fetch(env.API_URL + "wmsresumeninventario" + params, myInit);
    if (!response.ok) throw new Error(`Error en la solicitud: ${response.status}`);

    const result = await response.json();
    if (result.msg === "SUCCESS") {
      datosResumen = result.resumen || [];
      if (labelCantidadRegistros) {
        labelCantidadRegistros.textContent = `Cantidad de registros: ${datosResumen.length}`;
      }

      renderizarDatosResumen(datosResumen);
      inicializarBotonesDescarga();
    } else {
      mostrarMensajeError("No se encontraron registros contados para esta fecha.", 5);
      if (labelCantidadRegistros) labelCantidadRegistros.textContent = "Cantidad de registros: 0";
    }
  } catch (error) {
    console.error("Error al cargar resumen:", error);
    mostrarMensajeError("Hubo un error al cargar los datos del inventario.", 5);
    if (labelCantidadRegistros) labelCantidadRegistros.textContent = "Cantidad de registros: 0";
  } finally {
    if (typeof ocultarLoader === "function") ocultarLoader();
  }

  function renderizarDatosResumen(datos) {
    tblBodyResumen.innerHTML = "";

    datos.forEach((dato) => {
      let estiloConciliado = dato.CONCILIADO === "N" ? 'style="color: #ea580c; font-weight: 700;"' : "";

      let filaHTML = `
        <tr ${estiloConciliado}>
          <td style="text-align: left;">
            <div class="cell-articulo-box">
              <span class="cell-articulo-code" style="color: #0284c7;">${dato.ARTICULO || "N/A"}</span>
              <span class="cell-articulo-desc">${dato.DESCRIPCION || "N/A"}</span>
            </div>
          </td>
          <td class="cell-center">${dato.BARCODEQR || "N/A"}</td>
          <td class="cell-number">${parseFloat(dato.CONTEO || 0).toFixed(2)}</td>
          <td class="cell-center" style="text-transform: uppercase;">${dato.UBICACION || "N/A"}</td>
          <td class="cell-center">
            <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFilaResumen(this)">delete</i>
          </td>
        </tr>
      `;
      tblBodyResumen.insertAdjacentHTML("beforeend", filaHTML);
    });

    // Paginación con el nuevo plugin de selector desplegable
    const contenedorPaginador = $("#pagination");
    contenedorPaginador.empty();

    if ($.fn.pageMe) {
      $("#myTableresumen tbody").pageMe({
        pagerSelector: "#pagination",
        perPage: typeof xPag !== "undefined" ? xPag : 20
      });
    }
  }

  function mostrarMensajeError(mensaje, columnas) {
    tblBodyResumen.innerHTML = `<tr><td colspan="${columnas}" class="cell-center" style="padding: 20px; color: #64748b;">${mensaje}</td></tr>`;
  }
}

// =============================================================================
// GUARDADO Y FINALIZACIÓN
// =============================================================================
function confirmarGuardadoParcialLectura() {
  const tabla = document.getElementById("myTableLectura");
  const fechaInv = document.getElementById("fecha_ini") ? document.getElementById("fecha_ini").value : "";

  if (tabla && tabla.rows.length > 2 && fechaInv.length > 0) {
    Swal.fire({
      icon: "info",
      title: "¿Desea guardar el conteo actual?",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0284c7"
    }).then((result) => {
      if (result.isConfirmed) {
        guardaParcialMenteLectura();
      }
    });
  } else {
    Swal.fire({
      icon: "warning",
      title: "Lecturas pendientes",
      text: "Debe realizar al menos una lectura válida y verificar la fecha de inventario.",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#28a745"
    });
  }
}

function guardaParcialMenteLectura() {
  const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];

  if (dataArray.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Sin datos",
      text: "No hay lecturas registradas para guardar.",
      confirmButtonColor: "#28a745"
    });
    return;
  }

  const hUser = document.getElementById("hUsuario");
  const pUsuario = hUser ? hUser.value : "";
  const pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  const pEstado = "G";
  const pFecha = document.getElementById("fecha_ini").value;
  const pUbicacion = document.getElementById("ubicacion").value.trim();
  const chunkSize = 50;
  const totalChunks = Math.ceil(dataArray.length / chunkSize);

  if (typeof mostrarLoader === "function") mostrarLoader("Guardando conteo físico...");

  let promesas = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunk = dataArray.slice(i * chunkSize, (i + 1) * chunkSize);
    const params = `?pUsuario=${pUsuario}&pBodega=${pBodega}&pEstado=${pEstado}&pFecha=${pFecha}&jsonDetalles=${encodeURIComponent(
      JSON.stringify(chunk)
    )}&pUbicacion=${encodeURIComponent(pUbicacion)}`;

    promesas.push(
      fetch(env.API_URL + "wmsguardaconteoinv/I" + params, myInit)
        .then((res) => res.json())
    );
  }

  Promise.all(promesas)
    .then((resultados) => {
      let fallos = resultados.some((r) => r.msg !== "SUCCESS");
      if (!fallos) {
        Swal.fire({
          icon: "success",
          title: "Conteo Guardado",
          text: "Los registros se guardaron correctamente.",
          confirmButtonColor: "#28a745"
        });
        limpiarResultadoGeneral();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error de guardado",
          text: "Algunos lotes de lectura no se pudieron registrar.",
          confirmButtonColor: "#ef4444"
        });
      }
    })
    .catch((err) => {
      console.error("Error al guardar conteo:", err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "Ocurrió un error al enviar las lecturas.",
        confirmButtonColor: "#ef4444"
      });
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function confirmaFinalizar() {
  Swal.fire({
    icon: "warning",
    title: "¿Desea finalizar el conteo del inventario?",
    text: "Esta acción consolidará los datos para el cierre.",
    showCancelButton: true,
    confirmButtonText: "Finalizar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881"
  }).then((result) => {
    if (result.isConfirmed) {
      finalizaConteoInventario();
    }
  });
}

function finalizaConteoInventario() {
  if (!datosResumen || datosResumen.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Sin registros",
      text: "No hay datos en el resumen para finalizar.",
      confirmButtonColor: "#28a745"
    });
    return;
  }

  const hUser = document.getElementById("hUsuario");
  const pUsuario = hUser ? hUser.value : "";
  const pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  const pEstado = "P";
  const pFecha = document.getElementById("fecha_ini").value;
  const pUbicacion = document.getElementById("ubicacion").value.trim();
  const chunkSize = 50;
  const totalChunks = Math.ceil(datosResumen.length / chunkSize);

  if (typeof mostrarLoader === "function") mostrarLoader("Finalizando inventario...");

  let promesas = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunk = datosResumen.slice(i * chunkSize, (i + 1) * chunkSize);
    const params = `?pUsuario=${pUsuario}&pBodega=${pBodega}&pEstado=${pEstado}&pFecha=${pFecha}&jsonDetalles=${encodeURIComponent(
      JSON.stringify(chunk)
    )}&pUbicacion=${encodeURIComponent(pUbicacion)}`;

    promesas.push(
      fetch(env.API_URL + "wmsguardaconteoinv/I" + params, myInit)
        .then((res) => res.json())
    );
  }

  Promise.all(promesas)
    .then((resultados) => {
      let fallos = resultados.some((r) => r.msg !== "SUCCESS");
      if (!fallos) {
        Swal.fire({
          icon: "success",
          title: "Inventario Finalizado",
          text: "El inventario ha sido procesado y finalizado exitosamente.",
          confirmButtonColor: "#28a745"
        }).then(() => {
          limpiarResultadoGeneral();
          resumen();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error al finalizar",
          text: "No se pudieron procesar todos los lotes de cierre.",
          confirmButtonColor: "#ef4444"
        });
      }
    })
    .catch((err) => {
      console.error("Error al finalizar inventario:", err);
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function limpiarResultadoGeneral() {
  const tbody = document.getElementById("tblbodyLectura");
  if (tbody) {
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
  }

  const ubicacion = document.getElementById("ubicacion");
  if (ubicacion) ubicacion.value = "";

  localStorage.removeItem("dataArray");
  crearNuevaFila();
}

function activabtnguardar() {
  let btnFinalizar = document.getElementById("btnFinalizar");
  let btnGuardaConteo = document.getElementById("btnGuardaConteo");
  const paginacion = document.getElementById("pagination");

  if (paginacion) paginacion.innerHTML = "";
  if (btnFinalizar) btnFinalizar.hidden = true;
  if (btnGuardaConteo) btnGuardaConteo.hidden = false;
}

function fechasDeInventario() {
  const bodegaInput = document.getElementById("bodega");
  const pBodega = bodegaInput ? bodegaInput.value : "";
  const params = `?pBodega=${pBodega}`;

  fetch(env.API_URL + "wmsfechainventario" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      const resultado = result.fechainv || [];
      const fechaSelect = document.getElementById("fecha_ini");
      if (!fechaSelect) return;

      fechaSelect.innerHTML = '<option value="" disabled selected>Selecciona una fecha</option>';

      if (resultado.length > 0) {
        resultado.forEach((item) => {
          const option = document.createElement("option");
          const fechaFormateada = item.fecha.split(" ")[0];
          option.value = fechaFormateada;
          option.textContent = fechaFormateada;
          fechaSelect.appendChild(option);
        });
      } else {
        Swal.fire({
          title: "Sin fechas programadas",
          text: "No hay fechas de inventario programadas para esta bodega.",
          confirmButtonText: "Cerrar",
          confirmButtonColor: "#28a745",
          icon: "warning"
        });
      }
    })
    .catch((error) => console.error("Error al cargar fechas de inventario:", error));
}

function eliminarFilaResumen(icon) {
  let hUser = document.getElementById("hUsuario");
  let usuario = hUser ? hUser.value : "";
  let bodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let fechaSelect = document.getElementById("fecha_ini").value;
  let row = icon.closest("tr");
  let celsConten = row.getElementsByTagName("td");

  let celdaArticulo = row.getElementsByTagName("td")[0];
  let articulo = celdaArticulo.querySelector(".cell-articulo-code")?.innerText.trim() || "";
  let cantidad = parseFloat(celsConten[2].innerText.trim()) || 0;
  let ubicacion = celsConten[3].innerText.trim();

  let filaDatos = {
    articulo: articulo,
    cantidad: cantidad,
    ubicacion: ubicacion
  };

  Swal.fire({
    title: "¿Estás seguro?",
    text: "Se eliminará esta línea del resumen de inventario.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Sí, eliminar"
  }).then((result) => {
    if (result.isConfirmed) {
      row.remove();

      const params = `?pUsuario=${usuario}&pBodega=${bodega}&pFecha=${fechaSelect}&jsonDetalles=${encodeURIComponent(
        JSON.stringify(filaDatos)
      )}`;

      fetch(env.API_URL + "wmseliminadatosinventario" + params, myInit)
        .then((response) => response.json())
        .then((res) => {
          if (res.msg === "SUCCESS") {
            Swal.fire({
              icon: "success",
              title: "Línea eliminada",
              confirmButtonText: "Cerrar",
              confirmButtonColor: "#28a745"
            });
            resumen();
          }
        });
    }
  });
}

// =============================================================================
// DESCARGA DE REPORTES (EXCEL / PDF)
// =============================================================================
function inicializarBotonesDescarga() {
  const btnExcel = document.getElementById("btnDescargarExcel");
  const btnPDF = document.getElementById("btnDescargarPDF");

  if (btnExcel) btnExcel.hidden = !(datosResumen && datosResumen.length > 0);
  if (btnPDF) btnPDF.hidden = !(datosResumen && datosResumen.length > 0);
}

function resumen_descargarExcel() {
  const jsonData = obtenerDatosTabla();
  if (jsonData.length === 0) return;

  const encabezado = ["Artículo", "Código de Barra", "Descripción", "Cantidad", "Ubicación"];

  const worksheetData = [
    encabezado,
    ...jsonData.map((item) => [
      item.ARTICULO || "",
      item.BARCODEQR || "",
      item.DESCRIPCION || "",
      parseFloat(item.CONTEO) || 0,
      item.UBICACION || ""
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Conteo");
  XLSX.writeFile(workbook, "Resumen_Conteo_Inventario.xlsx");
}

function resumen_descargarPDF() {
  const jsonData = obtenerDatosTabla();
  if (jsonData.length === 0) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("P", "pt", "a4");

  const titulo = "REPORTE DE CONTEO DE INVENTARIO";
  const pBodega = document.getElementById("bodega-sucursal")?.textContent || "";
  const fechaInventario = document.getElementById("fecha_ini")?.value || "";

  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Sucursal: ${pBodega} | Fecha Inventario: ${fechaInventario}`, 40, 65);

  const columnas = [
    "ARTÍCULO",
    "CÓDIGO BARRA",
    "DESCRIPCIÓN",
    "CANTIDAD",
    "UBICACIÓN"
  ];

  const filas = jsonData.map((item) => [
    item.ARTICULO || "",
    item.BARCODEQR || "",
    item.DESCRIPCION || "",
    parseFloat(item.CONTEO || 0).toFixed(2),
    item.UBICACION || ""
  ]);

  doc.autoTable({
    head: [columnas],
    body: filas,
    startY: 85,
    styles: { fontSize: 8, cellWidth: "wrap" },
    headStyles: { fillColor: [27, 103, 107] },
    columnStyles: { 3: { halign: "right" } }
  });

  doc.save("Resumen_Conteo_Inventario.pdf");
}

function obtenerDatosTabla() {
  return Array.isArray(datosResumen) ? datosResumen : [];
}

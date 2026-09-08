  ////////////////////////////////////////////////////
 ////         VARIABLES GROBALES              ///////
////////////////////////////////////////////////////
window.ArrayData = window.ArrayData || [];
window.ArrayDataFiltrado = window.ArrayDataFiltrado || [];
window.xPag = 10;
  ////////////////////////////////////////////////////
 ////             DOM                         ///////
////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  const busquedaPrevia = localStorage.getItem("parametrosBusqueda");
  if(busquedaPrevia){
    console.log("hay busqueda previa..")
    const params = new URLSearchParams(busquedaPrevia);
     const pModulo= params.get("pModulo") ?? "";
     const pOpcion= params.get("pOpcion") ?? "";
     const typeRpt= params.get("typeRpt") ?? "";
     const fechaIni= params.get("fechaIni") ?? "";
     const fechaFin= params.get("fechaFin") ?? "";
     const bodegaOrigen= params.get("BodegaOrigen") ?? "";
     if(pOpcion==="E"){
          document.getElementById("trasladosSwitch").checked=false;
        }else{
          document.getElementById("trasladosSwitch").checked=true;
        }
      if (fechaIni) document.getElementById("fecha_ini").value = fechaIni;
      if (fechaFin) document.getElementById("fecha_fin").value = fechaFin;
      const parametros = `?pModulo=${pModulo}&pOpcion=${pOpcion}&typeRpt=${typeRpt}&fechaIni=${fechaIni}&fechaFin=${fechaFin}&BodegaOrigen=${bodegaOrigen}`;
      consultaAPI(parametros);

  }else{
          const hoy = new Date().toISOString().split("T")[0];
          const inputIni = document.getElementById("fecha_ini");
          const inputFin = document.getElementById("fecha_fin");
          //inputIni.value = "2026-01-01"; // Valor de prueba
          if (!inputIni.value) inputIni.value = hoy;
          if (!inputFin.value) inputFin.value = hoy;
          M.updateTextFields();
          M.Datepicker.init(document.querySelectorAll('.datepicker'), {
            format: 'yyyy-mm-dd',
            autoClose: true
          });
          const switchTipo = document.getElementById("trasladosSwitch");
          switchTipo.addEventListener("change", function () {
            limpiarResultadoGeneral();
          });   
          const switchProcesados = document.getElementById("toggleSwitch");
          switchProcesados.addEventListener("change", function () {
            verTrasladosLista();
          });         
          cargaInicialTraslados();
      }
});

  ////////////////////////////////////////////////////
 ////         CARGA INICIAL                   ///////
////////////////////////////////////////////////////
function cargaInicialTraslados() {
  const bodegaOrigen = document.getElementById("bodega")?.value || "";

  if (!bodegaOrigen) {
    console.warn("Bodega no seleccionada en carga inicial.");
    return;
  }

  const pFechaHasta = document.getElementById("fecha_fin").value;
  const pFechaDesde = document.getElementById("fecha_ini").value;
  const pModulo = "WMS_VT";
  const trasladosProcesados = document.getElementById("toggleSwitch").checked;
  const typeRpt = trasladosProcesados ? "R" : "TP";
  const pOpcion = ""; // Vacío para traer ambos tipos

  const params = `?pModulo=${pModulo}&pOpcion=${pOpcion}&typeRpt=${typeRpt}&fechaIni=${pFechaDesde}&fechaFin=${pFechaHasta}&BodegaOrigen=${bodegaOrigen}`;
  
  mostrarLoader();
  fetch(env.API_URL + "wmsverificaciontraslados/E" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      ocultarLoader();
      if (result.msg === "SUCCESS") {
        ArrayData = result.traslados || [];
        console.log("=== CARGA INICIAL COMPLETA (ArrayData) ===", ArrayData);
        actualizarBadgesConteo(ArrayData);
        //limpiarResultadoGeneral(); // La tabla se mantiene oculta/limpia
      }
    })
    .catch((error) => {
      ocultarLoader();
      console.error("Error en carga inicial:", error);
    });
}
  ////////////////////////////////////////////////////
 ////         CARGA MANUAL                    ///////
////////////////////////////////////////////////////
function verTrasladosLista() {
  const bodegaOrigen = document.getElementById("bodega")?.value || "";

  if (!bodegaOrigen) {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor, seleccione su bodega de origen.",
    });
    return false;
  }

  const pFechaHasta = document.getElementById("fecha_fin").value;
  const pFechaDesde = document.getElementById("fecha_ini").value;
  const pModulo = "WMS_VT";
  const trasladosProcesados = document.getElementById("toggleSwitch").checked;
  const typeRpt = trasladosProcesados ? "R" : "TP";
  
  // checked = true -> Entrada ('E') | checked = false -> Salida ('S')
  const esEntrada = document.getElementById("trasladosSwitch").checked;
  const pOpcion = esEntrada ? "S" : "E";

  const params = `?pModulo=${pModulo}&pOpcion=${pOpcion}&typeRpt=${typeRpt}&fechaIni=${pFechaDesde}&fechaFin=${pFechaHasta}&BodegaOrigen=${bodegaOrigen}`;
  
  localStorage.setItem("parametrosBusqueda", params);
  consultaAPI(params);
  // mostrarLoader();
  // fetch(env.API_URL + "wmsverificaciontraslados/E" + params, myInit)
  //   .then((response) => response.json())
  //   .then((result) => {
  //     ocultarLoader();
  //     if (result.msg === "SUCCESS") {
  //       ArrayData = result.traslados || [];
  //       ArrayDataFiltrado = [...ArrayData];

  //        console.log("=== CARGA REFRESH COMPLETA (ArrayData) ===", ArrayData);
  //       	//actualizarBadgesConteo(ArrayData);
  //         cargaInicialTraslados()

  //       if (ArrayDataFiltrado.length === 0) {
  //         limpiarResultadoGeneral();
  //         Swal.fire({
  //           icon: "info",
  //           title: "Sin registros",
  //           text: `No se encontraron traslados de ${esEntrada ? 'Entrada' : 'Salida'}.`,
  //           confirmButtonColor: "#28a745",
  //         });
  //       } else {
  //         renderizarTablaConPaginacion(1);
  //       }
  //     } else {
  //       Swal.fire({
  //         icon: "error",
  //         title: "Error",
  //         text: "Ocurrió un error al consultar el API.",
  //         confirmButtonColor: "#28a745",
  //       });
  //     }
  //   })
  //   .catch((error) => {
  //     ocultarLoader();
  //     console.error("Error en la solicitud Fetch:", error);
  //   });
}
function consultaAPI(parametros){
  
  mostrarLoader();
  fetch(env.API_URL + "wmsverificaciontraslados/E" + parametros, myInit)
    .then((response) => response.json())
    .then((result) => {
      ocultarLoader();
      if (result.msg === "SUCCESS") {
        ArrayData = result.traslados || [];
        ArrayDataFiltrado = [...ArrayData];

         console.log("=== CARGA REFRESH COMPLETA (ArrayData) ===", ArrayData);
        	//actualizarBadgesConteo(ArrayData);
          cargaInicialTraslados()

        if (ArrayDataFiltrado.length === 0) {
          limpiarResultadoGeneral();
          Swal.fire({
            icon: "info",
            title: "Sin registros",
            text: `No se encontraron traslados de ${esEntrada ? 'Entrada' : 'Salida'}.`,
            confirmButtonColor: "#28a745",
          });
        } else {
          renderizarTablaConPaginacion(1);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al consultar el API.",
          confirmButtonColor: "#28a745",
        });
      }
    })
    .catch((error) => {
      ocultarLoader();
      console.error("Error en la solicitud Fetch:", error);
    });
}
function consultarTrasladosLocal() {
  if (!ArrayData || ArrayData.length === 0) {
    Swal.fire({
      icon: "info",
      title: "Información",
      text: "No hay traslados cargados en memoria. Por favor pulse 'Refrescar'.",
      confirmButtonColor: "#28a745",
    });
    limpiarResultadoGeneral();
    return;
  }

  // checked = true -> Entrada ('E') | checked = false -> Salida ('S')
  const esEntrada = document.getElementById("trasladosSwitch").checked;
  const tipoOpcion = esEntrada ? "S" : "E";
  const numTraslado = document.getElementById("pContenedor").value.trim().toUpperCase();

  // 1. Filtrar por tipo (E o S)
  let filtrados = ArrayData.filter((item) => (item.OPCION || "").toUpperCase() === tipoOpcion);

  // 2. Filtrar por número si se ingresó
  if (numTraslado !== "") {
    filtrados = filtrados.filter((item) =>
      item.TRASLADO && item.TRASLADO.toUpperCase().includes(numTraslado)
    );
  }

  ArrayDataFiltrado = filtrados;

  if (ArrayDataFiltrado.length === 0) {
    limpiarResultadoGeneral();
    Swal.fire({
      icon: "info",
      title: "Sin registros",
      text: `No hay traslados de ${esEntrada ? "Entrada" : "Salida"} para los criterios indicados.`,
      confirmButtonColor: "#28a745",
    });
  } else {
    renderizarTablaConPaginacion(1);
  }
}
function actualizarBadgesConteo(data) {
  if (!Array.isArray(data)) return;

  // Buscar los objetos correspondientes dentro del arreglo retornado por el API
  const objEntrada = data.find((item) => (item.OPCION || "").toUpperCase() === "E");
  const objSalida  = data.find((item) => (item.OPCION || "").toUpperCase() === "S");

  // Obtener la cantidad o asignar 0 en caso de no existir
  const cantEntradas = objEntrada ? (objEntrada.TOTAL_TRASLADO || 0) : 0;
  const cantSalidas  = objSalida  ? (objSalida.TOTAL_TRASLADO || 0)  : 0;

  // Referenciar los elementos del DOM
  const lblEntradas = document.getElementById("lblCantEntradas");
  const lblSalidas  = document.getElementById("lblCantSalidas");

  // Actualizar el texto
  if (lblEntradas) lblEntradas.innerText = cantEntradas;
  if (lblSalidas)  lblSalidas.innerText  = cantSalidas;
}
// function actualizarBadgesConteo(data) {
//   // const totalEntradas = data.filter((item) => (item.OPCION || "").toUpperCase() === "E").length;
//   // const totalSalidas = data.filter((item) => (item.OPCION || "").toUpperCase() === "S").length;

//     const totalEntradas = data.filter((item) => (item.OPCION || "").toUpperCase() === "E");
//   const totalSalidas = data.filter((item) => (item.OPCION || "").toUpperCase() === "S");

//   const lblEntradas = document.getElementById("lblCantEntradas");
//   const lblSalidas = document.getElementById("lblCantSalidas");

//   if (lblEntradas) lblEntradas.innerText = totalEntradas;
//   if (lblSalidas) lblSalidas.innerText = totalSalidas;
// }
function renderizarTablaConPaginacion(pag) {
  const cantReg = ArrayDataFiltrado.length;
  const nPag = Math.ceil(cantReg / xPag);

  document.getElementById("resultadoGeneral").innerHTML = `
    <div class="row" id="totalregistros" style="margin-bottom: 5px;">
      <div class="col s12"><b>Total de Registros: </b><span>${cantReg}</span></div>
    </div>`;

  mostrarResultadosVerificacionTraslados(nPag, pag);
  aplicarEstilosTabla();
}
function mostrarResultadosVerificacionTraslados(nPag, pag) {
  const desde = (pag - 1) * xPag;
  const hasta = pag * xPag;

  resultadosVerificacionTraslados(desde, hasta);
  const htm = paginadorTablas(nPag, pag, "mostrarResultadosVerificacionTraslados");
  document.getElementById("resultadoPaginador").innerHTML = htm;
}
function resultadosVerificacionTraslados(desde, hasta) {
  if (!ArrayDataFiltrado) return;

  const esEntrada = document.getElementById("trasladosSwitch").checked;
  const thBodega = document.getElementById("thBodega");

  // Rótulo dinámico en el encabezado
  if (thBodega) {
    thBodega.innerHTML = esEntrada ? "Bodega.<br>Destino." : "Bodega.<br>Origen.";
  }

  const tabla = document.getElementById("tbltraslados");
  let tbody = tabla.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    tabla.appendChild(tbody);
  }

  let htm = "";
  for (let i = desde; i < hasta; i++) {
    const item = ArrayDataFiltrado[i];
    if (item) {
      const backgroundColor = i % 2 === 0 ? "#ffffff" : "#d7d5d5";
      const bodegaMostrar = item.BODEGA_DESTINO || item.BODEGA_ORIGEN || item.BODEGA || "";
      const opcionActual = item.OPCION || (esEntrada ? "E" : "S");

      // Partir el código de traslado en dos líneas si tiene guión (ej: TRAS81- / 0000041903)
      let trasladoFormateado = item.TRASLADO || "";
      if (trasladoFormateado.includes("-")) {
        const partes = trasladoFormateado.split("-");
        trasladoFormateado = `${partes[0]}-<br>${partes.slice(1).join("-")}`;
      }

      htm += `
        <tr onclick="irDetalleTraslado('${item.TRASLADO}','${item.BODEGA_DESTINO || ''}','${item.ESTADO_TRASLADO || ''}','${opcionActual}');" style="cursor: pointer; background-color:${backgroundColor};">
          <td><span class="td-traslado-codigo">${trasladoFormateado}</span></td>
          <td>${bodegaMostrar}</td>
          <td>${item.LINEAS_VERIFICADAS || 0}</td>
          <td>${item.LINEAS_PREPARADAS || 0}</td>
          <td>${item.FECHA || ''}</td>
        </tr>`;
    }
  }
  tbody.innerHTML = htm;
}
function irDetalleTraslado(documento, bodegaDestino, estadoPreparacion, opcion) {
  const bodegaOrigen = document.getElementById("bodega")?.value || "";
  const pFechaHasta = document.getElementById("fecha_fin").value;
  const pFechaDesde = document.getElementById("fecha_ini").value;
  const pModulo = "WMS_VP";
  const typeRpt = "D";

  const params = `?pModulo=${pModulo}&pOpcion=${opcion}&typeRpt=${typeRpt}&fechaIni=${pFechaDesde}&fechaFin=${pFechaHasta}&BodegaOrigen=${bodegaOrigen}`;
  
  localStorage.setItem("ListParamsDetalle", params);
  localStorage.setItem("traslado", documento);
  localStorage.setItem("destinoBodegaTraslado", bodegaDestino);
  localStorage.setItem("estadotraslado", estadoPreparacion);

  window.location.href = opcion === "E" ? "detalleTrasladoEntrada.html" : "detalleTrasladoSalida.html";
}
function aplicarEstilosTabla() {
  $("#tbltraslados tbody tr").each(function () {
    const doc = $(this).find("td:eq(0)");
    if (doc.text().trim().startsWith("T")) {
      doc.css({ color: "red", "font-weight": "bold" });
    }
  });
}
function limpiarResultadoGeneral() {
  document.getElementById("resultadoPaginador").innerHTML = "";
  const totalReg = document.getElementById("totalregistros");
  if (totalReg) totalReg.innerHTML = "";
  
  const tbody = document.querySelector("#tbltraslados tbody");
  if (tbody) tbody.innerHTML = "";
}
// Variable global para el switch
const checkbox = document.getElementById("toggleSwitch");

document.addEventListener("DOMContentLoaded", function () {
  ocultarColumnaLPrep();
  const busqueda = localStorage.getItem("autoSearchPedidos");
  if (busqueda === "true") {
    // Obtener los parámetros de búsqueda del localStorage
    const parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
    if (parametrosBusqueda) {
      const params = new URLSearchParams(parametrosBusqueda);

      const pBodega = params.get("pBodega");
      const pFechaDesde = params.get("pFechaDesde");
      const pFechaHasta = params.get("pFechaHasta");
      const pUsuario = params.get("pUsuario");
      const pPedido = params.get("pPedido");
      const pOpcion = params.get("pOpcion");

      // Establecer los valores de los campos de fecha
      if(pFechaDesde) document.getElementById("fecha_ini").value = pFechaDesde;
      if(pFechaHasta) document.getElementById("fecha_fin").value = pFechaHasta;
      
      // Esperar un instante para que Materialize inicialice y luego forzar el estado
      setTimeout(() => {
          M.updateTextFields();
          const inputs = document.querySelectorAll('.datepicker');
          inputs.forEach(input => {
              const fechaGuardada = input.id === 'fecha_ini' ? pFechaDesde : pFechaHasta;
              if (fechaGuardada) {
                  const dateParts = fechaGuardada.split('-'); 
                  const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                  M.Datepicker.init(input, {
                      format: 'yyyy-mm-dd',
                      defaultDate: d,
                      setDefaultDate: true, 
                      autoClose: true
                  });
              }
          });
      }, 100);

      if (pOpcion === "FF") {
        $("#toggleSwitch").prop("checked", false);
      } else {
        $("#toggleSwitch").prop("checked", true);
      }

      // Llamar a la función listadoPedido con los valores extraídos
      listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion);
    } else {
      localStorage.clear();
    }
  }
});

function validarFormulario() {
  var bodega = document.getElementById("bodega").value;
  if (bodega == "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor, seleccione una bodega.",
    });
    return false; 
  } else {
    var pBodega = document.getElementById("bodega").value;
    var pPedido = $("#pPedido").val();
    var pFechaHasta = $("#fecha_fin").val();
    var pFechaDesde = $("#fecha_ini").val();
    var pUsuario = document.getElementById("hUsuario").value;
    let pOpcion = $("#toggleSwitch").prop("checked") ? "R" : "FF";

    listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion);
  }
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
  
  if (typeof mostrarLoader === "function") mostrarLoader("Buscando pedidos...");

  fetch(env.API_URL + "wmsverificacionpedidos/P" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.pedidos.length != 0) {
          ArrayData = result.pedidos;
          ArrayDataFiltrado = result.pedidos;

          console.log(result);

          // Renderizado limpio del contador
          let htm = `Total de Registros: <span id="lblTotalRegistros">${result.pedidos.length}</span>`;
          document.getElementById("resultadoGeneral").innerHTML = htm;
          
          // Llama a la nueva función que carga todo y pagina
          renderizarTablaPedidosCompleta();

          if (typeof ocultarLoader === "function") ocultarLoader();
          aplicarEstilosTablaPedidos();
        } else {
          Swal.fire({
            icon: "info",
            title: "Información",
            text: "No tiene pedidos pendientes bajo estos criterios.",
            confirmButtonColor: "#28a745",
          });
          limpiarResultadoGeneral();
          if (typeof ocultarLoader === "function") ocultarLoader();
        }
      } else {
        console.error("Error en el SP");
        if (typeof ocultarLoader === "function") ocultarLoader();
      }
    })
    .catch((error) => {
        console.error("Error Fetch:", error);
        if (typeof ocultarLoader === "function") ocultarLoader();
    });
}


function renderizarTablaPedidosCompleta() {
  const bodegaInput = document.getElementById("bodega");
  const bodega = bodegaInput ? bodegaInput.value : ""; 
  const bodegaNum = bodega && bodega.includes("-") ? bodega.split("-")[1] : "";

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

  const mostrarPrep = (bodegaNum >= "51" || bodegaNum === "05");

  for (let i = 0; i < ArrayDataFiltrado.length; i++) {
    let item = ArrayDataFiltrado[i];

    // Sanitización estricta de las cadenas numéricas del API (".00", "1.00000000", etc.)
    let rawSol = String(item.TOTAL_UNIDADES || "0").trim();
    let rawVer = String(item.LINEAS_VERIFICADAS || "0").trim();
    let rawPrep = String(item.LINEAS_PREPARADAS || "0").trim();

    if (rawSol.startsWith(".")) rawSol = "0" + rawSol;
    if (rawVer.startsWith(".")) rawVer = "0" + rawVer;
    if (rawPrep.startsWith(".")) rawPrep = "0" + rawPrep;

    let cantSolicitada = parseFloat(rawSol) || 0;
    let cantVerificada = parseFloat(rawVer) || 0;
    let cantPreparada  = parseFloat(rawPrep) || 0;

    htm += `<tr onclick="irDetallePedido('${item.DOCUMENTO}','${item.PEDIDO}','${item.ESTADO_PEDIDO}','${item.ESTADO_PREPARACION}');" style="cursor: pointer;">`;

    let documentoClase = item.ESTADO_PREPARACION === "A" ? "cell-origen" : "";
    htm += `<td class="cell-center ${documentoClase}">${item.DOCUMENTO || ""}</td>`;
    htm += `<td style="text-align: left; white-space: normal;">${item.DESCRIPCION || ""}</td>`;
    htm += `<td class="cell-number">${cantSolicitada.toFixed(2)}</td>`;
     // CELDA ÍNDICE 4: SIEMPRE SE GENERA PARA PRESERVAR EL ORDEN DE LAS COLUMNAS
    let displayPrep = mostrarPrep ? "" : "display: none;";
    htm += `<td class="cell-number col-lprep" style="${displayPrep}">${cantPreparada.toFixed(2)}</td>`;
    htm += `<td class="cell-number">${cantVerificada.toFixed(2)}</td>`;

   

    // CELDA ÍNDICE 5: VERIFICACIÓN
    htm += `<td class="cell-center">`;
    if (cantVerificada === 0) {
      htm += ``;
    } else if (cantVerificada >= cantSolicitada) {
      htm += `<i class="material-icons" style="color: #28a745 !important; font-size: 22px; line-height: 1; vertical-align: middle; display: flex;">done_all</i>`;
    } else if (cantVerificada > 0 && cantVerificada < cantSolicitada) {
      htm += `<i class="material-icons" style="color: #e53935 !important; font-size: 22px; line-height: 1; vertical-align: middle; display: flex;">done_all</i>`;
    }
    htm += `</td>`;

    htm += `</tr>`;
  }

  tbody.innerHTML = htm; 
  ocultarColumnaLPrep(); 

  // Paginación vinculada a paginacion.js
  const contenedorPaginador = $('#resultadoPaginador');
  contenedorPaginador.empty();
  contenedorPaginador.html('<ul class="pagination" id="paginador-ul" style="display:flex; justify-content:center;"></ul>');

  try {
    if ($.fn.pageMe) {
      $('#tblpedido tbody').pageMe({
        pagerSelector: '#paginador-ul',
        showPrevNext: true,
        hidePageNumbers: false,
        perPage: typeof xPag !== 'undefined' ? xPag : 20
      });
    }
  } catch (error) {
    console.error("Error inicializando paginador pageMe:", error);
  }
}
function irDetallePedido(documento, pedido, estado, estado_preparacion) {
  const checkbox = document.getElementById("toggleSwitch");
  let bodega = localStorage.getItem("BodegaUsuario");
  let bodegaNumero = bodega.match(/\d+/)[0];

  localStorage.setItem("pedidos_finalizados", checkbox.checked);
  localStorage.setItem("documento", documento);
  localStorage.setItem("pedidoSelect", pedido);
  localStorage.setItem("estado", estado);
  localStorage.setItem("EstadoPreparacion", estado_preparacion);

  if ((bodegaNumero >= 51 && bodegaNumero <= 55) || bodegaNumero === "05") {
    window.location.href = "detallePedidoPreparado.html";
  } else {
    window.location.href = "detalle_pedido.html";
  }
}

checkbox.addEventListener("change", function () {
  if (checkbox.checked === false) {
    pedidosFinalizados();
  }
  limpiarResultadoGeneral();
});

function pedidosFinalizados() {
  Swal.fire({
    title: "¿Desea ver solo los pedidos finalizados?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "No",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
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
    var documentoValue = $(this).find("td:eq(0)").text().trim();
    if (documentoValue.startsWith("T")) {
      $(this).find("td:eq(0)").css({
        color: "#e51c23",
        "font-weight": "bold",
      });
    }
  });
}

function ocultarColumnaLPrep() {
  const bodega = document.getElementById("bodega") ? document.getElementById("bodega").value : ""; 
  const numeroBodega = bodega && bodega.includes("-") ? bodega.split("-")[1] : ""; 
  const thLPrep = document.getElementById("thLPrep");
  const celdasLPrep = document.querySelectorAll(".col-lprep");

  if (numeroBodega >= 51 || numeroBodega === "05") {
    if (thLPrep) thLPrep.style.display = "";
    celdasLPrep.forEach((c) => (c.style.display = ""));
  } else {
    if (thLPrep) thLPrep.style.display = "none";
    celdasLPrep.forEach((c) => (c.style.display = "none"));
  }
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblpedido");
  const resultadoPaginador = document.getElementById("resultadoPaginador");
  const totalRegistros = document.getElementById("resultadoGeneral");

  if (resultadoPaginador) resultadoPaginador.innerHTML = "";
  if (totalRegistros) totalRegistros.innerHTML = "";

  if (tabla) {
    let tbody = tabla.querySelector("tbody");
    if (tbody) tbody.innerHTML = "";
  }
}

const fecha_ini = document.getElementById("fecha_ini");
if(fecha_ini){
  fecha_ini.addEventListener("change", function () {
    limpiarResultadoGeneral();
  });
}
const fecha_fin = document.getElementById("fecha_fin");
if(fecha_fin) {
  fecha_fin.addEventListener("change", function () {
    limpiarResultadoGeneral();
  });
}

// // Variable global para el switch
// const checkbox = document.getElementById("toggleSwitch");

// document.addEventListener("DOMContentLoaded", function () {
//   ocultarColumnaLPrep();
//   const busqueda = localStorage.getItem("autoSearchPedidos");
//   if (busqueda === "true") {
//     // Obtener los parámetros de búsqueda del localStorage
//     const parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
//     if (parametrosBusqueda) {
//       const params = new URLSearchParams(parametrosBusqueda);

//       const pBodega = params.get("pBodega");
//       const pFechaDesde = params.get("pFechaDesde");
//       const pFechaHasta = params.get("pFechaHasta");
//       const pUsuario = params.get("pUsuario");
//       const pPedido = params.get("pPedido");
//       const pOpcion = params.get("pOpcion");

//       // Establecer los valores de los campos de fecha
//       if(pFechaDesde) document.getElementById("fecha_ini").value = pFechaDesde;
//       if(pFechaHasta) document.getElementById("fecha_fin").value = pFechaHasta;
      
//       // Esperar un instante para que Materialize inicialice y luego forzar el estado
//       setTimeout(() => {
//           M.updateTextFields();
//           const inputs = document.querySelectorAll('.datepicker');
//           inputs.forEach(input => {
//               const fechaGuardada = input.id === 'fecha_ini' ? pFechaDesde : pFechaHasta;
//               if (fechaGuardada) {
//                   const dateParts = fechaGuardada.split('-'); 
//                   const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
//                   M.Datepicker.init(input, {
//                       format: 'yyyy-mm-dd',
//                       defaultDate: d,
//                       setDefaultDate: true, 
//                       autoClose: true
//                   });
//               }
//           });
//       }, 100);

//       if (pOpcion === "FF") {
//         $("#toggleSwitch").prop("checked", false);
//       } else {
//         $("#toggleSwitch").prop("checked", true);
//       }

//       // Llamar a la función listadoPedido con los valores extraídos
//       listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion);
//     } else {
//       localStorage.clear();
//     }
//   }
// });

// function validarFormulario() {
//   var bodega = document.getElementById("bodega").value;
//   if (bodega == "") {
//     Swal.fire({
//       icon: "warning",
//       title: "Advertencia",
//       text: "Por favor, seleccione una bodega.",
//     });
//     return false; 
//   } else {
//     var pBodega = document.getElementById("bodega").value;
//     var pPedido = $("#pPedido").val();
//     var pFechaHasta = $("#fecha_fin").val();
//     var pFechaDesde = $("#fecha_ini").val();
//     var pUsuario = document.getElementById("hUsuario").value;
//     let pOpcion = $("#toggleSwitch").prop("checked") ? "R" : "FF";

//     listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion);
//   }
// }

// function listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion) {
//   localStorage.setItem("autoSearchPedidos", "true"); 

//   const params =
//     "?pBodega=" + pBodega +
//     "&pFechaDesde=" + pFechaDesde +
//     "&pFechaHasta=" + pFechaHasta +
//     "&pUsuario=" + pUsuario +
//     "&pPedido=" + pPedido +
//     "&pOpcion=" + pOpcion;
    
//   localStorage.setItem("BodegaUsuario", pBodega);
//   localStorage.setItem("parametrosBusqueda", params);
  
//   if (typeof mostrarLoader === "function") mostrarLoader("Buscando pedidos...");

//   fetch(env.API_URL + "wmsverificacionpedidos/P" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.pedidos.length != 0) {
//           ArrayData = result.pedidos;
//           ArrayDataFiltrado = result.pedidos;
//             console.log("Pedidos", ArrayData);
//           //console.log("RESULTADOS: "+result[0].pedidos);

//           // Renderizado limpio del contador
//           let htm = `Total de Registros: <span id="lblTotalRegistros">${result.pedidos.length}</span>`;
//           document.getElementById("resultadoGeneral").innerHTML = htm;
          
//           // Llama a la nueva función que carga todo y pagina
//           renderizarTablaPedidosCompleta();

//           if (typeof ocultarLoader === "function") ocultarLoader();
//           aplicarEstilosTablaPedidos();
//         } else {
//           Swal.fire({
//             icon: "info",
//             title: "Información",
//             text: "No tiene pedidos pendientes bajo estos criterios.",
//             confirmButtonColor: "#28a745",
//           });
//           limpiarResultadoGeneral();
//           if (typeof ocultarLoader === "function") ocultarLoader();
//         }
//       } else {
//         console.error("Error en el SP");
//         if (typeof ocultarLoader === "function") ocultarLoader();
//       }
//     })
//     .catch((error) => {
//         console.error("Error Fetch:", error);
//         if (typeof ocultarLoader === "function") ocultarLoader();
//     });
// }

// function renderizarTablaPedidosCompleta() {
//   const bodega = document.getElementById("bodega").value; 
//   const bodegaNum = bodega ? bodega.split("-")[1] : "";

//   if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) return;

//   const tabla = document.getElementById("tblpedido");
//   let tbody = tabla.querySelector("tbody");

//   if (!tbody) {
//     tbody = document.createElement("tbody");
//     tabla.appendChild(tbody);
//   }
  
//   // Limpiamos el tbody
//   tbody.innerHTML = "";
//   let htm = "";

//   // Generamos todas las filas
//   for (let i = 0; i < ArrayDataFiltrado.length; i++) {
//     let item = ArrayDataFiltrado[i];
    
//     htm += `<tr onclick="irDetallePedido('${item.DOCUMENTO}','${item.PEDIDO}','${item.ESTADO_PEDIDO}','${item.ESTADO_PREPARACION}');" style="cursor: pointer;">`;

//     let documentoClase = item.ESTADO_PREPARACION === "A" ? "cell-origen" : "";
//     htm += `<td class="cell-center ${documentoClase}">${item.DOCUMENTO}</td>`;
//     htm += `<td style="text-align: left; white-space: normal;">${item.DESCRIPCION}</td>`;
//     htm += `<td class="cell-number">${parseFloat(item.TOTAL_UNIDADES).toFixed(2)}</td>`;
//     htm += `<td class="cell-number">${parseFloat(item.LINEAS_VERIFICADAS).toFixed(2)}</td>`;

//     if (bodegaNum >= "51" || bodegaNum === "05") {
//       document.getElementById("thLPrep").hidden = false;
//       htm += `<td class="cell-number">${parseFloat(item.LINEAS_PREPARADAS).toFixed(2)}</td>`;
//     } else {
//       document.getElementById("thLPrep").hidden = true;
//     }

//     // CORRECCIÓN: Convertir estrictamente a número para la validación exacta
//     let cantSolicitada = Number(parseFloat(item.TOTAL_UNIDADES).toFixed(2));
//     let cantVerificada = Number(parseFloat(item.LINEAS_VERIFICADAS).toFixed(2));

//     htm += `<td class="cell-center">`;
//     if (cantVerificada === 0 && cantSolicitada !== cantVerificada) {
//       htm += ""; // Vacío si no se ha verificado nada
//     } else if (cantSolicitada === cantVerificada) {
//       // Check VERDE si coincide exacto
//       htm += '<i class="material-icons" style="color: #28a745; font-size: 20px;">done_all</i>';
//     } else if (cantVerificada > 0 && cantSolicitada !== cantVerificada) {
//       // Check ROJO si hay diferencias (parcial / exceso)
//       htm += '<i class="material-icons" style="color: #e53935; font-size: 20px;">done_all</i>';
//     }
//     htm += `</td>`;
//     htm += `</tr>`;
//   }

//   tbody.innerHTML = htm; 
//   ocultarColumnaLPrep(); 

//   // ==========================================
//   // INICIALIZACIÓN DE LA PAGINACIÓN MODERNA
//   // ==========================================
//   const contenedorPaginador = $('#resultadoPaginador');
//   contenedorPaginador.empty(); // Limpiamos cualquier rastro anterior
//   contenedorPaginador.html('<ul class="pagination" id="paginador-ul" style="display:flex; justify-content:center;"></ul>');

//   try {
//       $('#tblpedido tbody').pageMe({
//           pagerSelector: '#paginador-ul',
//           showPrevNext: true,
//           hidePageNumbers: false,
//           perPage: typeof xPag !== 'undefined' ? xPag : 20 // Usa 20 por defecto si xPag no está en main.js
//       });
//   } catch (error) {
//       console.error("Error inicializando paginador pageMe:", error);
//   }
// }

// function irDetallePedido(documento, pedido, estado, estado_preparacion) {
//   const checkbox = document.getElementById("toggleSwitch");
//   let bodega = localStorage.getItem("BodegaUsuario");
//   let bodegaNumero = bodega.match(/\d+/)[0];

//   localStorage.setItem("pedidos_finalizados", checkbox.checked);
//   localStorage.setItem("documento", documento);
//   localStorage.setItem("pedidoSelect", pedido);
//   localStorage.setItem("estado", estado);
//   localStorage.setItem("EstadoPreparacion", estado_preparacion);

//   if ((bodegaNumero >= 51 && bodegaNumero <= 55) || bodegaNumero === "05") {
//     window.location.href = "detallePedidoPreparado.html";
//   } else {
//     window.location.href = "detalle_pedido.html";
//   }
// }

// checkbox.addEventListener("change", function () {
//   if (checkbox.checked === false) {
//     pedidosFinalizados();
//   }
//   limpiarResultadoGeneral();
// });

// function pedidosFinalizados() {
//   Swal.fire({
//     title: "¿Desea ver solo los pedidos finalizados?",
//     icon: "question",
//     showCancelButton: true,
//     confirmButtonText: "Sí",
//     cancelButtonText: "No",
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       $("#toggleSwitch").prop("checked", false);
//     } else {
//       $("#toggleSwitch").prop("checked", true);
//     }
//   });
// }

// function aplicarEstilosTablaPedidos() {
//   $("#tblpedido tbody tr").each(function () {
//     var documentoValue = $(this).find("td:eq(0)").text().trim();
//     if (documentoValue.startsWith("T")) {
//       $(this).find("td:eq(0)").css({
//         color: "#e51c23",
//         "font-weight": "bold",
//       });
//     }
//   });
// }

// function ocultarColumnaLPrep() {
//   const bodega = document.getElementById("bodega").value; 
//   if(!bodega) return;

//   const numeroBodega = bodega.split("-")[1]; 
//   const thLPrep = document.getElementById("thLPrep");

//   if (numeroBodega >= 51 || numeroBodega === "05") {
//     if(thLPrep) thLPrep.hidden = false;
//   } else {
//     if(thLPrep) thLPrep.hidden = true;
//     const filas = document.querySelectorAll("#tblpedido tbody tr");
//     filas.forEach((fila) => {
//       const celdaLPrep = fila.cells[4]; 
//       if (celdaLPrep) {
//         celdaLPrep.style.display = "none";
//       }
//     });
//   }
// }

// function limpiarResultadoGeneral() {
//   const tabla = document.getElementById("tblpedido");
//   const resultadoPaginador = document.getElementById("resultadoPaginador");
//   const totalRegistros = document.getElementById("resultadoGeneral");

//   if (resultadoPaginador) resultadoPaginador.innerHTML = "";
//   if (totalRegistros) totalRegistros.innerHTML = "";

//   if (tabla) {
//     let tbody = tabla.querySelector("tbody");
//     if (tbody) tbody.innerHTML = "";
//   }
// }

// const fecha_ini = document.getElementById("fecha_ini");
// if(fecha_ini){
//   fecha_ini.addEventListener("change", function () {
//     limpiarResultadoGeneral();
//   });
// }
// const fecha_fin = document.getElementById("fecha_fin");
// if(fecha_fin) {
//   fecha_fin.addEventListener("change", function () {
//     limpiarResultadoGeneral();
//   });
// }

// //variabla global
// const checkbox = document.getElementById("toggleSwitch");
// document.addEventListener("DOMContentLoaded", function () {
//   ocultarColumnaLPrep();
//   const busqueda = localStorage.getItem("autoSearchPedidos");
//   if (busqueda === "true") {
//     // Obtener los parámetros de búsqueda del localStorage
//     const parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
//     if (parametrosBusqueda) {
//       // Crear un objeto URLSearchParams a partir de los parámetros
//       const params = new URLSearchParams(parametrosBusqueda);

//       // Extraer los valores de los parámetros
//       const pBodega = params.get("pBodega");
//       const pFechaDesde = params.get("pFechaDesde");
//       const pFechaHasta = params.get("pFechaHasta");
//       const pUsuario = params.get("pUsuario");
//       const pPedido = params.get("pPedido");
//       const pOpcion = params.get("pOpcion");

//       // Establecer los valores de los campos de fecha
//       if(pFechaDesde) document.getElementById("fecha_ini").value = pFechaDesde;
//       if(pFechaHasta) document.getElementById("fecha_fin").value = pFechaHasta;
//       // 2. Esperar un instante para que Materialize inicialice y luego forzar el estado
//           setTimeout(() => {
//               // Forzar a los labels a subir
//               M.updateTextFields();

//               // Reinicializar los datepickers específicamente con la fecha guardada
//               const inputs = document.querySelectorAll('.datepicker');
//               inputs.forEach(input => {
//                   const fechaGuardada = input.id === 'fecha_ini' ? pFechaDesde : pFechaHasta;
                  
//                   if (fechaGuardada) {
//                       // Crear objeto fecha (importante añadir la hora para evitar desfases de zona horaria)
//                       const dateParts = fechaGuardada.split('-'); // Asumiendo YYYY-MM-DD
//                       const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

//                       M.Datepicker.init(input, {
//                           format: 'yyyy-mm-dd',
//                           defaultDate: d,
//                           setDefaultDate: true, // Esto obliga al calendario a mostrar la fecha
//                           autoClose: true
//                       });
//                   }
//               });
//           }, 100);

//       if (pOpcion === "FF") {
//         $("#toggleSwitch").prop("checked", false);
//       } else {
//         $("#toggleSwitch").prop("checked", true);
//       }

//       // Llamar a la función listadoPedido con los valores extraídos
//       listadoPedido(
//         pBodega,
//         pPedido,
//         pFechaDesde,
//         pFechaHasta,
//         pUsuario,
//         pOpcion
//       );
//     }
//     else{
//       localStorage.clear();
//     }
//   }
// });

// function validarFormulario() {
//   //revisar como toma el valor
//   var bodega = document.getElementById("bodega").value;
//   //revisar como toma el valor
//   if (bodega == "") {
//     Swal.fire({
//       icon: "warning",
//       title: "Advertencia",
//       text: "Por favor, seleccione una bodega.",
//     });
//     return false; // Evita que se envíe el formulario
//   } else {
//     var pBodega = document.getElementById("bodega").value;
//     var pPedido = $("#pPedido").val();
//     var pFechaHasta = $("#fecha_fin").val();
//     var pFechaDesde = $("#fecha_ini").val();
//     var pUsuario = document.getElementById("hUsuario").value;
//     // document.getElementById("usuario").innerText || document.getElementById("usuario").innerHTML;
//     let pOpcion = $("#toggleSwitch").prop("checked");

//     if (pOpcion) {
//       pOpcion = "R";
//     } else {
//       pOpcion = "FF";
//     }
//     listadoPedido(
//       pBodega,
//       pPedido,
//       pFechaDesde,
//       pFechaHasta,
//       pUsuario,
//       pOpcion
//     );
//   }
// }
// function listadoPedido(
//   pBodega,
//   pPedido,
//   pFechaDesde,
//   pFechaHasta,
//   pUsuario,
//   pOpcion
// ) {
//   localStorage.setItem("autoSearchPedidos", "true"); // Aquí se establece el valor 'false' para la búsqueda 

//   const params =
//     "?pBodega=" +
//     pBodega +
//     "&pFechaDesde=" +
//     pFechaDesde +
//     "&pFechaHasta=" +
//     pFechaHasta +
//     "&pUsuario=" +
//     pUsuario +
//     "&pPedido=" +
//     pPedido +
//     "&pOpcion=" +
//     pOpcion;
//   localStorage.setItem("BodegaUsuario", pBodega);
//   localStorage.setItem("parametrosBusqueda", params);
//   mostrarLoader();

//   fetch(env.API_URL + "wmsverificacionpedidos/P" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.pedidos.length != 0) {
//           ArrayData = result.pedidos;
//           console.log("Pedidos", ArrayData);
//           ArrayDataFiltrado = result.pedidos;
//           let cantReg = result.pedidos.length;
//           let nPag = Math.ceil(cantReg / xPag);

//           $("#tblpedido tbody").empty();

//           // Renderizado limpio del contador (Estilo Unificado)
//           let htm = `Total de Registros: <span id="lblTotalRegistros">${result.pedidos.length}</span>`;

//           document.getElementById("resultadoGeneral").innerHTML = htm;
//           mostrarResultadosVerificacionPedidos(nPag, 1);

//           ocultarLoader();
//           aplicarEstilosTablaPedidos();
//         } else {
//           Swal.fire({
//             icon: "info",
//             title: "Información",
//             text: "No tiene pedidos pendientes bajo estos criterios.",
//             confirmButtonColor: "#28a745",
//           });
//           limpiarResultadoGeneral();
//           ocultarLoader();
//         }
//       } else {
//         console.log("Error en el SP");
//         ocultarLoader();
//       }
//     })
//     .catch((error) => {
//         console.error("Error Fetch:", error);
//         ocultarLoader();
//     });
// }
// function mostrarResultadosVerificacionPedidos(nPag, pag) {
//   let htm = "";
//   let desde = (pag - 1) * xPag;
//   let hasta = pag * xPag;

//   resultadosVerificacionPedidos(desde, hasta);
//   htm += paginadorTablas(nPag, pag, "mostrarResultadosVerificacionPedidos");
//   document.getElementById("resultadoPaginador").innerHTML = htm;
// }

// function resultadosVerificacionPedidos(desde, hasta) {
//   const bodega = document.getElementById("bodega").value; //obtener el numero de la bodega
//   const bodegaNum = bodega.split("-")[1];

//   if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) {
//     console.error("ArrayDataFiltrado no está definido o está vacío.");
//     return;
//   }

//   const tabla = document.getElementById("tblpedido");
//   let tbody = tabla.querySelector("tbody");

//   if (tbody) {
//     tbody.innerHTML = "";
//   } else {
//     tbody = document.createElement("tbody");
//     tabla.appendChild(tbody);
//   }

//   let htm = "";

//   for (let i = desde; i < hasta; i++) {
//     if (ArrayDataFiltrado[i]) {
//       htm += `<tr onclick="irDetallePedido('${ArrayDataFiltrado[i].DOCUMENTO}','${ArrayDataFiltrado[i].PEDIDO}','${ArrayDataFiltrado[i].ESTADO_PEDIDO}','${ArrayDataFiltrado[i].ESTADO_PREPARACION}');" style="cursor: pointer;">`;

//       // Condición para cambiar el color de la celda si ESTADO_PREPARACION es 'A'
//       let documentoClase = ArrayDataFiltrado[i].ESTADO_PREPARACION === "A" ? "cell-origen" : "";
//       htm += `<td class="cell-center ${documentoClase}">${ArrayDataFiltrado[i].DOCUMENTO}</td>`;

//       htm += `<td style="text-align: left; white-space: normal;">${ArrayDataFiltrado[i].DESCRIPCION}</td>`;
//       htm += `<td class="cell-number">${parseFloat(ArrayDataFiltrado[i].TOTAL_UNIDADES).toFixed(2)}</td>`;
//       htm += `<td class="cell-number">${parseFloat(ArrayDataFiltrado[i].LINEAS_VERIFICADAS).toFixed(2)}</td>`;

//       if (bodegaNum >= "51" || bodegaNum === "05") {
//         document.getElementById("thLPrep").hidden = false;
//         htm += `<td class="cell-number">${parseFloat(ArrayDataFiltrado[i].LINEAS_PREPARADAS).toFixed(2)}</td>`;
//       } else {
//         document.getElementById("thLPrep").hidden = true;
//       }

//       let cantSolicitada = parseFloat(ArrayDataFiltrado[i].TOTAL_UNIDADES).toFixed(2);
//       let cantVerificada = parseFloat(ArrayDataFiltrado[i].LINEAS_VERIFICADAS).toFixed(2);

//       htm += `<td class="cell-center">`;
//       if (cantVerificada == 0 && cantSolicitada != cantVerificada) {
//         htm += "";
//       } else if (cantSolicitada == cantVerificada) {
//         htm += '<i class="material-icons" style="color: #28a745; font-size: 20px;">done_all</i>';
//       } else if (cantVerificada > 0 && cantSolicitada != cantVerificada) {
//         htm += '<i class="material-icons" style="color: #e53935; font-size: 20px;">done_all</i>';
//       }
//       htm += `</td>`;
//       htm += `</tr>`;
//     }
//   }

//   tbody.innerHTML = htm; 
//   ocultarColumnaLPrep(); // Asegurarse de ocular la celda si la cabecera está oculta
// }

// function irDetallePedido(documento, pedido, estado, estado_preparacion) {
//   const checkbox = document.getElementById("toggleSwitch");
//   let bodega = localStorage.getItem("BodegaUsuario");
//   // Extraer solo el número de la bodega
//   let bodegaNumero = bodega.match(/\d+/)[0];

//   // console.log(bodegaNumero); // Esto mostrará "52" si el valor original era "B-52"
//   localStorage.setItem("pedidos_finalizados", checkbox.checked);
//   localStorage.setItem("documento", documento);
//   localStorage.setItem("pedidoSelect", pedido);
//   localStorage.setItem("estado", estado);
//   localStorage.setItem("EstadoPreparacion", estado_preparacion);

//   if ((bodegaNumero >= 51 && bodegaNumero <= 55) || bodegaNumero === "05") {
//     window.location.href = "detallePedidoPreparado.html";
//   } else {
//     window.location.href = "detalle_pedido.html";
//   }
// }
// ///////////// Obtener el elemento toggleSwitch de entrada tipo checkbox//////////
// /////////////// Agregar un evento de cambio al checkbox/////////////
// checkbox.addEventListener("change", function () {
//   // Imprimir el valor del checkbox en la consola
//   if (checkbox.checked === false) {
//     pedidosFinalizados();
//   } else {
//   }
//   limpiarResultadoGeneral();
// });
// /////////////////Fucnion que activa el toggleSwitch para ver los pedidos facturados y finalizados
// function pedidosFinalizados() {
//   // Mostrar el cuadro de diálogo con SweetAlert2
//   Swal.fire({
//     title: "¿Desea ver solo los pedidos finalizados?",
//     icon: "question",
//     showCancelButton: true,
//     confirmButtonText: "Sí",
//     cancelButtonText: "No",
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//   }).then((result) => {
//     // Resultado de la acción
//     if (result.isConfirmed) {
//       $("#toggleSwitch").prop("checked", false);
//     } else {
//       $("#toggleSwitch").prop("checked", true);
//     }
//   });
// }
// ////////////////////se aplican estilos a las filas cuyos documentos comienzan con 'T'. /////////////////
// function aplicarEstilosTablaPedidos() {
//   $("#tblpedido tbody tr").each(function () {
//     var documentoValue = $(this).find("td:eq(0)").text().trim();

//     if (documentoValue.startsWith("T")) {
//       $(this).find("td:eq(0)").css({
//         color: "#e51c23",
//         "font-weight": "bold",
//       });
//     }
//   });
// }
// function ocultarColumnaLPrep() {
//   const bodega = document.getElementById("bodega").value; // Ejemplo: "B-51"
//   if(!bodega) return;

//   const numeroBodega = bodega.split("-")[1]; // Esto te dará "51"
//   const thLPrep = document.getElementById("thLPrep");

//   // Verifica si la bodega es mayor a 51 o igual a 05
//   if (numeroBodega >= 51 || numeroBodega === "05") {
//     if(thLPrep) thLPrep.hidden = false;
//   } else {
//     if(thLPrep) thLPrep.hidden = true;

//     // Oculta las celdas correspondientes en todas las filas del cuerpo de la tabla
//     const filas = document.querySelectorAll("#tblpedido tbody tr");
//     filas.forEach((fila) => {
//       const celdaLPrep = fila.cells[4]; // Índice 4 para la columna L PREP
//       if (celdaLPrep) {
//         celdaLPrep.style.display = "none";
//       }
//     });
//   }
// }
// // //limpiar el contenido de la busqueda
// function limpiarResultadoGeneral() {
//   const tabla = document.getElementById("tblpedido");
//   const resultadoPaginador = document.getElementById("resultadoPaginador");
//   const totalRegistros = document.getElementById("resultadoGeneral");

//   // Limpiar el contenido del paginador si existe
//   if (resultadoPaginador) {
//     resultadoPaginador.innerHTML = "";
//   }

//   // Limpiar el contenido de totalRegistros si existe
//   if (totalRegistros) {
//     totalRegistros.innerHTML = "";
//   }

//   // Limpiar el contenido del tbody de la tabla si la tabla existe
//   if (tabla) {
//     let tbody = tabla.querySelector("tbody");
//     if (tbody) {
//       tbody.innerHTML = "";
//     }
//   }
// }
// const fecha_ini = document.getElementById("fecha_ini");
// if(fecha_ini){
//   fecha_ini.addEventListener("change", function () {
//     limpiarResultadoGeneral();
//   });
// }
// const fecha_fin = document.getElementById("fecha_fin");
// if(fecha_fin) {
//   fecha_fin.addEventListener("change", function () {
//     limpiarResultadoGeneral();
//   });
// }

// //variabla global
// const checkbox = document.getElementById("toggleSwitch");
// document.addEventListener("DOMContentLoaded", function () {
//   ocultarColumnaLPrep();
//   const busqueda = localStorage.getItem("autoSearchPedidos");
//   if (busqueda === "true") {
//     // Obtener los parámetros de búsqueda del localStorage
//     const parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
//     if (parametrosBusqueda) {
//       // Crear un objeto URLSearchParams a partir de los parámetros
//       const params = new URLSearchParams(parametrosBusqueda);

//       // Extraer los valores de los parámetros
//       const pBodega = params.get("pBodega");
//       const pFechaDesde = params.get("pFechaDesde");
//       const pFechaHasta = params.get("pFechaHasta");
//       const pUsuario = params.get("pUsuario");
//       const pPedido = params.get("pPedido");
//       const pOpcion = params.get("pOpcion");

//       // Establecer los valores de los campos de fecha
//       if(pFechaDesde) document.getElementById("fecha_ini").value = pFechaDesde;
//       if(pFechaHasta) document.getElementById("fecha_fin").value = pFechaHasta;
//       // 2. Esperar un instante para que Materialize inicialice y luego forzar el estado
//           setTimeout(() => {
//               // Forzar a los labels a subir
//               M.updateTextFields();

//               // Reinicializar los datepickers específicamente con la fecha guardada
//               const inputs = document.querySelectorAll('.datepicker');
//               inputs.forEach(input => {
//                   const fechaGuardada = input.id === 'fecha_ini' ? pFechaDesde : pFechaHasta;
                  
//                   if (fechaGuardada) {
//                       // Crear objeto fecha (importante añadir la hora para evitar desfases de zona horaria)
//                       const dateParts = fechaGuardada.split('-'); // Asumiendo YYYY-MM-DD
//                       const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

//                       M.Datepicker.init(input, {
//                           format: 'yyyy-mm-dd',
//                           defaultDate: d,
//                           setDefaultDate: true, // Esto obliga al calendario a mostrar la fecha
//                           autoClose: true
//                       });
//                   }
//               });
//           }, 100);

//       if (pOpcion === "FF") {
//         $("#toggleSwitch").prop("checked", false);
//       } else {
//         $("#toggleSwitch").prop("checked", true);
//       }

//       // Llamar a la función listadoPedido con los valores extraídos
//       listadoPedido(
//         pBodega,
//         pPedido,
//         pFechaDesde,
//         pFechaHasta,
//         pUsuario,
//         pOpcion
//       );
//     }
//     else{
//       localStorage.clear();
//     }
//   }
// });

// function validarFormulario() {
//   //revisar como toma el valor
//   var bodega = document.getElementById("bodega").value;
//   //revisar como toma el valor
//   if (bodega == "") {
//     Swal.fire({
//       icon: "warning",
//       title: "Advertencia",
//       text: "Por favor, seleccione una bodega.",
//     });
//     return false; // Evita que se envíe el formulario
//   } else {
//     var pBodega = document.getElementById("bodega").value;
//     var pPedido = $("#pPedido").val();
//     var pFechaHasta = $("#fecha_fin").val();
//     var pFechaDesde = $("#fecha_ini").val();
//     var pUsuario = document.getElementById("hUsuario").value;
//     // document.getElementById("usuario").innerText || document.getElementById("usuario").innerHTML;
//     let pOpcion = $("#toggleSwitch").prop("checked");

//     if (pOpcion) {
//       pOpcion = "R";
//     } else {
//       pOpcion = "FF";
//     }
//     listadoPedido(
//       pBodega,
//       pPedido,
//       pFechaDesde,
//       pFechaHasta,
//       pUsuario,
//       pOpcion
//     );
//   }
// }
// function listadoPedido(
//   pBodega,
//   pPedido,
//   pFechaDesde,
//   pFechaHasta,
//   pUsuario,
//   pOpcion
// ) {
//   localStorage.setItem("autoSearchPedidos", "true"); // Aquí se establece el valor 'false' para la búsqueda 

//   const params =
//     "?pBodega=" +
//     pBodega +
//     "&pFechaDesde=" +
//     pFechaDesde +
//     "&pFechaHasta=" +
//     pFechaHasta +
//     "&pUsuario=" +
//     pUsuario +
//     "&pPedido=" +
//     pPedido +
//     "&pOpcion=" +
//     pOpcion;
//   localStorage.setItem("BodegaUsuario", pBodega);
//   localStorage.setItem("parametrosBusqueda", params);
//   mostrarLoader();

//   fetch(env.API_URL + "wmsverificacionpedidos/P" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.pedidos.length != 0) {
//           ArrayData = result.pedidos;
//           console.log("Pediros");
//           console.log(ArrayData);
//           ArrayDataFiltrado = result.pedidos;
//           let cantReg = result.pedidos.length;
//           let nPag = Math.ceil(cantReg / xPag);

//           $("#tblpedido tbody").remove();

//           let htm = `<div class="row" id="totalregistros">
//             <div class="col s12"><span>Total de Registros: </span><span>${result.pedidos.length}</span></div>
//           </div>`;

//           document.getElementById("resultadoGeneral").innerHTML = htm;
//           mostrarResultadosVerificacionPedidos(nPag, 1);

//           document.getElementById("carga").innerHTML = "";
//           ocultarLoader();
//           aplicarEstilosTablaPedidos();
//         } else {
//           Swal.fire({
//             icon: "info",
//             title: "Oops...",
//             text: "No tiene pedidos pendientes!",
//             footer: '<a href="#">Why do I have this issue?</a>',
//             confirmButtonColor: "#28a745",
//           });
//           limpiarResultadoGeneral();
//           ocultarLoader();
//         }
//       } else {
//         console.log("Error en el SP");
//       }
//     });
// }
// function mostrarResultadosVerificacionPedidos(nPag, pag) {
//   let htm = "";
//   let desde = (pag - 1) * xPag;
//   let hasta = pag * xPag;

//   resultadosVerificacionPedidos(desde, hasta);
//   htm += paginadorTablas(nPag, pag, "mostrarResultadosVerificacionPedidos");
//   document.getElementById("resultadoPaginador").innerHTML = htm;
// }

// function resultadosVerificacionPedidos(desde, hasta) {
//   const bodega = document.getElementById("bodega").value; //obtener el numero de la bodega
//   const bodegaNum = bodega.split("-")[1];

//   if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) {
//     console.error("ArrayDataFiltrado no está definido o está vacío.");
//     return;
//   }

//   const tabla = document.getElementById("tblpedido");
//   let tbody = tabla.querySelector("tbody");

//   if (tbody) {
//     tbody.innerHTML = "";
//   } else {
//     tbody = document.createElement("tbody");
//     tabla.appendChild(tbody);
//   }

//   let htm = "";

//   for (let i = desde; i < hasta; i++) {
//     if (ArrayDataFiltrado[i]) {
//       let backgroundColor = i % 2 === 0 ? "" : "#fff";
//       htm += `<tr onclick="irDetallePedido('${ArrayDataFiltrado[i].DOCUMENTO}','${ArrayDataFiltrado[i].PEDIDO}','${ArrayDataFiltrado[i].ESTADO_PEDIDO}','${ArrayDataFiltrado[i].ESTADO_PREPARACION}');" style="background-color:${backgroundColor};">`;

//       // Condición para cambiar el color de la celda si ESTADO_PREPARACION es 'A'
//       let documentoColor =
//         ArrayDataFiltrado[i].ESTADO_PREPARACION === "A" ? "#FF5733" : "";
//       htm += `<td style="color:${documentoColor};">${ArrayDataFiltrado[i].DOCUMENTO}</td>`;

//       htm += `<td>${ArrayDataFiltrado[i].DESCRIPCION}</td>`;
//       htm += `<td>${parseFloat(ArrayDataFiltrado[i].TOTAL_UNIDADES).toFixed(
//         2
//       )}</td>`;
//       htm += `<td>${parseFloat(ArrayDataFiltrado[i].LINEAS_VERIFICADAS).toFixed(
//         2
//       )}</td>`;

//       if (bodegaNum >= "51" || bodegaNum === "05") {
//         // Oculta el encabezado de la columna "L PREP"
//         document.getElementById("thLPrep").hidden = false;
//         htm += `<td>${parseFloat(
//           ArrayDataFiltrado[i].LINEAS_PREPARADAS
//         ).toFixed(2)}</td>`;
//       } else {
//         // Oculta el encabezado de la columna "L PREP"
//         document.getElementById("thLPrep").hidden = true;
//         // Oculta las celdas correspondientes en todas las filas del cuerpo de la tabla
//         const filas = document.querySelectorAll("#tblpedido tbody tr");
//         filas.forEach((fila) => {
//           const celdaLPrep = fila.cells[4]; // Índice 4 para la columna L PREP
//           if (celdaLPrep) {
//             celdaLPrep.style.display = "none";
//           }
//         });
//       }

//       let cantSolicitada = parseFloat(
//         ArrayDataFiltrado[i].TOTAL_UNIDADES
//       ).toFixed(2);
//       let cantVerificada = parseFloat(
//         ArrayDataFiltrado[i].LINEAS_VERIFICADAS
//       ).toFixed(2);

//       htm += `<td>`;
//       if (cantVerificada == 0 && cantSolicitada != cantVerificada) {
//         htm += "";
//       } else if (cantSolicitada == cantVerificada) {
//         htm += '<i class="material-icons" style="color:green;">done_all</i>';
//       } else if (cantVerificada > 0 && cantSolicitada != cantVerificada) {
//         htm += '<i class="material-icons" style="color:red;">done_all</i>';
//       }
//       htm += `</td>`;
//       htm += `</tr>`;
//     }
//   }

//   tbody.innerHTML = htm; // Insertar el contenido generado en el tbody
// }
// function irDetallePedido(documento, pedido, estado, estado_preparacion) {
//   const checkbox = document.getElementById("toggleSwitch");
//   let bodega = localStorage.getItem("BodegaUsuario");
//   // Extraer solo el número de la bodega
//   let bodegaNumero = bodega.match(/\d+/)[0];

//   // console.log(bodegaNumero); // Esto mostrará "52" si el valor original era "B-52"
//   localStorage.setItem("pedidos_finalizados", checkbox.checked);
//   localStorage.setItem("documento", documento);
//   localStorage.setItem("pedidoSelect", pedido);
//   localStorage.setItem("estado", estado);
//   localStorage.setItem("EstadoPreparacion", estado_preparacion);

//   if ((bodegaNumero >= 51 && bodegaNumero <= 55) || bodegaNumero === "05") {
//     window.location.href = "detallePedidoPreparado.html";
//   } else {
//     window.location.href = "detalle_pedido.html";
//   }
// }
// ///////////// Obtener el elemento toggleSwitch de entrada tipo checkbox//////////
// /////////////// Agregar un evento de cambio al checkbox/////////////
// checkbox.addEventListener("change", function () {
//   // Imprimir el valor del checkbox en la consola
//   if (checkbox.checked === false) {
//     pedidosFinalizados();
//   } else {
//   }
//   limpiarResultadoGeneral();
// });
// /////////////////Fucnion que activa el toggleSwitch para ver los pedidos facturados y finalizados
// function pedidosFinalizados() {
//   // Mostrar el cuadro de diálogo con SweetAlert2
//   Swal.fire({
//     title: "¿Desea ver solo los pedidos finalizados?",
//     icon: "question",
//     showCancelButton: true,
//     confirmButtonText: "Sí",
//     cancelButtonText: "No",
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//   }).then((result) => {
//     // Resultado de la acción
//     if (result.isConfirmed) {
//       $("#toggleSwitch").prop("checked", false);
//     } else {
//       $("#toggleSwitch").prop("checked", true);
//     }
//   });
// }
// ////////////////////se aplican estilos a las filas cuyos documentos comienzan con 'T'. /////////////////
// function aplicarEstilosTablaPedidos() {
//   $("#tblpedido tbody tr").each(function () {
//     var documentoValue = $(this).find("td:eq(0)").text().trim();

//     if (documentoValue.startsWith("T")) {
//       $(this).find("td:eq(0)").css({
//         color: "red",
//         "font-weight": "bold",
//       });
//     }
//   });
// }
// function ocultarColumnaLPrep() {
//   const bodega = document.getElementById("bodega").value; // Ejemplo: "B-51"
//   const numeroBodega = bodega.split("-")[1]; // Esto te dará "51"

//   // Verifica si la bodega es mayor a 51 o igual a 05
//   if (numeroBodega >= 51 || numeroBodega === "05") {
//     // Oculta el encabezado de la columna "L PREP"
//     document.getElementById("thLPrep").hidden = false;
//   } else {
//     // Oculta el encabezado de la columna "L PREP"
//     document.getElementById("thLPrep").hidden = true;

//     // Oculta las celdas correspondientes en todas las filas del cuerpo de la tabla
//     const filas = document.querySelectorAll("#tblpedido tbody tr");
//     filas.forEach((fila) => {
//       const celdaLPrep = fila.cells[4]; // Índice 4 para la columna L PREP
//       if (celdaLPrep) {
//         celdaLPrep.style.display = "none";
//       }
//     });
//   }
// }
// // //limpiar el contenido de la busqueda
// function limpiarResultadoGeneral() {
//   const tabla = document.getElementById("tblpedido");
//   const resultadoPaginador = document.getElementById("resultadoPaginador");
//   const totalRegistros = document.getElementById("totalregistros");

//   // Limpiar el contenido del paginador si existe
//   if (resultadoPaginador) {
//     resultadoPaginador.innerHTML = "";
//   }

//   // Limpiar el contenido de totalRegistros si existe
//   if (totalRegistros) {
//     totalRegistros.innerHTML = "";
//   }

//   // Limpiar el contenido del tbody de la tabla si la tabla existe
//   if (tabla) {
//     let tbody = tabla.querySelector("tbody");
//     if (tbody) {
//       tbody.innerHTML = "";
//     }
//   }
// }
// const fecha_ini = document.getElementById("fecha_ini");
// fecha_ini.addEventListener("change", function () {
//   limpiarResultadoGeneral();
// });
// const fecha_fin = document.getElementById("fecha_fin");
// fecha_fin.addEventListener("change", function () {
//   limpiarResultadoGeneral();
// });

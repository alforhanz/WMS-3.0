document.addEventListener("DOMContentLoaded", function () {
  console.log("El DOM se ha cargado completamente para Picking de Traslados.");
  let busquedaFlag = localStorage.getItem("autoSearchTraslados") === "true";

  if (busquedaFlag) {
    let parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
    let mostrarPreparados = localStorage.getItem("trasladosprocesados");

    if (mostrarPreparados === "true") {
      $("#toggleSwitch").prop("checked", true);
    } else {
      $("#toggleSwitch").prop("checked", false);
    }

    const fechaIni = obtenerValorParametro(parametrosBusqueda, "fechaIni");
    const fechaFin = obtenerValorParametro(parametrosBusqueda, "fechaFin");

    if (fechaIni) document.getElementById("fecha_ini").value = fechaIni;
    if (fechaFin) document.getElementById("fecha_fin").value = fechaFin;

    setTimeout(() => {
      M.updateTextFields();
      const inputs = document.querySelectorAll(".datepicker");
      inputs.forEach((input) => {
        const fechaGuardada = input.id === "fecha_ini" ? fechaIni : fechaFin;

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

    listadoTraslados(parametrosBusqueda);
  } else {
    localStorage.clear();
  }

  const user = document.getElementById("hUsuario");
  const bodegaInput = document.getElementById("bodega");
  const bodega = bodegaInput ? bodegaInput.value : "";
  const switchEl = document.getElementById("toggleSwitch");
  const estadoSwitchTrasPrep = switchEl ? switchEl.checked : false;

  if (user) localStorage.setItem("username", user.value);
  localStorage.setItem("bodegaUser", bodega);
  localStorage.setItem("trasladosprocesados", estadoSwitchTrasPrep);
});

function obtenerValorParametro(parametros, nombreParametro) {
  if (!parametros) return null;
  const urlParams = new URLSearchParams(parametros);
  return urlParams.get(nombreParametro);
}

function verTrasladosLista() {
  const bodegaOrigen = document.getElementById("bodega") ? document.getElementById("bodega").value : "";

  if (bodegaOrigen === "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor, seleccione su bodega de origen desde el selector de cabecera.",
      confirmButtonColor: "#28a745"
    });
    return false;
  }

  const pFechaHasta = $("#fecha_fin").val() || "";
  const pFechaDesde = $("#fecha_ini").val() || "";
  const pConsecutivo = $("#pContenedor").val() || "";

  localStorage.setItem("autoSearchTraslados", "true");
  let pModulo = "WMS_PK";
  let pOpcion = "S";
  let typeRpt = "R";

  const trasladosPreparados = localStorage.getItem("trasladosprocesados");
  if (trasladosPreparados !== "true") {
    typeRpt = "TP";
  }

  const params =
    "?pModulo=" + pModulo +
    "&pOpcion=" + pOpcion +
    "&typeRpt=" + typeRpt +
    "&fechaIni=" + pFechaDesde +
    "&fechaFin=" + pFechaHasta +
    "&BodegaOrigen=" + bodegaOrigen +
    "&pConsecutivo=" + pConsecutivo;

  localStorage.setItem("parametrosBusqueda", params);
  console.log('Parametros: '+params);
  listadoTraslados(params);
}

function listadoTraslados(parametros) {
  if (typeof mostrarLoader === "function") mostrarLoader("Consultando traslados...");

  fetch(env.API_URL + "wmspreparaciondetraslados" + parametros, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta.length !== 0) {
          ArrayData = result.respuesta;
          ArrayDataFiltrado = result.respuesta;
            console.log(result);
          let resultadoGeneral = document.getElementById("resultadoGeneral");
          if (resultadoGeneral) {
            resultadoGeneral.innerHTML = `Total de Registros: <span id="lblTotalRegistros">${result.respuesta.length}</span>`;
          }

          renderizarTablaTrasladosCompleta();
          aplicarEstilosTabla();
        } else {
          limpiarResultadoGeneral();
          Swal.fire({
            icon: "info",
            title: "Sin registros",
            text: "No tiene traslados pendientes bajo estos criterios.",
            confirmButtonColor: "#28a745"
          });
        }
      } else {
        limpiarResultadoGeneral();
        console.error("Error devuelto por el SP");
      }
    })
    .catch((err) => {
      console.error("Error en la solicitud fetch de traslados:", err);
      limpiarResultadoGeneral();
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function renderizarTablaTrasladosCompleta() {
  if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) return;

  const tabla = document.getElementById("tbltraslados");
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

    let cantPrep = parseFloat(item.LINEAS_PREPARADAS) || 0;
    let cantVerif = parseFloat(item.LINEAS_VERIFICADAS) || 0;

    htm += `<tr onclick="irDetalleTraslado('${item.TRASLADO}','${item.BODEGA_DESTINO}');" style="cursor: pointer;">`;
    htm += `<td class="cell-center" style="font-weight: 700; color: #1e293b;">${item.TRASLADO || ""}</td>`;
    htm += `<td class="cell-center">${item.BODEGA_DESTINO || ""}</td>`;
    htm += `<td class="cell-number">${cantPrep.toFixed(2)}</td>`;
    htm += `<td class="cell-number">${cantVerif.toFixed(2)}</td>`;
    htm += `<td class="cell-center cell-date">${item.FECHA || ""}</td>`;
    htm += `</tr>`;
  }

  tbody.innerHTML = htm;

  // Integración con el paginador de selector desplegable
  $("#resultadoPaginador").empty();
  if ($.fn.pageMe) {
    $("#tbltraslados tbody").pageMe({
      pagerSelector: "#resultadoPaginador",
      perPage: typeof xPag !== "undefined" ? xPag : 20
    });
  }
}

function irDetalleTraslado(documento, bodegaDestino) {
  let bodegaOrigen = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let pFechaHasta = $("#fecha_fin").val() || "";
  let pFechaDesde = $("#fecha_ini").val() || "";
  let pModulo = "WMS_PK";
  let pOpcion = "S";
  let typeRpt = "D";

  const params =
    "?pModulo=" + pModulo +
    "&pOpcion=" + pOpcion +
    "&typeRpt=" + typeRpt +
    "&fechaIni=" + pFechaDesde +
    "&fechaFin=" + pFechaHasta +
    "&BodegaOrigen=" + bodegaOrigen;

  localStorage.setItem("ListParamsDetalle", params);
  localStorage.setItem("traslado", documento);
  localStorage.setItem("destinoBodegaTraslado", bodegaDestino);
  window.location.href = "detalleTrasladoPicking.html";
}

const mostrar_procesados_checkbox = document.getElementById("toggleSwitch");
if (mostrar_procesados_checkbox) {
  mostrar_procesados_checkbox.addEventListener("change", function () {
    localStorage.setItem("trasladosprocesados", mostrar_procesados_checkbox.checked);
    if (!mostrar_procesados_checkbox.checked) {
      trasladosFinalizados();
    }
    limpiarResultadoGeneral();
  });
}

function trasladosFinalizados() {
  Swal.fire({
    title: "¿Desea ver solo los traslados preparados?",
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
      localStorage.setItem("trasladosprocesados", "true");
    }
  });
}

function aplicarEstilosTabla() {
  $("#tbltraslados tbody tr").each(function () {
    var documentoValue = $(this).find("td:eq(0)").text().trim();
    if (documentoValue.startsWith("T")) {
      $(this).find("td:eq(0)").css({
        color: "#dc2626",
        "font-weight": "700"
      });
    }
  });
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tbltraslados");
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
if (fecha_ini) {
  fecha_ini.addEventListener("change", limpiarResultadoGeneral);
}

const fecha_fin = document.getElementById("fecha_fin");
if (fecha_fin) {
  fecha_fin.addEventListener("change", limpiarResultadoGeneral);
}

// document.addEventListener("DOMContentLoaded", function () {
  
//   console.log("El DOM se ha cargado completamente.");
//   let busquedaFlag = localStorage.getItem("autoSearchTraslados") === "true";

//   if (busquedaFlag) {
//     // Obtener la cadena de parámetros guardada en el localStorage
//     let parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
//     let mostrarPreparados =  localStorage.getItem("trasladosprocesados");

//     if (mostrarPreparados ==="true") {
//       $("#toggleSwitch").prop("checked", true);
//     } else {
//       $("#toggleSwitch").prop("checked", false);
//     }
//     // Extraer los valores de 'fechaIni' y 'fechaFin' de la cadena de parámetros
//     const fechaIni = obtenerValorParametro(parametrosBusqueda, "fechaIni");
//     const fechaFin = obtenerValorParametro(parametrosBusqueda, "fechaFin");

//     // Asignar los valores a los campos de fecha en el HTML
//     if(fechaIni) document.getElementById("fecha_ini").value = fechaIni;
//     if(fechaFin)document.getElementById("fecha_fin").value = fechaFin;
//      // 2. Esperar un instante para que Materialize inicialice y luego forzar el estado
//           setTimeout(() => {
//               // Forzar a los labels a subir
//               M.updateTextFields();

//               // Reinicializar los datepickers específicamente con la fecha guardada
//               const inputs = document.querySelectorAll('.datepicker');
//               inputs.forEach(input => {
//                   const fechaGuardada = input.id === 'fecha_ini' ? fechaIni : fechaFin;
                  
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


//     // Llamar a la función que realiza la búsqueda con los parámetros guardados
//     listadoTraslados(parametrosBusqueda);
//   } else {
//     // Si no hay búsqueda previa, limpiar el localStorage
//     localStorage.clear();
//   }

//   // Guardar el estado de usuario, bodega y otros datos en el localStorage
//   const user = document.getElementById("hUsuario");
//   const bodega = document.getElementById("bodega").value;
//   const estadoSwitchTrasPrep = document.getElementById("toggleSwitch").checked;
//   localStorage.setItem("username", user.value);
//   localStorage.setItem("bodegaUser", bodega);
//   localStorage.setItem("trasladosprocesados", estadoSwitchTrasPrep);
// });

// function obtenerValorParametro(parametros, nombreParametro) {
//   const urlParams = new URLSearchParams(parametros);
//   return urlParams.get(nombreParametro);
// }

// function verTrasladosLista() {
//   //revisar como toma el valor
//   var bodegaOrigen = document.getElementById("bodega").value;
//   //revisar como toma el valor
//   if (bodegaOrigen == "") {
//     Swal.fire({
//       icon: "warning",
//       title: "Advertencia",
//       text: "Por favor, seleccione su bodega de origen.",
//     });
//     return false; // Evita que se envíe el formulario
//   } else {
//     var pFechaHasta = $("#fecha_fin").val();
//     var pFechaDesde = $("#fecha_ini").val();
//     localStorage.setItem("autoSearchTraslados", "true"); // Aquí se establece el valor 'false' para la búsqueda de los traslados
//     // let pModulo = "WMS_VP";
//      let pModulo = "WMS_PK";
//     let pOpcion = "S";
//     let typeRpt = "R";

//     const trasladosPreparados = localStorage.getItem("trasladosprocesados");
//     if (trasladosPreparados != "true") {
//       typeRpt = "TP";
//     }
//     const params =
//       "?pModulo=" +
//       pModulo +
//       "&pOpcion=" +
//       pOpcion +
//       "&typeRpt=" +
//       typeRpt +
//       "&fechaIni=" +
//       pFechaDesde +
//       "&fechaFin=" +
//       pFechaHasta +
//       "&BodegaOrigen=" +
//       bodegaOrigen;
//     localStorage.setItem("parametrosBusqueda", params);

//     listadoTraslados(params);
//   }
// } //Fin de ver traslados lista
// function listadoTraslados(parametros) {
//   mostrarLoader();
// fetch(env.API_URL + "wmspreparaciondetraslados" + parametros, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         console.log("TRASLADOS");
//         console.log(result.respuesta);
//         if (result.respuesta.length != 0) {
//           ArrayData = result.respuesta;
//           ArrayDataFiltrado = result.respuesta;
//           let cantReg = result.respuesta.length;
//           let nPag = Math.ceil(cantReg / xPag);
//           $("#tbltraslados tbody").remove();   
//           let resultadoGeneral = document.getElementById("resultadoGeneral");
//           if (resultadoGeneral) {
//             let htm = `<div class="row" id="totalregistros">
//                             <div class="col s12"><span>Total de Registros: </span><span>${result.respuesta.length}</span></div>
//                          </div>`;
//             resultadoGeneral.innerHTML = htm;
//           } else {
//             console.error("El elemento #resultadoGeneral no existe en el DOM.");
//           }

//           mostrarResultadosVerificacionTraslados(nPag, 1);

//           document.getElementById("carga").innerHTML = "";
//           ocultarLoader();
//           aplicarEstilosTabla();
//         } else {
//           Swal.fire({
//             icon: "info",
//             title: "Oops...",
//             text: "No tiene traslados pendientes!",           
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
// function mostrarResultadosVerificacionTraslados(nPag, pag) {
//   let htm = "";
//   let desde = (pag - 1) * xPag;
//   let hasta = pag * xPag;

//   resultadosVerificacionTraslados(desde, hasta);
//   htm += paginadorTablas(nPag, pag, "mostrarResultadosVerificacionTraslados");
//   document.getElementById("resultadoPaginador").innerHTML = htm;
// }
// function resultadosVerificacionTraslados(desde, hasta) {
//   if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) {
//     console.error("ArrayDataFiltrado no está definido o está vacío.");
//     return;
//   }

//   const tabla = document.getElementById("tbltraslados");
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
//       //let backgroundColor = i % 2 === 0 ? "" : "#fff";
//       let backgroundColor = i % 2 === 0 ? "" : "#D7D5D5";
//       //htm += `<tr onclick="irDetalleTraslado('${ArrayDataFiltrado[i].TRASLADO}','${ArrayDataFiltrado[i].PEDIDO}','${ArrayDataFiltrado[i].ESTADO_PEDIDO}','${ArrayDataFiltrado[i].ESTADO_PREPARACION}');" style="background-color:${backgroundColor};">`;
//       htm += `<tr onclick="irDetalleTraslado('${ArrayDataFiltrado[i].TRASLADO}','${ArrayDataFiltrado[i].BODEGA_DESTINO}');" style="background-color:${backgroundColor};">`;
//       htm += `<td>${ArrayDataFiltrado[i].TRASLADO}</td>`;
//       htm += `<td >${ArrayDataFiltrado[i].BODEGA_DESTINO}</td>`;
//         htm += `<td>${ArrayDataFiltrado[i].LINEAS_PREPARADAS}</td>`;
//       htm += `<td>${ArrayDataFiltrado[i].LINEAS_VERIFICADAS}</td>`;    
//       htm += `<td>${ArrayDataFiltrado[i].FECHA}</td>`;
//       htm += `</tr>`;
//     }
//   }
//   tbody.innerHTML = htm; // Insertar el contenido generado en el tbody
// }
// function irDetalleTraslado(documento, bodegaDestino) {
//   let bodegaOrigen = document.getElementById("bodega").value;
//   let pFechaHasta = $("#fecha_fin").val();
//   let pFechaDesde = $("#fecha_ini").val();
//   let pModulo = "WMS_PK";
//   let pOpcion = "S";
//   let typeRpt = "D";  
//   const params =
//     "?pModulo=" +
//     pModulo +
//     "&pOpcion=" +
//     pOpcion +
//     "&typeRpt=" +
//     typeRpt +
//     "&fechaIni=" +
//     pFechaDesde +
//     "&fechaFin=" +
//     pFechaHasta +
//     "&BodegaOrigen=" +
//     bodegaOrigen;
//   localStorage.setItem("ListParamsDetalle", params);
//   localStorage.setItem("traslado", documento);
//   localStorage.setItem("destinoBodegaTraslado", bodegaDestino);
//   window.location.href = "detalleTrasladoPicking.html";
// }
// ////flag para mostrar los traslados de entrada o de salida
// const mostrar_procesados_checkbox = document.getElementById("toggleSwitch");
// /////////////// Agregar un evento de cambio al checkbox/////////////
// mostrar_procesados_checkbox.addEventListener("change", function () {
//   localStorage.setItem(
//     "trasladosprocesados",
//     mostrar_procesados_checkbox.checked
//   );
//   if (mostrar_procesados_checkbox.checked === false) {
//     trasladosFinalizados();
//   } else {
//   }
//   limpiarResultadoGeneral();
// });
// /////////////////Fucnion que activa el toggleSwitch para ver los traslados Preparados
// function trasladosFinalizados() {
//   // Mostrar el cuadro de diálogo con SweetAlert2
//   Swal.fire({
//     title: "¿Desea ver solo los traslados preparados?",
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
//       localStorage.setItem("trasladosprocesados", "true");
//     }
//   });
// }
// function aplicarEstilosTabla() {
//   $("#tbltraslados tbody tr").each(function () {
//     var documentoValue = $(this).find("td:eq(0)").text().trim();

//     if (documentoValue.startsWith("T")) {
//       $(this).find("td:eq(0)").css({
//         color: "red",
//         "font-weight": "bold",
//       });
//     }
//   });
// }
// // //limpiar el contenido de la busqueda
// function limpiarResultadoGeneral() {
//   const tabla = document.getElementById("tbltraslados");
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

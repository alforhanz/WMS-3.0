const checkbox = document.getElementById("toggleSwitch");

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado para Verificación de Picking");
  const busqueda = localStorage.getItem("autoSearchPedidos");

  if (busqueda === "true") {
    const parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
    if (parametrosBusqueda) {
      const params = new URLSearchParams(parametrosBusqueda);

      const pBodega = params.get("pBodega");
      const pFechaDesde = params.get("pFechaDesde");
      const pFechaHasta = params.get("pFechaHasta");
      const pUsuario = params.get("pUsuario");
      const pPedido = params.get("pPedido");
      const pOpcion = params.get("pOpcion");

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

      if (pOpcion === "FPK") {
        $("#toggleSwitch").prop("checked", false);
      } else {
        $("#toggleSwitch").prop("checked", true);
      }

      listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion);
    } else {
      localStorage.clear();
    }
  }
});

function validarFormulario() {
  const bodegaInput = document.getElementById("bodega");
  const bodega = bodegaInput ? bodegaInput.value : "";

  if (bodega === "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor, seleccione una bodega.",
      confirmButtonColor: "#28a745"
    });
    return false;
  }

  const pBodega = bodega;
  const pPedido = $("#pPedido").val() || "";
  const pFechaHasta = $("#fecha_fin").val() || "";
  const pFechaDesde = $("#fecha_ini").val() || "";
  const hUser = document.getElementById("hUsuario");
  const pUsuario = hUser ? hUser.value : "";
  const switchActivo = $("#toggleSwitch").prop("checked");
  const pOpcion = switchActivo ? "EPK" : "FPK";

  listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion);
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

  if (typeof mostrarLoader === "function") mostrarLoader("Buscando pedidos para picking...");

  fetch(env.API_URL + "wmsverificacionpedidos/P" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.pedidos && result.pedidos.length !== 0) {
          ArrayData = result.pedidos;
          ArrayDataFiltrado = result.pedidos;
          console.log(result);

          const htm = `Total de Registros: <span id="lblTotalRegistros">${result.pedidos.length}</span>`;
          document.getElementById("resultadoGeneral").innerHTML = htm;

          renderizarTablaPickingCompleta();

          if (typeof ocultarLoader === "function") ocultarLoader();
          aplicarEstilosTablaPedidos();
        } else {
          Swal.fire({
            icon: "info",
            title: "Sin pedidos",
            text: "No tiene pedidos pendientes bajo estos criterios de picking.",
            confirmButtonColor: "#28a745"
          });
          limpiarResultadoGeneral();
          if (typeof ocultarLoader === "function") ocultarLoader();
        }
      } else {
        console.error("Error devuelto por el SP");
        if (typeof ocultarLoader === "function") ocultarLoader();
      }
    })
    .catch((error) => {
      console.error("Error Fetch en pedidos de picking:", error);
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function renderizarTablaPickingCompleta() {
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

  for (let i = 0; i < ArrayDataFiltrado.length; i++) {
    const item = ArrayDataFiltrado[i];

    // Sanitización de números (.00, 1.00000000, etc.)
    let rawSol = String(item.TOTAL_UNIDADES || "0").trim();
    let rawVer = String(item.LINEAS_VERIFICADAS || "0").trim();
    let rawPrep = String(item.LINEAS_PREPARADAS || "0").trim();

    if (rawSol.startsWith(".")) rawSol = "0" + rawSol;
    if (rawVer.startsWith(".")) rawVer = "0" + rawVer;
    if (rawPrep.startsWith(".")) rawPrep = "0" + rawPrep;

    const cantSolicitada = parseFloat(rawSol) || 0;
    const cantVerificada = parseFloat(rawVer) || 0;
    const cantPreparada = parseFloat(rawPrep) || 0;

    // Para picking se evalúa el avance contra lo preparado/verificado
    const cantControl = cantPreparada > 0 ? cantPreparada : cantVerificada;

    const documentoClase = item.ESTADO_PREPARACION === "A" ? "cell-origen" : "";

    htm += `<tr onclick="irDetallePedido('${item.DOCUMENTO}','${item.PEDIDO}','${item.ESTADO_PEDIDO}');" style="cursor: pointer;">`;
    htm += `<td class="cell-center ${documentoClase}">${item.DOCUMENTO || ""}</td>`;
    htm += `<td style="text-align: left; white-space: normal;">${item.DESCRIPCION || item.CLIENTE || ""}</td>`;
    htm += `<td class="cell-number">${cantSolicitada.toFixed(2)}</td>`;
    htm += `<td class="cell-number">${cantControl.toFixed(2)}</td>`;

    // Columna Verificado con done_all
    htm += `<td class="cell-center">`;
    if (cantControl === 0) {
      htm += ``;
    } else if (cantControl >= cantSolicitada) {
      htm += `<i class="material-icons" style="color: #28a745 !important; font-size: 22px; line-height: 1; vertical-align: middle; display: inline-block;">done_all</i>`;
    } else if (cantControl > 0 && cantControl < cantSolicitada) {
      htm += `<i class="material-icons" style="color: #e53935 !important; font-size: 22px; line-height: 1; vertical-align: middle; display: inline-block;">done_all</i>`;
    }
    htm += `</td>`;

    htm += `</tr>`;
  }

  tbody.innerHTML = htm;

  // Paginación con pageMe
  const contenedorPaginador = $("#resultadoPaginador");
  contenedorPaginador.empty();
  contenedorPaginador.html('<ul class="pagination" id="paginador-ul" style="display:flex; justify-content:center;"></ul>');

  try {
    if ($.fn.pageMe) {
      $("#tblpedido tbody").pageMe({
        pagerSelector: "#paginador-ul",
        showPrevNext: true,
        hidePageNumbers: false,
        perPage: typeof xPag !== "undefined" ? xPag : 20
      });
    }
  } catch (error) {
    console.error("Error inicializando paginador pageMe:", error);
  }
}

function irDetallePedido(documento, pedido, estado) {
  const switchEl = document.getElementById("toggleSwitch");
  const bodegaInput = document.getElementById("bodega");
  const bodega = bodegaInput ? bodegaInput.value : "";
  const matchNum = bodega.match(/\d+/);
  const bodegaNumero = matchNum ? parseInt(matchNum[0], 10) : 0;
  const bodegaRaw = matchNum ? matchNum[0] : "";

  localStorage.setItem("pedidos_finalizados", switchEl ? switchEl.checked : false);
  localStorage.setItem("documento", documento);
  localStorage.setItem("pedidoSelect", pedido);
  localStorage.setItem("estado", estado);

  // Redirección especial según la regla de bodegas de picking: >= 51 o 05
  if ((bodegaNumero >= 51 && bodegaNumero <= 55) || bodegaRaw === "05" || bodega.includes("05")) {
    window.location.href = "preparacionPicking.html";
  } else {
    Swal.fire({
      icon: "info",
      title: "Bodega no compatible",
      text: "La preparación de picking solo aplica para bodegas Norwing (>= 51) o bodega 05.",
      confirmButtonColor: "#28a745"
    });
  }
}

if (checkbox) {
  checkbox.addEventListener("change", function () {
    if (!checkbox.checked) {
      pedidosFinalizados();
    }
    limpiarResultadoGeneral();
  });
}

function pedidosFinalizados() {
  Swal.fire({
    title: "¿Desea ver solo los pedidos preparados?",
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
    }
  });
}

function aplicarEstilosTablaPedidos() {
  $("#tblpedido tbody tr").each(function () {
    const documentoValue = $(this).find("td:eq(0)").text().trim();
    if (documentoValue.startsWith("T")) {
      $(this).find("td:eq(0)").css({
        color: "#e51c23",
        "font-weight": "bold"
      });
    }
  });
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblpedido");
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


// const checkbox = document.getElementById("toggleSwitch");


// document.addEventListener("DOMContentLoaded", function () {
//   console.log("DOM completamente cargado y parseado.");
//   const busqueda = localStorage.getItem("autoSearchPedidos");

//   //revisar como toma el valor
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

//       if (pOpcion === "FPK") {
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
//       mostrarLoader();
//   }else{
//     localStorage.clear();
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
//       pOpcion = "EPK";
//     } else {
//       pOpcion = "FPK";
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
//   localStorage.setItem("autoSearchPedidos", "true"); // Aquí se establece el valor 'false' para la búsqueda de las órdenes de compra
// mostrarLoader();
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
//   //mostrarLoader();

//   fetch(env.API_URL + "wmsverificacionpedidos/P" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.pedidos.length != 0) {
//           ArrayData = result.pedidos;
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
//       htm += `<tr onclick="irDetallePedido('${ArrayDataFiltrado[i].DOCUMENTO}','${ArrayDataFiltrado[i].PEDIDO}','${ArrayDataFiltrado[i].ESTADO_PEDIDO}');" style="background-color:${backgroundColor};">`;
//       htm += `<td>${ArrayDataFiltrado[i].DOCUMENTO}</td>`;
//       htm += `<td>${ArrayDataFiltrado[i].DESCRIPCION}</td>`;
//       htm += `<td>${parseFloat(ArrayDataFiltrado[i].TOTAL_UNIDADES).toFixed(
//         2
//       )}</td>`;
//       htm += `<td>${parseFloat(ArrayDataFiltrado[i].LINEAS_VERIFICADAS).toFixed(
//         2
//       )}</td>`;

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

//   tbody.innerHTML = htm;
//   document.getElementById("carga").innerHTML = "";
// }

// //////////////////FUNCION PARA MOSTRAR EL DETALLE DE LOS PEDIDOS///////////
// function irDetallePedido(documento, pedido, estado) {
//   const checkbox = document.getElementById("toggleSwitch");
//   //   let bodega = localStorage.getItem('BodegaUsuario');
//   let bodega = document.getElementById("bodega").value;
//   // Extraer solo el número de la bodega
//   let bodegaNumero = bodega.match(/\d+/)[0];

//   console.log(bodegaNumero); // Esto mostrará "52" si el valor original era "B-52"
//   localStorage.setItem("pedidos_finalizados", checkbox.checked);
//   localStorage.setItem("documento", documento);
//   localStorage.setItem("pedidoSelect", pedido);
//   localStorage.setItem("estado", estado);

//   if ((bodegaNumero >= 51 && bodegaNumero <= 55) || bodegaNumero === "05") {
//     window.location.href = "preparacionPicking.html";
//   } else {
//     //window.location.href = 'detalle_pedido.html';
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

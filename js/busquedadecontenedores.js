document.addEventListener("DOMContentLoaded", function () {
  localStorage.removeItem("switchLecturaState_Contenedor");

  const busqueda = localStorage.getItem("SearchParameterFlag");
  if (busqueda === "true") {
    const parametrosBusqueda = localStorage.getItem("parametrosBusquedaContenedor");

    if (parametrosBusqueda) {
      const params = new URLSearchParams(parametrosBusqueda);
      const pSistema = params.get("pSistema") ?? "";
      const pUsuario = params.get("pUsuario") ?? "";
      const pOpcion = params.get("pOpcion") ?? "";
      const pBodegaEnvia = params.get("pBodegaEnvia") ?? "";
      const pBodegaDestino = params.get("pBodegaSolicita") ?? "";
      const pConsecutivo = "";
      const pEstado = "";
      const pFechaDesde = params.get("pFechaDesde") ?? "";
      const pFechaHasta = params.get("pFechaHasta") ?? "";

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

      enviarDatosControlador(
        pSistema,
        pUsuario,
        pOpcion,
        pBodegaEnvia,
        pBodegaDestino,
        pConsecutivo,
        pEstado,
        pFechaDesde,
        pFechaHasta
      );
    }
  }
  cargarBodegas();
});

function cargarBodegas() {
  fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra")
    .then((response) => response.json())
    .then((data) => {
      const bodegasSelect = document.getElementById("bodegaSelectOC");
      if (!bodegasSelect) return;

      if (data.respuesta && Array.isArray(data.respuesta)) {
        bodegasSelect.innerHTML = '<option value="" disabled selected>Seleccione una bodega</option>';

        data.respuesta.forEach((bodega) => {
          const option = document.createElement("option");
          option.value = bodega.BODEGA;
          option.textContent = `${bodega.BODEGA} - ${bodega.NOMBRE}`;
          bodegasSelect.appendChild(option);
        });

        // Restaurar selección previa si existe en parámetros guardados
        const parametrosBusqueda = localStorage.getItem("parametrosBusquedaContenedor");
        if (parametrosBusqueda) {
          const params = new URLSearchParams(parametrosBusqueda);
          const pBodegaDestino = params.get("pBodegaSolicita");
          if (pBodegaDestino) bodegasSelect.value = pBodegaDestino;
        }
      }
    })
    .catch((error) => console.error("Error al cargar las bodegas:", error));
}

function validarBusquedaContenedor() {
  var bodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  if (bodega === "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor, seleccione una bodega origen desde el selector de cabecera.",
      confirmButtonColor: "#28a745"
    });
    return false;
  }

  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pOpcion = "E";
  let pBodegaEnvia = bodega;
  let pBodegaDestino = document.getElementById("bodegaSelectOC").value;
  let pConsecutivo = document.getElementById("pContenedor").value.trim();
  let pEstado = "";
  let pFechaDesde = $("#fecha_ini").val() || "";
  let pFechaHasta = $("#fecha_fin").val() || "";

  enviarDatosControlador(
    pSistema,
    pUsuario,
    pOpcion,
    pBodegaEnvia,
    pBodegaDestino,
    pConsecutivo,
    pEstado,
    pFechaDesde,
    pFechaHasta
  );
}

function enviarDatosControlador(
  pSistema,
  pUsuario,
  pOpcion,
  pBodegaEnvia,
  pBodegaDestino,
  pConsecutivo,
  pEstado,
  pFechaDesde,
  pFechaHasta
) {
  const params =
    "?pSistema=" + pSistema +
    "&pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pBodegaEnvia=" + pBodegaEnvia +
    "&pBodegaSolicita=" + pBodegaDestino +
    "&pConsecutivo=" + pConsecutivo +
    "&pEstado=" + pEstado +
    "&pFechaDesde=" + pFechaDesde +
    "&pFechaHasta=" + pFechaHasta;

  localStorage.setItem("parametrosBusquedaContenedor", params);
  localStorage.setItem("SearchParameterFlag", "true");

  if (typeof mostrarLoader === "function") mostrarLoader("Consultando contenedores...");

  fetch(env.API_URL + "contenedor" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta.length > 0) {
          ArrayData = result.contenerespuestador;
          ArrayDataFiltrado = result.respuesta;

          document.getElementById("resultadoGeneral").innerHTML = 
            `Total de Registros: <span id="lblTotalRegistros">${ArrayDataFiltrado.length}</span>`;

          renderizarTablaContenedoresCompleta();
          if (typeof ocultarLoader === "function") ocultarLoader();
        } else {
          limpiarResultadoGeneral();
          Swal.fire({
            icon: "info",
            title: "Sin registros",
            text: "No se encontraron contenedores para los criterios especificados.",
            confirmButtonColor: "#28a745"
          });
          if (typeof ocultarLoader === "function") ocultarLoader();
        }
      } else {
        limpiarResultadoGeneral();
        Swal.fire({
          icon: "error",
          title: "Consulta no completada",
          text: "El servicio no devolvió resultados válidos.",
          confirmButtonColor: "#ef4444"
        });
        if (typeof ocultarLoader === "function") ocultarLoader();
      }
    })
    .catch((error) => {
      console.error("Error en la solicitud fetch:", error);
      limpiarResultadoGeneral();
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "Ocurrió un error al consultar los datos del servidor.",
        confirmButtonColor: "#ef4444"
      });
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function renderizarTablaContenedoresCompleta() {
  if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) return;

  const tabla = document.getElementById("tblcontenedores");
  if (!tabla) return;

  let tbody = tabla.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    tabla.appendChild(tbody);
  }

  tbody.innerHTML = "";
  let htm = "";

  let parametrosBusqueda = localStorage.getItem("parametrosBusquedaContenedor");
  let pOpcion = "E";
  if (parametrosBusqueda) {
    const p = new URLSearchParams(parametrosBusqueda);
    pOpcion = p.get("pOpcion") || "E";
  }

  for (let i = 0; i < ArrayDataFiltrado.length; i++) {
    const key = ArrayDataFiltrado[i];

    let cantSol = parseFloat(key.LineaConsecutivo) || 0;
    let cantLeida = pOpcion === "A" 
      ? (parseFloat(key.LineaPreparada) || 0) 
      : (parseFloat(key.LineaContada) || 0);

    htm += `<tr onclick="irDetalleContenedor('${key.Contenedor}','${pOpcion}','${key.Bodega_Solicita}','${key.Estado_Pdt}')" style="cursor: pointer;">`;
    htm += `<td class="cell-center" style="font-weight: 700; color: #1e293b;">${key.Contenedor || ""}</td>`;
    htm += `<td class="cell-number">${cantSol.toFixed(2)}</td>`;
    htm += `<td class="cell-number">${cantLeida.toFixed(2)}</td>`;
    htm += `<td class="cell-center">${key.Bodega_Solicita || ""}</td>`;
    htm += `<td class="cell-center cell-date">${key.Fecha_Creacion || ""}</td>`;
    htm += `</tr>`;
  }

  tbody.innerHTML = htm;

  // Inicialización del nuevo paginador integrado
  $("#resultadoPaginador").empty();
  if ($.fn.pageMe) {
    $("#tblcontenedores tbody").pageMe({
      pagerSelector: "#resultadoPaginador",
      perPage: typeof xPag !== "undefined" ? xPag : 20
    });
  }
}

function irDetalleContenedor(pTraslado, pOpcion, Bodega_Solicita, Estado_Pdt) {
  localStorage.setItem("contenedor", pTraslado);
  localStorage.setItem("bodega_solicita", Bodega_Solicita);
  localStorage.setItem("contenDetalleOPC", pOpcion);
  localStorage.setItem("estado_Pdt", Estado_Pdt);
  window.location.href = "lineasContenedor.html";
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblcontenedores");
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

function refrescaPantalla() {
  localStorage.removeItem("SearchParameterFlag");
  localStorage.removeItem("parametrosBusquedaContenedor");
  window.location.reload();
}

function mostrarInfo() {
  Swal.fire({
    title: "<strong>Guía de Búsqueda de Contenedores</strong>",
    icon: "info",
    html: `
      <div style="text-align: left; font-size: 13.5px; line-height: 1.55; max-height: 400px; overflow-y: auto; padding-right: 6px;">
        <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 0;">
          Criterios de Consulta
        </h6>
        <p style="margin: 4px 0;">• <strong>N° de Contenedor:</strong> Opcional. Ingrese el código exacto para localizar un contenedor específico.</p>
        <p style="margin: 4px 0;">• <strong>Rango de Fechas:</strong> Filtra por el periodo en que fue creado el contenedor.</p>
        <p style="margin: 4px 0;">• <strong>Bodega Destino:</strong> Opcional. Permite segmentar por la sucursal de destino.</p>

        <h6 style="font-weight: bold; color: #1b676b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 14px;">
          Flujo de Trabajo
        </h6>
        <p style="margin: 4px 0;">1. Haga clic en <strong>Mostrar Contenedores</strong> para cargar la lista.</p>
        <p style="margin: 4px 0;">2. Seleccione cualquier fila para ingresar al detalle de líneas del contenedor (<code>lineasContenedor.html</code>).</p>
      </div>
    `,
    showCloseButton: true,
    confirmButtonColor: "#28a745",
    confirmButtonText: "Entendido"
  });
}

// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// document.addEventListener("DOMContentLoaded", function () {
//   localStorage.removeItem("switchLecturaState_Contenedor");

//   const busqueda = localStorage.getItem("SearchParameterFlag");
//   if (busqueda === "true") {
//     const parametrosBusqueda = localStorage.getItem(
//       "parametrosBusquedaContenedor",
//     );

//     if (parametrosBusqueda) {
//       const params = new URLSearchParams(parametrosBusqueda);
//       const pSistema = params.get("pSistema") ?? "";
//       const pUsuario = params.get("pUsuario") ?? "";
//       const pOpcion = params.get("pOpcion") ?? "";
//       const pBodegaEnvia = params.get("pBodegaEnvia") ?? "";
//       const pBodegaDestino = params.get("pBodegaSolicita") ?? "";
//       const pConsecutivo= "";
//       const pEstado = "";
//       const pFechaDesde = params.get("pFechaDesde") ?? "";
//       const pFechaHasta = params.get("pFechaHasta") ?? "";

//       // Establecer los valores de los campos de fecha
//       if (pFechaDesde) document.getElementById("fecha_ini").value = pFechaDesde;
//       if (pFechaHasta) document.getElementById("fecha_fin").value = pFechaHasta;
//       if (pBodegaDestino)
//         document.getElementById("bodegaSelectOC").value = pBodegaDestino;
//       // 2. Esperar un instante para que Materialize inicialice y luego forzar el estado
//       setTimeout(() => {
//         // Forzar a los labels a subir
//         M.updateTextFields();

//         // Reinicializar los datepickers específicamente con la fecha guardada
//         const inputs = document.querySelectorAll(".datepicker");
//         inputs.forEach((input) => {
//           const fechaGuardada =
//             input.id === "fecha_ini" ? pFechaDesde : pFechaHasta;

//           if (fechaGuardada) {
//             // Crear objeto fecha (importante añadir la hora para evitar desfases de zona horaria)
//             const dateParts = fechaGuardada.split("-"); // Asumiendo YYYY-MM-DD
//             const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

//             M.Datepicker.init(input, {
//               format: "yyyy-mm-dd",
//               defaultDate: d,
//               setDefaultDate: true, // Esto obliga al calendario a mostrar la fecha
//               autoClose: true,
//             });
//           }
//         });
//       }, 100);

//               enviarDatosControlador(
//               pSistema,
//               pUsuario,
//               pOpcion,
//               pBodegaEnvia,
//               pBodegaDestino,
//               pConsecutivo,
//               pEstado,
//               pFechaDesde,
//               pFechaHasta,
//             );
//     }
//   }
//   cargarBodegas();
// });
// // Función para cargar las bodegas
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function cargarBodegas() {
//   fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra")
//     .then((response) => response.json())
//     .then((data) => {
//       const bodegasSelect = document.getElementById("bodegaSelectOC");
//       if (data.respuesta && Array.isArray(data.respuesta)) {
//         // Limpiar las opciones existentes
//         bodegasSelect.innerHTML =
//           '<option value="" disabled selected>Seleccione una bodega</option>';

//         // Agregar opciones nuevas
//         data.respuesta.forEach((bodega) => {
//           const option = document.createElement("option");
//           option.value = bodega.BODEGA;
//           option.textContent = bodega.NOMBRE;
//           bodegasSelect.appendChild(option);
//         });

//         // Re-inicializar el select para aplicar los cambios
//         M.FormSelect.init(bodegasSelect);
//       } else {
//         console.error("No se encontraron bodegas.");
//       }
//     })
//     .catch((error) => console.error("Error al cargar las bodegas:", error));
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function validarBusquedaContenedor() {
//   var bodega = document.getElementById("bodega").value;
//   if (bodega === "") {
//     Swal.fire({
//       icon: "warning",
//       title: "Advertencia",
//       text: "Por favor, seleccione una bodega.",
//     });
//     return false;
//   }

//   let switchContenedor = localStorage.getItem("contenedorSwitch");
//   let pSistema = "WMS";
//   let pUsuario = document.getElementById("hUsuario").value;
//   // let pOpcion = switchContenedor === "false" ? "A" : "E";
//    let pOpcion ="E";
//   let pBodegaEnvia = document.getElementById("bodega").value;
//   let pBodegaDestino = document.getElementById("bodegaSelectOC").value;
//   let pConsecutivo ="";
//   let pEstado ="";
//   let pFechaDesde = $("#fecha_ini").val();
//   let pFechaHasta = $("#fecha_fin").val();

//   enviarDatosControlador(
//     pSistema,
//     pUsuario,
//     pOpcion,
//     pBodegaEnvia,
//     pBodegaDestino,
//     pConsecutivo,
//     pEstado,
//     pFechaDesde,
//     pFechaHasta,
//   );
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function enviarDatosControlador(
//   pSistema,
//   pUsuario,
//   pOpcion,
//   pBodegaEnvia,
//   pBodegaDestino,
//   pConsecutivo,
//   pEstado,
//   pFechaDesde,
//   pFechaHasta,
// ) {
//   const params =
//     "?pSistema=" +
//     pSistema +
//     "&pUsuario=" +
//     pUsuario +
//     "&pOpcion=" +
//     pOpcion +
//     "&pBodegaEnvia=" +
//     pBodegaEnvia +
//     "&pBodegaSolicita=" +
//     pBodegaDestino +
//     "&pConsecutivo="+
//     pConsecutivo+
//     "&pEstado="+
//     pEstado+
//     "&pFechaDesde=" +
//     pFechaDesde +
//     "&pFechaHasta=" +
//     pFechaHasta;

//   localStorage.setItem("parametrosBusquedaContenedor", params);
//   localStorage.setItem("SearchParameterFlag", "true");

//   let pag = 1;

//   mostrarLoader();
//   fetch(env.API_URL + "contenedor" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//             console.log("Datos de la API:", result); // Depuración
//       if (result.msg === "SUCCESS") {
//         if (result.contenedor && result.contenedor.length > 0) {
//           ArrayData = result.contenedor;
//           ArrayDataFiltrado = result.contenedor;
//           let cantReg = ArrayDataFiltrado.length;
//           let nPag = Math.ceil(cantReg / xPag);
//           // Mostrar total de registros
//           const htm = `<div class="row" id="totalregistros">
//             <div class="col s12"><span>Total de Registros: </span><span>${cantReg}</span></div>
//           </div>`;
//           document.getElementById("resultadoGeneral").innerHTML = htm;

//           // Limpiar tabla antes de renderizar
//           const tabla = document.getElementById("tblcontenedores");
//           let tbody = tabla.querySelector("tbody");
//           if (tbody) {
//             tbody.innerHTML = "";
//           } else {
//             tbody = document.createElement("tbody");
//             tabla.appendChild(tbody);
//           }

//           // Mostrar resultados y paginación
//           mostrarResultadosVerificacionContenedores(nPag, pag);
//           document.getElementById("carga").innerHTML = "";
//           ocultarLoader();
//           aplicarEstilosTabla();

//           // Inicializar select de Materialize CSS
//           M.FormSelect.init(document.querySelectorAll(".paginador-select"));
//         } else {
//           document.getElementById("resultadoGeneral").innerHTML = "";
//           document.getElementById("resultadoPaginador").innerHTML = "";

//           Swal.fire({
//             icon: "info",
//             title: "Información",
//             text: "No hay registros asignados para el usuario: " + pUsuario,
//             confirmButtonColor: "#28a745",
//           }).then((result) => {
//             if (result.isConfirmed) {
//               //localStorage.removeItem('parametrosBusquedaContenedor');
//               //localStorage.removeItem('SearchParameterFlag');
//               //window.location.reload();
//             }
//           });
//           ocultarLoader();
//         }
//       } else {
//         document.getElementById("resultadoGeneral").innerHTML = "";
//         document.getElementById("resultadoPaginador").innerHTML = "";
//         Swal.fire({
//           icon: "info",
//           title: "Información",
//           text: "Fallo en el API",
//           confirmButtonColor: "#28a745",
//         });
//         ocultarLoader();
//       }
//     })
//     .catch((error) => {
//       console.error("Error en la solicitud fetch:", error);
//       document.getElementById("resultadoGeneral").innerHTML = "";
//       document.getElementById("resultadoPaginador").innerHTML = "";
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "Ocurrió un error al consultar los datos.",
//         confirmButtonColor: "#28a745",
//       });
//       ocultarLoader();
//     });
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function mostrarResultadosVerificacionContenedores(nPag, pag) {
//   let desde = (pag - 1) * xPag;
//   let hasta = pag * xPag;

//   ////console.log("Mostrando página:", pag, "desde:", desde, "hasta:", hasta); // Depuración
//   resultadosVerificacionContenedores(desde, hasta);

//   let htm = paginadorTablasContenedor(
//     nPag,
//     pag,
//     "mostrarResultadosVerificacionContenedores",
//   );
//   document.getElementById("resultadoPaginador").innerHTML = htm;

//   // Inicializar select de Materialize CSS
//   M.FormSelect.init(document.querySelectorAll(".paginador-select"));
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function resultadosVerificacionContenedores(desde, hasta) {
//   let parametrosBusqueda = localStorage.getItem("parametrosBusquedaContenedor");
//   let pOpcion = "";
//   if (parametrosBusqueda) {
//     const params = new URLSearchParams(parametrosBusqueda);
//     pOpcion = params.get("pOpcion");
//   }

//   // Asegúrate de que ArrayDataFiltrado esté definido y tenga datos
//   if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) {
//     console.error("ArrayDataFiltrado no está definido o está vacío.");
//     return;
//   }

//   // Obtener la tabla y su tbody
//   const tabla = document.getElementById("tblcontenedores");
//   let tbody = tabla.querySelector("tbody");

//   // Limpiar el tbody existente o crear uno nuevo
//   if (tbody) {
//     tbody.innerHTML = "";
//   } else {
//     tbody = document.createElement("tbody");
//     tabla.appendChild(tbody);
//   }

//   let htm = "";
//   for (let i = desde; i < hasta && i < ArrayDataFiltrado.length; i++) {
//     const key = ArrayDataFiltrado[i];
//     let backgroundColor = i % 2 === 0 ? "" : "#D7D5D5";

//     htm += `<tr onclick="irDetalleContenedor('${key.Contenedor}','${pOpcion}', '${key.Bodega_Solicita}','${key.Estado_Pdt}')" style="background-color:${backgroundColor};">`;
//     //CONTENEDOR
//     htm += `<td>${key.Contenedor || ""}</td>`;
//     //CANT SOLICITADA
//     htm += `<td>${Number(key.LineaConsecutivo || 0).toFixed(2)}</td>`;
//     htm += `<td>${
//       pOpcion === "A"
//         ? Number(key.LineaPreparada || 0).toFixed(2)
//         : Number(key.LineaContada || 0).toFixed(2)
//     }</td>`;
//     htm += `<td>${key.Bodega_Solicita || ""}</td>`;
//     htm += `<td>${key.Fecha_Creacion || ""}</td>`;
//     htm += `</tr>`;
//   }
//   tbody.innerHTML = htm; // Insertar el contenido generado en el tbody
//   document.getElementById("carga").innerHTML = ""; // Limpiar el elemento carga
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function paginadorTablasContenedor(nPag, pag, dynamicFunction) {
//   let sel = `<select class="browser-default paginador-select" onchange="${dynamicFunction}(${nPag}, this.value)">
//               <option value="" disabled selected>Páginas</option>`;
//   for (let i = 1; i <= nPag; i++) {
//     const selected = i === pag ? "selected" : "";
//     sel += `<option value="${i}" ${selected}>${i}</option>`;
//   }
//   sel += `</select>`;

//   const btnAtras =
//     pag <= 1
//       ? `<a class="paginador-btn disabled">❮ Anterior</a>`
//       : `<a class="paginador-btn" onclick="${dynamicFunction}(${nPag}, ${
//           pag - 1
//         })">❮ Anterior</a>`;

//   const btnSig =
//     pag >= nPag
//       ? `<a class="paginador-btn disabled">Siguiente ❯</a>`
//       : `<a class="paginador-btn" onclick="${dynamicFunction}(${nPag}, ${
//           pag + 1
//         })">Siguiente ❯</a>`;

//   return `
//     <div id="paginador" class="paginador-container">
//       <div class="row paginador-info">
//         <div class="col s12 center-align">Página ${pag} de ${nPag}</div>
//       </div>
//       <div class="row paginador-controls">
//         <div class="col s4 paginador-btn-container">${btnAtras}</div>
//         <div class="col s4 paginador-select-container">${sel}</div>
//         <div class="col s4 paginador-btn-container">${btnSig}</div>
//       </div>
//     </div>
//   `;
// }
// /////////////////////////////////////////////////////////////////////
// //////////////////FUNCION PARA MOSTRAR EL DETALLE DE LOS PEDIDOS///////////
// function irDetalleContenedor(pTraslado, pOpcion, Bodega_Solicita, Estado_Pdt) {
//   localStorage.setItem("contenedor", pTraslado);
//   localStorage.setItem("bodega_solicita", Bodega_Solicita);
//   localStorage.setItem("contenDetalleOPC", pOpcion);
//   localStorage.setItem("estado_Pdt", Estado_Pdt);
//   //console.log("contenDetalleOPC", pOpcion);
//   window.location.href = "lineasContenedor.html";
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// //se aplican estilos a las filas cuyos documentos comienzan con 'T'.
// function aplicarEstilosTabla() {
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
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// // //limpiar el contenido de la busqueda cuando cambia la fecha
// const fecha_ini = document.getElementById("fecha_ini");
// fecha_ini.addEventListener("change", function () {
//   limpiarResultadoGeneral();
// });
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// const fecha_fin = document.getElementById("fecha_fin");
// fecha_ini.addEventListener("change", function () {
//   limpiarResultadoGeneral();
// });
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// // Obtener el elemento toggleSwitch de entrada tipo checkbox////////
// // const checkbox = document.getElementById("toggleSwitch");
// /////////////// Agregar un evento de cambio al checkbox/////////////
// // checkbox.addEventListener("change", function () {
// //   if (checkbox.checked === false) {
// //     contenedoresProcesados();
// //   } else {
// //   }
// //   //limpiarResultadoGeneral();
// //   $("#toggleSwitch").prop("checked", true);
// //   localStorage.setItem("contenedorSwitch", true);
// // });
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// //Fucnion que activa el toggleSwitch para ver los contenedorers procesados
// // function contenedoresProcesados() {
// //   Swal.fire({
// //     title: "¿Desea ver solo los contenedores finalizados?",
// //     icon: "question",
// //     showCancelButton: true,
// //     confirmButtonText: "Sí",
// //     cancelButtonText: "No",
// //     confirmButtonColor: "#28a745",
// //     cancelButtonColor: "#6e7881",
// //   }).then((result) => {
// //     // Resultado de la acción
// //     if (result.isConfirmed) {
// //       $("#toggleSwitch").prop("checked", false);
// //       localStorage.setItem("contenedorSwitch", false);
// //     } else {
// //       $("#toggleSwitch").prop("checked", true);
// //       localStorage.setItem("contenedorSwitch", true);
// //     }
// //   });
// // }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function limpiarResultadoGeneral() {
//   const tabla = document.getElementById("tblcontenedores");
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
//   //localStorage.removeItem("SearchParameterFlag");
//   //localStorage.removeItem("parametrosBusquedaContenedor");
// }

// function refrescaPantalla() {
//   localStorage.removeItem("SearchParameterFlag");
//   localStorage.removeItem("parametrosBusquedaContenedor");
//   window.location.reload();
// }

// function mostrarInfo() {
//   Swal.fire({
//     title:
//       "<strong style=\"font-family:'Oswald',sans-serif;\">Guía de Búsqueda de Contenedores</strong>",
//     icon: "info",
//     html: `
//       <div style="text-align: left; font-size: 14px; font-family: 'Roboto', sans-serif; line-height: 1.5; max-height: 430px; overflow-y: auto; padding-right: 8px;">
        
//         <!-- BÚSQUEDA Y FILTROS -->
//         <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 0;">
//           🔍 Criterios de Búsqueda
//         </h6>
//         <div style="margin-bottom: 15px;">
//           <p style="margin: 5px 0;">
//             • <strong>Número de Contenedor:</strong> Ingrese el código o número de contenedor si desea filtrar un registro específico.
//           </p>
//           <p style="margin: 5px 0;">
//             • <strong>Rango de Fechas:</strong> Utilice los campos <em>Fecha Inicial</em> y <em>Fecha Final</em> para acotar la consulta dentro de un periodo.
//           </p>
//           <p style="margin: 5px 0;">
//             • <strong>Bodega de Destino:</strong> Es obligatorio seleccionar una bodega de destino de la lista desplegable antes de consultar.
//           </p>
//         </div>

//         <!-- FLUJO DEL PROCESO -->
//         <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
//           🔄 Flujo de Trabajo
//         </h6>
//         <ol style="padding-left: 18px; margin: 8px 0;">
//           <li style="margin-bottom: 6px;">
//             <strong>Consulta:</strong> Una vez definidos los filtros, haga clic en el botón <strong>Mostrar Contenedores</strong> para cargar el listado.
//           </li>
//           <li style="margin-bottom: 6px;">
//             <strong>Resultados:</strong> La tabla mostrará la información clave de cada contenedor, incluyendo la <em>Cantidad Solicitada</em>, <em>Cantidad Leída</em> y la <em>Fecha de Creación</em>.
//           </li>
//           <li style="margin-bottom: 6px;">
//             <strong>Ver Detalle / Verificación:</strong> Haga clic sobre cualquier fila del listado para abrir el detalle del contenedor y comenzar o continuar con el proceso de lectura de líneas.
//           </li>
//         </ol>

//         <!-- HERRAMIENTAS ADICIONALES -->
//         <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 12px;">
//           ⚙️ Herramientas de Pantalla
//         </h6>
//         <ul style="padding-left: 18px; margin: 5px 0; list-style-type: disc;">
//           <li style="margin-bottom: 4px;">
//             <strong>Refrescar Pantalla (<i class="material-icons green-text text-darken-2" style="font-size: 16px; vertical-align: middle;">refresh</i>):</strong> Limpia los filtros y parámetros guardados en memoria, reiniciando la vista.
//           </li>
//           <li style="margin-bottom: 4px;">
//             <strong>Paginador:</strong> Al final de la tabla podrá navegar entre las diferentes páginas de resultados o seleccionar el número de página deseado.
//           </li>
//         </ul>

//       </div>
//     `,
//     showCloseButton: true,
//     confirmButtonColor: "#1e88e5",
//     confirmButtonText: "Entendido",
//   });
// }

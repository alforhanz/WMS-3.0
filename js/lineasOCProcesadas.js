var detalleLineasOrdenDeCompra = "";

document.addEventListener("DOMContentLoaded", function () {
  cargarBodegas();
  let hUser = document.getElementById("hUsuario");
  let usuario = hUser ? hUser.value : "";
  console.log("hUsuario:", usuario);

  const observacionesContainer = document.getElementById("observaciones-container");
  if (observacionesContainer) {
    observacionesContainer.style.display = "block";
  }

  if (localStorage.getItem("OrdenDeCompra")) {
    let pSistema = "WMS";
    let pOpcion = "D";
    let pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
    let pEstado = "";
    let pOrden = localStorage.getItem("OrdenDeCompra");
    let pFechaDesde = "";
    let pFechaHasta = "";

    cargarDetalleOrdenDeCompra(pSistema, usuario, pOpcion, pBodega, pEstado, pOrden, pFechaDesde, pFechaHasta);
  } else {
    Swal.fire({
      icon: "info",
      title: "No hay Orden de Compra",
      text: "No hay órdenes de compra disponibles en este momento.",
      confirmButtonColor: "#28a745"
    });
  }
});

function cargarDetalleOrdenDeCompra(pSistema, pUsuario, pOpcion, pBodega, pEstado, pOrden, pFechaDesde, pFechaHasta) {
  const elOrden = document.getElementById("OrdenDeCompra");
  const elEmbarque = document.getElementById("bodega_solicita");
  const embarque = localStorage.getItem("embarque") || "";

  if (elOrden) elOrden.textContent = "#Orden: " + pOrden;
  if (elEmbarque) elEmbarque.textContent = "#Embarque: " + embarque;

  const params =
    "?pSistema=" + pSistema +
    "&pBodega=" + pBodega +
    "&pUsuario=" + pUsuario +
    "&pOrden=" + pOrden +
    "&pOpcion=" + pOpcion +
    "&pFechaDesde=" + pFechaDesde +
    "&pFechaHasta=" + pFechaHasta;

  if (typeof mostrarLoader === "function") mostrarLoader("Cargando detalle de la orden...");

  fetch(env.API_URL + "wmsordenesdecompras" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta.length !== 0) {
          detalleLineasOrdenDeCompra = result.respuesta;
          localStorage.setItem("lineasOC", JSON.stringify(detalleLineasOrdenDeCompra));
          armarTablaVerificacion(detalleLineasOrdenDeCompra);
        }
      }
    })
    .catch((err) => {
      console.error("Error al cargar orden procesada:", err);
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function armarTablaVerificacion(detalleLineasOrdenDeCompra) {
  var tbody = document.getElementById("tblbodyLineasOrdenDeCompra");
  if (!tbody) return;
  tbody.innerHTML = "";

  var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
  if (cantidadDeRegistrosLabel) {
    cantidadDeRegistrosLabel.textContent = "Cantidad de registros: " + detalleLineasOrdenDeCompra.length;
  }

  var mensajesArray = [];

  detalleLineasOrdenDeCompra.forEach(function (detalle) {
    var newRow = document.createElement("tr");

    let cantPedida = isNaN(parseFloat(detalle.cant_ordenada)) ? 0 : parseFloat(detalle.cant_ordenada);
    let cantLeida = isNaN(parseFloat(detalle.cant_verificada)) ? 0 : parseFloat(detalle.cant_verificada);

    let iconoVerificado = "";
    if (cantLeida > cantPedida) {
      iconoVerificado = '<i class="material-icons" style="color: #dc2626 !important; font-size: 20px; vertical-align: middle;">error_outline</i>';
      mensajesArray.push(`La cantidad verificada del artículo ${detalle.ARTICULO} supera la solicitada.`);
    } else if (cantLeida < cantPedida) {
      iconoVerificado = '<i class="material-icons" style="color: #ea580c !important; font-size: 20px; vertical-align: middle;">error_outline</i>';
      mensajesArray.push(`La cantidad verificada del artículo ${detalle.ARTICULO} es menor a la solicitada.`);
    } else {
      iconoVerificado = '<i class="material-icons" style="color: #28a745 !important; font-size: 22px; vertical-align: middle;">done_all</i>';
    }

    newRow.innerHTML = `
      <td style="text-align: left;">
        <div class="cell-articulo-box">
          <span class="cell-articulo-code" style="color: #0284c7;">${detalle.ARTICULO || ""}</span>
          <span class="cell-articulo-desc">${detalle.descripcion || ""}</span>
        </div>
      </td>
      <td class="cell-center">${detalle.cod_barra || ""}</td>
      <td class="cell-number">${cantPedida.toFixed(2)}</td>
      <td class="cell-number">${cantLeida.toFixed(2)}</td>
      <td class="cell-center">${iconoVerificado}</td>
      <td style="display: none;">${detalle.ARTICULO_ELIMINADO || ""}</td>
    `;
    tbody.appendChild(newRow);
  });

  let obs = localStorage.getItem("observacion");
  const observaciones = document.getElementById("observaciones");
  if (observaciones) {
    observaciones.value = (obs && obs !== "null") ? obs : "";
  }

  const mensajeTextArea = document.getElementById("mensajeText");
  if (mensajeTextArea) {
    const mensajesEnumerados = mensajesArray.map((msg, index) => `${index + 1}. ${msg}`);
    mensajeTextArea.value = mensajesEnumerados.join("\n");
  }

  localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
}

function confirmaDevolver() {
  localStorage.setItem("autoSearchOrdenDeComprasList", "true");
  localStorage.removeItem("mensajes");
  localStorage.removeItem("bodega_Destino_OC");
  localStorage.removeItem("embarque");
  localStorage.removeItem("OrdenDeCompra");
  window.location.href = "verificacionDeOrdenesDeCompraProcesadas.html";
}

function cargarBodegas() {
  fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra", myInit)
    .then((response) => response.json())
    .then((data) => {
      const bodegasSelect = document.getElementById("bodegaSelectOC");
      if (data.respuesta && Array.isArray(data.respuesta) && bodegasSelect) {
        bodegasSelect.innerHTML = '<option value="" disabled selected>Seleccione una bodega</option>';
        data.respuesta.forEach((bodega) => {
          const option = document.createElement("option");
          option.value = bodega.BODEGA;
          option.textContent = `${bodega.BODEGA} - ${bodega.NOMBRE}`;
          bodegasSelect.appendChild(option);
        });
      }
    })
    .catch((error) => console.error("Error al cargar bodegas:", error));
}

function handleBodegaChange(event) {
  console.log("Bodega seleccionada:", event.target.value);
  localStorage.setItem("bodega_Destino_OC", event.target.value);
}

const selectOC = document.getElementById("bodegaSelectOC");
if (selectOC) {
  selectOC.addEventListener("change", handleBodegaChange);
}

function validaCambioBodegaDestino() {
  let bodDestino = localStorage.getItem("bodega_Destino_OC");
  let ordenDeCompra = localStorage.getItem("OrdenDeCompra") || "";
  let embarque = localStorage.getItem("embarque") || "";

  if (bodDestino) {
    Swal.fire({
      title: "¿Desea aplicar el cambio de bodega de destino a todo el embarque?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, a todo el embarque",
      cancelButtonText: "Solo a esta orden",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#0284c7"
    }).then((result) => {
      if (result.isConfirmed) {
        cambiarBodegaDestino(bodDestino, embarque, "");
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        cambiarBodegaDestino(bodDestino, embarque, ordenDeCompra);
      }
    });
  } else {
    Swal.fire({
      title: "Seleccione una bodega",
      text: "Debe elegir una bodega de destino de la lista antes de aplicar.",
      icon: "warning",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#28a745"
    });
  }
}
function cambiarBodegaDestino(bodDestino, embarque, ordenDeCompra) {
  const params = `?Bodega=${encodeURIComponent(bodDestino)}&Embarque=${encodeURIComponent(embarque)}&OrdenCompra=${encodeURIComponent(ordenDeCompra)}`;

  if (typeof mostrarLoader === "function") mostrarLoader("Aplicando cambio de bodega...");

  fetch(env.API_URL + "wmscambiaboddestinooc" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta[0]?.mensaje === "OK") {
          Swal.fire({
            icon: "success",
            title: "Cambio Exitoso",
            text: "La bodega de destino fue actualizada correctamente.",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#28a745"
          });
          localStorage.removeItem("bodega_Destino_OC");
        } else if (result.respuesta && result.respuesta.length > 0) {
          let filasHTML = "";
          result.respuesta.forEach((ref) => {
            filasHTML += `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">${ref.ITEM}</td><td style="padding: 4px 8px; border-bottom: 1px solid #e2e8f0;">${ref.ARTICULO}</td></tr>`;
          });

          Swal.fire({
            icon: "warning",
            title: "Referencias No Asociadas",
            html: `
              <p style="font-size: 13px; color: #475569; margin-bottom: 10px;">Existen ${result.respuesta.length} artículos no configurados para la bodega destino seleccionada:</p>
              <div style="max-height: 180px; overflow-y: auto; text-align: left;">
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f1f5f9;"><th style="padding: 4px 8px;">Item</th><th style="padding: 4px 8px;">Artículo</th></tr>
                  </thead>
                  <tbody>${filasHTML}</tbody>
                </table>
              </div>
            `,
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#28a745"
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar la bodega de destino.",
          confirmButtonColor: "#ef4444"
        });
      }
    })
    .catch((err) => {
      console.error("Error al cambiar bodega destino:", err);
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}
// //Variable global que contiene el detalle del pedido
// var detalleLineasOrdenDeCompra = "";

// // document.addEventListener("DOMContentLoaded", function () {
// //     cargarBodegas();
  
// //   const observacionesContainer = document.getElementById(
// //     "observaciones-container"
// //   );
// //   observacionesContainer.style.display = "block";
 

// //   //--------------------------------------------------------------------------
// //   if (localStorage.getItem("OrdenDeCompra")) {
// //     let OrdenDeCompra = localStorage.getItem("OrdenDeCompra");
// //     // let pBodega = localStorage.getItem("bodegaOC");
// //     // let pBodega = document.getElementById("bodega-sucursal").value;
// //     let pBodega = document.getElementById("bodega").value;
// //     let pUsuario = document.getElementById("hUsuario").value; //localStorage.getItem("username");
// //     //---------------------------------------------------------------------------
// //     cargarDetalleOrdenDeCompra(OrdenDeCompra, pBodega, pUsuario);
// //     //localStorage.removeItem("dataArray");//borra los elementos leidos del localstorage.
// //   } else {
// //     Swal.fire({
// //       icon: "info",
// //       title: "No hay OrdenDeCompraes",
// //       text: "Lo sentimos, no hay OrdenDeCompraes disponibles en este momento.",
// //     });
// //   }
// // });

// // function cargarDetalleOrdenDeCompra(OrdenDeCompra, pBodega, pUsuario) {
// //   let embarque = localStorage.getItem("embarque");
// //   // Concatena la variable con texto y asigna el valor al label documento y pedido
// //   document.getElementById("OrdenDeCompra").innerHTML =
// //     "#Orden: " + OrdenDeCompra;
// //   document.getElementById("bodega_solicita").innerHTML =
// //     "#Embarque: " + embarque;

// //   const pOrden = OrdenDeCompra; //Se asigna el número del peddido a una variable constante para pasarlo como parametro
// //   const params =
// //     "?pBodega=" + pBodega + "&pUsuario=" + pUsuario + "&pOrden=" + pOrden;

// //   fetch(env.API_URL + "wmsordenesdecompraslist" + params, myInit) //obtierne las lineas del OrdenDeCompra
// //     .then((response) => response.json())
// //     .then((result) => {
// //       if (result.msg === "SUCCESS") {
// //         if (result.detalleOC.length != 0) {
// //           detalleLineasOrdenDeCompra = result.detalleOC;
// //           armarTablaVerificacion(detalleLineasOrdenDeCompra);
// //         }
// //       }
// //     });
// // }

// ///FUNCION QUE ARMA LA TABLA DE  VERIFICACION
// document.addEventListener("DOMContentLoaded", function () {
//   cargarBodegas();
//   let usuario = document.getElementById("hUsuario").value;
//   console.log("hUsuario:", usuario);
//   //localStorage.setItem('UserID',usuario);

//   const verificacionTab = document.querySelector(
//     'a[href="#tabla-verificacion"]'
//   );
//   const observacionesContainer = document.getElementById(
//     "observaciones-container"
//   );

//   // // Escuchar clic en la pestaña de Verificación
//   // verificacionTab.addEventListener("click", function () {
//     observacionesContainer.style.display = "block"; // Mostrar textarea
//   // });

//   // // Escuchar clic en la pestaña de Lectura
//   // const lecturaTab = document.querySelector('a[href="#tabla-lectura"]');
//   // lecturaTab.addEventListener("click", function () {
//     observacionesContainer.style.display = "none"; // Ocultar textarea
//   // });

//   //--------------------------------------------------------------------------
//   if (localStorage.getItem("OrdenDeCompra")) {
   
//     let pSistema = "WMS"; 
//     let pUsuario = document.getElementById("hUsuario").value;
//     let pOpcion = "D";
//     let pBodega = document.getElementById("bodega").value;
//     let pEstado = "";
//     let pOrden = localStorage.getItem("OrdenDeCompra");
//     // let pFechaDesde = document.getElementById("fecha_ini").value;
//     // let pFechaHasta = document.getElementById("fecha_fin").value;
//     let pFechaDesde = "";
//     let pFechaHasta = "";

//     //loadSwitchState();
//     //---------------------------------------------------------------------------
//     cargarDetalleOrdenDeCompra(pSistema,pUsuario, pOpcion,pBodega,pEstado,pOrden,pFechaDesde,pFechaHasta);
//   } else {
//     Swal.fire({
//       icon: "info",
//       title: "No hay OrdenDeCompra",
//       text: "Lo sentimos, no hay OrdenDeCompraes disponibles en este momento.",
//     });
//   }
// });

// ////////////// CARGA LOS DETALLES DE LA ORDEN DE COMPRAS //////////////////////////////////////////////////////////

// function cargarDetalleOrdenDeCompra(pSistema,pUsuario, pOpcion,pBodega,pEstado,pOrden,pFechaDesde,pFechaHasta) {
//   // Concatena la variable con texto y asigna el valor al label documento y pedido
//   document.getElementById("OrdenDeCompra").innerHTML ="#Orden: " + pOrden;   
//    const params =
//     "?pSistema=" +
//     pSistema +
//     "&pBodega=" +
//     pBodega +
//     "&pUsuario=" +
//     pUsuario +
//     "&pOrden=" +
//     pOrden +
//     "&pOpcion=" +
//     pOpcion +
//     "&pFechaDesde=" +
//     pFechaDesde +
//     "&pFechaHasta=" +
//     pFechaHasta;

//   fetch(env.API_URL + "wmsordenesdecompras" + params, myInit) //obtierne las lineas del OrdenDeCompra
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.respuesta.length != 0) {
//           detalleLineasOrdenDeCompra = result.respuesta;
//           let lineas = JSON.stringify(detalleLineasOrdenDeCompra);
//           localStorage.setItem("lineasOC", lineas);
//           console.log("listadoOC1");
//           console.log(detalleLineasOrdenDeCompra);
//            armarTablaVerificacion(detalleLineasOrdenDeCompra);        
//         }       
//       }
//     });
// }

// function armarTablaVerificacion(detalleLineasOrdenDeCompra) {
//   // Obtener la referencia del cuerpo de la tabla
//   var tbody = document.getElementById("tblbodyLineasOrdenDeCompra");

//   // Limpiar el contenido actual del cuerpo de la tabla
//   tbody.innerHTML = "";

//   // Obtener la referencia del label cantidadDeRegistros
//   var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
//   // Actualizar el texto del label con la cantidad de registros
//   cantidadDeRegistrosLabel.textContent =
//     "Cantidad de registros: " + detalleLineasOrdenDeCompra.length;

//   // Array para almacenar mensajes de verificación
//   var mensajesArray = [];

//   // Iterar sobre cada elemento en detalleLineasOrdenDeCompra
//   detalleLineasOrdenDeCompra.forEach(function (detalle) {
//     // Crear una nueva fila
//     var newRow = document.createElement("tr");

//     // Construir el contenido de la fila usando textContent y &nbsp;
//     var articuloCell = document.createElement("td");
//     articuloCell.id = "articulo";
//     var articuloHeader = document.createElement("h5");
//     articuloHeader.id = "verifica-articulo";
//     var articuloSpan = document.createElement("span");
//     articuloSpan.className = "blue-text text-darken-2 centered";
//     articuloSpan.textContent = detalle.ARTICULO;
//     articuloHeader.appendChild(articuloSpan);
//     var descripcionHeader = document.createElement("h6");
//     descripcionHeader.innerHTML = detalle.descripcion;
//     articuloCell.appendChild(articuloHeader);
//     articuloCell.appendChild(descripcionHeader);

//     var codigoDeBarrasCell = document.createElement("td");
//     codigoDeBarrasCell.id = "codigoDeBarras";
//     codigoDeBarrasCell.textContent = detalle.cod_barra || "";

//     var cantidadPedidaCell = document.createElement("td");
//     cantidadPedidaCell.id = "cantidadPedida";
//     cantidadPedidaCell.textContent = isNaN(parseFloat(detalle.cant_ordenada))
//       ? 0
//       : parseFloat(detalle.cant_ordenada).toFixed(0);

//     var cantidadLeidaCell = document.createElement("td");
//     cantidadLeidaCell.id = "cantidadLeida";
//     cantidadLeidaCell.textContent = detalle.cant_verificada; // Cantidad leída, inicialmente en blanco

//     var verificadoCell = document.createElement("td");
//     verificadoCell.id = "verificado";

//     // Verificar si las cantidades son iguales y generar mensajes
//     var cantPedida = parseFloat(detalle.cant_ordenada);
//     var cantLeida = parseFloat(detalle.cant_verificada);

//     if (cantLeida > cantPedida) {
//       verificadoCell.innerHTML =
//         '<i class="material-icons" style="color:red;">done_all</i>';
//       const mensaje = ` La cantidad verificada del artículo ${detalle.ARTICULO}, es mayor a la solicitada.`;
//       mensajesArray.push(mensaje);
//     } else if (cantLeida < cantPedida) {
//       verificadoCell.innerHTML =
//         '<i class="material-icons" style="color:red;">done_all</i>';
//       const mensaje = ` La cantidad verificada del artículo ${detalle.ARTICULO}, es menor a la solicitada.`;
//       mensajesArray.push(mensaje);
//     } else {
//       verificadoCell.innerHTML =
//         '<i class="material-icons" style="color:green;">done_all</i>';
//     }

//     var articulosEliminadoCell = document.createElement("td");
//     articulosEliminadoCell.id = "articulosEliminado";
//     articulosEliminadoCell.textContent = detalle.ARTICULO_ELIMINADO;
//     articulosEliminadoCell.setAttribute("hidden", true);

//     newRow.appendChild(articuloCell);
//     newRow.appendChild(codigoDeBarrasCell);
//     newRow.appendChild(cantidadPedidaCell);
//     newRow.appendChild(cantidadLeidaCell);
//     newRow.appendChild(verificadoCell);
//     newRow.appendChild(articulosEliminadoCell);
//     // Agregar la fila al cuerpo de la tabla
//     tbody.appendChild(newRow);
//   });

//   //agrega las observaciones si las hay
//   let obs = localStorage.getItem("observacion");
//   let contobs = 0;
//   const observaciones = document.getElementById("observaciones");
//   observaciones.innerHTML =
//     obs !== "" && obs !== "null" ? `${++contobs}- ${obs}` : "";

//   // Enumerar los mensajes y agregarlos al textArea
//   var mensajeTextArea = document.getElementById("mensajeText");
//   var mensajesEnumerados = mensajesArray.map(
//     (mensaje, index) => `${index + 1}. ${mensaje}`
//   );
//   mensajeTextArea.value = mensajesEnumerados.join("\n");
//   autoResizeTextArea(mensajeTextArea);

//   // Guardar los mensajes en localStorage
//   localStorage.setItem("mensajes", JSON.stringify(mensajesEnumerados));
// }

// // Función para ajustar dinámicamente el tamaño del textarea
// function autoResizeTextArea(textarea) {
//   textarea.style.height = "auto";
//   textarea.style.height = textarea.scrollHeight + "px";
// }

// // Evento para ajustar el tamaño del textarea al escribir
// document.addEventListener(
//   "input",
//   function (event) {
//     if (event.target.tagName.toLowerCase() === "textarea") {
//       autoResizeTextArea(event.target);
//     }
//   },
//   false
// );

// // Función para ajustar dinámicamente el tamaño del textarea
// function autoResizeTextArea(textarea) {
//   textarea.style.height = "auto";
//   textarea.style.height = textarea.scrollHeight + "px";
// }

// // Evento para ajustar el tamaño del textarea al escribir
// document.addEventListener(
//   "input",
//   function (event) {
//     if (event.target.tagName.toLowerCase() === "textarea") {
//       autoResizeTextArea(event.target);
//     }
//   },
//   false
// );

// //////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //FUNCION QUE VERIFICA LAS CANTIDASDES LEIDAS Y DEL PEDIDO PÁRA ACTIVAR EL BOTON DE GUARDADO PARCIAL
// function activaVolver() {
//   // Obtener todas las filas de la tabla de verificación
//   const filas = document.querySelectorAll("#myTableVerificacion tbody tr");

//   for (let i = 0; i < filas.length; i++) {
//     const fila = filas[i];

//     // Obtener las celdas de "CANT PEDIDA" y "CANT LEIDA" en la fila actual
//     const celdaCantidadPedida = fila.querySelector("td#cantidadPedida");
//     const celdaCantidadLeida = fila.querySelector("td#cantidadLeida");

//     // Verificar si la cantidad leída es mayor que la cantidad pedida en al menos una fila
//     if (
//       parseFloat(celdaCantidadLeida.textContent) >
//       parseFloat(celdaCantidadPedida.textContent)
//     ) {
//       // Si encontramos una fila donde la cantidad leída es mayor, retornamos true
//       return true;
//     }
//   }
//   // Si ninguna fila tiene cantidad leída mayor que cantidad pedida, retornamos false
//   return false;
// }

// // //////////////////////////////////////////////////////////////////////////////////////////////////////////
// // Función para mostrar los mensajes almacenados en el localStorage en el textarea
// function mostrarMensajesLocalStorage() {
//   const mensajesStorage = localStorage.getItem("mensajes");
//   if (mensajesStorage) {
//     const mensajes = JSON.parse(mensajesStorage);
//     const textarea = document.getElementById("mensajeText");
//     // Limpiar el textarea antes de agregar nuevos mensajes
//     textarea.value = "";
//     // Agregar cada mensaje al textarea
//     for (let i = 0; i < mensajes.length; i++) {
//       textarea.value += mensajes[i] + "\n"; // Agregar el mensaje y un salto de línea
//     }
//   }
// }

// //Llama a la función mostrarMensajesLocalStorage cuando se hace clic en la pestaña "Verificación"
// document
//   .querySelector('a[href="#tabla-verificacion"]')
//   .addEventListener("click", mostrarMensajesLocalStorage);

// //////////////inicializa los botones Guardar y cerrar/////////////////
// function inicializarBotones() {
//   // Crear los botones y el OrdenDeCompra
//   const OrdenDeCompraBotones = document.createElement("div");
//   const botonDevolver = document.createElement("button");
//   const botonGuardarParcial = document.createElement("button");

//   // Configurar propiedades de los botones
//   botonDevolver.textContent = "Regresar";
//   botonDevolver.id = "btnDevolver";
//   botonDevolver.hidden = false;
//   botonDevolver.onclick = confirmaDevolver; // Agregar onclick

//   botonGuardarParcial.textContent = "Guardar";
//   botonGuardarParcial.id = "btnGuardar";
//   botonGuardarParcial.hidden = false;
//   botonGuardarParcial.onclick = confirmaDevolver; // Agregar onclick

//   // Aplicar estilos al botón de guardado parcial
//   botonGuardarParcial.style.backgroundColor = "#28a745";
//   botonGuardarParcial.style.borderRadius = "5px";
//   botonGuardarParcial.style.color = "white";
//   botonGuardarParcial.style.marginTop = "16px";
//   botonGuardarParcial.style.marginLeft = "16px";
//   botonGuardarParcial.style.marginRight = "16px";
//   botonGuardarParcial.style.height = "36px";
//   botonGuardarParcial.style.width = "100px";

//   // Aplicar estilos al botón de Devolver
//   botonDevolver.style.width = "100px";
//   botonDevolver.style.backgroundColor = "#28a745";
//   botonDevolver.style.borderRadius = "5px";
//   botonDevolver.style.color = "white";
//   botonDevolver.style.marginTop = "16px";
//   botonDevolver.style.marginLeft = "6em";
//   botonDevolver.style.height = "36px";
//   botonDevolver.style.marginbottom = "25px";

//   // Agregar botones al OrdenDeCompra
//   // OrdenDeCompraBotones.appendChild(botonGuardarParcial);
//   OrdenDeCompraBotones.appendChild(botonDevolver);

//   // Obtener tabla de verificación
//   const tablaVerificacion = document.getElementById("myTableVerificacion");

//   // Insertar OrdenDeCompra de botones después de la tabla de verificación
//   tablaVerificacion.parentNode.insertBefore(
//     OrdenDeCompraBotones,
//     tablaVerificacion.nextSibling
//   );

//   // Media query para pantallas grandes
//   const mediaQuery = window.matchMedia("(min-width: 64em)");
//   if (mediaQuery.matches) {
//     // Aplicar estilos específicos para pantallas grandes
//     botonGuardarParcial.style.marginLeft = "200px";
//     botonDevolver.style.marginLeft = "6px";
//   }
// }

// // Llamar a la función para cargar y mostrar los mensajes desde el localStorage al cargar la página
// window.onload = function () {
//   inicializarBotones();
// };

// ///////FUNCION PARA Devolver//////
// function confirmaDevolver() {
//   localStorage.setItem("autoSearchOC", "true");
//   localStorage.removeItem("mensajes");
//   localStorage.removeItem("bodega_Destino_OC");
//   localStorage.removeItem("embarque");
//   localStorage.removeItem("OrdenDeCompra");
//   window.location.href = "verificacionDeOrdenesDeCompraProcesadas.html";
// }

// // Función para cargar las bodegas
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
// // Función para manejar el cambio de selección
// function handleBodegaChange(event) {
//   console.log("Bodega seleccionada:", event.target.value);
//   localStorage.setItem("bodega_Destino_OC", event.target.value);
// }
// // Obtener el elemento <select> y agregar el evento onchange
// document
//   .getElementById("bodegaSelectOC")
//   .addEventListener("change", handleBodegaChange);

// /////////   CAMBIAR LA BODEGA DESTINO EN LA OC          /////////////////////////////////

// function validaCambioBodegaDestino() {
//   let bodDestino = localStorage.getItem("bodega_Destino_OC");
//   let ordenDeCompra = localStorage.getItem("OrdenDeCompra");
//   let embarque = localStorage.getItem("embarque");
//   if (bodDestino != null) {
//     Swal.fire({
//       title:
//         "Sí desea aplicar el cambio de bodega de destino al embarque, presione Sí, de lo contrario de click en No o fuera del cuadro",
//       icon: "question",
//       showCancelButton: true,
//       confirmButtonText: "Sí",
//       cancelButtonText: "No",
//       confirmButtonColor: "#28a745",
//       cancelButtonColor: "#6e7881",
//     }).then((result) => {
//       if (result.isConfirmed) {
//         ordenDeCompra = "";
//         cambiarBodegaDestino(bodDestino, embarque, ordenDeCompra);
//         localStorage.removeItem("bodega_Destino_OC");
//       } else {
//         cambiarBodegaDestino(bodDestino, embarque, ordenDeCompra);
//         localStorage.removeItem("bodega_Destino_OC");
//       }
//     });
//   } else {
//     Swal.fire({
//       title: "Porfavor Seleccione una bodega",
//       icon: "warning",
//       //showCancelButton: true,
//       confirmButtonText: "cerrar",
//       confirmButtonColor: "#28a745",
//       cancelButtonColor: "#6e7881",
//     });
//   }
// }

// function cambiarBodegaDestino(bodDestino, embarque, ordenDeCompra) {
//   const params =
//     "?Bodega=" +
//     bodDestino +
//     "&Embarque=" +
//     embarque +
//     "&OrdenCompra=" +
//     ordenDeCompra;

//   fetch(env.API_URL + "wmscambiaboddestinooc" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         // console.log('API-Message:');
//         // console.log(result.message);
//         // console.log('BD-Respuesta:');
//         // console.log(result.respuesta[0].mensaje);
//         // console.log('Respuesta Tamaño: ');
//         // console.log(result.respuesta.length);

//         if (result.respuesta[0].mensaje === "OK") {
//           Swal.fire({
//             icon: "success",
//             title: "Cambio de bodega exitoso",
//             text: "Cambio de bodega de destino Exitoso",
//             confirmButtonText: "Aceptar",
//             confirmButtonColor: "#28a745",
//           });
//         } else {
//           if (result.respuesta.length > 0) {
//             // Construir el contenido del mensaje como una tabla
//             let contenidoHTML = `
//                         <table style="width: 100%; border-collapse: collapse; text-align: left;">
//                             <thead>
//                                 <tr>
//                                    <th style="border: 1px solid #ccc; padding: 8px;">Item</th>
//                                     <th style="border: 1px solid #ccc; padding: 8px;">Artículo</th>
//                                    <!-- <th style="border: 1px solid #ccc; padding: 8px;">Descripción</th>-->
//                                 </tr>
//                             </thead>
//                             <tbody>
//                     `;

//             result.respuesta.forEach((ref) => {
//               contenidoHTML += `
//                             <tr>
//                                 <td style="border: 1px solid #ccc; padding: 8px;">${ref.ITEM}</td>
//                                 <td style="border: 1px solid #ccc; padding: 8px;">${ref.ARTICULO}</td>
//                               <!--  <td style="border: 1px solid #ccc; padding: 8px;">${ref.DESCRIPCION}</td>-->
//                             </tr>
//                         `;
//             });

//             contenidoHTML += `
//                             </tbody>
//                         </table>
//                     `;

//             Swal.fire({
//               icon: "warning",
//               title: "Aviso",
//               html: `
//                             <p>Existen ${result.respuesta.length} referencias que no están asociadas a la bodega de destino seleccionada:</p>
//                             ${contenidoHTML}
//                         `,
//               confirmButtonText: "Aceptar",
//               confirmButtonColor: "#28a745",
//             });
//           } else {
//             Swal.fire({
//               icon: "warning",
//               title: "Aviso",
//               text: "Mensaje:" + result.respuesta[0].mensaje,
//               confirmButtonText: "Aceptar",
//               confirmButtonColor: "#28a745",
//             });
//           }
//         }
//       }
//     });
// }

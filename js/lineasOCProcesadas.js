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


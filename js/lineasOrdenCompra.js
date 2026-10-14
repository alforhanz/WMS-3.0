
var detalleLineasOrdenDeCompra = "";

document.addEventListener("DOMContentLoaded", function () {
  let hUser = document.getElementById("hUsuario");
  let usuario = hUser ? hUser.value : "";
  console.log("hUsuario:", usuario);

  if (localStorage.getItem("OrdenDeCompra")) {
    let pSistema = "WMS";
    let pOpcion = "D";
    let pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
    let pEstado = "";
    let pOrden = localStorage.getItem("OrdenDeCompra");
    let pFechaDesde = "";
    let pFechaHasta = "";

    loadSwitchState();
    cargarDetalleOrdenDeCompra(pSistema, usuario, pOpcion, pBodega, pEstado, pOrden, pFechaDesde, pFechaHasta);
  } else {
    Swal.fire({
      icon: "info",
      title: "No hay Orden de Compra",
      text: "No se encontró ninguna orden de compra seleccionada.",
      confirmButtonColor: "#28a745"
    });
  }
});

function cargarDetalleOrdenDeCompra(pSistema, pUsuario, pOpcion, pBodega, pEstado, pOrden, pFechaDesde, pFechaHasta) {
  const elOrden = document.getElementById("OrdenDeCompra");
  if (elOrden) elOrden.textContent = pOrden;

  const params =
    "?pSistema=" + pSistema +
    "&pBodega=" + pBodega +
    "&pUsuario=" + pUsuario +
    "&pOrden=" + pOrden +
    "&pOpcion=" + pOpcion +
    "&pFechaDesde=" + pFechaDesde +
    "&pFechaHasta=" + pFechaHasta;

  if (typeof mostrarLoader === "function") mostrarLoader("Cargando líneas de la orden...");

  fetch(env.API_URL + "wmsordenesdecompras" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta.length !== 0) {
          detalleLineasOrdenDeCompra = result.respuesta;
          localStorage.setItem("lineasOC", JSON.stringify(detalleLineasOrdenDeCompra));

          const elDestino = document.getElementById("bodega_solicita");
          if (elDestino && detalleLineasOrdenDeCompra[0]?.BODEGA_DESTINO) {
            elDestino.textContent = detalleLineasOrdenDeCompra[0].BODEGA_DESTINO;
          }

          armarTablaVerificacion(detalleLineasOrdenDeCompra);

          const siGuardadoParcial = detalleLineasOrdenDeCompra.some(
            (detalle) =>
              detalle.cant_verificada != null &&
              detalle.cant_verificada !== "" &&
              parseFloat(detalle.cant_verificada) > 0
          );

          if (siGuardadoParcial) {
            armarTablaLectura(detalleLineasOrdenDeCompra);
          }
        }
      }
    })
    .catch((error) => {
      console.error("Error al cargar orden de compra:", error);
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function armarTablaLectura(detalleLineasOrdenDeCompra) {
  var tbody = document.getElementById("tblbodyLectura");
  if (!tbody) return;
  tbody.innerHTML = "";

  detalleLineasOrdenDeCompra.forEach(function (detalle) {
    const cantidadVerificada = parseFloat(detalle.cant_verificada);

    if (!isNaN(cantidadVerificada) && cantidadVerificada > 0) {
      var newRow = document.createElement("tr");

      newRow.innerHTML = `
        <td class="cell-center">
          <span style="font-weight: 600; color: #1e293b;">${detalle.ARTICULO || ""}</span>
        </td>
        <td>
          <input type="text" class="codigo-barras-input" value="${detalle.cod_barra || ""}" onchange="validarCodigoBarras(this)" autofocus readonly autocomplete="off">
        </td>
        <td>
          <input type="text" class="codigo-barras-input" value="${cantidadVerificada}" onchange="guardarTablaEnArray(this)" readonly autocomplete="off">
        </td>
        <td class="cell-center">
          <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFila(this)">delete</i>
        </td>
      `;
      tbody.appendChild(newRow);
    }
  });

  guardarTablaEnArray();
  crearNuevaFila();
}

function validarCodigoBarras(input) {
  let lecturaSwitch = localStorage.getItem("switchLecturaState") === "true";
  var LineasOrdenDeCompra2 = localStorage.getItem("lineasOC");
  var LineasOrdenDeCompra = LineasOrdenDeCompra2 ? JSON.parse(LineasOrdenDeCompra2) : [];

  const codbarra = input.value.toUpperCase().trim();
  if (codbarra === "") return;

  const row = input.closest("tr");
  const span = row.cells[0].querySelector("span");
  const cantFila = row.cells[2].querySelector("input");

  var codigoValido = false;

  if (lecturaSwitch) {
    for (var i = 0; i < LineasOrdenDeCompra.length; i++) {
      let codigosArrayArticulo = [];
      let codigoArrayPadre = [];

      if (LineasOrdenDeCompra[i].codigos_barras) {
        codigosArrayArticulo = LineasOrdenDeCompra[i].codigos_barras
          .split("|")
          .map((codigo) => codigo.toUpperCase().trim());
      }
      if (LineasOrdenDeCompra[i].codigos_barras_kits) {
        codigoArrayPadre = LineasOrdenDeCompra[i].codigos_barras_kits
          .split("|")
          .map((codigo) => codigo.toUpperCase().trim());
      }

      if (
        (LineasOrdenDeCompra[i].ARTICULO && LineasOrdenDeCompra[i].ARTICULO.toUpperCase() === codbarra) ||
        codigosArrayArticulo.includes(codbarra) ||
        codigoArrayPadre.includes(codbarra)
      ) {
        if (codigosArrayArticulo.includes(codbarra) || LineasOrdenDeCompra[i].ARTICULO.toUpperCase() === codbarra) {
          span.textContent = LineasOrdenDeCompra[i].ARTICULO;
          cantFila.value = 1;
          input.setAttribute("readonly", "readonly");
          crearNuevaFila();
        } else {
          input.value = "";
          Swal.fire({
            title: "Modo Unidades Activo",
            text: "Está intentando leer un código de kit o caja. Cambie al modo de lectura por Kit/Caja.",
            confirmButtonColor: "#28a745",
            icon: "warning"
          });
        }
        guardarTablaEnArray();
        codigoValido = true;
        break;
      }
    }

    if (!codigoValido) {
      input.value = "";
      Swal.fire({
        icon: "warning",
        title: "¡Código " + codbarra + " no encontrado!",
        text: "¿Desea registrarlo como código nuevo?",
        showCancelButton: true,
        confirmButtonText: "Ingresar código",
        confirmButtonColor: "#28a745",
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          solicitarIngresoCodigo(codbarra, lecturaSwitch);
        }
      });
    }
  } else {
    for (var i = 0; i < LineasOrdenDeCompra.length; i++) {
      let codigosArrayPadre = [];
      let codigoArrayHijo = [];

      if (LineasOrdenDeCompra[i].codigos_barras_kits) {
        codigosArrayPadre = LineasOrdenDeCompra[i].codigos_barras_kits
          .split("|")
          .map((codigo) => codigo.toUpperCase().trim());
      }
      if (LineasOrdenDeCompra[i].codigos_barras) {
        codigoArrayHijo = LineasOrdenDeCompra[i].codigos_barras
          .split("|")
          .map((codigo) => codigo.toUpperCase().trim());
      }

      let cantKit = LineasOrdenDeCompra[i].cant_kits || 1;
      let cantPorKits = parseFloat(cantKit).toFixed(2);

      if (
        (LineasOrdenDeCompra[i].ARTICULO_PADRE && LineasOrdenDeCompra[i].ARTICULO_PADRE.toUpperCase() === codbarra) ||
        codigosArrayPadre.includes(codbarra) ||
        codigoArrayHijo.includes(codbarra)
      ) {
        if (codigoArrayHijo.includes(codbarra)) {
          input.value = "";
          Swal.fire({
            title: "Modo Kit/Caja Activo",
            text: "Está intentando leer un código por unidad. Cambie al modo de lectura por unidad.",
            confirmButtonColor: "#28a745",
            icon: "warning"
          });
        } else {
          span.textContent = LineasOrdenDeCompra[i].ARTICULO;
          cantFila.value = cantPorKits;
          span.style.color = "#28a745";
          input.setAttribute("readonly", "readonly");
          crearNuevaFila();
        }

        guardarTablaEnArray();
        codigoValido = true;
        break;
      }
    }

    if (!codigoValido) {
      input.value = "";
      Swal.fire({
        icon: "warning",
        title: "¡Código " + codbarra + " no encontrado!",
        text: "¿Desea registrarlo como código nuevo?",
        showCancelButton: true,
        confirmButtonText: "Ingresar código",
        confirmButtonColor: "#28a745",
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          solicitarIngresoCodigo(codbarra, lecturaSwitch);
        }
      });
    }
  }
}

function solicitarIngresoCodigo(codbarra, lecturaSwitch) {
  Swal.fire({
    title: "Registrar Código de Barra",
    html: `
      <input type="text" id="usuariocodigo" class="swal2-input" placeholder="Usuario">
      <input type="password" id="contrasena" class="swal2-input" placeholder="Contraseña">
      <input type="text" id="articulo" class="swal2-input" placeholder="Código de Artículo">
      <input type="text" id="codigoBarra" class="swal2-input" placeholder="Código de Barra" value="${codbarra}">
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar Código",
    confirmButtonColor: "#28a745",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const usuario = Swal.getPopup().querySelector("#usuariocodigo").value;
      const contrasena = Swal.getPopup().querySelector("#contrasena").value;
      const articulo = Swal.getPopup().querySelector("#articulo").value;
      const codigoBarra = Swal.getPopup().querySelector("#codigoBarra").value;

      if (!usuario || !contrasena || !articulo || !codigoBarra) {
        Swal.showValidationMessage("Por favor complete todos los campos.");
      }
      return { usuario, contrasena, articulo, codigoBarra };
    }
  }).then((res) => {
    if (res.isConfirmed) {
      const { usuario, contrasena, articulo, codigoBarra } = res.value;
      InsertaCodigoBarra(usuario, contrasena, articulo, codigoBarra, lecturaSwitch);
    }
  });
}

function crearNuevaFila() {
  const tableBody = document.querySelector("#tblbodyLectura");
  if (!tableBody) return;

  const nuevaFilaHTML = `<tr>
    <td class="cell-center" style="user-select: none;">
      <span style="font-weight: 600; color: #1e293b;"></span>
    </td>
    <td>
      <input type="text" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus autocomplete="off">
    </td>
    <td>
      <input type="text" class="codigo-barras-input" value="" onchange="validarCantidadPedida(this)" autocomplete="off">
    </td>
    <td class="cell-center">
      <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFila(this)">delete</i>
    </td>
  </tr>`;

  tableBody.insertAdjacentHTML("beforeend", nuevaFilaHTML);

  if (tableBody.lastElementChild) {
    const nuevoInput = tableBody.lastElementChild.cells[1].querySelector("input");
    if (nuevoInput) nuevoInput.focus();
  }
}

function validarCantidadPedida() {
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

    var codigoBarra = codigoBarraInput.value;
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
    var articulo = item.ARTICULO;
    var cantidad = item.CANTIDAD_LEIDA;

    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      cantidadesConsolidadas[articulo] += cantidad;
    } else {
      cantidadesConsolidadas[articulo] = cantidad;
    }
  });

  var newArray = [];
  for (var articulo in cantidadesConsolidadas) {
    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      newArray.push({
        ARTICULO: articulo,
        CANTIDAD_LEIDA: cantidadesConsolidadas[articulo]
      });
    }
  }

  localStorage.setItem("dataArray", JSON.stringify(newArray));
}

function eliminarFila(icon) {
  var row = icon.closest("tr");

  Swal.fire({
    title: "¿Estás seguro?",
    text: "Se eliminará la fila de la pestaña lectura.",
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

function armarTablaVerificacion(detalleLineasOrdenDeCompra) {
  var tbody = document.getElementById("tblbodyLineasOrdenDeCompra");
  if (!tbody) return;
  tbody.innerHTML = "";

  var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
  if (cantidadDeRegistrosLabel) {
    cantidadDeRegistrosLabel.textContent = "Cantidad de registros: " + detalleLineasOrdenDeCompra.length;
  }

  detalleLineasOrdenDeCompra.forEach(function (detalle) {
    var newRow = document.createElement("tr");

    let cantPed = isNaN(parseFloat(detalle.cant_ordenada)) ? 0 : parseFloat(detalle.cant_ordenada);

    newRow.innerHTML = `
      <td class="col-articulo" style="text-align: left;">
        <div class="cell-articulo-box">
          <span class="cell-articulo-code verifica-articulo" style="color: #0284c7;">
            <span>${detalle.ARTICULO || ""}</span>
          </span>
          <span class="cell-articulo-desc">${detalle.descripcion || ""}</span>
        </div>
      </td>
      <td class="col-codigo cell-center">${detalle.cod_barra || ""}</td>
      <td class="col-cant-pedida cell-number">${cantPed.toFixed(2)}</td>
      <td class="col-cant-leida cell-number"></td>
      <td class="col-verificado cell-center"></td>
      <td style="display: none;">${detalle.ARTICULO_ELIMINADO || ""}</td>
    `;
    tbody.appendChild(newRow);
  });

  let obs = localStorage.getItem("observacion");
  const observaciones = document.getElementById("observaciones");
  if (observaciones) {
    observaciones.value = (obs && obs !== "null") ? obs : "";
  }
}

function limpiarMensajes() {
  localStorage.removeItem("mensajes");
  const mensajeTextArea = document.getElementById("mensajeText");
  if (mensajeTextArea) mensajeTextArea.value = "";
  guardarTablaEnArray();
}

function verificacion() {
  const filas = document.querySelectorAll("#myTableVerificacion tbody tr");
  filas.forEach((fila) => {
    const cantidadLeidaCell = fila.querySelector(".col-cant-leida");
    const verifcheck = fila.querySelector(".col-verificado");
    if (cantidadLeidaCell) cantidadLeidaCell.textContent = "";
    if (verifcheck) verifcheck.textContent = "";
  });

  const mensajesArray = [];
  let mensajeContador = 1;
  let dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];

  filas.forEach((lineas) => {
    const articulo = lineas.querySelector(".verifica-articulo span")?.textContent.trim() || "";
    const cantSolicitada = lineas.querySelector(".col-cant-pedida")?.textContent.trim() || "0";
    const celdaCantidadLeida = lineas.querySelector(".col-cant-leida");
    const celdaVerificado = lineas.querySelector(".col-verificado");

    let coincidencia = false;

    dataArray.forEach((arrayLectura) => {
      if (articulo === arrayLectura.ARTICULO) {
        coincidencia = true;
        let leidaVal = parseFloat(arrayLectura.CANTIDAD_LEIDA) || 0;
        let solicitadaVal = parseFloat(cantSolicitada) || 0;

        if (celdaCantidadLeida) {
          celdaCantidadLeida.textContent = leidaVal.toFixed(2);
        }

        if (leidaVal > solicitadaVal) {
          let resultado = "+" + (leidaVal - solicitadaVal).toFixed(2);
          if (celdaVerificado) {
            celdaVerificado.textContent = resultado;
            celdaVerificado.style.color = "#dc2626";
            celdaVerificado.style.fontWeight = "bold";
          }
          mensajesArray.push(`${mensajeContador}. La cantidad leída del artículo ${articulo} supera la solicitada (+${(leidaVal - solicitadaVal).toFixed(2)}).`);
          mensajeContador++;
        } else if (leidaVal < solicitadaVal) {
          let resultado = (leidaVal - solicitadaVal).toFixed(2);
          if (celdaVerificado) {
            celdaVerificado.textContent = resultado;
            celdaVerificado.style.color = "#ea580c";
            celdaVerificado.style.fontWeight = "bold";
          }
          mensajesArray.push(`${mensajeContador}. La cantidad leída del artículo ${articulo} es menor a la solicitada (${(leidaVal - solicitadaVal).toFixed(2)}).`);
          mensajeContador++;
        } else {
          if (celdaVerificado) {
            celdaVerificado.innerHTML = `<i class="material-icons" style="color: #28a745 !important; font-size: 22px; vertical-align: middle;">done_all</i>`;
          }
        }
      }
    });

    if (!coincidencia) {
      if (celdaCantidadLeida) celdaCantidadLeida.textContent = "0.00";
      if (celdaVerificado) {
        celdaVerificado.innerHTML = `<i class="material-icons" style="color: #ef4444 !important; font-size: 20px; vertical-align: middle;">cancel</i>`;
      }
      mensajesArray.push(`${mensajeContador}. La cantidad leída del artículo ${articulo} es cero.`);
      mensajeContador++;
    }
  });

  localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
  const mensajeTextArea = document.getElementById("mensajeText");
  if (mensajeTextArea) mensajeTextArea.value = mensajesArray.join("\n");

  evaluarBotonesVerificacion();
}

function evaluarBotonesVerificacion() {
  const ordenesfinalizado = localStorage.getItem("OrdenDeCompra_finalizadas") === "true";
  const btnGuardar = document.getElementById("btnGuardar");
  const btnProcesar = document.getElementById("btnProcesar");
 

  if (btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
  if (btnProcesar) btnProcesar.setAttribute("hidden", "hidden");
  

}

function validarVerificacion() {
  var celdasVerificacion = document.querySelectorAll("#tblbodyLineasOrdenDeCompra td.col-verificado");
  if (celdasVerificacion.length === 0) return "false";

  for (var i = 0; i < celdasVerificacion.length; i++) {
    var icono = celdasVerificacion[i].querySelector("i.material-icons, span.material-icons");
    if (!icono || icono.textContent.trim() !== "done_all") {
      return "false";
    }
  }
  return "true";
}

function mostrarMensajesLocalStorage() {
  const mensajesStorage = localStorage.getItem("mensajes");
  if (mensajesStorage) {
    const mensajes = JSON.parse(mensajesStorage);
    const textarea = document.getElementById("mensajeText");
    if (textarea) textarea.value = mensajes.join("\n");
  }
}

window.onload = function () {
  evaluarBotonesVerificacion();
  guardarTablaEnArray();
};

function confirmarGuardadoParcialLectura() {
  Swal.fire({
    icon: "info",
    title: "¿Desea guardar el avance de lectura de la orden de compra?",
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#0284c7"
  }).then((result) => {
    if (result.isConfirmed) {
      verificacion();
      guardaParcialMenteLectura();
    }
  });
}

function confirmarGuardadoParcial() {
  Swal.fire({
    icon: "info",
    title: "¿Desea guardar el avance de verificación de la orden de compra?",
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#0284c7"
  }).then((result) => {
    if (result.isConfirmed) {
      guardaParcialMente();
    }
  });
}

function guardaParcialMenteLectura() {
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  var pConsecutivo = localStorage.getItem("OrdenDeCompra");
  localStorage.removeItem("mensajes");

  var detalles = [];
  let table = document.getElementById("myTableVerificacion");
  if (!table) return;

  for (let i = 1; i < table.rows.length; i++) {
    let row = table.rows[i];
    let articulo = row.querySelector(".verifica-articulo span")?.textContent.trim() || "";
    let cantidadPedida = row.querySelector(".col-cant-pedida")?.textContent.trim() || "0";
    let cantidadLeida = row.querySelector(".col-cant-leida")?.textContent.trim() || "0";

    detalles.push({
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_LEIDA: cantidadLeida
    });
  }

  const chunkSize = 50;
  const totalChunks = Math.ceil(detalles.length / chunkSize);

  if (typeof mostrarLoader === "function") mostrarLoader("Guardando avance...");

  let promesas = [];
  for (let i = 0; i < totalChunks; i++) {
    const chunk = detalles.slice(i * chunkSize, (i + 1) * chunkSize);
    const params =
      "?pUsuario=" + pUsuario +
      "&pConsecutivo=" + pConsecutivo +
      "&jsonDetalles=" + encodeURIComponent(JSON.stringify(chunk));

    promesas.push(
      fetch(env.API_URL + "wmsguardaprocesaordendecompralist/G" + params, myInit)
        .then((res) => res.json())
    );
  }

  Promise.all(promesas)
    .then(() => {
      Swal.fire({
        icon: "success",
        title: "Avance guardado",
        text: "Las líneas de lectura se han registrado correctamente.",
        confirmButtonColor: "#28a745"
      });
    })
    .catch((err) => {
      console.error("Error al guardar lectura:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al guardar los lotes.",
        confirmButtonColor: "#ef4444"
      });
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function guardaParcialMente() {
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  var pConsecutivo = localStorage.getItem("OrdenDeCompra");
  localStorage.removeItem("mensajes");

  var detalles = [];
  let table = document.getElementById("myTableVerificacion");
  if (!table) return;

  for (let i = 1; i < table.rows.length; i++) {
    let row = table.rows[i];
    let articulo = row.querySelector(".verifica-articulo span")?.textContent.trim() || "";
    let cantidadPedida = row.querySelector(".col-cant-pedida")?.textContent.trim() || "0";
    let cantidadLeida = row.querySelector(".col-cant-leida")?.textContent.trim() || "0";

    detalles.push({
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_LEIDA: cantidadLeida
    });
  }

  const chunkSize = 50;
  const totalChunks = Math.ceil(detalles.length / chunkSize);

  if (typeof mostrarLoader === "function") mostrarLoader("Guardando verificación...");

  let promesas = [];
  for (let i = 0; i < totalChunks; i++) {
    const chunk = detalles.slice(i * chunkSize, (i + 1) * chunkSize);
    const params =
      "?pUsuario=" + pUsuario +
      "&pConsecutivo=" + pConsecutivo +
      "&jsonDetalles=" + encodeURIComponent(JSON.stringify(chunk));

    promesas.push(
      fetch(env.API_URL + "wmsguardaprocesaordendecompralist/G" + params, myInit)
        .then((res) => res.json())
    );
  }

  Promise.all(promesas)
    .then(() => {
      Swal.fire({
        icon: "success",
        title: "Verificación guardada",
        text: "Los datos se han guardado con éxito.",
        confirmButtonColor: "#28a745"
      }).then((res) => {
        if (res.isConfirmed) {
          localStorage.setItem("autoSearchOrdenDeComprasList", "true");
          window.location.href = "verificacionDeOrdenesDeCompra.html";
        }
      });
    })
    .catch((err) => {
      console.error("Error al guardar verificación:", err);
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: "No se pudieron procesar todos los registros.",
        confirmButtonColor: "#ef4444"
      });
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function confirmaProcesar() {
  const observaciones = document.getElementById("observaciones")?.value || "";
  const diferenciasLineas = validarVerificacion();

  Swal.fire({
    icon: "warning",
    title: "¿Desea procesar la Orden de Compra?",
    showCancelButton: true,
    confirmButtonText: "Procesar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881"
  }).then((result) => {
    if (result.isConfirmed) {
      if (diferenciasLineas === "true") {
        procesarOrdenDeCompra();
      } else {
        Swal.fire({
          title: "Autorización Requerida",
          html: `
            <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">La orden presenta diferencias entre lo leído y lo solicitado.</p>
            <input type="text" id="usuariocodigo" class="swal2-input" placeholder="Usuario Supervisor">
            <input type="password" id="contrasena" class="swal2-input" placeholder="Contraseña">
          `,
          showCancelButton: true,
          confirmButtonText: "Autorizar",
          confirmButtonColor: "#28a745",
          cancelButtonText: "Cancelar",
          preConfirm: () => {
            const usuario = Swal.getPopup().querySelector("#usuariocodigo").value;
            const contrasena = Swal.getPopup().querySelector("#contrasena").value;
            if (!usuario || !contrasena) {
              Swal.showValidationMessage("Por favor ingrese usuario y contraseña.");
            }
            return { usuario, contrasena };
          }
        }).then((authRes) => {
          if (authRes.isConfirmed) {
            if (observaciones.trim() !== "") {
              const { usuario, contrasena } = authRes.value;
              autorizacion(usuario, contrasena);
            } else {
              Swal.fire({
                icon: "warning",
                title: "Observaciones Obligatorias",
                text: "Debe ingresar las observaciones antes de autorizar el procesamiento con diferencias.",
                confirmButtonColor: "#28a745"
              });
            }
          }
        });
      }
    }
  });
}

function autorizacion(usuario, contrasena) {
  const params = "?pUsuario=" + encodeURIComponent(usuario) + "&pOpcion=" + encodeURIComponent(contrasena);

  fetch(env.API_URL + "wmsautorizaciones" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.autorizacion && result.autorizacion[0]?.respuesta === 0) {
        procesarOrdenDeCompra();
      } else {
        Swal.fire({
          icon: "warning",
          title: "Credenciales Incorrectas",
          text: "No se autorizó la operación.",
          confirmButtonColor: "#28a745"
        });
      }
    })
    .catch((error) => {
      console.error("Error en autorización:", error);
    });
}

function procesarOrdenDeCompra() {
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  var pConsecutivo = localStorage.getItem("OrdenDeCompra");
  let pObservaciones = document.getElementById("observaciones")?.value || "";

  var detalles = [];
  let table = document.getElementById("myTableVerificacion");
  if (!table) return;

  for (let i = 1; i < table.rows.length; i++) {
    let row = table.rows[i];
    let articulo = row.querySelector(".verifica-articulo span")?.textContent.trim() || "";
    let cantidadPedida = row.querySelector(".col-cant-pedida")?.textContent.trim() || "0";
    let cantidadLeida = row.querySelector(".col-cant-leida")?.textContent.trim() || "0";

    detalles.push({
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_LEIDA: cantidadLeida
    });
  }

  const batchSize = 50;
  const totalBatches = Math.ceil(detalles.length / batchSize);
  let promises = [];

  if (typeof mostrarLoader === "function") mostrarLoader("Procesando orden de compra...");

  for (let i = 0; i < totalBatches; i++) {
    const batch = detalles.slice(i * batchSize, (i + 1) * batchSize);
    const params =
      "?pUsuario=" + pUsuario +
      "&pConsecutivo=" + pConsecutivo +
      "&jsonDetalles=" + encodeURIComponent(JSON.stringify(batch)) +
      "&pObservacion=" + encodeURIComponent(pObservaciones);

    promises.push(
      fetch(env.API_URL + "wmsguardaprocesaordendecompralist/P" + params, myInit)
        .then((res) => res.json())
    );
  }

  Promise.all(promises)
    .then(() => {
      Swal.fire({
        icon: "success",
        title: "Orden Procesada",
        text: "La orden de compra se procesó exitosamente.",
        confirmButtonColor: "#28a745"
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.setItem("autoSearchOrdenDeComprasList", "true");
          window.location.href = "verificacionDeOrdenesDeCompra.html";
        }
      });
    })
    .catch((error) => {
      console.error("Error al procesar orden:", error);
      Swal.fire({
        title: "Error",
        text: "Ocurrió un problema al procesar los lotes de la orden.",
        confirmButtonColor: "#dc3545",
        icon: "error"
      });
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}



function InsertaCodigoBarra(usuario, contrasena, articulo, codigoBarra, valorswitch) {
  let pOpcion = valorswitch ? "T" : "K";

  const params =
    "?pUsuario=" + encodeURIComponent(usuario) +
    "&pClave=" + encodeURIComponent(contrasena) +
    "&pArticulo=" + encodeURIComponent(articulo) +
    "&pCodigoBarra=" + encodeURIComponent(codigoBarra) +
    "&pOpcion=" + pOpcion;

  fetch(env.API_URL + "wmsinsertacodigobarra" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        actualizaOrdenDeComprasList();
        Swal.fire({
          position: "center",
          icon: "success",
          title: result.codigobarra[0]?.Mensaje || "Código registrado",
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
}

function actualizaOrdenDeComprasList() {
  if (localStorage.getItem("OrdenDeCompra")) {
    let pOrden = localStorage.getItem("OrdenDeCompra");
    let pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
    let hUser = document.getElementById("hUsuario");
    let pUsuario = hUser ? hUser.value : "";

    const params = "?pBodega=" + pBodega + "&pUsuario=" + pUsuario + "&pOrden=" + pOrden;

    fetch(env.API_URL + "wmsordenesdecompraslist" + params, myInit)
      .then((response) => response.json())
      .then((result) => {
        if (result.msg === "SUCCESS" && result.detalleOC && result.detalleOC.length !== 0) {
          detalleLineasOrdenDeCompra = result.detalleOC;
          localStorage.setItem("lineasOC", JSON.stringify(detalleLineasOrdenDeCompra));
        }
      });
  }
}

function saveSwitchState() {
  const switchElement = document.getElementById("toggleSwitchLectura");
  if (switchElement) {
    localStorage.setItem("switchLecturaState", switchElement.checked);
  }
}

function loadSwitchState() {
  const switchElement = document.getElementById("toggleSwitchLectura");
  const savedState = localStorage.getItem("switchLecturaState");
  if (switchElement && savedState !== null) {
    switchElement.checked = savedState === "true";
  }
}

const switchLect = document.getElementById("toggleSwitchLectura");
if (switchLect) {
  switchLect.addEventListener("change", saveSwitchState);
}
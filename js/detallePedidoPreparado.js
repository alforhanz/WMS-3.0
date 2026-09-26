// Variable global que contiene el detalle del pedido
var detallePedidoList = "";

document.addEventListener("DOMContentLoaded", function () {
  let usuario = document.getElementById("hUsuario") ? document.getElementById("hUsuario").value : "";
  console.log("hUsuario:", usuario);

  if (localStorage.getItem("documento")) {
    var documento = localStorage.getItem("documento");
    var pedido = localStorage.getItem("pedidoSelect");
    let estado = localStorage.getItem("estado");

    cargarDetallePedido(documento, pedido, estado);
    localStorage.removeItem("dataArray");
  } else {
    window.location = "index.html";
  }
});

function cargarDetallePedido(documento, pedido, estado) {
  const elDoc = document.getElementById("documento");
  const elPed = document.getElementById("pedido");
  const elEst = document.getElementById("estadoPedido");

  if (elDoc) elDoc.textContent = documento;
  if (elPed) elPed.textContent = pedido;
  if (elEst) {
    elEst.textContent = estado;
    if (estado === "Pendiente" || estado === "F" || estado === "Facturado") {
      elEst.classList.remove("active");
      elEst.style.background = "#fef08a";
      elEst.style.color = "#854d0e";
    }
  }

  const params = "?pPedido=" + pedido;
  if (typeof mostrarLoader === "function") mostrarLoader("Cargando pedido preparado...");

  fetch(env.API_URL + "wmsverificacionpedidos/D" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.lineaspedido && result.lineaspedido.length !== 0) {
          detallePedidoList = result.lineaspedido;
          armarTablaVerificacion(detallePedidoList);
          armarTablaLectura(detallePedidoList);
        }
        if (typeof ocultarLoader === "function") ocultarLoader();
      } else {
        if (typeof ocultarLoader === "function") ocultarLoader();
      }
    })
    .catch((error) => {
      console.error("Error al cargar detalle preparado:", error);
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function armarTablaLectura(detallePedidoList) {
  var tbody = document.getElementById("tblbodyLectura");
  if (!tbody) return;

  var estadoPreparacion = localStorage.getItem("EstadoPreparacion");
  tbody.innerHTML = "";

  if (estadoPreparacion === "A") {
    crearNuevaFila();
    guardarTablaEnArray();
  } else if (estadoPreparacion !== "P") {
    var newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td class="cell-center">
        <span style="font-weight: 600; color: #1e293b;"></span>
      </td>
      <td>
        <input type="text" class="codigo-barras-input" value="" autofocus disabled>
      </td>
      <td>
        <input type="text" class="codigo-barras-input" value="" disabled>
      </td>
      <td class="cell-center">
        <i class="material-icons" style="cursor: default; color: #94a3b8; font-size: 20px;">clear</i>
      </td>
    `;
    tbody.appendChild(newRow);
  } else {
    detallePedidoList.forEach(function (detalle) {
      let cantVerif = parseFloat(detalle.CANTIDAD_VERIFICADA) || 0;
      if (cantVerif > 0) {
        var newRow = document.createElement("tr");
        newRow.innerHTML = `
          <td class="cell-center">
            <span style="font-weight: 600; color: #1e293b;">${detalle.ARTICULO}</span>
          </td>
          <td>
            <input type="text" class="codigo-barras-input" value="${detalle.CODIGO_BARRA || ""}" readonly autocomplete="off">
          </td>
          <td>
            <input type="text" class="codigo-barras-input" value="${cantVerif}" readonly autocomplete="off">
          </td>
          <td class="cell-center">
            <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFila(this)">delete</i>
          </td>
        `;
        tbody.appendChild(newRow);
      }
    });
    guardarTablaEnArray();
    verificacion();
  }
}

function validarCodigoBarras(input) {
  var pedidoList = detallePedidoList;
  const codbarra = input.value.trim().toUpperCase();

  if (codbarra === "") return;

  const row = input.closest("tr");
  const span = row.cells[0].querySelector("span");
  const cantFila = row.cells[2].querySelector("input");

  var codigoValido = false;

  for (var i = 0; i < pedidoList.length; i++) {
    let codigosArrayArticulo = [];
    if (pedidoList[i].codigos_barras) {
      codigosArrayArticulo = pedidoList[i].codigos_barras
        .split("|")
        .map((codigo) => codigo.toUpperCase());
    }

    if (
      (pedidoList[i].ARTICULO && pedidoList[i].ARTICULO.toUpperCase() === codbarra) ||
      (pedidoList[i].CODIGO_BARRA && pedidoList[i].CODIGO_BARRA.toUpperCase() === codbarra) ||
      codigosArrayArticulo.includes(codbarra)
    ) {
      span.textContent = pedidoList[i].ARTICULO;
      cantFila.value = 1;

      input.setAttribute("readonly", "readonly");
      crearNuevaFila();
      guardarTablaEnArray();

      codigoValido = true;
      break;
    }
  }

  if (!codigoValido) {
    input.value = "";
    Swal.fire({
      icon: "warning",
      title: "¡Código no válido!",
      text: "El código ingresado no coincide con ningún artículo del pedido preparado.",
      confirmButtonColor: "#28a745"
    });
  }
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
  if (!table) return dataArray;

  var rows = table.getElementsByTagName("tr");

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row.cells.length < 3) continue;

    var spanArticulo = row.cells[0].querySelector("span");
    var articulo = spanArticulo ? spanArticulo.textContent.trim() : "";

    var codigoBarraInput = row.cells[1].querySelector("input");
    var cantidadLeidaInput = row.cells[2].querySelector("input");

    var codigoBarra = codigoBarraInput ? codigoBarraInput.value : "";
    var cantidadLeida = cantidadLeidaInput ? parseFloat(cantidadLeidaInput.value) : NaN;

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
    if (cantidadesConsolidadas.hasOwnProperty(item.ARTICULO)) {
      cantidadesConsolidadas[item.ARTICULO] += item.CANTIDAD_LEIDA;
    } else {
      cantidadesConsolidadas[item.ARTICULO] = item.CANTIDAD_LEIDA;
    }
  });

  var newArray = [];
  for (var art in cantidadesConsolidadas) {
    newArray.push({
      ARTICULO: art,
      CANTIDAD_LEIDA: cantidadesConsolidadas[art]
    });
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
          title: "Fila vacía",
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

function armarTablaVerificacion(detallePedidoList) {
  var tbody = document.getElementById("tblbodyVerificacion");
  if (!tbody) return;
  tbody.innerHTML = "";

  var lblCant = document.getElementById("cantidadDeRegistros");
  if (lblCant) {
    lblCant.textContent = "Cantidad de registros: " + detallePedidoList.length;
  }

  detallePedidoList.forEach(function (detalle) {
    var newRow = document.createElement("tr");

    let cantPed = isNaN(parseFloat(detalle.CANTIDAD_PEDIDA)) ? 0 : parseFloat(detalle.CANTIDAD_PEDIDA);
    let cantPick = isNaN(parseFloat(detalle.CANTIDAD_VERIFICADA)) ? 0 : parseFloat(detalle.CANTIDAD_VERIFICADA);
    let cantPrep = parseFloat(detalle.CANTIDAD_PREPARADA) || 0;
    let strLeida = cantPrep > 0 ? cantPrep.toFixed(2) : "";

    newRow.innerHTML = `
      <td id="articulo" style="text-align: left;">
        <div class="cell-articulo-box">
          <span id="verifica-articulo" class="cell-articulo-code" style="color: #0284c7;">${detalle.ARTICULO}</span>
          <span class="cell-articulo-desc">${detalle.DESCRIPCION}</span>
        </div>
      </td>
      <td id="codigoDeBarras" class="cell-center">${detalle.CODIGO_BARRA || ""}</td>
      <td id="cantidadPedida" class="cell-number">${cantPed.toFixed(2)}</td>
      <td id="cantidadPickin" class="cell-number">${cantPick.toFixed(2)}</td>
      <td id="cantidadLeida" class="cell-number">${strLeida}</td>
      <td id="verificado" class="cell-center"></td> 
      <td id="articulosEliminado" style="display: none;">${detalle.ARTICULO_ELIMINADO}</td> 
    `;
    tbody.appendChild(newRow);
  });
}

function limpiarMensajes() {
  localStorage.removeItem("mensajes");
  const mensajeTextArea = document.getElementById("mensajeText");
  if (mensajeTextArea) mensajeTextArea.value = "";
  guardarTablaEnArray();
}

function verificacion() {
  var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  const tabla = document.getElementById("myTableVerificacion");

  if (tabla) {
    const tbody = tabla.querySelector("tbody");
    if (tbody) {
      tbody.querySelectorAll("tr").forEach((fila) => {
        const celdaLeida = fila.querySelector("#cantidadLeida");
        const verifcheck = fila.querySelector("#verificado");
        if (celdaLeida) celdaLeida.textContent = "";
        if (verifcheck) verifcheck.textContent = "";
      });
    }
  }

  var cantidadesTotales = {};
  dataArray.forEach(function (item) {
    cantidadesTotales[item.ARTICULO] = (cantidadesTotales[item.ARTICULO] || 0) + item.CANTIDAD_LEIDA;
  });

  var resultadoArray = [];
  for (var articulo in cantidadesTotales) {
    resultadoArray.push({
      ARTICULO: articulo,
      CANTIDAD_LEIDA: cantidadesTotales[articulo]
    });
  }

  var pedidoList = detallePedidoList;
  const mensajesArray = [];
  let contadorMensajes = 1;

  resultadoArray.forEach((resultado) => {
    const pedido = pedidoList.find(
      (p) =>
        p.ARTICULO === resultado.ARTICULO &&
        parseFloat(p.CANTIDAD_PEDIDA) === parseFloat(resultado.CANTIDAD_LEIDA)
    );

    const filas = tabla ? tabla.querySelectorAll("tbody tr") : [];

    if (pedido) {
      filas.forEach((fila) => {
        const celdaArt = fila.querySelector("#verifica-articulo");
        if (celdaArt && celdaArt.textContent === resultado.ARTICULO) {
          const celdaVerif = fila.querySelector("#verificado");
          if (celdaVerif) {
            celdaVerif.innerHTML = `<i class="material-icons" style="color: #28a745 !important; font-size: 22px; vertical-align: middle;">done_all</i>`;
          }
          const celdaLeida = fila.querySelector("#cantidadLeida");
          if (celdaLeida) celdaLeida.textContent = parseFloat(resultado.CANTIDAD_LEIDA).toFixed(2);
        }
      });
    } else {
      filas.forEach((fila) => {
        const celdaArt = fila.querySelector("#verifica-articulo");
        if (celdaArt && celdaArt.textContent === resultado.ARTICULO) {
          const celdaVerif = fila.querySelector("#verificado");
          const cantPedida = fila.querySelector("#cantidadPedida");
          const celdaLeida = fila.querySelector("#cantidadLeida");

          const pedVal = parseFloat(cantPedida.textContent) || 0;
          const leiVal = parseFloat(resultado.CANTIDAD_LEIDA) || 0;

          if (leiVal > pedVal) {
            celdaVerif.textContent = "+" + (leiVal - pedVal).toFixed(2);
            celdaVerif.style.color = "#dc2626";
            celdaVerif.style.fontWeight = "bold";
            mensajesArray.push(`${contadorMensajes}. La cantidad verificada de ${resultado.ARTICULO} es MAYOR a la solicitada.`);
            contadorMensajes++;
          } else if (leiVal < pedVal) {
            celdaVerif.textContent = (leiVal - pedVal).toFixed(2);
            celdaVerif.style.color = "#ea580c";
            celdaVerif.style.fontWeight = "bold";
            mensajesArray.push(`${contadorMensajes}. La cantidad verificada de ${resultado.ARTICULO} es MENOR a la solicitada.`);
            contadorMensajes++;
          }
          if (celdaLeida) celdaLeida.textContent = leiVal.toFixed(2);
        }
      });
      localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
    }
  });

  const estadoPedidoEl = document.getElementById("estadoPedido");
  const estadoPedidoText = estadoPedidoEl ? estadoPedidoEl.textContent.trim() : "";
  const estadoPedido = estadoPedidoText.includes(":") ? estadoPedidoText.split(":")[1].trim() : estadoPedidoText;

  const procesarHabilitado = todasLasFilasVerificadas();
  const pedidofinalizado = localStorage.getItem("pedidos_finalizados");
  const guardarParcialHabilitado = activaGuardadoParcial();

  const btnGuardar = document.getElementById("btnGuardar");
  const btnProcesar = document.getElementById("btnProcesar");
  const btnRegresar = document.getElementById("btnRegresar");

  if (pedidofinalizado === "true" || pedidofinalizado === true) {
    if (guardarParcialHabilitado) {
      if (btnGuardar) btnGuardar.removeAttribute("hidden");
    } else {
      if (btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
    }

    if (procesarHabilitado && (estadoPedido === "F" || estadoPedido === "Facturado")) {
      if (btnProcesar) btnProcesar.removeAttribute("hidden");
    } else {
      if (btnGuardar) btnGuardar.removeAttribute("hidden");
      if (btnProcesar) btnProcesar.setAttribute("hidden", "hidden");
    }
  } else {
    if (btnRegresar) btnRegresar.removeAttribute("hidden");
    if (btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
    if (btnProcesar) btnProcesar.setAttribute("hidden", "hidden");
  }

  activaDevolverArticulo();
}

function todasLasFilasVerificadas() {
  const filas = document.querySelectorAll("#myTableVerificacion tbody tr");
  if (filas.length === 0) return false;

  for (let i = 0; i < filas.length; i++) {
    const celdaVerif = filas[i].querySelector("td#verificado");
    if (!celdaVerif) return false;

    const icono = celdaVerif.querySelector("i.material-icons, span.material-icons");
    if (!icono || icono.textContent !== "done_all") {
      return false;
    }
  }
  return true;
}

function activaGuardadoParcial() {
  const filas = document.querySelectorAll("#myTableVerificacion tbody tr");
  for (let i = 0; i < filas.length; i++) {
    const cantPedida = parseFloat(filas[i].querySelector("td#cantidadPedida")?.textContent) || 0;
    const cantLeida = parseFloat(filas[i].querySelector("td#cantidadLeida")?.textContent) || 0;
    if (cantLeida > cantPedida) return true;
  }
  return false;
}

function mostrarMensajesLocalStorage() {
  const mensajesStorage = localStorage.getItem("mensajes");
  const textarea = document.getElementById("mensajeText");
  if (!textarea) return;

  textarea.value = "";
  if (mensajesStorage) {
    const mensajes = JSON.parse(mensajesStorage);
    for (let i = 0; i < mensajes.length; i++) {
      textarea.value += mensajes[i] + "\n";
    }
  }
}

document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "btnTabVerificacion") {
    mostrarMensajesLocalStorage();
  }
});

window.onload = function () {
  guardarTablaEnArray();
};

function confirmarGuardadoParcial() {
  Swal.fire({
    icon: "info",
    title: "¿Desea continuar con el guardado parcial del pedido?",
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#0284c7"
  }).then((result) => {
    if (result.isConfirmed) {
      guardaParcialMente();
      localStorage.removeItem("mensaje");
    }
  });
}

function guardaParcialMente() {
  let pUsuario = document.getElementById("hUsuario") ? document.getElementById("hUsuario").value : "";
  var pConsecutivoPed = localStorage.getItem("pedidoSelect");
  var pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";

  var detalles = [];
  localStorage.removeItem("mensajes");

  let table = document.getElementById("myTableVerificacion");
  if (!table) return;

  for (let i = 1; i < table.rows.length; i++) {
    let row = table.rows[i];
    let articulo = row.querySelector("#verifica-articulo")?.textContent.trim() || "";
    let cantidadPedida = parseFloat(row.querySelector("#cantidadPedida")?.textContent) || 0;
    let cantLeida = parseFloat(row.querySelector("#cantidadLeida")?.textContent) || 0;

    detalles.push({
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_LEIDA: cantLeida
    });
  }

  var jsonDetalles = JSON.stringify(detalles);

  var pOpcion = "B";
  let matchNum = pBodega.match(/\d+/);
  let bodegaNumero = matchNum ? parseInt(matchNum[0], 10) : 0;
  if (bodegaNumero >= 51 || bodegaNumero === 5 || pBodega.includes("05")) {
    pOpcion = "N"; // Exclusivo Norwing
  }

  const params =
    "?pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pConsecutivoPed=" + pConsecutivoPed +
    "&jsonDetalles=" + jsonDetalles +
    "&pBodega=" + pBodega;

  fetch(env.API_URL + "wmsguardadopicking/G" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        Swal.fire({
          icon: "success",
          title: "Datos guardados correctamente",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#28a745"
        }).then((res) => {
          if (res.isConfirmed) {
            localStorage.setItem("autoSearchPedidos", "true");
            window.location.href = "verificacionDePedidos.html";
          }
        });
      }
    });
}

function confirmaProcesar() {
  Swal.fire({
    icon: "warning",
    title: "¿Desea procesar el pedido preparado?",
    showCancelButton: true,
    confirmButtonText: "Continuar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745"
  }).then((result) => {
    if (result.isConfirmed) {
      procesar();
    }
  });
}

function procesar() {
  let pUsuario = document.getElementById("hUsuario") ? document.getElementById("hUsuario").value : "";
  var pConsecutivoPed = localStorage.getItem("pedidoSelect");
  var pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";

  var detalles = [];
  let table = document.getElementById("myTableVerificacion");
  if (!table) return;

  for (let i = 1; i < table.rows.length; i++) {
    let row = table.rows[i];
    let articulo = row.querySelector("#verifica-articulo")?.textContent.trim() || "";
    let cantidadPedida = parseFloat(row.querySelector("#cantidadPedida")?.textContent) || 0;
    let cantLeida = parseFloat(row.querySelector("#cantidadLeida")?.textContent) || 0;

    detalles.push({
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_LEIDA: cantLeida
    });
  }

  var jsonDetalles = JSON.stringify(detalles);

  var pOpcion = "B";
  let matchNum = pBodega.match(/\d+/);
  let bodegaNumero = matchNum ? parseInt(matchNum[0], 10) : 0;
  if (bodegaNumero >= 51 || bodegaNumero === 5 || pBodega.includes("05")) {
    pOpcion = "N"; // Exclusivo Norwing
  }

  const params =
    "?pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pConsecutivoPed=" + pConsecutivoPed +
    "&jsonDetalles=" + jsonDetalles +
    "&pBodega=" + pBodega;

  fetch(env.API_URL + "wmsguardadopicking/PP" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        Swal.fire({
          icon: "success",
          title: "Pedido Procesado con éxito",
          confirmButtonText: "Finalizar",
          confirmButtonColor: "#28a745"
        }).then((res) => {
          if (res.isConfirmed) {
            localStorage.setItem("autoSearchPedidos", "true");
            window.location.href = "verificacionDePedidos.html";
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error al procesar el pedido",
          confirmButtonText: "Cerrar",
          confirmButtonColor: "#ef4444"
        });
      }
    });
}

function activaDevolverArticulo() {
  var table = document.getElementById("tblbodyVerificacion");
  if (!table) return;

  for (var i = 0; i < table.rows.length; i++) {
    var celdaEliminado = table.rows[i].cells[6];
    if (!celdaEliminado) continue;

    if (celdaEliminado.innerText.trim().toUpperCase() === "S") {
      var articulo = table.rows[i].cells[0].querySelector("#verifica-articulo")?.innerText.trim() || "";
      table.rows[i].cells[5].innerHTML = `
        <i class="material-icons" style="color: #ef4444; cursor: pointer; font-size: 22px;" onclick="devolverArticulo('${articulo}')">settings_backup_restore</i>
      `;
    }
  }
}

function devolverArticulo(articulo) {
  let table = document.getElementById("myTableVerificacion");
  let pPedido = localStorage.getItem("pedidoSelect");

  Swal.fire({
    title: "Devolver Artículo",
    text: `¿Estás seguro de devolver el artículo ${articulo} del pedido ${pPedido}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, devolver",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745"
  }).then((result) => {
    if (result.isConfirmed) {
      const params = "?pPedido=" + pPedido + "&pArticulo=" + articulo;

      fetch(env.API_URL + "devolverarticulo/D" + params, myInit)
        .then((response) => response.json())
        .then((res) => {
          if (res.msg === "SUCCESS") {
            Swal.fire({
              icon: "success",
              title: "Artículo devuelto con éxito",
              confirmButtonColor: "#28a745"
            });
            for (var i = 1; i < table.rows.length; i++) {
              var artFila = table.rows[i].cells[0].querySelector("#verifica-articulo")?.innerText.trim();
              if (artFila === articulo) {
                table.deleteRow(i);
                break;
              }
            }
          } else {
            Swal.fire({
              icon: "error",
              title: "Error al devolver el artículo",
              confirmButtonColor: "#ef4444"
            });
          }
        });
    }
  });
}

function confirmaRegresar() {
  localStorage.setItem("autoSearchPedidos", "true");
  localStorage.removeItem("mensajes");
  window.location.href = "verificacionDePedidos.html";
}

// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// //Variable global que contiene el detalle del pedido
// var detallePedidoList = "";
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// document.addEventListener("DOMContentLoaded", function () {
//   let usuario = document.getElementById("hUsuario").value;
//   console.log("hUsuario:", usuario);
//   //localStorage.setItem('UserID',usuario);

//   //inicializarBotones();
//   //--------------------------------------------------------------------------
//   if (localStorage.getItem("documento")) {
//     var documento = localStorage.getItem("documento");
//     var pedido = localStorage.getItem("pedidoSelect");
//     let estado = localStorage.getItem("estado");
//     //---------------------------------------------------------------------------
//     cargarDetallePedido(documento, pedido, estado);
//     localStorage.removeItem("dataArray"); //borra los elementos leidos del localstorage.
//   } else {
//     window.location = "index.html";
//   }
// });
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function cargarDetallePedido(documento, pedido, estado) {
//   // Concatena la variable con texto y asigna el valor al label documento y pedido
//   document.getElementById("documento").innerHTML = "Documento: " + documento;
//   document.getElementById("pedido").innerHTML = "Pedido: " + pedido;
//   document.getElementById("estadoPedido").innerHTML = "Estado: " + estado;

//   const pPedido = pedido; //Se asigna el número del peddido a una variable constante para pasarlo como parametro
//   const params = "?pPedido=" + pPedido;

//   fetch(env.API_URL + "wmsverificacionpedidos/D" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.lineaspedido.length != 0) {
//           detallePedidoList = result.lineaspedido;
//           console.log("Lineas Pedido");
//           console.log(detallePedidoList);
//           armarTablaVerificacion(detallePedidoList);
//           armarTablaLectura(detallePedidoList);
//         }
//         document.getElementById("carga").innerHTML = "";
//       }
//     });
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function armarTablaLectura(detallePedidoList) {
//   var tbody = document.getElementById("tblbodyLectura");
//   var estadoPreparacion = localStorage.getItem("EstadoPreparacion");
//   if (estadoPreparacion === "A") {
//     tbody.innerHTML = "";
//     var newRow = document.createElement("tr");
//     newRow.innerHTML = `
//                                             <td>
//                                                 <span></span>
//                                             </td>
//                                             <td class="codigo-barras-cell">
//                                                 <input id="codigo-barras" type="text" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus>
//                                             </td>
//                                             <td class="codigo-barras-cell2">
//                                                 <input id="cant-pedida" type="text" class="codigo-barras-input" value="" onchange="guardarTablaEnArray(this)" style="
//                                                 text-align: center;">
//                                             </td>
//                                             <td class="codigo-barras-cell2">
//                                                 <i class="material-icons red-text" style="cursor: pointer;" onclick="eliminarFila(this)">clear</i>
//                                             </td>
//                                         `;
//     tbody.appendChild(newRow);
//     guardarTablaEnArray();
//   } else {
//     if (estadoPreparacion != "P") {
//       tbody.innerHTML = "";
//       var newRow = document.createElement("tr");
//       newRow.innerHTML = `
//                                                 <td>
//                                                     <span></span>
//                                                 </td>
//                                                 <td class="codigo-barras-cell">
//                                                     <input id="codigo-barras" type="text" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus disabled>
//                                                 </td>
//                                                 <td class="codigo-barras-cell2">
//                                                     <input id="cant-pedida" type="text" class="codigo-barras-input" value="" onchange="guardarTablaEnArray(this)" style="
//                                                     text-align: center;" disabled>
//                                                 </td>
//                                                 <td class="codigo-barras-cell2">
//                                                     <i class="material-icons red-text" style="cursor: pointer;">clear</i>
//                                                 </td>
//                                             `;
//       tbody.appendChild(newRow);
//     } else {
//       tbody.innerHTML = "";

//       detallePedidoList.forEach(function (detalle) {
//         if (
//           detalle.CANTIDAD_VERIFICADA != null &&
//           detalle.CANTIDAD_VERIFICADA !== ""
//         ) {
//           var newRow = document.createElement("tr");
//           newRow.innerHTML = `
//                                   <td>
//                                       <span>${detalle.ARTICULO}</span>
//                                   </td>
//                                   <td class="codigo-barras-cell">
//                                       <input id="codigo-barras" type="text" class="codigo-barras-input" value="${
//                                         detalle.CODIGO_BARRA || ""
//                                       }" onchange="validarCodigoBarras(this)" autofocus readonly>
//                                   </td>
//                                   <td class="codigo-barras-cell2">
//                                       <input id="cant-pedida" type="text" class="codigo-barras-input" value="${
//                                         detalle.CANTIDAD_VERIFICADA || ""
//                                       }" onchange="guardarTablaEnArray(this)" style="
//                                       text-align: center;" readonly>
//                                   </td>
//                                   <td class="codigo-barras-cell2">
//                                       <i class="material-icons red-text" style="cursor: pointer;" onclick="eliminarFila(this)">clear</i>
//                                   </td>
//                               `;
//           tbody.appendChild(newRow);
//         }
//       });
//       verificacion();
//     }
//   }
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// /////////VALIDA EL CODIGO LEIDO EN LA PESTAÑA LECTURA//////////////////
// function validarCodigoBarras(input) {
//   var pedidoList = detallePedidoList;
//   console.log("Lineas Pedido");
//   console.log(pedidoList);
//   const codbarra = input.value.toUpperCase(); // Convertir a mayúsculas

//   const row = input.closest("tr");
//   const firstTd = row.querySelector("td:first-child");
//   const span = firstTd.querySelector("span");
//   const siguienteTd = row.querySelector(".codigo-barras-cell2");
//   const cantFila = siguienteTd.querySelector(".codigo-barras-input");

//   var codigoValido = false;

//   for (var i = 0; i < pedidoList.length; i++) {
//     let codigosArrayArticulo = [];
//     if (pedidoList[i].codigos_barras) {
//       codigosArrayArticulo = pedidoList[i].codigos_barras
//         .split("|")
//         .map((codigo) => codigo.toUpperCase());
//     }

//     if (
//       (pedidoList[i].ARTICULO &&
//         pedidoList[i].ARTICULO.toUpperCase() === codbarra) ||
//       (pedidoList[i].CODIGO_BARRA &&
//         pedidoList[i].CODIGO_BARRA.toUpperCase() === codbarra) ||
//       codigosArrayArticulo.includes(codbarra)
//     ) {
//       span.textContent = pedidoList[i].ARTICULO;
//       cantFila.value = 1;

//       // Bloquear la celda del código de barras
//       input.setAttribute("readonly", "readonly");

//       // Aquí se genera una fila nueva vacía
//       crearNuevaFila();

//       // Llamar función que guarda artículos en la tabla
//       guardarTablaEnArray();

//       codigoValido = true;
//       break;
//     }
//   }

//   if (!codigoValido) {
//     // Borrar el contenido de la celda COD
//     const codigoBarrasCell = row.querySelector(".codigo-barras-cell");
//     const codigoBarrasInput = codigoBarrasCell.querySelector(
//       ".codigo-barras-input"
//     );
//     codigoBarrasInput.value = "";

//     Swal.fire({
//       icon: "warning",
//       title: "¡Código no válido!",
//       text: "El código ingresado no coincide con ningún artículo del pedido. Intente nuevamente.",
//       confirmButtonColor: "#28a745",
//     });
//   }
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// ///// Funcion que crea la nueva fila en la pestaña lectura ////////////
// function crearNuevaFila() {
//   const tableBody = document.querySelector("#tblbodyLectura");

//   const nuevaFilaHTML = `<tr>
//         <td class="sticky-column" style="user-select: none;"> 
//             <span display: inline-block;"></span>
//         </td>
//         <td class="codigo-barras-cell">
//             <input type="text" id="codigo-barras" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" writingsuggestions="true" autofocus>
//         </td>
//         <td class="codigo-barras-cell2">
//             <input id="cant-pedida" type="text" class="codigo-barras-input" value="" onchange="validarCantidadPedida(this)" style="text-align: center"; writingsuggestions="true">
//         </td>
//         <td class="codigo-barras-cell2">
//             <i class="material-icons red-text" style="cursor: pointer;" onclick="eliminarFila(this)">clear</i>
//         </td>
//     </tr>`;

//   tableBody.insertAdjacentHTML("beforeend", nuevaFilaHTML);

//   // Obtén el último campo de entrada en la columna COD de la nueva fila
//   const nuevoCodigoBarrasInput = tableBody.querySelector(
//     "tr:last-child .codigo-barras-input"
//   );

//   // Establece el enfoque en el último campo de entrada
//   if (nuevoCodigoBarrasInput) {
//     nuevoCodigoBarrasInput.focus();
//   }
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// ///////////vALIDA LO QUE SE LEE CONTRA EL PEDIDO./////////
// function validarCantidadPedida() {
//   //Llamado a guardar datos en la variable arrray en el LS
//   guardarTablaEnArray();
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function guardarTablaEnArray() {
//   var dataArray = [];

//   var table = document.getElementById("myTableLectura");
//   var rows = table.getElementsByTagName("tr");

//   for (var i = 1; i < rows.length; i++) {
//     // Comenzamos desde 1 para omitir la fila de encabezado
//     var row = rows[i];
//     var cells = row.getElementsByTagName("td");
//     //aqui se seleccionan los elemendos de las columnas de la tabla lectura

//     var articulo = cells[0].querySelector("span").textContent.trim();
//     var codigoBarraInput = cells[1].querySelector(".codigo-barras-input");
//     var cantidadLeidaInput = cells[2].querySelector(".codigo-barras-input");

//     var codigoBarra = codigoBarraInput.value;

//     var cantidadLeida = parseFloat(cantidadLeidaInput.value);
//     // Verificar si los valores no son nulos ni vacíos antes de almacenarlos

//     if (articulo !== null && articulo !== "" && !isNaN(cantidadLeida)) {
//       var rowData = {
//         ARTICULO: articulo,
//         CODIGO_BARRA: codigoBarra,
//         CANTIDAD_LEIDA: cantidadLeida,
//       };

//       dataArray.push(rowData);
//     }
//   }

//   localStorage.setItem("dataArray", JSON.stringify(dataArray));

//   agrupar();

//   return dataArray;
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// ///////////////////////FUNCION QUE AGRUPA EL DATA ARRAY CON LAS LECTURAS DEL PEDIDO////////////////////
// function agrupar() {
//   // Obtener el arreglo almacenado en localStorage
//   var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];

//   // Objeto para almacenar las cantidades consolidadas
//   var cantidadesConsolidadas = {};

//   // Recorrer el arreglo dataArray
//   dataArray.forEach(function (item) {
//     var articulo = item.ARTICULO;
//     var cantidad = item.CANTIDAD_LEIDA;

//     // Verificar si ya existe una cantidad para este artículo
//     if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
//       // Si existe, sumar la cantidad
//       cantidadesConsolidadas[articulo] += cantidad;
//     } else {
//       // Si no existe, agregar una nueva entrada
//       cantidadesConsolidadas[articulo] = cantidad;
//     }
//   });

//   // Crear un nuevo arreglo con los resultados consolidados
//   var newArray = [];
//   for (var articulo in cantidadesConsolidadas) {
//     if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
//       newArray.push({
//         ARTICULO: articulo,
//         CANTIDAD_LEIDA: cantidadesConsolidadas[articulo],
//       });
//     }
//   }

//   // Actualizar el arreglo en localStorage con los resultados consolidados
//   localStorage.setItem("dataArray", JSON.stringify(newArray));
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// // Funcion que elimina filas en la pestaña lectura
// function eliminarFila(icon) {
//   var row = icon.closest("tr");
//   //var articuloEliminado = row.querySelector('.sticky-column').innerText.trim();

//   // Mostrar un SweetAlert antes de eliminar la fila
//   Swal.fire({
//     title: "¿Estás seguro?",
//     text: "A continuación se va a eliminar una fila de la pestaña lectura",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//     confirmButtonText: "Sí, eliminar",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       // Verificar si la fila está vacía
//       var isEmptyRow = true;
//       var cells = row.querySelectorAll(".codigo-barras-input");
//       var artic = row.querySelector;
//       cells.forEach(function (cell) {
//         if (cell.value.trim() !== "") {
//           isEmptyRow = false;
//         }
//       });

//       // Elimina la fila solo si no está vacía
//       if (isEmptyRow) {
//         // Llamar función que guarda artículos en la tabla
//         var dataFromTable = guardarTablaEnArray();

//         Swal.fire({
//           icon: "warning",
//           title: "Está intentando borrar una fila vacia",
//           confirmButtonText: "Cerrar",
//           confirmButtonColor: "#28a745",
//         });
//       } else {
//         row.remove();

//         // Después de eliminar la fila, establecer el enfoque en el último campo de entrada en la columna COD
//         const tableBody = document.querySelector("#tblbodyLectura");
//         const ultimoCodigoBarrasInput = tableBody.querySelector(
//           "tr:last-child .codigo-barras-input"
//         );

//         // Establecer el enfoque en el último campo de entrada
//         if (ultimoCodigoBarrasInput) {
//           ultimoCodigoBarrasInput.focus();
//         }
//         // Llamar a la función para actualizar filas eliminadas con el artículo eliminado como parámetro
//         guardarTablaEnArray();
//       }
//     }
//   });
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// ///FUNCIÓN QUE ARMA LA TABLA DE LA PESTAÑA VERIFICACIÓN
// function armarTablaVerificacion(detallePedidoList) {
//   // Obtener la referencia del cuerpo de la tabla
//   var tbody = document.getElementById("tblbodyVerificacion");

//   // Limpiar el contenido actual del cuerpo de la tabla
//   tbody.innerHTML = "";

//   // Obtener la referencia del label cantidadDeRegistros
//   var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
//   // Actualizar el texto del label con la cantidad de registros
//   cantidadDeRegistrosLabel.textContent =
//     "Cantidad de registros: " + detallePedidoList.length;

//   // Iterar sobre cada elemento en detallePedidoList
//   detallePedidoList.forEach(function (detalle) {
//     // Crear una nueva fila
//     var newRow = document.createElement("tr");

//     // Verificar si la columna CANTIDAD_PREPARADA es mayor a cero
//     var cantidadLeida = "";
//     if (parseFloat(detalle.CANTIDAD_PREPARADA) > 0) {
//       cantidadLeida = parseFloat(detalle.CANTIDAD_PREPARADA).toFixed(2);
//     }

//     // Construir el contenido de la fila usando variables HTML
//     newRow.innerHTML = `
//       <td id="articulo"><h5 id="verifica-articulo"><span class="blue-text text-darken-2">${
//         detalle.ARTICULO
//       }</span></h5><h6>${detalle.DESCRIPCION}</h6></td>
//       <td id="codigoDeBarras">${detalle.CODIGO_BARRA || ""}</td>
//       <td id="cantidadPedida">${
//         isNaN(parseFloat(detalle.CANTIDAD_PEDIDA))
//           ? 0
//           : parseFloat(detalle.CANTIDAD_PEDIDA).toFixed(2)
//       }</td>
//       <td id="cantidadPickin">${
//         isNaN(parseFloat(detalle.CANTIDAD_VERIFICADA))
//           ? 0
//           : parseFloat(detalle.CANTIDAD_VERIFICADA).toFixed(2)
//       }</td>
//       <td id="cantidadLeida">${cantidadLeida}</td> <!-- Mostrar el valor de CANTIDAD_PREPARADA si es mayor a 0 -->
//       <td id="verificado"></td> 
//       <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
//     `;

//     // Agregar la fila al cuerpo de la tabla
//     tbody.appendChild(newRow);
//   });

//   //verificacion();
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function limpiarMensajes() {
//   localStorage.removeItem("mensajes");
//   const mensajeTextArea = document.getElementById("mensajeText");
//   mensajeTextArea.value = "";
//   // Limpiar la variable 'mensajes' del localStorage
//   guardarTablaEnArray();
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// //FUNCION QUE VERIFICA LAS COINCIDENCIAS,TOMA LOS VALORES DE LAS CANTIDADES
// // POR ARTICULO, COMPARA LO QUE TIENE EL ARRAY DEL LS Y VERIFICA LAS COINCIDENCIAS, PARA MOSTRARLO EN LA PESTAÑA VERIFICACION
// function verificacion() {
//   var dataArray = JSON.parse(localStorage.getItem("dataArray"));
//   var cantidadesTotales = {};
//   var resultadoArray = [];
//   dataArray.forEach(function (item) {
//     var articulo = item.ARTICULO;
//     var cantidad = item.CANTIDAD_LEIDA;

//     if (cantidadesTotales[articulo]) {
//       cantidadesTotales[articulo] += cantidad;
//     } else {
//       cantidadesTotales[articulo] = cantidad;
//     }

//     if (cantidadesTotales[articulo] === cantidad) {
//       resultadoArray.push(item);
//       delete cantidadesTotales[articulo];
//     }
//   });

//   for (var articulo in cantidadesTotales) {
//     resultadoArray.push({
//       ARTICULO: articulo,
//       CANTIDAD_LEIDA: cantidadesTotales[articulo],
//     });
//   }

//   var pedidoList = detallePedidoList;
//   const mensajesArray = [];
//   let contadorMensajes = 1; // Contador para los mensajes

//   resultadoArray.forEach((resultado) => {
//     const pedido = pedidoList.find(
//       (pedido) =>
//         pedido.ARTICULO === resultado.ARTICULO &&
//         parseFloat(pedido.CANTIDAD_PEDIDA) ===
//           parseFloat(resultado.CANTIDAD_LEIDA)
//     );

//     if (pedido) {
//       const tabla = document.getElementById("myTableVerificacion");
//       if (tabla) {
//         const tbody = tabla.querySelector("tbody");
//         const filas = tbody.querySelectorAll("tr");

//         filas.forEach((fila) => {
//           const celdaARTICULO = fila.querySelector("h5");
//           if (
//             celdaARTICULO &&
//             celdaARTICULO.textContent === resultado.ARTICULO
//           ) {
//             const celdaVerificado = fila.querySelector("#verificado");
//             if (celdaVerificado) {
//               celdaVerificado.textContent = "";
//               const spanVerificacion = document.createElement("span");
//               spanVerificacion.classList.add("material-icons");
//               spanVerificacion.textContent = "done_all";
//               spanVerificacion.style.color = "green";
//               celdaVerificado.appendChild(spanVerificacion);
//             }
//             const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");
//             if (cantidadVerificadaCell) {
//               cantidadVerificadaCell.textContent = resultado.CANTIDAD_LEIDA;
//             }
//           }
//         });
//       }
//     } else {
//       const tabla = document.getElementById("myTableVerificacion");
//       if (tabla) {
//         const tbody = tabla.querySelector("tbody");
//         const filas = tbody.querySelectorAll("tr");

//         filas.forEach((fila) => {
//           const celdaARTICULO = fila.querySelector("h5");
//           if (
//             celdaARTICULO &&
//             celdaARTICULO.textContent === resultado.ARTICULO
//           ) {
//             const celdaVerificado = fila.querySelector("#verificado");
//             const cantPedida = fila.querySelector("#cantidadPedida");
//             const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");

//             if (
//               parseFloat(resultado.CANTIDAD_LEIDA) >
//               parseFloat(cantPedida.textContent)
//             ) {
//               var resultadoOperacion =
//                 "+" +
//                 (
//                   resultado.CANTIDAD_LEIDA - parseFloat(cantPedida.textContent)
//                 ).toString();
//               celdaVerificado.textContent = resultadoOperacion;
//               const mensaje = `${contadorMensajes}. La cantidad verificada del artículo ${resultado.ARTICULO} es mayor a la solicitada.`;
//               mensajesArray.push(mensaje);
//               contadorMensajes++; // Incrementar el contador
//             } else if (
//               resultado.CANTIDAD_LEIDA < parseFloat(cantPedida.textContent)
//             ) {
//               var resultadoOperacion = (
//                 resultado.CANTIDAD_LEIDA - parseFloat(cantPedida.textContent)
//               ).toString();
//               celdaVerificado.textContent = resultadoOperacion;
//               const mensaje = `${contadorMensajes}. La cantidad verificada del artículo ${resultado.ARTICULO} es menor a la solicitada.`;
//               mensajesArray.push(mensaje);
//               contadorMensajes++; // Incrementar el contador
//             }
//             if (cantidadVerificadaCell) {
//               cantidadVerificadaCell.textContent = resultado.CANTIDAD_LEIDA;
//             }
//           }
//         });
//         localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
//       }
//     }
//   });

//   const estadoPedidoElement = document.getElementById("estadoPedido");
//   const estadoPedidoText = estadoPedidoElement.textContent;
//   const estadoPedidoParts = estadoPedidoText.split(":");
//   const estadoPedido =
//     estadoPedidoParts.length > 1 ? estadoPedidoParts[1].trim() : "";
//   const procesarHabilitado = todasLasFilasVerificadas();
//   const pedidofinalizado = localStorage.getItem("pedidos_finalizados");
//   const guardarParcialHabilitado = activaGuardadoParcial();

//   if (pedidofinalizado === "true") {
//     if (guardarParcialHabilitado) {
//       const btnGuardar = document.getElementById("btnGuardar");
//       console.log("activa bonton guardar");
//       btnGuardar.removeAttribute("hidden");
//     } else {
//       btnGuardar.setAttribute("hidden", "hidden");
//     }
//     if (procesarHabilitado && estadoPedido === "F") {
//       const btnProcesar = document.getElementById("btnProcesar");
//       console.log("activa btn Procesar");
//       btnProcesar.removeAttribute("hidden");
//     } else {
//       btnGuardar.removeAttribute("hidden");
//       btnProcesar.setAttribute("hidden", "hidden");
//     }
//   } else {
//     const btnRegresar = document.getElementById("btnRegresar");
//     console.log("activa btn regresar");
//     btnRegresar.removeAttribute("hidden");
//   }

//   // if (guardarParcialHabilitado === true) {
//   //    			document.getElementById('btnGuardar').setAttribute('hidden', 'hidden');
//   //  			} else {
//   //    				document.getElementById('btnGuardar').removeAttribute('hidden');
//   //  			}

//   //  		if (procesarHabilitado == true && estadoPedido === 'F'){
//   //  				document.getElementById('btnProcesar').removeAttribute('hidden');
//   //  			}else {
//   //         document.getElementById('btnProcesar').setAttribute('hidden', 'hidden');
//   //         }

//   //      if(pedidofinalizado){
//   //       document.getElementById('btnRegresar').setAttribute('hidden', 'hidden');
//   //       }else{
//   //         document.getElementById('btnRegresar').removeAttribute('hidden');
//   //         }

//   //activaDevolverArticulo();
// } //Fin de verificacion
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // Función para verificar si todas las filas tienen el ícono "fa-check" en la columna "CANT VERIF", Y ACTIVAR EL BOTON DE PROCESAR
// function todasLasFilasVerificadas() {
//   // Obtener todas las filas de la tabla de verificación
//   const filas = document.querySelectorAll("#myTableVerificacion tbody tr");

//   for (let i = 0; i < filas.length; i++) {
//     const fila = filas[i];

//     // Obtener la celda de "CANT VERIF" en la fila actual
//     const celdaCantidadVerif = fila.querySelector("td#verificado");

//     // Verificar si la celda contiene el ícono "done_all"
//     const iconoVerificacion = celdaCantidadVerif.querySelector(
//       "span.material-icons"
//     );

//     // Si no se encuentra el ícono "done_all" en la celda, retornar falso
//     if (!iconoVerificacion || iconoVerificacion.textContent !== "done_all") {
//       return false;
//     }
//   }

//   // Si todas las celdas contienen el ícono "done_all", retornar verdadero
//   return true;
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //FUNCION QUE VERIFICA LAS CANTIDASDES LEIDAS Y DEL PEDIDO PÁRA ACTIVAR EL BOTON DE GUARDADO PARCIAL
// function activaGuardadoParcial() {
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
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
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
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// // Llama a la función mostrarMensajesLocalStorage cuando se hace clic en la pestaña "Verificación"
// document
//   .querySelector('a[href="#tabla-verificacion"]')
//   .addEventListener("click", mostrarMensajesLocalStorage);
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// window.onload = function () {
//   // inicializarBotones();
//   guardarTablaEnArray();
// };
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function mostrarProcesoEnConstruccion() {
//   Swal.fire({
//     title: "Proceso en Construcción",
//     text: "Esta funcionalidad está en construcción.",
//     icon: "info",
//     confirmButtonText: "Salir",
//     confirmButtonColor: "#28a745",
//     //cancelButtonColor: "#6e7881",
//   });
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////////////////////////////
// //Funcion de confirmación del guardado parcial
// function confirmarGuardadoParcial() {
//   Swal.fire({
//     icon: "info",
//     title: "¿Desea continuar con el guardado parcial del pedido?",
//     showCancelButton: true,
//     confirmButtonText: "Continuar",
//     cancelButtonText: "Cancelar",
//     confirmButtonColor: "#28a745",
//     //cancelButtonColor: "#6e7881",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       guardaParcialMente();
//       localStorage.removeItem("mensaje");
//     }
//   });
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// //FUNCION DE GUARDADO PARCIAL
// function guardaParcialMente() {
//   //var dataArray = JSON.parse(localStorage.getItem('dataArray'));
//   let pUsuario = document.getElementById("hUsuario").value;
//   // localStorage.getItem("username");
//   var pConsecutivoPed = localStorage.getItem("pedidoSelect");
//   var pBodega = document.getElementById("bodega").value;
//   // Array para almacenar todas las cantidades y artículos
//   var detalles = [];
//   localStorage.removeItem("mensajes");
//   // Iterar sobre todas las filas de la tabla
//   // Iterar sobre las filas de la tabla (excluyendo el encabezado)

//   let table = document.getElementById("myTableVerificacion");

//   for (let i = 1; i < table.rows.length; i++) {
//     let row = table.rows[i];
//     // Obtener el valor del artículo
//     let articulo = row
//       .querySelector("#verifica-articulo span")
//       .textContent.trim();
//     // Obtener la cantidad pedida
//     let cantidadPedida = row
//       .querySelector("#cantidadPedida")
//       .textContent.trim();
//     // Obtener la cantidad leída
//     let cantidadLeida =
//       row.querySelector("#cantidadLeida").textContent.trim() || 0;

//     // Crear un objeto para cada fila con las propiedades ARTICULO y CANTCONSEC
//     var detalle = {
//       ARTICULO: articulo,
//       CANT_CONSEC: cantidadPedida,
//       CANT_LEIDA: cantidadLeida,
//     };

//     // Agregar el objeto al array
//     detalles.push(detalle);
//   }
//   // Convertir el array de objetos a formato JSON
//   var jsonDetalles = JSON.stringify(detalles);

//   //validar la opcion si es BREMEN O NORWING
//   var pOpcion = "";
//   //  let bodega = localStorage.getItem('BodegaUsuario');
//   let bodega = pBodega;
//   // Extraer solo el número de la bodega
//   let bodegaNumero = bodega.match(/\d+/)[0];
//   if (bodegaNumero >= 51 || bodegaNumero === 5) {
//     pOpcion = "N";
//   } else {
//     pOpcion = "B";
//   }

//   const params =
//     "?pUsuario=" +
//     pUsuario +
//     "&pOpcion=" +
//     pOpcion +
//     "&pConsecutivoPed=" +
//     pConsecutivoPed +
//     "&jsonDetalles=" +
//     jsonDetalles +
//     "&pBodega=" +
//     pBodega;

//   fetch(env.API_URL + "wmsguardadopicking/G" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       console.log(result.message);
//       if (result.msg === "SUCCESS") {
//         if (result.pedidoguardado.length != 0) {
//           // Resto del código de éxito
//           Swal.fire({
//             icon: "success",
//             title: "Datos guardados correctamente",
//             confirmButtonText: "Aceptar",
//             confirmButtonColor: "#28a745",
//             //cancelButtonColor: "#6e7881",
//           }).then((result) => {
//             if (result.isConfirmed) {
//               // Redirecciona a tu otra vista aquí
//               localStorage.setItem("autoSearchPedidos", "true");
//               window.location.href = "verificacionDePedidos.html";
//             }
//           });
//         }
//       } else {
//       }
//     });
// } //fin fn
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// //Funcion de confirmación de procesar pedido
// function confirmaProcesar() {
//   Swal.fire({
//     icon: "warning",
//     title: "¿Desea procesar el pedido?",
//     showCancelButton: true,
//     confirmButtonText: "Continuar",
//     cancelButtonText: "Cancelar",
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       procesar();
//     }
//   });
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// //FUNCION DE Procesar el pedido
// function procesar() {
//   let pUsuario = document.getElementById("hUsuario").value;
//   // document.getElementById('hUsuario').value;
//   var pConsecutivoPed = localStorage.getItem("pedidoSelect");
//   var pBodega = document.getElementById("bodega").value;
//   // Array para almacenar todas las cantidades y artículos
//   var detalles = [];

//   // Obtener la tabla
//   let table = document.getElementById("myTableVerificacion");

//   // Iterar sobre las filas de la tabla (excluyendo el encabezado)
//   for (let i = 1; i < table.rows.length; i++) {
//     let row = table.rows[i];

//     // Obtener el valor del artículo
//     let articulo = row
//       .querySelector("#verifica-articulo span")
//       .textContent.trim();

//     // Obtener la cantidad pedida
//     let cantidadPedida = row
//       .querySelector("#cantidadPedida")
//       .textContent.trim();

//     // Obtener la cantidad leída
//     let cantidadLeida =
//       row.querySelector("#cantidadLeida").textContent.trim() || 0;

//     // if (isNaN(cantidadLeida) || cantidadLeida == undefined || cantidadLeida == null || cantidadLeida == "") {
//     //       cantidadLeida = 0;
//     //   }

//     // Crear un objeto para cada fila con las propiedades ARTICULO y CANTCONSEC
//     var detalle = {
//       ARTICULO: articulo,
//       CANT_CONSEC: cantidadPedida,
//       CANT_LEIDA: cantidadLeida,
//     };

//     // Agregar el objeto al array
//     detalles.push(detalle);
//   }

//   // Convertir el array de objetos a formato JSON
//   var jsonDetalles = JSON.stringify(detalles);

//   //validar la opcion si es BREMEN O NORWING
//   var pOpcion = "";
//   let bodega = pBodega;
//   // Extraer solo el número de la bodega
//   let bodegaNumero = bodega.match(/\d+/)[0];
//   if (bodegaNumero >= 51 || bodegaNumero === 5) {
//     pOpcion = "N";
//   } else {
//     pOpcion = "B";
//   }

//   const params =
//     "?pUsuario=" +
//     pUsuario +
//     "&pOpcion=" +
//     pOpcion +
//     "&pConsecutivoPed=" +
//     pConsecutivoPed +
//     "&jsonDetalles=" +
//     jsonDetalles +
//     "&pBodega=" +
//     pBodega;

//   fetch(env.API_URL + "wmsguardadopicking/PP" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       console.log(result.message);
//       if (result.msg === "SUCCESS") {
//         if (result.pedidoprocesado.length != 0) {
//           Swal.fire({
//             icon: "warning",
//             title: "Procesado con exito",
//             showCancelButton: true,
//             confirmButtonText: "Continuar",
//             cancelButtonText: "Cancelar",
//             confirmButtonColor: "#28a745",
//             cancelButtonColor: "#6e7881",
//           }).then((result) => {
//             if (result.isConfirmed) {
//               // Redirecciona a tu otra vista aquí
//               localStorage.setItem("autoSearchPedidos", "true");
//               window.location.href = "verificacionDePedidos.html";
//             }
//           });
//           //window.location.href = 'verificacionDePedidos.html';
//         }
//       } else {
//         Swal.fire({
//           icon: "error",
//           title: "Error al procesar el pedido",
//           showCancelButton: true,
//           confirmButtonText: "Continuar",
//           cancelButtonText: "Cancelar",
//           confirmButtonColor: "#28a745",
//           cancelButtonColor: "#6e7881",
//         });
//       }
//     });
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// function activaDevolverArticulo() {
//   // Obtener la tabla por su ID
//   var table = document.getElementById("tblbodyVerificacion");
//   // Iterar a través de las filas de la tabla (ignorando la fila de encabezado)
//   for (var i = 0; i < table.rows.length; i++) {
//     // Obtener el valor de la columna "ARTICULO" en cada fila
//     var articulo = table.rows[i].cells[0]
//       .querySelector("h5#verifica-articulo span")
//       .innerText.trim();

//     // Obtener el valor de la columna "articulosEliminado" en cada fila
//     var valorEliminado = table.rows[i].cells[5].innerText.trim(); // Ajuste aquí, acceder a la sexta celda

//     if (valorEliminado.toUpperCase() === "S") {
//       // Obtener el valor de la columna "ARTICULO" en cada fila
//       var articulo = table.rows[i].cells[0]
//         .querySelector("h5#verifica-articulo span")
//         .innerText.trim();
//       // Colocar el span con el ícono en la columna "VERIF" con evento onclick
//       // table.rows[i].cells[4].innerHTML = '<span class="material-symbols-outlined" style="cursor: pointer;" onclick="devolverArticulo(\'' + articulo + '\')">reply_all</span>';
//       table.rows[i].cells[4].innerHTML =
//         '<i class="material-icons" style="color: #FF0000; cursor: pointer;" onclick="devolverArticulo(\'' +
//         articulo +
//         "')\">reply</i>";
//     } else {
//       // Si no ha sido eliminado, puedes realizar alguna otra acción si es necesario
//     }
//   }
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////
// // Función para devolver un artículo eliminado del pedido
// function devolverArticulo(articulo) {
//   let table = document.getElementById("myTableVerificacion");
//   let pPedido = localStorage.getItem("pedidoSelect");
//   let pArticulo = articulo;

//   // Mostrar mensaje con swal.fire
//   swal
//     .fire({
//       title: "Devolver Artículo",
//       text:
//         "¿Estás seguro de devolver el artículo " +
//         pArticulo +
//         " del pedido número " +
//         pPedido +
//         "?",
//       icon: "question",
//       showCancelButton: true,
//       confirmButtonText: "Sí, devolver",
//       cancelButtonText: "Cancelar",
//       confirmButtonColor: "#28a745",
//       cancelButtonColor: "#6e7881",
//     })
//     .then((result) => {
//       // Si se hace clic en "Sí, devolver"
//       if (result.isConfirmed) {
//         const params = "?pPedido=" + pPedido + "&pArticulo=" + pArticulo;

//         fetch(env.API_URL + "devolverarticulo/D" + params, myInit)
//           .then((response) => response.json())
//           .then((result) => {
//             if (result.msg === "SUCCESS") {
//               if (result.articulodevuelto.length != 0) {
//                 Swal.fire({
//                   icon: "warning",
//                   title: "Articulo Devuelto con exito",
//                   showCancelButton: true,
//                   confirmButtonText: "Continuar",
//                   cancelButtonText: "Cancelar",
//                   confirmButtonColor: "#28a745",
//                   cancelButtonColor: "#6e7881",
//                 });
//                 // Iterar a través de las filas de la tabla (ignorando la fila de encabezado)
//                 for (var i = 1; i < table.rows.length; i++) {
//                   var articuloEnFila = table.rows[i].cells[0]
//                     .querySelector("h5#verifica-articulo span")
//                     .innerText.trim();

//                   // Verificar si el artículo en la fila coincide con el artículo a devolver
//                   if (articuloEnFila === articulo) {
//                     // Eliminar la fila
//                     table.deleteRow(i);

//                     // Mostrar mensaje de éxito
//                     swal.fire(
//                       "Éxito",
//                       "Artículo devuelto correctamente.",
//                       "success"
//                     );
//                     break; // Salir del bucle después de eliminar la fila
//                   }
//                 }
//               }
//             } else {
//               Swal.fire({
//                 icon: "error",
//                 title: "Error al procesar el pedido",
//                 showCancelButton: true,
//                 confirmButtonText: "Continuar",
//                 cancelButtonText: "Cancelar",
//                 confirmButtonColor: "#28a745",
//                 cancelButtonColor: "#6e7881",
//               });
//             }
//           });
//       }
//     });
// }
// /////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////
// ///////FUNCION PARA Retornar a la vista anterior//////
// function confirmaRegresar() {
//   localStorage.setItem("autoSearchPedidos", "true");
//   localStorage.removeItem("mensajes");
//   //localStorage.clear();
//   window.location.href = "verificacionDePedidos.html";
// }

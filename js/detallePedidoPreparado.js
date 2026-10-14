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
            celdaVerif.innerHTML = `<span class="material-icons" style="color: #28a745 !important; font-size: 22px; vertical-align: middle;">done_all</span>`;
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
            mensajesArray.push(`${contadorMensajes}. La cantidad preparada de ${resultado.ARTICULO} es MAYOR a la solicitada.`);
            contadorMensajes++;
          } else if (leiVal < pedVal) {
            celdaVerif.textContent = (leiVal - pedVal).toFixed(2);
            celdaVerif.style.color = "#ea580c";
            celdaVerif.style.fontWeight = "bold";
            mensajesArray.push(`${contadorMensajes}. La cantidad preparada de ${resultado.ARTICULO} es MENOR a la solicitada.`);
            contadorMensajes++;
          }
          if (celdaLeida) celdaLeida.textContent = leiVal.toFixed(2);
        }
      });
      localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
    }
  });

  // Habilitación de botones
  verificarEstadoBotones();
  activaDevolverArticulo();
}

function verificarEstadoBotones() {
  const tablaVerificacion = document.getElementById("myTableVerificacion");
  if (!tablaVerificacion) return;

  const filas = tablaVerificacion.querySelectorAll("tbody tr");
  
  let hayAlMenosUnaLectura = false;
  let todasCompletadasSuficientes = true;

  if (filas.length === 0) {
    todasCompletadasSuficientes = false;
  }

  filas.forEach((fila) => {
    const cantPedida = parseFloat(fila.querySelector("#cantidadPedida")?.textContent) || 0;
    const celdaLeida = fila.querySelector("#cantidadLeida");
    const cantLeida = celdaLeida && celdaLeida.textContent.trim() !== "" ? parseFloat(celdaLeida.textContent) : 0;

    if (cantLeida > 0) {
      hayAlMenosUnaLectura = true;
    }
    if (cantLeida < cantPedida) {
      todasCompletadasSuficientes = false;
    }
  });

  const estadoPedidoEl = document.getElementById("estadoPedido");
  const estadoPedidoText = estadoPedidoEl ? estadoPedidoEl.textContent.trim() : "";
  const estadoPedido = estadoPedidoText.includes(":") ? estadoPedidoText.split(":")[1].trim() : estadoPedidoText;
  
  const esPedidoValido = estadoPedido === "F" || estadoPedido === "Facturado" || estadoPedido === "Pendiente";

  const btnGuardar = document.getElementById("btnGuardar");
  const btnProcesar = document.getElementById("btnProcesar");

  if (btnGuardar) {
    if (hayAlMenosUnaLectura) {
      btnGuardar.style.display = "inline-flex";
    } else {
      btnGuardar.style.display = "none";
    }
  }

  if (btnProcesar) {
    if (todasCompletadasSuficientes && esPedidoValido) {
      btnProcesar.style.display = "inline-flex";
    } else {
      btnProcesar.style.display = "none";
    }
  }
}

function validarCantidadPedida() {
  guardarTablaEnArray();
  verificacion();
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

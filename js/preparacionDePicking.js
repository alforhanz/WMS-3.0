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
    localStorage.removeItem("dataArray"); // Limpia lecturas previas
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
  if (typeof mostrarLoader === "function") mostrarLoader("Cargando líneas de picking...");
      fetch(env.API_URL + "wmsverificacionpedidos/D" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.lineaspedido && result.lineaspedido.length !== 0) {
          detallePedidoList = result.lineaspedido;
          armarTablaVerificacion(detallePedidoList);

          const siGuardadoParcial = detallePedidoList.some(
            (detalle) =>
              detalle.CANTIDAD_VERIFICADA != null &&
              detalle.CANTIDAD_VERIFICADA !== "" &&
              parseFloat(detalle.CANTIDAD_VERIFICADA) > 0
          );

          if (siGuardadoParcial) {
            armarTablaLectura(detallePedidoList);
          }
          
          // OBLIGATORIO: Forzar el ocultamiento de los botones en la carga inicial
          verificacion();
        }
        if (typeof ocultarLoader === "function") ocultarLoader();
      } else {
        if (typeof ocultarLoader === "function") ocultarLoader();
      }
    })
    .catch((error) => {
      console.error("Error al cargar detalle picking:", error);
      if (typeof ocultarLoader === "function") ocultarLoader();
    });

  // fetch(env.API_URL + "wmsverificacionpedidos/D" + params, myInit)
  //   .then((response) => response.json())
  //   .then((result) => {
  //     if (result.msg === "SUCCESS") {
  //       if (result.lineaspedido && result.lineaspedido.length !== 0) {
  //         console.log("RESPUESTA: "+result.lineaspedido);
  //         detallePedidoList = result.lineaspedido;
  //         armarTablaVerificacion(detallePedidoList);

  //         const siGuardadoParcial = detallePedidoList.some(
  //           (detalle) =>
  //             detalle.CANTIDAD_VERIFICADA != null &&
  //             detalle.CANTIDAD_VERIFICADA !== "" &&
  //             parseFloat(detalle.CANTIDAD_VERIFICADA) > 0
  //         );

  //         if (siGuardadoParcial) {
  //           armarTablaLectura(detallePedidoList);
  //         }
  //       }
  //       if (typeof ocultarLoader === "function") ocultarLoader();
  //     } else {
  //       if (typeof ocultarLoader === "function") ocultarLoader();
  //     }
  //   })
  //   .catch((error) => {
  //     console.error("Error al cargar detalle picking:", error);
  //     if (typeof ocultarLoader === "function") ocultarLoader();
  //   });
}

function armarTablaLectura(detallePedidoList) {
  var tbody = document.getElementById("tblbodyLectura");
  if (!tbody) return;

  tbody.innerHTML = "";

  detallePedidoList.forEach(function (detalle) {
    let cantVerif = parseFloat(detalle.CANTIDAD_VERIFICADA) || 0;
    if (cantVerif > 0) {
      var newRow = document.createElement("tr");

      newRow.innerHTML = `
        <td class="cell-center">
          <span style="font-weight: 600; color: #1e293b;">${detalle.ARTICULO}</span>
        </td>
        <td>
          <input type="text" class="codigo-barras-input" value="${detalle.CODIGO_BARRA || ""}" onchange="validarCodigoBarras(this)" autofocus autocomplete="off">
        </td>                
        <td>
          <input type="text" class="codigo-barras-input" value="${cantVerif}" onchange="guardarTablaEnArray(this)" autocomplete="off">
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

      // Forzar verificación para habilitar los botones dinámicamente
      verificacion(); 

      codigoValido = true;
      break;
    }
  }

  if (!codigoValido) {
    input.value = "";
    Swal.fire({
      icon: "warning",
      title: "¡Código no válido!",
      text: "El código ingresado no coincide con ningún artículo de este pedido.",
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
  verificacion();
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
    text: "Se eliminará esta línea de la preparación de picking.",
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

    newRow.innerHTML = `
      <td id="articulo" style="text-align: left;">
        <div class="cell-articulo-box">
          <span id="verifica-articulo" class="cell-articulo-code" style="color: #0284c7;">${detalle.ARTICULO}</span>
          <span class="cell-articulo-desc">${detalle.DESCRIPCION}</span>
        </div>
      </td>
      <td id="codigoDeBarras" class="cell-center">${detalle.CODIGO_BARRA || ""}</td>
      <td id="cantidadPedida" class="cell-number">${
        isNaN(parseFloat(detalle.CANTIDAD_PEDIDA)) ? "0.00" : parseFloat(detalle.CANTIDAD_PEDIDA).toFixed(2)
      }</td>
      <td id="cantidadLeida" class="cell-number"></td>
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
        if (celdaArt && celdaArt.textContent.trim() === resultado.ARTICULO) {
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
        if (celdaArt && celdaArt.textContent.trim() === resultado.ARTICULO) {
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
  verificarEstadoBotones();
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
    title: "¿Desea guardar parcialmente la preparación?",
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
    let cantidad = parseFloat(row.querySelector("#cantidadPedida")?.textContent) || 0;
    let cantLeida = parseFloat(row.querySelector("#cantidadLeida")?.textContent) || 0;

    if (isNaN(cantLeida)) cantLeida = 0;

    detalles.push({
      ARTICULO: articulo,
      CANT_CONSEC: cantidad,
      CANT_LEIDA: cantLeida
    });
  }

  var jsonDetalles = JSON.stringify(detalles);

  var pOpcion = "B";
  let matchNum = pBodega.match(/\d+/);
  let bodegaNumero = matchNum ? parseInt(matchNum[0], 10) : 0;
  if ((bodegaNumero >= 51 && bodegaNumero <= 55) || pBodega.includes("05")) {
    pOpcion = "N";
  }

  const params =
    "?pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pConsecutivoPed=" + pConsecutivoPed +
    "&jsonDetalles=" + encodeURIComponent(jsonDetalles) +
    "&pBodega=" + pBodega;

  fetch(env.API_URL + "wmsguardadopicking/G" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log("GUARDADO: "+result)
      if (result.msg === "SUCCESS") {
        Swal.fire({
          icon: "success",
          title: "Datos guardados correctamente",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#28a745"
        }).then((res) => {
          if (res.isConfirmed) {
            localStorage.setItem("autoSearchPedidos", "true");
            window.location.href = "verificacionDePicking.html";
          }
        });
      }
    });
}

function confirmaProcesar() {
  Swal.fire({
    icon: "warning",
    title: "¿Desea procesar el picking del pedido?",
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
  if ((bodegaNumero >= 51 && bodegaNumero <= 55) || pBodega.includes("05")) {
    pOpcion = "N"; // Exclusivo Norwing
  }

  const params =
    "?pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pConsecutivoPed=" + pConsecutivoPed +
    "&jsonDetalles=" + jsonDetalles +
    "&pBodega=" + pBodega;

  fetch(env.API_URL + "wmsguardadopicking/P" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        Swal.fire({
          icon: "success",
          title: "Preparación de Picking completada",
          text: result.pedidoprocesado && result.pedidoprocesado[0] ? result.pedidoprocesado[0].Respuesta : "Pedido procesado exitosamente",
          confirmButtonText: "Finalizar",
          confirmButtonColor: "#28a745"
        }).then((res) => {
          if (res.isConfirmed) {
            localStorage.setItem("autoSearchPedidos", "true");
            window.location.href = "verificacionDePicking.html";
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
    var celdaEliminado = table.rows[i].cells[5];
    if (!celdaEliminado) continue;

    if (celdaEliminado.innerText.trim().toUpperCase() === "S") {
      var articulo = table.rows[i].cells[0].querySelector("#verifica-articulo")?.innerText.trim() || "";
      table.rows[i].cells[4].innerHTML = `
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
  window.location.href = "verificacionDePicking.html";
}
//---------------------------------------------------------------------------
// VALIDAR ESTADOS Y HABILITACIÓN DE BOTONES (GUARDAR Y PREPARAR)
//---------------------------------------------------------------------------
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
    // 1. Obtener la cantidad Solicitada (Pedida)
    const cantPedida = parseFloat(fila.querySelector("#cantidadPedida")?.textContent) || 0;
    
    // 2. Obtener la cantidad Preparada (Leída). 
    // Si la celda está vacía, el valor es 0.
    const celdaLeida = fila.querySelector("#cantidadLeida");
    const cantLeida = celdaLeida && celdaLeida.textContent.trim() !== "" 
                      ? parseFloat(celdaLeida.textContent) 
                      : 0;

    // Regla para botón GUARDAR:
    if (cantLeida > 0) {
      hayAlMenosUnaLectura = true;
    }

    // Regla para botón PROCESAR/PREPARAR:
    // La cantidad preparada debe ser obligatoriamente MAYOR O IGUAL a la solicitada.
    if (cantLeida < cantPedida) {
      todasCompletadasSuficientes = false;
    }
  });

  // Estado del pedido desde la cabecera (Pendiente, F, Facturado)
  const estadoPedidoEl = document.getElementById("estadoPedido");
  const estadoPedidoText = estadoPedidoEl ? estadoPedidoEl.textContent.trim() : "";
  const estadoPedido = estadoPedidoText.includes(":") ? estadoPedidoText.split(":")[1].trim() : estadoPedidoText;
  
  // Validar si es un pedido válido para procesar
  const esPedidoValido = estadoPedido === "F" || estadoPedido === "Facturado" || estadoPedido === "Pendiente";

  const btnGuardar = document.getElementById("btnGuardar");
  const btnProcesar = document.getElementById("btnProcesar");

  // Control estricto con display para evitar conflictos de estilos CSS
  if (btnGuardar) {
    if (hayAlMenosUnaLectura) {
      btnGuardar.style.display = "inline-flex";
    } else {
      btnGuardar.style.display = "none";
    }
  }

  // Control estricto para Procesar
  if (btnProcesar) {
    if (todasCompletadasSuficientes && esPedidoValido) {
      btnProcesar.style.display = "inline-flex";
    } else {
      btnProcesar.style.display = "none";
    }
  }
}
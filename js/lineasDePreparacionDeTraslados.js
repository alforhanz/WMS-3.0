// Variable global que contiene el detalle del traslado
var detalleTrasladoList = "";

document.addEventListener("DOMContentLoaded", function () {
  let hUser = document.getElementById("hUsuario");
  let usuario = hUser ? hUser.value : "";
  console.log("hUsuario:", usuario);

  var documento = localStorage.getItem("traslado");
  cargarLineasTraslado(documento);
  localStorage.removeItem("dataArray");
});

function cargarLineasTraslado(documento) {
  const elDoc = document.getElementById("documento");
  const elOrigen = document.getElementById("bodega-origen");
  const elDestino = document.getElementById("bodega-destino");

  const bodegaOrigen = localStorage.getItem("bodegaUser") || "";
  const bodegaDestino = localStorage.getItem("destinoBodegaTraslado") || "";

  if (elDoc) elDoc.textContent = documento;
  if (elOrigen) elOrigen.textContent = bodegaOrigen;
  if (elDestino) elDestino.textContent = bodegaDestino;

  let parametros = localStorage.getItem("ListParamsDetalle") || "";
  const params = parametros + "&Aplicacion=" + documento;

  if (typeof mostrarLoader === "function") mostrarLoader("Cargando líneas del traslado...");

  fetch(env.API_URL + "wmspreparaciondetraslados" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta.length !== 0) {
          detalleTrasladoList = result.respuesta;
          localStorage.setItem("pAplicacion", detalleTrasladoList[0].APLICACION || "");

          armarTablaVerificacion(detalleTrasladoList);

          const siGuardadoParcial = detalleTrasladoList.some(
            (detalle) =>
              detalle.LINEAS_PREPARADAS != null &&
              detalle.LINEAS_PREPARADAS !== "" &&
              parseFloat(detalle.LINEAS_PREPARADAS) > 0
          );

          if (siGuardadoParcial) {
            armarTablaLectura(detalleTrasladoList);
          }
        }
      }
    })
    .catch((error) => {
      console.error("Error al cargar traslado:", error);
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function armarTablaLectura(detalleTrasladoList) {
  var tbody = document.getElementById("tblbodyLectura");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (Array.isArray(detalleTrasladoList) && detalleTrasladoList.length > 0) {
    detalleTrasladoList.forEach(function (detalle) {
      let cantPrep = parseFloat(detalle.LINEAS_PREPARADAS) || 0;
      if (cantPrep > 0) {
        var newRow = document.createElement("tr");
        newRow.innerHTML = `
          <td class="cell-center">
            <span style="font-weight: 600; color: #1e293b;">${detalle.ARTICULO || ""}</span>
          </td>
          <td>
            <input type="text" class="codigo-barras-input" value="${detalle.CODIGO_BARRA || ""}" onchange="validarCodigoBarras(this)" autofocus autocomplete="off">
          </td>
          <td>
            <input type="text" class="codigo-barras-input" value="${cantPrep}" onchange="guardarTablaEnArray(this)" autocomplete="off">
          </td>
          <td class="cell-center">
            <i class="material-icons" style="cursor: pointer; color: #ef4444; font-size: 20px;" onclick="eliminarFila(this)">delete</i>
          </td>
        `;
        tbody.appendChild(newRow);
      }
    });
  }

  guardarTablaEnArray();
  crearNuevaFila();
  verificacion();
}

function validarCodigoBarras(input) {
  var TrasladoList = detalleTrasladoList;
  const codbarra = input.value.toUpperCase().trim();

  if (codbarra === "") return;

  const row = input.closest("tr");
  const span = row.cells[0].querySelector("span");
  const cantFila = row.cells[2].querySelector("input");

  var codigoValido = false;

  for (var i = 0; i < TrasladoList.length; i++) {
    let codigosArrayArticulo = [];
    let codigosNuevos = [];

    if (TrasladoList[i].codigos_barras) {
      codigosArrayArticulo = String(TrasladoList[i].codigos_barras)
        .split("|")
        .map((codigo) => codigo.trim().toUpperCase())
        .filter((codigo) => codigo !== "");
    }

    if (TrasladoList[i].codigos_barras_nuevas) {
      codigosNuevos = String(TrasladoList[i].codigos_barras_nuevas)
        .split("|")
        .map((codigo) => codigo.trim().toUpperCase())
        .filter((codigo) => codigo !== "");
    }

    let codbarraBusqueda = codbarra;

    if (
      (TrasladoList[i].ARTICULO && TrasladoList[i].ARTICULO.toUpperCase() === codbarraBusqueda) ||
      (TrasladoList[i].CODIGO_BARRA && TrasladoList[i].CODIGO_BARRA.toUpperCase() === codbarraBusqueda) ||
      codigosNuevos.includes(codbarraBusqueda) ||
      codigosArrayArticulo.includes(codbarraBusqueda)
    ) {
      span.textContent = TrasladoList[i].ARTICULO;
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
      title: "Código no válido",
      text: "El código ingresado no coincide con ningún artículo del traslado.",
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
    text: "Se eliminará esta línea de la preparación del traslado.",
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

function armarTablaVerificacion(detalleTrasladoList) {
  var tbody = document.getElementById("tblbodyVerificacion");
  if (!tbody) return;
  tbody.innerHTML = "";

  var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
  if (cantidadDeRegistrosLabel) {
    cantidadDeRegistrosLabel.textContent = "Cantidad de registros: " + detalleTrasladoList.length;
  }

  detalleTrasladoList.forEach(function (detalle) {
    var newRow = document.createElement("tr");

    let cantPed = parseFloat(detalle.CANTIDAD_PEDIDA) || 0;

    newRow.innerHTML = `
      <td id="articulo" style="text-align: left;">
        <div class="cell-articulo-box">
          <span id="verifica-articulo" class="cell-articulo-code" style="color: #0284c7;">${detalle.ARTICULO || ""}</span>
          <span class="cell-articulo-desc">${detalle.DESCRIPCION || ""}</span>
        </div>
      </td>
      <td id="codigoDeBarras" class="cell-center">${detalle.CODIGO_BARRA || ""}</td>
      <td id="cantidadPedida" class="cell-number">${cantPed.toFixed(2)}</td>
      <td id="cantidadLeida" class="cell-number"></td>
      <td id="verificado" class="cell-center"></td>
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

  var TrasladoList = detalleTrasladoList || [];
  const mensajesArray = [];
  let contadorMensajes = 1;

  resultadoArray.forEach((resultado) => {
    const traslado = TrasladoList.find(
      (t) =>
        t.ARTICULO === resultado.ARTICULO &&
        parseFloat(t.CANTIDAD_PEDIDA) === parseFloat(resultado.CANTIDAD_LEIDA)
    );

    const filas = tabla ? tabla.querySelectorAll("tbody tr") : [];

    if (traslado) {
      filas.forEach((fila) => {
        const celdaArt = fila.querySelector("#verifica-articulo");
        if (celdaArt && celdaArt.textContent.trim() === resultado.ARTICULO) {
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
        if (celdaArt && celdaArt.textContent.trim() === resultado.ARTICULO) {
          const celdaVerif = fila.querySelector("#verificado");
          const cantPedida = fila.querySelector("#cantidadPedida");
          const celdaLeida = fila.querySelector("#cantidadLeida");

          const pedVal = parseFloat(cantPedida?.textContent) || 0;
          const leiVal = parseFloat(resultado.CANTIDAD_LEIDA) || 0;

          if (leiVal > pedVal) {
            celdaVerif.textContent = "+" + (leiVal - pedVal).toFixed(2);
            celdaVerif.style.color = "#dc2626";
            celdaVerif.style.fontWeight = "bold";
            mensajesArray.push(`${contadorMensajes}. La cantidad preparada del artículo ${resultado.ARTICULO} supera la solicitada.`);
            contadorMensajes++;
          } else if (leiVal < pedVal) {
            celdaVerif.textContent = (leiVal - pedVal).toFixed(2);
            celdaVerif.style.color = "#ea580c";
            celdaVerif.style.fontWeight = "bold";
            mensajesArray.push(`${contadorMensajes}. La cantidad preparada del artículo ${resultado.ARTICULO} es menor a la solicitada.`);
            contadorMensajes++;
          }
          if (celdaLeida) celdaLeida.textContent = leiVal.toFixed(2);
        }
      });
      localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
    }
  });

  let procesarHabilitado = todasLasFilasVerificadas();
  let trasladospreparados = localStorage.getItem("trasladosprocesados") === "true";
  let guardarParcialHabilitado = activaGuardadoParcial();

  const btnGuardar = document.getElementById("btnGuardar");
  const btnPreparar = document.getElementById("btnPreparar");
  const btnRegresar = document.getElementById("btnRegresar");

  if (guardarParcialHabilitado) {
    if (btnGuardar) btnGuardar.removeAttribute("hidden");
  } else {
    if (btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
  }

  if (procesarHabilitado) {
    if (btnPreparar) btnPreparar.removeAttribute("hidden");
    if (btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
  } else {
    if (btnPreparar) btnPreparar.setAttribute("hidden", "hidden");
  }

  if (trasladospreparados) {
    if (btnRegresar) btnRegresar.setAttribute("hidden", "hidden");
  } else {
    if (btnRegresar) btnRegresar.removeAttribute("hidden");
    if (btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
    if (btnPreparar) btnPreparar.setAttribute("hidden", "hidden");
  }

  const observacion = document.getElementById("observaciones");
  if (observacion && TrasladoList.length > 0) {
    observacion.value = TrasladoList[0].OBSERVACION || "";
  }
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
    const celdaLeida = filas[i].querySelector("td#cantidadLeida");
    if (celdaLeida && parseFloat(celdaLeida.textContent) >= 0 && celdaLeida.textContent.trim() !== "") {
      return true;
    }
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
    textarea.value = mensajes.join("\n");
  }
}

window.onload = function () {
  guardarTablaEnArray();
};

function confirmarGuardadoParcial() {
  Swal.fire({
    icon: "info",
    title: "¿Desea guardar parcialmente el traslado?",
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
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pConsecutivo = localStorage.getItem("traslado");
  let pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let pTipoConsecutivo = "S";
  let pBodegaDestino = localStorage.getItem("destinoBodegaTraslado");
  let pAplicacion = localStorage.getItem("pAplicacion");
  let pSistema = "WMS";
  let pOpcion = "B";

  let matchNum = pBodega.match(/\d+/);
  let bodegaNumero = matchNum ? parseInt(matchNum[0], 10) : 0;
  if ((bodegaNumero >= 51 && bodegaNumero <= 55) || pBodega.includes("05")) {
    pOpcion = "N";
  }

  let pModulo = "WMS_PK";
  let pEstado = "G";

  var detalles = [];
  localStorage.removeItem("mensajes");

  let table = document.getElementById("myTableVerificacion");
  if (!table) return;

  for (let i = 1; i < table.rows.length; i++) {
    let row = table.rows[i];
    let articulo = row.querySelector("#verifica-articulo")?.textContent.trim() || "";
    let cantidadPedida = row.querySelector("#cantidadPedida")?.textContent.trim() || "0";
    let cantidadLeida = row.querySelector("#cantidadLeida")?.textContent.trim() || 0;

    detalles.push({
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_LEIDA: cantidadLeida
    });
  }

  var jsonDetalles = JSON.stringify(detalles);

  const params =
    "?pSistema=" + pSistema +
    "&pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pModulo=" + pModulo +
    "&pConsecutivo=" + pConsecutivo +
    "&pBodega=" + pBodega +
    "&jsonDetalles=" + encodeURIComponent(jsonDetalles) +
    "&pEstado=" + pEstado +
    "&pTipoConsecutivo=" + pTipoConsecutivo +
    "&pBodegaDestino=" + pBodegaDestino +
    "&pAplicacion=" + pAplicacion;

  if (typeof mostrarLoader === "function") mostrarLoader("Guardando avance del traslado...");

  fetch(env.API_URL + "wmsinsertupdatepickingtraslado" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      if (result.msg === "SUCCESS") {
        Swal.fire({
          icon: "success",
          title: "Datos guardados correctamente",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#28a745"
        }).then((res) => {
          if (res.isConfirmed) {
            localStorage.setItem("autoSearchTraslados", "true");
          }
        });
      }
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function confirmaPreparar() {
  Swal.fire({
    icon: "warning",
    title: "¿Desea preparar el traslado de manera definitiva?",
    showCancelButton: true,
    confirmButtonText: "Preparar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745"
  }).then((result) => {
    if (result.isConfirmed) {
      preparar();
    }
  });
}

function preparar() {
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let pConsecutivo = localStorage.getItem("traslado");
  let pBodega = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let pTipoConsecutivo = "S";
  let pBodegaDestino = localStorage.getItem("destinoBodegaTraslado");
  let pAplicacion = localStorage.getItem("pAplicacion");
  let pSistema = "WMS";
  let pOpcion = "B";

  let matchNum = pBodega.match(/\d+/);
  let bodegaNumero = matchNum ? parseInt(matchNum[0], 10) : 0;
  if ((bodegaNumero >= 51 && bodegaNumero <= 55) || pBodega.includes("05")) {
    pOpcion = "N";
  }

  let pModulo = "WMS_PK";
  let pEstado = "A";

  var detalles = [];
  localStorage.removeItem("mensajes");

  let table = document.getElementById("myTableVerificacion");
  if (!table) return;

  for (let i = 1; i < table.rows.length; i++) {
    let row = table.rows[i];
    let articulo = row.querySelector("#verifica-articulo")?.textContent.trim() || "";
    let cantidadPedida = row.querySelector("#cantidadPedida")?.textContent.trim() || "0";
    let cantidadLeida = row.querySelector("#cantidadLeida")?.textContent.trim() || 0;

    detalles.push({
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_LEIDA: cantidadLeida
    });
  }

  var jsonDetalles = JSON.stringify(detalles);

  const params =
    "?pSistema=" + pSistema +
    "&pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&pModulo=" + pModulo +
    "&pConsecutivo=" + pConsecutivo +
    "&pBodega=" + pBodega +
    "&jsonDetalles=" + encodeURIComponent(jsonDetalles) +
    "&pEstado=" + pEstado +
    "&pTipoConsecutivo=" + pTipoConsecutivo +
    "&pBodegaDestino=" + pBodegaDestino +
    "&pAplicacion=" + pAplicacion;

  if (typeof mostrarLoader === "function") mostrarLoader("Preparando traslado...");

  fetch(env.API_URL + "wmsinsertupdatepickingtraslado" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        Swal.fire({
          icon: "success",
          title: "Traslado preparado correctamente",
          confirmButtonText: "Finalizar",
          confirmButtonColor: "#28a745"
        }).then((res) => {
          if (res.isConfirmed) {
            localStorage.setItem("autoSearchTraslados", "true");
            window.location.href = "verificacionDePickingDetraslados.html";
          }
        });
      }
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function confirmaRegresar() {
  localStorage.setItem("autoSearchPedidos", "true");
  localStorage.removeItem("mensajes");
  localStorage.setItem("autoSearchTraslados", "true");
  window.location.href = "verificacionDePickingDetraslados.html";
}

// //Variable global que contiene el detalle del traslado
// var detalleTrasladoList = "";
// document.addEventListener("DOMContentLoaded", function () {
//   let usuario = document.getElementById("hUsuario").value;
//   console.log("hUsuario:", usuario);
//   //--------------------------------------------------------------------------
//   var documento = localStorage.getItem("traslado");
//   cargarLineasTraslado(documento);
//   localStorage.removeItem("dataArray"); //borra los elementos leidos del localstorage.

//   const verificacionTab = document.querySelector(
//     'a[href="#tabla-verificacion"]'
//   );
//   const observacionesContainer = document.getElementById(
//     "observaciones-container"
//   );

//   // Escuchar clic en la pestaña de Verificación
//   verificacionTab.addEventListener("click", function () {
//     observacionesContainer.style.display = "block"; // Mostrar textarea
//   });

//   // Escuchar clic en la pestaña de Lectura
//   const lecturaTab = document.querySelector('a[href="#tabla-lectura"]');
//   lecturaTab.addEventListener("click", function () {
//     observacionesContainer.style.display = "none"; // Ocultar textarea
//   });
// });

// function cargarLineasTraslado(documento) {
//   // Actualizar el label con el documento y traslado
//   document.getElementById("documento").innerHTML = "Documento: " + documento;
//   const bodegaOrigen=localStorage.getItem("bodegaUser");
//   const bodegaDestino=localStorage.getItem("destinoBodegaTraslado");
//   document.getElementById("bodega-origen").innerHTML = "Bodega-origen: " + bodegaOrigen;
//   document.getElementById("bodega-destino").innerHTML = "Bodega-Destino: " + bodegaDestino;

//   // Obtener los parámetros guardados en localStorage
//   let parametros = localStorage.getItem("ListParamsDetalle");

//   // Parametros adicionales para el detalle del traslado
//   const params = parametros + "&Aplicacion=" + documento;
//   mostrarLoader();
//   fetch(env.API_URL + "wmspreparaciondetraslados" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.respuesta.length !== 0) {
//           // Guardar el detalle del traslado en una variable
//           detalleTrasladoList = result.respuesta;
//           console.log("Detalle del traslado:", detalleTrasladoList);

//           // Guardar la aplicación en localStorage
//           localStorage.setItem("pAplicacion", detalleTrasladoList[0].APLICACION
//           );

//           // Llamar a la función para armar la tabla de verificación
//           armarTablaVerificacion(detalleTrasladoList);
//           ocultarLoader();

//           // Verificar si hay líneas previamente preparadas y si las hay, armar la tabla de lectura
//           const siGuardadoParcial = detalleTrasladoList.some(
//             (detalle) =>
//               detalle.LINEAS_PREPARADAS != null &&
//               detalle.LINEAS_PREPARADAS !== ""
//           );
//           if (siGuardadoParcial) {
//             armarTablaLectura(detalleTrasladoList);
//           }
//         }

//         // Limpiar la pantalla de carga
//         document.getElementById("carga").innerHTML = "";
//       }
//     });
// }
// function armarTablaLectura(detalleTrasladoList) {
//   var tbody = document.getElementById("tblbodyLectura");
//   if (!tbody) return;
//   tbody.innerHTML = "";

//   // Renderizar las líneas existentes si tienen datos
//   if (Array.isArray(detalleTrasladoList) && detalleTrasladoList.length > 0) {
//     detalleTrasladoList.forEach(function (detalle) {
//       if (
//         detalle.LINEAS_PREPARADAS != null &&
//         detalle.LINEAS_PREPARADAS !== "" &&
//         parseFloat(detalle.LINEAS_PREPARADAS) > 0
//       ) {
//         var newRow = document.createElement("tr");
//         newRow.innerHTML = `
//           <td><span>${detalle.ARTICULO || ''}</span></td>
//           <td class="codigo-barras-cell">
//             <input type="text" class="codigo-barras-input" value="${detalle.CODIGO_BARRA || ''}" onchange="validarCodigoBarras(this)" autofocus>
//           </td>
//           <td class="codigo-barras-cell2">
//             <input type="text" class="codigo-barras-input" value="${detalle.LINEAS_PREPARADAS || ''}" onchange="guardarTablaEnArray(this)" style="text-align: center;">
//           </td>
//           <td class="codigo-barras-cell2">
//             <i class="material-icons red-text" style="cursor: pointer;" onclick="eliminarFila(this)">clear</i>
//           </td>
//         `;
//         tbody.appendChild(newRow);
//       }
//     });
//   }

//   // Sincronizar estado, permitir agregar nuevas filas y evaluar botones
//   guardarTablaEnArray();
//   crearNuevaFila();
//   verificacion();
// }

// function validarCodigoBarras(input) {
//   var TrasladoList = detalleTrasladoList;
//   console.log("Lineas Traslado");
//   console.log(TrasladoList);
//   const codbarra = input.value.toUpperCase(); // Convertir a mayúsculas

//   const row = input.closest("tr");
//   const firstTd = row.querySelector("td:first-child");
//   const span = firstTd.querySelector("span");
//   const siguienteTd = row.querySelector(".codigo-barras-cell2");
//   const cantFila = siguienteTd.querySelector(".codigo-barras-input");

//   var codigoValido = false;

//     for (var i = 0; i < TrasladoList.length; i++) {
//       let codigosArrayArticulo = [];
//       let codigosNuevos = [];

//       // Procesar códigos de barras estándar
//       if (TrasladoList[i].codigos_barras) {
//         codigosArrayArticulo = String(TrasladoList[i].codigos_barras)
//           .split("|")
//           .map((codigo) => codigo.trim().toUpperCase())
//           .filter((codigo) => codigo !== "");
//       }

//       // Procesar códigos de barras nuevos (Asegurando String y limpieza)
//       if (TrasladoList[i].codigos_barras_nuevas) {
//         codigosNuevos = String(TrasladoList[i].codigos_barras_nuevas)
//           .split("|")
//           .map((codigo) => codigo.trim().toUpperCase())
//           .filter((codigo) => codigo !== "");
//       }

//       // Normalizar el código escaneado/ingresado
//       let codbarraBusqueda = codbarra ? codbarra.trim().toUpperCase() : "";

//       if (
//         (TrasladoList[i].ARTICULO &&
//           TrasladoList[i].ARTICULO.toUpperCase() === codbarraBusqueda) ||
//         (TrasladoList[i].CODIGO_BARRA &&
//           TrasladoList[i].CODIGO_BARRA.toUpperCase() === codbarraBusqueda) ||
//         codigosNuevos.includes(codbarraBusqueda) ||
//         codigosArrayArticulo.includes(codbarraBusqueda)
//       ) {
//         span.textContent = TrasladoList[i].ARTICULO;
//         cantFila.value = 1;

//         // Bloquear la celda del código de barras
//         input.setAttribute("readonly", "readonly");

//         // Generar nueva fila y guardar
//         crearNuevaFila();
//         guardarTablaEnArray();

//         codigoValido = true;
//         break;
//       }
//     }

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
//       text: "El código ingresado no coincide con ningún artículo del traslado. Intente nuevamente.",
//       confirmButtonColor: "#28a745",
//     });
//   }
// }
// ///// Funcion que crea la nueva fila en la pestaña lectura ////////////
// function crearNuevaFila() {
//   const tableBody = document.querySelector("#tblbodyLectura");

//   const nuevaFilaHTML = `<tr>
//           <td class="sticky-column" style="user-select: none;"> 
//               <span display: inline-block;"></span>
//           </td>
//           <td class="codigo-barras-cell">
//               <input type="text" writingsuggestions="true" id="codigo-barras" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus>
//           </td>
//               <td class="codigo-barras-cell2"><input id="cant-pedida" type="text" writingsuggestions="true" class="codigo-barras-input" value="" onchange="validarCantidadPedida(this)" style="text-align: center";>
//           </td>
//           <td class="codigo-barras-cell2">
//               <i class="material-icons red-text" style="cursor: pointer;" onclick="eliminarFila(this)">clear</i>
//           </td>
//       </tr>`;

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
// ///////////vALIDA LO QUE SE LEE CONTRA EL PEDIDO./////////
// function validarCantidadPedida() {
//   //Llamado a guardar datos en la variable arrray en el LS
//   guardarTablaEnArray();
// }
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
//       //var artic = row.querySelector
//       cells.forEach(function (cell) {
//         if (cell.value.trim() !== "") {
//           isEmptyRow = false;
//         }
//       });

//       // Elimina la fila solo si no está vacía
//       if (isEmptyRow) {
//         // // Llamar función que guarda artículos en la tabla 
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
// ///FUNCION QUE ARMA LA TABLA DE LA PESTAÑA VERIFICACION
// function armarTablaVerificacion(detalleTrasladoList) {
//   // Obtener la referencia del cuerpo de la tabla
//   var tbody = document.getElementById("tblbodyVerificacion");

//   // Limpiar el contenido actual del cuerpo de la tabla
//   tbody.innerHTML = "";

//   // Obtener la referencia del label cantidadDeRegistros
//   var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
//   // Actualizar el texto del label con la cantidad de registros
//   cantidadDeRegistrosLabel.textContent =
//     "Cantidad de registros: " + detalleTrasladoList.length;

//   // Iterar sobre cada elemento en detalleTrasladoList
//   detalleTrasladoList.forEach(function (detalle) {
//     // Crear una nueva fila
//     var newRow = document.createElement("tr");

//     // Construir el contenido de la fila usando variables HTML
//     newRow.innerHTML = `
//               <td id="articulo"><h5 id="verifica-articulo"><span class="blue-text text-darken-2">${
//                 detalle.ARTICULO
//               }</span></h5><h6>${detalle.DESCRIPCION}</h6></td>
//               <td id="codigoDeBarras">${detalle.CODIGO_BARRA || ""}</td>
//               <td id="cantidadPedida">${
//                 isNaN(parseFloat(detalle.CANTIDAD_PEDIDA))
//                   ? 0
//                   : parseFloat(detalle.CANTIDAD_PEDIDA).toFixed(2)
//               }</td>
//               <td id="cantidadLeida"></td> <!-- Cantidad leída, inicialmente en blanco -->
//               <td id="verificado"></td>             
//           `;
//     tbody.appendChild(newRow);
//   });
// }
// //Funcion que limpia el area de mensajes de error
// function limpiarMensajes() {
//   localStorage.removeItem("mensajes");
//   const mensajeTextArea = document.getElementById("mensajeText");
//   mensajeTextArea.value = "";
//   // Limpiar la variable 'mensajes' del localStorage
//   guardarTablaEnArray();
// }
// //FUNCION QUE VERIFICA LAS COINCIDENCIAS,TOMA LOS VALORES DE LAS CANTIDADES
// // POR ARTICULO, COMPARA LO QUE TIENE EL ARRAY DEL LS Y VERIFICA LAS COINCIDENCIAS, PARA MOSTRARLO EN LA PESTAÑA VERIFICACION
// function verificacion() {
//   var dataArray = JSON.parse(localStorage.getItem("dataArray"));
//   // Obtener la tabla por su ID
//   const tabla = document.getElementById("myTableVerificacion");

//   // Verificar si la tabla existe
//   if (tabla) {
//     // Obtener el tbody de la tabla
//     const tbody = tabla.querySelector("tbody");

//     // Buscar todas las filas (tr) dentro del tbody
//     const filas = tbody.querySelectorAll("tr");

//     // Iterar a través de las filas
//     filas.forEach((fila) => {
//       // Encontrar la celda con el id "cantidadLeida" y vaciar su contenido
//       const cantidadLeidaCell = fila.querySelector("#cantidadLeida");
//       const verifcheck = fila.querySelector("#verificado");
//       if (cantidadLeidaCell) {
//         cantidadLeidaCell.textContent = ""; // Vacía el contenido de la celda
//       }

//       if (verifcheck) {
//         verifcheck.textContent = ""; // Vacía el contenido de la celda
//       }
//     });
//   }

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

//   var TrasladoList = detalleTrasladoList;
//   const mensajesArray = [];
//   let contadorMensajes = 1; // Contador para los mensajes

//   resultadoArray.forEach((resultado) => {
//     const traslado = TrasladoList.find(
//       (traslado) =>
//         traslado.ARTICULO === resultado.ARTICULO &&
//         parseFloat(traslado.CANTIDAD_PEDIDA) ===
//           parseFloat(resultado.CANTIDAD_LEIDA)
//     );

//     if (traslado) {
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

//   let procesarHabilitado = todasLasFilasVerificadas();
//   let trasladospreparados = localStorage.getItem("trasladosprocesados") === "true";
//   let guardarParcialHabilitado = activaGuardadoParcial();

//   const btnGuardar = document.getElementById("btnGuardar");
//   const btnPreparar = document.getElementById("btnPreparar");
//   const btnRegresar = document.getElementById("btnRegresar");

//   if (guardarParcialHabilitado) {
//     console.log("activa btn guardar");
//     btnGuardar.removeAttribute("hidden");
//   } else {
//     btnGuardar.setAttribute("hidden", "hidden");
//   }

//   if (procesarHabilitado) {
//     console.log("activa btn procesar");
//     btnPreparar.removeAttribute("hidden");
//     btnGuardar.setAttribute("hidden", "hidden");
//   } else {
//    // btnGuardar.removeAttribute("hidden");
//     btnPreparar.setAttribute("hidden", "hidden");
//   }

//   if (trasladospreparados) {
//     btnRegresar.setAttribute("hidden", "hidden");
//   } else {
//     // const btnRegresar = document.getElementById('btnRegresar');
//     console.log("activa btn regresar");
//     btnRegresar.removeAttribute("hidden");
//     btnGuardar.setAttribute("hidden", "hidden");
//     btnPreparar.setAttribute("hidden", "hidden");
//   }
//   const observacion = document.getElementById("observaciones");

//   observacion.innerHTML = TrasladoList[0].OBSERVACION;
 
// } //Fin de verificacion
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
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////
// //FUNCION QUE VERIFICA LAS CANTIDASDES LEIDAS Y DEL TRASLADO PÁRA ACTIVAR EL BOTON DE GUARDADO PARCIAL
// function activaGuardadoParcial() {
//   // Obtener todas las filas de la tabla de verificación
//   const filas = document.querySelectorAll("#myTableVerificacion tbody tr");

//   for (let i = 0; i < filas.length; i++) {
//     const fila = filas[i];

//     // Obtener las celdas de "CANT PEDIDA" y "CANT LEIDA" en la fila actual
//     const celdaCantidadPedida = fila.querySelector("td#cantidadPedida");
//     const celdaCantidadLeida = fila.querySelector("td#cantidadLeida");

//     // Verificar si la cantidad leída es mayor que la cantidad pedida en al menos una fila
//     // if ((parseFloat(celdaCantidadLeida.textContent)>= parseFloat(celdaCantidadPedida.textContent)) && parseFloat(celdaCantidadLeida.textContent) != 0 || parseFloat(celdaCantidadLeida.textContent) == "") {
//     // if ( parseFloat(celdaCantidadLeida.textContent) >=  parseFloat(celdaCantidadPedida.textContent)
//     if ( parseFloat(celdaCantidadLeida.textContent) >=  0) {
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
// // Llama a la función mostrarMensajesLocalStorage cuando se hace clic en la pestaña "Verificación"
// document
//   .querySelector('a[href="#tabla-verificacion"]')
//   .addEventListener("click", mostrarMensajesLocalStorage);

// // Llamar a la función para cargar y mostrar los mensajes desde el localStorage al cargar la página
// window.onload = function () {
//   //inicializarBotones();
//   guardarTablaEnArray();
// };
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
// /////////////////////////////////////////////////////////////////////////////////////////////////////////
// //Funcion de confirmación del guardado parcial
// function confirmarGuardadoParcial() {
//   Swal.fire({
//     icon: "info",
//     title: "¿Desea continuar con el guardado parcial del traslado?",
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
// //FUNCION DE GUARDADO PARCIAL
// function guardaParcialMente() {
//   let pUsuario = document.getElementById("hUsuario").value;
//   // document.getElementById('hUsuario').value;
//   let pConsecutivo = localStorage.getItem("traslado");
//   let pBodega = document.getElementById("bodega").value;
//   let pTipoConsecutivo = "S";
//   let pBodegaDestino = localStorage.getItem("destinoBodegaTraslado");
//   let pAplicacion = localStorage.getItem("pAplicacion");
//   let pSistema = "WMS";
//   let pOpcion = "B";
//   let bodegaNumero = pBodega.match(/\d+/)[0];
//   if ((bodegaNumero >= 51 && bodegaNumero <= 55) || bodegaNumero === "05") {
//     pOpcion = "N";
//   }
//   let pModulo = "WMS_PK";
//   let pEstado = "G";

//   // Array para almacenar todas las cantidades y artículos
//   var detalles = [];
//   localStorage.removeItem("mensajes");
//   // Iterar sobre todas las filas de la tabla
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

//   const params =
//     "?pSistema=" +
//     pSistema +
//     "&pUsuario=" +
//     pUsuario +
//     "&pOpcion=" +
//     pOpcion +
//     "&pModulo=" +
//     pModulo +
//     "&pConsecutivo=" +
//     pConsecutivo +
//     "&pBodega=" +
//     pBodega +
//     "&jsonDetalles=" +
//     jsonDetalles +
//     "&pEstado=" +
//     pEstado +
//     "&pTipoConsecutivo=" +
//     pTipoConsecutivo +
//     "&pBodegaDestino=" +
//     pBodegaDestino +
//     "&pAplicacion=" +
//     pAplicacion;
//   console.log("PARAMETROS DE GUARDADO");
//   console.log(params);
//   fetch(env.API_URL + "wmsinsertupdatepickingtraslado" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       console.log(result.respuesta[0].Respuesta);
//       if (result.msg === "SUCCESS") {
//         if (result.respuesta.length != 0) {
//           // Resto del código de éxito
//           Swal.fire({
//             icon: "success",
//             title: "Datos guardados correctamente",
//             confirmButtonText: "Aceptar",
//             confirmButtonColor: "#28a745",
//             cancelButtonColor: "#6e7881",
//           }).then((result) => {
//             if (result.isConfirmed) {
//               // Redirecciona a tu otra vista aquí
//               localStorage.setItem("autoSearchTraslados", "true");
//               //window.location.href = "verificacionDePickingDetraslados.html";
//             }
//           });
//         }
//       } else {
//       }
//     });
// } //fin

// //Funcion de confirmación de procesar traslado
// function confirmaPreparar() {
//   Swal.fire({
//     icon: "warning",
//     title: "¿Desea preparar el traslado?",
//     showCancelButton: true,
//     confirmButtonText: "Continuar",
//     cancelButtonText: "Cancelar",
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       preparar();
//     }
//   });
// }
// //FUNCION DE Procesar el traslado
// function preparar() {
//   let pUsuario = document.getElementById("hUsuario").value;  
//   let pConsecutivo = localStorage.getItem("traslado");
//   let pBodega = document.getElementById("bodega").value;
//   let pTipoConsecutivo = "S";
//   let pBodegaDestino = localStorage.getItem("destinoBodegaTraslado");
//   let pAplicacion = localStorage.getItem("pAplicacion");
//   let pSistema = "WMS";
//   let pOpcion = "B";
//   let bodegaNumero = pBodega.match(/\d+/)[0];
//   if ((bodegaNumero >= 51 && bodegaNumero <= 55) || bodegaNumero === "05") {
//     pOpcion = "N";
//   }
//   let pModulo = "WMS_PK";
//   let pEstado = "A";

//   // Array para almacenar todas las cantidades y artículos
//   var detalles = [];
//   localStorage.removeItem("mensajes");
//   // Iterar sobre todas las filas de la tabla
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

//   const params =
//     "?pSistema=" +
//     pSistema +
//     "&pUsuario=" +
//     pUsuario +
//     "&pOpcion=" +
//     pOpcion +
//     "&pModulo=" +
//     pModulo +
//     "&pConsecutivo=" +
//     pConsecutivo +
//     "&pBodega=" +
//     pBodega +
//     "&jsonDetalles=" +
//     jsonDetalles +
//     "&pEstado=" +
//     pEstado +
//     "&pTipoConsecutivo=" +
//     pTipoConsecutivo +
//     "&pBodegaDestino=" +
//     pBodegaDestino +
//     "&pAplicacion=" +
//     pAplicacion;
//   console.log("PARAMETROS DE GUARDADO");
//   console.log(params);
//   fetch(env.API_URL + "wmsinsertupdatepickingtraslado" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       console.log(result.respuesta[0].Respuesta);
//       if (result.msg === "SUCCESS") {
//         if (result.respuesta.length != 0) {
//           // Resto del código de éxito
//           Swal.fire({
//             icon: "success",
//             title: "Traslado preparado correctamente",
//             confirmButtonText: "Aceptar",
//             confirmButtonColor: "#28a745",
//             cancelButtonColor: "#6e7881",
//           }).then((result) => {
//             if (result.isConfirmed) {
//               // Redirecciona a tu otra vista aquí
//               localStorage.setItem("autoSearchTraslados", "true");
//               window.location.href = "verificacionDePickingDetraslados.html";
//             }
//           });
//         }
//       } else {
//       }
//     });
// }

// ///////FUNCION PARA Retornar a la vista anterior//////
// function confirmaRegresar() {
//   localStorage.setItem("autoSearchPedidos", "true");
//   localStorage.removeItem("mensajes");
//   localStorage.setItem("autoSearchTraslados", "true");
//   window.location.href = "verificacionDePickingDetraslados.html";
// }

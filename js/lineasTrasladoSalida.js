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
  const elDestino = document.getElementById("bodega_destino");

  if (elDoc) elDoc.textContent = documento;

  let parametros = localStorage.getItem("ListParamsDetalle") || "";
  const params = parametros + "&Aplicacion=" + documento;

  if (typeof mostrarLoader === "function") mostrarLoader("Cargando líneas de salida...");

  fetch(env.API_URL + "wmsverificaciontrasladossalida" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.respuesta && result.respuesta.length !== 0) {
          detalleTrasladoList = result.respuesta;
          console.log("Detalle del traslado:", detalleTrasladoList);

          localStorage.setItem("pAplicacion", detalleTrasladoList[0].APLICACION || "");
          localStorage.setItem("destinoBodegaTraslado", detalleTrasladoList[0].BODEGA_DESTINO || "");

          if (elDestino) elDestino.textContent = detalleTrasladoList[0].BODEGA_DESTINO || "";

          armarTablaVerificacion(detalleTrasladoList);

          if (validarSinPreparacionPrevia(detalleTrasladoList)) {
            bloquearLecturaSinPreparacion();
          } else {
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
      }
    })
    .catch((error) => {
      console.error("Error al cargar traslado de salida:", error);
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function armarTablaLectura(detalleTrasladoList) {
  var tbody = document.getElementById("tblbodyLectura");
  var estadoPreparacion = localStorage.getItem("estadotraslado");

  if (!tbody) return;
  tbody.innerHTML = "";

  detalleTrasladoList.some(function (detalle) {
    if (
      detalle.LINEAS_VERIFICADAS != null &&
      detalle.LINEAS_VERIFICADAS !== "" &&
      parseFloat(detalle.LINEAS_VERIFICADAS) > 0
    ) {
      var newRow = document.createElement("tr");
      var disabled = estadoPreparacion !== "A" ? "disabled" : "";
      var cursor = disabled ? "default" : "pointer";
      var onclick = disabled ? "" : 'onclick="eliminarFila(this)"';

      newRow.innerHTML = `
        <td class="cell-center">
          <span style="font-weight: 600; color: #1e293b;">${detalle.ARTICULO || ""}</span>
        </td>
        <td>
          <input type="text" class="codigo-barras-input" value="${detalle.CODIGO_BARRA || ""}" onchange="validarCodigoBarras(this)" autofocus ${disabled}>
        </td>
        <td>
          <input type="text" class="codigo-barras-input" value="${detalle.LINEAS_VERIFICADAS || ""}" onchange="guardarTablaEnArray(this)" style="text-align: center;" ${disabled}>
        </td>
        <td class="cell-center">
          <i class="material-icons" style="cursor: ${cursor}; color: #ef4444; font-size: 20px;" ${onclick}>delete</i>
        </td>
      `;
      tbody.appendChild(newRow);
      crearNuevaFila();
    } else {
      var newRow = document.createElement("tr");
      var disabled = estadoPreparacion !== "A" ? "disabled" : "";
      var cursor = disabled ? "default" : "pointer";
      var onclick = disabled ? "" : 'onclick="eliminarFila(this)"';

      newRow.innerHTML = `
        <td class="cell-center">
          <span style="font-weight: 600; color: #1e293b;"></span>
        </td>
        <td>
          <input type="text" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus ${disabled}>
        </td>
        <td>
          <input type="text" class="codigo-barras-input" value="" onchange="guardarTablaEnArray(this)" style="text-align: center;" ${disabled}>
        </td>
        <td class="cell-center">
          <i class="material-icons" style="cursor: ${cursor}; color: #ef4444; font-size: 20px;" ${onclick}>delete</i>
        </td>
      `;
      tbody.appendChild(newRow);
      return true;
    }
  });

  guardarTablaEnArray();
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
      text: "El código ingresado no coincide con ningún artículo del traslado. Intente nuevamente.",
      confirmButtonColor: "#28a745"
    });
  }
}

function crearNuevaFila() {
  if (validarSinPreparacionPrevia(detalleTrasladoList)) {
    return;
  }

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

    let cantPed = isNaN(parseFloat(detalle.CANTIDAD_PEDIDA)) ? 0 : parseFloat(detalle.CANTIDAD_PEDIDA);
    let cantPrep = isNaN(parseFloat(detalle.LINEAS_PREPARADAS)) ? 0 : parseFloat(detalle.LINEAS_PREPARADAS);

    newRow.innerHTML = `
      <td class="col-articulo" style="text-align: left;">
        <div class="cell-articulo-box">
          <span class="cell-articulo-code verifica-articulo" style="color: #0284c7;">
            <span>${detalle.ARTICULO || ""}</span>
          </span>
          <span class="cell-articulo-desc">${detalle.DESCRIPCION || ""}</span>
        </div>
      </td>
      <td class="col-codigo cell-center">${detalle.CODIGO_BARRA || ""}</td>
      <td class="col-cant-pedida cell-number">${cantPed.toFixed(2)}</td>
      <td class="col-cant-prep cell-number">${cantPrep.toFixed(2)}</td>
      <td class="col-cant-leida cell-number"></td>
      <td class="col-verificado cell-center"></td>
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
    const filas = tabla.querySelectorAll("tbody tr");
    filas.forEach((fila) => {
      const cantidadLeidaCell = fila.querySelector("td.col-cant-leida");
      const verifcheck = fila.querySelector("td.col-verificado");
      if (cantidadLeidaCell) cantidadLeidaCell.textContent = "";
      if (verifcheck) verifcheck.textContent = "";
    });
  }

  var cantidadesTotales = {};
  dataArray.forEach(function (item) {
    var articulo = item.ARTICULO;
    var cantidad = item.CANTIDAD_LEIDA;
    cantidadesTotales[articulo] = (cantidadesTotales[articulo] || 0) + cantidad;
  });

  var resultadoArray = [];
  for (var art in cantidadesTotales) {
    resultadoArray.push({ ARTICULO: art, CANTIDAD_LEIDA: cantidadesTotales[art] });
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
        const celdaARTICULO = fila.querySelector(".verifica-articulo span");
        if (celdaARTICULO && celdaARTICULO.textContent.trim() === resultado.ARTICULO) {
          const celdaVerificado = fila.querySelector("td.col-verificado");
          if (celdaVerificado) {
            celdaVerificado.innerHTML = `<i class="material-icons" style="color: #28a745 !important; font-size: 22px; vertical-align: middle;">done_all</i>`;
          }
          const cantidadVerificadaCell = fila.querySelector("td.col-cant-leida");
          if (cantidadVerificadaCell) {
            cantidadVerificadaCell.textContent = parseFloat(resultado.CANTIDAD_LEIDA).toFixed(2);
          }
        }
      });
    } else {
      filas.forEach((fila) => {
        const celdaARTICULO = fila.querySelector(".verifica-articulo span");
        if (celdaARTICULO && celdaARTICULO.textContent.trim() === resultado.ARTICULO) {
          const celdaVerificado = fila.querySelector("td.col-verificado");
          const cantPedida = fila.querySelector("td.col-cant-pedida");
          const cantidadVerificadaCell = fila.querySelector("td.col-cant-leida");

          const valPedida = parseFloat(cantPedida ? cantPedida.textContent : 0);
          const valLeida = parseFloat(resultado.CANTIDAD_LEIDA);

          if (valLeida > valPedida) {
            let diff = (valLeida - valPedida).toFixed(2);
            if (celdaVerificado) {
              celdaVerificado.textContent = `+${diff}`;
              celdaVerificado.style.color = "#dc2626";
              celdaVerificado.style.fontWeight = "bold";
            }
            mensajesArray.push(`${contadorMensajes}. La cantidad verificada del artículo ${resultado.ARTICULO} supera la solicitada (+${diff}).`);
            contadorMensajes++;
          } else if (valLeida < valPedida) {
            let diff = (valLeida - valPedida).toFixed(2);
            if (celdaVerificado) {
              celdaVerificado.textContent = `-${diff}`;
              celdaVerificado.style.color = "#ea580c";
              celdaVerificado.style.fontWeight = "bold";
            }
            mensajesArray.push(`${contadorMensajes}. La cantidad verificada del artículo ${resultado.ARTICULO} es menor a la solicitada (-${diff}).`);
            contadorMensajes++;
          }

          if (cantidadVerificadaCell) {
            cantidadVerificadaCell.textContent = valLeida.toFixed(2);
          }
        }
      });
      localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
    }
  });

  let procesarHabilitado = todasLasFilasVerificadas();
  let trasladospreparados = localStorage.getItem("trasladosprocesados") === "false";
  let guardarParcialHabilitado = activaGuardadoParcial();

  const btnGuardar = document.getElementById("btnGuardar");
  const btnPreparar = document.getElementById("btnPreparar");
  const btnRegresar = document.getElementById("btnRegresar");

  if (btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
  if (btnPreparar) btnPreparar.setAttribute("hidden", "hidden");
  if (btnRegresar) btnRegresar.setAttribute("hidden", "hidden");

  if (trasladospreparados) {
    if (btnRegresar) btnRegresar.removeAttribute("hidden");
  } else if (procesarHabilitado) {
    if (btnPreparar) btnPreparar.removeAttribute("hidden");
  } else if (guardarParcialHabilitado) {
    if (btnGuardar) btnGuardar.removeAttribute("hidden");
  }

  const observacion = document.getElementById("observaciones");
  if (observacion && TrasladoList && TrasladoList.length > 0) {
    observacion.value = TrasladoList[0].OBSERVACION || "";
  }
}

function todasLasFilasVerificadas() {
  const filas = document.querySelectorAll("#myTableVerificacion tbody tr");
  if (filas.length === 0) return false;

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const celdaVerificado = fila.querySelector("td.col-verificado");
    if (!celdaVerificado) return false;

    const icono = celdaVerificado.querySelector("i.material-icons, span.material-icons");
    if (!icono || icono.textContent.trim() !== "done_all") {
      return false;
    }
  }
  return true;
}

function activaGuardadoParcial() {
  const filas = document.querySelectorAll("#myTableVerificacion tbody tr");

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const celdaLeida = fila.querySelector("td.col-cant-leida");

    if (celdaLeida) {
      const valor = parseFloat(celdaLeida.textContent.trim());
      if (!isNaN(valor) && valor > 0) {
        return true;
      }
    }
  }
  return false;
}

function mostrarMensajesLocalStorage() {
  const mensajesStorage = localStorage.getItem("mensajes");
  if (mensajesStorage) {
    const mensajes = JSON.parse(mensajesStorage);
    const textarea = document.getElementById("mensajeText");
    if (textarea) {
      textarea.value = mensajes.join("\n");
    }
  }
}

window.onload = function () {
  guardarTablaEnArray();
};

function confirmarGuardadoParcial() {
  Swal.fire({
    icon: "info",
    title: "¿Desea continuar con el guardado parcial del traslado?",
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

  let pModulo = "WMS_VT";
  let pEstado = "G";

  var detalles = [];
  localStorage.removeItem("mensajes");

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

  if (typeof mostrarLoader === "function") mostrarLoader("Guardando avance de salida...");

  fetch(env.API_URL + "wmsguardatrasladoverificado" + params, myInit)
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
            localStorage.setItem("autoSearchTraslados", "true");
          }
        });
      }
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function confirmaProcesar() {
  Swal.fire({
    icon: "warning",
    title: "¿Desea procesar el traslado de salida?",
    showCancelButton: true,
    confirmButtonText: "Procesar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745"
  }).then((result) => {
    if (result.isConfirmed) {
      procesar();
    }
  });
}

function procesar() {
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

  let pModulo = "WMS_VT";
  let pEstado = "P";

  var detalles = [];
  localStorage.removeItem("mensajes");

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

  if (typeof mostrarLoader === "function") mostrarLoader("Procesando salida...");

  fetch(env.API_URL + "wmsinsertupdatepickingtraslado" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        Swal.fire({
          icon: "success",
          title: "Datos procesados correctamente",
          confirmButtonText: "Finalizar",
          confirmButtonColor: "#28a745"
        }).then((res) => {
          if (res.isConfirmed) {
            localStorage.setItem("autoSearchTraslados", "true");
            window.location.href = "verificacionDeTraslados.html";
          }
        });
      }
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function confirmaRegresar() {
  localStorage.setItem("autoSearchTraslados", "true");
  localStorage.removeItem("mensajes");
  window.location.href = "verificacionDeTraslados.html";
}

function validarSinPreparacionPrevia(lineasList) {
  if (!Array.isArray(lineasList) || lineasList.length === 0) return true;

  return lineasList.every(function (item) {
    const cantPrep = parseFloat(item.LINEAS_PREPARADAS);
    return isNaN(cantPrep) || cantPrep <= 0;
  });
}

function bloquearLecturaSinPreparacion() {
  const tbody = document.getElementById("tblbodyLectura");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td class="cell-center"><span>-</span></td>
        <td>
          <input type="text" class="codigo-barras-input" disabled placeholder="Lectura bloqueada: Sin preparación previa">
        </td>
        <td>
          <input type="text" class="codigo-barras-input" disabled value="0.00" style="text-align: center;">
        </td>
        <td class="cell-center">
          <i class="material-icons" style="cursor: not-allowed; color: #94a3b8; font-size: 20px;">lock</i>
        </td>
      </tr>
    `;
  }

  localStorage.removeItem("dataArray");

  Swal.fire({
    icon: "warning",
    title: "Traslado Sin Preparación",
    text: "Este traslado no tiene cantidades preparadas (LINEAS_PREPARADAS = 0). La lectura se encuentra bloqueada.",
    confirmButtonColor: "#28a745",
    confirmButtonText: "Entendido"
  });

  verificacion();
}

// //Variable global que contiene el detalle del pedido
// var detalleTrasladoList = "";

// document.addEventListener("DOMContentLoaded", function () {
//   let usuario = document.getElementById("hUsuario").value;
//   console.log("hUsuario:", usuario);
//   //localStorage.setItem('UserID',usuario);

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
//   mostrarLoader();
//   document.getElementById("documento").innerHTML = "Documento: " + documento;

//   let parametros = localStorage.getItem("ListParamsDetalle");
//   const params = parametros + "&Aplicacion=" + documento;

//   fetch(env.API_URL + "wmsverificaciontrasladossalida" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//       if (result.msg === "SUCCESS") {
//         if (result.respuesta && result.respuesta.length !== 0) {
//           detalleTrasladoList = result.respuesta;
//           console.log("Detalle del traslado:", detalleTrasladoList);

//           localStorage.setItem(
//             "pAplicacion",
//             detalleTrasladoList[0].APLICACION,
//           );
//           localStorage.setItem(
//             "destinoBodegaTraslado",
//             detalleTrasladoList[0].BODEGA_DESTINO,
//           );
//           document.getElementById("bodega_destino").innerHTML =
//             "Bodega destino: " + detalleTrasladoList[0].BODEGA_DESTINO;

//           // 1. Armar tabla de verificación siempre
//           armarTablaVerificacion(detalleTrasladoList);

//           // 2. Validar si todo el traslado viene con LINEAS_PREPARADAS en 0
//           if (validarSinPreparacionPrevia(detalleTrasladoList)) {
//             bloquearLecturaSinPreparacion();
//           } else {
//             // Flujo normal: arma lectura si hay preparación parcial o completa
//             // armarTablaLectura(detalleTrasladoList);
//             const siGuardadoParcial = detalleTrasladoList.some(
//               (detalle) =>
//                 detalle.LINEAS_PREPARADAS != null &&
//                 detalle.LINEAS_PREPARADAS !== "",
//             );
//             if (siGuardadoParcial) {
//               armarTablaLectura(detalleTrasladoList);
//             }
//           }
//         }

//         document.getElementById("carga").innerHTML = "";
//       }
//     });
//   ocultarLoader();
// }

// function armarTablaLectura(detalleTrasladoList) {
//   var tbody = document.getElementById("tblbodyLectura");
//   var estadoPreparacion = localStorage.getItem("estadotraslado");

//   // Limpiar el contenido del tbody antes de agregar nuevas filas
//   tbody.innerHTML = "";

//   // Recorrer el detalle del traslado y agregar filas si LINEAS_PREPARADAS tiene un valor

//   detalleTrasladoList.some(function (detalle) {
//     if (
//       detalle.LINEAS_VERIFICADAS != null &&
//       detalle.LINEAS_VERIFICADAS !== "" &&
//       detalle.LINEAS_VERIFICADAS > 0
//     ) {
//       var newRow = document.createElement("tr");
//       var disabled = estadoPreparacion !== "A" ? "disabled" : "";
//       var cursor = disabled ? "default" : "pointer";
//       var onclick = disabled ? "" : 'onclick="eliminarFila(this)"';

//       newRow.innerHTML = `
//       <td>
//         <span>${detalle.ARTICULO}</span>
//       </td>
//       <td class="codigo-barras-cell">
//         <input id="codigo-barras" type="text" class="codigo-barras-input" value="${
//           detalle.CODIGO_BARRA || ""
//         }" onchange="validarCodigoBarras(this)" autofocus ${disabled}>
//       </td>
//       <td class="codigo-barras-cell2">
//         <input id="cant-pedida" type="text" class="codigo-barras-input" value="${
//           detalle.LINEAS_VERIFICADAS || ""
//         }" onchange="guardarTablaEnArray(this)" style="text-align: center;" ${disabled}>
//       </td>
//       <td class="codigo-barras-cell2">
//         <i class="material-icons red-text" style="cursor: ${cursor};" ${onclick}>clear</i>
//       </td>
//     `;
//       tbody.appendChild(newRow);

//       // Crear una nueva fila vacía para permitir la entrada de más datos si es necesario
//       crearNuevaFila();
//     } else {
//       var newRow = document.createElement("tr");
//       var disabled = estadoPreparacion !== "A" ? "disabled" : "";
//       var cursor = disabled ? "default" : "pointer";
//       var onclick = disabled ? "" : 'onclick="eliminarFila(this)"';

//       newRow.innerHTML = `
//       <td>
//         <span></span>
//       </td>
//       <td class="codigo-barras-cell">
//         <input id="codigo-barras" type="text" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus ${disabled}>
//       </td>
//       <td class="codigo-barras-cell2">
//         <input id="cant-pedida" type="text" class="codigo-barras-input" value="" onchange="guardarTablaEnArray(this)" style="text-align: center;" ${disabled}>
//       </td>
//       <td class="codigo-barras-cell2">
//         <i class="material-icons red-text" style="cursor: ${cursor};" ${onclick}>clear</i>
//       </td>
//     `;
//       tbody.appendChild(newRow);

//       // Detener el ciclo si cae en el else
//       return true;
//     }
//   });

//   // Guardar la tabla en el array
//   guardarTablaEnArray();
// }

// /////////VALIDA EL CODIGO LEIDO EN LA PESTAÑA LECTURA//////////////////
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
//   let codigosArrayArticulo = [];
//   let codigosNuevos = [];

//   // Procesar códigos de barras estándar
//   if (TrasladoList[i].codigos_barras) {
//     codigosArrayArticulo = String(TrasladoList[i].codigos_barras)
//       .split("|")
//       .map((codigo) => codigo.trim().toUpperCase())
//       .filter((codigo) => codigo !== "");
//   }

//   // Procesar códigos de barras nuevos (Asegurando String y limpieza)
//   if (TrasladoList[i].codigos_barras_nuevas) {
//     codigosNuevos = String(TrasladoList[i].codigos_barras_nuevas)
//       .split("|")
//       .map((codigo) => codigo.trim().toUpperCase())
//       .filter((codigo) => codigo !== "");
//   }

//   // Normalizar el código escaneado/ingresado
//   let codbarraBusqueda = codbarra ? codbarra.trim().toUpperCase() : "";

//   if (
//     (TrasladoList[i].ARTICULO &&
//       TrasladoList[i].ARTICULO.toUpperCase() === codbarraBusqueda) ||
//     (TrasladoList[i].CODIGO_BARRA &&
//       TrasladoList[i].CODIGO_BARRA.toUpperCase() === codbarraBusqueda) ||
//     codigosNuevos.includes(codbarraBusqueda) ||
//     codigosArrayArticulo.includes(codbarraBusqueda)
//   ) {
//     span.textContent = TrasladoList[i].ARTICULO;
//     cantFila.value = 1;

//     // Bloquear la celda del código de barras
//     input.setAttribute("readonly", "readonly");

//     // Generar nueva fila y guardar
//     crearNuevaFila();
//     guardarTablaEnArray();

//     codigoValido = true;
//     break;
//   }
// }


//   // for (var i = 0; i < TrasladoList.length; i++) {
//   //   let codigosArrayArticulo = [];
//   //   if (TrasladoList[i].codigos_barras) {
//   //     codigosArrayArticulo = TrasladoList[i].codigos_barras
//   //       .split("|")
//   //       .map((codigo) => codigo.toUpperCase());
//   //   }

//   //   if (
//   //     (TrasladoList[i].ARTICULO &&
//   //       TrasladoList[i].ARTICULO.toUpperCase() === codbarra) ||
//   //     (TrasladoList[i].CODIGO_BARRA &&
//   //       TrasladoList[i].CODIGO_BARRA.toUpperCase() === codbarra) ||
//   //     codigosArrayArticulo.includes(codbarra)
//   //   ) {
//   //     span.textContent = TrasladoList[i].ARTICULO;
//   //     cantFila.value = 1;

//   //     // Bloquear la celda del código de barras
//   //     input.setAttribute("readonly", "readonly");

//   //     // Aquí se genera una fila nueva vacía
//   //     crearNuevaFila();

//   //     // Llamar función que guarda artículos en la tabla
//   //     guardarTablaEnArray();

//   //     codigoValido = true;
//   //     break;
//   //   }
//   // }

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
//   // Si no hay preparación en el traslado, no permitir crear filas
//   if (validarSinPreparacionPrevia(detalleTrasladoList)) {
//     return;
//   }

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

//   const nuevoCodigoBarrasInput = tableBody.querySelector(
//     "tr:last-child .codigo-barras-input"
//   );

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
//               <td id="cantidadPreparada">${
//                 isNaN(parseFloat(detalle.LINEAS_PREPARADAS))
//                   ? 0
//                   : parseFloat(detalle.LINEAS_PREPARADAS).toFixed(2)
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
//   let trasladospreparados = localStorage.getItem("trasladosprocesados") === "false";
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
//   let pModulo = "WMS_VT";
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
//   console.log("Aqui guardamos los traslados de entrada");
//   localStorage.setItem("autoSearchTraslados", "true");
//   // window.location.href = 'verificacionDeTraslados.html';
//   fetch(env.API_URL + "wmsguardatrasladoverificado" + params, myInit)
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
//              // window.location.href = "verificacionDeTraslados.html";
//             }
//           });
//         }
//       } else {
//       }
//     });
// } //fin

// function confirmaProcesar() {
//   Swal.fire({
//     icon: "warning",
//     title: "¿Desea procesar el traslado?",
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

// //FUNCION DE Procesar el pedido
// function procesar() {
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
//   let pModulo = "WMS_VT";
//   let pEstado = "P";

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
//   console.log("PARAMETROS DE PROCESADO");
//   console.log(params);
//   console.log("Aqui procesamos los traslados de entrada");
//   localStorage.setItem("autoSearchTraslados", "true");
//   //window.location.href = "verificacionDeTraslados.html";
//   fetch(env.API_URL + "wmsinsertupdatepickingtraslado" + params, myInit)
//     .then((response) => response.json())
//     .then((result) => {
//        console.log(result.respuesta[0].Respuesta);
//       if (result.msg === "SUCCESS") {
//         if (result.respuesta.length != 0) {
//           // Resto del código de éxito
//           Swal.fire({
//             icon: "success",
//             title: "Datos procesados correctamente",
//             confirmButtonText: "Aceptar",
//             confirmButtonColor: "#28a745",
//             cancelButtonColor: "#6e7881",
//           }).then((result) => {
//             if (result.isConfirmed) {
//               // Redirecciona a tu otra vista aquí
//               localStorage.setItem("autoSearchTraslados", "true");
//               window.location.href = "verificacionDeTraslados.html";
//             }
//           });
//         }
//       } else {
//       }
//     });
// }

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

// ///////FUNCION PARA Retornar a la vista anterior//////
// function confirmaRegresar() {
//   localStorage.setItem("autoSearchTraslados", "true");
//   localStorage.removeItem("mensajes");
//   //localStorage.clear();
//   window.location.href = "verificacionDeTraslados.html";
// }
// // Retorna true si TODAS las líneas tienen LINEAS_PREPARADAS en 0, null o vacío
// function validarSinPreparacionPrevia(lineasList) {
//   if (!Array.isArray(lineasList) || lineasList.length === 0) return true;

//   return lineasList.every(function (item) {
//     const cantPrep = parseFloat(item.LINEAS_PREPARADAS);
//     return isNaN(cantPrep) || cantPrep <= 0;
//   });
// }

// function bloquearLecturaSinPreparacion() {
//   const tbody = document.getElementById("tblbodyLectura");
//   if (tbody) {
//     tbody.innerHTML = `
//       <tr>
//         <td><span>-</span></td>
//         <td class="codigo-barras-cell">
//           <input type="text" class="codigo-barras-input" disabled placeholder="Lectura bloqueada: Sin preparación previa">
//         </td>
//         <td class="codigo-barras-cell2">
//           <input type="text" class="codigo-barras-input" disabled value="0" style="text-align: center;">
//         </td>
//         <td class="codigo-barras-cell2">
//           <i class="material-icons grey-text" style="cursor: not-allowed;">clear</i>
//         </td>
//       </tr>
//     `;
//   }

//   // Limpiar cualquier lectura residual en localStorage y memoria
//   localStorage.removeItem("dataArray");

//   // Notificar al operario
//   Swal.fire({
//     icon: "warning",
//     title: "Traslado Sin Preparación",
//     text: "Este traslado no tiene cantidades preparadas (LINEAS_PREPARADAS = 0). La lectura está bloqueada.",
//     confirmButtonColor: "#28a745",
//     confirmButtonText: "Entendido"
//   });

//   // Ejecutar verificación para mantener los botones de acción apagados
//   verificacion();
// }
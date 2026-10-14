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
  if (btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
  if (btnPreparar) btnPreparar.setAttribute("hidden", "hidden");
  if (trasladospreparados) {   
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

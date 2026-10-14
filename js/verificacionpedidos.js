// Variable global para el switch
const checkbox = document.getElementById("toggleSwitch");

document.addEventListener("DOMContentLoaded", function () {
  ocultarColumnaLPrep();
  const busqueda = localStorage.getItem("autoSearchPedidos");
  if (busqueda === "true") {
    // Obtener los parámetros de búsqueda del localStorage
    const parametrosBusqueda = localStorage.getItem("parametrosBusqueda");
    if (parametrosBusqueda) {
      const params = new URLSearchParams(parametrosBusqueda);

      const pBodega = params.get("pBodega");
      const pFechaDesde = params.get("pFechaDesde");
      const pFechaHasta = params.get("pFechaHasta");
      const pUsuario = params.get("pUsuario");
      const pPedido = params.get("pPedido");
      const pOpcion = params.get("pOpcion");

      // Establecer los valores de los campos de fecha
      if(pFechaDesde) document.getElementById("fecha_ini").value = pFechaDesde;
      if(pFechaHasta) document.getElementById("fecha_fin").value = pFechaHasta;
      
      // Esperar un instante para que Materialize inicialice y luego forzar el estado
      setTimeout(() => {
          M.updateTextFields();
          const inputs = document.querySelectorAll('.datepicker');
          inputs.forEach(input => {
              const fechaGuardada = input.id === 'fecha_ini' ? pFechaDesde : pFechaHasta;
              if (fechaGuardada) {
                  const dateParts = fechaGuardada.split('-'); 
                  const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                  M.Datepicker.init(input, {
                      format: 'yyyy-mm-dd',
                      defaultDate: d,
                      setDefaultDate: true, 
                      autoClose: true
                  });
              }
          });
      }, 100);

      if (pOpcion === "FF") {
        $("#toggleSwitch").prop("checked", false);
      } else {
        $("#toggleSwitch").prop("checked", true);
      }

      // Llamar a la función listadoPedido con los valores extraídos
      listadoPedido(pBodega, pPedido, pFechaDesde, pFechaHasta, pUsuario, pOpcion);
    } else {
      localStorage.clear();
    }
  }
});

function validarFormulario() {
  var bodega = document.getElementById("bodega").value;
  if (bodega == "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Por favor, seleccione una bodega.",
    });
    return false; 
  } else {
    var pBodega = document.getElementById("bodega").value;
    var pPedido = $("#pPedido").val();
    var pFechaHasta = $("#fecha_fin").val();
    var pFechaDesde = $("#fecha_ini").val();
    var pUsuario = document.getElementById("hUsuario").value;
    let pOpcion = $("#toggleSwitch").prop("checked") ? "R" : "FF";

    listadoPedido(pUsuario, pOpcion, pFechaDesde, pFechaHasta,pBodega, pPedido);
  }
}

function listadoPedido( pUsuario, pOpcion, pFechaDesde, pFechaHasta,pBodega, pPedido) {
  localStorage.setItem("autoSearchPedidos", "true"); 

   //const params =
   //"&pUsuario=" + pUsuario + "&pOpcion=" + pOpcion+"&pFechaDesde=" + pFechaDesde +"&pFechaHasta=" + pFechaHasta +"&pPedido=" + pPedido+"?pBodega=" + pBodega;
  const params =
    "?pBodega=" + pBodega +
    "&pFechaDesde=" + pFechaDesde +
    "&pFechaHasta=" + pFechaHasta +
    "&pUsuario=" + pUsuario +
    "&pPedido=" + pPedido +
    "&pOpcion=" + pOpcion;
    
  localStorage.setItem("BodegaUsuario", pBodega);
  localStorage.setItem("parametrosBusqueda", params);
  
  if (typeof mostrarLoader === "function") mostrarLoader("Buscando pedidos...");

  fetch(env.API_URL + "wmsverificacionpedidos/P" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.pedidos.length != 0) {
          ArrayData = result.pedidos;
          ArrayDataFiltrado = result.pedidos;

          console.log(result);

          // Renderizado limpio del contador
          let htm = `Total de Registros: <span id="lblTotalRegistros">${result.pedidos.length}</span>`;
          document.getElementById("resultadoGeneral").innerHTML = htm;
          
          // Llama a la nueva función que carga todo y pagina
          renderizarTablaPedidosCompleta();

          if (typeof ocultarLoader === "function") ocultarLoader();
          aplicarEstilosTablaPedidos();
        } else {
          Swal.fire({
            icon: "info",
            title: "Información",
            text: "No tiene pedidos pendientes bajo estos criterios.",
            confirmButtonColor: "#28a745",
          });
          limpiarResultadoGeneral();
          if (typeof ocultarLoader === "function") ocultarLoader();
        }
      } else {
        console.error("Error en el SP");
        if (typeof ocultarLoader === "function") ocultarLoader();
      }
    })
    .catch((error) => {
        console.error("Error Fetch:", error);
        if (typeof ocultarLoader === "function") ocultarLoader();
    });
}


function renderizarTablaPedidosCompleta() {
  const bodegaInput = document.getElementById("bodega");
  const bodega = bodegaInput ? bodegaInput.value : ""; 
  const bodegaNum = bodega && bodega.includes("-") ? bodega.split("-")[1] : "";

  if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) return;

  const tabla = document.getElementById("tblpedido");
  if (!tabla) return;
  
  let tbody = tabla.querySelector("tbody");
  if (!tbody) {
    tbody = document.createElement("tbody");
    tabla.appendChild(tbody);
  }
  
  tbody.innerHTML = "";
  let htm = "";

  const mostrarPrep = (bodegaNum >= "51" || bodegaNum === "05");

  for (let i = 0; i < ArrayDataFiltrado.length; i++) {
    let item = ArrayDataFiltrado[i];

    // Sanitización estricta de las cadenas numéricas del API (".00", "1.00000000", etc.)
    let rawSol = String(item.TOTAL_UNIDADES || "0").trim();
    let rawVer = String(item.LINEAS_VERIFICADAS || "0").trim();
    let rawPrep = String(item.LINEAS_PREPARADAS || "0").trim();

    if (rawSol.startsWith(".")) rawSol = "0" + rawSol;
    if (rawVer.startsWith(".")) rawVer = "0" + rawVer;
    if (rawPrep.startsWith(".")) rawPrep = "0" + rawPrep;

    let cantSolicitada = parseFloat(rawSol) || 0;
    let cantVerificada = parseFloat(rawVer) || 0;
    let cantPreparada  = parseFloat(rawPrep) || 0;

    htm += `<tr onclick="irDetallePedido('${item.DOCUMENTO}','${item.PEDIDO}','${item.ESTADO_PEDIDO}','${item.ESTADO_PREPARACION}');" style="cursor: pointer;">`;

    let documentoClase = item.ESTADO_PREPARACION === "A" ? "cell-origen" : "";
    htm += `<td class="cell-center ${documentoClase}">${item.DOCUMENTO || ""}</td>`;
    htm += `<td style="text-align: left; white-space: normal;">${item.DESCRIPCION || ""}</td>`;
    htm += `<td class="cell-number">${cantSolicitada.toFixed(2)}</td>`;
     // CELDA ÍNDICE 4: SIEMPRE SE GENERA PARA PRESERVAR EL ORDEN DE LAS COLUMNAS
    let displayPrep = mostrarPrep ? "" : "display: none;";
    htm += `<td class="cell-number col-lprep" style="${displayPrep}">${cantPreparada.toFixed(2)}</td>`;
    htm += `<td class="cell-number">${cantVerificada.toFixed(2)}</td>`;

   

    // CELDA ÍNDICE 5: VERIFICACIÓN
    htm += `<td class="cell-center">`;
    if (cantVerificada === 0) {
      htm += ``;
    } else if (cantVerificada >= cantSolicitada) {
      htm += `<i class="material-icons" style="color: #28a745 !important; font-size: 22px; line-height: 1; vertical-align: middle; display: flex;">done_all</i>`;
    } else if (cantVerificada > 0 && cantVerificada < cantSolicitada) {
      htm += `<i class="material-icons" style="color: #e53935 !important; font-size: 22px; line-height: 1; vertical-align: middle; display: flex;">done_all</i>`;
    }
    htm += `</td>`;

    htm += `</tr>`;
  }

  tbody.innerHTML = htm; 
  ocultarColumnaLPrep(); 

  // Paginación vinculada a paginacion.js
  const contenedorPaginador = $('#resultadoPaginador');
  contenedorPaginador.empty();
  contenedorPaginador.html('<ul class="pagination" id="paginador-ul" style="display:flex; justify-content:center;"></ul>');

  try {
    if ($.fn.pageMe) {
      $('#tblpedido tbody').pageMe({
        pagerSelector: '#paginador-ul',
        showPrevNext: true,
        hidePageNumbers: false,
        perPage: typeof xPag !== 'undefined' ? xPag : 20
      });
    }
  } catch (error) {
    console.error("Error inicializando paginador pageMe:", error);
  }
}
function irDetallePedido(documento, pedido, estado, estado_preparacion) {
  const checkbox = document.getElementById("toggleSwitch");
  let bodega = localStorage.getItem("BodegaUsuario");
  let bodegaNumero = bodega.match(/\d+/)[0];

  localStorage.setItem("pedidos_finalizados", checkbox.checked);
  localStorage.setItem("documento", documento);
  localStorage.setItem("pedidoSelect", pedido);
  localStorage.setItem("estado", estado);
  localStorage.setItem("EstadoPreparacion", estado_preparacion);

  if ((bodegaNumero >= 51 && bodegaNumero <= 55) || bodegaNumero === "05") {
    window.location.href = "detallePedidoPreparado.html";
  } else {
    window.location.href = "detalle_pedido.html";
  }
}

checkbox.addEventListener("change", function () {
  if (checkbox.checked === false) {
    pedidosFinalizados();
  }
  limpiarResultadoGeneral();
});

function pedidosFinalizados() {
  Swal.fire({
    title: "¿Desea ver solo los pedidos finalizados?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "No",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
  }).then((result) => {
    if (result.isConfirmed) {
      $("#toggleSwitch").prop("checked", false);
    } else {
      $("#toggleSwitch").prop("checked", true);
    }
  });
}

function aplicarEstilosTablaPedidos() {
  $("#tblpedido tbody tr").each(function () {
    var documentoValue = $(this).find("td:eq(0)").text().trim();
    if (documentoValue.startsWith("T")) {
      $(this).find("td:eq(0)").css({
        color: "#e51c23",
        "font-weight": "bold",
      });
    }
  });
}

function ocultarColumnaLPrep() {
  const bodega = document.getElementById("bodega") ? document.getElementById("bodega").value : ""; 
  const numeroBodega = bodega && bodega.includes("-") ? bodega.split("-")[1] : ""; 
  const thLPrep = document.getElementById("thLPrep");
  const celdasLPrep = document.querySelectorAll(".col-lprep");

  if (numeroBodega >= 51 || numeroBodega === "05") {
    if (thLPrep) thLPrep.style.display = "";
    celdasLPrep.forEach((c) => (c.style.display = ""));
  } else {
    if (thLPrep) thLPrep.style.display = "none";
    celdasLPrep.forEach((c) => (c.style.display = "none"));
  }
}

function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblpedido");
  const resultadoPaginador = document.getElementById("resultadoPaginador");
  const totalRegistros = document.getElementById("resultadoGeneral");

  if (resultadoPaginador) resultadoPaginador.innerHTML = "";
  if (totalRegistros) totalRegistros.innerHTML = "";

  if (tabla) {
    let tbody = tabla.querySelector("tbody");
    if (tbody) tbody.innerHTML = "";
  }
}

const fecha_ini = document.getElementById("fecha_ini");
if(fecha_ini){
  fecha_ini.addEventListener("change", function () {
    limpiarResultadoGeneral();
  });
}
const fecha_fin = document.getElementById("fecha_fin");
if(fecha_fin) {
  fecha_fin.addEventListener("change", function () {
    limpiarResultadoGeneral();
  });
}

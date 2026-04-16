//Verificacion de Ordenes de compra functions
document.addEventListener("DOMContentLoaded", function () {


  const busqueda = localStorage.getItem("autoSearchOrdenDeComprasList");
  localStorage.setItem("switchLecturaState", "true");
  //revisar como toma el valor
  if (busqueda === "true") {
    console.log("DOM completamente cargado y parseado.");

    const parametrosBusquedaOC = localStorage.getItem(
      "parametrosBusquedaOrdenesDeCompraList"
    );
    if (parametrosBusquedaOC) {
      const params = new URLSearchParams(parametrosBusquedaOC);
      const pSistema = params.get("pSistema");
      const pUsuario = params.get("pUsuario");
      const pOpcion = params.get("pOpcion");   
      const pBodega = "";
      const pFechaDesde = "";
      const pFechaHasta = "";
      // const pBodega = params.get("pBodega");
      // const pFechaDesde = params.get("pFechaDesde");
      // const pFechaHasta = params.get("pFechaHasta");
      const pEstado = "";
      const pOrden = params.get("pOrden");
     

      // Establecer los valores de los campos de fecha
      if(pFechaDesde) document.getElementById("fecha_ini").value = pFechaDesde;
      if(pFechaHasta) document.getElementById("fecha_fin").value = pFechaHasta;
      // 2. Esperar un instante para que Materialize inicialice y luego forzar el estado
          setTimeout(() => {
              // Forzar a los labels a subir
              M.updateTextFields();

              // Reinicializar los datepickers específicamente con la fecha guardada
              const inputs = document.querySelectorAll('.datepicker');
              inputs.forEach(input => {
                  const fechaGuardada = input.id === 'fecha_ini' ? pFechaDesde : pFechaHasta;
                  
                  if (fechaGuardada) {
                      // Crear objeto fecha (importante añadir la hora para evitar desfases de zona horaria)
                      const dateParts = fechaGuardada.split('-'); // Asumiendo YYYY-MM-DD
                      const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

                      M.Datepicker.init(input, {
                          format: 'yyyy-mm-dd',
                          defaultDate: d,
                          setDefaultDate: true, // Esto obliga al calendario a mostrar la fecha
                          autoClose: true
                      });
                  }
              });
          }, 100);


     enviarDatosControlador(pSistema,pUsuario, pOpcion,pBodega,pEstado,pOrden,pFechaDesde,pFechaHasta);
    }
  }
   inicializarFiltroFechas();
});



//////////////////FUNCION PARA MOSTRAR EL DETALLE DE las ORDENES DE COMPRAS///////////

function ValidaOrdenesDeCompra() {
    let fechasHabilitadas = document.getElementById('chkHabilitarFechas').checked;
    let pSistema = "WMS"; 
    let pUsuario = document.getElementById("hUsuario").value;
    let pOpcion = "P";
    let pBodega = "";
    // let pBodega = document.getElementById("bodega").value;
    let pEstado = "";
    let pOrden = $("#pOrden").val();

     if(fechasHabilitadas){
        var pFechaDesde = document.getElementById("fecha_ini").value;
        var pFechaHasta = document.getElementById("fecha_fin").value;
    }else{
        var pFechaDesde = "";
        var pFechaHasta = "";
    }
    enviarDatosControlador(pSistema,pUsuario, pOpcion,pBodega,pEstado,pOrden,pFechaDesde,pFechaHasta);
  }



function enviarDatosControlador(pSistema,pUsuario, pOpcion,pBodega,pEstado,pOrden,pFechaDesde,pFechaHasta) {
  mostrarLoader();
  const params =
    "?pSistema=" +
    pSistema +
    "&pUsuario=" +
    pUsuario +
    "&pBodega=" +
    pBodega +
    "&pEstado=" +
    pEstado +
    "&pOrden=" +
    pOrden +
    "&pOpcion=" +
    pOpcion +
    "&pFechaDesde=" +
    pFechaDesde +
    "&pFechaHasta=" +
    pFechaHasta;

  localStorage.setItem("parametrosBusquedaOrdenesDeCompraList", params);
  localStorage.setItem("autoSearchOrdenDeComprasList", "true");

  fetch(env.API_URL + "wmsordenesdecompras" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log("Respuesta del servidor:", result);
      if (result.msg === "SUCCESS") {
        if (result.respuesta.length != 0) {
          ArrayData = result.respuesta;
          ArrayDataFiltrado = result.respuesta;
          console.log(ArrayDataFiltrado);
          let cantReg = result.respuesta.length;
          let nPag = Math.ceil(cantReg / xPag);
          const tabla = document.getElementById("tblordendecompra");
          $("#tblordendecompra tbody").remove();

          let htm = `<div class="row" id="totalregistros">
              <div class="col s12"><span>Total de Registros: </span><span>${result.respuesta.length}</span></div>
            </div>`;

          document.getElementById("resultadoGeneral").innerHTML = htm;
          mostrarResultadosVerificacionOrdenes(nPag, 1);
          document.getElementById("carga").innerHTML = "";
          ocultarLoader();
        } else {
          Swal.fire({
            icon: "info",
            title: "Información",
            text: "No hay registros asignados para el usuario: " + pUsuario,
            confirmButtonColor: "#28a745",
          });
          document.getElementById("carga").innerHTML = "";
          limpiarResultadoGeneral();
          ocultarLoader();
        }
      }
    });
}
function mostrarResultadosVerificacionOrdenes(nPag, pag) {
  let desde = (pag - 1) * xPag;
  let hasta = pag * xPag;

  resultadosVerificacionOrdenes(desde, hasta);

  let htm = paginadorTablas(nPag, pag, "mostrarResultadosVerificacionOrdenes");
  document.getElementById("resultadoPaginador").innerHTML = htm;
}

function resultadosVerificacionOrdenes(desde, hasta) {
  // Asegúrate de que ArrayDataFiltrado esté definido y tenga datos
  if (!ArrayDataFiltrado || ArrayDataFiltrado.length === 0) {
    console.error("ArrayDataFiltrado no está definido o está vacío.");
    return;
  }

  // Obtener la tabla y su tbody
  const tabla = document.getElementById("tblordendecompra");
  let tbody = tabla.querySelector("tbody");

  // Limpiar el tbody existente
  if (tbody) {
    tbody.innerHTML = "";
  } else {
    tbody = document.createElement("tbody");
    tabla.appendChild(tbody);
  }

  // Crear el contenido del tbody
  let htm = "";

  for (let i = desde; i < hasta; i++) {
    if (ArrayDataFiltrado[i]) {
      // Formatear la fecha
      let fechaOrden = new Date(ArrayDataFiltrado[i].FECHA_ORDEN);
      let fechaFormateada = `${fechaOrden.getDate()}/${
        fechaOrden.getMonth() + 1
      }/${fechaOrden.getFullYear()}`;

      // Determinar si el índice de la fila es par o impar
      let backgroundColor = i % 2 === 0 ? "#f2f2f2" : "#ffffff";

      htm += `<tr onclick="irDetalleOC('${ArrayDataFiltrado[i].ORDEN_COMPRA}', '${ArrayDataFiltrado[i].EMBARQUE}', '${ArrayDataFiltrado[i].OBSERVACION}');" style="background-color:${backgroundColor};">`;
      htm += `<td style="text-align:left;">`;
      htm += `<h5>${ArrayDataFiltrado[i].ORDEN_COMPRA}</h5>`;
      htm += `<h6 style="color:#28a745;">${ArrayDataFiltrado[i].EMBARQUE}</h6>`;
      htm += `<h6>${fechaFormateada}</h6>`;
      htm += `</td>`;
      htm += `<td>${ArrayDataFiltrado[i].BODEGA_DESTINO}</td>`;
      htm += `<td>${ArrayDataFiltrado[i].NOMBRE}</td>`;
      htm += `<td>${
        !isNaN(ArrayDataFiltrado[i].cant_solicitada) &&
        ArrayDataFiltrado[i].cant_solicitada !== null
          ? parseFloat(ArrayDataFiltrado[i].cant_solicitada).toFixed(0)
          : "0"
      }</td>`;8
      htm += `<td>${
        !isNaN(ArrayDataFiltrado[i].cant_verificada) &&
        ArrayDataFiltrado[i].cant_verificada !== null
          ? parseFloat(ArrayDataFiltrado[i].cant_verificada).toFixed(0)
          : "0"
      }</td>`;
      htm += `<td>${
        !isNaN(ArrayDataFiltrado[i].cant_verificada) &&
        ArrayDataFiltrado[i].cant_embarcada !== null
          ? parseFloat(ArrayDataFiltrado[i].cant_embarcada).toFixed(0)
          : "0"
      }</td>`;
      htm += `<td>${
        parseFloat(ArrayDataFiltrado[i].cant_solicitada).toFixed(0) ===
        parseFloat(ArrayDataFiltrado[i].cant_verificada).toFixed(0)
          ? '<i class="material-icons" style="color:green;">done_all</i>'
          : '<i class="material-icons" style="color:red;">done_all</i>'
      }</td>`;
      htm += `</tr>`;
    }
  }

  // Insertar el HTML generado dentro del tbody de la tabla
  tbody.innerHTML = htm;

  // Limpiar el contenido del elemento con id 'carga'
  document.getElementById("carga").innerHTML = "";
}

function irDetalleOC(pOrden, pEmbarque, OBSERVACION) {
  localStorage.setItem("embarque", pEmbarque);
  localStorage.setItem("OrdenDeCompra", pOrden);

  // Manejar el valor de OBSERVACION para asignar null si es undefined
  localStorage.setItem(
    "observacion",
    OBSERVACION === undefined || OBSERVACION === null ? null : OBSERVACION
  );

  // localStorage.setItem("bodegaOC", pBodega);
  window.location.href = "lineasOrdenCompraProcesada.html";
}

// //limpiar el contenido de la busqueda
function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblordendecompra");
  const resultadoPaginador = document.getElementById("resultadoPaginador");
  const totalRegistros = document.getElementById("totalregistros");

  // Limpiar el contenido del paginador si existe
  if (resultadoPaginador) {
    resultadoPaginador.innerHTML = "";
  }

  // Limpiar el contenido de totalRegistros si existe
  if (totalRegistros) {
    totalRegistros.innerHTML = "";
  }

  // Limpiar el contenido del tbody de la tabla si la tabla existe
  if (tabla) {
    let tbody = tabla.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = "";
    }
  }
}

const fecha_ini = document.getElementById("fecha_ini");
fecha_ini.addEventListener("change", function () {
  limpiarResultadoGeneral();
});

const fecha_fin = document.getElementById("fecha_fin");
fecha_fin.addEventListener("change", function () {
  limpiarResultadoGeneral();
});
// Función para extraer el valor de un parámetro específico de la cadena de búsqueda
function obtenerValorParametro(parametros, nombreParametro) {
  // Crear un objeto URLSearchParams para manejar la cadena de parámetros
  const urlParams = new URLSearchParams(parametros);

  // Retornar el valor del parámetro solicitado
  return urlParams.get(nombreParametro);
}


/**
 * Habilita / deshabilita los campos de fecha según el checkbox
 * Se ejecuta al cargar la página y cada vez que cambie el checkbox
 */
function inicializarFiltroFechas() {
  const chkHabilitarFechas = document.getElementById('chkHabilitarFechas');
  const fechaIni = document.getElementById('fecha_ini');
  const fechaFin = document.getElementById('fecha_fin');

  if (!chkHabilitarFechas || !fechaIni || !fechaFin) return;

  const toggleFechas = () => {
    const habilitado = chkHabilitarFechas.checked;

    fechaIni.disabled = !habilitado;
    fechaFin.disabled = !habilitado;

    // Opcional: limpiar los campos cuando se deshabilitan
    if (!habilitado) {
      fechaIni.value = '';
      fechaFin.value = '';
      
      // Si usas Materialize Datepicker, puedes reiniciarlo también:
      // M.Datepicker.getInstance(fechaIni)?.setDate(null);
      // M.Datepicker.getInstance(fechaFin)?.setDate(null);
    }
  };

  // Evento del checkbox
  chkHabilitarFechas.addEventListener('change', toggleFechas);

  // Estado inicial (fechas deshabilitadas)
  toggleFechas();
}
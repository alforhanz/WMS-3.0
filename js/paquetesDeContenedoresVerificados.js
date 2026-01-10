var paquetesCreadosArray = [];
// var paquetesCreadosArray = [
//   {
//     "TRASLADO": "TRAS81-0000031109",
//     "CANT_PREPARADA": 2,
//     "CANT_VERIFICADA": 3,
//     "DIFERENCIA": 1,
//     "USUARIO": "XJULIDIAZ",
//     "FECHAHORA": "2026-01-06 14:14:53.410",
//     "BODEGA_DESTINO": "06 BREMEN 24 DE DICIEMBRE",
//     "BODEGA": "B-81"
//   },
//   {
//     "TRASLADO": "TRAS81-0000031101",
//     "CANT_PREPARADA": 8,
//     "CANT_VERIFICADA": 6,
//     "DIFERENCIA": -2,
//     "USUARIO": "PRUEBAPMA",
//     "FECHAHORA": "2025-12-26 10:24:35.857",
//     "BODEGA_DESTINO": "51 NORWING PLAZA CAROLINA",
//     "BODEGA": "B-81"
//   },
//   {
//     "TRASLADO": "TRAS81-0000031105",
//     "CANT_PREPARADA": 200,
//     "CANT_VERIFICADA": 200,
//     "DIFERENCIA": 0,
//     "USUARIO": "XJULIDIAZ",
//     "FECHAHORA": "2025-12-27 12:04:27.007",
//     "BODEGA_DESTINO": "01 BREMEN SANTIAGO",
//     "BODEGA": "B-81"
//   }
// ]

document.addEventListener("DOMContentLoaded", function () {
  console.log("Consulta de creación de Paquetes DOM cargado...");
  const parametrosBusqueda = localStorage.getItem("parametrosBusquedaPaquete");
  if (parametrosBusqueda) {
    const params = new URLSearchParams(parametrosBusqueda);
    const pSistema = params.get("pSistema") ?? "";
    const pUsuario = params.get("pUsuario") ?? "";
    const pOpcion = params.get("pOpcion") ?? "";
    const fechaIni = params.get("fechaIni") ?? "";
    const fechaFin = params.get("fechaFin") ?? "";
    const BodegaOrigen = params.get("BodegaOrigen") ?? "";
    const BodegaDestino = params.get("BodegaDestino") ?? "";
    const Aplicacion = params.get("Aplicacion") ?? "";

    const para =
                "?pSistema=" +
                pSistema +
                "&pUsuario=" +
                pUsuario +
                "&pOpcion=" +
                pOpcion +
                "&fechaIni=" +
                fechaIni +
                "&fechaFin=" +
                fechaFin +
                "&BodegaOrigen=" +
                BodegaOrigen +
                "&BodegaDestino="+
                BodegaDestino+
                "&Aplicacion=" +
                Aplicacion;
    enviarDatosControlador(para);
  }

  cargarBodegas();
});


// function cargarParametros() {
//   const data = {
//     pSistema: "WMS",
//     pUsuario: document.getElementById("hUsuario").value,
//     pOpcion: "R",
//     fechaIni: $("#fecha_ini").val(),
//     fechaFin: $("#fecha_fin").val(),
//     BodegaOrigen: document.getElementById("bodega").value,
//     BodegaDestino: document.getElementById("bodegaSelectPack").value,
//     Aplicacion: $("#Aplicacion").val()?.trim() || ""
//   };

//   const params = new URLSearchParams(data).toString();
//   enviarDatosControlador("?" + params);
// }
function cargarParametros() {
  mostrarLoader();
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario").value;
  let pOpcion = "R";
  let fechaIni = $("#fecha_ini").val();
  let fechaFin = $("#fecha_fin").val();
  let BodegaOrigen = document.getElementById("bodega").value;
  let BodegaDestino = document.getElementById("bodegaSelectPack").value;
  let Aplicacion = $("#Aplicacion").val() ? $("#Aplicacion").val().trim() : "";

  const params =
    "?pSistema=" +
    pSistema +
    "&pUsuario=" +
    pUsuario +
    "&pOpcion=" +
    pOpcion +
    "&fechaIni=" +
    fechaIni +
    "&fechaFin=" +
    fechaFin +
    "&BodegaOrigen=" +
    BodegaOrigen +
    "&BodegaDestino="+
    BodegaDestino+
    "&Aplicacion=" +
    Aplicacion;
  enviarDatosControlador(params);
}
function enviarDatosControlador(params) {
   //armarTablaResultados(paquetesCreadosArray);
  console.log("BUSQUEDA Paquete PARAMETROS\n " + params);
  localStorage.setItem("parametrosBusquedaPaquete", params);

  fetch(env.API_URL + "busquedadePaquetes" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log('API: ');
      console.log(result);
      if (result.msg === "SUCCESS") {
        // ocultarLoader();
        paquetesCreadosArray = result.respuesta;
        if (result.respuesta.length != 0) {
          armarTablaResultados(paquetesCreadosArray);
          console.log("REsultados:");
          console.log(paquetesCreadosArray);
        } else {
          // ocultarLoader();
          Swal.fire({
            icon: "info",
            title: "Información",
            text: "No hay registros asignados para el usuario",
            confirmButtonColor: "#28a745",
          });
        }
        document.getElementById("carga").innerHTML = "";
      } else {
        Swal.fire({
          icon: "error",
          title: "error",
          text: "Se registro un error en la aplicación",
          confirmButtonColor: "#28a745",
        });
      }
    });
  ocultarLoader();
}
function cargarBodegas() {
  fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra")
    .then((response) => response.json())
    .then((data) => {
      const bodegasSelect = document.getElementById("bodegaSelectPack");
      if (data.respuesta && Array.isArray(data.respuesta)) {
        // Limpiar las opciones existentes
        bodegasSelect.innerHTML =
          '<option value="" disabled selected>Seleccione una bodega</option>';

        // Agregar opciones nuevas
        data.respuesta.forEach((bodega) => {
          const option = document.createElement("option");
          option.value = bodega.BODEGA;
          option.textContent = bodega.NOMBRE;
          bodegasSelect.appendChild(option);
        });

        // Re-inicializar el select para aplicar los cambios
        M.FormSelect.init(bodegasSelect);
      } else {
        console.error("No se encontraron bodegas.");
      }
    })
    .catch((error) => console.error("Error al cargar las bodegas:", error));
}
function armarTablaResultados(detallePaquetesEncabezado) {
  const tbody = document.getElementById("tblbodyResultados");
  tbody.innerHTML = "";

  const cantidadDeRegistrosLabel = document.getElementById(
    "cantidadDeRegistros"
  );
  cantidadDeRegistrosLabel.textContent =
    "Cantidad de registros: " + detallePaquetesEncabezado.length;

  detallePaquetesEncabezado.forEach((detalle) => {
    const newRow = document.createElement("tr");
    newRow.addEventListener("click", () => {
      const Aplicacion = detalle.TRASLADO;
      irAlDetalle(Aplicacion);
    });

    newRow.innerHTML = `
      <td class="traslado resultados-Tabla">${detalle.TRASLADO}</td>    
         <td class="traslado resultados-Tabla">${detalle.CANT_PREPARADA}</td> 
            <td class="traslado resultados-Tabla">${detalle.CANT_VERIFICADA}</td> 
               <td class="traslado resultados-Tabla">${detalle.DIF}</td>     
      <td class="usertraslado resultados-Tabla">${detalle.USUARIO}</td>
      <td class="fecha resultados-Tabla">${detalle.FECHA}</td>  
      <td class="bodegaDestino resultados-Tabla">${detalle.BODEGA_DESTINO}</td>
    `;

    tbody.appendChild(newRow);
  });
}
function irAlDetalle(Aplicacion) {
  localStorage.setItem("ConsecutivoPaquete", Aplicacion);
  window.location.href = "detalle_paquete.html";
}
function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblResultados");
  const resultadoPaginador = document.getElementById("resultadoPaginador");
  const totalRegistros = document.getElementById("cantidadDeRegistros");
  const bodegaDestino = document.getElementById("bodegaSelectPack");

  // Limpiar el contenido del paginador si existe
  if (resultadoPaginador) {
    resultadoPaginador.innerHTML = "";
  }

  if (bodegaDestino) {
    bodegaDestino.innerHTML = "";
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
  localStorage.removeItem("SearchParameterFlag");
  localStorage.removeItem("parametrosBusquedaPaquete");
}

//Variable global que contiene el detalle del contenedor
var detalleLineasContenedoreses = [];

// const dataContenedores = [
//   {
//     ID: 1,
//     Contenedor: "M81-0000023255",
//     Traslado: "S02-0000014709",
//     Articulo: "215/60R17 ANN",
//     Descripcion: "LLANTA ANNAITE AN616 96H",
//     Codigo_Barra: "2072510302352",
//     codigos_barras: "2072510302352||",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 1,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 1,
//     Cant_Verificada: 1,
//     Cant_Leida: 1,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 2,
//     Contenedor: "M81-0000023255|M81-0000023256",
//     Traslado: "S02-0000014709|S02-0000014710",
//     Articulo: "215/60R17 FR",
//     Descripcion: "LLANTA FRONWAY ROADPOWER HT 100H XL",
//     Codigo_Barra: "6938628248686",
//     codigos_barras: "6938628248686||",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 164,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 16,
//     Cant_Verificada: 16,
//     Cant_Leida: 16,
//     Cant_Dif: 0,
//     Mas_Linea: "S",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 3,
//     Contenedor: "M81-0000023255",
//     Traslado: "S02-0000014710",
//     Articulo: "215/60R17 FRO",
//     Descripcion: "LLANTA FRONWAY VANPLUS 09 109/107T 8L",
//     Codigo_Barra: "6938628226066",
//     codigos_barras: "6938628226066||",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 8,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 8,
//     Cant_Verificada: 8,
//     Cant_Leida: 8,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 4,
//     Contenedor: "M81-0000023256",
//     Traslado: "S02-0000014709",
//     Articulo: "215/60R17 KH",
//     Descripcion: "LLANTA KUMHO TA11 96T",
//     Codigo_Barra: "8808956155513",
//     codigos_barras: "8808956155513||",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 1,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 1,
//     Cant_Verificada: 1,
//     Cant_Leida: 1,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 5,
//     Contenedor: "M81-0000023256",
//     Traslado: "S02-0000014709",
//     Articulo: "215/60R17 KHM",
//     Descripcion: "LLANTA KUMHO KH32 96H",
//     Codigo_Barra: "8808956159801",
//     codigos_barras: "8808956159801||",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 1,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 1,
//     Cant_Verificada: 1,
//     Cant_Leida: 1,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 6,
//     Contenedor: "M81-0000023257",
//     Traslado: "S02-0000014710",
//     Articulo: "215/60R17 KUMHO",
//     Descripcion: "LLANTA KUMHO TA51 96T",
//     Codigo_Barra: "8808956300395",
//     codigos_barras: "8808956300395||",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 1,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 1,
//     Cant_Verificada: 1,
//     Cant_Leida: 1,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 7,
//     Contenedor: "M81-0000023255",
//     Traslado: "S02-0000014710",
//     Articulo: "265/70R17 FALK",
//     Descripcion: "LLANTA FALKEN WILDPEAK HT02 115/121S",
//     Codigo_Barra: "332848A3002ZA",
//     codigos_barras: "332848A3002ZA||",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 10,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 6,
//     Cant_Verificada: 6,
//     Cant_Leida: 6,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 8,
//     Contenedor: "M81-0000023255",
//     Traslado: "S02-0000014709",
//     Articulo: "265/70R17 FK",
//     Descripcion: "LLANTA FALKEN WILDPEAK AT01 113S",
//     Codigo_Barra: "296047A3002Ja",
//     codigos_barras: "296047A3002Ja||",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 1,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 1,
//     Cant_Verificada: 1,
//     Cant_Leida: 1,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 9,
//     Contenedor: "M81-0000023255|M81-0000023256",
//     Traslado: "S02-0000014709|S02-0000014710",
//     Articulo: "265/70R17 FLK",
//     Descripcion: "LLANTA FALKEN WILDPEAK AT03 10L (121/118S)",
//     Codigo_Barra: "323833A3102Za",
//     codigos_barras: "323833A3102Za|323833A3002Ja|323833A3102SO",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 569,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 6,
//     Cant_Verificada: 6,
//     Cant_Leida: 6,
//     Cant_Dif: 0,
//     Mas_Linea: "S",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 10,
//     Contenedor: "M81-0000023256",
//     Traslado: "S02-0000014709",
//     Articulo: "265/70R17 ILI",
//     Descripcion: "LLANTA ILINK PENTERRA RT 115Q",
//     Codigo_Barra: "6932094132661",
//     codigos_barras: "||6932094132661",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 1,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 1,
//     Cant_Verificada: 1,
//     Cant_Leida: 1,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 11,
//     Contenedor: "M81-0000023257",
//     Traslado: "S02-0000014710",
//     Articulo: "265/70R17 KH",
//     Descripcion: "LLANTA KUMHO HT55 113T",
//     Codigo_Barra: "8808956293246",
//     codigos_barras: "||8808956293246",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 9,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 9,
//     Cant_Verificada: 9,
//     Cant_Leida: 9,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 12,
//     Contenedor: "M81-0000023257",
//     Traslado: "S02-0000014709",
//     Articulo: "RIN 17 RE2213 5H 528",
//     Descripcion: "INFINIT 17X8 5/114.3 ET35 CB73.1 GUNMETAL FAC MACH (GMFM)",
//     Codigo_Barra: null,
//     codigos_barras: "||",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 4,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 3,
//     Cant_Verificada: 3,
//     Cant_Leida: 3,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   },
//   {
//     ID: 13,
//     Contenedor: "M81-0000023256",
//     Traslado: "S02-0000014709",
//     Articulo: "RIN 18 188158 6H 643",
//     Descripcion: "INFINIT 18X9 6/114.3 ET0 CB66.1 (B +MILL SPK)",
//     Codigo_Barra: null,
//     codigos_barras: "||",
//     Bodega_Solicita: "B-02",
//     Fecha_Aprobacion: "28/10/2025",
//     total_cedi: 4,
//     Estado_tm: "C",
//     Estado_ml: "PW",
//     Estado_pl: "V",
//     Cant_Pedida: 4,
//     Cant_Verificada: 4,
//     Cant_Leida: 4,
//     Cant_Dif: 0,
//     Mas_Linea: "N",
//     NOMBRE: "Por enviar"
//   }
// ];

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  // console.log("Verificador de contenedores DOM cargado...");
  let usuario = document.getElementById("hUsuario").value;
  // console.log('hUsuario:',usuario);
  //localStorage.setItem('UserID',usuario);
  cargarBodegas();

  //permisoCrearPaquete();
});
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function validarBusquedaContenedor() {
  let bodega = document.getElementById("bodega").value;
  let pBodegaSolicita = document.getElementById("bodegaSelectOC").value;
  let pPlaca = document.getElementById("placa-camion").value;

  if (pPlaca === "" || pBodegaSolicita == "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Faltan parámetros para cargar los datos.\nVerifique que se hayan llenado correctamente los campos de la bodega de destino y la placa del camión.",
    });
  } else {
    mostrarLoader();
    let pSistema = "WMS";
    let pUsuario = document.getElementById("hUsuario").value;
    let pOpcion = "B";
    let pBodegaEnvia = bodega;
    let pConsecutivo = $("#pContenedor").val();
    let pEstado = "";
    let pFechaDesde = $("#fecha_ini").val();
    let pArticulo = "";

    const params =
      "?pSistema=" +
      pSistema +
      "&pUsuario=" +
      pUsuario +
      "&pOpcion=" +
      pOpcion +
      "&pBodegaEnvia=" +
      pBodegaEnvia +
      "&pBodegaDestino=" +
      pBodegaSolicita +
      "&pContenedor=" +
      pConsecutivo +
      "&pEstado=" +
      pEstado +
      "&pFechaDesde=" +
      pFechaDesde +
      "&pArticulo=" +
      pArticulo;
    localStorage.setItem("parametrosBusquedaPaquete", params);

    enviarDatosControlador(params);
  }
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function enviarDatosControlador(params) {
  console.log("BUSQUEDA CONTENEDOR PARAMETROS\n " + params);
  // localStorage.setItem('parametrosBusquedaContenedor', params);
  fetch(env.API_URL + "verificadordecontenedores" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        ocultarLoader();
        detalleLineasContenedoreses = result.respuesta;
        if (result.respuesta.length != 0) {
          armarTablaLectura(detalleLineasContenedoreses);
          guardarTablaEnArray();
          armarTablaVerificacion(detalleLineasContenedoreses);
          mostrarPestanaLectura();
          console.log("REsultados:");
          console.log(detalleLineasContenedoreses);
          Swal.fire({
            icon: "info",
            title: "Información",
            text: "Registros cargados en la pestaña Verificación",
            confirmButtonColor: "#28a745",
          });
        } else {
          ocultarLoader();
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

function mostrarPestanaLectura() {
  // Cambia la pestaña activa
  const tabLectura = document.querySelector(
    '#tabs-swipe-demo a[href="#tabla-lectura"]'
  );
  tabLectura.click(); // Simula el clic

  // Opcional: enfocar el input del código de barras
  document.getElementById("codigo-barras").focus();
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function limpiarResultadoGeneral() {
  const tabla = document.getElementById("tblcontenedores");
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
  // localStorage.removeItem('SearchParameterFlag');
  // localStorage.removeItem('parametrosBusquedaContenedor');
}
function limpiarTblLectura() {
  const tabla = document.getElementById("myTableLectura");

  // Limpiar el contenido del tbody de la tabla si la tabla existe
  if (tabla) {
    let tbody = tabla.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = "";
    }
  }
  // localStorage.removeItem('SearchParameterFlag');
  // localStorage.removeItem('parametrosBusquedaContenedor');
}
// Función para cargar las bodegas
function cargarBodegas() {
  fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra")
    .then((response) => response.json())
    .then((data) => {
      const bodegasSelect = document.getElementById("bodegaSelectOC");
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
/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////                       LECTURA Y VERIFICACION                          ////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////// ARMA LA TABLA LECTURA ///////////////////////////////////////////////////////////
function armarTablaLectura(detalleLineasContenedor) {
  var tbody = document.getElementById("tblbodyLectura");

  tbody.classList.add("display", "centered");

  tbody.innerHTML = "";

  detalleLineasContenedor.forEach(function (detalle) {
    if (detalle.Cant_Leida != null && detalle.Cant_Leida !== "") {
      if (detalle.Cant_Leida != 0) {
        var newRow = document.createElement("tr");
        newRow.innerHTML = `
                <td>
                    <span style="display: block; text-align: center;">${
                      detalle.Articulo
                    }</span>
                </td>
                <td class="codigo-barras-cell" style="text-align: center;">
                    <input id="codigo-barras" type="text" class="codigo-barras-input" value="${
                      detalle.Codigo_Barra || ""
                    }" onchange="validarCodigoBarras(this)" autofocus>
                </td>
                <td class="codigo-barras-cell2" style="text-align: center;">
                    <input id="cant-pedida" style="text-align: center;" type="text" class="codigo-barras-input" value="${
                      detalle.Cant_Leida || ""
                    }" onchange="guardarTablaEnArray(this)">
                </td>
                <td class="codigo-barras-cell2" style="text-align: center;">
                <i class="material-icons red-text" style="cursor: pointer;" onclick="eliminarFila(this)">clear</i>
                </td>
            `;
        tbody.appendChild(newRow);
      }
    }
  });
  guardarTablaEnArray();
  crearNuevaFila();
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////     FUNCIONES PARA LA PESTAÑA LECTURA - VALIDA EL CODIGO LEIDO   ///////////////////////
///// Funcion que valida el codigo leido en el imput ////////////
function validarCodigoBarras(input) {
  var LineasContenedor = detalleLineasContenedoreses;

  const codbarra = input.value.toUpperCase(); // Convertir a mayúsculas

  const row = input.closest("tr");
  const firstTd = row.querySelector("td:first-child");
  const span = firstTd.querySelector("span");
  const siguienteTd = row.querySelector(".codigo-barras-cell2");
  const cantFila = siguienteTd.querySelector(".codigo-barras-input");

  var codigoValido = false;

  for (var i = 0; i < LineasContenedor.length; i++) {
    let codigosArrayArticulo = [];
    if (LineasContenedor[i].codigos_barras) {
      codigosArrayArticulo = LineasContenedor[i].codigos_barras
        .split("|")
        .map((codigo) => codigo.toUpperCase());
    }

    if (
      (LineasContenedor[i].Articulo &&
        LineasContenedor[i].Articulo.toUpperCase() === codbarra) ||
      (LineasContenedor[i].Codigo_Barra &&
        LineasContenedor[i].Codigo_Barra.toUpperCase() === codbarra) ||
      codigosArrayArticulo.includes(codbarra)
    ) {
      if (LineasContenedor[i].total_cedi > 0) {
        span.textContent = LineasContenedor[i].Articulo;
        cantFila.value = 1;
        // Bloquear la celda del código de barras
        input.setAttribute("readonly", "readonly");
        // Aquí se genera una fila nueva vacía
        crearNuevaFila();
        // Llamar función que guarda artículos en la tabla
        guardarTablaEnArray();
        codigoValido = true;
        break;
      } else {
        Swal.fire({
          icon: "warning",
          title: "¡Articulo sin Existencias!",
          text:
            "La referencia " +
            LineasContenedor[i].Articulo +
            " no cuenta con existencias",
          confirmButtonColor: "#28a745",
        });
        codigoValido = true;
        const codigoBarrasCell = row.querySelector(".codigo-barras-cell");
        const codigoBarrasInput = codigoBarrasCell.querySelector(
          ".codigo-barras-input"
        );
        codigoBarrasInput.value = "";
        break;
      }
    }
  }

  if (!codigoValido) {
    // Borrar el contenido de la celda COD
    const codigoBarrasCell = row.querySelector(".codigo-barras-cell");
    const codigoBarrasInput = codigoBarrasCell.querySelector(
      ".codigo-barras-input"
    );
    codigoBarrasInput.value = "";

    Swal.fire({
      icon: "warning",
      title: "¡Código no válido!",
      text: "El código ingresado no coincide con ningún artículo de la solicitud. Intente nuevamente.",
      confirmButtonColor: "#28a745",
    });
  }
}
/////////////   Funcion que crea la nueva fila en la pestaña lectura ////////////////
function crearNuevaFila() {
  const tableBody = document.querySelector("#tblbodyLectura");

  tableBody.classList.add("display", "centered");

  const nuevaFilaHTML = `<tr>
            <td class="sticky-column" style="text-align: center;" style="user-select: none;"><span display: inline-block;"></span></td>
            <td class="codigo-barras-cell" style="text-align: center;"><input type="text" style="text-align: center;" id="codigo-barras" class="codigo-barras-input" value="" onchange="validarCodigoBarras(this)" autofocus></td>
            <td class="codigo-barras-cell2" style="text-align: center;"><input id="cant-pedida" style="text-align: center;" type="text" class="codigo-barras-input" value="" onchange="actualizaLectura(this)"></td>
            <td class="codigo-barras-cell2" style="text-align: center;"><i class="material-icons red-text" style="cursor: pointer;" onclick="eliminarFila(this)">clear</i></td>
        </tr>`;

  tableBody.insertAdjacentHTML("beforeend", nuevaFilaHTML);

  // Obtén el último campo de entrada en la columna COD de la nueva fila
  const nuevoCodigoBarrasInput = tableBody.querySelector(
    "tr:last-child .codigo-barras-input"
  );

  // Establece el enfoque en el último campo de entrada
  if (nuevoCodigoBarrasInput) {
    nuevoCodigoBarrasInput.focus();
  }
}
/////////////Actualiza el arreglo de las cantidades leídas, si se modifíca ya ue por defecto esta es 1////////
function actualizaLectura() {
  guardarTablaEnArray();
}
/////aguarda en un arreglo y en el localstorage la información leida en la tabla lectura
function guardarTablaEnArray() {
  var dataArray = [];

  var table = document.getElementById("myTableLectura");
  var rows = table.getElementsByTagName("tr");

  for (var i = 1; i < rows.length; i++) {
    // Comenzamos desde 1 para omitir la fila de encabezado
    var row = rows[i];
    var cells = row.getElementsByTagName("td");
    //aqui se seleccionan los elemendos de las columnas de la tabla lectura

    var articulo = cells[0].querySelector("span").textContent.trim();
    var codigoBarraInput = cells[1].querySelector(".codigo-barras-input");
    var cantidadLeidaInput = cells[2].querySelector(".codigo-barras-input");

    var codigoBarra = codigoBarraInput.value;

    var cantidadLeida = parseFloat(cantidadLeidaInput.value);
    // Verificar si los valores no son nulos ni vacíos antes de almacenarlos

    if (articulo !== null && articulo !== "" && !isNaN(cantidadLeida)) {
      var rowData = {
        ARTICULO: articulo,
        CODIGO_BARRA: codigoBarra,
        CANTIDAD_LEIDA: cantidadLeida,
      };

      dataArray.push(rowData);
    }
  }

  localStorage.setItem("dataArray", JSON.stringify(dataArray));

  agrupar();

  return dataArray;
}
///////////////////////FUNCION QUE AGRUPA EL DATA ARRAY CON LAS LECTURAS DEL Contenedor/////////////////////////
function agrupar() {
  // Obtener el arreglo almacenado en localStorage
  var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];

  // Objeto para almacenar las cantidades consolidadas
  var cantidadesConsolidadas = {};

  // Recorrer el arreglo dataArray
  dataArray.forEach(function (item) {
    var articulo = item.ARTICULO;
    var cantidad = item.CANTIDAD_LEIDA;

    // Verificar si ya existe una cantidad para este artículo
    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      // Si existe, sumar la cantidad
      cantidadesConsolidadas[articulo] += cantidad;
    } else {
      // Si no existe, agregar una nueva entrada
      cantidadesConsolidadas[articulo] = cantidad;
    }
  });

  // Crear un nuevo arreglo con los resultados consolidados
  var newArray = [];
  for (var articulo in cantidadesConsolidadas) {
    if (cantidadesConsolidadas.hasOwnProperty(articulo)) {
      newArray.push({
        ARTICULO: articulo,
        CANTIDAD_LEIDA: cantidadesConsolidadas[articulo],
      });
    }
  }

  // Actualizar el arreglo en localStorage con los resultados consolidados
  localStorage.setItem("dataArray", JSON.stringify(newArray));
}
/////// Funcion que elimina filas en la pestaña lectura  //////////////////////////////////////////////////
function eliminarFila(icon) {
  var row = icon.closest("tr");
  //var articuloEliminado = row.querySelector('.sticky-column').innerText.trim();

  // Mostrar un SweetAlert antes de eliminar la fila
  Swal.fire({
    title: "¿Estás seguro?",
    text: "A continuación se va a eliminar una fila de la pestaña lectura",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
    confirmButtonText: "Sí, eliminar",
  }).then((result) => {
    if (result.isConfirmed) {
      // Verificar si la fila está vacía
      var isEmptyRow = true;
      var cells = row.querySelectorAll(".codigo-barras-input");
      var artic = row.querySelector;
      cells.forEach(function (cell) {
        if (cell.value.trim() !== "") {
          isEmptyRow = false;
        }
      });

      // Elimina la fila solo si no está vacía
      if (isEmptyRow) {
        // Llamar función que guarda artículos en la tabla
        var dataFromTable = guardarTablaEnArray();

        Swal.fire({
          icon: "warning",
          title: "Está intentando borrar una fila vacia",
          confirmButtonText: "Cerrar",
        });
      } else {
        row.remove();

        // Después de eliminar la fila, establecer el enfoque en el último campo de entrada en la columna COD
        const tableBody = document.querySelector("#tblbodyLectura");
        const ultimoCodigoBarrasInput = tableBody.querySelector(
          "tr:last-child .codigo-barras-input"
        );

        // Establecer el enfoque en el último campo de entrada
        if (ultimoCodigoBarrasInput) {
          ultimoCodigoBarrasInput.focus();
        }
        // Llamar a la función para actualizar filas eliminadas con el artículo eliminado como parámetro
        guardarTablaEnArray();
      }
    }
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////VALIDA EL CONTENIDO DE LA PESTAÑA LECTURA CONTRA LA TABLA VERIFICACION//////////////////
////Funcion que limpia el area de mensajes de error
function limpiarMensajes() {
  localStorage.removeItem("mensajes");
  const mensajeTextArea = document.getElementById("mensajeText");
  mensajeTextArea.value = "";
  // Limpiar la variable 'mensajes' del localStorage
  guardarTablaEnArray();
}
///FUNCION QUE ARMA LA TABLA DE LA PESTAÑA VERIFICACION
function armarTablaVerificacion(detalleLineasContenedores) {
  const tbody = document.getElementById("tblbodyLineasContenedor");
  tbody.innerHTML = "";

  const cantidadDeRegistrosLabel = document.getElementById(
    "cantidadDeRegistros"
  );
  cantidadDeRegistrosLabel.textContent =
    "Cantidad de registros: " + detalleLineasContenedores.length;

  detalleLineasContenedores.forEach((detalle) => {
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td class="solicitud" hidden>${detalle.Traslado}</td>        
      <td class="contenedor" style="text-align: left;">
          <h5>${detalle.Contenedor}</h5>
          <h6>${detalle.Traslado}</h6>
      </td>
      <td class="articulo">
          <h5 class="verifica-articulo">
              <span class="blue-text text-darken-2">${detalle.Articulo}</span>
          </h5>
          <h6 style="text-align:left;">${detalle.Descripcion}</h6>
      </td>           
      <td class="cantidadPedida" style="text-align: left;">
          ${
            isNaN(parseFloat(detalle.Cant_Pedida))
              ? 0
              : parseFloat(detalle.Cant_Pedida).toFixed(2)
          }
      </td>        
      <td class="cantidadPreparada" style="text-align: left;">
          ${
            isNaN(parseFloat(detalle.Cant_Verificada))
              ? 0
              : parseFloat(detalle.Cant_Verificada).toFixed(2)
          }
      </td>
      <td class="cantidadLeida" style="text-align: left;"></td>
      <td class="verificado" style="text-align: left;"></td>      
      <td class="devolver" style="text-align: left;">
         <i class="material-icons" 
           style="color: #FF0000; cursor: pointer;" 
           onclick="autorizaDevolucion('${detalle.Articulo}', '${
      detalle.Contenedor
    }','${
      isNaN(parseFloat(detalle.Cant_Verificada))
        ? 0
        : parseFloat(detalle.Cant_Verificada).toFixed(2)
    }')">reply</i>
      </td>        
    `;
    tbody.appendChild(newRow);
  });
}
//VERIFICA LA CANTIDAD LEIDA EN LA PESTAÑA LECTURA, CONTRA LO QUE SE INDICA EN LA TABLA DE LA PESTAÑA VERIFICACION
function verificacion() {
  const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  //console.log("DataArray", dataArray);

  const tabla = document.getElementById("tblcontenedores");
  if (!tabla)
    return console.warn("⚠️ No se encontró la tabla de verificación.");

  const filas = tabla.querySelectorAll("tbody tr");
  const mensajesArray = [];

  // Limpiar las celdas previas de cantidadLeida y verificado
  filas.forEach((fila) => {
    const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
    const verifcheck = fila.querySelector(".verificado");
    if (cantidadLeidaCell) cantidadLeidaCell.textContent = "";
    if (verifcheck) verifcheck.textContent = "";
  });

  // Construir objeto de totales
  const cantidadesTotales = {};

  dataArray.forEach((item) => {
    const art = item.ARTICULO.trim();
    const cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
    cantidadesTotales[art] = (cantidadesTotales[art] || 0) + cant;
  });

  // console.log("Totales agrupados:", cantidadesTotales);

  // Recorrer filas para verificar coincidencias
  filas.forEach((fila) => {
    const articuloCell = fila.querySelector(".verifica-articulo span");
    const cantPreparadaCell = fila.querySelector(".cantidadPreparada");
    const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
    const verificadoCell = fila.querySelector(".verificado");

    if (!articuloCell || !cantPreparadaCell) return;

    const articulo = articuloCell.textContent.trim();
    const cantPedida = parseFloat(cantPreparadaCell.textContent) || 0;

    const cantLeida = cantidadesTotales.hasOwnProperty(articulo)
      ? cantidadesTotales[articulo]
      : null;
    // const cantLeida = cantidadesTotales[articulo] || 0;

    // Mostrar cantidad leída
    if (cantidadLeidaCell) cantidadLeidaCell.textContent = cantLeida;
    // cantLeida.toFixed(2);

    // Comparar cantidades
    if (cantLeida === cantPedida && cantLeida > 0) {
      // ✅ Coincidencia exacta
      if (verificadoCell) {
        const icon = document.createElement("span");
        icon.classList.add("material-icons");
        icon.textContent = "done_all";
        icon.style.color = "green";
        verificadoCell.appendChild(icon);
      }
    } else if (cantLeida > cantPedida) {
      // ⚠️ Exceso
      const diff = (cantLeida - cantPedida).toFixed(2);
      if (verificadoCell) verificadoCell.textContent = `+${diff}`;
      mensajesArray.push(
        `*La cantidad verificada del artículo ${articulo} es mayor a la solicitada.`
      );
    } else if (cantLeida < cantPedida && cantLeida > 0) {
      // ⚠️ Faltante
      const diff = (cantLeida - cantPedida).toFixed(2);
      if (verificadoCell) verificadoCell.textContent = diff;
      mensajesArray.push(
        `>La cantidad verificada del artículo ${articulo} es menor a la solicitada.`
      );
    }
  });

  // Guardar mensajes en localStorage y mostrarlos
  localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
  limpiarMensajes();

  // Mostrar mensajes en el textarea
  const mensajeText = document.getElementById("mensajeText");
  if (mensajeText) mensajeText.value = mensajesArray.join("\n");

  // console.log("Mensajes generados:", mensajesArray);
} ////FIN de VERIFICACION

// //////////////////////////////////////////////////////////////////////////////////////////////////////////
//                               Función para inicializar los botones                                      //
// //////////////////////////////////////////////////////////////////////////////////////////////////////////
function inicializarBotones() {
  // Crear los botones y el contenedor
  const contenedorBotones = document.createElement("div");
  const botonProcesar = document.createElement("button");
  const botonGuardarParcial = document.createElement("button");

  // Configurar propiedades de los botones
  botonProcesar.textContent = "Crear Paquete";
  botonProcesar.id = "btnCrearPaqueteContenedor";
  botonProcesar.hidden = false;
  botonProcesar.onclick = ConfirmaCrearPaqueteContenedores; // Agregar onclick

  botonGuardarParcial.textContent = "Guardar";
  botonGuardarParcial.id = "btnGuardar";
  botonGuardarParcial.hidden = false;
  botonGuardarParcial.onclick = confirmarGuardadoParcial; // Agregar onclick

  // Aplicar estilos al botón de guardado parcial
  botonGuardarParcial.style.backgroundColor = "#28a745";
  botonGuardarParcial.style.borderRadius = "5px";
  botonGuardarParcial.style.color = "white";
  botonGuardarParcial.style.marginTop = "16px";
  botonGuardarParcial.style.marginLeft = "16px";
  botonGuardarParcial.style.marginRight = "16px";
  botonGuardarParcial.style.height = "36px";
  botonGuardarParcial.style.width = "100px";

  // Aplicar estilos al botón de Procesar
  botonProcesar.style.width = "100px";
  botonProcesar.style.backgroundColor = "#28a745";
  botonProcesar.style.borderRadius = "5px";
  botonProcesar.style.color = "white";
  botonProcesar.style.marginTop = "16px";
  botonProcesar.style.marginLeft = "6em";
  botonProcesar.style.height = "40px";
  botonProcesar.style.marginbottom = "25px";

  // Agregar botones al contenedor
  contenedorBotones.appendChild(botonGuardarParcial);
  contenedorBotones.appendChild(botonProcesar);

  // Obtener tabla de verificación
  const tablaVerificacion = document.getElementById("tblcontenedores");

  // Insertar contenedor de botones después de la tabla de verificación
  tablaVerificacion.parentNode.insertBefore(
    contenedorBotones,
    tablaVerificacion.nextSibling
  );

  // Media query para pantallas grandes
  const mediaQuery = window.matchMedia("(min-width: 64em)");
  if (mediaQuery.matches) {
    // Aplicar estilos específicos para pantallas grandes
    botonGuardarParcial.style.marginLeft = "200px";
    botonProcesar.style.marginLeft = "500px";
  }
}
// //////////////////////////////////////////////////////////////////////////////////////////////////////////
// Función para mostrar los mensajes almacenados en el localStorage en el textarea
function mostrarMensajesLocalStorage() {
  const mensajesStorage = localStorage.getItem("mensajes");
  if (mensajesStorage) {
    const mensajes = JSON.parse(mensajesStorage);
    const textarea = document.getElementById("mensajeText");
    // Limpiar el textarea antes de agregar nuevos mensajes
    textarea.value = "";
    // Agregar cada mensaje al textarea
    for (let i = 0; i < mensajes.length; i++) {
      textarea.value += mensajes[i] + "\n"; // Agregar el mensaje y un salto de línea
    }
  }
}
//Llama a la función mostrarMensajesLocalStorage cuando se hace clic en la pestaña "Verificación"
document
  .querySelector('a[href="#tabla-verificacion"]')
  .addEventListener("click", mostrarMensajesLocalStorage);
///////////////////////////////////////////////////////////////////////////////////////////////////////
//Funcion de confirmación del guardado parcial
function confirmarGuardadoParcial() {
  Swal.fire({
    icon: "info",
    title:
      "¿A continuación se guardaran los datos leidos de la pestaña verificación...?",
    showCancelButton: true,
    confirmButtonText: "Continuar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
  }).then((result) => {
    if (result.isConfirmed) {
      guardaParcialMente();
      //    Swal.fire({
      //     icon: 'info',
      //     title: 'Guardado',
      //     text: 'Cuardando...'
      //   });
    }
  });
}
//FUNCION DE GUARDADO PARCIAL
async function guardaParcialMente() {
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario").value;
  let pOpcion = "L";
  let pBodegaOrigen = document.getElementById("bodega").value;
  let pBodegaDestino = document.getElementById("bodegaSelectOC").value;
  let pFecha = new Date().toISOString().split("T")[0];
  let pPlaca = document.getElementById("placa-camion").value;
  let pReferencia = "Ref o null";
  let pComentario = "Comentario o null";
  const table = document.getElementById("tblcontenedores");
  const detalles = [];

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];

    const contenedor =
      row.querySelector(".contenedor h5")?.textContent.trim() || "0";
    const solicitud =
      row.querySelector(".solicitud")?.textContent.trim() || "0";
    const articulo =
      row.querySelector(".verifica-articulo span")?.textContent.trim() || "";
    const cantidadPedida = Number(
      row.querySelector(".cantidadPedida")?.textContent.trim() || 0
    );
    const cantidadPreparada = Number(
      row.querySelector(".cantidadPreparada")?.textContent.trim() || 0
    );
    const cantidadLeida = Number(
      row.querySelector(".cantidadLeida")?.textContent.trim() || 0
    );

    detalles.push({
      CONTENEDOR: contenedor,
      SOLICITUD: solicitud,
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_PREPARADA: cantidadPreparada,
      CANT_LEIDA: cantidadLeida,
    });
  }
  console.log("detallesARRAY:\n ", detalles);

  // console.log(`Total de registros a enviar: ${detalles.length}`);

  // 🔁 Dividir el array en chunks de 20
  const chunkSize = 20;
  const chunks = [];
  for (let i = 0; i < detalles.length; i += chunkSize) {
    chunks.push(detalles.slice(i, i + chunkSize));
  }

  // console.log(`Se dividirán en ${chunks.length} lotes de ${chunkSize} (último puede ser menor)`);

  // ⚙️ Configuración base del fetch
  const myInit = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  };

  // 🔄 Enviar cada lote secuencialmente recorremos el array detalles[] dividido segun el tamaño de los paquetes
  for (let i = 0; i < chunks.length; i++) {
    //const jsonPaquete = encodeURIComponent(JSON.stringify(chunks[i]));
    const jsonPaquete = encodeURIComponent(JSON.stringify(chunks[i]));
   // const jsonPaquete = JSON.stringify(chunks[i]);
    const params =
      "?pSistema=" +
      pSistema +
      "&pUsuario=" +
      pUsuario +
      "&pOpcion=" +
      pOpcion +
      "&pBodegaOrigen=" +
      pBodegaOrigen +
      "&pBodegaDestino=" +
      pBodegaDestino +
      "&pFecha=" +
      pFecha +
      "&pPlaca=" +
      pPlaca +
      "&jsonPaquete=" +
      jsonPaquete +
      "&pReferencia=" +
      pReferencia +
      "&pComentario=" +
      pComentario;
    //console.log('PARAMETROS: '+params);
    console.log(`📦 Enviando lote ${i + 1} de ${chunks.length}...`);
    console.log("jsonPaquete=\n", jsonPaquete);
    console.log("Fin...");
    //llamada al API...
    try {
      const response = await fetch(
        env.API_URL + "guardacreapaquete" + params,
        myInit
      );
      const result = await response.json();

      console.log(`✅ Lote ${i + 1} procesado`, result);

      if (result.msg !== "SUCCESS") {
        console.warn(`⚠️ Error en lote ${i + 1}`, result);
        break; // Si hay un error, detén el proceso
      }
    } catch (err) {
      console.error(`🚨 Error al enviar lote ${i + 1}:`, err);
      break;
    }
  }

  // 🎉 Mensaje final si todo fue bien
  Swal.fire({
    icon: "success",
    title: "Todos los datos fueron Guardados correctamente",
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
  }).then((result) => {
    if (result.isConfirmed) {
      mostrarPestanaLectura();
    }
  });
}
///////FUNCION PARA PROCESAR//////
function ConfirmaCrearPaqueteContenedores() {
  Swal.fire({
    icon: "warning",
    title: "¿Desea crear el paquete?",
    showCancelButton: true,
    confirmButtonText: "Continuar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
  }).then((result) => {
    if (result.isConfirmed) {
      // Verificar si todas las celdas de verificación están marcadas
      if (validarVerificacion()) {
        // Si todas están marcadas, procesar el contenedor
        localStorage.removeItem("UsuarioAutorizacion");
        console.log("Se creara el paquete" + validarVerificacion);
        CrearPaqueteContenedores();
      } else {
        Swal.fire({
          title: "Ingrese sus credenciales",
          html:
            '<input id="swal-input1" class="swal2-input" placeholder="Usuario" autocomplete="off">' +
            '<input id="swal-input2" class="swal2-input" placeholder="Contraseña" type="password" autocomplete="off">',
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: "Aprobar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#28a745",
          cancelButtonColor: "#6e7881",
          preConfirm: () => {
            const usuario = document
              .getElementById("swal-input1")
              .value.toUpperCase();
            const contraseña = document.getElementById("swal-input2").value;
            return { usuario: usuario, contraseña: contraseña };
          },
        }).then((result) => {
          if (
            !result.isDismissed &&
            result.value &&
            result.value.usuario &&
            result.value.contraseña
          ) {
            fetch(env.API_URL + "wmsautorizacioncontenedor")
              .then((response) => response.json())
              .then((resultado) => {
                //// console.log('Autorizacion Resultado: ');
                //// console.log(resultado.respuesta);
                const respuesta = resultado.respuesta[0];
                if (
                  respuesta &&
                  respuesta.USUARIO === result.value.usuario &&
                  respuesta.PIN === result.value.contraseña
                ) {
                  console.log("Credenciales válidas");
                  console.log(respuesta.USUARIO);
                  localStorage.setItem(
                    "UsuarioAutorizacion",
                    respuesta.USUARIO
                  );
                  // Realiza la acción deseada, como procesar el contenedor
                  CrearPaqueteContenedores();
                } else {
                  //// console.log("Credenciales inválidas");
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Credenciales inválidas",
                  });
                }
              })
              .catch((error) => {
                // console.error('Error al obtener los datos del API:', error);
                Swal.fire({
                  icon: "error",
                  title: "Error",
                  text: error,
                });
              });
          } else {
            // console.error('Error: No se pudieron obtener los valores de usuario y contraseña del Swal');
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "No se pudieron obtener los valores de usuario y contraseña del Swal",
            });
          }
        });
      }
    }
  });
}
function CrearPaqueteContenedores() {
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario").value;
  let pOpcion = "R";
  let pBodegaOrigen = document.getElementById("bodega").value;
  let pBodegaDestino = document.getElementById("bodegaSelectOC").value;
  let pFecha = new Date().toISOString().split("T")[0];
  let pPlaca = document.getElementById("placa-camion").value;
  let pReferencia = "Ref o null";
  let pComentario = "Comentario o null";
  let jsonPaquete = "";

  const params =
    "?pSistema=" +
    pSistema +
    "&pUsuario=" +
    pUsuario +
    "&pOpcion=" +
    pOpcion +
    "&pBodegaOrigen=" +
    pBodegaOrigen +
    "&pBodegaDestino=" +
    pBodegaDestino +
    "&pFecha=" +
    pFecha +
    "&pPlaca=" +
    pPlaca +
    "&jsonPaquete=" +
    jsonPaquete +
    "&pReferencia=" +
    pReferencia +
    "&pComentario=" +
    pComentario;

  // console.log("Params:\n"+params);
  fetch(env.API_URL + "guardacreapaquete" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log("Respuesta del SP");
      console.log(result.respuesta);
      if (result.msg === "SUCCESS") {
        if (result.respuesta.length != 0) {
          let respuesta = result.respuesta[0].Respuesta;
          console.log("Respuesta del API:\n" + result.respuesta[0].Respuesta);
          if (result.respuesta[0].Respuesta.toUpperCase().startsWith("TRAS")) {
            Swal.fire({
              icon: "success",
              title: "Se creó el paquete N° " + respuesta + " con éxito",
              showDenyButton: true,
              confirmButtonText: "Aceptar",
              denyButtonText: "Imprimir",
              confirmButtonColor: "#28a745",
              denyButtonColor: "#007bff",
              cancelButtonColor: "#6e7881",
            }).then((resultSwal) => {
              if (resultSwal.isConfirmed) {
              } else if (resultSwal.isDenied) {
                imprimirPaqueteReporte(respuesta);
                limpiarResultadoGeneral();
                limpiarMensajes();
              }
            });
          } else {
            Swal.fire({
              icon: "error",
              title: result.respuesta[0].Respuesta,
              confirmButtonText: "Aceptar",
              confirmButtonColor: "#28a745",
            });
          }
        } else {
          // console.log("El API no devolvio nada");
        }
      } else {
      }
    });
}
// FUNCION PARA VERIFICAR EL CHECK EN LA COLUNA DE VERIFICACO
/**
 * Valida que TODAS las filas tengan el ícono 'done_all' en la columna de Verificación (índice 5)
 * @returns {boolean} true → todas verificadas, false → alguna no lo está
 */
const validarVerificacion = () => {
  const filas = document.querySelectorAll("#tblbodyLineasContenedor tr");

  // Si no hay filas → no está verificado
  if (filas.length === 0) return false;

  return Array.from(filas).every((row) => {
    const celdaVerif = row.cells[6]; // Columna 6 (Verif)
    if (!celdaVerif) return false;

    const icono = celdaVerif.querySelector(".material-icons");
    return icono?.textContent?.trim() === "done_all";
  });
};

// function validarVerificacion() {
//     // Obtener todas las celdas de verificación
//     var celdasVerificacion = document.querySelectorAll('#tblbodyLineasContenedor td#verificado');
//     // Iterar sobre cada celda de verificación
//     for (var i = 0; i < celdasVerificacion.length; i++) {
//         // Obtener el span dentro de la celda
//         var spanVerificacion = celdasVerificacion[i].querySelector('span.material-icons');
//         // Verificar si el span no está presente o su contenido no es 'done_all'
//         if (!spanVerificacion || spanVerificacion.textContent !== 'done_all') {
//             // Si encuentra una celda sin verificar, retorna false
//             return false;
//         }
//     }
//     // Si todas las celdas están verificadas, retorna true
//     return true;
// }
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function columnaEstaVacia() {
  // Selecciona todas las celdas con id "cantidadLeida" dentro del cuerpo de la tabla
  var celdasCantidadLeida = document.querySelectorAll(
    "#tblbodyLineasContenedor td#cantidadLeida"
  );

  // Recorremos cada celda y verificamos si alguna tiene contenido
  for (var i = 0; i < celdasCantidadLeida.length; i++) {
    if (celdasCantidadLeida[i].textContent.trim() !== "") {
      return false; // Al menos una celda tiene datos
    }
  }

  return true; // Todas las celdas están vacías
}
/////// Llamar a la función para cargar y mostrar los mensajes desde el localStorage al cargar la página
window.onload = function () {
  inicializarBotones();
  guardarTablaEnArray();
};
function permisoCrearPaquete() {
  let user = sessionStorage.getItem("user")?.trim() || "";
  user = user.replace(/^["'](.*)["']$/, "$1");

  if (user === "JOSENAVA") {
    Swal.fire({
      icon: "info",
      title: "Permisos",
      text: "permiso consedido",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6e7881",
    });
  } else {
    Swal.fire({
      icon: "info",
      title: "Ñagare",
      text: "permiso  no consedido",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6e7881",
    });
  }
}
async function imprimirPaqueteReporte(respuesta) {
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario").value;
  // document.getElementById('hUsuario').value;
  let pTipoConsulta = "l";
  let pPaquete = respuesta;

  const params =
    "?pSistema=" +
    pSistema +
    "&pUsuario=" +
    pUsuario +
    "&pTipoConsulta=" +
    pTipoConsulta +
    "&pPaquete=" +
    pPaquete;

  // console.log("Params:\n" + params);

  // const response = await fetch(env.API_URL + "imprimepaquete" + params, myInit);
  // const result = await response.json();
  fetch(env.API_URL + "imprimepaquete" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.respuesta.length > 0) {
        // console.log("REPORTE CREACION DE PAQUETE", result.respuesta);

        // Crear PDF (p = portrait / vertical)
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("P", "pt", "a4");
        // const doc = new jsPDF("landscape", "pt", "a4");

        // Encabezado
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(
          "CREACIÓN DE PAQUETES",
          doc.internal.pageSize.getWidth() / 2,
          40,
          { align: "center" }
        );

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(
          "PAQUETE: " + pPaquete,
          doc.internal.pageSize.getWidth() / 2,
          60,
          { align: "center" }
        );

        doc.setFontSize(12);
        doc.text(
          "Camión: " + (result.respuesta[0].REFERENCIA || "N/A"),
          40,
          90
        );

        // Definir columnas (encabezados)
        const columnas = [
          "ARTÍCULO",
          "CÓDIGO\nBARRAS",
          "CANT\nSOLI",
          "CANT\nPREP.",
          "CANT\nVERIF.",
          "CONSECUTIVO\nCONTENEDOR",
          "FECHA\nCREACIÓN",
        ];

        // Mapear los datos a filas
        const filas = result.respuesta.map((item) => [
          `${item.articulo}\n${item.descripcion}`,
          item.Codigo_Barra,
          item.LineaConsecutivo,
          item.LineaAprobada,
          item.LineaVerificada,
          item.Contenedor,
          item.Fecha_Aplicacion,
        ]);

        // Generar tabla debajo del encabezado
        doc.autoTable({
          head: [columnas],
          body: filas,
          startY: 140,
          styles: { fontSize: 8, cellWidth: "wrap" },
          headStyles: { fillColor: [40, 167, 69] },
          tableWidth: "auto",
          columnStyles: { 0: { cellWidth: 120 } },
        });

        // console.log("Se generó el pdf");

        // Descargar PDF
        doc.save("Reporte_Paquete_" + pPaquete + ".pdf");
      } else {
        // console.log("El API no devolvió nada");
      }
    });
}

// Función para devolver un artículo eliminado del Contenedor
function autorizaDevolucion(articulo, contenedor, cantidadPreparada) {
  Swal.fire({
    title: "Ingrese sus credenciales",
    html:
      '<input id="swal-input1" class="swal2-input" placeholder="Usuario" autocomplete="off">' +
      '<input id="swal-input2" class="swal2-input" placeholder="Contraseña" type="password" autocomplete="off">',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Aprobar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
    preConfirm: () => {
      const usuario = document
        .getElementById("swal-input1")
        .value.toUpperCase();
      const contraseña = document.getElementById("swal-input2").value;
      return { usuario: usuario, contraseña: contraseña };
    },
  }).then((result) => {
    if (
      !result.isDismissed &&
      result.value &&
      result.value.usuario &&
      result.value.contraseña
    ) {
      fetch(env.API_URL + "wmsautorizacioncontenedor")
        .then((response) => response.json())
        .then((resultado) => {
          //// console.log('Autorizacion Resultado: ');
          //// console.log(resultado.respuesta);
          const respuesta = resultado.respuesta[0];
          if (
            respuesta &&
            respuesta.USUARIO === result.value.usuario &&
            respuesta.PIN === result.value.contraseña
          ) {
            //// console.log("Credenciales válidas");
            //// console.log(respuesta.USUARIO);
            localStorage.setItem("UsuarioAutorizacion", respuesta.USUARIO);
            // Realiza la acción deseada, como procesar el contenedor
            devolverArticulo(articulo, contenedor, cantidadPreparada);
          } else {
            //// console.log("Credenciales inválidas");
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Credenciales inválidas",
            });
          }
        })
        .catch((error) => {
          // console.error('Error al obtener los datos del API:', error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error,
          });
        });
    } else {
      // console.error('Error: No se pudieron obtener los valores de usuario y contraseña del Swal');
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron obtener los valores de usuario y contraseña del Swal",
      });
    }
  });
}

function devolverArticulo(articulo, contenedor, cantidadPreparada) {
  const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  // console.log("📦 DataArray:", dataArray);

  // Buscar si el artículo existe dentro del arreglo
  const encontrado = dataArray.find(
    (item) =>
      item.ARTICULO.trim().toUpperCase() === articulo.trim().toUpperCase()
  );

  // Si no se encuentra, mostramos advertencia y detenemos la ejecución
  if (!encontrado) {
    Swal.fire({
      title: "Artículo no encontrado",
      text: `El artículo ${articulo} no tiene registros de lectura.`,
      icon: "warning",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#6e7881",
    });
    return;
  }

  // Obtener la cantidad leída
  const cantidadLeida = parseFloat(encontrado.CANTIDAD_LEIDA) || 0;
  const cantidadPreparadaNum = parseFloat(cantidadPreparada) || 0;
  const diferencia = cantidadPreparadaNum - cantidadLeida;

  // Mostrar confirmación
  Swal.fire({
    title: "Devolver Artículo",
    html: `
      <p>¿Estás seguro de devolver el artículo <b>${articulo}</b>?</p>
      <p>Contenedor: <b>${contenedor}</b></p>
      <p>Cantidad preparada: <b>${cantidadPreparadaNum.toFixed(2)}</b></p>
      <p>Cantidad leída: <b>${cantidadLeida.toFixed(2)}</b></p>
      <hr>
      <p><b>Diferencia a devolver:</b> ${diferencia.toFixed(2)}</p>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, devolver",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
  }).then((result) => {
    if (result.isConfirmed) {
      //// console.log(`✅ Artículo: ${articulo}`);
      //// console.log(`📦 Contenedor: ${contenedor}`);
      //// console.log(`🔢 Cantidad preparada: ${cantidadPreparadaNum}`);
      //// console.log(`📉 Cantidad leída: ${cantidadLeida}`);
      //// console.log(`🔁 Diferencia devuelta: ${diferencia}`);

      let pSistema = "WMS";
      let pUsuario = document.getElementById("hUsuario").value;
      let pOpcion = "c";
      let pBodegaEnvia = document.getElementById("bodega").value;
      let pBodegaDestino = document.getElementById("bodegaSelectOC").value;
      let pConsecutivo = $("#pContenedor").val();
      let pEstado = "";
      let pFechaDesde = $("#fecha_ini").val();
      let pArticulo = articulo;

      const params =
        "?pSistema=" +
        pSistema +
        "&pUsuario=" +
        pUsuario +
        "&pOpcion=" +
        pOpcion +
        "&pBodegaEnvia=" +
        pBodegaEnvia +
        "&pBodegaDestino=" +
        pBodegaDestino +
        "&pContenedor=" +
        pConsecutivo +
        "&pEstado=" +
        pEstado +
        "&pFechaDesde=" +
        pFechaDesde +
        "&pArticulo=" +
        pArticulo;
      // console.log("BUSQUEDA CONTENEDOR PARAMETROS\n " + params);
      localStorage.setItem("parametrosBusquedaContenedor", params);
      fetch(env.API_URL + "verificadordecontenedores" + params, myInit)
        .then((response) => response.json())
        .then((result) => {
          if (result.msg === "SUCCESS") {
            detalleLineasContenedoreses = result.respuesta;
            if (result.respuesta.length != 0) {
              // console.log('REsultados:');
              // console.log(detalleLineasContenedoreses);
              mostrarTablaEnSwal(detalleLineasContenedoreses);
            } else {
              Swal.fire({
                icon: "info",
                title: "Información",
                text: "Ocurrio un error al cargar las lineas para devolución",
                confirmButtonColor: "#28a745",
              });
            }
            document.getElementById("carga").innerHTML = "";
          } else {
            Swal.fire({
              icon: "error",
              title: "error",
              text: "Se registro un error en la llamada al API",
              confirmButtonColor: "#28a745",
            });
          }
        });
    }
  });
}

async function mostrarTablaEnSwal(data) {
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario").value;
  let pOpcion = "D";
  let BodegaEnvia = document.getElementById("bodega").value;
  let BodegaSolic = localStorage.getItem("bodega_solicita");
  let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || "";

  const articulo = data[0]?.Articulo || "Sin Artículo";

  // Generar filas de la tabla
  const tableRows = data
    .map(
      (item, index) => `
      <tr>
        <td><h5>${item.Contenedor || ""}</h5><h6>${
        item.Traslado || ""
      }</h6></td>
        <td>${Number(item.Cant_Verificada || 0).toFixed(2)}</td>
        <td><input type="number" min="0" class="devolver-input" data-index="${index}" placeholder="0" style="width: 80px;"></td>
      </tr>
    `
    )
    .join("");

  const htmlContent = `
    <table class="highlight centered" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th>Contenedor</th>
          <th>Cant. Preparada</th>
          <th>Cant. a Devolver</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;

  const { value: cantidades } = await Swal.fire({
    title: `Líneas para devolución - Artículo: ${articulo}`,
    html: htmlContent,
    icon: "info",
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#28a745",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const inputs = document.querySelectorAll(".devolver-input");
      const cantidades = Array.from(inputs).map((input) => {
        const index = parseInt(input.getAttribute("data-index"));
        const cantLeida = parseFloat(input.value) || 0;
        const cantPreparada = Number(data[index].Cant_Verificada || 0);

        // Validar que CANT_LEIDA no exceda CANT_PREPARADA
        if (cantLeida > cantPreparada) {
          throw new Error(MESSAGES.ERROR_EXCEEDS(data[index].Contenedor));
        }

        return {
          index,
          CONTENEDOR: data[index].Contenedor,
          SOLICITUD: data[index].Traslado,
          ARTICULO: articulo,
          CANT_PREPARADA: cantPreparada,
          CANT_LEIDA: cantLeida,
        };
      });

      // Filtrar solo las filas con CANT_LEIDA > 0
      return cantidades.filter((c) => c.CANT_LEIDA > 0);
    },
  });

  if (cantidades) {
    const jsonDetalles = JSON.stringify(
      cantidades.map(
        ({ CONTENEDOR, SOLICITUD, ARTICULO, CANT_PREPARADA, CANT_LEIDA }) => ({
          CONTENEDOR,
          SOLICITUD,
          ARTICULO,
          CANT_PREPARADA,
          CANT_LEIDA,
        })
      )
    );

    const params =
      "?pSistema=" +
      pSistema +
      "&pUsuario=" +
      pUsuario +
      "&pOpcion=" +
      pOpcion +
      "&BodegaSolic=" +
      BodegaSolic +
      "&BodegaEnvia=" +
      BodegaEnvia +
      "&pUsuarioAutorizacion=" +
      pUsuarioAutorizacion +
      "&jsonDetalles=" +
      jsonDetalles;
    // Enviar al backend
    try {
      await enviarCantidadesDevolucion(params);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: MESSAGES.ERROR_API,
        confirmButtonColor: "#28a745",
      });
    }
  }
}

// Ejemplo de función para enviar cantidades al backend (implementar según API)
async function enviarCantidadesDevolucion(parametros) {
  fetch(env.API_URL + "devolverarticulocontenedor" + parametros, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log("Respuesta del SP");
      console.log(result.respuesta);
      // console.log(result.respuesta[0].Respuesta);

      console.log("Respuesta Contenedor");
      console.log(result);

      if (result.msg === "SUCCESS") {
        if (result.respuesta.length != 0) {
          // Resto del código de éxito
          Swal.fire({
            icon: "success",
            title: "Articulo devuelto correctamente",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#6e7881",
          }).then((result) => {
            if (result.isConfirmed) {
              actualizaTablaVerificacion();
              // const parametrosBusqueda = localStorage.getItem( "parametrosBusquedaPaquete");
              // if (parametrosBusqueda) {
              //         const params = new URLSearchParams(parametrosBusqueda);
              //         const pSistema = params.get("pSistema") ?? "";
              //         const pUsuario = params.get("pUsuario") ?? "";
              //         const pOpcion = params.get("pOpcion") ?? "";
              //         const pBodegaEnvia = params.get("pBodegaEnvia") ?? "";
              //         const pContenedor = params.get("pContenedor") ?? "";
              //         const pEstado =""
              //         const pFechaDesde = params.get("pFechaDesde") ?? "";
              //         const pArticulo = pArticulo = ""

              //         const paramset =
              //                     "?pSistema="+
              //                         pSistema+
              //                         "&pUsuario="+
              //                         pUsuario+
              //                         "&pOpcion="+
              //                         pOpcion+
              //                         "&pBodegaEnvia=" +
              //                         pBodegaEnvia+
              //                         "&pContenedor=" +
              //                         pContenedor+
              //                         "&pEstado="+
              //                         pEstado+
              //                         "&pFechaDesde=" +
              //                         pFechaDesde+
              //                         "&pArticulo="+
              //                         pArticulo
              //                         ;
              //         enviarDatosControlador(paramset);
              //       }
            }
          });
        }
      } else {
      }
    });
}

function actualizaTablaVerificacion() {
  const parametrosBusqueda = localStorage.getItem("parametrosBusquedaPaquete");
  if (parametrosBusqueda) {
    const params = new URLSearchParams(parametrosBusqueda);
    const pSistema = params.get("pSistema") ?? "";
    const pUsuario = params.get("pUsuario") ?? "";
    const pOpcion = params.get("pOpcion") ?? "";
    const pBodegaEnvia = params.get("pBodegaEnvia") ?? "";
    const pBodegaSolicita = params.get("pBodegaDestino");
    const pConsecutivo = params.get("pContenedor") ?? "";
    const pEstado = "";
    const pFechaDesde = params.get("pFechaDesde") ?? "";
    const pArticulo = "";

    const paramset =
      "?pSistema=" +
      pSistema +
      "&pUsuario=" +
      pUsuario +
      "&pOpcion=" +
      pOpcion +
      "&pBodegaEnvia=" +
      pBodegaEnvia +
      "&pBodegaDestino=" +
      pBodegaSolicita +
      "&pContenedor=" +
      pConsecutivo +
      "&pEstado=" +
      pEstado +
      "&pFechaDesde=" +
      pFechaDesde +
      "&pArticulo=" +
      pArticulo;
    console.log("" + parametrosBusqueda);
    console.log("PARAMSET" + paramset);
    enviarDatosControlador(paramset);
  }
}

// function prueba(){
//  armarTablaLectura(dataContenedores);
//  guardarTablaEnArray();
//  armarTablaVerificacion(dataContenedores);

// }

// FUNCION PARA CREAR EL PAQUETE
// procesar quemado para priuebas
// function CrearPaqueteContenedores() {
//         let result = "TRAS81-0000031086";
//        if (result.toUpperCase().startsWith("TRAS")) {
//                // console.log("Respuesta del API:\n" + result);
//                 Swal.fire({
//                             icon: "success",
//                             title: "Se creó el paquete N° " + result+ " con éxito",
//                             showDenyButton: true,                // <- activamos botón extra
//                             confirmButtonText: "Aceptar",
//                             denyButtonText: "Imprimir",
//                             confirmButtonColor: "#28a745",       // verde aceptar
//                             denyButtonColor: "#007bff",          // azul imprimir
//                             cancelButtonColor: "#6e7881",
//                         }).then((resultSwal) => {
//                             if (resultSwal.isConfirmed) {
//                             //   location.reload();               // recarga página
//                             } else if (resultSwal.isDenied) {
//                                 imprimirPaqueteReporte(result);        // llama tu función
//                                 limpiarResultadoGeneral();
//                                // location.reload();
//                             }
//                         });
//                 }
// }

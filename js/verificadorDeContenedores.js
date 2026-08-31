/**
 * @description //Variable global que contiene el detalle 
 * o las lineas del los contenedores aprobados 
 */
var detalleLineasContenedoreses = [];
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
/**
 * DOM: 
 * @description función que carga el Document Object Model
 */
document.addEventListener("DOMContentLoaded", function () {
    const obs = localStorage.getItem('Observaciones');
    const observacionesElemento = document.getElementById('observaciones');

    // Validación defensiva: Solo actuar si el elemento existe
    if (observacionesElemento) {
        observacionesElemento.value = obs ? obs : "";
    } else {
        console.warn("No se encontró el elemento con ID 'Observaciones'");
    }
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems);
    cargarSelectPlacas();
    cargarSelectConductores();
    cargarBodegas();
});
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/**
 * @function validarBusquedaContenedor
 * @description verifica y valida los parametros y realizar la peticion al 
 * Api para obtener las lineas de los contenedores aprobados. 
 */
function validarBusquedaContenedor() {
  let bodega = document.getElementById("bodega").value;
  let pBodegaSolicita = document.getElementById("bodegaSelect").value;
  //let pPlaca = document.getElementById("placa-camion").value;

  // if (pPlaca === "" || pBodegaSolicita == "") {
    if (pBodegaSolicita == "") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Faltan parámetros para cargar los datos.\nVerifique que se hayan llenado correctamente los campos de la bodega de destino y la placa del camión.",      
    });
  } else {
    mostrarLoader();
    let pSistema = "WMS";
    let pUsuario = document.getElementById("hUsuario").value;
    let pOpcion = "";
    let chkporContenedor = document.getElementById('chk-mostrar-contenedor');
        if(chkporContenedor.checked==true){
                console.log('se muestra por contenedor');
                 pOpcion = "B";
        }
        else{
              console.log('se muestra por referencia');
                pOpcion = "D";
        }   
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

  fetch(env.API_URL + "verificadordecontenedores" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        console.log(result.respuesta);
        ocultarLoader();
        detalleLineasContenedoreses = result.respuesta;
       
        if (result.respuesta && result.respuesta.length > 0) {
          // --- NUEVA VALIDACIÓN: HABILITAR BOTONES ---
          alternarEstadoBotonesAccion(true);
          // ------------------------------------------

          armarTablaLectura(detalleLineasContenedoreses);
          guardarTablaEnArray();
          armarTablaVerificacion(detalleLineasContenedoreses);
          mostrarPestanaLectura();
          
          Swal.fire({
            icon: "info",
            title: "Información",
            text: "Registros cargados en la pestaña Verificación",
            confirmButtonColor: "#28a745",
          });
        } else {
          ocultarLoader();
          
          // --- NUEVA VALIDACIÓN: DESHABILITAR EN CASO DE ESTAR VACÍO ---
          alternarEstadoBotonesAccion(false);
          // -------------------------------------------------------------

          limpiarResultadoGeneral();
          limpiarTblLectura();
          mostrarPestanaLectura();
          Swal.fire({
            icon: "info",
            title: "Información",
            text: "No hay registros asignados para el usuario",
            confirmButtonColor: "#28a745",
          });
        }
        document.getElementById("carga").innerHTML = "";
      } else {
        // Deshabilitar por seguridad si el API arroja error de servidor
        alternarEstadoBotonesAccion(false);

        Swal.fire({
          icon: "error",
          title: "error",
          text: "Se registró un error en la aplicación",
          confirmButtonColor: "#28a745",
        });
      }
    });
  ocultarLoader();
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
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function limpiarTblLectura() {
  const tabla = document.getElementById("myTableLectura");

  // Limpiar el contenido del tbody de la tabla si la tabla existe
  if (tabla) {
    let tbody = tabla.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = "";
    }
  }
  crearNuevaFila();
}
// Función para cargar las bodegas
function cargarBodegas() {
  fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra")
    .then((response) => response.json())
    .then((data) => {
      const bodegasSelect = document.getElementById("bodegaSelect");
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
  actualizarProgresoLectura();
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
   
        cells.forEach(function (cell) {
        if (cell.value.trim() !== "") {
          isEmptyRow = false;
        }
      });

      // Elimina la fila solo si no está vacía
      if (isEmptyRow) {
        // Llamar función que guarda artículos en la tabla
       // var dataFromTable = guardarTablaEnArray();

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
//////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * @function calcularTotalUnidadesApreparar
 * @description Suma los valores de la columna 'Cant. Prep.' (Índice 3) en la tabla de Verificación.
 * @returns {number} El total de unidades (productos) que deben ser leídas.
 */
function calcularTotalUnidadesApreparar() {
    const tbodyVerificacion = document.getElementById("tblbodyLineasContenedor");
    let totalUnidades = 0;

    if (tbodyVerificacion) {
        // La columna Cant. Prep. es la cuarta columna (índice 3) en el <tbody> 
        // de la tabla tblcontenedores (Conten[0], Artí.[1], Cant. Ped.[2], Cant. Prep.[3], ...)
        const indiceColumnaPreparada = 4; 

        tbodyVerificacion.querySelectorAll('tr').forEach(fila => {
            const celdas = fila.querySelectorAll('td');
            
            if (celdas[indiceColumnaPreparada]) {
                const valor = celdas[indiceColumnaPreparada].textContent.trim();
                // Usamos parseFloat y tratamos NaN como 0
                totalUnidades += parseFloat(valor) || 0;
            }
        });
    }
    return totalUnidades;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * @function calcularTotalUnidadesLeidas
 * @description Suma los valores de la columna de cantidad (Índice 2) en la tabla de Lectura.
 * @returns {number} El total de unidades (productos) registradas como leídas.
 */
function calcularTotalUnidadesLeidas() {
    const tbodyLectura = document.getElementById("tblbodyLectura");
    let totalLeido = 0;

    if (tbodyLectura) {
        // La columna de Cantidad en la tabla de Lectura es la tercera columna (índice 2)
        // (Articulo[0], Cod[1], Cant[2], CL[3])
        const indiceColumnaCantidad = 2; 

        tbodyLectura.querySelectorAll('tr').forEach(fila => {
            const celdas = fila.querySelectorAll('td');

            if (celdas[indiceColumnaCantidad]) {
                // En la pestaña Lectura, la cantidad está dentro de un <input>
                const input = celdas[indiceColumnaCantidad].querySelector('input');
                
                let valor = input ? input.value : celdas[indiceColumnaCantidad].textContent.trim();

                // Usamos parseFloat y tratamos NaN como 0
                totalLeido += parseFloat(valor) || 0;
            }
        });
    }
    return totalLeido;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * @function actualizarProgresoLectura
 * @description Muestra el resumen de unidades leídas vs. total de unidades a leer.
 */
function actualizarProgresoLectura() {
    // 1. Obtener los totales de unidades
    const totalUnidadesApreparar = calcularTotalUnidadesApreparar();
    const totalUnidadesLeidas = calcularTotalUnidadesLeidas();
    
    // 2. Obtener el Label
    const labelProgreso = document.getElementById("progresoLecturaLabel");

    if (labelProgreso) {
        labelProgreso.textContent = `Leído: ${totalUnidadesLeidas.toFixed(0)} / ${totalUnidadesApreparar.toFixed(0)}`;

        // Opcional: Estilo basado en el progreso
        if (totalUnidadesLeidas > 0 && totalUnidadesLeidas >= totalUnidadesApreparar) {
             labelProgreso.style.color = "green";
        } else {
             labelProgreso.style.color = "initial"; // o el color por defecto
        }
    } else {
        console.warn("Elemento 'progresoLecturaLabel' no encontrado. Asegúrate de agregarlo al HTML.");
    }
}

///FUNCION QUE ARMA LA TABLA DE LA PESTAÑA VERIFICACION

/**
 * @function armarTablaVerificacion
 * @description Arma la tabla de la pestaña Verificación, primero ordenando las líneas por Contenedor.
 * @param {Array<Object>} detalleLineasContenedores - Array de objetos con el detalle de las líneas.
 */
function armarTablaVerificacion(detalleLineasContenedores) {
    const tbody = document.getElementById("tblbodyLineasContenedor");
    tbody.innerHTML = "";

    // Verificar si el checkbox 'Por Contenedor' está marcado
    const chkMostrarContenedor = document.getElementById("chk-mostrar-contenedor");
    const esModoContenedor = chkMostrarContenedor ? chkMostrarContenedor.checked : false;

    // ====================================================================
    // 0. FILTRADO CONDICIONAL: 
    // Si NO está en modo contenedor, filtramos las líneas con Estado_ml === "N"
    // ====================================================================
    const lineasAProcesar = esModoContenedor
        ? detalleLineasContenedores
        : detalleLineasContenedores.filter((detalle) => detalle.Estado_ml !== "");

    // ====================================================================
    // 1. ORDENAMIENTO POR CONTENEDOR
    // ====================================================================
    lineasAProcesar.sort((a, b) => {
        const contenedorA = a.Contenedor || "";
        const contenedorB = b.Contenedor || "";

        if (contenedorA < contenedorB) return -1;
        if (contenedorA > contenedorB) return 1;
        return 0;
    });

    // Actualizar el contador según las líneas actualmente visibles
    const cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
    if (cantidadDeRegistrosLabel) {
        cantidadDeRegistrosLabel.textContent =
            "Cantidad de registros: " + lineasAProcesar.length;
    }

    // ====================================================================
    // 2. RENDERIZADO DE LA TABLA
    // ====================================================================
    lineasAProcesar.forEach((detalle) => {
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
                    title="Devolver artículo"
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


        // newRow.innerHTML = `
        //     <td class="solicitud" hidden>${detalle.Traslado}</td>
        //     <td class="contenedor" style="text-align: left;">
        //         <h5>${detalle.Contenedor}</h5>
        //         <h6>${detalle.Traslado}</h6>
        //     </td>
        //     <td class="articulo">
        //         <h5 class="verifica-articulo">
        //             <span class="blue-text text-darken-2">${detalle.Articulo}</span>
        //         </h5>
        //         <h6 style="text-align:left;">${detalle.Descripcion}</h6>
        //     </td>
        //     <td class="cantidadPedida" style="text-align: left;">
        //         ${
        //             isNaN(parseFloat(detalle.Cant_Pedida))
        //                 ? 0
        //                 : parseFloat(detalle.Cant_Pedida).toFixed(2)
        //         }
        //     </td>
        //     <td class="cantidadPreparada" style="text-align: left;">
        //         ${
        //             isNaN(parseFloat(detalle.Cant_Verificada))
        //                 ? 0
        //                 : parseFloat(detalle.Cant_Verificada).toFixed(2)
        //         }
        //     </td>
        //     <td class="cantidadLeida" style="text-align: left;"></td>
        //     <td class="verificado" style="text-align: left;"></td>
        //     <td class="devolver" style="text-align: left;">
        //         <i class="material-icons"
        //             style="color: #FF0000; cursor: pointer;"
        //             onclick="autorizaDevolucion('${detalle.Articulo}', '${
        //                 detalle.Contenedor
        //             }','${
        //                 isNaN(parseFloat(detalle.Cant_Verificada))
        //                     ? 0
        //                     : parseFloat(detalle.Cant_Verificada).toFixed(2)
        //             }')">reply</i>
        //     </td>
        //     `;
        tbody.appendChild(newRow);
    });
}

// function armarTablaVerificacion(detalleLineasContenedores) {
//     const tbody = document.getElementById("tblbodyLineasContenedor");
//     tbody.innerHTML = "";

//     // ====================================================================
//     // 1. ORDENAMIENTO POR CONTENEDOR (Optimización de Datos)
//     // ====================================================================
//     detalleLineasContenedores.sort((a, b) => {
//         const contenedorA = a.Contenedor;
//         const contenedorB = b.Contenedor;

//         // Compara las cadenas de texto (alfabético/lexicográfico)
//         // Puedes cambiar a contenedorB.localeCompare(contenedorA) para ordenar Descendente.
//         if (contenedorA < contenedorB) {
//             return -1;
//         }
//         if (contenedorA > contenedorB) {
//             return 1;
//         }
//         return 0; // Los contenedores son iguales
//     });
//     // ====================================================================

//     const cantidadDeRegistrosLabel = document.getElementById(
//         "cantidadDeRegistros"
//     );
//     cantidadDeRegistrosLabel.textContent =
//         "Cantidad de registros: " + detalleLineasContenedores.length;

//     // 2. Renderizado de la Tabla (Ya ordenada)
//     detalleLineasContenedores.forEach((detalle) => {
//         const newRow = document.createElement("tr");
//         newRow.innerHTML = `
//             <td class="solicitud" hidden>${detalle.Traslado}</td>
//             <td class="contenedor" style="text-align: left;">
//                 <h5>${detalle.Contenedor}</h5>
//                 <h6>${detalle.Traslado}</h6>
//             </td>
//             <td class="articulo">
//                 <h5 class="verifica-articulo">
//                     <span class="blue-text text-darken-2">${detalle.Articulo}</span>
//                 </h5>
//                 <h6 style="text-align:left;">${detalle.Descripcion}</h6>
//             </td>
//             <td class="cantidadPedida" style="text-align: left;">
//                 ${
//                     isNaN(parseFloat(detalle.Cant_Pedida))
//                         ? 0
//                         : parseFloat(detalle.Cant_Pedida).toFixed(2)
//                 }
//             </td>
//             <td class="cantidadPreparada" style="text-align: left;">
//                 ${
//                     isNaN(parseFloat(detalle.Cant_Verificada))
//                         ? 0
//                         : parseFloat(detalle.Cant_Verificada).toFixed(2)
//                 }
//             </td>
//             <td class="cantidadLeida" style="text-align: left;"></td>
//             <td class="verificado" style="text-align: left;"></td>
//             <td class="devolver" style="text-align: left;">
//                 <i class="material-icons"
//                     style="color: #FF0000; cursor: pointer;"
//                     onclick="autorizaDevolucion('${detalle.Articulo}', '${
//                         detalle.Contenedor
//                     }','${
//                         isNaN(parseFloat(detalle.Cant_Verificada))
//                             ? 0
//                             : parseFloat(detalle.Cant_Verificada).toFixed(2)
//                     }')">reply</i>
//             </td>
//             `;
//         tbody.appendChild(newRow);
//     });

//     // Opcional: Si el ordenamiento altera los totales, se debe recalcular aquí:
//     // calcularTotalesVerificacion(); 
// }
/**
 * @function verificacion
 * @description VERIFICA LA CANTIDAD LEIDA EN LA
 * PESTAÑA LECTURA, CONTRA LO QUE SE INDICA EN LA TABLA DE LA PESTAÑA VERIFICACION
 * @param {Array<Object>} detalleLineasContenedores - Array de objetos con el detalle de las líneas.
 */

// VERIFICA LA CANTIDAD LEIDA EN LA PESTAÑA LECTURA, CONTRA LO QUE SE INDICA EN LA TABLA DE LA PESTAÑA VERIFICACION
function verificacion() {
  const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
  console.log("DataArray", dataArray);

  const tabla = document.getElementById("tblcontenedores");
  if (!tabla)
    return console.warn("⚠️ No se encontró la tabla de verificación.");

  const filas = Array.from(tabla.querySelectorAll("tbody tr"));
  const mensajesArray = [];

  // 1. Limpiar celdas previas
  filas.forEach((fila) => {
    const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
    const verifcheck = fila.querySelector(".verificado");
    if (cantidadLeidaCell) cantidadLeidaCell.textContent = "";
    if (verifcheck) verifcheck.textContent = "";
  });

  // 2. Consolidar totales leídos por artículo desde la pestaña Lectura
  const cantidadesTotalesLectura = {};
  dataArray.forEach((item) => {
    const art = item.ARTICULO ? item.ARTICULO.trim() : "";
    const cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
    if (art) {
      cantidadesTotalesLectura[art] = (cantidadesTotalesLectura[art] || 0) + cant;
    }
  });

  // 3. Validar el estado del checkbox
  const chkPorContenedor = document.getElementById("chk-mostrar-contenedor");
  const esPorContenedor = chkPorContenedor ? chkPorContenedor.checked : false;

  if (esPorContenedor) {
    // =========================================================================
    // MODO B: MOSTRAR POR CONTENEDOR (Con distribución de excesos)
    // =========================================================================
    
    // Objeto para llevar el saldo restante a distribuir por artículo
    const saldosDisponibles = { ...cantidadesTotalesLectura };

    // Mapeamos las filas que pertenecen a cada artículo para saber cuál es la última
    const filasPorArticulo = {};
    filas.forEach((fila) => {
      const articuloCell = fila.querySelector(".verifica-articulo span");
      if (articuloCell) {
        const art = articuloCell.textContent.trim();
        if (!filasPorArticulo[art]) filasPorArticulo[art] = [];
        filasPorArticulo[art].push(fila);
      }
    });

    // Procesar cada artículo y sus contenedores
    Object.keys(filasPorArticulo).forEach((articulo) => {
      const listaFilas = filasPorArticulo[articulo];
      const totalFilas = listaFilas.length;

      listaFilas.forEach((fila, index) => {
        const cantPreparadaCell = fila.querySelector(".cantidadPreparada");
        const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
        const verificadoCell = fila.querySelector(".verificado");

        const cantPedida = parseFloat(cantPreparadaCell.textContent) || 0;
        let saldoDisponible = saldosDisponibles[articulo] || 0;
        let cantLeidaAsignada = 0;

        const esUltimoContenedor = index === totalFilas - 1;

        if (esUltimoContenedor) {
          // El último contenedor absorbe todo el saldo restante (sea menor, igual o EXCESO)
          cantLeidaAsignada = saldoDisponible;
          saldosDisponibles[articulo] = 0;
        } else {
          // Contenedores intermedios: toman hasta completar su pedido
          if (saldoDisponible >= cantPedida) {
            cantLeidaAsignada = cantPedida;
            saldosDisponibles[articulo] -= cantPedida;
          } else {
            cantLeidaAsignada = saldoDisponible;
            saldosDisponibles[articulo] = 0;
          }
        }

        // Mostrar en UI
        if (cantidadLeidaCell) {
          cantidadLeidaCell.textContent = cantLeidaAsignada > 0 ? cantLeidaAsignada : null;
        }

        // Evaluar estado de la fila
        if (cantLeidaAsignada === cantPedida && cantLeidaAsignada > 0) {
          if (verificadoCell) {
            const icon = document.createElement("span");
            icon.classList.add("material-icons");
            icon.textContent = "done_all";
            icon.style.color = "green";
            verificadoCell.appendChild(icon);
          }
        } else if (cantLeidaAsignada > cantPedida) {
          const diff = (cantLeidaAsignada - cantPedida).toFixed(2);
          if (verificadoCell) verificadoCell.textContent = `+${diff}`;
          mensajesArray.push(
            `*La cantidad del artículo ${articulo} excede en +${diff} en su contenedor.`
          );
        } else if (cantLeidaAsignada < cantPedida && cantLeidaAsignada > 0) {
          const diff = (cantLeidaAsignada - cantPedida).toFixed(2);
          if (verificadoCell) verificadoCell.textContent = diff;
          mensajesArray.push(
            `>La cantidad verificada del artículo ${articulo} es menor a la solicitada.`
          );
        }
      });
    });

  } else {
    // =========================================================================
    // MODO A: MOSTRAR POR REFERENCIA (Suma global por fila)
    // =========================================================================
    filas.forEach((fila) => {
      const articuloCell = fila.querySelector(".verifica-articulo span");
      const cantPreparadaCell = fila.querySelector(".cantidadPreparada");
      const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
      const verificadoCell = fila.querySelector(".verificado");

      if (!articuloCell || !cantPreparadaCell) return;

      const articulo = articuloCell.textContent.trim();
      const cantPedida = parseFloat(cantPreparadaCell.textContent) || 0;

      const cantLeida = cantidadesTotalesLectura.hasOwnProperty(articulo)
        ? cantidadesTotalesLectura[articulo]
        : null;

      if (cantidadLeidaCell) cantidadLeidaCell.textContent = cantLeida;

      // Comparar cantidades globales
      if (cantLeida === cantPedida && cantLeida > 0) {
        if (verificadoCell) {
          const icon = document.createElement("span");
          icon.classList.add("material-icons");
          icon.textContent = "done_all";
          icon.style.color = "green";
          verificadoCell.appendChild(icon);
        }
      } else if (cantLeida > cantPedida) {
        const diff = (cantLeida - cantPedida).toFixed(2);
        if (verificadoCell) verificadoCell.textContent = `+${diff}`;
        mensajesArray.push(
          `*La cantidad verificada del artículo ${articulo} es mayor a la solicitada.`
        );
      } else if (cantLeida < cantPedida && cantLeida > 0) {
        const diff = (cantLeida - cantPedida).toFixed(2);
        if (verificadoCell) verificadoCell.textContent = diff;
        mensajesArray.push(
          `>La cantidad verificada del artículo ${articulo} es menor a la solicitada.`
        );
      }
    });
  }

  // Recalcular totales y actualizar avisos
  calcularTotalesVerificacion();

  localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
  limpiarMensajes();

  const mensajeText = document.getElementById("mensajeText");
  if (mensajeText) mensajeText.value = mensajesArray.join("\n");
}

// // VERIFICA LA CANTIDAD LEIDA EN LA PESTAÑA LECTURA, CONTRA LO QUE SE INDICA EN LA TABLA DE LA PESTAÑA VERIFICACION
// function verificacion() {
//   const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
//   console.log("DataArray", dataArray);

//   const tabla = document.getElementById("tblcontenedores");
//   if (!tabla)
//     return console.warn("⚠️ No se encontró la tabla de verificación.");

//   const filas = tabla.querySelectorAll("tbody tr");
//   const mensajesArray = [];

//   // 1. Limpiar celdas previas
//   filas.forEach((fila) => {
//     const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
//     const verifcheck = fila.querySelector(".verificado");
//     if (cantidadLeidaCell) cantidadLeidaCell.textContent = "";
//     if (verifcheck) verifcheck.textContent = "";
//   });

//   // 2. Consolidar totales leídos por artículo desde la pestaña Lectura
//   const cantidadesTotalesLectura = {};
//   dataArray.forEach((item) => {
//     const art = item.ARTICULO ? item.ARTICULO.trim() : "";
//     const cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
//     if (art) {
//       cantidadesTotalesLectura[art] = (cantidadesTotalesLectura[art] || 0) + cant;
//     }
//   });

//   // 3. Validar el estado del checkbox
//   const chkPorContenedor = document.getElementById("chk-mostrar-contenedor");
//   const esPorContenedor = chkPorContenedor ? chkPorContenedor.checked : false;

//   if (esPorContenedor) {
//     // =========================================================================
//     // MODO B: MOSTRAR POR CONTENEDOR (Distribución Cascada / Casos Duplicados)
//     // =========================================================================
    
//     // Crear una copia de los saldos disponibles para ir restando a medida que cubrimos contenedores
//     const saldosDisponibles = { ...cantidadesTotalesLectura };

//     // Objeto para acumular el total asignado por artículo y detectar si hay exceso global
//     const asignacionTotalPorArticulo = {};

//     filas.forEach((fila) => {
//       const articuloCell = fila.querySelector(".verifica-articulo span");
//       const cantPreparadaCell = fila.querySelector(".cantidadPreparada");
//       const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
//       const verificadoCell = fila.querySelector(".verificado");

//       if (!articuloCell || !cantPreparadaCell) return;

//       const articulo = articuloCell.textContent.trim();
//       const cantPedida = parseFloat(cantPreparadaCell.textContent) || 0;

//       let saldoDisponible = saldosDisponibles[articulo] || 0;
//       let cantLeidaAsignada = 0;

//       if (saldoDisponible > 0) {
//         if (saldoDisponible >= cantPedida) {
//           cantLeidaAsignada = cantPedida;
//           saldosDisponibles[articulo] -= cantPedida;
//         } else {
//           cantLeidaAsignada = saldoDisponible;
//           saldosDisponibles[articulo] = 0;
//         }
//       }

//       // Acumular cuánto se le asignó a este artículo en total entre todos sus contenedores
//       asignacionTotalPorArticulo[articulo] = (asignacionTotalPorArticulo[articulo] || 0) + cantLeidaAsignada;

//       // Imprimir valor en la celda
//       if (cantidadLeidaCell) {
//         cantidadLeidaCell.textContent = cantLeidaAsignada > 0 ? cantLeidaAsignada : null;
//       }

//       // Evaluar estado por contenedor individual
//       if (cantLeidaAsignada === cantPedida && cantLeidaAsignada > 0) {
//         if (verificadoCell) {
//           const icon = document.createElement("span");
//           icon.classList.add("material-icons");
//           icon.textContent = "done_all";
//           icon.style.color = "green";
//           verificadoCell.appendChild(icon);
//         }
//       } else if (cantLeidaAsignada < cantPedida && cantLeidaAsignada > 0) {
//         const diff = (cantLeidaAsignada - cantPedida).toFixed(2);
//         if (verificadoCell) verificadoCell.textContent = diff;
//         mensajesArray.push(
//           `>La cantidad verificada del artículo ${articulo} es menor a la solicitada en su contenedor.`
//         );
//       }
//     });

//     // Detectar si hubo Sobrante/Exceso global que superó la suma de todos los contenedores
//     Object.keys(cantidadesTotalesLectura).forEach((articulo) => {
//       const totalLeido = cantidadesTotalesLectura[articulo] || 0;
//       const totalAsignado = asignacionTotalPorArticulo[articulo] || 0;

//       if (totalLeido > totalAsignado) {
//         const exceso = (totalLeido - totalAsignado).toFixed(2);
//         mensajesArray.push(
//           `*La cantidad verificada global del artículo ${articulo} excede en +${exceso} a la suma de sus contenedores.`
//         );
//       }
//     });

//   } else {
//     // =========================================================================
//     // MODO A: MOSTRAR POR REFERENCIA (Comportamiento por Defecto)
//     // =========================================================================
//     filas.forEach((fila) => {
//       const articuloCell = fila.querySelector(".verifica-articulo span");
//       const cantPreparadaCell = fila.querySelector(".cantidadPreparada");
//       const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
//       const verificadoCell = fila.querySelector(".verificado");

//       if (!articuloCell || !cantPreparadaCell) return;

//       const articulo = articuloCell.textContent.trim();
//       const cantPedida = parseFloat(cantPreparadaCell.textContent) || 0;

//       const cantLeida = cantidadesTotalesLectura.hasOwnProperty(articulo)
//         ? cantidadesTotalesLectura[articulo]
//         : null;

//       if (cantidadLeidaCell) cantidadLeidaCell.textContent = cantLeida;

//       // Comparar cantidades globales por fila
//       if (cantLeida === cantPedida && cantLeida > 0) {
//         if (verificadoCell) {
//           const icon = document.createElement("span");
//           icon.classList.add("material-icons");
//           icon.textContent = "done_all";
//           icon.style.color = "green";
//           verificadoCell.appendChild(icon);
//         }
//       } else if (cantLeida > cantPedida) {
//         const diff = (cantLeida - cantPedida).toFixed(2);
//         if (verificadoCell) verificadoCell.textContent = `+${diff}`;
//         mensajesArray.push(
//           `*La cantidad verificada del artículo ${articulo} es mayor a la solicitada.`
//         );
//       } else if (cantLeida < cantPedida && cantLeida > 0) {
//         const diff = (cantLeida - cantPedida).toFixed(2);
//         if (verificadoCell) verificadoCell.textContent = diff;
//         mensajesArray.push(
//           `>La cantidad verificada del artículo ${articulo} es menor a la solicitada.`
//         );
//       }
//     });
//   }

//   // Recalcular totales y actualizar los avisos en UI
//   calcularTotalesVerificacion();

//   localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
//   limpiarMensajes();

//   const mensajeText = document.getElementById("mensajeText");
//   if (mensajeText) mensajeText.value = mensajesArray.join("\n");
// }

// function verificacion() {
//   const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
//   console.log("DataArray", dataArray);

//   const tabla = document.getElementById("tblcontenedores");
//   if (!tabla)
//     return console.warn("⚠️ No se encontró la tabla de verificación.");

//   const filas = tabla.querySelectorAll("tbody tr");
//   const mensajesArray = [];

//   // Limpiar las celdas previas de cantidadLeida y verificado
//   filas.forEach((fila) => {
//     const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
//     const verifcheck = fila.querySelector(".verificado");
//     if (cantidadLeidaCell) cantidadLeidaCell.textContent = "";
//     if (verifcheck) verifcheck.textContent = "";
//   });

//   // Construir objeto de totales
//   const cantidadesTotales = {};

//   dataArray.forEach((item) => {
//     const art = item.ARTICULO.trim();
//     const cant = parseFloat(item.CANTIDAD_LEIDA) || 0;
//     cantidadesTotales[art] = (cantidadesTotales[art] || 0) + cant;
//   });

//   // console.log("Totales agrupados:", cantidadesTotales);

//   // Recorrer filas para verificar coincidencias
//   filas.forEach((fila) => {
//     const articuloCell = fila.querySelector(".verifica-articulo span");
//     const cantPreparadaCell = fila.querySelector(".cantidadPreparada");
//     const cantidadLeidaCell = fila.querySelector(".cantidadLeida");
//     const verificadoCell = fila.querySelector(".verificado");

//     if (!articuloCell || !cantPreparadaCell) return;

//     const articulo = articuloCell.textContent.trim();
//     const cantPedida = parseFloat(cantPreparadaCell.textContent) || 0;

//     const cantLeida = cantidadesTotales.hasOwnProperty(articulo)
//       ? cantidadesTotales[articulo]
//       : null;
//     // const cantLeida = cantidadesTotales[articulo] || 0;

//     // Mostrar cantidad leída
//     if (cantidadLeidaCell) cantidadLeidaCell.textContent = cantLeida;
//     // cantLeida.toFixed(2);

//     // Comparar cantidades
//     if (cantLeida === cantPedida && cantLeida > 0) {
//       // ✅ Coincidencia exacta
//       if (verificadoCell) {
//         const icon = document.createElement("span");
//         icon.classList.add("material-icons");
//         icon.textContent = "done_all";
//         icon.style.color = "green";
//         verificadoCell.appendChild(icon);
//       }
//     } else if (cantLeida > cantPedida) {
//       // ⚠️ Exceso
//       const diff = (cantLeida - cantPedida).toFixed(2);
//       if (verificadoCell) verificadoCell.textContent = `+${diff}`;
//       mensajesArray.push(
//         `*La cantidad verificada del artículo ${articulo} es mayor a la solicitada.`
//       );
//     } else if (cantLeida < cantPedida && cantLeida > 0) {
//       // ⚠️ Faltante
//       const diff = (cantLeida - cantPedida).toFixed(2);
//       if (verificadoCell) verificadoCell.textContent = diff;
//       mensajesArray.push(
//         `>La cantidad verificada del artículo ${articulo} es menor a la solicitada.`
//       );
//     }
//   });
//       calcularTotalesVerificacion();
//   // Guardar mensajes en localStorage y mostrarlos
//   localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
//   limpiarMensajes();

//   // Mostrar mensajes en el textarea
//   const mensajeText = document.getElementById("mensajeText");
//   if (mensajeText) mensajeText.value = mensajesArray.join("\n");

//   // console.log("Mensajes generados:", mensajesArray);
// } ////FIN de VERIFICACION

// //////////////////////////////////////////////////////////////////////////////////////////////////////////
//                               Función para inicializar los botones                                      //
// //////////////////////////////////////////////////////////////////////////////////////////////////////////


function inicializarBotones() {
  // Crear los botones y el contenedor
  const contenedorTblLectura = document.createElement("div");
  const contenedorBotones = document.createElement("div");
  const botonProcesar = document.createElement("button");
  const botonGuardarParcial = document.createElement("button");
  const botonGuardarLectura = document.createElement("button");

  // Configurar propiedades de los botones
  botonGuardarLectura.textContent = "Guardar";
  botonGuardarLectura.id = "btnGuardarLectura"; // ID único asignado
  botonGuardarLectura.hidden = false;
  botonGuardarLectura.disabled = true; // Deshabilitado por defecto al inicio
  botonGuardarLectura.onclick = confirmarGuardadoParcial;

  botonProcesar.textContent = "Crear Paquete";
  botonProcesar.id = "btnCrearPaqueteContenedor";
  botonProcesar.hidden = false; 
  botonProcesar.disabled = true; // Deshabilitado por defecto para evitar paquetes vacíos
  botonProcesar.onclick = guardaPaquete;

  botonGuardarParcial.textContent = "Guardar";
  botonGuardarParcial.id = "btnGuardarVerificacion"; // ID único asignado
  botonGuardarParcial.hidden = false;
  botonGuardarParcial.disabled = true; // Deshabilitado por defecto al inicio
  botonGuardarParcial.onclick = confirmarGuardadoParcial;

  // --- [Tus estilos se mantienen exactamente igual] ---
  botonGuardarLectura.style.backgroundColor = "#28a745";
  botonGuardarLectura.style.borderRadius = "5px";
  botonGuardarLectura.style.color = "white";
  botonGuardarLectura.style.marginTop = "16px";
  botonGuardarLectura.style.marginLeft = "16px";
  botonGuardarLectura.style.marginRight = "16px";
  botonGuardarLectura.style.height = "36px";
  botonGuardarLectura.style.width = "100px";

  botonGuardarParcial.style.backgroundColor = "#28a745";
  botonGuardarParcial.style.borderRadius = "5px";
  botonGuardarParcial.style.color = "white";
  botonGuardarParcial.style.marginTop = "16px";
  botonGuardarParcial.style.marginLeft = "16px";
  botonGuardarParcial.style.marginRight = "16px";
  botonGuardarParcial.style.height = "36px";
  botonGuardarParcial.style.width = "100px";

  botonProcesar.style.width = "100px";
  botonProcesar.style.backgroundColor = "#28a745";
  botonProcesar.style.borderRadius = "5px";
  botonProcesar.style.color = "white";
  botonProcesar.style.marginTop = "16px";
  botonProcesar.style.marginLeft = "6em";
  botonProcesar.style.height = "40px";
  botonProcesar.style.marginBottom = "25px";
 
  // Agregar botones al contenedor
  contenedorTblLectura.appendChild(botonGuardarLectura);
  contenedorBotones.appendChild(botonGuardarParcial);
  contenedorBotones.appendChild(botonProcesar);

  // Obtener tablas del DOM e insertar contenedores
  const tablaLectura = document.getElementById("myTableLectura");
  const tablaVerificacion = document.getElementById("tblcontenedores");

  if(tablaLectura) {
    tablaLectura.parentNode.insertBefore(contenedorTblLectura, tablaLectura.nextSibling);
  }
  if(tablaVerificacion) {
    tablaVerificacion.parentNode.insertBefore(contenedorBotones, tablaVerificacion.nextSibling);
  }

  // Media query para pantallas grandes
  const mediaQuery = window.matchMedia("(min-width: 64em)");
  if (mediaQuery.matches) {
    botonGuardarLectura.style.marginLeft = "200px";
    botonGuardarParcial.style.marginLeft = "200px";
    botonProcesar.style.marginLeft = "500px";
  }
}

// function inicializarBotones() {
//   // Crear los botones y el contenedor
//   const contenedorTblLectura = document.createElement("div");
//   const contenedorBotones = document.createElement("div");
//   const botonProcesar = document.createElement("button");
//   const botonGuardarParcial = document.createElement("button");
//   const botonGuardarLectura =document.createElement("button");

//   // Configurar propiedades de los botones

//   botonGuardarLectura.textContent = "Guardar";
//   botonGuardarLectura.id = "btnGuardar";
//   botonGuardarLectura.hidden = false;
//   botonGuardarLectura.onclick = confirmarGuardadoParcial;

//   botonProcesar.textContent = "Crear Paquete";
//   botonProcesar.id = "btnCrearPaqueteContenedor";
//   botonProcesar.hidden = false; 
//   botonProcesar.onclick = guardaPaquete;

//   botonGuardarParcial.textContent = "Guardar";
//   botonGuardarParcial.id = "btnGuardar";
//   botonGuardarParcial.hidden = false;
//   botonGuardarParcial.onclick = confirmarGuardadoParcial; // Agregar onclick

//     // Aplicar estilos al botón de guardado parcial lectura
//   botonGuardarLectura.style.backgroundColor = "#28a745";
//   botonGuardarLectura.style.borderRadius = "5px";
//   botonGuardarLectura.style.color = "white";
//   botonGuardarLectura.style.marginTop = "16px";
//   botonGuardarLectura.style.marginLeft = "16px";
//   botonGuardarLectura.style.marginRight = "16px";
//   botonGuardarLectura.style.height = "36px";
//   botonGuardarLectura.style.width = "100px";

//   // Aplicar estilos al botón de guardado parcial
//   botonGuardarParcial.style.backgroundColor = "#28a745";
//   botonGuardarParcial.style.borderRadius = "5px";
//   botonGuardarParcial.style.color = "white";
//   botonGuardarParcial.style.marginTop = "16px";
//   botonGuardarParcial.style.marginLeft = "16px";
//   botonGuardarParcial.style.marginRight = "16px";
//   botonGuardarParcial.style.height = "36px";
//   botonGuardarParcial.style.width = "100px";

//   // Aplicar estilos al botón de Procesar
//   botonProcesar.style.width = "100px";
//   botonProcesar.style.backgroundColor = "#28a745";
//   botonProcesar.style.borderRadius = "5px";
//   botonProcesar.style.color = "white";
//   botonProcesar.style.marginTop = "16px";
//   botonProcesar.style.marginLeft = "6em";
//   botonProcesar.style.height = "40px";
//   botonProcesar.style.marginbottom = "25px";

 
//   // Agregar botones al contenedor
//   contenedorTblLectura.appendChild(botonGuardarLectura);
//   contenedorBotones.appendChild(botonGuardarParcial);
//   contenedorBotones.appendChild(botonProcesar);

//   // Obtener tabla de verificación
//   const tablaLectura = document.getElementById("myTableLectura");
//   const tablaVerificacion = document.getElementById("tblcontenedores");

//   tablaLectura.parentNode.insertBefore(
//     contenedorTblLectura,
//     tablaLectura.nextSibling
//   );
//   // Insertar contenedor de botones después de la tabla de verificación
//   tablaVerificacion.parentNode.insertBefore(
//     contenedorBotones,
//     tablaVerificacion.nextSibling
//   );

//   // Media query para pantallas grandes
//   const mediaQuery = window.matchMedia("(min-width: 64em)");
//   if (mediaQuery.matches) {
//     // Aplicar estilos específicos para pantallas grandes
//     botonGuardarLectura.style.marginLeft = "200px";
//     botonGuardarParcial.style.marginLeft = "200px";
//     botonProcesar.style.marginLeft = "500px";
//   }
// }

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
      //verificacion();
      guardaParcialMente();
    }
  });
}
//FUNCION DE GUARDADO PARCIAL
async function guardaParcialMente() {
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario").value;
  let pOpcion = "L";
  let pBodegaOrigen = document.getElementById("bodega").value;
  let pBodegaDestino = document.getElementById("bodegaSelect").value;
  let pFecha = new Date().toISOString().split("T")[0];
    let conductor= document.getElementById('conductor-camion').value
  let placa = document.getElementById("placa-camion").value;
  let pPlaca=placa+'|'+conductor;
  let pReferencia = "Ref o null";
  let pComentario = document.getElementById("observaciones").value;
  localStorage.setItem('Observaciones',pComentario);
  const table = document.getElementById("tblcontenedores");
  const detalles = [];
  mostrarLoader();

  for (let i = 1; i < table.rows.length-1; i++) {
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
    //const jsonPaquete = encodeURIComponent(JSON.stringify(chunks[i]));
    const jsonPaquete = JSON.stringify(chunks[i]);
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
    console.log("PARAMETROS: " + params);
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

      if (result.msg !== "SUCCESS"||result.respuesta[0].Respuesta !="OK") {
        //console.warn(`⚠️ Error en lote ${i + 1}`, result);
         Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "⚠️ Error: "+result.respuesta[0].Respuesta,
                  });
                  ocultarLoader();
        break; // Si hay un error, detén el proceso
      }else{// 🎉 Mensaje final si todo fue bien
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
            ocultarLoader();
          }
    } catch (err) {
      console.error(`🚨 Error al enviar lote ${i + 1}:`, err);
      break;
    }
  }
// if(result.respuesta[0].Respuesta !="OK"){
//        Swal.fire({
//                     icon: "error",
//                     title: "Error",
//                     text: "⚠️ Error: "+result.respuesta[0].Respuesta,
//                   });
// }else{
//     // 🎉 Mensaje final si todo fue bien
//   Swal.fire({
//     icon: "success",
//     title: "Todos los datos fueron Guardados correctamente",
//     confirmButtonText: "Aceptar",
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       mostrarPestanaLectura();
//     }
//   });
//   ocultarLoader();
// }

}

///////////////FUNCIONES PARA PROCESAR///////////
//////////////////////////////////////////////

/**
 * @function guardaPaquete 
 * @description :realiza el guardado previo a la creacion de un paquete, 
 * por si el usuario no guardo la informacion de lo que se ha dado lectura: 
 */
async function guardaPaquete() {
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario").value;
  let pOpcion = "L";
  let pBodegaOrigen = document.getElementById("bodega").value;
  let pBodegaDestino = document.getElementById("bodegaSelect").value;
  let pFecha = new Date().toISOString().split("T")[0];
  let pPlaca = document.getElementById("placa-camion").value;
  let pReferencia = "Ref o null";
  let pComentario = document.getElementById("observaciones").value;
 
  const table = document.getElementById("tblcontenedores");
  const detalles = [];

  for (let i = 1; i < table.rows.length-1; i++) {
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

  console.log(`Total de registros a enviar: ${detalles.length}`);

  // 🔁 Dividir el array en chunks de 20
  const chunkSize = 20;
  const chunks = [];
  for (let i = 0; i < detalles.length; i += chunkSize) {
    chunks.push(detalles.slice(i, i + chunkSize));
  }

  console.log(
    `Se dividirán en ${chunks.length} lotes de ${chunkSize} (último puede ser menor)`
  );

  // ⚙️ Configuración base del fetch
  const myInit = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  };

  // 🔄 Enviar cada lote secuencialmente recorremos el array detalles[] dividido segun el tamaño de los paquetes
  for (let i = 0; i < chunks.length; i++) {   
    //const jsonPaquete = encodeURIComponent(JSON.stringify(chunks[i]));
    const jsonPaquete = JSON.stringify(chunks[i]);
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
    console.log("PARAMETROS: " + params);
    console.log(`📦 Enviando lote ${i + 1} de ${chunks.length}...`);
    console.log("jsonPaquete=\n", jsonPaquete);
    console.log("Fin...");
    // llamada al API...
    try {
      const response = await fetch(
        env.API_URL + "guardacreapaquete" + params,
        myInit
      );
      const result = await response.json();

      console.log(`✅ Lote ${i + 1} procesado`, result);        

      if (result.msg !== "SUCCESS" || result.respuesta[0].Respuesta !="OK") {
        console.log(`⚠️ Error en lote ${i + 1}`, result.respuesta[0].Respuesta);
         Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "⚠️ Error: "+result.respuesta[0].Respuesta,
                  });
        break; // Si hay un error, detén el proceso
      }else{
              // 🎉 Mensaje final si todo fue bien
              console.log("Se guardaron los elementos de la tabla lectura y se va a crear el paquete.");
              ConfirmaCrearPaqueteContenedores();
      }
    } catch (err) {
      console.error(`🚨 Error al enviar lote ${i + 1}:`, err);
      break;
    }
  }
}

/**
 * @function ConfirmaCrearPaqueteContenedores
 * @description : confirma y valida la creacion del paquete por parte del usuario
 */
function ConfirmaCrearPaqueteContenedores() {
  // Obtener todas las celdas de verificación
  //var celdasVerificacion = document.querySelectorAll('#tblbodyLineasContenedor td#verificado');

  Swal.fire({
    icon: "warning",
    title: "¿Desea procesar el contenedor?",
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
        //localStorage.removeItem("UsuarioAutorizacion");
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
            const usuario = document.getElementById("swal-input1").value.toUpperCase();
            const contraseña = document.getElementById("swal-input2").value;
            return { usuario: usuario, contraseña: contraseña };
          },}).then((result) => {
          
          if (!result.isDismissed && result.value && result.value.usuario && result.value.contraseña) {
               const params = "?pSistema=" +
                              'WMS' +
                              "&pUsuario=" +
                              result.value.usuario  +
                              "&pOpcion=" +
                              result.value.contraseña;                  

             fetch(env.API_URL + "wmsautorizaciones"+params)
              .then((response) => response.json())
              .then((resultado) => {
                console.log("Autorizacion Resultado: ");
                console.log(resultado.autorizacion[0].mensaje);
               
              if(resultado.autorizacion[0].mensaje === "OK") {
                  console.log("Credenciales válidas");              
                 CrearPaqueteContenedores();
                } else {
                  console.log("Credenciales inválidas");
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Credenciales inválidas",
                  });
                }
              })
              .catch((error) => {
                console.error("Error al obtener los datos del API:", error);
                Swal.fire({
                  icon: "error",
                  title: "Error",
                  text: "No se pudo obtener los datos del API",
                });
              });
          } else {
            console.error(
              "Error: No se pudieron obtener los valores de usuario y contraseña del Swal"
            );
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

/**
 * @function CrearPaqueteContenedores
 * @description : se encarga de crear el paquete
 */
function CrearPaqueteContenedores() {
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario").value;
  let pOpcion = "R";
  let pBodegaOrigen = document.getElementById("bodega").value;
  let pBodegaDestino = document.getElementById("bodegaSelect").value;
  let pFecha = new Date().toISOString().split("T")[0];
  let conductor= document.getElementById('conductor-camion').value
  let placa = document.getElementById("placa-camion").value;
  let pPlaca=placa+'|'+conductor;

  let jsonPaquete = "";
  let pReferencia = document.getElementById('pContenedor').value;
  //"Ref o null";
  let pComentario = document.getElementById('observaciones').value;
  //let pPlaca = document.getElementById("placa-camion").value;
  if (pPlaca == "|") {
    Swal.fire({
      icon: "warning",
      title: "Advertencia",
      text: "Faltan parámetros para cargar los datos.\nVerifique que se hayan llenado correctamente los campos de la bodega de destino y la placa del camión.",
    });
  } else{
    console.log('observaciones: ',pComentario);
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

  console.log("Params:\n"+params);
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
                //  imprimirPaqueteReporte(respuesta);
                // limpiarResultadoGeneral();
                // limpiarMensajes();
                // //location.reload();
              } else if (resultSwal.isDenied) {
                imprimirPaqueteReporte(respuesta);
                // limpiarResultadoGeneral();
                // limpiarMensajes();
                //location.reload();
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
          console.log("El API no devolvio nada");
        }
      } else {
      }
    });
  }  
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
/**
 * @function permisoCrearPaquete
 * @description Verifica los permisos del usuario para crear paquetes 
 */
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

  console.log("Params:\n" + params);

  // const response = await fetch(env.API_URL + "imprimepaquete" + params, myInit);
  // const result = await response.json();
  fetch(env.API_URL + "imprimepaquete" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS" && result.respuesta.length > 0) {
        console.log("REPORTE CREACION DE PAQUETE", result.respuesta);

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

        console.log("Se generó el pdf");

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
           if (!result.isDismissed && result.value && result.value.usuario && result.value.contraseña) {
               const params = "?pSistema=" +
                              'WMS' +
                              "&pUsuario=" +
                              result.value.usuario  +
                              "&pOpcion=" +
                              result.value.contraseña;                  

             fetch(env.API_URL + "wmsautorizaciones"+params)
              .then((response) => response.json())
              .then((resultado) => {
                console.log("Autorizacion Resultado: ");
                console.log(resultado.autorizacion[0].mensaje);
               
              if(resultado.autorizacion[0].mensaje === "OK") {
                  console.log("Credenciales válidas");              
                  devolverArticulo(articulo, contenedor, cantidadPreparada);
                } else {
                  console.log("Credenciales inválidas");
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Credenciales inválidas",
                  });
                }
              })
              .catch((error) => {
                console.error("Error al obtener los datos del API:", error);
                Swal.fire({
                  icon: "error",
                  title: "Error",
                  text: "No se pudo obtener los datos del API",
                });
              });
          }  
  });
}

function devolverArticulo(articulo, contenedor, cantidadPreparada) {
  const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];

  // Buscar si el artículo existe dentro del arreglo
  const encontrado = dataArray.find(
    (item) => item.ARTICULO.trim().toUpperCase() === articulo.trim().toUpperCase()
  );

  // Si no se encuentra, preguntamos si desea continuar de todas formas
  if (!encontrado) {
    Swal.fire({
      title: "Artículo sin lecturas",
      text: `El artículo ${articulo} no tiene registros de lectura previa. ¿Deseas procesar la devolución de todas formas?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "No, cancelar",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6e7881"
    }).then((result) => {
      if (result.isConfirmed) {
        // Si acepta, ejecutamos la lógica de devolución pasando 0 como lectura
        ejecutarLogicaDevolucion(articulo, contenedor, cantidadPreparada, 0);
      } else {
        // Si cancela, el return ocurre implícitamente aquí al no hacer nada
        return;
      }
    });
  } else {
    // Si SI se encuentra, procedemos con la cantidad encontrada originalmente
    const cantidadLeida = parseFloat(encontrado.CANTIDAD_LEIDA) || 0;
    ejecutarLogicaDevolucion(articulo, contenedor, cantidadPreparada, cantidadLeida);
  }
}

/**
 * Función auxiliar para no repetir el código del Swal de confirmación y el Fetch
 */
function ejecutarLogicaDevolucion(articulo, contenedor, cantidadPreparada, cantidadLeida) {
  const cantidadPreparadaNum = parseFloat(cantidadPreparada) || 0;
  const diferencia = cantidadPreparadaNum - cantidadLeida;

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
      let pSistema = "WMS";
      let pUsuario = document.getElementById("hUsuario").value;
      let pOpcion = "c";
      let pBodegaEnvia = document.getElementById("bodega").value;
      let pBodegaDestino = document.getElementById("bodegaSelect").value;
      let pConsecutivo = $("#pContenedor").val();
      let pEstado = "";
      let pFechaDesde = $("#fecha_ini").val();
      let pArticulo = articulo;

      const params = `?pSistema=${pSistema}&pUsuario=${pUsuario}&pOpcion=${pOpcion}&pBodegaEnvia=${pBodegaEnvia}&pBodegaDestino=${pBodegaDestino}&pContenedor=${pConsecutivo}&pEstado=${pEstado}&pFechaDesde=${pFechaDesde}&pArticulo=${pArticulo}`;

      localStorage.setItem("parametrosBusquedaContenedor", params);
      
      // Mostrar loader antes del fetch
      if(document.getElementById("carga")) document.getElementById("carga").innerHTML = "Cargando...";

      fetch(env.API_URL + "verificadordecontenedores" + params, myInit)
        .then((response) => response.json())
        .then((result) => {
          if (result.msg === "SUCCESS") {
            if (result.respuesta.length != 0) {
              mostrarTablaEnSwal(result.respuesta);
            } else {
              Swal.fire({
                icon: "info",
                title: "Información",
                text: "Ocurrió un error al cargar las líneas para devolución",
                confirmButtonColor: "#28a745",
              });
            }
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Se registró un error en la llamada al API",
              confirmButtonColor: "#28a745",
            });
          }
        })
        .finally(() => {
           if(document.getElementById("carga")) document.getElementById("carga").innerHTML = "";
        });
    }
  });
}

// function devolverArticulo(articulo, contenedor, cantidadPreparada) {
//   const dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
//   // console.log("📦 DataArray:", dataArray);

//   // Buscar si el artículo existe dentro del arreglo
//   const encontrado = dataArray.find(
//     (item) =>
//       item.ARTICULO.trim().toUpperCase() === articulo.trim().toUpperCase()
//   );

//   // Si no se encuentra, mostramos advertencia y detenemos la ejecución
//   if (!encontrado) {
//     Swal.fire({
//       title: "Artículo no encontrado",
//       text: `El artículo ${articulo} no tiene registros de lectura.`,
//       icon: "warning",
//       confirmButtonText: "Aceptar",
//       cancelButtonText: "Cancelar",
//       confirmButtonColor: "#28a745",
//       cancelButtonColor: "#6e7881"     
//     });
//     return;
//   }

//   // Obtener la cantidad leída
//   const cantidadLeida = parseFloat(encontrado.CANTIDAD_LEIDA) || 0;
//   const cantidadPreparadaNum = parseFloat(cantidadPreparada) || 0;
//   const diferencia = cantidadPreparadaNum - cantidadLeida;

//   // Mostrar confirmación
//   Swal.fire({
//     title: "Devolver Artículo",
//     html: `
//       <p>¿Estás seguro de devolver el artículo <b>${articulo}</b>?</p>
//       <p>Contenedor: <b>${contenedor}</b></p>
//       <p>Cantidad preparada: <b>${cantidadPreparadaNum.toFixed(2)}</b></p>
//       <p>Cantidad leída: <b>${cantidadLeida.toFixed(2)}</b></p>
//       <hr>
//       <p><b>Diferencia a devolver:</b> ${diferencia.toFixed(2)}</p>
//     `,
//     icon: "question",
//     showCancelButton: true,
//     confirmButtonText: "Sí, devolver",
//     cancelButtonText: "Cancelar",
//     confirmButtonColor: "#28a745",
//     cancelButtonColor: "#6e7881",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       //// console.log(`✅ Artículo: ${articulo}`);
//       //// console.log(`📦 Contenedor: ${contenedor}`);
//       //// console.log(`🔢 Cantidad preparada: ${cantidadPreparadaNum}`);
//       //// console.log(`📉 Cantidad leída: ${cantidadLeida}`);
//       //// console.log(`🔁 Diferencia devuelta: ${diferencia}`);

//       let pSistema = "WMS";
//       let pUsuario = document.getElementById("hUsuario").value;
//       let pOpcion = "c";
//       let pBodegaEnvia = document.getElementById("bodega").value;
//       let pBodegaDestino = document.getElementById("bodegaSelect").value;
//       let pConsecutivo = $("#pContenedor").val();
//       let pEstado = "";
//       let pFechaDesde = $("#fecha_ini").val();
//       let pArticulo = articulo;

//       const params =
//         "?pSistema=" +
//         pSistema +
//         "&pUsuario=" +
//         pUsuario +
//         "&pOpcion=" +
//         pOpcion +
//         "&pBodegaEnvia=" +
//         pBodegaEnvia +
//         "&pBodegaDestino=" +
//         pBodegaDestino +
//         "&pContenedor=" +
//         pConsecutivo +
//         "&pEstado=" +
//         pEstado +
//         "&pFechaDesde=" +
//         pFechaDesde +
//         "&pArticulo=" +
//         pArticulo;
//       // console.log("BUSQUEDA CONTENEDOR PARAMETROS\n " + params);
//       localStorage.setItem("parametrosBusquedaContenedor", params);
//       fetch(env.API_URL + "verificadordecontenedores" + params, myInit)
//         .then((response) => response.json())
//         .then((result) => {
//           if (result.msg === "SUCCESS") {
//             detalleLineasContenedoreses = result.respuesta;
//             if (result.respuesta.length != 0) {
//               // console.log('REsultados:');
//               // console.log(detalleLineasContenedoreses);
//               mostrarTablaEnSwal(detalleLineasContenedoreses);
//             } else {
//               Swal.fire({
//                 icon: "info",
//                 title: "Información",
//                 text: "Ocurrio un error al cargar las lineas para devolución",
//                 confirmButtonColor: "#28a745",
//               });
//             }
//             document.getElementById("carga").innerHTML = "";
//           } else {
//             Swal.fire({
//               icon: "error",
//               title: "error",
//               text: "Se registro un error en la llamada al API",
//               confirmButtonColor: "#28a745",
//             });
//           }
//         });
//     }
//   });
// }

async function mostrarTablaEnSwal(data) {
  let pSistema = "WMS";
  let pUsuario = document.getElementById("hUsuario").value;
  let pOpcion = "D";
  let BodegaEnvia = document.getElementById("bodega").value;
  let BodegaSolic = localStorage.getItem("bodega_solicita");
  let pUsuarioAutorizacion = localStorage.getItem("UsuarioAutorizacion") || "";
  let contenedor = document.getElementById('pContenedor').value;

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
      jsonDetalles+
      "pContenedor="+
      contenedor;
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
/**
 * @function calcularTotalesVerificacion
 * @description Obtiene los valores de las columnas numéricas de la tabla de verificación 
 * (ID: tblcontenedores) y agrega una fila de totales al pie (tfoot).
 */
function calcularTotalesVerificacion() {
    const tabla = document.getElementById("tblcontenedores");
    const tbody = document.getElementById("tblbodyLineasContenedor");

    if (!tabla || !tbody) {
        console.error("No se encontraron la tabla o el cuerpo de la tabla de verificación.");
        return;
    }

    // Definición de las columnas que queremos sumar, basadas en los índices de la tabla:
    // 0: Conten | 1: Artí. | 2: Cant. Ped. | 3: Cant. Prep. | 4: Cant. Desp. | 5: Verif | 6: Dev. | 7: DEL (Hidden)
    const INDICES_SUMA = [3, 4, 5, 6]; 
    const totales = INDICES_SUMA.map(() => 0); // Inicializar un array de totales en 0

    // 1. Iterar sobre las filas del tbody
    const filas = tbody.querySelectorAll('tr');

    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');

        INDICES_SUMA.forEach((indiceColumna, indiceTotal) => {
            // Asegurarse de que la celda existe
            if (celdas[indiceColumna]) {
                // Obtener el valor de la celda. 
                // Se asume que el valor es el texto dentro de la celda <td>
                let valor = celdas[indiceColumna].textContent.trim();

                // Convertir el valor a número (usando parseFloat para manejar decimales si fuera necesario)
                // Usamos '|| 0' para tratar valores no numéricos como cero.
                let numero = parseFloat(valor) || 0;
                
                totales[indiceTotal] += numero;
            }
        });
    });

    // 2. Limpiar el tfoot existente para evitar duplicados
    let tfoot = tabla.querySelector('tfoot');
    if (tfoot) {
        tfoot.remove();
    }
    tfoot = document.createElement('tfoot');
    
    // 3. Crear la fila de totales
    const filaTotal = document.createElement('tr');
    filaTotal.style.fontWeight = 'bold'; // Estilo para resaltar los totales
    filaTotal.style.backgroundColor = '#f0f0f0'; // Fondo ligero
    filaTotal.style.fontSize = '14px';

    // Crear las celdas de la fila de totales (8 columnas en total)
    
    // Primeras dos celdas (Conten, Artí.)
    let celdaLabel = document.createElement('td');
    celdaLabel.textContent = 'TOTALES:';
    celdaLabel.setAttribute('colspan', 2); // Ocupa las dos primeras columnas
    celdaLabel.style.textAlign = 'center';
    filaTotal.appendChild(celdaLabel);

    // Iterar sobre los totales calculados
    INDICES_SUMA.forEach((indiceColumna, indiceTotal) => {
        let celdaTotal = document.createElement('td');
        // Formatear el número (puedes ajustar el formato si es necesario)
        celdaTotal.textContent = totales[indiceTotal].toLocaleString(); // Formato de número local
        celdaTotal.style.textAlign = 'left'; // Ajuste según tu diseño
        filaTotal.appendChild(celdaTotal);
    });

    // Última celda para la columna DEL (DEL está oculta en el thead, pero la columna debe estar presente)
    let celdaVacia = document.createElement('td');
    filaTotal.appendChild(celdaVacia);
    
    // 4. Insertar la fila de totales en el tfoot y el tfoot en la tabla
    tfoot.appendChild(filaTotal);
    tabla.appendChild(tfoot);
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
// //_____________________________________________________________________________
// ///////// FILTRAR LÍNEAS DE VERIFICACIÓN DINÁMICAMENTE //////////////////
// //_____________________________________________________________________________
// function filtrarTablaVerificacion() {
//   // Aseguramos tener datos cargados antes de filtrar
//   if (!detalleLineasContenedoreses || detalleLineasContenedoreses.length === 0) return;

//   // Obtener el valor escrito por el operador
//   const textoBusqueda = document.getElementById("filtrarArticuloVerif").value.toLowerCase().trim();

//   // Si el buscador está vacío, volvemos a armar la tabla con el arreglo original completo
//   if (textoBusqueda === "") {
//     armarTablaVerificacion(detalleLineasContenedoreses);
//     return;
//   }

//   // Filtrar el arreglo maestro buscando coincidencias en Artículo, Descripción o Código de Barra
//   const datosFiltrados = detalleLineasContenedoreses.filter(function (detalle) {
//     const articulo = (detalle.Articulo || "").toLowerCase();
//     const descripcion = (detalle.Descripcion || "").toLowerCase();
//     const codigoBarra = (detalle.Codigo_Barra || "").toLowerCase();

//     // También verificamos si existen códigos alternativos separados por barra "|"
//     let codigosAlternativos = "";
//     if (detalle.codigos_barras) {
//       codigosAlternativos = detalle.codigos_barras.toLowerCase();
//     }

//     return (
//       articulo.includes(textoBusqueda) ||
//       descripcion.includes(textoBusqueda) ||
//       codigoBarra.includes(textoBusqueda) ||
//       codigosAlternativos.includes(textoBusqueda)
//     );
//   });

//   // Re-armar la tabla de verificación pasando únicamente el arreglo filtrado
//   armarTablaVerificacion(datosFiltrados);
// }

//_____________________________________________________________________________
///////// FILTRAR LÍNEAS DE VERIFICACIÓN POR CONTENEDOR Y ARTÍCULO /////////////
//_____________________________________________________________________________
function filtrarTablaVerificacion() {
  // Aseguramos tener datos cargados antes de filtrar
  if (!detalleLineasContenedoreses || detalleLineasContenedoreses.length === 0) return;

  // Obtener el valor escrito por el operador en minúsculas y sin espacios muertos
  const textoBusqueda = document.getElementById("filtrarArticuloVerif").value.toLowerCase().trim();

  // Si el buscador está vacío, volvemos a armar la tabla con el arreglo original completo
  if (textoBusqueda === "") {
    armarTablaVerificacion(detalleLineasContenedoreses);
    return;
  }

  // Filtrar el arreglo maestro buscando coincidencias EXCLUSIVAMENTE en Contenedor y Articulo
  const datosFiltrados = detalleLineasContenedoreses.filter(function (detalle) {
    const contenedor = (detalle.Contenedor || "").toLowerCase();
    const articulo = (detalle.Articulo || "").toLowerCase();

    // Retorna true si el texto coincide con cualquiera de las dos columnas especificadas
    return contenedor.includes(textoBusqueda) || articulo.includes(textoBusqueda);
  });

  // Re-armar la tabla de verificación pasando únicamente el arreglo filtrado
  armarTablaVerificacion(datosFiltrados);
}
function alternarEstadoBotonesAccion(habilitar) {
  const btnLectura = document.getElementById("btnGuardarLectura");
  const btnVerificacion = document.getElementById("btnGuardarVerificacion");
  const btnProcesar = document.getElementById("btnCrearPaqueteContenedor");

  // Si los botones existen en el DOM, alteramos su estado disabled
  if (btnLectura) btnLectura.disabled = !habilitar;
  if (btnVerificacion) btnVerificacion.disabled = !habilitar;
  if (btnProcesar) btnProcesar.disabled = !habilitar;
}
function mostrarInfo() {
  Swal.fire({
    title: '<strong style="font-family:\'Oswald\',sans-serif;">Guía de Operación y Colores</strong>',
    icon: 'info',
    html: `
      <div style="text-align: left; font-size: 14px; font-family: 'Roboto', sans-serif; line-height: 1.5; max-height: 430px; overflow-y: auto; padding-right: 8px;">
        
        <!-- ESTADOS Y COLORES -->
        <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 0;">
          🎨 Estados y Colores en Verificación
        </h6>
        <div style="margin-bottom: 15px;">
          <p style="margin: 5px 0;">
            <span style="display:inline-block; width:18px; height:18px; background-color: #4caf50; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
            <strong>Doble gancho verde:</strong> Líneas completas cuyo conteo llegó al máximo solicitado.
          </p>        
          <p style="margin: 5px 0;">
            <span style="display:inline-block; width:18px; height:18px; background-color: #ffffff; border: 1px solid #ccc; border-radius: 4px; vertical-align: middle; margin-right: 8px;"></span>
            <strong>Sin Color:</strong> Líneas del contenedor sin ningún registro o con lectura parcial en el sistema.
          </p>
        </div>

        <!-- FLUJO DEL PROCESO -->
        <h6 style="font-weight: bold; color: #1e88e5; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
          🔄 Flujo de Verificación y Lectura
        </h6>
        <ol style="padding-left: 18px; margin: 8px 0;">
          <li style="margin-bottom: 6px;">
            <strong>Carga Inicial:</strong> Selecciona la <em>Bodega de Destino</em> y presiona el botón <strong>Cargar Lineas de Contenedores</strong>. Aparecerá un mensaje indicando que la información se ha cargado en la pestaña <em>Verificación</em> para su revisión.
          </li>
          <li style="margin-bottom: 6px;">
            <strong>Lectura de Artículos:</strong> Pasa a la pestaña <em>Lectura</em> y escanea o ingresa las referencias/códigos de barra. El sistema validará su existencia y sumará las cantidades.
          </li>
          <li style="margin-bottom: 6px;">
            <strong>Monitoreo y Guardado:</strong> Puedes verificar el avance con la etiqueta <em>Leído (X/Y)</em> o revisar en tiempo real la pestaña <em>Verificación</em>. Presiona el botón <strong>Guardar</strong> para registrar en base de datos el progreso parcial.
          </li>
          <li style="margin-bottom: 6px;">
            <strong>Crear Paquete:</strong> Una vez completada la verificación, utiliza el botón <strong>Crear Paquete</strong> para procesar la transacción y generar el comprobante.
          </li>
        </ol>

        <!-- AUTORIZACIONES Y EXCEPCIONES -->
        <h6 style="font-weight: bold; color: #e65100; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 12px;">
          🔑 Autorización de Supervisor
        </h6>
        <p style="margin: 5px 0 10px 0;">
          El sistema solicitará credenciales de supervisor en las siguientes situaciones:
        </p>
        <ul style="padding-left: 18px; margin: 5px 0; list-style-type: disc;">
          <li>Si existen <strong>diferencias entre la cantidad leída y la solicitada</strong> al intentar crear el paquete.</li>
          <li>Al realizar una <strong>Devolución de Artículos verificados</strong> (índice o botón <i class="material-icons" style="font-size:16px; vertical-align:middle; color:#FF0000;">reply</i>).</li>
        </ul>

        <!-- ADVERTENCIA RECARGAS -->
        <div style="margin-top: 15px; background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 10px; border-radius: 4px;">
          <strong style="color: #e65100; display: block; margin-bottom: 2px;">⚠️ ¡Atención con las recargas!</strong>
          Si recargas la página (F5 o botón refrescar) antes de pulsar el botón <strong>Guardar</strong>, la información de lecturas en memoria se perderá.
        </div>

      </div>
    `,
    showCloseButton: true,
    confirmButtonColor: '#1e88e5',
    confirmButtonText: 'Entendido'
  });
}

// Función para cargar las Placas en el Select vía API
async function cargarSelectPlacas() {
  const selectPlaca = document.getElementById("placa-camion");
  if (!selectPlaca) return;

  // Parámetros
  const pSistema = "WMS";
  const pUsuarioElement = document.getElementById("hUsuario");
  const pUsuario = pUsuarioElement ? pUsuarioElement.value : "PRUEBAPMA";
  const pOpcion = "S";
  const pPlaca = "";

  // Construcción de los parámetros URL
  const params = `?pSistema=${pSistema}&pUsuario=${pUsuario}&pOpcion=${pOpcion}&pPlaca=${pPlaca}`;

  try {
    const response = await fetch(env.API_URL + "selectcamion" + params, myInit);
    const data = await response.json();

    // Limpiar opciones anteriores
    selectPlaca.innerHTML = '<option value="" disabled selected>Seleccione una placa</option>';

    const listaPlacas = data.respuesta || data;

    if (Array.isArray(listaPlacas)) {
      listaPlacas.forEach(placa => {
        const option = document.createElement("option");
        
        // 1. Limpiar los textos quitando saltos de línea (\r\n) y espacios sobrantes
        const numPlaca = (placa.NUM_PLACA || "").trim();
        const descripcion = (placa.DESCRIPCION || "").trim();

        // 2. Asignar NUM_PLACA limpia como value
        option.value = numPlaca;

        // 3. Formato legible para el usuario: "PLACA - DESCRIPCION" (o solo la placa si no hay descripción)
        option.textContent = descripcion ? `${numPlaca} - ${descripcion}` : numPlaca;

        selectPlaca.appendChild(option);
      });
    }

    // Reinicializar el select específico en Materialize
    M.FormSelect.init(selectPlaca);
  } catch (error) {
    console.error("Error al cargar las placas de camión:", error);
  }
}
// Función para cargar los Conductores en el Select vía API
async function cargarSelectConductores() {
  const selectConductor = document.getElementById("conductor-camion");
  if (!selectConductor) return;

  // Parámetros
  const pSistema = "WMS";
  const pUsuarioElement = document.getElementById("hUsuario");
  const pUsuario = pUsuarioElement ? pUsuarioElement.value : "PRUEBAPMA";
  const pOpcion = "S";
  const pConductor = 0;

  // Construcción de los parámetros URL
  const params = `?pSistema=${pSistema}&pUsuario=${pUsuario}&pOpcion=${pOpcion}&pConductor=${pConductor}`;

  try {
    const response = await fetch(env.API_URL + "selectconductor" + params, myInit);
    const data = await response.json();

    // Limpiar opciones anteriores
    selectConductor.innerHTML = '<option value="" disabled selected>Seleccione un conductor</option>';

    const listaConductores = data.respuesta || data;

    if (Array.isArray(listaConductores)) {
      listaConductores.forEach(conductor => {
        const option = document.createElement("option");

        // 1. Asignar ID_CONDUCTOR como value
        option.value = conductor.ID_CONDUCTOR;

        // 2. Limpiar el nombre del conductor
        const nombreConductor = (conductor.CONDUCTOR || "").trim();
        option.textContent = nombreConductor;

        selectConductor.appendChild(option);
      });
    }

    // Reinicializar el select específico en Materialize
    M.FormSelect.init(selectConductor);
  } catch (error) {
    console.error("Error al cargar los conductores:", error);
  }
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
//Variable global que contiene el detalle del pedido
var detallePedidoList = "";

document.addEventListener("DOMContentLoaded", function () {
  let usuario = document.getElementById("hUsuario").value;
  console.log("DOM cargado exitosamente...:", usuario);
  //--------------------------------------------------------------------------
  if (localStorage.getItem("documento")) {
    var documento = localStorage.getItem("documento");
    var pedido = localStorage.getItem("pedidoSelect");
    let estado = localStorage.getItem("estado");
    //---------------------------------------------------------------------------
    cargarDetallePedido(documento, pedido, estado);

    localStorage.removeItem("dataArray"); //borra los elementos leidos del localstorage.
  } else {
    window.location = "index.html";
  }
});

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function cargarDetallePedido(documento, pedido, estado) {
  // Concatena la variable con texto y asigna el valor al label documento y pedido
  const elDocumento = document.getElementById("documento");
  const elPedido = document.getElementById("pedido");
  const elEstado = document.getElementById("estadoPedido");

  if(elDocumento) elDocumento.textContent = documento;
  if(elPedido) elPedido.textContent = pedido;
  if(elEstado) {
      elEstado.textContent = estado;
      // Estilo condicional para el badge de estado
      if(estado === 'Pendiente' || estado === 'F' || estado === 'Facturado') {
          elEstado.classList.remove('active');
          elEstado.style.background = '#fef08a'; // Amarillo claro
          elEstado.style.color = '#854d0e'; // Texto oscuro
      }
  }

  const pPedido = pedido; //Se asigna el número del peddido a una variable constante para pasarlo como parametro
  const params = "?pPedido=" + pPedido;
  
  if (typeof mostrarLoader === "function") mostrarLoader("Cargando detalle...");
  
  fetch(env.API_URL + "wmsverificacionpedidos/D" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        if (result.lineaspedido.length != 0) {

          console.log(result);
          detallePedidoList = result.lineaspedido;
          armarTablaVerificacion(detallePedidoList);
          // Verificar si todas las cantidades verificadas tienen un valor
          const siGuardadoParcial = detallePedidoList.some(
            (detalle) =>
              detalle.CANTIDAD_VERIFICADA != null &&
              detalle.CANTIDAD_VERIFICADA !== "" &&
              parseFloat(detalle.CANTIDAD_VERIFICADA) > 0
          );

          if (siGuardadoParcial) {
            // Llamar a armarTablaLectura después de armar la tabla de verificación
            armarTablaLectura(detallePedidoList);
          }
        }
        
        if (typeof ocultarLoader === "function") ocultarLoader();
      }
    })
    .catch((error) => {
        console.error("Error al cargar detalle:", error);
        if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function armarTablaLectura(detallePedidoList) {
  var tbody = document.getElementById("tblbodyLectura");
  var estadoPreparacion = localStorage.getItem("EstadoPreparacion");
  var empresa = detallePedidoList[0].CIA; // Supongo que la empresa es la misma para todos los detalles

  if (!tbody) return;

  tbody.innerHTML = "";

  detallePedidoList.forEach(function (detalle) {
    if (
      detalle.CANTIDAD_VERIFICADA != null &&
      detalle.CANTIDAD_VERIFICADA !== "" &&
      detalle.CANTIDAD_VERIFICADA > 0
    ) {
      // Verificar si CANTIDAD_VERIFICADA tiene un valor
      var newRow = document.createElement("tr");
      var disabled =
        empresa !== "B" && estadoPreparacion !== "A" ? "disabled" : "";
      var cursor = disabled ? "default" : "pointer";
      var onclick = disabled ? "" : 'onclick="eliminarFila(this)"';

      newRow.innerHTML = `
        <td class="cell-center">
            <span style="font-weight: 600; color: #1e293b;">${detalle.ARTICULO}</span>
        </td>
        <td>
            <input type="text" class="codigo-barras-input" value="${
              detalle.CODIGO_BARRA || ""
            }" onchange="validarCodigoBarras(this)" autofocus ${disabled} autocomplete="off">
        </td>
        <td>
            <input type="text" class="codigo-barras-input" value="${
              detalle.CANTIDAD_VERIFICADA || ""
            }" onchange="guardarTablaEnArray(this)" ${disabled} autocomplete="off">
        </td>
        <td class="cell-center">
            <i class="material-icons" style="cursor: ${cursor}; color: #ef4444; font-size: 20px;" ${onclick}>delete</i>
        </td>
      `;
      tbody.appendChild(newRow);
    }
  });

  guardarTablaEnArray();
  crearNuevaFila();
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////VALIDA EL CODIGO LEIDO EN LA PESTAÑA LECTURA//////////////////
function validarCodigoBarras(input) {
  var pedidoList = detallePedidoList;
  console.log("Lineas Pedido", pedidoList);
  const codbarra = input.value.trim().toUpperCase(); // Convertir a mayúsculas

  if(codbarra === "") return;

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
      (pedidoList[i].ARTICULO &&
        pedidoList[i].ARTICULO.toUpperCase() === codbarra) ||
      (pedidoList[i].CODIGO_BARRA &&
        pedidoList[i].CODIGO_BARRA.toUpperCase() === codbarra) ||
      codigosArrayArticulo.includes(codbarra)
    ) {
      span.textContent = pedidoList[i].ARTICULO;
      cantFila.value = 1;

      // Bloquear la celda del código de barras
      input.setAttribute("readonly", "readonly");

      // Aquí se genera una fila nueva vacía
      crearNuevaFila();

      // Llamar función que guarda artículos en la tabla
      guardarTablaEnArray();

      codigoValido = true;
      break;
    }
  }

  if (!codigoValido) {
    // Borrar el contenido de la celda
    input.value = "";

    Swal.fire({
      icon: "warning",
      title: "¡Código no válido!",
      text: "El código ingresado no coincide con ningún artículo del pedido. Intente nuevamente.",
      confirmButtonColor: "#28a745",
    });
  }
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
///// Funcion que crea la nueva fila en la pestaña lectura ////////////
function crearNuevaFila() {
  const tableBody = document.querySelector("#tblbodyLectura");

  if(!tableBody) return;

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

  // Obtén el último campo de entrada en la columna COD de la nueva fila
  const nuevoCodigoBarrasInput = tableBody.lastElementChild.cells[1].querySelector("input");

  // Establece el enfoque en el último campo de entrada
  if (nuevoCodigoBarrasInput) {
    nuevoCodigoBarrasInput.focus();
  }
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
///////////vALIDA LO QUE SE LEE CONTRA EL PEDIDO./////////
function validarCantidadPedida() {
  //Llamado a guardar datos en la variable arrray en el LS
  guardarTablaEnArray();
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function guardarTablaEnArray() {
  var dataArray = [];

  var table = document.getElementById("myTableLectura");
  if(!table) return dataArray;
  
  var rows = table.getElementsByTagName("tr");

  for (var i = 1; i < rows.length; i++) {
    // Comenzamos desde 1 para omitir la fila de encabezado
    var row = rows[i];
    
    // Saltamos filas que pudieran estar en mal estado
    if(row.cells.length < 3) continue;

    var spanArticulo = row.cells[0].querySelector("span");
    var articulo = spanArticulo ? spanArticulo.textContent.trim() : "";
    
    var codigoBarraInput = row.cells[1].querySelector("input");
    var cantidadLeidaInput = row.cells[2].querySelector("input");

    var codigoBarra = codigoBarraInput ? codigoBarraInput.value : "";
    var cantidadLeida = cantidadLeidaInput ? parseFloat(cantidadLeidaInput.value) : NaN;
    
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

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
///////////////////////FUNCION QUE AGRUPA EL DATA ARRAY CON LAS LECTURAS DEL PEDIDO////////////////////
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

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
// Funcion que elimina filas en la pestaña lectura
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
      var cells = row.querySelectorAll("input");
      
      cells.forEach(function (cell) {
        if (cell.value.trim() !== "") {
          isEmptyRow = false;
        }
      });

      // Elimina la fila solo si no está vacía
      if (isEmptyRow) {
        Swal.fire({
          icon: "warning",
          title: "Fila Vacía",
          text: "Está intentando borrar una fila vacía",
          confirmButtonText: "Cerrar",
          confirmButtonColor: "#28a745",
        });
      } else {
        row.remove();

        // Después de eliminar la fila, establecer el enfoque en el último campo de entrada
        const tableBody = document.querySelector("#tblbodyLectura");
        if(tableBody && tableBody.lastElementChild) {
            const ultimoCodigoBarrasInput = tableBody.lastElementChild.cells[1].querySelector("input");
            if (ultimoCodigoBarrasInput) {
              ultimoCodigoBarrasInput.focus();
            }
        }
        
        // Actualizar la memoria
        guardarTablaEnArray();
      }
    }
  });
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
///FUNCION QUE ARMA LA TABLA DE LA PESTAÑA VERIFICACION
function armarTablaVerificacion(detallePedidoList) {
  var tbody = document.getElementById("tblbodyVerificacion");

  if (!tbody) return;
  tbody.innerHTML = "";

  var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
  if(cantidadDeRegistrosLabel) {
      cantidadDeRegistrosLabel.textContent = "Cantidad de registros: " + detallePedidoList.length;
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
              isNaN(parseFloat(detalle.CANTIDAD_PEDIDA))
                ? "0.00"
                : parseFloat(detalle.CANTIDAD_PEDIDA).toFixed(2)
            }</td>
            <td id="cantidadLeida" class="cell-number"></td>
            <td id="verificado" class="cell-center"></td> 
            <td id="articulosEliminado" style="display: none;">${detalle.ARTICULO_ELIMINADO}</td> 
        `;
    tbody.appendChild(newRow);
  });
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function limpiarMensajes() {
  localStorage.removeItem("mensajes");
  const mensajeTextArea = document.getElementById("mensajeText");
  if(mensajeTextArea) mensajeTextArea.value = "";
  
  guardarTablaEnArray();
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
// function verificacion() {
//   var dataArray = JSON.parse(localStorage.getItem("dataArray")) || [];
//   const tabla = document.getElementById("myTableVerificacion");

//   if (tabla) {
//     const tbody = tabla.querySelector("tbody");

//     if(tbody) {
//         const filas = tbody.querySelectorAll("tr");
//         filas.forEach((fila) => {
//           const cantidadLeidaCell = fila.querySelector("#cantidadLeida");
//           const verifcheck = fila.querySelector("#verificado");
//           if (cantidadLeidaCell) cantidadLeidaCell.textContent = ""; 
//           if (verifcheck) verifcheck.textContent = ""; 
//         });
//     }
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

//   var pedidoList = detallePedidoList;
//   const mensajesArray = [];
//   let contadorMensajes = 1; 

//   resultadoArray.forEach((resultado) => {
//     const pedido = pedidoList.find(
//       (pedido) =>
//         pedido.ARTICULO === resultado.ARTICULO &&
//         parseFloat(pedido.CANTIDAD_PEDIDA) === parseFloat(resultado.CANTIDAD_LEIDA)
//     );

//     if (pedido) {
//       const tabla = document.getElementById("myTableVerificacion");
//       if (tabla) {
//         const tbody = tabla.querySelector("tbody");
//         const filas = tbody.querySelectorAll("tr");

//         filas.forEach((fila) => {
//           const celdaARTICULO = fila.querySelector("#verifica-articulo");
//           if (celdaARTICULO && celdaARTICULO.textContent === resultado.ARTICULO) {
//             const celdaVerificado = fila.querySelector("#verificado");
//             if (celdaVerificado) {
//               celdaVerificado.textContent = "";
//               const spanVerificacion = document.createElement("span");
//               spanVerificacion.classList.add("material-icons");
//               spanVerificacion.textContent = "done_all";
//               spanVerificacion.style.color = "#16a34a"; // Verde moderno
//               spanVerificacion.style.fontSize = "22px";
//               celdaVerificado.appendChild(spanVerificacion);
//             }
//             const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");
//             if (cantidadVerificadaCell) {
//               cantidadVerificadaCell.textContent = parseFloat(resultado.CANTIDAD_LEIDA).toFixed(2);
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
//           const celdaARTICULO = fila.querySelector("#verifica-articulo");
//           if (celdaARTICULO && celdaARTICULO.textContent === resultado.ARTICULO) {
//             const celdaVerificado = fila.querySelector("#verificado");
//             const cantPedida = fila.querySelector("#cantidadPedida");
//             const cantidadVerificadaCell = fila.querySelector("#cantidadLeida");

//             if (parseFloat(resultado.CANTIDAD_LEIDA) > parseFloat(cantPedida.textContent)) {
//               var resultadoOperacion = "+" + (resultado.CANTIDAD_LEIDA - parseFloat(cantPedida.textContent)).toFixed(2);
//               celdaVerificado.textContent = resultadoOperacion;
//               celdaVerificado.style.color = "#dc2626"; // Rojo alerta
//               celdaVerificado.style.fontWeight = "bold";
              
//               const mensaje = `${contadorMensajes}. La cantidad verificada del artículo ${resultado.ARTICULO} es MAYOR a la solicitada.`;
//               mensajesArray.push(mensaje);
//               contadorMensajes++; 
//             } else if (resultado.CANTIDAD_LEIDA < parseFloat(cantPedida.textContent)) {
//               var resultadoOperacion = (resultado.CANTIDAD_LEIDA - parseFloat(cantPedida.textContent)).toFixed(2);
//               celdaVerificado.textContent = resultadoOperacion;
//               celdaVerificado.style.color = "#ea580c"; // Naranja alerta
//               celdaVerificado.style.fontWeight = "bold";
              
//               const mensaje = `${contadorMensajes}. La cantidad verificada del artículo ${resultado.ARTICULO} es MENOR a la solicitada.`;
//               mensajesArray.push(mensaje);
//               contadorMensajes++; 
//             }
//             if (cantidadVerificadaCell) {
//               cantidadVerificadaCell.textContent = parseFloat(resultado.CANTIDAD_LEIDA).toFixed(2);
//             }
//           }
//         });
//         localStorage.setItem("mensajes", JSON.stringify(mensajesArray));
//       }
//     }
//   });
  
//   activaDevolverArticulo();

//   const estadoPedidoElement = document.getElementById("estadoPedido");
//   const estadoPedidoText = estadoPedidoElement ? estadoPedidoElement.textContent : "";
//   const estadoPedidoParts = estadoPedidoText.split(":");
//   const estadoPedido = estadoPedidoParts.length > 1 ? estadoPedidoParts[1].trim() : estadoPedidoText.trim();
    
//   const procesarHabilitado = todasLasFilasVerificadas();
//   const pedidofinalizado = localStorage.getItem("pedidos_finalizados");
//   const guardarParcialHabilitado = activaGuardadoParcial();

//   // Controlar Visibilidad de Botones
//   const btnGuardar = document.getElementById("btnGuardar");
//   const btnProcesar = document.getElementById("btnProcesar");
//   const btnRegresar = document.getElementById("btnRegresar");

//   if (pedidofinalizado === "true" || pedidofinalizado === true) {
//     if (guardarParcialHabilitado) {
//       if(btnGuardar) btnGuardar.removeAttribute("hidden");
//     } else {
//       if(btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
//     }
    
//     if (procesarHabilitado && (estadoPedido === "F" || estadoPedido === "Facturado")) {
//       if(btnProcesar) btnProcesar.removeAttribute("hidden");
//     } else {
//       if(btnGuardar) btnGuardar.removeAttribute("hidden");
//       if(btnProcesar) btnProcesar.setAttribute("hidden", "hidden");
//     }
//   } else {
//     // Modo Solo Lectura/Visualización (Pedidos no finalizados/facturados)
//     if(btnRegresar) btnRegresar.removeAttribute("hidden");
//     if(btnGuardar) btnGuardar.setAttribute("hidden", "hidden");
//     if(btnProcesar) btnProcesar.setAttribute("hidden", "hidden");
//   }
// } 
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
            mensajesArray.push(`${contadorMensajes}. La cantidad leída de ${resultado.ARTICULO} es MAYOR a la solicitada.`);
            contadorMensajes++;
          } else if (leiVal < pedVal) {
            celdaVerif.textContent = (leiVal - pedVal).toFixed(2);
            celdaVerif.style.color = "#ea580c";
            celdaVerif.style.fontWeight = "bold";
            mensajesArray.push(`${contadorMensajes}. La cantidad leída de ${resultado.ARTICULO} es MENOR a la solicitada.`);
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
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
// Función para verificar si todas las filas tienen el ícono "fa-check" 
function todasLasFilasVerificadas() {
  const filas = document.querySelectorAll("#myTableVerificacion tbody tr");
  
  if (filas.length === 0) return false;

  for (let i = 0; i < filas.length; i++) {
    const celdaCantidadVerif = filas[i].querySelector("td#verificado");
    if(!celdaCantidadVerif) return false;

    const iconoVerificacion = celdaCantidadVerif.querySelector("span.material-icons");

    if (!iconoVerificacion || iconoVerificacion.textContent !== "done_all") {
      return false;
    }
  }
  return true;
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function activaGuardadoParcial() {
  const filas = document.querySelectorAll("#myTableVerificacion tbody tr");

  for (let i = 0; i < filas.length; i++) {
    const celdaCantidadPedida = filas[i].querySelector("td#cantidadPedida");
    const celdaCantidadLeida = filas[i].querySelector("td#cantidadLeida");

    if(!celdaCantidadPedida || !celdaCantidadLeida) continue;

    const valLeida = parseFloat(celdaCantidadLeida.textContent) || 0;
    const valPedida = parseFloat(celdaCantidadPedida.textContent) || 0;

    if (valLeida > valPedida) {
      return true;
    }
  }
  return false;
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function mostrarMensajesLocalStorage() {
  const mensajesStorage = localStorage.getItem("mensajes");
  const textarea = document.getElementById("mensajeText");
  
  if(!textarea) return;
  
  textarea.value = ""; 
  
  if (mensajesStorage) {
    const mensajes = JSON.parse(mensajesStorage);
    for (let i = 0; i < mensajes.length; i++) {
      textarea.value += mensajes[i] + "\n"; 
    }
  }
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
document.addEventListener('click', function (e) {
  if (e.target && e.target.id === 'btnTabVerificacion') {
      mostrarMensajesLocalStorage();
  }
});
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
window.onload = function () {
  guardarTablaEnArray();
};
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function confirmarGuardadoParcial() {
  Swal.fire({
    icon: "info",
    title: "¿Desea guardar parcialmente el pedido?",
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#0284c7", // Azul info
  }).then((result) => {
    if (result.isConfirmed) {
      guardaParcialMente();
      localStorage.removeItem("mensaje");
    }
  });
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function guardaParcialMente() {
  let pUsuario = document.getElementById("hUsuario").value;
  var pConsecutivoPed = localStorage.getItem("pedidoSelect");
  var pBodega = document.getElementById("bodega").value;

  var detalles = [];
  localStorage.removeItem("mensajes");

  let table = document.getElementById("myTableVerificacion");
  if(!table) return;

  for (let i = 1; i < table.rows.length; i++) {
    let row = table.rows[i];

    let objArticulo = row.querySelector("#verifica-articulo");
    let articulo = objArticulo ? objArticulo.textContent.trim() : "";

    let objCantidadPedida = row.querySelector("#cantidadPedida");
    let cantidadPedida = objCantidadPedida ? objCantidadPedida.textContent.trim() : "0";

    let objCantidadLeida = row.querySelector("#cantidadLeida");
    let cantidadLeida = objCantidadLeida ? objCantidadLeida.textContent.trim() || 0 : 0;

    detalles.push({
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_LEIDA: cantidadLeida,
    });
  }
  
  var jsonDetalles = JSON.stringify(detalles);

  const params =
    "?pUsuario=" + pUsuario +
    "&pConsecutivoPed=" + pConsecutivoPed +
    "&jsonDetalles=" + jsonDetalles +
    "&pBodega=" + pBodega;

  fetch(env.API_URL + "wmsguardadopedidos/G" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
          Swal.fire({
            icon: "success",
            title: "Datos guardados correctamente",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#28a745",
          }).then((result) => {
            if (result.isConfirmed) {
              localStorage.setItem("autoSearchPedidos", "true");
              //window.location.href = "verificacionDePedidos.html";
            }
          });
      }
    });
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function confirmaProcesar() {
  Swal.fire({
    icon: "warning",
    title: "¿Desea procesar el pedido de manera definitiva?",
    showCancelButton: true,
    confirmButtonText: "Procesar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
  }).then((result) => {
    if (result.isConfirmed) {
      procesar();
    }
  });
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function procesar() {
  let pUsuario = document.getElementById("hUsuario").value;
  var pConsecutivoPed = localStorage.getItem("pedidoSelect");
  var pBodega = document.getElementById("bodega").value;
  var detalles = [];

  let table = document.getElementById("myTableVerificacion");
  if(!table) return;

  for (let i = 1; i < table.rows.length; i++) {
    let row = table.rows[i];

    let objArticulo = row.querySelector("#verifica-articulo");
    let articulo = objArticulo ? objArticulo.textContent.trim() : "";

    let objCantidadPedida = row.querySelector("#cantidadPedida");
    let cantidadPedida = objCantidadPedida ? objCantidadPedida.textContent.trim() : "0";

    let objCantidadLeida = row.querySelector("#cantidadLeida");
    let cantidadLeida = objCantidadLeida ? objCantidadLeida.textContent.trim() || 0 : 0;

    detalles.push({
      ARTICULO: articulo,
      CANT_CONSEC: cantidadPedida,
      CANT_LEIDA: cantidadLeida,
    });
  }

  var jsonDetalles = JSON.stringify(detalles);

  const params =
    "?pUsuario=" + pUsuario +
    "&pConsecutivoPed=" + pConsecutivoPed +
    "&jsonDetalles=" + jsonDetalles +
    "&pBodega=" + pBodega;

  fetch(env.API_URL + "wmsguardadopedidos/P" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        Swal.fire({
          icon: "success", // Cambiado a 'success' para mejor Feedback
          title: "Procesado con éxito",
          text: `${result.pedidoprocesado[0].Respuesta}`,
          confirmButtonText: "Finalizar",
          confirmButtonColor: "#28a745",
        }).then((result) => {
          if (result.isConfirmed) {
            localStorage.setItem("autoSearchPedidos", "true");
            window.location.href = "verificacionDePedidos.html";
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error al procesar el pedido",
          confirmButtonText: "Cerrar",
          confirmButtonColor: "#ef4444",
        });
      }
    });
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function activaDevolverArticulo() {
  var table = document.getElementById("tblbodyVerificacion");
  if(!table) return;
  for (var i = 0; i < table.rows.length; i++) {
    var celdaEliminado = table.rows[i].cells[5];
    if(!celdaEliminado) continue;
    
    var valorEliminado = celdaEliminado.innerText.trim();

    if (valorEliminado.toUpperCase() === "S") {
      var objArticulo = table.rows[i].cells[0].querySelector("#verifica-articulo");
      var articulo = objArticulo ? objArticulo.innerText.trim() : "";
      
      table.rows[i].cells[4].innerHTML =
        '<i class="material-icons" style="color: #ef4444; cursor: pointer; font-size: 22px;" onclick="devolverArticulo(\'' +
        articulo +
        "')\">settings_backup_restore</i>";
    }
  }
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function devolverArticulo(articulo) {
  let table = document.getElementById("myTableVerificacion");
  let pPedido = localStorage.getItem("pedidoSelect");
  let pArticulo = articulo;

  swal.fire({
      title: "Devolver Artículo",
      text: "¿Estás seguro de devolver el artículo " + pArticulo + " del pedido número " + pPedido + "?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, devolver",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#28a745",
    })
    .then((result) => {
      if (result.isConfirmed) {
        const params = "?pPedido=" + pPedido + "&pArticulo=" + pArticulo;

        fetch(env.API_URL + "devolverarticulo/D" + params, myInit)
          .then((response) => response.json())
          .then((result) => {
            if (result.msg === "SUCCESS") {
              if (result.articulodevuelto.length != 0) {
                Swal.fire({
                  icon: "success",
                  title: "Artículo Devuelto con éxito",
                  confirmButtonText: "Continuar",
                  confirmButtonColor: "#28a745",
                });
                for (var i = 1; i < table.rows.length; i++) {
                  var objArticuloFila = table.rows[i].cells[0].querySelector("#verifica-articulo");
                  var articuloEnFila = objArticuloFila ? objArticuloFila.innerText.trim() : "";

                  if (articuloEnFila === articulo) {
                    table.deleteRow(i);
                    break; 
                  }
                }
              }
            } else {
              Swal.fire({
                icon: "error",
                title: "Error al procesar el pedido",
                confirmButtonText: "Cerrar",
                confirmButtonColor: "#ef4444",
              });
            }
          });
      }
    });
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
function confirmaRegresar() {
  localStorage.setItem("autoSearchPedidos", "true");
  localStorage.removeItem("mensajes");
  window.location.href = "verificacionDePedidos.html";
}

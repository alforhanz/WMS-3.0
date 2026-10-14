let columnaOrdenada = "";
let ordenAscendente = true;
var paquetesCreadosArray = [];
let dataOriginal = [];

document.addEventListener("DOMContentLoaded", function () {
  console.log("Consulta de creación de Paquetes DOM cargado...");
  const parametrosBusqueda = localStorage.getItem("parametrosBusquedaPaquete");

  if (parametrosBusqueda) {
    const params = new URLSearchParams(parametrosBusqueda);
    const pSistema = params.get("pSistema") ?? "WMS";
    const pUsuario = params.get("pUsuario") ?? "";
    const pOpcion = params.get("pOpcion") ?? "";
    const fechaIni = params.get("fechaIni") ?? "";
    const fechaFin = params.get("fechaFin") ?? "";
    const BodegaOrigen = params.get("BodegaOrigen") ?? "";
    const BodegaDestino = params.get("BodegaDestino") ?? "";
    const Aplicacion = params.get("Aplicacion") ?? "";

    if (fechaIni) document.getElementById("fecha_ini").value = fechaIni;
    if (fechaFin) document.getElementById("fecha_fin").value = fechaFin;
    if (Aplicacion) document.getElementById("Aplicacion").value = Aplicacion;

    const opcVista = document.getElementById("vistaResumida");
    if (opcVista) {
      opcVista.checked = (pOpcion === "R");
    }

    setTimeout(() => {
      M.updateTextFields();
      const inputs = document.querySelectorAll(".datepicker");
      inputs.forEach((input) => {
        const fechaGuardada = input.id === "fecha_ini" ? fechaIni : fechaFin;
        if (fechaGuardada) {
          const dateParts = fechaGuardada.split("-");
          const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
          M.Datepicker.init(input, {
            format: "yyyy-mm-dd",
            defaultDate: d,
            setDefaultDate: true,
            autoClose: true
          });
        }
      });
    }, 100);

    const para =
      "?pSistema=" + pSistema +
      "&pUsuario=" + pUsuario +
      "&pOpcion=" + pOpcion +
      "&fechaIni=" + fechaIni +
      "&fechaFin=" + fechaFin +
      "&BodegaOrigen=" + BodegaOrigen +
      "&BodegaDestino=" + BodegaDestino +
      "&Aplicacion=" + Aplicacion;

    enviarDatosControlador(para);
  }

  const buscador = document.getElementById("txtBuscadorTabla");
  if (buscador) {
    buscador.addEventListener("keyup", function (e) {
      const texto = e.target.value.toLowerCase().trim();

      const dataFiltrada = dataOriginal.filter((fila) => {
        return Object.values(fila).some((valor) =>
          String(valor).toLowerCase().includes(texto)
        );
      });

      armarTablaResultados(dataFiltrada, true);
    });
  }

  cargarBodegas();
});

function cargarParametros() {
  let pSistema = "WMS";
  let hUser = document.getElementById("hUsuario");
  let pUsuario = hUser ? hUser.value : "";
  let opc = document.getElementById("vistaResumida");
  let pOpcion = (opc && opc.checked) ? "R" : "DD";
  let fechaIni = $("#fecha_ini").val() || "";
  let fechaFin = $("#fecha_fin").val() || "";
  let BodegaOrigen = document.getElementById("bodega") ? document.getElementById("bodega").value : "";
  let BodegaDestino = document.getElementById("bodegaSelectPack") ? document.getElementById("bodegaSelectPack").value : "";
  let Aplicacion = $("#Aplicacion").val() ? $("#Aplicacion").val().trim() : "";

  const params =
    "?pSistema=" + pSistema +
    "&pUsuario=" + pUsuario +
    "&pOpcion=" + pOpcion +
    "&fechaIni=" + fechaIni +
    "&fechaFin=" + fechaFin +
    "&BodegaOrigen=" + BodegaOrigen +
    "&BodegaDestino=" + BodegaDestino +
    "&Aplicacion=" + Aplicacion;

  enviarDatosControlador(params);
}

function enviarDatosControlador(params) {
  if (typeof mostrarLoader === "function") mostrarLoader("Consultando paquetes...");
  localStorage.setItem("parametrosBusquedaPaquete", params);

  fetch(env.API_URL + "busquedadePaquetes" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        paquetesCreadosArray = result.respuesta || [];
        if (paquetesCreadosArray.length !== 0) {
          armarTablaResultados(paquetesCreadosArray);
        } else {
          limpiarResultadoGeneral();
          Swal.fire({
            icon: "info",
            title: "Sin registros",
            text: "No hay registros asignados para los criterios seleccionados.",
            confirmButtonColor: "#28a745"
          });
        }
      } else {
        limpiarResultadoGeneral();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Se registró un error al consultar el servicio.",
          confirmButtonColor: "#ef4444"
        });
      }
    })
    .catch((err) => {
      console.error("Error en consulta de paquetes:", err);
      limpiarResultadoGeneral();
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function cargarBodegas() {
  fetch(env.API_URL + "wmsmostarbodegasconsultaordencompra", myInit)
    .then((response) => response.json())
    .then((data) => {
      const bodegasSelect = document.getElementById("bodegaSelectPack");
      if (data.respuesta && Array.isArray(data.respuesta) && bodegasSelect) {
        bodegasSelect.innerHTML = '<option value="" disabled selected>Seleccione una bodega</option>';
        data.respuesta.forEach((bodega) => {
          const option = document.createElement("option");
          option.value = bodega.BODEGA;
          option.textContent = `${bodega.BODEGA} - ${bodega.NOMBRE}`;
          bodegasSelect.appendChild(option);
        });

        const parametrosBusqueda = localStorage.getItem("parametrosBusquedaPaquete");
        if (parametrosBusqueda) {
          const p = new URLSearchParams(parametrosBusqueda);
          const bDest = p.get("BodegaDestino");
          if (bDest) bodegasSelect.value = bDest;
        }
      }
    })
    .catch((error) => console.error("Error al cargar bodegas:", error));
}

function armarTablaResultados(data, esFiltro = false) {
  if (!esFiltro) {
    dataOriginal = data;
  }

  const tabla = document.getElementById("tblResultados");
  const tbody = document.getElementById("tblbodyResultados");
  const txtObservaciones = document.getElementById("observaciones");
  const cantidadLabel = document.getElementById("cantidadDeRegistros");

  if (!tabla || !tbody) return;

  const tableHeadRow = tabla.querySelector("thead tr");
  tableHeadRow.innerHTML = "";
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    if (cantidadLabel) cantidadLabel.textContent = "Registros: 0";
    if (txtObservaciones) txtObservaciones.value = "";
    const tfoot = tabla.querySelector("tfoot");
    if (tfoot) tfoot.innerHTML = "";
    $("#resultadoPaginador").empty();
    return;
  }

  if (cantidadLabel) {
    cantidadLabel.textContent = "Registros: " + data.length;
  }

  // Observaciones únicas
  if (txtObservaciones && !esFiltro) {
    const refsUnicas = [...new Set(data
      .map((item) => (item.REFERENCIA || item.referencia || "").toString().trim())
      .filter((val) => val !== "" && val.toLowerCase() !== "comentario" && val.toLowerCase() !== "null")
    )];
    txtObservaciones.value = refsUnicas.join(" | ");
  }

  // Filtrar columnas para excluir REFERENCIA
  const columnas = Object.keys(data[0]).filter((col) => col.toUpperCase() !== "REFERENCIA");

  // Construir encabezados con ordenamiento
  columnas.forEach((columna) => {
    const th = document.createElement("th");
    th.style.cursor = "pointer";

    const colUpper = columna.toUpperCase();
    if (colUpper.includes("CANT") || colUpper.includes("DIF")) {
      th.style.textAlign = "right";
    } else if (colUpper.includes("FECHA") || colUpper === "BODEGA") {
      th.style.textAlign = "center";
    } else {
      th.style.textAlign = "left";
    }

    let indicador = (columna === columnaOrdenada) ? (ordenAscendente ? " 🔼" : " 🔽") : "";
    th.textContent = columna.replace(/_/g, " ").toUpperCase() + indicador;

    th.onclick = () => {
      if (columnaOrdenada === columna) {
        ordenAscendente = !ordenAscendente;
      } else {
        columnaOrdenada = columna;
        ordenAscendente = true;
      }

      const dataOrdenada = [...data].sort((a, b) => {
        let valA = a[columna] ?? "";
        let valB = b[columna] ?? "";

        if (!isNaN(valA) && !isNaN(valB) && valA !== "" && valB !== "") {
          return ordenAscendente ? valA - valB : valB - valA;
        }
        return ordenAscendente
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });

      armarTablaResultados(dataOrdenada, true);
    };
    tableHeadRow.appendChild(th);
  });

  // Construir cuerpo de la tabla
  data.forEach((item) => {
    const row = document.createElement("tr");
    row.style.cursor = "pointer";

    row.onclick = () => {
      const idRef = item.TRASLADO || item.CONTENEDOR || "";
      if (idRef) irAlDetalle(idRef);
    };

    columnas.forEach((columna) => {
      const td = document.createElement("td");
      let valor = item[columna] ?? "";
      const colUpper = columna.toUpperCase();

      if (!isNaN(valor) && valor !== "" && (colUpper.includes("CANT") || colUpper.includes("DIF"))) {
        td.textContent = parseFloat(valor).toFixed(2);
        td.className = "cell-number";

        if (colUpper.includes("DIF")) {
          const num = parseFloat(valor);
          if (num < 0) {
            td.style.color = "#dc2626";
            td.style.fontWeight = "700";
          } else if (num > 0) {
            td.style.color = "#16a34a";
            td.style.fontWeight = "700";
          }
        }
      } else if (colUpper.includes("FECHA") || colUpper === "BODEGA") {
        td.textContent = valor;
        td.className = "cell-center";
      } else {
        td.textContent = valor;
        td.style.textAlign = "left";
      }

      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  armaTotales(data, columnas);

  // Paginador tipo select
  $("#resultadoPaginador").empty();
  if ($.fn.pageMe) {
    $("#tblResultados tbody").pageMe({
      pagerSelector: "#resultadoPaginador",
      perPage: typeof xPag !== "undefined" ? xPag : 20
    });
  }
}

function irAlDetalle(Aplicacion) {
  localStorage.setItem("ConsecutivoPaquete", Aplicacion);
  window.location.href = "detalle_paquete.html";
}

function limpiarResultadoGeneral() {
  const tbody = document.getElementById("tblbodyResultados");
  const thead = document.querySelector("#tblResultados thead tr");
  const tfoot = document.querySelector("#tblResultados tfoot");
  const resultadoPaginador = document.getElementById("resultadoPaginador");
  const totalRegistros = document.getElementById("cantidadDeRegistros");
  const txtObs = document.getElementById("observaciones");

  if (resultadoPaginador) resultadoPaginador.innerHTML = "";
  if (totalRegistros) totalRegistros.textContent = "Registros: 0";
  if (tbody) tbody.innerHTML = "";
  if (thead) thead.innerHTML = "";
  if (tfoot) tfoot.innerHTML = "";
  if (txtObs) txtObs.value = "";

  localStorage.removeItem("parametrosBusquedaPaquete");
}

function armaTotales(data, columnas) {
  const tabla = document.getElementById("tblResultados");
  if (!tabla) return;

  let tfoot = tabla.querySelector("tfoot");
  if (!tfoot) {
    tfoot = document.createElement("tfoot");
    tabla.appendChild(tfoot);
  }
  tfoot.innerHTML = "";

  const row = document.createElement("tr");
  row.style.backgroundColor = "#e2e8f0";
  row.style.fontWeight = "bold";
  row.style.borderTop = "2px solid #cbd5e1";

  const columnasASumar = ["CANT_PREPARADA", "CANT_SOLICITADA", "CANT_VERIFICADA", "DIFERENCIA", "DIF"];

  columnas.forEach((columna, index) => {
    const td = document.createElement("td");
    const nombreCol = columna.toUpperCase();
    const debeSumar = columnasASumar.some((c) => c.toUpperCase() === nombreCol);

    if (debeSumar) {
      const total = data.reduce((acc, item) => {
        const val = parseFloat(item[columna]) || 0;
        return acc + val;
      }, 0);

      td.textContent = total.toFixed(2);
      td.className = "cell-number";
      td.style.fontSize = "13px";
    } else {
      if (index === 0) {
        td.textContent = "TOTALES";
        td.style.textAlign = "left";
        td.style.paddingLeft = "12px";
        td.style.fontSize = "12px";
      } else {
        td.textContent = "";
      }
    }
    row.appendChild(td);
  });

  tfoot.appendChild(row);
}

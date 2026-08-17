function armarTablaVerificacion(detalleLineasContenedor) {
  actualizarProgresoLectura();

  var tbody = document.getElementById("tblbodyLineasContenedor");
  tbody.innerHTML = "";

  var cantidadDeRegistrosLabel = document.getElementById("cantidadDeRegistros");
  if (cantidadDeRegistrosLabel) {
    cantidadDeRegistrosLabel.textContent =
      "Cantidad de registros: " + detalleLineasContenedor.length;
  }

  detalleLineasContenedor.forEach(function (detalle) {
    var newRow = document.createElement("tr");

    var consecutivo = parseFloat(detalle.LineaConsecutivo) || 0;
    var contada = parseFloat(detalle.LineaContada) || 0;
    var mostrarLineaContada = contada === 0 ? "" : contada.toFixed(2);
    var estanCompletos = consecutivo === contada && consecutivo > 0;

    var colorTextoHtml = estanCompletos ? 'style="color: #4caf50;"' : "";
    var claseArticulo = estanCompletos ? "" : 'class="blue-text text-darken-2 centered"';
    var contenidoVerificado = estanCompletos
      ? '<span class="material-icons" style="color: #4caf50;">done_all</span>'
      : "";

    if (detalle.total_cedi > 0) {
      newRow.innerHTML = `
            <td id="articulo" ${colorTextoHtml}>
              <h5 id="verifica-articulo">
                <span ${claseArticulo} ${estanCompletos ? 'style="color: #4caf50;"' : ""}>${detalle.Articulo}</span>
              </h5>
              <h6 ${estanCompletos ? 'style="color: #4caf50;"' : ""}>${detalle.Descripcion}</h6>
            </td>
            <td id="codigoDeBarras" ${colorTextoHtml}>${detalle.Codigo_Barra || ""}</td>
            <td id="cantidadPedida" ${colorTextoHtml}>${consecutivo.toFixed(2)}</td>
            <td id="cantidadLeida" ${colorTextoHtml}>${mostrarLineaContada}</td> 
            <td id="totalCedi" ${colorTextoHtml}>${
              isNaN(parseFloat(detalle.total_cedi))
                ? "0.00"
                : parseFloat(detalle.total_cedi).toFixed(2)
            }</td>
            <td id="verificado">${contenidoVerificado}</td> 
            <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
            <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
    } else {
      var claseArticuloRed = estanCompletos ? "" : 'class="red-text text-darken-4 centered"';
      var claseDescripcionRed = estanCompletos ? "" : 'class="red-text text-darken-4"';
      var claseCeldasRed = estanCompletos ? "" : 'class="red-text text-darken-4"';

      newRow.innerHTML = `
            <td id="articulo" contenteditable="false" ${colorTextoHtml}>
              <h5 id="verifica-articulo">
                <span ${claseArticuloRed} ${estanCompletos ? 'style="color: #4caf50;"' : ""}>${detalle.Articulo}</span>
              </h5>
              <h6 ${claseDescripcionRed} ${estanCompletos ? 'style="color: #4caf50;"' : ""}>${detalle.Descripcion}</h6>
            </td>
            <td id="codigoDeBarras" contenteditable="false" ${estanCompletos ? colorTextoHtml : claseCeldasRed}>${
              detalle.Codigo_Barra || ""
            }</td>
            <td id="cantidadPedida" contenteditable="false" ${estanCompletos ? colorTextoHtml : claseCeldasRed}>${consecutivo.toFixed(2)}</td>
            <td id="cantidadLeida" contenteditable="false" ${estanCompletos ? colorTextoHtml : claseCeldasRed}>${mostrarLineaContada}</td> 
            <td id="totalCedi" ${colorTextoHtml}>0.00</td>
            <td id="verificado" contenteditable="false">${contenidoVerificado}</td> 
            <td id="articulosEliminado" hidden>${detalle.ARTICULO_ELIMINADO}</td> 
            <td id="solicitud" hidden>${detalle.Solicitud}</td>`;
    }
    tbody.appendChild(newRow);
  });

  actualizarTotalesTablaVerificacion();
}
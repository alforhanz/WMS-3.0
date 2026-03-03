const check_switch = document.getElementById("arti_Kit");

document.addEventListener('DOMContentLoaded', function() {
      // Inicializar Selects de Materialize
      var elems = document.querySelectorAll('select');
      M.FormSelect.init(elems);
    });
        // Ejemplo de cómo llenar el select cuando se escriba el artículo
document.getElementById('pArticulo').addEventListener('blur', function() {
              const articulo = this.value;
              if(articulo) {
                  cargarCodigosRelacionados(articulo);
              }
    });    
// Evento al elegir un código del select
document.getElementById('selectBarcodes').addEventListener('change', function() {
    const codigoSeleccionado = this.value;
    if(!codigoSeleccionado) return;

    Swal.fire({
        title: `Código: ${codigoSeleccionado}`,
        text: "¿Deseas cargar este código o eliminarlo del sistema?",
        icon: 'info',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '<i class="material-icons left">check</i> Cargar',
        denyButtonText: '<i class="material-icons left">delete</i> Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2e7d32', // Verde
        denyButtonColor: '#c62828',    // Rojo
    }).then((result) => {
        if (result.isConfirmed) {
            // Acción: Cargar
            document.getElementById('pCodigoBarra').value = codigoSeleccionado;
            M.updateTextFields();
             document.getElementById('autorizacion').value="";
            document.getElementById('autorizacion').focus();
        } else if (result.isDenied) {
            // Acción: Eliminar
            confirmarEliminacion(codigoSeleccionado);
        }
        
        // Limpiamos el select para que pueda volver a elegir el mismo si quiere
        this.value = "";
        M.FormSelect.init(this);
    });
    });

// Función para llamar a tu API de borrado
function confirmarEliminacion(codigo) {  

    Swal.fire({
        title: '¿Estás seguro?',
        text: `Se eliminará el código ${codigo} permanentemente.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonColor: '#d33',
    }).then((result) => {
        if (result.isConfirmed) {
           eliminarCodigoDeBarra(codigo);            
        }
    });
}


function eliminarCodigoDeBarra(codigo) {
    const articulo = document.getElementById("pArticulo").value;
    const sistema = "WMS";
    const usuario = document.getElementById("hUsuario").value;

    // 1. Solicitamos la clave antes de cualquier fetch
    Swal.fire({
        title: 'Confirmar Eliminación',
        text: `Ingrese su clave para eliminar el código: ${codigo}`,
        input: 'password', // Tipo password para ocultar los caracteres
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33', // Rojo para advertir peligro
        showLoaderOnConfirm: true,
        preConfirm: (clave) => {
            if (!clave) {
                Swal.showValidationMessage('La clave es obligatoria');
                return false;
            }
            return clave; // Pasamos la clave al siguiente bloque
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            const contrasenaSegura = result.value;

            // 2. Construimos los parámetros con la clave obtenida del Swal
            const params = `?pSistema=${sistema}&pUsuario=${usuario}&pClave=${encodeURIComponent(contrasenaSegura)}&pArticulo=${encodeURIComponent(articulo)}&pCodigoBarra=${encodeURIComponent(codigo)}`;

            // 3. Ejecutamos el Fetch
            fetch(env.API_URL + "wmsdelcodigosbarra" + params, myInit) // Asegúrate que el endpoint sea el de eliminar
                .then((response) => response.json())
                .then((data) => {
                    const mensajeRespuesta = data.resultado[0].Mensaje;

                    if (mensajeRespuesta === "OK") {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: `El código ${codigo} ha sido removido del sistema.`,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        // Refrescamos la lista del select
                        cargarCodigosRelacionados(articulo);
                    } else {
                        // Si el SP devuelve "Usuario no autorizado" o cualquier otro error
                        Swal.fire('Error', mensajeRespuesta, 'error');
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                    Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
                });
        }
    });
}

function cargarCodigosRelacionados(codigoArt) {
  const select = document.getElementById('selectBarcodes');
  const params = `?pArticulo=${encodeURIComponent(codigoArt)}`;

  // 1. Limpiamos el select y ponemos un mensaje de "Cargando..."
  select.innerHTML = '<option value="" disabled selected>Buscando códigos...</option>';
  M.FormSelect.init(select);

  fetch(env.API_URL + "wmsobtienecodigosbarra" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      // 2. Limpiamos el select para llenarlo con datos reales
      select.innerHTML = '<option value="" disabled selected>Seleccione un código</option>';

      if (result.msg === "SUCCESS" && result.resultado && result.resultado.length > 0) {
        
        result.resultado.forEach(item => {
          let opt = document.createElement('option');
          opt.value = item.CODIGO_BARRAS; // Usamos el campo exacto de tu JSON
          opt.innerHTML = item.CODIGO_BARRAS;
          
          // Opcional: Mostrar de dónde viene el código (Creado en S o C)
          // opt.innerHTML = `${item.CODIGO_BARRAS} (${item.CreadoEN})`;

          // Icono decorativo de Materialize
          opt.setAttribute('data-icon', 'img/icon/bar-code.svg');
          opt.className = "left"; 
          
          select.appendChild(opt);
        });

      } else {
        // Si no hay resultados
        let opt = document.createElement('option');
        opt.value = "";
        opt.innerHTML = "Sin códigos asociados";
        opt.disabled = true;
        select.appendChild(opt);
      }

      // 3. ¡VITAL! Reinicializar Materialize DENTRO del .then
      M.FormSelect.init(select);
    })
    .catch(error => {
      console.error("Error al obtener códigos:", error);
      select.innerHTML = '<option value="" disabled selected>Error al cargar</option>';
      M.FormSelect.init(select);
    });
}

function InsertaCodigoBarra() {
  const usuario = document.getElementById("hUsuario").value;
  const contrasena = document.getElementById("autorizacion").value;
  const articulo = document.getElementById("pArticulo").value;
  const codigoBarra = document.getElementById("pCodigoBarra").value;
  const switchCodigo = localStorage.getItem("arti_Kit");

  let pOpcion = switchCodigo === "true" ? "T" : "K";

  const params = `?pUsuario=${usuario}&pClave=${contrasena}&pArticulo=${articulo}&pCodigoBarra=${codigoBarra}&pOpcion=${pOpcion}`;

  fetch(env.API_URL + "wmsinsertacodigobarra" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      console.log("rESULTADO\n" + result.codigobarra[0].Mensaje);
      if (result.msg === "SUCCESS") {
        Swal.fire({
          position: "centered",
          icon: "success",
          title: `${result.codigobarra[0].Mensaje}`,
          showConfirmButton: false,
          timer: 2000,
        });
        clearScreen();
      }
    });
}

// Agregar un evento de cambio al checkbox
check_switch.addEventListener("change", function () {
  handleSwitchChange();
});

function handleSwitchChange() {
  const originalCheckedState = check_switch.checked;

  Swal.fire({
    title:
      "¿Desea ingresar un código de barras para un artículo por kits o cajas?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "No",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6e7881",
  }).then((result) => {
    if (result.isConfirmed) {
      // Si el usuario confirma, se mantiene el valor cambiado
      localStorage.setItem("arti_Kit", check_switch.checked);
    } else {
      // Si el usuario cancela, se restablece el estado original del switch
      check_switch.checked = originalCheckedState;
      localStorage.setItem("arti_Kit", originalCheckedState);
    }
  });
}
function clearScreen() {
    document.getElementById("autorizacion").value = "";
    document.getElementById("pArticulo").value = "";
    document.getElementById("pCodigoBarra").value = "";
    
    const select = document.getElementById('selectBarcodes');
    select.innerHTML = '<option value="" disabled selected>Seleccione un código</option>';
    M.FormSelect.init(select);
}

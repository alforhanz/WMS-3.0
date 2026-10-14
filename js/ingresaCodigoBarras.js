const check_switch = document.getElementById("arti_Kit");

document.addEventListener("DOMContentLoaded", function () {
  localStorage.setItem("arti_Kit", "false");

  const inputArticulo = document.getElementById("pArticulo");
  if (inputArticulo) {
    inputArticulo.addEventListener("blur", function () {
      const articulo = this.value.trim();
      if (articulo) {
        cargarCodigosRelacionados(articulo);
      }
    });

    inputArticulo.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const articulo = this.value.trim();
        if (articulo) {
          cargarCodigosRelacionados(articulo);
          document.getElementById("pCodigoBarra")?.focus();
        }
      }
    });
  }

  const selectBarcodes = document.getElementById("selectBarcodes");
  if (selectBarcodes) {
    selectBarcodes.addEventListener("change", function () {
      const codigoSeleccionado = this.value;
      if (!codigoSeleccionado) return;

      Swal.fire({
        title: `Código: ${codigoSeleccionado}`,
        text: "¿Deseas cargar este código o eliminarlo del sistema?",
        icon: "info",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '<i class="material-icons left">check</i> Cargar',
        denyButtonText: '<i class="material-icons left">delete</i> Eliminar',
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#28a745",
        denyButtonColor: "#dc2626"
      }).then((result) => {
        if (result.isConfirmed) {
          const inputCod = document.getElementById("pCodigoBarra");
          const inputAuth = document.getElementById("autorizacion");
          if (inputCod) inputCod.value = codigoSeleccionado;
          if (inputAuth) {
            inputAuth.value = "";
            inputAuth.focus();
          }
        } else if (result.isDenied) {
          confirmarEliminacion(codigoSeleccionado);
        }

        this.value = "";
      });
    });
  }

  if (check_switch) {
    check_switch.addEventListener("change", handleSwitchChange);
  }
});

function handleSwitchChange() {
  const originalCheckedState = check_switch.checked;

  Swal.fire({
    title: "¿Cambiar modo de código?",
    text: originalCheckedState
      ? "Se configurará el código para lectura por Kit o Caja."
      : "Se configurará el código para lectura por Artículo individual.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, cambiar",
    cancelButtonText: "No, mantener",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#64748b"
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.setItem("arti_Kit", check_switch.checked ? "true" : "false");
    } else {
      check_switch.checked = !originalCheckedState;
      localStorage.setItem("arti_Kit", check_switch.checked ? "true" : "false");
    }
  });
}

function cargarCodigosRelacionados(codigoArt) {
  const select = document.getElementById("selectBarcodes");
  if (!select) return;

  const params = `?pArticulo=${encodeURIComponent(codigoArt)}`;
  select.innerHTML = '<option value="" disabled selected>Buscando códigos...</option>';

  fetch(env.API_URL + "wmsobtienecodigosbarra" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      select.innerHTML = '<option value="" disabled selected>Seleccione un código</option>';

      if (result.msg === "SUCCESS" && Array.isArray(result.resultado) && result.resultado.length > 0) {
        result.resultado.forEach((item) => {
          let opt = document.createElement("option");
          opt.value = item.CODIGO_BARRAS;
          opt.textContent = item.CODIGO_BARRAS;
          select.appendChild(opt);
        });
      } else {
        let opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Sin códigos asociados";
        opt.disabled = true;
        select.appendChild(opt);
      }
    })
    .catch((error) => {
      console.error("Error al obtener códigos:", error);
      select.innerHTML = '<option value="" disabled selected>Error al cargar</option>';
    });
}

function confirmarEliminacion(codigo) {
  Swal.fire({
    title: "¿Estás seguro?",
    text: `Se eliminará el código ${codigo} permanentemente del artículo.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b"
  }).then((result) => {
    if (result.isConfirmed) {
      eliminarCodigoDeBarra(codigo);
    }
  });
}

function eliminarCodigoDeBarra(codigo) {
  const articulo = document.getElementById("pArticulo")?.value.trim() || "";
  const sistema = "WMS";
  const hUser = document.getElementById("hUsuario");
  const usuario = hUser ? hUser.value : "";

  Swal.fire({
    title: "Autorización Requerida",
    text: `Ingrese su clave para eliminar el código: ${codigo}`,
    input: "password",
    inputAttributes: {
      autocapitalize: "off",
      autocorrect: "off"
    },
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    showLoaderOnConfirm: true,
    preConfirm: (clave) => {
      if (!clave) {
        Swal.showValidationMessage("La clave es obligatoria");
        return false;
      }
      return clave;
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    if (result.isConfirmed) {
      const contrasenaSegura = result.value;
      const params = `?pSistema=${sistema}&pUsuario=${usuario}&pClave=${encodeURIComponent(contrasenaSegura)}&pArticulo=${encodeURIComponent(articulo)}&pCodigoBarra=${encodeURIComponent(codigo)}`;

      if (typeof mostrarLoader === "function") mostrarLoader("Eliminando código...");

      fetch(env.API_URL + "wmsdelcodigosbarra" + params, myInit)
        .then((response) => response.json())
        .then((data) => {
          const mensajeRespuesta = data.resultado?.[0]?.Mensaje || "Sin respuesta";

          if (mensajeRespuesta === "OK") {
            Swal.fire({
              title: "¡Eliminado!",
              text: `El código ${codigo} ha sido removido del sistema.`,
              icon: "success",
              timer: 2000,
              showConfirmButton: false
            });
            cargarCodigosRelacionados(articulo);
          } else {
            Swal.fire("Error", mensajeRespuesta, "error");
          }
        })
        .catch((error) => {
          console.error("Error al eliminar código:", error);
          Swal.fire("Error", "No se pudo procesar la solicitud", "error");
        })
        .finally(() => {
          if (typeof ocultarLoader === "function") ocultarLoader();
        });
    }
  });
}

function InsertaCodigoBarra() {
  const hUser = document.getElementById("hUsuario");
  const usuario = hUser ? hUser.value : "";
  const contrasena = document.getElementById("autorizacion")?.value.trim() || "";
  const articulo = document.getElementById("pArticulo")?.value.trim() || "";
  const codigoBarra = document.getElementById("pCodigoBarra")?.value.trim() || "";
  const switchCodigo = localStorage.getItem("arti_Kit");

  if (!articulo) {
    Swal.fire({
      icon: "warning",
      title: "Campo requerido",
      text: "Debe ingresar el código de artículo.",
      confirmButtonColor: "#28a745"
    });
    return;
  }

  if (!codigoBarra) {
    Swal.fire({
      icon: "warning",
      title: "Campo requerido",
      text: "Debe ingresar el nuevo código de barra.",
      confirmButtonColor: "#28a745"
    });
    return;
  }

  if (!contrasena) {
    Swal.fire({
      icon: "warning",
      title: "Autorización requerida",
      text: "Debe ingresar su clave de autorización.",
      confirmButtonColor: "#28a745"
    });
    return;
  }

  let pOpcion = switchCodigo === "true" ? "T" : "K";
  const params = `?pUsuario=${encodeURIComponent(usuario)}&pClave=${encodeURIComponent(contrasena)}&pArticulo=${encodeURIComponent(articulo)}&pCodigoBarra=${encodeURIComponent(codigoBarra)}&pOpcion=${pOpcion}`;

  if (typeof mostrarLoader === "function") mostrarLoader("Guardando código de barra...");

  fetch(env.API_URL + "wmsinsertacodigobarra" + params, myInit)
    .then((response) => response.json())
    .then((result) => {
      if (result.msg === "SUCCESS") {
        const mensaje = result.codigobarra?.[0]?.Mensaje || "";
        if (mensaje.toLowerCase().includes("exitosamente") || mensaje.toLowerCase().includes("correcto") || mensaje === "OK") {
          Swal.fire({
            position: "center",
            icon: "success",
            title: mensaje || "Código registrado exitosamente",
            showConfirmButton: false,
            timer: 2000
          });
          clearScreen();
        } else {
          Swal.fire({
            position: "center",
            icon: "warning",
            title: mensaje || "No se pudo insertar el código",
            confirmButtonColor: "#28a745"
          });
          const authInput = document.getElementById("autorizacion");
          if (authInput) authInput.value = "";
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo registrar el código de barras.",
          confirmButtonColor: "#ef4444"
        });
      }
    })
    .catch((err) => {
      console.error("Error al insertar código:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error de comunicación con el servidor.",
        confirmButtonColor: "#ef4444"
      });
    })
    .finally(() => {
      if (typeof ocultarLoader === "function") ocultarLoader();
    });
}

function clearScreen() {
  const auth = document.getElementById("autorizacion");
  const art = document.getElementById("pArticulo");
  const cod = document.getElementById("pCodigoBarra");
  const select = document.getElementById("selectBarcodes");

  if (auth) auth.value = "";
  if (art) art.value = "";
  if (cod) cod.value = "";
  if (select) {
    select.innerHTML = '<option value="" disabled selected>Seleccione un código</option>';
  }
}
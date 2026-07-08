function mostrarLoader() {
  document.getElementById("contenedorLoader").innerHTML = '<div class="loading"></div>';
}

function ocultarLoader() {
  const loaderContainer = document.getElementById("contenedorLoader");
  if (loaderContainer) {
      loaderContainer.innerHTML = '';
  }
}
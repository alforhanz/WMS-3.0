/**
 * js/footer.js
 * Componente Web <my-footer> para el pie de página global del sistema WMS.
 */
class MyFooter extends HTMLElement {
  connectedCallback() {
    // Obtener el año actual dinámicamente
    const year = new Date().getFullYear();
    
    this.innerHTML = `
      <style>
        .wms-footer {
          background-color: #2a3f54; /* Color corporativo oscuro */
          color: #ffffff;
          padding: 15px 0;
          text-align: center;
          font-size: 13px;
          margin-top: auto; /* Empuja el footer al final si el body es flex */
          width: 100%;
          border-top: 2px solid #1b676b; /* Línea de acento Teal */
        }
        .wms-footer p {
          margin: 0 0 5px 0;
          font-weight: 500;
        }
        .wms-footer a {
          color: #28a745; /* Verde corporativo */
          text-decoration: none;
          font-weight: bold;
          transition: color 0.2s ease;
        }
        .wms-footer a:hover {
          color: #ffffff;
        }
        .wms-footer .footer-copyright {
          font-size: 12px;
          color: #94a3b8; /* Gris claro para el copyright */
          margin-top: 5px;
        }
      </style>

      <footer class="wms-footer">
        <div class="container">
          <p>Sistema de Gestión de Almacenes (WMS)</p>
          <div class="footer-copyright">
            &copy; ${year} Todos los derechos reservados | Desarrollado por <a href="#" target="_blank">C.L.S.A</a>
          </div>
        </div>
      </footer>
    `;
  }
}

// Registrar el componente personalizado en el navegador
customElements.define('my-footer', MyFooter);
(function () {
  // Identificador único para la pestaña actual
  if (!sessionStorage.getItem('tab_instance_id')) {
    sessionStorage.setItem('tab_instance_id', Date.now().toString());
  }

  const tabId = sessionStorage.getItem('tab_instance_id');
  const channel = new BroadcastChannel('app_single_instance_channel');

  // Emitir chequeo a otras pestañas activas
  channel.postMessage({ type: 'CHECK_OTHER_TABS', senderId: tabId });

  channel.onmessage = (event) => {
    const { type, senderId, recipientId } = event.data;

    // Si otra pestaña pregunta, respondemos si no es nuestro propio mensaje
    if (type === 'CHECK_OTHER_TABS' && senderId !== tabId) {
      channel.postMessage({ type: 'TAB_ALREADY_OPEN', recipientId: senderId });
    }

    // Si la respuesta de bloqueo es para esta pestaña, la bloqueamos
    if (type === 'TAB_ALREADY_OPEN' && recipientId === tabId) {
      bloquearPestana();
    }
  };

  function bloquearPestana() {
    window.stop(); // Detiene la carga de los recursos restantes del HTML

    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #f8f9fa;">
          <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #c62828; margin-bottom: 10px;">Acceso no permitido</h3>
            <p style="color: #424242; font-size: 16px;">La aplicación ya se encuentra abierta en otra pestaña de este navegador.</p>
            <p style="color: #757575; font-size: 14px;">Cierra esta pestaña para continuar trabajando en la sesión activa.</p>
          </div>
        </div>
      `;
    });
  }
})();
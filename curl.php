<?php
// Después de validar el login en el servidor 200.124.12.146
$usuario = $_POST['username'];
$password = $_POST['password'];

// Datos para enviar al otro servidor
$data = [
    'username' => $usuario,
    'password' => $password
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:8106/index.php/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);

if (isset($result['msg']) && $result['msg'] == 'SUCCESS') {
    if (session_status() == PHP_SESSION_NONE) {
        @session_start();
    }
    $_SESSION['token_app2'] = $result['access_token'];
    $_SESSION['user_app2'] = $result['username'];
 
    // Extract BODEGA values and implode with commas
    $bodegaValues = array_map(function ($item) {
        return $item['BODEGA'];
    }, $result['bodega']);
    $bodegaString = implode(", ", $bodegaValues);
    $_SESSION["bodega"] = $bodegaString; 

    // Guardar credenciales en storage del navegador y navegar al dashboard
    echo "<script>
    localStorage.setItem('username', '" . $_SESSION['user_app2'] . "');
    localStorage.setItem('checkbox', '');
    localStorage.setItem('sinExistencias', 'false');
    localStorage.setItem('swalMessageShown', 'true');

    sessionStorage.setItem('tokens', '\"" . $_SESSION['token_app2'] . "\" ');
    sessionStorage.setItem('compania', '');
    sessionStorage.setItem('user', '\"" . $_SESSION['user_app2'] . "\"');
    sessionStorage.setItem('bodega', '" . json_encode($result['bodega']) . "');
    sessionStorage.setItem('_priv', '" . json_encode($result['priv']) . "');    

    window.location.href = 'dash1.html';
    </script>";
} else {
    echo "<script>alert('Error de autenticación desde la Suite.'); window.location.href = 'index.html';</script>";
}
?>
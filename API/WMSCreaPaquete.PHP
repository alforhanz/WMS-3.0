<?php
namespace App\Controllers;
use App\Models\WMSCreaPaquete_Model;
use CodeIgniter\HTTP\ResponseInterface;
use Exception;

class WMSCreaPaquete extends BaseController
{
	  
       public function creaPaquete()
                {
                    try {
                             $model = new WMSCreaPaquete_Model();
                            //Definir los parametros
                                   
                            $pSistema = !empty($_GET['pSistema']) ? $_GET["pSistema"] : null;             
                            $pUsuario = !empty($_GET['pUsuario']) ? $_GET["pUsuario"] : null; 
                            $pOpcion = !empty($_GET['pOpcion']) ? $_GET["pOpcion"] : null;  // P:Creacion de Paquete, G:Insert u update la linea sobre el documento existente del paquete, D:Eliminar lineas  de traslado
                            $pBodegaOrigen = !empty($_GET['pBodegaOrigen']) ? $_GET["pBodegaOrigen"] : null;  
                            $pBodegaDestino = !empty($_GET['pBodegaDestino']) ? $_GET["pBodegaDestino"] : null;  
                            $pFecha = !empty($_GET['pFecha']) ? $_GET["pFecha"] : null;  
                            $pPlaca = !empty($_GET['pPlaca']) ? $_GET["pPlaca"] : null;  
                            $jsonPaquete = !empty($_GET['jsonPaquete']) ? $_GET["jsonPaquete"] : null;    
                            $pReferencia = !empty($_GET['pReferencia']) ? $_GET["pReferencia"] : null; 
                            $pComentario = !empty($_GET['pComentario']) ? $_GET["pComentario"] : null; 

                            // Llama al procedimiento almacenado con los parámetros adecuados
                            $ordenCompra = $model->spCreaPaquetes($pSistema, $pUsuario, $pOpcion, $pBodegaOrigen,$pBodegaDestino, $pFecha, $pPlaca, $jsonPaquete,$pReferencia, $pComentario);

                            return $this->getResponse([
                                'msg' => 'SUCCESS',
                                'message' => 'Consulta recuperada con éxito',
                                'respuesta' => $ordenCompra,
                                'observacion' => $pComentario
                            ]);
                        } catch (Exception $e) {
                            return $this->getResponse(['message' => 'No se pudo completar la consulta: ' . $e->getMessage()], ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
                            }
                }
}
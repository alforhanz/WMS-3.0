<?php
namespace App\Models;
use CodeIgniter\Model;
use Exception;

class WMSCreaPaquete_Model extends Model
{

        //------------------------------------------------------------
        //  Crea guarda y ellimida los paquetes 
        //------------------------------------------------------------

  public function spCreaPaquetes($pSistema=null, $pUsuario=null, $pOpcion=null, $pBodegaOrigen=null,$pBodegaDestino=null, $pFecha=null, $pPlaca=null, $jsonPaquete=null ,$pReferencia=null, $pComentario=null)
        {
          try {
              $db = db_connect();          
             $params = array($pSistema, $pUsuario, $pOpcion, $pBodegaOrigen,$pBodegaDestino, $pFecha, $pPlaca, $jsonPaquete,$pReferencia, $pComentario);          
              $sql = "{CALL [CLSA].[WMS_sp_insert_documento_inv] (?,?,?,?,?,?,?,?,?,?)}";
              $query = $db->query($sql,$params)->getResult();
              return $query;
              $query->free_result();
              $db->close();
          } catch (Exception $e) {
              die($e->getMessage());
              return "";
          }
        }


}
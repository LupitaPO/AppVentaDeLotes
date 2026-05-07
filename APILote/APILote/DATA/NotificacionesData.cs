using APILote.Models;
using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class NotificacionesData
    {
        public string notificacionCrear(Notificaciones objnotifi)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "notificacion_Crear_pa", objnotifi.IdCliente, objnotifi.Mensaje);
                return "Notificacion creada con exito";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public DataTable notificacionListarPorCliente(int IdCliente)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "notificacion_ListarPorCliente", IdCliente).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string notificacionMarcarLeida(int IdNotificacion)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "notificacion_MarcarLeida_pa", IdNotificacion);
                return "Notificacion se marco como leida";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}

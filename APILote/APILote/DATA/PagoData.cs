using APILote.Models;
using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class PagoData
    {
        public DataTable pagoListarPorCliente(string DNI)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "pago_ListarPorCliente_pa", DNI).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
            
        }
        public DataTable pagoListarPorVenta(int IdVenta)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "pago_ListarPorVenta_pa", IdVenta).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
            
        }
        public DataTable pagoObtenerSaldoPendiente(int Idventa)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "pago_ObtenerSaldoPendiente_pa", Idventa).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
           
        }
        public string pagoRegistrar(int IdCronograma, int IdTipoComprobante)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "pago_Registrar_pa", IdCronograma,IdTipoComprobante);
                return "Pago Registrado Correctamente";
            }
            catch (Exception ex)
            {
                return "Error: " + ex.Message;
            }
        }
        public DataTable pago_RegistrarEstado(int IdVenta)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "pago_RegistrarEstado_pa", IdVenta).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}

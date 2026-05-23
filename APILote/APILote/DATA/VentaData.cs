using APILote.Models;
using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class VentaData
    {
        public DataTable ventaCancelar(int IdVenta, string Observacion)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "venta_Cancelar_pa", IdVenta, Observacion).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    
        public DataTable ventaListar()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "venta_Listar_pa").Tables[0];
                return Datos;                           
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public DataTable ventaObtenerPorId(int IdLote)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "venta_ObtenerPorId_pa", IdLote).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string ventaRegistrar(Ventas objventas)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "venta_registrar_pa", objventas.IdLote,objventas.IdUsuario,objventas.IdCliente,objventas.IdAsesor,objventas.PrecioVenta,objventas.MontoInicial,objventas.TipoVenta,objventas.TipoPago,objventas.PlazoMeses,objventas.Observacion);
                return "Venta Registrada";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}

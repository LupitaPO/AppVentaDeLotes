using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class ReporteData
    {
        public DataTable reporteLotesVendidos()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "rdeporte_LotesVendidos_pa").Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reporteClientesEnDeuda()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_ClientesEnDeuda_pa").Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reporteIngresosGenerados()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_IngresosGenerados_pa").Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reporteLotesDisponibles()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_LotesDisponibles").Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reportePagosRealizados(string FechaInicio, string FechaFin)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_PagosRealizados_pa").Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
    }
}

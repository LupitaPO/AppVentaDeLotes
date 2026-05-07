using APILote.Models;
using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class DashboardData
    {
        public DataTable dashboardResumenGeneral()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "dashboard_ResumenGeneral_pa").Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}

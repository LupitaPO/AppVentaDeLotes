using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class CronogramaData
    {
        public DataTable cronograma_ListarPorVenta(int IdUsuario)
        {
            DataTable Datos = new DataTable();
            Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "cronograma_ListarPorVenta_pa",IdUsuario).Tables[0];
            return Datos;
        }
    }
}

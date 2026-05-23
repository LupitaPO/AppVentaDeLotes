using APILote.Models;
using Microsoft.ApplicationBlocks.Data;

namespace APILote.DATA
{
    public class ConfiguracionSistemaData
    {
        public string configuracionActualizar(ConfiguracionSistema objconfi)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "configuracion_Actualizar", objconfi.IdConfiguracion,objconfi.PenalidadPorcentaje,objconfi.MoraPorCuotas,objconfi.MaxMesesRetrasos);
                return "Configuracion se actualizo correctamente";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}

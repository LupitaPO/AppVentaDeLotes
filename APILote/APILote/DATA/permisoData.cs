using APILote.Models;
using Microsoft.ApplicationBlocks.Data;

namespace APILote.DATA
{
    public class permisocs
    {
        public string permisoActualizar(Permiso objpermiso)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "permiso_Actualizar_pa", objpermiso.CodRolUsuario, objpermiso.CodOpcion, objpermiso.Activo);
                return "Permiso actualizado";
            }
            catch (Exception ex)
            {
                return null;
            }
        }

    }
}
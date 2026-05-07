using APILote.Models;
using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class ProyectoData
    {
        public string proyecto_Actualizar(Proyecto objproyecto)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "proyecto_Actualizar_pa", objproyecto.IdProyecto, objproyecto.CodProyecto, objproyecto.Nombre, objproyecto.Ubicacion, objproyecto.NumeroHectareas, objproyecto.ImagenUrl, objproyecto.PartidaRegistral);
                return "Proyecto Actualizado correctamente";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string proyecto_Anular(int IdProyecto)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "proyecto_Anular_pa", IdProyecto);
                return "Proyecto actualizado correctamente";
            }
            catch (Exception ex)
            {
                return null;
            }
        } 
        public DataTable proyecto_Listar()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "proyecto_Listar_pa").Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string proyecto_Registrar(Proyecto objproyecto)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "proyecto_Registrar_pa", objproyecto.CodProyecto, objproyecto.Nombre, objproyecto.Ubicacion, objproyecto.NumeroHectareas, objproyecto.PartidaRegistral, objproyecto.ImagenUrl );
                return "Datos Registrados Correctamentes";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}

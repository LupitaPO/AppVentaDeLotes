using APILote.Models;
using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class AsesorData
    {
        public string asesor_Anular(string DNI)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "asesor_Anular_pa", DNI);
                return "Registro Anulado";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public DataTable asesor_ClientesAsignados(string DNI)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "asesor_ClientesAsignados_pa", DNI).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public DataTable asesor_Listar()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "asesor_Listar_pa").Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }

        }
        public DataTable asesor_ListarPorDNI(string DNI)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "asesor_ListarPorDNI_pa", DNI).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string asesor_Modificar(Asesores objasesores)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "asesor_Modificar_pa", objasesores.DNI, objasesores.Nombre1, objasesores.Nombre2, objasesores.Apaterno, objasesores.Amaterno, objasesores.Celular, objasesores.Observaciones);
                return "Datos actualizados correctamente";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string asesor_Registrar(Asesores objasesores)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "asesor_Registrar_pa", objasesores.Nombre1, objasesores.Nombre2, objasesores.Apaterno, objasesores.Amaterno, objasesores.DNI, objasesores.Celular, objasesores.Observaciones);
                return "Datos guardados correctamente";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}

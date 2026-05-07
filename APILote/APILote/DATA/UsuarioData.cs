using APILote.Models;
using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class UsuarioData
    {
        public string usuarioActualizar(Usuarios objusuario)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "usuario_Actualizar_pa", objusuario.IdUsuario, objusuario.Nombre, objusuario.Correo, objusuario.Contraseña, objusuario.TipoUsuario, objusuario.Celular);
                return "Usuario actualizado";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string  usuarioActualizarContraseña(int IdUsuario, string ContraseñaActual, string ContraseñaNueva)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "usuario_ActualizarContraseña_pa", IdUsuario, ContraseñaActual,ContraseñaNueva);
                return "Contraseña actualizada";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string usuarioAnular(int IdUsuario)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "usuario_Anular_pa",IdUsuario);
                return "Usuario anulado correctamnete";
            }
            catch(Exception ex)
            {
                return null;
            }
        }
        public DataTable usuarioListar()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "usuario_Listar_pa").Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public DataTable usuarioLogin(string Correo,string Contraseña)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "usuario_Login_pa", Correo,Contraseña).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public DataTable usuarioObtenerPorID(string Buscar)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "usuario_ObtenerPorId_pa",Buscar).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string usuarioRegistrar_pa(Usuarios objusuarios)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "usuario_Registrar_pa",objusuarios.Nombre, objusuarios.Correo, objusuarios.Contraseña, objusuarios.Celular);
                return "Usuario Registrado";
            }
            catch (Exception ex)
            {
                return null;
            }
        }

    }
}

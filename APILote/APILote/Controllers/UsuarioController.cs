using APILote.DATA;
using APILote.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Net;
using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UsuarioController : ControllerBase
    {
        [HttpPost]
        [Route("usuario_Actualizar")]
        public string usuario_Actualizar([FromBody]Usuarios objusuario)
        {
            UsuarioData objusuarioData = new UsuarioData();
            return objusuarioData.usuarioActualizar(objusuario);
        }


        [HttpPost]
        [Route("usuario_ActualizarContraseña")]
        public string usuario_ActualizarContraseña(int IdUsuario, string ContraseñaActual, string contraseñaNueva)
        {
            UsuarioData objusuarioData = new UsuarioData();
            return objusuarioData.usuarioActualizarContraseña(IdUsuario, ContraseñaActual, contraseñaNueva); 
        }


        [HttpPost]
        [Route("usuario_Anular/{IdUsuario}")]
        public string usuario_Anular(int IdUsuario)
        {
            UsuarioData objusuarioData = new UsuarioData();
            return objusuarioData.usuarioAnular(IdUsuario);
        }


        [HttpGet]
        [Route("usuario_Listar")]
        public string usuario_Listar()
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            UsuarioData objCliente = new UsuarioData();
            Datos = objCliente.usuarioListar();
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("usuario_Login/{Correo}/{Contraseña}")]
        public string usuario_Login(string Correo, string Contraseña)
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            UsuarioData objCliente = new UsuarioData();
            Datos = objCliente.usuarioLogin(Correo,Contraseña);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("usuario_ObtenerPorId/{Buscar}")]
        public string usuario_ObtenrPorId(string Buscar)
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            UsuarioData objCliente = new UsuarioData();
            Datos = objCliente.usuarioObtenerPorID(Buscar);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpPost]
        [Route("usuario_Registrar")]
        public string usuario_Registrar([FromBody] Usuarios objusuario)
        {
            UsuarioData objusuariodata = new UsuarioData();
            return objusuariodata.usuarioRegistrar_pa(objusuario);
        }

        //nuevo 15 de mayo 2026
        [HttpGet]
        [Route("usuario_Tipo_Listar")]
        public string usuario_TipoUsuario_Listar()
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            UsuarioData objCliente = new UsuarioData();
            Datos = objCliente.usuarioTipoUsuarioListar();
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("formularios_Listar_pa")]
        public string formularios_Listar_pa()
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            UsuarioData objCliente = new UsuarioData();
            Datos = objCliente.formularios_Listar_pa();
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }

        [HttpGet]
        [Route("permisos_ListarPerfil")]
        public IActionResult Permisos_ListarPerfil([FromQuery] int idRol)
        {
            try
            {
                UsuarioData data = new UsuarioData();
                DataTable resultado = data.PermisosPerfil(idRol);

                if (resultado == null || resultado.Rows.Count == 0)
                {
                    return NotFound(new
                    {
                        success = false,
                        mensaje = "No se encontraron permisos para este rol",
                        data = new object[] { }
                    });
                }

                var rows = new List<Dictionary<string, object>>();
                foreach (DataRow row in resultado.Rows)
                {
                    var dict = new Dictionary<string, object>();
                    foreach (DataColumn col in resultado.Columns)
                    {
                        dict[col.ColumnName] = row[col];
                    }
                    rows.Add(dict);
                }

                return Ok(new
                {
                    success = true,
                    data = rows
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    error = ex.Message
                });
                
            }
         }

        [HttpPost]
        [Route("permisos_GuardarPerfil")]
        public IActionResult PermisosGuardar([FromBody] Permiso request)
        {
            try
            {
                UsuarioData data = new UsuarioData();
                string resultado = data.Permiso(request.CodRolUsuario, request.CodOpcion, request.Activo);

                if (resultado == null)
                {
                    return StatusCode(500, new { success = false, mensaje = "Error al guardar el permiso." });
                }

                return Ok(new { success = true, mensaje = resultado });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }

        }
    }
}
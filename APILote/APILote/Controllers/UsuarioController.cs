using APILote.DATA;
using APILote.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Net;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UsuarioController
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
        
    }
}

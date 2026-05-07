using APILote.DATA;
using APILote.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class NotificacionController
    {
        [HttpPost]
        [Route("notificacion_Crear")]
        public string motificacion_Crear([FromBody] Notificaciones objnotifi)
        {
            NotificacionesData objnotifidata = new NotificacionesData();
            return objnotifidata.notificacionCrear(objnotifi);
        }


        [HttpGet]
        [Route("notificacion_ListarPorCliente/{IdCliente}")]
        public string notificacion_ListarPorCliente(int IdCliente)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            NotificacionesData objnotifi = new NotificacionesData();
            Datos = objnotifi.notificacionListarPorCliente(IdCliente);
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        [HttpPost]
        [Route("notificacion_MarcarLeida/{IdNotificacion}")]
        public string notificacion_Marcarleida(int IdNotificacion)
        {
            NotificacionesData objnotifiData = new NotificacionesData();
            return objnotifiData.notificacionMarcarLeida(IdNotificacion);
        }
    }
}

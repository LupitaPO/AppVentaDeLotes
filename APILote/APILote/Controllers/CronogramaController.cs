using APILote.DATA;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CronogramaController
    {
        [HttpGet]
        [Route("cronograma_ListarPorVenta/{IdUsuario}")]
        public string cronograma_ListarPorVenta(int IdUsuario)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            CronogramaData objcronograma = new CronogramaData();
            Datos = objcronograma.cronograma_ListarPorVenta(IdUsuario);
            jsostring =Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }
    }
}

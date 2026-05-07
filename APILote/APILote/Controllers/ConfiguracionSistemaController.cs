using APILote.DATA;
using APILote.Models;
using Microsoft.AspNetCore.Mvc;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ConfiguracionSistemaController
    {
        [HttpPost]
        [Route("configuracion_Actualizar")]
        public string configuracion_Actualizar([FromBody] ConfiguracionSistema objconfi)
        {
            ConfiguracionSistemaData objconfiguracionSistemaData = new ConfiguracionSistemaData();
            return objconfiguracionSistemaData.configuracionActualizar(objconfi);
        }
    }
}

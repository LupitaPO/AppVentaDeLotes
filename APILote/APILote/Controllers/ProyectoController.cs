using APILote.DATA;
using APILote.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using System.Data;
using System.Net;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProyectoController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        
        public ProyectoController(IWebHostEnvironment env)
        {
            _env = env;
        }

        private IEnumerable<string> ObtenerCarpetasPlanos()
        {
            var carpetas = new List<string>();

            if (!string.IsNullOrWhiteSpace(_env.WebRootPath))
            {
                carpetas.Add(Path.Combine(_env.WebRootPath, "uploads", "planos"));
            }

            if (!string.IsNullOrWhiteSpace(_env.ContentRootPath))
            {
                carpetas.Add(Path.Combine(_env.ContentRootPath, "uploads", "planos"));
            }

            var baseDir = AppContext.BaseDirectory;
            carpetas.Add(Path.Combine(baseDir, "wwwroot", "uploads", "planos"));
            carpetas.Add(Path.Combine(baseDir, "uploads", "planos"));

            return carpetas.Distinct(StringComparer.OrdinalIgnoreCase);
        }

        private async Task<string> GuardarPlanoAsync(IFormFile archivoPlano)
        {
            string nombreArchivo = Guid.NewGuid().ToString() + ".csv";
            var carpetas = ObtenerCarpetasPlanos().ToList();
            var carpetaPrincipal = carpetas.First();

            Directory.CreateDirectory(carpetaPrincipal);
            string rutaPrincipal = Path.Combine(carpetaPrincipal, nombreArchivo);

            using (var stream = new FileStream(rutaPrincipal, FileMode.Create))
            {
                await archivoPlano.CopyToAsync(stream);
            }

            foreach (var carpeta in carpetas.Skip(1))
            {
                Directory.CreateDirectory(carpeta);
                string rutaCopia = Path.Combine(carpeta, nombreArchivo);
                if (!string.Equals(rutaPrincipal, rutaCopia, StringComparison.OrdinalIgnoreCase))
                {
                    System.IO.File.Copy(rutaPrincipal, rutaCopia, true);
                }
            }

            return "/uploads/planos/" + nombreArchivo;
        }

        private string? BuscarPlano(string nombreArchivo)
        {
            var nombreSeguro = Path.GetFileName(nombreArchivo ?? "");
            if (string.IsNullOrWhiteSpace(nombreSeguro) || !nombreSeguro.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            foreach (var carpeta in ObtenerCarpetasPlanos())
            {
                var ruta = Path.Combine(carpeta, nombreSeguro);
                if (System.IO.File.Exists(ruta))
                {
                    return ruta;
                }
            }

            return null;
        }

        [HttpPost]
        [Route("proyecto_Actualizar")]
        // Hacemos lo mismo para el método de actualizar
        public async Task<string> proyecto_Actualizar([FromForm] Proyecto objproyecto)
        {
            try
            {
                if (objproyecto.ArchivoPlano != null)
                {
                    objproyecto.ImagenUrl = await GuardarPlanoAsync(objproyecto.ArchivoPlano);
                }

                ProyectoData objproyectoData = new ProyectoData();
                string resultado = objproyectoData.proyecto_Actualizar(objproyecto);

                return resultado ?? "Error al actualizar en la Base de Datos";
            }
            catch (Exception ex)
            {
                return "Error interno: " + ex.Message;
            }
        }


        [HttpPost]
        [Route("proyecto_Anular/{IdProyecto}")]
        public string proyecto_Anular(int IdProyecto)
        {
            ProyectoData objproyectoData = new ProyectoData();
            return objproyectoData.proyecto_Anular(IdProyecto);
        }


        [HttpGet]
        [Route("proyecto_Listar")]
        public string proyecto_Listar()
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ProyectoData objCliente = new ProyectoData();
            Datos = objCliente.proyecto_Listar();
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpPost]
        [Route("proyecto_Registrar")]
        // 1. Agregamos "async Task<string>" para permitir operaciones asíncronas en red
        public async Task<string> proyecto_Registrar([FromForm] Proyecto objproyecto)
        {
            try
            {
                if (objproyecto.ArchivoPlano != null)
                {
                    objproyecto.ImagenUrl = await GuardarPlanoAsync(objproyecto.ArchivoPlano);
                }

                ProyectoData objproyectodata = new ProyectoData();
                return objproyectodata.proyecto_Registrar(objproyecto);
            }
            catch (Exception ex)
            {
                return "Error interno al registrar: " + ex.Message;
            }
        }


        [HttpGet]
        [Route("proyecto_ListarSelect")]
        public string proyecto_ListarSelect()
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            ProyectoData objproyecto = new ProyectoData();
            Datos = objproyecto.proyectoListarSelect();
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        // =====================================================
        // ATAMAINE - API PARA LISTAR PROYECTOS ACTIVOS
        // Ruta final:
        // GET: api/Proyecto/proyecto_Listar_Select
        // Uso: frontend select/combo de proyectos
        // =====================================================

        [HttpGet]
        [Route("proyecto_Listar_Select")]
        public string proyecto_Listar_Select()
        {
            // Variable donde se guardará el JSON final
            string jsoString = string.Empty;
            // Tabla para recibir datos desde DATA
            DataTable Datos = new DataTable();
            // Instancia de la clase DATA
            ProyectoData objProyecto = new ProyectoData();
            // Llamamos al método que ejecuta el procedimiento almacenado
            Datos = objProyecto.proyecto_Listar_Select();
            // Convertimos el DataTable a JSON
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            // Retornamos el JSON para Swagger, navegador o frontend
            return jsoString;
        }

        [HttpGet]
        [Route("plano_Obtener/{nombreArchivo}")]
        public IActionResult plano_Obtener(string nombreArchivo)
        {
            var ruta = BuscarPlano(nombreArchivo);
            if (ruta == null)
            {
                return NotFound("No se encontró el archivo del plano.");
            }

            Response.Headers["Access-Control-Allow-Origin"] = "*";
            return PhysicalFile(ruta, "text/csv; charset=utf-8", Path.GetFileName(ruta));
        }
    }
}

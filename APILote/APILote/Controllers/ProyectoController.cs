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

        [HttpPost]
        [Route("proyecto_Actualizar")]
        // Hacemos lo mismo para el método de actualizar
        public async Task<string> proyecto_Actualizar([FromForm] Proyecto objproyecto)
        {
            try
            {
                if (objproyecto.ArchivoPlano != null)
                {
                    string carpeta = Path.Combine(_env.WebRootPath, "uploads", "planos");

                    if (!Directory.Exists(carpeta)) Directory.CreateDirectory(carpeta);

                    string nombreArchivo = Guid.NewGuid().ToString() + ".csv";
                    string rutaCompleta = Path.Combine(carpeta, nombreArchivo);

                    using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                    {
                        await objproyecto.ArchivoPlano.CopyToAsync(stream);
                    }

                    objproyecto.ImagenUrl = "/uploads/planos/" + nombreArchivo;
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
                    string carpeta = Path.Combine(_env.WebRootPath, "uploads", "planos");

                    if (!Directory.Exists(carpeta)) Directory.CreateDirectory(carpeta);

                    string nombreArchivo = Guid.NewGuid().ToString() + ".csv";
                    string rutaCompleta = Path.Combine(carpeta, nombreArchivo);

                    // 2. Usamos "await" y "CopyToAsync" para garantizar que el CSV se reciba COMPLETO
                    using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                    {
                        await objproyecto.ArchivoPlano.CopyToAsync(stream);
                    }

                    objproyecto.ImagenUrl = "/uploads/planos/" + nombreArchivo;
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
    }
}

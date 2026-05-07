using APILote.DATA;
using APILote.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Net;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProyectoController
    {
        [HttpPost]
        [Route("proyecto_Actualizar")]
        public string proyecto_Actualizar([FromForm] Proyecto objproyecto) // Cambiado a FromForm
        {
            try
            {
                // 1. Verificamos si el usuario subió un archivo nuevo desde la App
                if (objproyecto.ArchivoPlano != null)
                {
                    // Definimos la ruta de la carpeta
                    string carpeta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "planos");

                    // Creamos la carpeta si no existe (por seguridad)
                    if (!Directory.Exists(carpeta)) Directory.CreateDirectory(carpeta);

                    // Generamos un nuevo nombre único para el nuevo plano
                    string nombreArchivo = Guid.NewGuid().ToString() + ".csv";
                    string rutaCompleta = Path.Combine(carpeta, nombreArchivo);

                    // Guardamos el nuevo archivo en el disco duro
                    using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                    {
                        objproyecto.ArchivoPlano.CopyTo(stream);
                    }

                    // Actualizamos la propiedad con la nueva ruta para la BD
                    objproyecto.ImagenUrl = "/uploads/planos/" + nombreArchivo;
                }

                // 2. Llamamos a tu capa de datos para actualizar en SQL
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
        public string proyecto_Registrar([FromForm] Proyecto objproyecto) // Cambiado a FromForm
        {
            // Lógica para guardar el archivo en tu carpeta de la laptop
            if (objproyecto.ArchivoPlano != null)
            {
                // Carpeta que creaste en ApiLotes
                string carpeta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot","uploads", "planos");

                if (!Directory.Exists(carpeta)) Directory.CreateDirectory(carpeta);

                // Nombre único para el CSV
                string nombreArchivo = Guid.NewGuid().ToString() + ".csv";
                string rutaCompleta = Path.Combine(carpeta, nombreArchivo);

                using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                {
                    objproyecto.ArchivoPlano.CopyTo(stream);
                }

                // Guardamos la ruta que irá a la Base de Datos
                objproyecto.ImagenUrl = "/uploads/planos/" + nombreArchivo;
            }

            ProyectoData objproyectodata = new ProyectoData();
            return objproyectodata.proyecto_Registrar(objproyecto);
        }

    }
}

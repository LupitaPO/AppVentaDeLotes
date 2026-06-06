using APILote.DATA;
using APILote.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Net;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class VentaController
    {
        [HttpGet]
        [Route("venta_Cancelar/{IdVenta},{Observaciones}")]
        public string venta_Cancelar(int IdVenta, string Observaciones)
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            VentaData objCliente = new VentaData();
            Datos = objCliente.ventaCancelar(IdVenta,Observaciones);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("venta_Listar")]
        public string venta_Listar()
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            VentaData objCliente = new VentaData();
            Datos = objCliente.ventaListar();
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("venta_ObtenerPorId/{IdLote}")]
        public string venta_ObtenerPorId(int IdLote)
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            VentaData objCliente = new VentaData();
            Datos = objCliente.ventaObtenerPorId(IdLote);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpPost]
        [Route("venta_Registrar")]
        public string venta_Registrar([FromBody] Ventas objventas)
        {
            VentaData objventadata = new VentaData();
            return objventadata.ventaRegistrar(objventas);
        }



        // =====================================================
        // ATAMAINE - API PARA LISTAR ESTADOS DE VENTA
        // Ruta final:
        // GET: api/Venta/venta_Estado_Listar
        // =====================================================

        [HttpGet]
        [Route("venta_Estado_Listar")]
        public string venta_Estado_Listar()
        {
            // Variable donde se guardará el JSON final
            string jsoString = string.Empty;
            // Tabla para recibir los datos desde DATA
            DataTable Datos = new DataTable();
            // Instancia de la clase DATA
            VentaData objVenta = new VentaData();
            // Llamamos al método que ejecuta el procedimiento almacenado
            Datos = objVenta.venta_Estado_Listar();
            // Convertimos el DataTable a JSON
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            // Retornamos el JSON final
            return jsoString;
        }


        // =====================================================
        // ATAMAINE - API PARA LISTAR TIPOS DE VENTA
        // Ruta final:
        // GET: api/Venta/venta_Tipo_Listar
        // =====================================================

        [HttpGet]
        [Route("venta_Tipo_Listar")]
        public string venta_Tipo_Listar()
        {
            // Variable donde se guardará el JSON final
            string jsoString = string.Empty;
            // Tabla para recibir los datos desde DATA
            DataTable Datos = new DataTable();
            // Instancia de la clase DATA
            VentaData objVenta = new VentaData();
            // Llamamos al método que ejecuta el procedimiento almacenado
            Datos = objVenta.venta_Tipo_Listar();
            // Convertimos el DataTable a JSON
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            // Retornamos el JSON final para Swagger, navegador o frontend
            return jsoString;
        }


        // =====================================================
        // ATAMAINE - API PARA LISTAR TIPOS DE PAGO
        // Ruta final:
        // GET: api/Venta/venta_TipoPago_Listar
        // =====================================================

        [HttpGet]
        [Route("venta_TipoPago_Listar")]
        public string venta_TipoPago_Listar()
        {
            // Variable donde se guardará el JSON final
            string jsoString = string.Empty;
            // Tabla para recibir datos desde DATA
            DataTable Datos = new DataTable();
            // Instancia de la clase DATA
            VentaData objVenta = new VentaData();
            // Llamamos al método que ejecuta el procedimiento almacenado
            Datos = objVenta.venta_TipoPago_Listar();
            // Convertimos el DataTable a JSON
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            // Retornamos el JSON para Swagger, navegador o frontend
            return jsoString;
        }
    }
}

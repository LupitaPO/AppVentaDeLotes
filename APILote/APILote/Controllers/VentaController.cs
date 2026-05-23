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
    }
}

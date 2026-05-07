using APILote.DATA;
using APILote.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PagoController
    {
        [HttpGet]
        [Route("pago_ListarPorCliente/{DNI}")]
        public string pago_ListarPorCliente(string DNI)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            PagoData objpago = new PagoData();
            Datos = objpago.pagoListarPorCliente(DNI);
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        [HttpGet]
        [Route("pago_ListarPorVenta/{IdVenta}")]
        public string pago_ListarPorVenta(int IdVenta)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            PagoData objpago = new PagoData();
            Datos = objpago.pagoListarPorVenta(IdVenta);
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        [HttpGet]
        [Route("pago_ObtenerSaldoPendiente/{IdVenta}")]
        public string pago_ObtenerSaldoPendiente(int IdVenta)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            PagoData objpago = new PagoData();
            Datos = objpago.pagoObtenerSaldoPendiente(IdVenta);
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }

        public class pagoRegistrarRequest
        {
            public int IdCronograma {  get; set; }
            public int IdTipoComprobante { get; set; }
        }
        [HttpPost]
        [Route("pago_Registrar")]
        public string pago_Registrar([FromBody] pagoRegistrarRequest request)
        {
            if (request == null) return "Datos nulos";
            PagoData objpagoData = new PagoData();
            return objpagoData.pagoRegistrar(request.IdCronograma, request.IdTipoComprobante);
        }


        [HttpGet]
        [Route("pago_RegistrarEstado/{IdVenta}")]
        public string pago_RegistrarEstado(int IdVenta)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            PagoData objpago = new PagoData();
            Datos = objpago.pago_RegistrarEstado(IdVenta);
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }
    }
}

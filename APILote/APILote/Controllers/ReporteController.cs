using APILote.DATA;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Net;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ReporteController
    {
        [HttpGet]
        [Route("reporte_LotesVendidos")]
        public string reporte_LotesVendidos()
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ReporteData objCliente = new ReporteData();
            Datos = objCliente.reporteLotesVendidos();
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("reporte_ClientesEnDeusa")]
        public string reporte_ClientesEnDeuda()
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ReporteData objCliente = new ReporteData();
            Datos = objCliente.reporteClientesEnDeuda();
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("reporte_IngresosGenerados")]
        public string reporte_IngresosGenerados()
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ReporteData objCliente = new ReporteData();
            Datos = objCliente.reporteIngresosGenerados();
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("reporte_LotesDisponibles")]
        public string reporte_LotesDisponibles()
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ReporteData objCliente = new ReporteData();
            Datos = objCliente.reporteLotesDisponibles();
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("reporte_PagosRealizados/{FechaInicio}/{FechaFin}")]
        public string reporte_PagosRealizados(string FechaInicio, string FechaFin)
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ReporteData objCliente = new ReporteData();
            Datos = objCliente.reportePagosRealizados(FechaInicio, FechaFin);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }
    }
}

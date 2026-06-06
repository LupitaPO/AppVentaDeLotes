using APILote.DATA;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Net;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ReporteController: ControllerBase
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
        [Route("reporte_ClientesEnDeuda")]
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

        [HttpGet]
        // Permite llamar /Reporte/reporte_Clientes o /Reporte/reporte_Clientes/{datoBuscar}
        [Route("reporte_Clientes/{datoBuscar?}")]
        public string reporte_Clientes(string datoBuscar = "*")
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ReporteData objCliente = new ReporteData();
            Datos = objCliente.reporteClientes(datoBuscar);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }

        [HttpGet]
        [Route("reporte_Asesores/{datoBuscar?}")]
        public string reporte_Asesores(string datoBuscar = "*" )
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ReporteData objAsesor = new ReporteData();
            Datos = objAsesor.reporteAsesores(datoBuscar);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }

        [HttpGet]
        [Route("reporte_Proyectos/{datoBuscar?}")]
        public string reporte_Proyectos(string datoBuscar = "")
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ReporteData objProyecto = new ReporteData();
            Datos = objProyecto.reporteProyectos(datoBuscar);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("reporte_Lotes")]
        public string reporte_Lotes(
        string estadoLote = null,
        string nombreProyecto = null,
        decimal? precioDesde = null
)
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ReporteData objLotes = new ReporteData();
            Datos = objLotes.reporte_Lotes(estadoLote, nombreProyecto, precioDesde);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        // =====================================================
        // ATAMAINE - ENDPOINT API PARA REPORTE DE USUARIOS
        // Ruta final:
        // GET: api/Reporte/reporte_Usuarios
        // =====================================================

        [HttpGet]
        [Route("reporte_Usuarios")]
        public string reporte_Usuarios(
            string nombre = null,
            string tipoUsuario = null
        )
        {
            // Variable donde se guardará el JSON final
            string jsoString = string.Empty;
            // Tabla para recibir los datos desde DATA
            DataTable Datos = new DataTable();
            // Instancia de la clase DATA
            ReporteData objUsuarios = new ReporteData();
            // Llamamos al método que ejecuta el procedimiento almacenado
            Datos = objUsuarios.reporte_Usuarios(nombre, tipoUsuario);
            // Convertimos el DataTable a JSON
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            // Retornamos el JSON al navegador / Swagger / frontend
            return jsoString;
        }


        // =====================================================
        // ATAMAINE - API REPORTE DE COBRANZAS
        // Ruta final en Swagger:
        // GET: api/Reporte/reporte_Cobranzas
        // =====================================================

        [HttpGet]
        [Route("reporte_Cobranzas")]
        public string reporte_Cobranzas(
            string estadoVenta = null,
            string tipoVenta = null,
            string tipoPago = null,
            DateTime? fechaDesde = null,
            DateTime? fechaHasta = null,
            int? idCliente = null
        )
        {
            // Variable donde se guardará el JSON final
            string jsoString = string.Empty;
            // Tabla donde recibiremos los datos desde la capa DATA
            DataTable Datos = new DataTable();
            // Instancia de la clase donde está el método de conexión al procedimiento
            ReporteData objCobranzas = new ReporteData();
            // Llamamos al procedimiento reporteCobranzas_pa mediante DATA
            Datos = objCobranzas.reporte_Cobranzas(
                estadoVenta,
                tipoVenta,
                tipoPago,
                fechaDesde,
                fechaHasta,
                idCliente
            );
            // Convertimos el DataTable a formato JSON para Swagger, navegador o frontend
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            // Retornamos el resultado final
            return jsoString;
        }


        // =====================================================
        // ATAMAINE - API REPORTE DE PAGOS
        // Ruta final en Swagger:
        // GET: Reporte/reporte_Pagos
        // =====================================================

        [HttpGet]
        [Route("reporte_Pagos")]
        public string reporte_Pagos(
            string estadoPago = null,
            int? idVenta = null,
            DateTime? fechaDesde = null,
            DateTime? fechaHasta = null
        )
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            ReporteData objPagos = new ReporteData();
            Datos = objPagos.reporte_Pagos(
                estadoPago,
                idVenta,
                fechaDesde,
                fechaHasta
            );
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }





        [HttpGet]
        [Route("test2")]
        public string test2()
        {
            return "OK PROYECTO FUNCIONANDO";
        }
    }

}

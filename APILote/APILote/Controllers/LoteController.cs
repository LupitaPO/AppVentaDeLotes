using APILote.DATA;
using APILote.Models;
using Microsoft.ApplicationBlocks.Data;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class LoteController
    {
        public class LoteActualizarRequest
        {
            public Lotes Lote { get; set; }
            public Medidas Medida { get; set; }
        }
        [HttpPost]
        [Route("lote_Actualizar")]
        
        public string lote_Actualizar([FromBody] LoteActualizarRequest request )
        {
            LoteData objloteData = new LoteData();
            return objloteData.loteActualizar(request.Lote, request.Medida);
        }



        [HttpPost]
        [Route("lote_ActualizarEstadoMasivo")]
        public string lote_ActualizarEstadoMasivo()
        {
            LoteData objloteData = new LoteData();
            return objloteData.loteActualizarEstadoMasivo();
        }


        [HttpPost]
        [Route("lote_Anular/{IdLote}")]
        public string lote_Anular(int IdLote)
        {
            LoteData objlotedata = new LoteData();
            return objlotedata.loteAnular(IdLote);
        }


        [HttpGet]
        [Route("lote_Filtrar")]
        public string lote_Filtrar()
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            LoteData objlote = new LoteData();
            Datos = objlote.lote_Filtrar();
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;

        }


        [HttpGet]
        [Route("lote_Listar")]
        public string lote_Listar()
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            LoteData objlote = new LoteData();
            Datos = objlote.loteListar();
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        [HttpGet]
        [Route("lote_ListarDisponible")]
        public string lote_ListarDisponible()
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            LoteData objlote = new LoteData();
            Datos = objlote.loteListarDisponible();
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        [HttpGet]
        [Route("lote_ObtenerPorId/{IdLote}")]
        public string lote_ObtenerPorId(int IdLote)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            LoteData objlote = new LoteData();
            Datos = objlote.loteObtenerPorId(IdLote);
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }

        

        [HttpPost]
        [Route("lote_Registrar")]
        public string lote_Registrar([FromBody] Lotes objlote) {
        LoteData objlotedata = new LoteData();
         // Aquí es donde "desarmas" el paquete para mandarlo a tu Data
        return objlotedata.loteRegistrar(objlote, objlote.Medida);
        }

        [HttpGet]
        [Route("lote_EstadoListar")]
        public string lote_EstadoListar()
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            LoteData objlote = new LoteData();
            Datos = objlote.loteEstadoListar();
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        // =====================================================
        // ATAMAINE - API PARA LISTAR ESTADOS DE LOTE
        // Ruta final:
        // GET: api/Lote/lote_Estado_Listar
        // =====================================================
        [HttpGet]
        [Route("lote_Estado_Listar")]
        public string lote_Estado_Listar()
        {
            // Variable donde se guardará el JSON final
            string jsoString = string.Empty;
            // Tabla para recibir datos desde DATA
            DataTable Datos = new DataTable();
            // Instancia de la clase DATA
            LoteData objLote = new LoteData();
            // Llamamos al método que ejecuta el procedimiento almacenado
            Datos = objLote.lote_Estado_Listar();
            // Convertimos el DataTable a JSON
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            // Retornamos el JSON para Swagger, navegador o frontend
            return jsoString;
        }
    }
}

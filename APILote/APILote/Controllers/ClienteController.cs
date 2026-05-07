using APILote.DATA;
using APILote.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ClienteController
    {
        [HttpPost]
        [Route("cliente_Actualizar")]
        public string cliente_Actualizar([FromBody] Clientes objclientes)
        {
            ClienteData objclienteData = new ClienteData();
            return objclienteData.clienteActualizar(objclientes);
        }


        [HttpPost]
        [Route("cliente_Anular/{DNI}")]
        public string cliente_Anular(string DNI)
        {
            ClienteData objclienteData = new ClienteData();
            return objclienteData.clienteAnular(DNI);
        }


        [HttpGet]
        [Route("clientes_EnDeuda/{IdCliente}")]
        public string cliente_EnDeuda(int IdCliente)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            ClienteData objcliente = new ClienteData();
            Datos = objcliente.clientesEnDeuda(IdCliente);
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        [HttpGet]
        [Route("cliente_HistorialPagos/{IdCliente}")]
        public string cliente_HistorialPagos(int Idcliente)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            ClienteData objcliente = new ClienteData();
            Datos = objcliente.clienteHistorialPagos(Idcliente);
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        [HttpGet]
        [Route("cliente_Listar")]
        public string cliente_Listar()
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            ClienteData objcliente = new ClienteData();
            Datos = objcliente.clienteListar();
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        [HttpGet]
        [Route("cliente_LotesAdquiridos/{IdCliente}")]
        public string cliente_LotesAdquiridos(int Idcliente)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            ClienteData objcliente = new ClienteData();
            Datos = objcliente.clienteLotesAdquiridos(Idcliente);
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        [HttpGet]
        [Route("cliente_ObtenerPorDNI/{DNI}")]
        public string cliente_ObtenerPorDNI(string DNI)
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            ClienteData objcliente = new ClienteData();
            Datos = objcliente.clienteObtenerPorDNI(DNI);
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }


        [HttpPost]
        [Route("cliente_Registrar")]
        public string cliente_Registrar([FromBody] Clientes objCliente)
        {
            ClienteData objclientedata = new ClienteData();
            return objclientedata.clienteRegistrar(objCliente);
        }
    }
}

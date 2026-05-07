using APILote.DATA;
using APILote.Models;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace APILote.Controllers

{
    [ApiController]
    [Route("[controller]")]
    public class AsesorController
    {
        [HttpPost]
        [Route("asesor_Anular/{DNI}")]
        public string asesor_Anular(string DNI)
        {
            AsesorData objasesor = new AsesorData();
            return objasesor.asesor_Anular(DNI);
        }


        [HttpGet]
        [Route("asesor_ClientesAsignados/{DNI}")]
        public string asesor_ClientesAsignados(string DNI)
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            AsesorData objasesor = new AsesorData();
            Datos = objasesor.asesor_ClientesAsignados(DNI);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("asesor_Listar")]
        public string asesor_Listar()
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            AsesorData objasesor = new AsesorData();
            Datos = objasesor.asesor_Listar();
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpGet]
        [Route("asesor_ListarPorDNI/{DNI}")]
        public string asesor_ListarPorDNI(string DNI)
        {
            string jsoString = string.Empty;
            DataTable Datos = new DataTable();
            AsesorData objasesor = new AsesorData();
            Datos = objasesor.asesor_ListarPorDNI(DNI);
            jsoString = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsoString;
        }


        [HttpPost]
        [Route("asesor_Modificar")]
        public string asesor_Modificar([FromBody] Asesores objasesores)
        {
            AsesorData objasesorData = new AsesorData();
            return objasesorData.asesor_Modificar(objasesores);
        }


        [HttpPost]
        [Route("asesor_Registrar")]
        public string asesor_Registrar([FromBody] Asesores objasesores)
        {
            AsesorData objasesorData = new AsesorData();
            return objasesorData.asesor_Registrar(objasesores);
        }
    }

}

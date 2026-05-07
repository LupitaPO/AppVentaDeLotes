using APILote.DATA;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace APILote.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DashboardController
    {
        [HttpGet]
        [Route("dashboard_ResumenGeneral")]
        public string dashboard_ResumenGeneral()
        {
            string jsostring = string.Empty;
            DataTable Datos = new DataTable();
            DashboardData objdashboard = new DashboardData();
            Datos = objdashboard.dashboardResumenGeneral();
            jsostring = Newtonsoft.Json.JsonConvert.SerializeObject(Datos);
            return jsostring;
        }
    }
}

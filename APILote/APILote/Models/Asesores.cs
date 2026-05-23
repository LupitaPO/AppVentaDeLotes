namespace APILote.Models
{
    public class Asesores
    {
        public int IdAsesor {  get; set; }
        public string Nombre1 { get; set; }
        public string Nombre2 { get; set; }
        public string Apaterno { get; set;}
        public string Amaterno { get; set;}
        public string DNI { get; set;}
        public string Celular { get; set;}
        public DateTime FechaRegistro { get; set;}
        public DateTime FechaUpdate { get; set;}
        public DateTime FechaDelete { get; set;}
        public string Observaciones { get; set;}
        public string Estado { get; set;}  
    }
}

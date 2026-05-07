namespace APILote.Models
{
    public class Proyecto
    {
        public int IdProyecto { get; set; }
        public string CodProyecto { get; set; }
        public string Nombre { get; set; }
        public string Ubicacion { get; set; }
        public string NumeroHectareas { get; set; }
        public string PartidaRegistral { get; set; }
        public string? ImagenUrl { get; set; }
        public IFormFile? ArchivoPlano { get; set; }
        public DateTime FechaRegistro { get; set; }
        public DateTime FechaUpdate {  get; set; }
        public DateTime FechaDelete { get; set; }
        public string Estado {  get; set; }

    }
}

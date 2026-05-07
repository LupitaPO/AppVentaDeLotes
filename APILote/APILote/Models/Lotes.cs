namespace APILote.Models
{
    public class Lotes
    {
        public int IdLote { get; set; }
        public int IdProyecto { get; set; }
        public string CodigoLote { get; set; }
        public string Ubicacion {  get; set; }
        public Medidas Medida { get; set; }
        public string NumeroLote { get; set; }
        public string Manzana {  get; set; }
        public decimal Precio { get; set; }
        public string Descripcion { get; set; }
        public string ImagenUrl { get; set; }
        public string EstadoLote { get; set; }
        public DateTime FechaRegistro { get; set; }

    }
}

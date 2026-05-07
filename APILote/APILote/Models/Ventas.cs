namespace APILote.Models
{
    public class Ventas
    {
        public int IdVenta { get; set; }
        public int IdLote { get; set; }
        public int IdUsuario { get; set; }
        public int IdCliente { get; set; }
        public int IdAsesor {  get; set; }
        public DateTime FechaVenta { get; set; }
        public decimal PrecioVenta { get; set; }
        public string TipoVenta { get; set; }
        public string TipoPago {  get; set; }
        public decimal MontoInicial { get; set; }
        public int PlazoMeses { get; set; }
        public string EstadoVenta { get; set; }
        public int PenalidadAplicada { get; set; }
        public string Observacion { get; set; }
    }
}

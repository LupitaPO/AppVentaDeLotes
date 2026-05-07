namespace APILote.Models
{
    public class HistorialEstadoLote
    {
        public int IdHistorial {  get; set; }
        public int  IdLote { get; set; }
        public string EstadoAnterior { get; set; }
        public string EstadoNuevo { get; set; }
        public DateTime FechaCambio { get; set; }
        public string Motivo { get; set; }
    }
}

namespace APILote.Models
{
    public class Cronograma
    {
        public int IdCronograma { get; set; }
        public int IdVenta { get; set; }
        public DateTime Fechavencimiento { get; set; }
        public decimal MontoCuota { get; set; }
        public string EstadoCuota { get; set; }
        public string  Observacion { get; set; }
    }
}

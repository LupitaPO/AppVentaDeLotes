namespace APILote.Models
{
    public class Pagos
    {
        public int Idpago { get; set; }
        public int IdVenta { get; set; }
        public int IdCronograma {  get; set; }
        public int IdTipoComprobante { get; set; }
        public string Serie { get; set; }
        public int Numero { get; set; }
        public DateTime FechaPago { get; set; }
        public decimal Monto { get; set; }
        public int NumeroCuota { get; set; }
        public decimal MoraPorCuota { get; set; }
        public string EstadoPago { get; set; }
    }
}

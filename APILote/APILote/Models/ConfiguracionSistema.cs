namespace APILote.Models
{
    public class ConfiguracionSistema
    {
        public int IdConfiguracion {  get; set; }
        public decimal PenalidadPorcentaje { get; set; }
        public decimal MoraPorCuotas { get; set; }
        public int MaxMesesRetrasos { get; set; }
    }
}

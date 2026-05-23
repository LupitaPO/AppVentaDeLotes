namespace APILote.Models
{
    public class Notificaciones
    {
        public int IdNotificacion {  get; set; }
        public int IdCliente { get; set; }
        public string Mensaje { get; set; }
        public DateTime Fecha { get; set; }
        public string leida { get; set; }
    }
}

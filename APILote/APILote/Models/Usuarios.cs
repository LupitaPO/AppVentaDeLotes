namespace APILote.Models
{
    public class Usuarios
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; }
        public string Correo { get; set; } 
        public string Contraseña { get; set; }
        public string TipoUsuario { get; set; }
        public string Celular { get; set; }
        public DateTime FechaRegisstro { get; set; }
        public DateTime FechaUpdate {  get; set; }
        public DateTime FechaDelete { get; set; }
        public string Estado { get; set; }
    }
}

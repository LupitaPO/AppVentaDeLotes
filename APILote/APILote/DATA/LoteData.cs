using APILote.Models;
using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class LoteData
    {
        public string loteActualizar(Lotes objLotes,Medidas objMedidas)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "lote_Actualizar_pa", objLotes.IdLote, objLotes.IdProyecto,objLotes.CodigoLote, objLotes.Ubicacion, objMedidas.Frente, objMedidas.Fondo, objMedidas.Derecha, objMedidas.Izquierda, objMedidas.Perimetro, objMedidas.TamañoM2, objLotes.NumeroLote, objLotes.Manzana,objLotes.Precio,objLotes.Descripcion,objLotes.ImagenUrl);
                return "Lote actualizado correctamente";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string loteActualizarEstadoMasivo()
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "lote_ActualizarEstadoMasivo_pa");
                return "Actualizacion masiva completada";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string loteAnular(int IdLote)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "lote_Anular_pa", IdLote);
                return "Estado de lote modificado correctamente";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public DataTable lote_Filtrar()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "lote_Filtrar_pa").Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public DataTable loteListar()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "lote_listar_pa").Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public DataTable loteListarDisponible()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "lote_ListarDisponibles_pa").Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public DataTable loteObtenerPorId(int IdLote)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "lote_ObtenerPorId_pa", IdLote).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public string loteRegistrar(Lotes objLotes,Medidas objMedidas)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "lote_Registrar_pa", objLotes.IdProyecto,objLotes.CodigoLote, objLotes.Ubicacion, objMedidas.Frente, objMedidas.Fondo, objMedidas.Derecha,
                    objMedidas.Izquierda, objMedidas.Perimetro, objMedidas.TamañoM2, objLotes.NumeroLote, objLotes.Manzana, objLotes.Precio, objLotes.Descripcion, objLotes.ImagenUrl);
                return "Lote agregado correctamente";                                                                                                                     
         
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}

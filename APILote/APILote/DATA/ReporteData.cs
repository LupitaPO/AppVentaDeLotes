using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class ReporteData
    {
        public DataTable reporteLotesVendidos()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "rdeporte_LotesVendidos_pa").Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reporteClientesEnDeuda()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_ClientesEnDeuda_pa").Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reporteIngresosGenerados()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_IngresosGenerados_pa").Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reporteLotesDisponibles()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_LotesDisponibles").Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reportePagosRealizados(string FechaInicio, string FechaFin)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_PagosRealizados_pa").Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reporteClientes(string dato)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_Clientes_pa", dato).Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reporteAsesores(string dato)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_Asesores_pa", dato).Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }
        public DataTable reporteProyectos(string dato)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "reporte_Proyectos_pa", dato).Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }

        public DataTable reporte_Lotes(string estadoLote, string nombreProyecto, decimal? precioDesde)
        {
            try
            {
                DataTable Datos = new DataTable();

                Datos = SqlHelper.ExecuteDataset(
                    conexion.cnConexion,
                    "reporte_Lotes_pa",
                    estadoLote,
                    nombreProyecto,
                    precioDesde
                ).Tables[0];
                return Datos;
            }
            catch (Exception e)
            {
                return null;
            }
        }

        // =====================================================
        // ATAMAINE - MÉTODO DATA PARA REPORTE DE USUARIOS
        // Este método llama al procedimiento almacenado:
        // dbo.reporte_Usuarios_pa
        // =====================================================

        public DataTable reporte_Usuarios(string nombre, string tipoUsuario)
        {
            try
            {
                // Tabla donde se guardará el resultado del procedimiento
                DataTable Datos = new DataTable();

                // Ejecutamos el procedimiento almacenado de SQL Server
                Datos = SqlHelper.ExecuteDataset(
                    conexion.cnConexion,
                    "reporte_Usuarios_pa",
                    nombre,
                    tipoUsuario
                ).Tables[0];

                // Retornamos los datos al Controller
                return Datos;
            }
            catch (Exception e)
            {
                // Si ocurre un error, retornamos null
                return null;
            }
        }


        // =====================================================
        // ATAMAINE - DATA REPORTE DE COBRANZAS
        // Procedimiento conectado:
        // dbo.reporteCobranzas_pa
        // =====================================================
        public DataTable reporte_Cobranzas(
            string estadoVenta,
            string tipoVenta,
            string tipoPago,
            DateTime? fechaDesde,
            DateTime? fechaHasta,
            int? idCliente
        )
        {
            try
            {
                // Tabla donde se guardará el resultado que viene desde SQL Server
                DataTable Datos = new DataTable();
                // Ejecutamos el procedimiento almacenado con sus filtros opcionales
                Datos = SqlHelper.ExecuteDataset(
                    conexion.cnConexion,
                    "reporteCobranzas_pa",
                    estadoVenta,
                    tipoVenta,
                    tipoPago,
                    fechaDesde,
                    fechaHasta,
                    idCliente
                ).Tables[0];
                // Retornamos la tabla llena al Controller
                return Datos;
            }
            catch (Exception e)
            {
                // Si ocurre un error, retornamos null para evitar caída directa de la API
                return null;
            }
        }



    }
}

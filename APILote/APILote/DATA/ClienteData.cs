using APILote.Models;
using Microsoft.ApplicationBlocks.Data;
using System.Data;

namespace APILote.DATA
{
    public class ClienteData
    {
        //funcion  para actualizar clientes 
        public string clienteActualizar(Clientes objClientes)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "cliente_Actualizar_pa", objClientes.DNI, objClientes.Nombre1, objClientes.Nombre2, objClientes.Apaterno, objClientes.Amaterno, objClientes.Celular, objClientes.Direccion, objClientes.Correo,objClientes.Observaciones);
                return "Datos actualizados correctamente";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        //funcion para anular clientes 
        public string clienteAnular(string DNI)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "cliente_Anular_pa", DNI);
                return "Estado Actualizado";
            }
            catch (Exception ex) 
            {
                return null;
            }
        }
        //funcion para listar clientes en deuda por id
        public DataTable clientesEnDeuda(int IdCliente)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "cliente_ClientesEnDeusa_pa", IdCliente).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        //funcion para listar historial de pagos por id
        public DataTable clienteHistorialPagos(int IdCliente)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "cliente_HistorialPagos_pa", IdCliente).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        //funcion para listar todos los clientes 
        public DataTable clienteListar()
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "cliente_Listar_pa").Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        //funcio para listar  los lotes adquirdidos por id cliente
        public DataTable clienteLotesAdquiridos(int IdCliente)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "cliente_LotesAdquiridos_pa").Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        //funcion para listar cliente por DNI
        public DataTable clienteObtenerPorDNI(string DNI)
        {
            try
            {
                DataTable Datos = new DataTable();
                Datos = SqlHelper.ExecuteDataset(conexion.cnConexion, "cliente_ObtenerPorDNI_pa", DNI).Tables[0];
                return Datos;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        //funcion para registrar un cliente
        public string clienteRegistrar(Clientes objClientes)
        {
            try
            {
                SqlHelper.ExecuteNonQuery(conexion.cnConexion, "cliente_Registrar_pa", objClientes.Nombre1, objClientes.Nombre2, objClientes.Apaterno, objClientes.Amaterno, objClientes.DNI, objClientes.Celular, objClientes.Direccion, objClientes.Correo,objClientes.Observaciones);
                return "Datos grabados correctamente";
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}

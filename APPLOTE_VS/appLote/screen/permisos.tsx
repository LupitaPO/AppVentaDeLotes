import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';

// Interfaz para el manejo estricto de tipos de los permisos
interface PermisoItem {
  id: number;
  descripcion: string;
  grupo: string;
  activo: boolean;
}

// Interfaz para el manejo de los perfiles que alimentan el combobox
interface PerfilItem {
  id_perfil: number;
  nombre_perfil: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PermisosScreen() {
  // --- ESTADOS DE LA APLICACIÓN ---
  const [perfiles, setPerfiles] = useState<PerfilItem[]>([]); // Lista del combobox
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<number | null>(null); // ID del perfil activo
  const [nombrePerfil, setNombrePerfil] = useState<string>('Seleccione...'); // Texto visible del combo
  const [permisos, setPermisos] = useState<PermisoItem[]>([]); // Datos de la tabla
  const [loading, setLoading] = useState<boolean>(false); // Indicador de carga para la API
  const [mostrarComboOptions, setMostrarComboOptions] = useState<boolean>(false); // Control visual del dropdown

  // --- LLAMADAS A LA API (PROCEDIMIENTOS ALMACENADOS) ---

  // 1. Cargar perfiles del combobox al montar la pantalla (Equivale a un SP: sp_listar_perfiles)
  useEffect(() => {
    const obtenerPerfilesApi = async () => {
      try {
        // Reemplazar URL por el endpoint real de tu API
        const response = await fetch(`${API_URL}/Usuario/formularios_Listar`);
        const datos = await response.json();
        setPerfiles(datos);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los perfiles desde el procedimiento almacenado.');
      }
    };
    obtenerPerfilesApi();
  }, []);

  // 2. Cargar permisos de la tabla según el perfil seleccionado (Equivale a un SP: sp_buscar_permisos_por_perfil)
  const cargarPermisosPorPerfil = async (idPerfil: number) => {
    setLoading(true);
    try {
      // Pasamos el ID del perfil como parámetro de ruta o query a la API
      const response = await fetch(`${API_URL}/Usuario/formularios_Buscar?id_perfil=${idPerfil}`);
      const datos = await response.json();
      setPermisos(datos);
    } catch (error) {
      Alert.alert('Error', 'Error al ejecutar el procedimiento de consulta de permisos.');
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJADORES DE EVENTOS ---

  // Controla el cambio de estado (ON/OFF) localmente en la tabla
  const toggleSwitch = (id: number) => {
    setPermisos(prevPermisos =>
      prevPermisos.map(item =>
        item.id === id ? { ...item, activo: !item.activo } : item
      )
    );
  };

  // Evento al seleccionar un elemento del Combobox
  const seleccionarPerfil = (id: number, nombre: string) => {
    setPerfilSeleccionado(id);
    setNombrePerfil(nombre);
    setMostrarComboOptions(false);
    cargarPermisosPorPerfil(id); // Ejecuta el SP de la tabla automáticamente
  };

  // Guarda los cambios modificados en la tabla (Equivale a un SP: sp_guardar_permisos)
  const handleGuardar = async () => {
    if (!perfilSeleccionado) {
      Alert.alert('Atención', 'Por favor, seleccione un perfil antes de guardar.');
      return;
    }

    try {
      setLoading(true);
      // Envío de datos masivos a la API para persistirlos en la BD
      const response = await fetch(`${API_URL}/Usuario/formularios_Guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_perfil: perfilSeleccionado,
          permisos: permisos
        })
      });

      if (response.ok) {
        Alert.alert('Cambios Guardados', `El procedimiento de actualización se ejecutó con éxito.`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar la interfaz
  const handleSalir = () => {
    Alert.alert('Salir', 'Has salido de la configuración de permisos.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Permisos de Sistema</Text>

      {/* --- COMBOBOX PERSONALIZADO (Llamada a API de perfiles) --- */}
      <View style={styles.perfilContainer}>
        <Text style={styles.label}>Perfil:</Text>
        <View style={{ flex: 1, zIndex: 10 }}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setMostrarComboOptions(!mostrarComboOptions)}
          >
            <Text style={styles.dropdownText}>{nombrePerfil}</Text>
            <Text style={styles.arrow}>{mostrarComboOptions ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Lista desplegable del Combobox */}
          {mostrarComboOptions && (
            <View style={styles.dropdownList}>
              {perfiles.map((item) => (
                <TouchableOpacity
                  key={item.id_perfil}
                  style={styles.dropdownItem}
                  onPress={() => seleccionarPerfil(item.id_perfil, item.nombre_perfil)}
                >
                  <Text style={styles.dropdownItemText}>{item.nombre_perfil}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* --- FORMULARIO / TABLA DINÁMICA DE PERMISOS --- */}
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ flex: 1 }} />
      ) : (
        <ScrollView style={styles.tableContainer}>
          {/* Cabecera del Formulario Tabla */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerCell, { flex: 1 }]}>Item</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 3 }]}>Descripción</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Grupo</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 2, textAlign: 'center' }]}>Activo</Text>
          </View>

          {/* Renderizado de filas del Formulario desde la API */}
          {permisos.length === 0 ? (
            <Text style={styles.noDataText}>Seleccione un perfil para listar el formulario de permisos.</Text>
          ) : (
            permisos.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={[styles.cell, { flex: 1 }]}>{item.id}</Text>
                <Text style={[styles.cell, { flex: 3 }]}>{item.descripcion}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{item.grupo}</Text>
                <View style={[styles.cell, { flex: 2, alignItems: 'center' }]}>
                  <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={item.activo ? '#007BFF' : '#f4f3f4'}
                    onValueChange={() => toggleSwitch(item.id)}
                    value={item.activo}
                  />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* --- BOTONES DE ACCIÓN --- */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.btnSalir]} onPress={handleSalir}>
          <Text style={styles.buttonText}>Salir</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.btnGuardar]} onPress={handleGuardar}>
          <Text style={styles.buttonText}>Guardar Cambios</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  perfilContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownList: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    maxHeight: 150,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  dropdownItemText: {
    fontSize: 15,
  },
  tableContainer: {
    flex: 1,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: '#E9ECEF',
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
  },
  cell: {
    fontSize: 14,
    color: '#495057',
    paddingHorizontal: 4,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#212529',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  btnGuardar: {
    backgroundColor: '#007BFF',
  },
  btnSalir: {
    backgroundColor: '#DC3545',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

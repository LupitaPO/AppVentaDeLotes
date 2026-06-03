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
import { API_URL } from "../config/apiUrl";

// Interfaz adaptada a la respuesta de tu API de listado
interface PermisoItem {
  IdTipo: number;
  Item: number;
  Descripcion: string;
  Grupo: number;
  activo: boolean; // Estado local para controlar el Switch en pantalla
}

// ✅ Interfaz para los perfiles que alimentan el selector de arriba
interface PerfilItem {
  IdTipo: number;
  Descripcion: string;
}

export default function PermisosScreen() {
  const [permisos, setPermisos] = useState<PermisoItem[]>([]); 
  const [loading, setLoading] = useState<boolean>(false); 

  // ✅ NUEVOS ESTADOS EXCLUSIVOS PARA EL SELECTOR SOLICITADO
  const [perfiles, setPerfiles] = useState<PerfilItem[]>([]);
  const [nombrePerfil, setNombrePerfil] = useState<string>('Seleccione...');
  const [mostrarComboOptions, setMostrarComboOptions] = useState<boolean>(false);

  // 🔥 Carga los datos directamente en la tabla al abrir la pantalla
  useEffect(() => {
    const cargarFormulariosTabla = async () => {
      setLoading(true);
      try {
        // Llamamos directamente al endpoint que me indicas
        const response = await fetch(`${API_URL}/Usuario/formularios_Listar_pa`);
        const textoPlano = await response.text();
        const datos = JSON.parse(textoPlano);
        
        console.log('Datos inyectados directo a la tabla:', datos); 

        // Agregamos la propiedad 'activo' por defecto (false) para que funcionen los switches
        const datosConEstado = datos.map((item: any) => ({
          ...item,
          activo: item.activo ?? false 
        }));

        setPermisos(datosConEstado);
      } catch (error) {
        console.log('Error al cargar la tabla:', error); 
        Alert.alert('Error', 'No se pudieron cargar los formularios en la tabla.');
      } finally {
        setLoading(false);
      }
    };
    
    // ✅ CONSUMO DEL NUEVO PROCEDIMIENTO EXCLUSIVAMENTE PARA EL SELECTOR
    const cargarPerfilesSelector = async () => {
      try {
        const response = await fetch(`${API_URL}/Usuario/usuario_Tipo_Listar`);
        const textoPlano = await response.text();
        const datos = JSON.parse(textoPlano);
        setPerfiles(datos);
      } catch (error) {
        console.log('Error al cargar perfiles:', error);
      }
    };

    cargarFormulariosTabla();
    cargarPerfilesSelector(); // Se ejecuta en paralelo sin interferir con la tabla
  }, []);

  // Maneja el encendido y apagado de cada fila individual
  const toggleSwitch = (idTipo: number) => {
    setPermisos(prevPermisos =>
      prevPermisos.map(item =>
        item.IdTipo === idTipo ? { ...item, activo: !item.activo } : item
      )
    );
  };

  // Envía los cambios de la tabla al servidor
  const handleGuardar = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/Usuario/formularios_Guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permisos: permisos // Envía el array de la tabla con los estados modificados
        })
      });

      if (response.ok) {
        Alert.alert('Cambios Guardados', 'Los permisos de la tabla se actualizaron con éxito.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración de la tabla.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Permisos de Sistema</Text>

      {/* --- SECTOR DE PERFIL RE-ACTIVADO CON EL PROCEDIMIENTO usuario_Tipo_Listar --- */}
      <View style={styles.perfilOuterContainer}>
        <View style={styles.perfilContainer}>
          <Text style={styles.label}>Perfil:</Text>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setMostrarComboOptions(!mostrarComboOptions)}
            >
              <Text style={styles.dropdownText}>{nombrePerfil}</Text>
              <Text style={styles.arrow}>{mostrarComboOptions ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {mostrarComboOptions && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                  {perfiles.map((perfil) => (
                    <TouchableOpacity
                      key={perfil.IdTipo} 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setNombrePerfil(perfil.Descripcion);
                        setMostrarComboOptions(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{perfil.Descripcion}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* --- TABLA DIRECTA DE FORMULARIOS --- */}
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ flex: 1, marginTop: 30 }} />
      ) : (
        <View style={styles.tableWrapper}>
          {/* Cabecera fija de la tabla */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerCell, { flex: 1 }]}>Item</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 4 }]}>Descripción del Formulario</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 1.5, textAlign: 'center' }]}>Grupo</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 1.5, textAlign: 'center' }]}>Activo</Text>
          </View>

          {/* Cuerpo scrollable con los datos del endpoint formulaios_Listar_pa */}
          <ScrollView style={styles.tableContainer}>
            {permisos.length === 0 ? (
              <Text style={styles.noDataText}>No se encontraron registros de formularios en el sistema.</Text>
            ) : (
              permisos.map((item) => (
                <View key={item.IdTipo} style={styles.row}>
                  <Text style={[styles.cell, { flex: 1 }]}>{item.Item}</Text>
                  <Text style={[styles.cell, { flex: 4, fontSize: 13 }]}>{item.Descripcion}</Text>
                  <Text style={[styles.cell, { flex: 1.5, textAlign: 'center' }]}>{item.Grupo}</Text>
                  <View style={[styles.cell, { flex: 1.5, alignItems: 'center' }]}>
                    <Switch
                      trackColor={{ false: '#767577', true: '#81b0ff' }}
                      thumbColor={item.activo ? '#007BFF' : '#f4f3f4'}
                      onValueChange={() => toggleSwitch(item.IdTipo)}
                      value={item.activo}
                    />
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* --- BOTONES DE ACCIÓN --- */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.btnSalir]} onPress={() => Alert.alert('Salir', 'Saliendo...')}>
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
  container: { flex: 1, padding: 15, backgroundColor: '#fff', marginTop: 30 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  perfilOuterContainer: { zIndex: 9999, elevation: 10, position: 'relative' },
  perfilContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 16, marginRight: 10, fontWeight: '500', color: '#333' },
  dropdown: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, backgroundColor: '#fff' },
  dropdownText: { fontSize: 15, color: '#333' },
  arrow: { fontSize: 12, color: '#666' },
  dropdownList: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, backgroundColor: '#fff', position: 'absolute', width: '100%', top: 50, zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 10 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dropdownItemText: { fontSize: 15, color: '#333' },
  tableWrapper: { flex: 1, marginTop: 5, zIndex: 1, elevation: 1 },
  tableContainer: { flex: 1 },
  row: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  headerRow: { backgroundColor: '#f5f5f5', borderTopWidth: 1, borderTopColor: '#ddd', borderBottomWidth: 2, borderBottomColor: '#ccc' },
  cell: { paddingHorizontal: 4, color: '#444' },
  headerCell: { fontWeight: 'bold', color: '#222', fontSize: 14 },
  noDataText: { textAlign: 'center', marginTop: 40, color: '#777', paddingHorizontal: 20 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingBottom: 10 },
  button: { padding: 14, borderRadius: 6, width: '48%', alignItems: 'center' },
  btnSalir: { backgroundColor: '#dc3545' },
  btnGuardar: { backgroundColor: '#28a745' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});

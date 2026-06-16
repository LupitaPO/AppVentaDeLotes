import React, { useState, useEffect, useLayoutEffect } from 'react';
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

import { useNavigation } from '@react-navigation/native';
import { API_URL } from "../config/apiUrl";

interface PermisoItem {
  IdTipo: number;       // o.Id_opcion
  Item: number;         // o.Id_opcion
  Descripcion: string;  // o.Opcion_nombre
  activo: boolean;      // calculado por el CASE (1 o 0)
}

interface PerfilItem {
  IdTipo: number;
  Descripcion: string;
}

export default function PermisosScreen() {
  const navigation = useNavigation();

  const [permisos, setPermisos] = useState<PermisoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [perfiles, setPerfiles] = useState<PerfilItem[]>([]);
  const [idPerfilSeleccionado, setIdPerfilSeleccionado] = useState<number | null>(null);
  const [nombrePerfil, setNombrePerfil] = useState<string>('Seleccione...');
  const [mostrarComboOptions, setMostrarComboOptions] = useState<boolean>(false);

  // Mover el Título y la Flecha de Salir a la Cabecera (Header)
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Permisos de Sistema',
      headerTitleAlign: 'center',
      headerStyle: { backgroundColor: '#fff' },
      headerTintColor: '#000',
      headerLeft: () => (
        <TouchableOpacity 
          style={{ marginLeft: 15 }} 
          onPress={() => navigation.goBack()}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#28a745' }}>←</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // 1. Cargar la lista de perfiles/roles al inicializar la pantalla
  useEffect(() => {
    const cargarPerfiles = async () => {
      try {
        const response = await fetch(`${API_URL}/Usuario/usuario_Tipo_Listar`);
        const datos = await response.json();
        setPerfiles(datos);
      } catch (error) {
        console.log("Error cargando perfiles:", error);
        Alert.alert("Error", "No se pudieron cargar los perfiles");
      }
    };
    cargarPerfiles();
  }, []);

  // 2. DETECTOR: Se ejecuta automáticamente cuando seleccionas un Perfil en el Dropdown
  useEffect(() => {
    if (idPerfilSeleccionado === null) return;

    const cargarPermisosPorPerfil = async () => {
      setLoading(true);
      try {
        // Petición apuntando a tu endpoint en C# pasando el ID seleccionado
        const response = await fetch(`${API_URL}/Usuario/permisos-perfil/${idPerfilSeleccionado}`);
        const datos = await response.json();

        // Como tu API devuelve { success: true, data: [...] }, entramos a datos.data
        if (datos.success && datos.data) {
          const formateados = datos.data.map((item: any) => ({
            IdTipo: item.IdTipo || item.Id_opcion, 
            Item: item.Item || item.Id_opcion,
            Descripcion: item.Descripcion || item.Opcion_nombre,
            // Evalúa el resultado del CASE de tu SP (1 es activo, 0 es inactivo)
            activo: item.activo === 1 || item.activo === true || item.activo === "1"
          }));
          setPermisos(formateados);
        } else {
          setPermisos([]);
        }
      } catch (error) {
        console.log("Error cargando permisos del perfil:", error);
        Alert.alert("Atención", "No se encontraron permisos asignados para este rol.");
        setPermisos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarPermisosPorPerfil();
  }, [idPerfilSeleccionado]);

  // Alternar el switch localmente
  const toggleSwitch = (id: number) => {
    setPermisos(prev =>
      prev.map(item =>
        item.IdTipo === id ? { ...item, activo: !item.activo } : item
      )
    );
  };

  // Guardar los cambios
  const handleGuardar = async () => {
    if (!idPerfilSeleccionado) {
      Alert.alert("Atención", "Por favor seleccione un perfil antes de guardar.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/Usuario/permisos_Guardar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idRolUsuario: idPerfilSeleccionado,
          permisos: permisos
        })
      });

      if (response.ok) {
        Alert.alert(
          "Éxito",
          "Cambios guardados correctamente",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("Error", "No se pudo guardar la configuración");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* SECCIÓN PERFIL */}
      <View style={styles.perfilContainer}>
        <Text style={styles.label}>Perfil:</Text>

        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setMostrarComboOptions(!mostrarComboOptions)}
        >
          <Text style={styles.dropdownText}>{nombrePerfil}</Text>
        </TouchableOpacity>

        {mostrarComboOptions && (
          <View style={styles.dropdownList}>
            <ScrollView nestedScrollEnabled={true}>
              {perfiles.map(p => (
                <TouchableOpacity
                  key={p.IdTipo}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setNombrePerfil(p.Descripcion);
                    setIdPerfilSeleccionado(p.IdTipo); // Cambiar el ID dispara el useEffect automáticamente
                    setMostrarComboOptions(false);
                  }}
                >
                  <Text>{p.Descripcion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* TABLA DE PERMISOS */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={{ marginTop: 10, color: '#666' }}>Buscando permisos del perfil...</Text>
        </View>
      ) : idPerfilSeleccionado === null ? (
        <View style={styles.centerLoading}>
          <Text style={{ color: '#999', fontSize: 16 }}>Seleccione un perfil para ver sus accesos</Text>
        </View>
      ) : (
        <View style={styles.tableWrapper}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.headerCell, { flex: 1.2 }]}>Item</Text>
            <Text style={[styles.headerCell, { flex: 4.5 }]}>Descripción</Text>
            <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'center' }]}>Activo</Text>
          </View>

          <ScrollView>
            {permisos.length === 0 ? (
              <Text style={styles.noDataText}>No hay registros para mostrar</Text>
            ) : (
              permisos.map(item => (
                <View key={item.IdTipo} style={styles.row}>
                  <Text style={{ flex: 1.2, paddingLeft: 5 }}>{item.Item}</Text>
                  <Text style={{ flex: 4.5, paddingRight: 5 }}>{item.Descripcion}</Text>
                  <View style={{ flex: 1.5, alignItems: 'center' }}>
                    <Switch
                      value={item.activo}
                      onValueChange={() => toggleSwitch(item.IdTipo)}
                      trackColor={{ false: "#767577", true: "#a1e4b3" }}
                      thumbColor={item.activo ? "#28a745" : "#f4f3f4"}
                    />
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* BOTÓN INFERIOR DE GUARDAR */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.btnGuardar, (!idPerfilSeleccionado || loading) && styles.btnDisabled]}
          onPress={handleGuardar}
          disabled={!idPerfilSeleccionado || loading}
        >
          <Text style={styles.buttonText}>Guardar Cambios</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fff",
  },
  perfilContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    zIndex: 10,
  },
  label: {
    marginRight: 10,
    fontWeight: "bold",
    fontSize: 16,
  },
  dropdown: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#fafafa',
  },
  dropdownText: {
    fontSize: 15,
    color: '#333'
  },
  dropdownList: {
    position: "absolute",
    top: 50,
    left: 55,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    maxHeight: 200,
    zIndex: 999,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  tableWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden'
  },
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerRow: {
    backgroundColor: '#f1f1f1',
    borderBottomWidth: 2,
    borderBottomColor: '#ccc'
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 5
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999'
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 15,
    marginBottom: 5
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 6,
    alignItems: "center"
  },
  btnGuardar: {
    backgroundColor: "#28a745"
  },
  btnDisabled: {
    backgroundColor: "#a1e4b3"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  }
});
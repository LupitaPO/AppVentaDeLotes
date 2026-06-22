import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { API_URL } from "../config/apiUrl";

interface PermisoItem {
  IdTipo: number;       
  Item: number;         
  Descripcion: string;  
  activo: boolean;      
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

  // 1. CARGAR PERFILES: Trae los roles (Gerente, Asesor, etc.) al abrir la pantalla
  useEffect(() => {
    const cargarPerfiles = async () => {
      try {
        const response = await fetch(`${API_URL}/Usuario/usuario_Tipo_Listar`);
        
        if (!response.ok) {
          throw new Error(`Error en el servidor de perfiles. Código: ${response.status}`);
        }

        const datos = await response.json();
        
        if (datos && Array.isArray(datos)) {
          setPerfiles(datos);
        } else if (datos && datos.data && Array.isArray(datos.data)) {
          setPerfiles(datos.data);
        } else {
          setPerfiles([]);
        }
      } catch (error) {
        console.log("Error cargando perfiles:", error);
        Alert.alert("Error", "No se pudieron cargar los perfiles de usuario");
        setPerfiles([]);
      }
    };
    cargarPerfiles();
  }, []);

  // 2. CARGAR PERMISOS: Trae los switches con la consulta ?idRol= cuando seleccionas un perfil
  useEffect(() => {
    if (idPerfilSeleccionado === null) return;

    const cargarPermisosPorPerfil = async () => {
      setLoading(true);
      try {
        // Aquí agregamos el ?idRol= para que tu C# reciba el número del perfil perfectamente
        const response = await fetch(`${API_URL}/Usuario/permisos-perfil?idRol=${idPerfilSeleccionado}`);
        
        if (!response.ok) {
          throw new Error(`Error en el servidor. Código de estado: ${response.status}`);
        }

        const textoRespuesta = await response.text();
        if (!textoRespuesta || textoRespuesta.trim() === "") {
          throw new Error("El servidor devolvió una respuesta vacía.");
        }

        const datos = JSON.parse(textoRespuesta);

        if (datos.success && datos.data) {
          const formateados = datos.data.map((item: any) => ({
            IdTipo: item.IdTipo || item.Id_opcion, 
            Item: item.Item || item.Id_opcion,
            Descripcion: item.Descripcion || item.Opcion_nombre,
            // Aquí se realiza la conversión: si es 1 pasa a true (encendido), si es 0 a false (apagado)
            activo: item.activo == 1 || item.activo === true || item.activo === "1"
          }));
          setPermisos(formateados);
        } else {
          setPermisos([]);
          Alert.alert("Atención", "No se encontraron permisos configurados para este rol.");
        }
      } catch (error) {
        console.log("Error detallado cargando permisos:", error);
        Alert.alert(
          "Error de API", 
          "Ocurrió un inconveniente al procesar los accesos."
        );
        setPermisos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarPermisosPorPerfil();
  }, [idPerfilSeleccionado]);

  // Cambiar el switch de forma local en la pantalla
  const toggleSwitch = (id: number) => {
    setPermisos(prev =>
      prev.map(item =>
        item.IdTipo === id ? { ...item, activo: !item.activo } : item
      )
    );
  };

  // Enviar los nuevos cambios guardados al backend
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
      
      {/* CABECERA CON FLECHA Y TÍTULO */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.mainTitle}>Permisos de Sistema</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* SECCIÓN DESPLEGABLE DE PERFIL */}
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
                    setIdPerfilSeleccionado(p.IdTipo); 
                    setMostrarComboOptions(false);
                  }}
                >
                  <Text style={{ fontSize: 15 }}>{p.Descripcion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* CONTENEDOR CENTRAL: CARGANDO / SELECCIONE / TABLA */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={{ marginTop: 10, color: '#666' }}>Buscando accesos...</Text>
        </View>
      ) : idPerfilSeleccionado === null ? (
        <View style={styles.centerLoading}>
          <Text style={{ color: '#999', fontSize: 16 }}>Seleccione un perfil para ver sus accesos</Text>
        </View>
      ) : (
        <View style={styles.tableWrapper}>
          {/* Encabezados */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.headerCell, { flex: 1.2 }]}>Item</Text>
            <Text style={[styles.headerCell, { flex: 4.5 }]}>Descripción</Text>
            <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'center' }]}>Activo</Text>
          </View>

          {/* Registros */}
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

      {/* SECCIÓN DEL BOTÓN (MÁS ARRIBA PARA QUE NO CHOQUE CON TU TECLADO O TECLAS DE ANDROID) */}
      <View style={styles.bottomSection}>
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
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === 'ios' ? 50 : 20, 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28a745', 
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: '#000',
    flex: 1,
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
    maxHeight: 180,
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
    overflow: 'hidden',
    marginBottom: 10
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
  bottomSection: {
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 35 : 20, 
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 6,
    alignItems: "center"
  },
  btnGuardar: {
    backgroundColor: "#61926d"
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
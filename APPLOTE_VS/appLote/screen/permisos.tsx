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

import { useNavigation } from '@react-navigation/native';
import { API_URL } from "../config/apiUrl";

interface PermisoItem {
  IdTipo: number;
  Item: number;
  Descripcion: string;
  Grupo: number;
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
  const [nombrePerfil, setNombrePerfil] = useState<string>('Seleccione...');
  const [mostrarComboOptions, setMostrarComboOptions] = useState<boolean>(false);

  useEffect(() => {
    const cargarPermisos = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/Usuario/formularios_Listar_pa`);
        const datos = await response.json();

        const formateados = datos.map((item: any) => ({
          IdTipo: item.IdTipo,
          Item: item.Item,
          Descripcion: item.Descripcion,
          Grupo: item.Grupo,
          activo: item.Activo === 1 || item.Activo === true || item.Activo === "1"
        }));

        setPermisos(formateados);

      } catch (error) {
        console.log(error);
        Alert.alert("Error", "No se pudo cargar permisos");
      } finally {
        setLoading(false);
      }
    };

    const cargarPerfiles = async () => {
      try {
        const response = await fetch(`${API_URL}/Usuario/usuario_Tipo_Listar`);
        const datos = await response.json();
        setPerfiles(datos);
      } catch (error) {
        console.log(error);
      }
    };

    cargarPermisos();
    cargarPerfiles();
  }, []);

  const toggleSwitch = (id: number) => {
    setPermisos(prev =>
      prev.map(item =>
        item.IdTipo === id ? { ...item, activo: !item.activo } : item
      )
    );
  };

  const handleGuardar = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/Usuario/formularios_Guardar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permisos: permisos
        })
      });

      if (response.ok) {
        Alert.alert(
          "Éxito",
          "Cambios guardados correctamente",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert("Error", "No se pudo guardar");
      }

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Permisos de Sistema</Text>

      {/* PERFIL */}
      <View style={styles.perfilContainer}>
        <Text style={styles.label}>Perfil:</Text>

        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setMostrarComboOptions(!mostrarComboOptions)}
        >
          <Text>{nombrePerfil}</Text>
        </TouchableOpacity>

        {mostrarComboOptions && (
          <View style={styles.dropdownList}>
            <ScrollView>
              {perfiles.map(p => (
                <TouchableOpacity
                  key={p.IdTipo}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setNombrePerfil(p.Descripcion);
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

      {/* TABLA */}
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <View style={styles.tableWrapper}>

          <View style={styles.row}>
            <Text style={{ flex: 1 }}>Item</Text>
            <Text style={{ flex: 4 }}>Descripción</Text>
            <Text style={{ flex: 1 }}>Grupo</Text>
            <Text style={{ flex: 1 }}>Activo</Text>
          </View>

          <ScrollView>
            {permisos.map(item => (
              <View key={item.IdTipo} style={styles.row}>
                <Text style={{ flex: 1 }}>{item.Item}</Text>
                <Text style={{ flex: 4 }}>{item.Descripcion}</Text>
                <Text style={{ flex: 1 }}>{item.Grupo}</Text>

                <Switch
                  value={item.activo}
                  onValueChange={() => toggleSwitch(item.IdTipo)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* BOTONES */}
      <View style={styles.buttonContainer}>

        <TouchableOpacity
          style={[styles.button, styles.btnSalir]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Salir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.btnGuardar]}
          onPress={handleGuardar}
        >
          <Text style={styles.buttonText}>Guardar Cambios</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

/* ESTILOS (NO CAMBIADOS) */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fff",
    marginTop: 30
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20
  },
  perfilContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20
  },
  label: {
    marginRight: 10,
    fontWeight: "bold"
  },
  dropdown: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5
  },
  dropdownList: {
    position: "absolute",
    top: 45,
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    zIndex: 999
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1
  },
  tableWrapper: {
    flex: 1
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15
  },
  button: {
    flex: 1,
    padding: 14,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: "center"
  },
  btnSalir: {
    backgroundColor: "#dc3545"
  },
  btnGuardar: {
    backgroundColor: "#28a745"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  }
});
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import React, { useEffect, useState } from "react";
import { API_URL } from "../../config/apiUrl";
import { AntDesign } from "@expo/vector-icons";

const ModificarUsuario = ({ route, navigation }) => {
  const { usuario } = route.params || {};

  const [nombre, setNombre] = useState(usuario?.Nombre || "");
  const [correo, setCorreo] = useState(usuario?.Correo || "");
  const [contrasena, setContrasena] = useState(usuario?.Contraseña || "");
  const [tipoUsuario, setTipoUsuario] = useState(usuario?.TipoUsuario || "");
  const [celular, setCelular] = useState(usuario?.Celular || "");
  const [listaTipos, setListaTipos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    listarTiposUsuario();
  }, []);

  const listarTiposUsuario = async () => {
    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Tipo_Listar`);
      const textoCrudo = await response.text();
      const data = textoCrudo?.trim() ? JSON.parse(textoCrudo) : [];
      setListaTipos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al listar tipos de usuario:", error);
      setListaTipos([]);
    }
  };

  const actualizarUsuario = async () => {
    if (!usuario?.IdUsuario) {
      Alert.alert("Error", "No se encontro el usuario seleccionado.");
      return;
    }

    if (!nombre.trim() || !correo.trim() || !contrasena.trim() || !tipoUsuario.trim()) {
      Alert.alert("Error", "Nombre, correo, contraseña y tipo de usuario son obligatorios.");
      return;
    }

    const celularLimpio = celular.trim();
    if (celularLimpio && (celularLimpio.length !== 9 || Number.isNaN(Number(celularLimpio)))) {
      Alert.alert("Celular invalido", "El numero de celular debe tener exactamente 9 digitos.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Actualizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdUsuario: usuario.IdUsuario,
          Nombre: nombre.trim(),
          Correo: correo.trim().toLowerCase(),
          Contraseña: contrasena.trim(),
          TipoUsuario: tipoUsuario.trim(),
          Celular: celularLimpio,
          Estado: usuario?.Estado || "A",
        }),
      });

      const data = await response.text();
      if (response.ok) {
        Alert.alert("Exito", data || "Usuario actualizado correctamente", [
          {
            text: "OK",
            onPress: () => {
              route.params?.onRefresh?.();
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert("Error del servidor", data || "No se pudo actualizar el usuario.");
      }
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      Alert.alert("Error", "Error de conexion con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Text style={styles.title}>Modificar Usuario</Text>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.readonlyLabel}>
            ID Usuario: <Text style={styles.readonlyValue}>{usuario?.IdUsuario || "N/A"}</Text>
          </Text>

          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Carlos Mendoza"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Correo electronico</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Contraseña</Text>

              {/* Contenedor horizontal para el input y el botón */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.inputField} // Nuevo estilo para que no aplaste al botón
                  value={contrasena}
                  onChangeText={setContrasena}
                  placeholder="Nueva clave"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!mostrarPassword} // Si mostrarPassword es false, oculta el texto
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  onPress={() => setMostrarPassword(!mostrarPassword)}
                  style={styles.eyeButton}
                >
                  {/* Puedes usar un texto simple o un componente de iconos como Lucide o Vector Icons */}
                  <AntDesign name={mostrarPassword ? "eye" : "eye-invisible"} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Tipo de usuario</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.75}>
                <View pointerEvents="none">
                  <TextInput
                    style={styles.input}
                    value={tipoUsuario}
                    editable={false}
                    placeholder="Seleccionar..."
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Numero de celular</Text>
          <TextInput
            style={styles.input}
            value={celular}
            onChangeText={setCelular}
            placeholder="Ej. 987654321"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            maxLength={9}
          />

          <TouchableOpacity
            style={[styles.btnGuardar, cargando && styles.btnDisabled]}
            disabled={cargando}
            onPress={actualizarUsuario}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{cargando ? "Guardando..." : "Guardar Cambios"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnCancelar}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Cancelar</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenedor}>
            <Text style={styles.modalTitulo}>Selecciona Tipo de Usuario</Text>

            <ScrollView style={styles.modalLista} showsVerticalScrollIndicator={false}>
              {listaTipos.map((tipo) => (
                <TouchableOpacity
                  key={tipo.IdTipo}
                  style={styles.modalOpcion}
                  onPress={() => {
                    setTipoUsuario(tipo.Descripcion);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.modalOpcionTexto}>{tipo.Descripcion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalBtnCerrar}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... tus otros estilos (row, column, label)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    height: 48,
    backgroundColor: "#fbfffe",
    borderWidth: 1,
    borderColor: "#d5e7e3",
    borderRadius: 15,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 6,
  },
  inputField: {
    flex: 1,                 // Hace que el input tome todo el espacio disponible
    paddingVertical: 10,
    paddingHorizontal: 12,
    // Elimina el borderWidth y borderColor del input original aquí
  },
  eyeButton: {
    padding: 10,             // Zona de toque cómoda para el usuario
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 18,
  },

  // ///////////////////////////////////////////
  container: {
    flex: 1,
    backgroundColor: "#f4fcfb",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  readonlyLabel: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
  },
  readonlyValue: {
    color: "#111827",
    fontWeight: "900",
  },
  label: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: "#fbfffe",
    borderWidth: 1,
    borderColor: "#d5e7e3",
    borderRadius: 15,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 8,
  },
  column: {
    width: "48%",
  },
  btnGuardar: {
    backgroundColor: "#10b981",
    width: "100%",
    maxWidth: 420,
    height: 52,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
    marginTop: 24,
    marginBottom: 12,
  },
  btnCancelar: {
    backgroundColor: "#ef4444",
    width: "100%",
    maxWidth: 420,
    height: 52,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 24,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContenedor: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(6, 148, 136, 0.08)",
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 18,
    textAlign: "center",
  },
  modalLista: {
    width: "100%",
    maxHeight: 260,
  },
  modalOpcion: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#fbfffe",
    borderWidth: 1,
    borderColor: "#d5e7e3",
    marginBottom: 8,
    alignItems: "center",
  },
  modalOpcionTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: "#069488",
  },
  modalBtnCerrar: {
    width: "100%",
    height: 46,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,

  },
});

export default ModificarUsuario;

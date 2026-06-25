import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal, //agrgado para el despegable
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import { API_URL } from "../../config/apiUrl";


const RegistrarUsuario = ({ navigation, route }) => {
  const esWeb = Platform.OS === "web";
  const { height: altoPantalla } = useWindowDimensions();
  const altoFormularioWeb = Math.max(420, altoPantalla - 86);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("")
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [TipoUsuario, setTipoUsuario] = useState("");
  const [celular, setcelular] = useState("");

  const [listaTipos, setListarTipos] = useState([]);
  const [cargando, setCargando] = useState(false);
  // agreagdo para el abrir y cerrar del despegable
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    TipoUsuarioListar();
  }, []);

  ///////////////////////////////////////////////////////////////////////////////////////

  const TipoUsuarioListar = async () => {
    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Tipo_Listar`);
      console.log(response)
      // 1. Leemos la respuesta de Somee como texto plano
      const textoCrudo = await response.text();
      console.log("Datos recibidos de Somee:", textoCrudo);

      // 2. Si el servidor envió datos, los transformamos manualmente a objeto/arreglo
      if (textoCrudo && textoCrudo.trim() !== "") {
        const data = JSON.parse(textoCrudo);
        setListarTipos(data); // Guarda el arreglo en tu estado de React Native
      } else {
        console.warn("Somee sigue respondiendo vacío.");
        setListarTipos([]);
      }

    } catch (error) {
      console.error("Error al procesar el listado:", error);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////
  const registrarUsuario = async () => {
    // 1. Validación de campos obligatorios básicos
    if (!nombre.trim() || !correo.trim() || !contraseña.trim() || !confirmarContraseña.trim() || !TipoUsuario.trim()) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    // 2. NUEVO: Validación de igualdad entre contraseñas
    if (contraseña !== confirmarContraseña) {
      Alert.alert("Error de Coincidencia", "Las contraseñas ingresadas no son iguales. Por favor, verifícalas.");
      return;
    }
    // 3. NUEVO: Validación de estructura de correo @gmail.com
    const correoMinuscula = correo.trim().toLowerCase();
    if (!correoMinuscula.endsWith("@gmail.com")) {
      Alert.alert("Correo Inválido", "El sistema solo permite registros con correos electrónicos de Gmail (@gmail.com).");
      return;
    }

    // 4. NUEVO: Validación de longitud exacta del celular (9 dígitos)
    const celularLimpio = celular.trim();
    if (celularLimpio.length !== 9 || isNaN(Number(celularLimpio))) {
      Alert.alert("Celular Inválido", "El número de celular debe tener exactamente 9 dígitos numéricos.");
      return;
    }
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          Nombre: nombre.trim(),
          Correo: correo.trim(),
          Contraseña: confirmarContraseña.trim(),
          TipoUsuario: TipoUsuario.trim(),
          Celular: celular.trim(),

          Estado: "A",
        }),
      });
      console.log(TipoUsuario)
      const data = await response.text();
      if (response.ok) {
        Alert.alert("Éxito", "Usuario registrado correctamente", [
          {
            text: "OK",
            onPress: () => {
              route.params?.onRefresh?.();
              navigation.goBack();
            },
          },
        ]);

      } else {
        Alert.alert("Error del servidor", data);
      }
    } catch (error) {
      console.error("Error al registrar asesor:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };




  return (
    <View style={[styles.container, esWeb && { height: altoFormularioWeb, maxHeight: altoFormularioWeb }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
      >
        <Text style={styles.title}>Registrar Nuevo Usuario</Text>

        <ScrollView
          style={[styles.scrollView, esWeb && ({ height: altoFormularioWeb, maxHeight: altoFormularioWeb, overflowY: "auto", overflowX: "hidden" } as any)]}
          contentContainerStyle={[styles.scrollContent, esWeb && styles.scrollContentWeb]}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={styles.label}>Nombre Usuario:</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Carlos"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Correo:</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Fila en Paralelo: Contraseña y Confirmación */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Contraseña:</Text>
              <TextInput
                style={styles.input}
                value={contraseña}
                onChangeText={setContraseña}
                placeholder="Escribe clave"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Confirmar Contraseña:</Text>
              <TextInput
                style={styles.input}
                value={confirmarContraseña}
                onChangeText={setConfirmarContraseña}
                placeholder="Repite clave"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          <Text style={styles.label}>TipoUsuario:</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
            <View pointerEvents="none">
              <TextInput
                style={styles.input}
                value={TipoUsuario}
                editable={false}
                placeholder="Seleccionar tipo de usuario"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </TouchableOpacity>

          <Text style={styles.label}>Celular:</Text>
          <TextInput
            style={styles.input}
            value={celular}
            onChangeText={setcelular}
            placeholder="Ej. 987654321"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            maxLength={9}
          />

          <View style={{ height: 20 }} />

          <TouchableOpacity
            style={[styles.btnGuardar, cargando && { opacity: 0.6 }]}
            disabled={cargando}
            onPress={registrarUsuario}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              {cargando ? "Registrando..." : "Registrar Usuario"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnCancelar}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.btnCancelarText}>Cancelar</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL SELECCIONADOR DE ROLES */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenedor}>
            <Text style={styles.modalTitulo}>Selecciona Tipo de Usuario</Text>

            <ScrollView style={{ width: "100%", maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {listaTipos.map((tipo) => (
                <TouchableOpacity
                  key={tipo.IdTipo}
                  style={styles.modalOpcion}
                  onPress={() => {
                    setTipoUsuario(tipo.Descripcion);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalOpcionTexto}>{tipo.Descripcion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalBtnCerrar}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnCerrarText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Fondo principal de la pantalla suave y consistente
  container: {
    flex: 1,
    backgroundColor: "#f4fcfb", // Fondo premium unificado sutil (reemplaza el turquesa viejo)
    paddingHorizontal: 16,
    paddingTop: 50,
  },

  // Título principal del formulario en tipografía robusta
  title: {
    fontSize: 24,
    fontWeight: "900", // Peso visual fuerte idéntico al de asesores
    color: "#111827",  // Tono oscuro principal para alta legibilidad
    textAlign: "center",
    marginBottom: 24,
  },

  scrollView: {
    flex: 1,
  },

  keyboardAvoiding: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  scrollContentWeb: {
    paddingBottom: 140,
  },

  // Etiquetas de los campos adaptadas al diseño móvil unificado
  label: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",  // Texto oscuro limpio
    marginTop: 16,
    marginBottom: 8,
  },

  // Campos de texto estilizados exactamente como el login y asesor nativo
  input: {
    height: 48,
    backgroundColor: "#fbfffe", // Blanco menta muy limpio
    borderWidth: 1,
    borderColor: "#d5e7e3",    // Contorno esmeralda suave
    borderRadius: 15,          // Curvatura idéntica a tus otras pantallas
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

  // Distribución en columnas para campos compartidos (Contraseña y Confirmación)
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 8,
  },

  column: {
    width: "48%",
  },

  // Botón Guardar / Registrar (Diseño responsivo premium insignia)
  btnGuardar: {
    backgroundColor: "#10b981", // Verde éxito moderno de tu marca
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

  // Botón Cancelar sólido y perfectamente simétrico al de Guardar
  btnCancelar: {
    backgroundColor: "#ef4444", // Rojo moderno plano y vivo
    width: "100%",
    maxWidth: 420,
    height: 52, // Altura idéntica a btnGuardar para balance visual perfecto
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#ef4444", // Sombra roja nativa del mismo tono
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 24,
  },

  // Texto interno del botón de guardar
  btnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  // Texto blanco para contraste óptimo sobre el botón de cancelar sólido
  btnCancelarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  // ESTILOS PREMIUM PARA EL MODAL SELECTOR (IGUAL A ASESORES)
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)", // Difuminado sutil para dar enfoque
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContenedor: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 24, // Curva moderna
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
  modalOpcion: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#fbfffe", // Consistencia blanco menta
    borderWidth: 1,
    borderColor: "#d5e7e3",
    marginBottom: 8,
    alignItems: "center",
  },
  modalOpcionTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: "#069488", // Verde esmeralda insignia
  },
  modalBtnCerrar: {
    width: "100%",
    height: 46,
    backgroundColor: "#ef4444", // Rojo plano corporativo
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
  modalBtnCerrarText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
});

export default RegistrarUsuario

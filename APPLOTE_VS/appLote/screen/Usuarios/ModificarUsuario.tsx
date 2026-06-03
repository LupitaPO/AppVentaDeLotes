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
  Modal
} from 'react-native'
import React, { useState, useEffect }  from 'react'

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ModificarUsuario = ({route, navigation}) => {
// Recibimos el objeto usuario actual desde la pantalla anterior
  const { usuario } = route.params || {};

  // Estados basados en los parámetros del procedimiento almacenado
  const [nombre, setNombre] = useState(usuario?.Nombre || "");
  const [correo, setCorreo] = useState(usuario?.Correo || "");
  const [contraseña, setContraseña] = useState(usuario?.Contraseña || "");
  const [tipoUsuario, setTipoUsuario] = useState(usuario?.TipoUsuario || ""); // Ej: "Administrador", "Asesor", etc.
  const [celular, setCelular] = useState(usuario?.Celular || "");

   // Estados para el Modal de roles
  const [listaTipos, setListarTipos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Al montar la pantalla, consumimos la API para llenar el modal
  useEffect(() => {
    TipoUsuarioListar();
  }, []);

  // Obtiene los roles dinámicamente desde la base de datos
  const TipoUsuarioListar = async () => {
    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Tipo_Listar`);
      const textoCrudo = await response.text();
      
      if (textoCrudo && textoCrudo.trim() !== "") {
        const data = JSON.parse(textoCrudo);
        setListarTipos(data); 
      } else {
        setListarTipos([]);
      }
    } catch (error) {
      console.error("Error al procesar el listado de roles:", error);
    }
  };

  const actualizarUsuario = async () => {
    // Validaciones básicas antes de disparar el PA
    if (!nombre.trim() || !correo.trim() || !contraseña.trim() || !tipoUsuario.trim()) {
      Alert.alert("Error", "Nombre, Correo, Contraseña y Tipo de Usuario son obligatorios");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Actualizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idusuario: usuario?.IdUsuario, // Llave primaria para el WHERE del PA          
          nombre: nombre.trim(),
          correo: correo.trim(),
          contraseña: contraseña.trim(),
          tipousuario: tipoUsuario.trim(), // El PA se encargará de buscar el @idtipo correspondiente
          celular: celular.trim(),
          Estado: "A"
        }),
      });

      const data = await response.text();
      if (response.ok) {
        Alert.alert("Éxito", "Usuario actualizado correctamente", [
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
      console.error("Error al actualizar usuario:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
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
          {/* Información Fija Clave */}
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.label}>
              ID Usuario: <Text style={{ fontWeight: "900" }}>{usuario?.IdUsuario}</Text>
            </Text>
          </View>

          {/* Campo Completo: Nombre Completo o Razón */}
          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Carlos Mendoza"
            placeholderTextColor="#94a3b8"
          />

          {/* Campo Completo: Correo Electrónico */}
          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Fila Dividida: Contraseña y Tipo de Usuario */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={contraseña}
                onChangeText={setContraseña}
                placeholder="Nueva clave"
                placeholderTextColor="#94a3b8"
                secureTextEntry // Oculta el texto por seguridad
                autoCapitalize="none"
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Tipo de Usuario:</Text>
              {/* Contenedor transparente que intercepta el clic para desplegar el modal */}
              <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
                <View pointerEvents="none">
                  <TextInput
                    style={styles.input}
                    value={tipoUsuario}
                    editable={false} // Deshabilitamos escritura manual
                    placeholder="Seleccionar..."
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo Completo: Celular */}
          <Text style={styles.label}>Número de Celular</Text>
          <TextInput
            style={styles.input}
            value={celular}
            onChangeText={setCelular}
            placeholder="Ej. 987654321"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            maxLength={9} // Restringido a los 9 dígitos del parámetro varchar(9)
          />

          {/* Espaciador estético */}
          <View style={{ height: 20 }} />

          {/* Botón Principal: Guardar Cambios */}
          <TouchableOpacity
            style={[styles.btnGuardar, cargando && { opacity: 0.6 }]}
            disabled={cargando}
            onPress={actualizarUsuario}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              {cargando ? "Guardando..." : "Guardar Cambios"}
            </Text>
          </TouchableOpacity>

          {/* Botón Secundario: Cancelar */}
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
      {/* MODAL SELECTOR DE ROLES INTEGRADO */}
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
                    setTipoUsuario(tipo.Descripcion); // Al presionar, inyecta la descripción en el input
                    setModalVisible(false); // Cierra la ventana flotante
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalOpcionTexto}>{tipo.Descripcion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Botón Cerrar Modal */}
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
    backgroundColor: "#f4fcfb", // Fondo premium unificado sutil
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  
  // Título principal del formulario en tipografía robusta
  title: {
    fontSize: 24,
    fontWeight: "900", // Peso visual fuerte idéntico al login y dashboards
    color: "#111827",  // Tono oscuro principal para alta legibilidad
    textAlign: "center",
    marginBottom: 24,
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Etiquetas de los campos adaptadas al diseño móvil unificado
  label: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",  // Texto oscuro limpio
    marginTop: 16,
    marginBottom: 8,
  },
  
  // Campos de texto estilizados exactamente como el login nativo
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
  
  // Distribución en columnas para campos compartidos (Contraseña y Rol)
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 8,
  },
  
  column: {
    width: "48%",
  },
  
  // Botón Guardar / Confirmar (Diseño responsivo premium)
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
  
  // Botón Cancelar en bloque sólido para simetría exacta con el de Guardar
  btnCancelar: {
    backgroundColor: "#ef4444", // Rojo moderno plano y vivo
    width: "100%",
    maxWidth: 420,
    height: 52, // Altura idéntica a btnGuardar para balance visual
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
  
  // Texto blanco para contraste óptimo sobre el botón de cancelar
  btnCancelarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900", // Mismo peso visual que el botón guardar
  },
  // Fondo oscuro traslúcido para dar un enfoque premium al modal
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)", // Difuminado sutil idéntico al de cuotas
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  
  // Caja contenedora blanca con esquinas redondeadas y sombras fluidas
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
  
  // Título del encabezado del modal en tipografía robusta
  modalTitulo: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 18,
    textAlign: "center",
  },
  
  // Cada celda o fila opcional de rol dentro del listado
  modalOpcion: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#fbfffe", // Blanco menta idéntico a tus inputs nativos
    borderWidth: 1,
    borderColor: "#d5e7e3",
    marginBottom: 8,
    alignItems: "center",
  },
  
  // Texto interno de las opciones con el color insignia de la marca
  modalOpcionTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: "#069488", // Verde esmeralda insignia
  },
  
  // Botón para cancelar o cerrar el modal
  modalBtnCerrar: {
    width: "100%",
    height: 46,
    backgroundColor: "#ef4444", // Rojo plano moderno y vivo
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
  
  // Texto interno del botón de cierre
  modalBtnCerrarText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
});

export default ModificarUsuario
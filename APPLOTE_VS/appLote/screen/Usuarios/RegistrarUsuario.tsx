import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal, //agrgado para el despegable
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";

const API_URL = "http://www.tulote.somee.com";

const RegistrarUsuario = ({ navigation, route }) => {

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("")
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
      const response = await fetch(`${API_URL}/Usuario/usuario_TipoUsuario_Listar`);
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
    if (!nombre.trim() || !correo.trim() || !contraseña.trim()) {
      Alert.alert("Error", "DNI, Primer Nombre y Apellido Paterno son obligatorios");
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
          Contraseña: contraseña.trim(),
          TipoUsuario: TipoUsuario.trim(),
          Celular: celular.trim(),

          Estado: "A",
        }),
      });

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
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Nuevo Usuario</Text>
      <ScrollView style={styles.scrollView}>




        <Text style={styles.label}>Nombre Usuario:</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre"
        />


        <Text style={styles.label}>Correo:</Text>
        <TextInput
          style={styles.input}
          value={correo}
          onChangeText={setCorreo}
          placeholder="Correo"
        />

        <Text style={styles.label}>Contraseña:</Text>
        <TextInput
          style={styles.input}
          value={contraseña}
          onChangeText={setContraseña}
          placeholder="Apellido Paterno"
        />


        <Text style={styles.label}>TipoUsuario:</Text>
        {/* 3. MODIFICADO: Envolvemos el TextInput en un botón transparente para abrir el desplegable */}
        <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
          <View pointerEvents="none">
            <TextInput
              style={styles.input}
              value={TipoUsuario}
              editable={false}
              placeholder="Tipo Usuario"
            />
          </View>
        </TouchableOpacity>


        <Text style={styles.label}>Celular:</Text>
        <TextInput
          style={styles.input}
          value={celular}
          onChangeText={setcelular}
          placeholder="Celular"
          keyboardType="phone-pad"
        />


        <TouchableOpacity
          style={styles.btnGuardar}
          disabled={cargando}
          onPress={registrarUsuario}
        >
          <Text style={styles.btnText}>Registrar Usuario</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={styles.btnCancelar}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Cancelar</Text>
        </TouchableOpacity> */}
      </ScrollView>

      {/* MODIFICADO: Ventana del Modal mapeando la API de manera automática */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenedor}>
            <Text style={styles.modalTitulo}>Selecciona Tipo de Usuario</Text>

            <ScrollView style={{ width: "100%", maxHeight: 300 }}>
              {/* CORREGIDO: Mapeo de la base de datos */}
              {listaTipos.map((tipo) => (
                <TouchableOpacity
                  key={tipo.IdTipo}
                  style={styles.modalOpcion}
                  onPress={() => {
                    setTipoUsuario(tipo.Descripcion); // Asigna el texto (ej: "Administrador") al input
                    setModalVisible(false); // Cierra el modal
                  }}
                >
                  <Text style={styles.modalOpcionTexto}>{tipo.Descripcion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalOpcion, { backgroundColor: '#ff4d4d', marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalOpcionTexto, { color: '#fff' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e4f5f3",
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#069488",
    textAlign: "center",
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 15,
    marginBottom: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#f1f1f1",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  column: {
    width: "48%",
  },
  btnGuardar: {
    backgroundColor: "#29c268",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  btnCancelar: {
    backgroundColor: "#d3002e",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  // 5. AGREGADO: Estilos específicos para la ventana flotante (Modal)
  modalFondo: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 20 },
  modalContenedor: { backgroundColor: "white", borderRadius: 15, padding: 20, alignItems: "center" },
  modalTitulo: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: "#069488" },
  modalOpcion: { width: "100%", padding: 15, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", alignItems: "center", borderRadius: 8 },
  modalOpcionTexto: { fontSize: 16, color: "#333", fontWeight: "600" }
});

export default RegistrarUsuario
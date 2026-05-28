import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import React, { useState } from "react";

const API_URL = "http://www.tulote.somee.com";

const ModificarCliente = ({ navigation, route }) => {
  const { cliente } = route.params || {};

  const [nombre1, setNombre1] = useState(cliente?.Nombre1 || "");
  const [nombre2, setNombre2] = useState(cliente?.Nombre2 || "");
  const [apaterno, setApaterno] = useState(cliente?.Apaterno || "");
  const [amaterno, setAmaterno] = useState(cliente?.Amaterno || "");
  const [celular, setCelular] = useState(cliente?.Celular || "");
  const [direccion, setDireccion] = useState(cliente?.Direccion || "");
  const [correo, setCorreo] = useState(cliente?.Correo || "");
  const [observaciones, setObservaciones] = useState(cliente?.Observaciones || "");

  const actualizarCliente = async () => {
    try {
      const response = await fetch(`${API_URL}/Cliente/cliente_Actualizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // CAMBIA LOS NOMBRES PARA QUE COINCIDAN CON TU CLASE C#
          DNI: cliente.DNI,
          Nombre1: nombre1,
          Nombre2: nombre2 || "", // Mejor mandar cadena vacía que null si el server es estricto
          Apaterno: apaterno,
          Amaterno: amaterno,
          Celular: celular,
          Direccion: direccion,
          Correo: correo,
          Observaciones: observaciones,

          Estado: cliente.Estado || "", 
          IdCliente: cliente.IdCliente 
        }),
      });

      if (response.ok) {
        Alert.alert("Éxito", "Cliente actualizado correctamente", [
          { text: "OK", onPress: () => {
            route.params?.onRefresh?.();
            navigation.goBack();
          }}
        ]);
      } else {
        const errorMsg = await response.text();
        // Si sale error 400, es que todavía algún nombre no coincide
        console.log("Error del server:", response);
        Alert.alert("Error", "No se pudo actualizar el cliente. Revisa los datos.");
      }
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modificar Cliente</Text>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.label}>DNI: {cliente?.DNI}</Text>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Nombre 1:</Text>
            <TextInput
              style={styles.input}
              value={nombre1}
              onChangeText={setNombre1}
              placeholder="Nombre 1"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Nombre 2:</Text>
            <TextInput
              style={styles.input}
              value={nombre2}
              onChangeText={setNombre2}
              placeholder="Nombre 2 (opcional)"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Apellido Paterno:</Text>
            <TextInput
              style={styles.input}
              value={apaterno}
              onChangeText={setApaterno}
              placeholder="Apellido Paterno"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Apellido Materno:</Text>
            <TextInput
              style={styles.input}
              value={amaterno}
              onChangeText={setAmaterno}
              placeholder="Apellido Materno"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Celular:</Text>
            <TextInput
              style={styles.input}
              value={celular}
              onChangeText={setCelular}
              placeholder="Celular"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Dirección:</Text>
            <TextInput
              style={styles.input}
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Dirección"
            />
          </View>
        </View>

        <Text style={styles.label}>Correo:</Text>
        <TextInput
          style={styles.input}
          value={correo}
          onChangeText={setCorreo}
          placeholder="Correo"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Observaciones:</Text>
        <TextInput
          style={styles.input}
          value={observaciones}
          onChangeText={setObservaciones}
          placeholder="Observaciones"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity style={styles.btnGuardar} onPress={actualizarCliente}>
          <Text style={styles.btnText}>Guardar Cambios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnCancelar} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
// Fondo principal de la pantalla suave y consistente
  container: {
    flex: 1,
    backgroundColor: "#f4fcfb", // Fondo premium unificado sutil (reemplaza el turquesa chillón)
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  
  // Título principal del formulario en tipografía robusta
  title: {
    fontSize: 24,
    fontWeight: "900", // Peso visual fuerte idéntico a tus otras pantallas
    color: "#111827",  // Tono oscuro principal para alta legibilidad
    textAlign: "center",
    marginBottom: 24,
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Etiquetas de los campos adaptadas al diseño móvil de asesores
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
    backgroundColor: "#fbfffe", // Blanco menta limpio
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
  
  // Distribución en columnas para campos compartidos (en paralelo)
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  
  column: {
    width: '48%',
  },
  
  // Botón Guardar / Confirmar (Diseño responsivo premium insignia)
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
  
  // Botón Cancelar sólido y simétrico al de Guardar
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
    fontWeight: "900", // Mismo peso visual que el botón guardar
  },
});
export default ModificarCliente;
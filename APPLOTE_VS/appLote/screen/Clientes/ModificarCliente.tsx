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

const API_URL = "http://10.246.197.207:90";

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  column: {
    width: '48%',
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
});

export default ModificarCliente;
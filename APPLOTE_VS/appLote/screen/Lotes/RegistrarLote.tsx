import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";

const API_URL = "http://10.246.197.207:90";


const RegistrarLote = ({ route, navigation }) => {
  const { idProyecto, onRefresh } = route.params || {};

  const [codLote, setCodLote] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [frenteStr, setFrenteStr] = useState("");
  const [fondoStr, setFondoStr] = useState("");
  const [derechaStr, setDerechaStr] = useState("");
  const [izquierdaStr, setIzquierdaStr] = useState("");
  const [perimetro, setPerimetro] = useState("");
  const [tamañosM2, setTamañosM2] = useState("");
  const [numLote, setNumLote] = useState("");
  const [manzana, setManzana] = useState("");
  const [precio, setPrecio] = useState("");
  const [descrip, setDescrip] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [cargando, setCargando] = useState(false);

  const registrarLote = async () => {
    if (
      !codLote ||
      !ubicacion ||
      !frenteStr ||
      !fondoStr ||
      !derechaStr ||
      !izquierdaStr ||
      !perimetro ||
      !tamañosM2 ||
      !numLote ||
      !manzana ||
      !precio ||
      !descrip ||
      !imgUrl
    ) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/Lote/lote_Registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
    // 1. Campos directos de la clase Lotes
    IdProyecto: idProyecto,
    CodigoLote: codLote,
    Ubicacion: ubicacion,
    NumeroLote: numLote,
    Manzana: manzana,
    Precio: parseFloat(precio) || 0,
    Descripcion: descrip || "",
    ImagenUrl: imgUrl || "",
    EstadoLote: "Libre",

    // 2. LA SOLUCIÓN: Agrupar los campos de medida
    Medida: { 
        Izquierda: izquierdaStr,
        Derecha: derechaStr,
        Frente: frenteStr,
        Fondo: fondoStr,
        Perimetro: parseFloat(perimetro) || 0,
        TamañoM2: parseFloat(tamañosM2) || 0, // Verifica si en C# es TamañoM2 o TamanoM2
        Estado: "A"
    }
}),
      });

      if (response.ok) {
        Alert.alert("Éxito", "Lote registrado correctamente", [
          { text: "OK", onPress: () => {
            onRefresh?.();
            navigation.goBack();
          }},
        ]);
      } else {
        const errorMsg = await response.text();
        Alert.alert("Error", errorMsg || "No se pudo registrar el lote");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registrar Lote</Text>

      <TextInput
        style={styles.input}
        placeholder="Código del Lote"
        value={codLote}
        onChangeText={setCodLote}
      />
      <TextInput
        style={styles.input}
        placeholder="Ubicación"
        value={ubicacion}
        onChangeText={setUbicacion}
      />
      <TextInput
        style={styles.input}
        placeholder="Frente (ej: 10+5)"
        value={frenteStr}
        onChangeText={setFrenteStr}
      />
      <TextInput
        style={styles.input}
        placeholder="Fondo (ej: 15+8)"
        value={fondoStr}
        onChangeText={setFondoStr}
      />
      <TextInput
        style={styles.input}
        placeholder="Derecha (ej: 12+3)"
        value={derechaStr}
        onChangeText={setDerechaStr}
      />
      <TextInput
        style={styles.input}
        placeholder="Izquierda (ej: 11+4)"
        value={izquierdaStr}
        onChangeText={setIzquierdaStr}
      />
      <TextInput
        style={styles.input}
        placeholder="Perímetro"
        value={perimetro}
        onChangeText={setPerimetro}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Tamaño M2"
        value={tamañosM2}
        onChangeText={setTamañosM2}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Número de Lote"
        value={numLote}
        onChangeText={setNumLote}
      />
      <TextInput
        style={styles.input}
        placeholder="Manzana"
        value={manzana}
        onChangeText={setManzana}
      />
      <TextInput
        style={styles.input}
        placeholder="Precio"
        value={precio}
        onChangeText={setPrecio}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Descripción"
        value={descrip}
        onChangeText={setDescrip}
      />
      <TextInput
        style={styles.input}
        placeholder="URL de Imagen"
        value={imgUrl}
        onChangeText={setImgUrl}
      />

      <TouchableOpacity
        style={[styles.button, cargando && styles.buttonDisabled]}
        onPress={registrarLote}
        disabled={cargando}
      >
        <Text style={styles.buttonText}>
          {cargando ? "Registrando..." : "Registrar Lote"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#e4f5f3",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#069488",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#069488",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RegistrarLote;
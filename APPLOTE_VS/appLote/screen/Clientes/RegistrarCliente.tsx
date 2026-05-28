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

const RegistrarCliente = ({ navigation, route }) => {
  const [dni, setDni] = useState("");
  const [nombre1, setNombre1] = useState("");
  const [nombre2, setNombre2] = useState("");
  const [apaterno, setApaterno] = useState("");
  const [amaterno, setAmaterno] = useState("");
  const [celular, setCelular] = useState("");
  const [direccion, setDireccion] = useState("");
  const [correo, setCorreo] = useState("");
  const [observaciones, setObservaciones] = useState("");

 const [cargando, setCargando] = useState(false); // <--- Nuevo estado

const registrarCliente = async () => {
    if (!dni.trim() || !nombre1.trim() || !apaterno.trim()) {
        Alert.alert("Error", "DNI, Primer Nombre y Apellido Paterno son obligatorios");
        return;
    }

    setCargando(true); // Bloqueamos el botón

    try {
        const response = await fetch(`${API_URL}/Cliente/cliente_Registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                DNI: dni.trim(),
                Nombre1: nombre1.trim(),
                Nombre2: nombre2.trim() || "", 
                Apaterno: apaterno.trim(),
                Amaterno: amaterno.trim(),
                Celular: celular.trim(),
                Direccion: direccion.trim(),
                Correo: correo.trim().toLowerCase(), // Correo siempre en minúsculas
                Observaciones: observaciones.trim() || "",
                Estado: "A" 
            }),
        });

        const data = await response.text();

        if (response.ok) {
            console.log("eror",response)
            Alert.alert("Éxito", "Cliente registrado correctamente", [
                { text: "OK", onPress: () => {
                    route.params?.onRefresh?.();
                    navigation.goBack();
                }}
            ]);
        } else {
            // Aquí 'data' nos dirá si el DNI ya existe, por ejemplo.
            Alert.alert("Error del Servidor", data);
        }
    } catch (error) {
        Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
        setCargando(false); // Liberamos el botón
    }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Nuevo Cliente</Text>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.label}>DNI:</Text>
        <TextInput
          style={styles.input}
          value={dni}
          onChangeText={setDni}
          placeholder="DNI"
          keyboardType="numeric"
        />

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

        <TouchableOpacity style={styles.btnGuardar} disabled={cargando} onPress={registrarCliente}>
          <Text style={styles.btnText}>Registrar Cliente</Text>
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
    backgroundColor: "#f4fcfb", // Fondo premium unificado sutil (reemplaza el turquesa saturado)
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
    fontWeight: "900", // Mismo peso visual que el botón guardar
  },
});


export default RegistrarCliente;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { API_URL } from "../../config/apiUrl";


const ModificarAsesor = ({ navigation, route }) => {
    
  const { asesor } = route.params || {};
  const [nombre1, setNombre1] = useState(asesor?.Nombre1 || "");
  const [nombre2, setNombre2] = useState(asesor?.Nombre2 || "");
  const [apaterno, setApaterno] = useState(asesor?.Apaterno || "");
  const [amaterno, setAmaterno] = useState(asesor?.Amaterno || "");
  const [celular, setCelular] = useState(asesor?.Celular || "");
  const [observaciones, setObservaciones] = useState(asesor?.Observaciones || "");
  const [estado] = useState(asesor?.Estado || "");
  const [cargando, setCargando] = useState(false);

  const actualizarAsesor = async () => {
    if (!nombre1.trim() || !apaterno.trim()) {
      Alert.alert("Error", "Primer Nombre y Apellido Paterno son obligatorios");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/Asesor/asesor_Modificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
    
        DNI: asesor?.DNI,           
        Nombre1: nombre1.trim(),    
        Nombre2: nombre2.trim() || "", 
        Apaterno: apaterno.trim(),  
        Amaterno: amaterno.trim(),  
        Celular: celular.trim(),           
        Observaciones: observaciones.trim() || "",
        Estado: asesor?.Estado || "A" 
        }),
      });

      const data = await response.text();
      if (response.ok) {
        Alert.alert("Éxito", "Asesor actualizado correctamente", [
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
      console.error("Error al actualizar asesor:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
    {/* Contenedor nativo para evitar que el teclado tape los inputs inferiores */}
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      {/* Título unificado del Formulario */}
      <Text style={styles.title}>Modificar Asesor</Text>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Permite presionar botones sin que se oculte el teclado bruscamente
      >
        {/* Bloque de Información Fija / Solo Lectura */}
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.label}>
            DNI del Asesor: <Text style={{ fontWeight: "900" }}>{asesor?.DNI}</Text>
          </Text>
          <Text style={styles.label}>
            Estado Actual: <Text style={{ fontWeight: "900", color: "#069488" }}>{estado}</Text>
          </Text>
        </View>

        {/* FILA 1: Nombres (Paralelos y simétricos) */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Primer Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre1}
              onChangeText={setNombre1}
              placeholder="Ej. Juan"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Segundo Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre2}
              onChangeText={setNombre2}
              placeholder="Opcional"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* FILA 2: Apellidos (Paralelos y simétricos) */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Apellido Paterno</Text>
            <TextInput
              style={styles.input}
              value={apaterno}
              onChangeText={setApaterno}
              placeholder="Ej. Pérez"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Apellido Materno</Text>
            <TextInput
              style={styles.input}
              value={amaterno}
              onChangeText={setAmaterno}
              placeholder="Ej. Gómez"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Campo Único: Celular */}
        <Text style={styles.label}>Número de Celular</Text>
        <TextInput
          style={styles.input}
          value={celular}
          onChangeText={setCelular}
          placeholder="Ej. 987654321"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />

        {/* Campo Único: Observaciones (Estilizado de forma controlada) */}
        <Text style={styles.label}>Observaciones Internas</Text>
        <TextInput
          style={[styles.input, { height: 100, paddingTop: 12, textAlignVertical: "top" }]}
          value={observaciones}
          onChangeText={setObservaciones}
          placeholder="Añade detalles relevantes..."
          placeholderTextColor="#94a3b8"
          multiline={true}
          numberOfLines={4}
        />

        {/* Espaciador sutil antes de los botones de acción */}
        <View style={{ height: 12 }} />

        {/* Botón Principal: Guardar Cambios */}
        <TouchableOpacity
          style={[styles.btnGuardar, cargando && { opacity: 0.6 }]}
          disabled={cargando}
          onPress={actualizarAsesor}
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

        {/* Espacio final para que el scroll respire en pantallas pequeñas */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  
  // Distribución en columnas para campos compartidos (ej: Nombre y Apellido en una fila)
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
  
  // CORREGIDO: Botón Cancelar en bloque sólido con su respectiva sombra e idéntica altura
  btnCancelar: {
    backgroundColor: "#ef4444", // Rojo moderno plano y vivo
    width: "100%",
    maxWidth: 420,
    height: 52, // Altura idéntica a btnGuardar para simetría exacta
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
  
  // CORREGIDO: Texto blanco para contraste perfecto sobre el fondo rojo del botón
  btnCancelarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900", // Mismo peso visual que el botón guardar
  },
});

export default ModificarAsesor;

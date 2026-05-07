import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Reemplaza con tu URL de Azure cuando la tengas
const API_URL = "http://10.246.197.207:90";

const DetallePago = ({ route, navigation }) => {
  const { cuota } = route.params; 
  
  const [cargando, setCargando] = useState(false);
  // Estado dinámico para elegir el comprobante (1: Boleta, 2: Factura, 3: Ticket)
  const [tipoComprobante, setTipoComprobante] = useState(1); 

  const realizarPago = async () => {
    const idCronogramaFinal = parseInt(cuota?.IdCronograma || cuota?.idCronograma);
    
    // Usamos el ID que el usuario seleccionó en la interfaz
    const idTipoComprobanteFinal = tipoComprobante; 

    if (isNaN(idCronogramaFinal)) {
      Alert.alert("Error", "El ID de la cuota no es un número válido.");
      return;
    }

    try {
      setCargando(true);

      const datosParaEnviar = {
        IdCronograma: idCronogramaFinal,
        IdTipoComprobante: idTipoComprobanteFinal
      };

      const response = await fetch(`${API_URL}/Pago/pago_Registrar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/plain' 
        },
        body: JSON.stringify(datosParaEnviar)
      });

      const textoRespuesta = await response.text();

      if (response.ok && textoRespuesta.trim() === "Pago Registrado Correctamente") {
        Alert.alert("¡Éxito!", "Pago Registrado Correctamente", [
          { text: "OK", onPress: () => { route.params?.onRefresh?.(); navigation.goBack() }}
        ]);
      } else {
        Alert.alert("Atención", "Servidor dice: " + (textoRespuesta || "Sin respuesta"));
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el API local.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar Pago</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="cash-register" size={50} color="#069488" style={styles.iconCenter} />
          <Text style={styles.label}>Monto de la Cuota</Text>
          <Text style={styles.monto}>${cuota.MontoCuota}</Text>
          <View style={styles.divider} />
          <Text style={styles.subLabel}>Fecha de Vencimiento: {cuota.FechaVencimiento}</Text>
          <Text style={styles.subLabel}>Estado Actual: {cuota.EstadoCuota}</Text>
        </View>

        <Text style={styles.sectionTitle}>Seleccione Tipo de Comprobante</Text>
        
        {/* CONTENEDOR DE 3 BOTONES */}
        <View style={styles.comprobanteContainer}>
          <TouchableOpacity 
            style={[styles.selector, tipoComprobante === 1 && styles.selectorActive]} 
            onPress={() => setTipoComprobante(1)}
          >
            <Text style={[styles.selectorText, tipoComprobante === 1 && styles.selectorTextActive]}>Boleta</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.selector, tipoComprobante === 2 && styles.selectorActive]} 
            onPress={() => setTipoComprobante(2)}
          >
            <Text style={[styles.selectorText, tipoComprobante === 2 && styles.selectorTextActive]}>Factura</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.selector, tipoComprobante === 3 && styles.selectorActive]} 
            onPress={() => setTipoComprobante(3)}
          >
            <Text style={[styles.selectorText, tipoComprobante === 3 && styles.selectorTextActive]}>Ticket</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warningBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#856404" />
          <Text style={styles.warningText}>
            Nota: El sistema registrará el pago bajo el tipo de comprobante seleccionado y aplicará mora si corresponde.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnPago, cargando && styles.btnDeshabilitado]} 
          onPress={realizarPago}
          disabled={cargando || cuota.EstadoCuota === 'Pagado'}
        >
          {cargando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color="#fff" />
              <Text style={styles.btnText}>PROCEDER AL PAGO</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7f6" },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 20, 
    backgroundColor: "#fff",
    elevation: 2 
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  content: { padding: 20 },
  infoCard: { 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    padding: 25, 
    alignItems: "center", 
    elevation: 3,
    marginBottom: 25 
  },
  iconCenter: { marginBottom: 15 },
  label: { fontSize: 14, color: "#888", fontWeight: "600" },
  monto: { fontSize: 40, fontWeight: "bold", color: "#069488", marginVertical: 10 },
  divider: { width: "100%", height: 1, backgroundColor: "#eee", marginVertical: 15 },
  subLabel: { fontSize: 15, color: "#555", marginBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#444", marginBottom: 15 },
  
  // Estilos ajustados para 3 botones en una fila
  comprobanteContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 25,
    gap: 8 
  },
  selector: { 
    flex: 1,
    paddingVertical: 15, 
    borderRadius: 12, 
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center"
  },
  selectorActive: { backgroundColor: "#069488", borderColor: "#069488" },
  selectorText: { fontWeight: "600", color: "#666", fontSize: 13 },
  selectorTextActive: { color: "#fff" },

  warningBox: { 
    flexDirection: "row", 
    backgroundColor: "#fff3cd", 
    padding: 15, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#ffeeba" 
  },
  warningText: { flex: 1, fontSize: 13, color: "#856404", marginLeft: 10 },
  footer: { padding: 20, backgroundColor: "#fff" },
  btnPago: { 
    backgroundColor: "#069488", 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 18, 
    borderRadius: 15,
    gap: 10 
  },
  btnDeshabilitado: { backgroundColor: "#ccc" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default DetallePago;

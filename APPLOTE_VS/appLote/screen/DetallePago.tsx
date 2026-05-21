// React y hook local para manejar estados internos de la pantalla.
import React, { useState } from "react";

// Componentes base de React Native para estructura, scroll, botones, alertas y carga.
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

// Librería de íconos utilizada para navegación y apoyo visual en la interfaz.
import { MaterialCommunityIcons } from "@expo/vector-icons";

// URL base del backend usada para registrar pagos.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const DetallePago = ({ route, navigation }) => {
  // Recibe la cuota seleccionada desde la pantalla anterior.
  const { cuota } = route.params; 
  
  // Controla el spinner mientras se envía el registro del pago al servidor.
  const [cargando, setCargando] = useState(false);

  // Estado dinámico para elegir el comprobante (1: Boleta, 2: Factura, 3: Ticket)
  const [tipoComprobante, setTipoComprobante] = useState(1); 

  // Toma la cuota actual, arma el payload y registra el pago en la API.
  const realizarPago = async () => {
    // Convierte el identificador del cronograma a número, aceptando distintos nombres de propiedad.
    const idCronogramaFinal = parseInt(cuota?.IdCronograma || cuota?.idCronograma);
    
    // Usamos el ID que el usuario seleccionó en la interfaz
    const idTipoComprobanteFinal = tipoComprobante; 

    // Evita enviar la solicitud si el id de cronograma no es válido.
    if (isNaN(idCronogramaFinal)) {
      Alert.alert("Error", "El ID de la cuota no es un número válido.");
      return;
    }

    try {
      setCargando(true);

      // Objeto que el backend espera para registrar el pago.
      const datosParaEnviar = {
        IdCronograma: idCronogramaFinal,
        IdTipoComprobante: idTipoComprobanteFinal
      };

      // Envía la solicitud POST al endpoint de pagos.
      const response = await fetch(`${API_URL}/Pago/pago_Registrar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/plain' 
        },
        body: JSON.stringify(datosParaEnviar)
      });

      // La API responde en texto plano, por eso se lee como string y no como JSON.
      const textoRespuesta = await response.text();

      // Si el backend confirma el registro, refresca la pantalla anterior y vuelve atrás.
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
    /* Contenedor seguro para respetar bordes del dispositivo y áreas del sistema. */
    <SafeAreaView style={styles.container}>
      {/* Cabecera superior con botón de regreso y título de la pantalla. */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar Pago</Text>
        <View style={{ width: 28 }} /> 
      </View>

      {/* Contenido principal desplazable con el resumen de la cuota y selección de comprobante. */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Tarjeta informativa con el monto, fecha y estado actual de la cuota. */}
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
        {/* Grupo de selectores para elegir el tipo de comprobante a emitir. */}
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

        {/* Aviso informativo para aclarar cómo se registrará el pago. */}
        <View style={styles.warningBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#856404" />
          <Text style={styles.warningText}>
            Nota: El sistema registrará el pago bajo el tipo de comprobante seleccionado y aplicará mora si corresponde.
          </Text>
        </View>
      </ScrollView>

      {/* Pie fijo con el botón principal de confirmación del pago. */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnPago, cargando && styles.btnDeshabilitado]} 
          onPress={realizarPago}
          disabled={cargando || cuota.EstadoCuota === 'Pagado'}
        >
          {/* Si está procesando, muestra spinner; si no, muestra ícono y texto del botón. */}
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
  // Fondo principal de la pantalla.
  container: { flex: 1, backgroundColor: "#f4f7f6" },

  // Estilos del encabezado superior.
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 20, 
    backgroundColor: "#fff",
    elevation: 2 
  },

  // Título principal del encabezado.
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },

  // Espaciado interno del contenido desplazable.
  content: { padding: 20 },

  // Tarjeta con el resumen visual de la cuota seleccionada.
  infoCard: { 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    padding: 25, 
    alignItems: "center", 
    elevation: 3,
    marginBottom: 25 
  },

  // Posición del ícono central de la tarjeta informativa.
  iconCenter: { marginBottom: 15 },

  // Etiqueta descriptiva del monto.
  label: { fontSize: 14, color: "#888", fontWeight: "600" },

  // Monto principal mostrado en grande.
  monto: { fontSize: 40, fontWeight: "bold", color: "#069488", marginVertical: 10 },

  // Separador visual entre el monto y los demás datos de la cuota.
  divider: { width: "100%", height: 1, backgroundColor: "#eee", marginVertical: 15 },

  // Texto secundario para fecha de vencimiento y estado.
  subLabel: { fontSize: 15, color: "#555", marginBottom: 5 },

  // Título de la sección de selección del comprobante.
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#444", marginBottom: 15 },
  
  // Estilos ajustados para 3 botones en una fila
  // Contenedor horizontal de los botones de tipo de comprobante.
  comprobanteContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 25,
    gap: 8 
  },

  // Estilo base de cada botón selector.
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

  // Estilo visual del selector actualmente activo.
  selectorActive: { backgroundColor: "#069488", borderColor: "#069488" },

  // Texto del selector en estado normal.
  selectorText: { fontWeight: "600", color: "#666", fontSize: 13 },

  // Texto del selector cuando está activo.
  selectorTextActive: { color: "#fff" },

  // Caja de advertencia/información debajo del selector.
  warningBox: { 
    flexDirection: "row", 
    backgroundColor: "#fff3cd", 
    padding: 15, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#ffeeba" 
  },

  // Texto informativo dentro de la caja de advertencia.
  warningText: { flex: 1, fontSize: 13, color: "#856404", marginLeft: 10 },

  // Contenedor del botón inferior fijo.
  footer: { padding: 20, backgroundColor: "#fff" },

  // Botón principal para confirmar el pago.
  btnPago: { 
    backgroundColor: "#069488", 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 18, 
    borderRadius: 15,
    gap: 10 
  },

  // Estilo aplicado cuando el botón está deshabilitado.
  btnDeshabilitado: { backgroundColor: "#ccc" },

  // Texto del botón principal.
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default DetallePago;

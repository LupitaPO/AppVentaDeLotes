import React, { useEffect, useState } from "react";
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


const RegistrarVenta = ({ route, navigation }) => {
  const {
    idLote,
    idUsuario,
    codigoLote,
    precioVenta: precioInicial,
    onRefresh,
  } = route.params || {};

  const [clienteDni, setClienteDni] = useState("");
  const [asesorDni, setAsesorDni] = useState("");
  const [precioVenta, setPrecioVenta] = useState(
    precioInicial?.toString() || "",
  );
  const [montoInicial, setMontoInicial] = useState("");
  const [tipoVenta, setTipoVenta] = useState("Contado");
  const [tipoPago, setTipoPago] = useState("Mensual");
  const [plazoMeses, setPlazoMeses] = useState("");
  const [observacion, setObservacion] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (precioInicial) {
      setPrecioVenta(precioInicial.toString());
      setMontoInicial(precioInicial.toString());
    }
  }, [precioInicial]);

  const obtenerIdClientePorDNI = async (dni) => {
    try {
      const response = await fetch(`${API_URL}/Cliente/cliente_Listar`);
      const data = await response.json();
      const cliente = data.find(
        (item) => item.DNI?.toString()?.trim() === dni.toString().trim(),
      );
      return cliente?.IdCliente || cliente?.idCliente || cliente?.Id || null;
    } catch (error) {
      console.error("Error al obtener cliente:", error);
      return null;
    }
  };

  const obtenerIdAsesorPorDNI = async (dni) => {
    try {
      const response = await fetch(`${API_URL}/Asesor/asesor_Listar`);
      const data = await response.json();
      const asesor = data.find(
        (item) => item.DNI?.toString()?.trim() === dni.toString().trim(),
      );
      return asesor?.IdAsesor || asesor?.idAsesor || asesor?.Id || null;
    } catch (error) {
      console.error("Error al obtener asesor:", error);
      return null;
    }
  };

  const registrarVenta = async () => {
    if (!idLote) {
      Alert.alert("Error", "El lote no está definido.");
      return;
    }

    if (!idUsuario) {
      Alert.alert("Error", "No se encontró el usuario que realiza la venta.");
      return;
    }

    if (!clienteDni.trim() || !asesorDni.trim() || !precioVenta.trim()) {
      Alert.alert(
        "Error",
        "DNI de cliente, DNI de asesor y precio son obligatorios.",
      );
      return;
    }

    const precio = parseFloat(precioVenta.replace(/,/g, "."));
    if (Number.isNaN(precio) || precio <= 0) {
      Alert.alert("Error", "Ingrese un precio de venta válido.");
      return;
    }

    let montoInicialFinal = montoInicial;
    let plazoFinal = plazoMeses;
    let tipoPagoFinal = tipoPago;

    if (tipoVenta === "Contado") {
      montoInicialFinal = precio.toString();
      tipoPagoFinal = "Contado";
      plazoFinal = "0";
    } else {
      if (!montoInicial.trim() || !tipoPago.trim() || !plazoMeses.trim()) {
        Alert.alert(
          "Error",
          "Para venta financiada debe completar monto inicial, tipo de pago y plazo.",
        );
        return;
      }
      const monto = parseFloat(montoInicial.replace(/,/g, "."));
      const plazo = parseInt(plazoMeses, 10);
      if (Number.isNaN(monto) || monto <= 0 || monto >= precio) {
        Alert.alert(
          "Error",
          "El monto inicial debe ser menor al precio de venta.",
        );
        return;
      }
      if (Number.isNaN(plazo) || plazo <= 0) {
        Alert.alert("Error", "Ingrese un plazo válido en meses.");
        return;
      }
      montoInicialFinal = monto.toString();
      plazoFinal = plazo.toString();
    }

    setCargando(true);

    const idCliente = await obtenerIdClientePorDNI(clienteDni);
    if (!idCliente) {
      setCargando(false);
      Alert.alert("Error", "No se encontró un cliente con ese DNI.");
      return;
    }

    const idAsesor = await obtenerIdAsesorPorDNI(asesorDni);
    if (!idAsesor) {
      setCargando(false);
      Alert.alert("Error", "No se encontró un asesor con ese DNI.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/Venta/venta_registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          IdLote: idLote,
          IdUsuario: idUsuario,
          IdCliente: idCliente,
          IdAsesor: idAsesor,
          PrecioVenta: precio,
          MontoInicial: parseFloat(montoInicialFinal.replace(/,/g, ".")),
          TipoVenta: tipoVenta,
          TipoPago: tipoPagoFinal,
          PlazoMeses: parseInt(plazoFinal),
          Observacion: observacion || "",
          EstadoVenta: "Activo",
        }),
      });

      if (response.ok) {
        Alert.alert("Éxito", "Venta registrada correctamente.", [
          {
            text: "OK",
            onPress: () => {
              onRefresh?.();
              navigation.goBack();
            },
          },
        ]);
      } else {
        console.log("error", response);
        const text = await response.text();
        Alert.alert("Error", text || "No se pudo registrar la venta.");
      }
    } catch (error) {
      console.error("Error al registrar venta:", error);
      Alert.alert("Error", "Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Venta</Text>
      <Text style={styles.label}>Lote: {codigoLote || "Sin código"}</Text>
      <Text style={styles.label}>ID Lote: {idLote || "No disponible"}</Text>

      <TextInput
        style={styles.input}
        placeholder="DNI del cliente"
        value={clienteDni}
        onChangeText={setClienteDni}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="DNI del asesor"
        value={asesorDni}
        onChangeText={setAsesorDni}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Precio de venta"
        value={precioVenta}
        onChangeText={setPrecioVenta}
        keyboardType="numeric"
      />

      <Text style={styles.sectionTitle}>Tipo de venta</Text>
      <View style={styles.row}>
        {[
          { label: "Contado", value: "Contado" },
          { label: "Financiado", value: "Financiado" },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              tipoVenta === option.value && styles.optionSelected,
            ]}
            onPress={() => setTipoVenta(option.value)}
          >
            <Text
              style={
                tipoVenta === option.value
                  ? styles.optionTextSelected
                  : styles.optionText
              }
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tipoVenta === "Financiado" && (
        <>
          <Text style={styles.sectionTitle}>Tipo de pago</Text>
          <View style={styles.row}>
            {[
              { label: "Mensual", value: "Mensual" },
              { label: "Trimestral", value: "Trimestral" },
              { label: "Semestral", value: "Semestral" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  tipoPago === option.value && styles.optionSelected,
                ]}
                onPress={() => setTipoPago(option.value)}
              >
                <Text
                  style={
                    tipoPago === option.value
                      ? styles.optionTextSelected
                      : styles.optionText
                  }
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Monto inicial"
            value={montoInicial}
            onChangeText={setMontoInicial}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Plazo en meses"
            value={plazoMeses}
            onChangeText={setPlazoMeses}
            keyboardType="numeric"
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Observación"
        value={observacion}
        onChangeText={setObservacion}
      />

      <TouchableOpacity
        style={[styles.button, cargando && styles.buttonDisabled]}
        onPress={registrarVenta}
        disabled={cargando}
      >
        <Text style={styles.buttonText}>
          {cargando ? "Guardando..." : "Registrar Venta"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e4f5f3",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#069488",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#069488",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  option: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: "#069488",
    borderColor: "#069488",
  },
  optionText: {
    color: "#333",
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#069488",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#9ecdc9",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RegistrarVenta;

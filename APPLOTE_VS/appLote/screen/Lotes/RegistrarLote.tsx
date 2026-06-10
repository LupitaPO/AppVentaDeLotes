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
import { API_URL } from "../../config/apiUrl";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";




const RegistrarLote = ({ route, navigation }: { route: any; navigation: any }) => {
  const { idProyecto, proyectoNombre: proyectoNombreParam, onRefresh } = route.params || {};
  console.log("RegistrarLote route.params:", route.params);
  const [proyectoNombre, setProyectoNombre] = useState(proyectoNombreParam || "");
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

  useEffect(() => {
    console.log("RegistrarLote idProyecto/proyectoNombre:", { idProyecto, proyectoNombre });
    if (idProyecto && !proyectoNombre) {
      const obtenerNombreProyecto = async () => {
        try {
          const response = await fetch(`${API_URL}/Proyecto/proyecto_Listar`);
          const data = await response.json();
          const proyecto = (data || []).find(
            (item: any) =>
              item.IdProyecto?.toString() === idProyecto?.toString() ||
              item.idProyecto?.toString() === idProyecto?.toString()
          );
          if (proyecto) {
            setProyectoNombre(
              proyecto.NombreProyecto || proyecto.nombreProyecto || proyecto.Nombre || proyecto.nombre || ""
            );
          }
        } catch (error) {
          console.error("Error obteniendo nombre de proyecto:", error);
        }
      };
      obtenerNombreProyecto();
    }
  }, [idProyecto, proyectoNombre]);

  const parseDimension = (value: string): number | null => {
    if (!value) return null;
    const cleaned = value.replace(/,/g, ".").replace(/\s/g, "");
    const parts = cleaned
      .split("+")
      .map((part) => parseFloat(part))
      .filter((n) => !Number.isNaN(n));
    if (parts.length === 0) return null;
    return parts.reduce((sum, part) => sum + part, 0);
  };

  useEffect(() => {
    const frente = parseDimension(frenteStr);
    const fondo = parseDimension(fondoStr);
    const derecha = parseDimension(derechaStr);
    const izquierda = parseDimension(izquierdaStr);

    if (frente !== null && fondo !== null) {
      const ancho = (frente + fondo) / 2;
      if (derecha !== null && izquierda !== null) {
        const alto = (derecha + izquierda) / 2;
        setTamañosM2((ancho * alto).toFixed(2).toString());
      } else if (derecha !== null) {
        setTamañosM2((ancho * derecha).toFixed(2).toString());
      } else if (izquierda !== null) {
        setTamañosM2((ancho * izquierda).toFixed(2).toString());
      }
    } else if (derecha !== null && izquierda !== null) {
      const alto = (derecha + izquierda) / 2;
      if (frente !== null) {
        setTamañosM2((frente * alto).toFixed(2).toString());
      } else if (fondo !== null) {
        setTamañosM2((fondo * alto).toFixed(2).toString());
      }
    }
  }, [frenteStr, fondoStr, derechaStr, izquierdaStr]);

  useEffect(() => {
    const frente = parseDimension(frenteStr);
    const fondo = parseDimension(fondoStr);
    const derecha = parseDimension(derechaStr);
    const izquierda = parseDimension(izquierdaStr);

    if (
      frente !== null &&
      fondo !== null &&
      derecha !== null &&
      izquierda !== null
    ) {
      setPerimetro((frente + fondo + derecha + izquierda).toString());
    } else {
      setPerimetro("");
    }
  }, [frenteStr, fondoStr, derechaStr, izquierdaStr]);

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
          {
            text: "OK", onPress: () => {
              onRefresh?.();
              navigation.goBack();
            }
          },
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Lote</Text>

      {idProyecto ? (
        <View style={styles.projectInfoBox}>
          <Text style={styles.projectInfoLabel}>Proyecto seleccionado</Text>
          <Text style={styles.projectInfoValue}>{proyectoNombre || idProyecto}</Text>
          {proyectoNombre ? (
            <Text style={styles.projectInfoSubValue}>ID: {idProyecto}</Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.label}>Código del Lote</Text>
      <TextInput
        style={styles.input}
        placeholder="Código del lote"
        value={codLote}
        onChangeText={setCodLote}
      />

      <Text style={styles.label}>Ubicación</Text>
      <TextInput
        style={styles.input}
        placeholder="Ubicación"
        value={ubicacion}
        onChangeText={setUbicacion}
      />

      <Text style={styles.sectionLabel}>Medidas del lote</Text>
      <View style={styles.rowWrap}>
        <View style={styles.column50}>
          <Text style={styles.label}>Frente</Text>
          <TextInput
            style={styles.input}
            placeholder="Frente (ej: 10+5)"
            value={frenteStr}
            onChangeText={setFrenteStr}
          />

          <Text style={styles.label}>Fondo</Text>
          <TextInput
            style={styles.input}
            placeholder="Fondo (ej: 15+8)"
            value={fondoStr}
            onChangeText={setFondoStr}
          />
        </View>

        <View style={styles.column50}>
          <Text style={styles.label}>Derecha</Text>
          <TextInput
            style={styles.input}
            placeholder="Derecha (ej: 12+3)"
            value={derechaStr}
            onChangeText={setDerechaStr}
          />

          <Text style={styles.label}>Izquierda</Text>
          <TextInput
            style={styles.input}
            placeholder="Izquierda (ej: 11+4)"
            value={izquierdaStr}
            onChangeText={setIzquierdaStr}
          />
        </View>
      </View>

      <Text style={styles.label}>Perímetro</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        placeholder="Se calcula automáticamente"
        value={perimetro}
        editable={false}
      />

      <Text style={styles.label}>Tamaño m²</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        placeholder="Se calcula automáticamente"
        value={tamañosM2}
        editable={false}
      />

      <Text style={styles.label}>Número de lote</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de lote"
        value={numLote}
        onChangeText={setNumLote}
      />

      <Text style={styles.label}>Manzana</Text>
      <TextInput
        style={styles.input}
        placeholder="Manzana"
        value={manzana}
        onChangeText={setManzana}
      />

      <Text style={styles.label}>Precio</Text>
      <TextInput
        style={styles.input}
        placeholder="Precio"
        value={precio}
        onChangeText={setPrecio}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.inputLarge]}
        placeholder="Descripción"
        value={descrip}
        onChangeText={setDescrip}
        multiline
        numberOfLines={3}
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
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  projectInfoBox: {
    marginBottom: 24,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: "#10b981",
    shadowColor: "#10b981",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  projectInfoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  projectInfoValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#065f46",
    marginBottom: 4,
  },
  projectInfoSubValue: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
    fontStyle: "italic",
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f766e",
    marginBottom: 14,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "#ffffff",
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  inputLarge: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  readOnlyInput: {
    backgroundColor: "#ecfdf5",
    color: "#047857",
    borderColor: "#a7f3d0",
  },
  rowWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  column50: {
    width: "48%",
  },
  button: {
    backgroundColor: "#10b981",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#10b981",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

export default RegistrarLote;

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
  TextInput
} from "react-native";

// Librería de íconos utilizada para navegación y apoyo visual en la interfaz.
import { MaterialCommunityIcons } from "@expo/vector-icons";

import * as Print from 'expo-print'; // AGREGADO
import * as Sharing from 'expo-sharing'; // AGREGADO

// URL base del backend usada para registrar pagos.
const API_URL = "http://www.tulote.somee.com";

const DetallePago = ({ route, navigation }) => {
  // Recibe la cuota seleccionada desde la pantalla anterior.
  const { cuota } = route.params;

  // Controla el spinner mientras se envía el registro del pago al servidor.
  const [cargando, setCargando] = useState(false);

  // Estado dinámico para elegir el comprobante (1: Boleta, 2: Factura, 3: Ticket)
  const [tipoComprobante, setTipoComprobante] = useState(1);

  // AGREGADO: Estados para almacenar los documentos de identidad
  const [dni, setDni] = useState("");
  const [ruc, setRuc] = useState("");

  // ==========================================
  // PDF REDISEÑADO CON FORMATO SUNAT PERÚ
  // ==========================================
  const generarPDFComprobante = async (documentoEmitido) => {
    const nombreComprobante = tipoComprobante === 1 ? "BOLETA DE VENTA ELECTRÓNICA" : tipoComprobante === 2 ? "FACTURA ELECTRÓNICA" : "TICKET DE PAGO INTERNO";

    // Simulación de serie/número en base a lo que procesa tu PA
    const numAleatorio = Math.floor(100000 + Math.random() * 900000);
    const serieDoc = tipoComprobante === 1 ? "B001" : tipoComprobante === 2 ? "F001" : "TK01";
    const comprobanteCompleto = `${serieDoc}-${String(numAleatorio).substring(0, 8)}`;

    const etiquetaDoc = tipoComprobante === 1 ? "DNI" : tipoComprobante === 2 ? "RUC" : "DOC";
    const valorDoc = documentoEmitido ? documentoEmitido : "---";

    // Fechas formateadas estilo Perú
    const fechaEmision = new Date().toLocaleDateString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    const montoBase = parseFloat(cuota.MontoCuota);
    // Calculamos IGV si es factura para el desglose visual del modelo Sunat
    const subTotalCalculado = tipoComprobante === 2 ? (montoBase / 1.18) : montoBase;
    const igvCalculado = tipoComprobante === 2 ? (montoBase - subTotalCalculado) : 0;

    // Convertir número a letras básico para el pie de la tabla "SON: ..."
    const textoMontoLetras = `SON: ${montoBase.toFixed(2)} CON 00/100 SOLES`;

    // Limpieza estricta de la fecha de vencimiento para quitar horas residuales (ej. T00:00:00)
    const fechaVencimientoLimpia = cuota.FechaVencimiento ? cuota.FechaVencimiento.split('T')[0] : '---';
    
    // Inyección de la plantilla optimizada
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            padding: 20px; 
            color: #333; 
            background-color: #f9f9f9;
          }
          .invoice-box { 
            max-width: 850px; 
            margin: auto; 
            border: 1px solid #ccc; 
            padding: 25px; 
            border-radius: 5px; 
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); 
            background-color: #fff;
          }
          
          /* Encabezado Principal */
          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
          }
          .company-logo-info {
            width: 60%;
          }
          .title { 
            font-size: 26px; 
            font-weight: bold; 
            color: #069488; 
            text-transform: uppercase;
            margin: 0 0 5px 0;
          }
          .company-info { 
            font-size: 11px; 
            color: #555; 
            line-height: 1.4;
          }
          
          /* Tarjeta del Comprobante (Estilo SUNAT) */
          .comprobante-card { 
            width: 35%;
            border: 2px solid #069488; 
            padding: 15px; 
            text-align: center; 
            border-radius: 6px; 
            background-color: #fff;
          }
          .comprobante-ruc {
            font-size: 15px;
            font-weight: bold;
            letter-spacing: 1px;
            margin: 0 0 8px 0;
          }
          .comprobante-title { 
            font-size: 14px; 
            font-weight: bold; 
            color: #fff; 
            background-color: #069488;
            margin: 0 -15px 8px -15px;
            padding: 6px 0;
            text-transform: uppercase;
          }
          .comprobante-numero {
            font-size: 15px;
            font-weight: bold;
            margin: 5px 0 0 0;
          }

          /* Bloque de Información de Venta / Cliente */
          .info-container {
            display: flex;
            justify-content: space-between;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 20px;
            background-color: #fcfcfc;
            font-size: 12px;
          }
          .info-block {
            width: 48%;
            line-height: 1.6;
          }
          .info-block strong {
            color: #444;
          }

          /* Tabla de Detalles */
          .details-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
          }
          .details-table th { 
            background-color: #069488; 
            color: white; 
            padding: 8px 10px; 
            text-align: left; 
            font-size: 12px; 
            text-transform: uppercase;
            border: 1px solid #069488;
          }
          .details-table td { 
            padding: 10px; 
            border: 1px solid #ddd; 
            font-size: 12px; 
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }

          /* Sección de Cierre y Totales */
          .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 20px;
          }
          .payment-notes {
            width: 55%;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            font-size: 11px;
            background-color: #fafafa;
          }
          .notes-title {
            font-weight: bold;
            color: #069488;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .totals-box {
            width: 40%;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          .totals-table td {
            padding: 6px 8px;
            border: 1px solid #ddd;
          }
          .total-row { 
            font-weight: bold; 
            font-size: 14px; 
            background-color: #f4f7f6;
            color: #069488;
          }

          /* Footer */
          .footer-text { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 11px; 
            color: #999; 
            border-top: 1px solid #eee; 
            padding-top: 15px; 
          }
        </style>
      </head>
      <body>

        <div class="invoice-box">
          
          <!-- Encabezado Estilo Factura -->
          <div class="header-section">
            <div class="company-logo-info">
              <div class="title">LOTE SEGURO S.A.C.</div>
              <div class="company-info">
                <strong>SERVICIOS INMOBILIARIOS Y VENTA DE LOTES</strong><br>
                Av. Principal 123, Miraflores, Lima, Perú<br>
                Contacto: soporte@loteseguro.com | Teléfono: (01) 456-7890
              </div>
            </div>
            
            <div class="comprobante-card">
              <div class="comprobante-ruc">RUC: 20123456789</div>
              <div class="comprobante-title">${nombreComprobante}</div>
              <div class="comprobante-numero">OPT-${Math.floor(100000 + Math.random() * 900000)}</div>
            </div>
          </div>

          <!-- Datos del Cliente y Fechas Limpias -->
          <div class="info-container">
            <div class="info-block">
              <strong>CLIENTE:</strong> ${valorDoc}<br>
              <strong>PROYECTO:</strong> Urbanización Las Terrazas - Mz. B Lote 14<br>
              <strong>ESTADO DE PAGO:</strong> Cancelado
            </div>
            <div class="info-block" style="text-align: right;">
              <strong>FECHA EMISIÓN:</strong> ${fechaEmision}<br>
              <strong>FECHA VENCIMIENTO:</strong> ${fechaVencimientoLimpia}<br>
              <strong>MONEDA:</strong> Dólares Americanos
            </div>
          </div>

          <!-- Tabla de Detalles -->
          <table class="details-table">
            <thead>
              <tr>
                <th style="width: 10%;" class="text-center">Item</th>
                <th style="width: 70%;">Descripción del Concepto</th>
                <th style="width: 20%;" class="text-right">Total Recaudado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-center">1</td>
                <td>
                  Pago de Cuota Inmobiliaria<br>
                  <span style="font-size: 11px; color:#666;">ID Cronograma: ${cuota?.IdCronograma || cuota?.idCronograma || 'N/A'}</span>
                </td>
                <td class="text-right">$${parseFloat(cuota.MontoCuota).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Sección de Cierre y Totales abajo -->
          <div class="bottom-section">
            <div class="payment-notes">
              <div class="notes-title">Observaciones y Condiciones:</div>
              • El pago corresponde estrictamente a la cuota programada del lote mencionado.<br>
              • Conserve este comprobante electrónico como constancia oficial de su abono.
            </div>
            
            <div class="totals-box">
              <table class="totals-table">
                <tr>
                  <td>Op. Exonerada:</td>
                  <td class="text-right">$${parseFloat(cuota.MontoCuota).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>I.G.V. (0.00%):</td>
                  <td class="text-right">$0.00</td>
                </tr>
                <tr class="total-row">
                  <td>TOTAL PAGADO:</td>
                  <td class="text-right">$${parseFloat(cuota.MontoCuota).toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="footer-text">
            Este documento es una representación impresa de un comprobante electrónico interno.<br>
            ¡Gracias por mantener tus cuotas al día y construir tu futuro con nosotros!
          </div>
          
        </div>

      </body>
      </html>
    `;


    try {
      // 1. Genera el archivo PDF físico temporal en el almacenamiento del celular
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log('PDF creado temporalmente en:', uri);

      // 2. Abre el menú compartir nativo (WhatsApp, guardar en archivos, correo, etc.)
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Compartir ${nombreComprobante}`,
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error("Error generando o compartiendo el archivo PDF:", error);
      Alert.alert("Error PDF", "No se pudo generar la vista de impresión.");
    }
  };


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

    // ==========================================
    // AGREGADO: VALIDACIONES DE DOCUMENTOS
    // ==========================================
    let documentoParaEnviar = "";

    if (idTipoComprobanteFinal === 1) { // Boleta
      if (dni.trim().length !== 8) {
        Alert.alert("Validación", "Para una Boleta, el DNI debe tener exactamente 8 dígitos.");
        return;
      }
      documentoParaEnviar = dni.trim();
    }
    else if (idTipoComprobanteFinal === 2) { // Factura
      if (ruc.trim().length !== 11) {
        Alert.alert("Validación", "Para una Factura, el RUC debe tener exactamente 11 dígitos.");
        return;
      }
      documentoParaEnviar = ruc.trim();
    }
    // Si es Ticket (3), pasa sin pedir ningún documento.

    try {
      setCargando(true);

      // Objeto que el backend espera para registrar el pago.
      const datosParaEnviar = {
        IdCronograma: idCronogramaFinal,
        IdTipoComprobante: idTipoComprobanteFinal,
        Documento: documentoParaEnviar
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
          {
            text: "Descargar Comprobante",
            onPress: async () => {
              // MODIFICADO: Primero dispara el PDF y luego regresa
              await generarPDFComprobante(documentoParaEnviar);
              route.params?.onRefresh?.();
              navigation.goBack();
            }
          }
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

        {/* ========================================== */}
        {/* AGREGADO: RENDERIZADO CONDICIONAL DE INPUTS */}
        {/* ========================================== */}
        {tipoComprobante === 1 && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de DNI (8 dígitos):</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese DNI"
              value={dni}
              onChangeText={(texto) => setDni(texto.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={8}
            />
          </View>
        )}

        {tipoComprobante === 2 && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de RUC (11 dígitos):</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese RUC"
              value={ruc}
              onChangeText={(texto) => setRuc(texto.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={11}
            />
          </View>
        )}

        {tipoComprobante === 3 && (
          <View style={styles.ticketBox}>
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color="#069488" />
            <Text style={styles.ticketText}>El formato Ticket es un comprobante simplificado interno. No requiere documentos de identidad.</Text>
          </View>
        )}

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

  stateLabel: { fontSize: 15, color: "#555", marginBottom: 5, fontWeight: "bold" },

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

  // ESTILOS NUEVOS PARA COMPONENTES DINÁMICOS
  inputGroup: { width: "100%", marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "bold", color: "#444", marginBottom: 8 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, fontSize: 16, color: "#333", elevation: 1 },
  ticketBox: { flexDirection: "row", backgroundColor: "#e4f5f3", borderRadius: 10, padding: 15, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "#bce5e1" },
  ticketText: { flex: 1, color: "#05756b", fontSize: 13, marginLeft: 10, lineHeight: 18 },

});

export default DetallePago;

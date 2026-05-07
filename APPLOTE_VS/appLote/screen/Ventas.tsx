import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal, 
  Pressable,
  Dimensions 
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import i18n, {changeLanguage} from "../i18n";
import { Languages } from "../localizacion";

const { height } = Dimensions.get('window');
const API_URL = "http://10.246.197.207:90";


const Ventas = ({ navigation, route }) => {
  
  // funcion de idiomas //////////////////////////////////////////////
  
      const [isMenuOpen, setIsMenuOpen] = useState(false);
      const [language,setlanguage] = useState<Languages>("es");
      const handlechangeLanguage = ()=> {
        const lang: Languages = language === "en" ? "es" :"en";
        changeLanguage(lang);
        setlanguage(lang);
      }  
      
  ///////////////////////////////////////////////////////////////////
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVentaLocal, setSelectedVentaLocal] = useState(null);

  const manejarSeleccion = (venta) => {
    setSelectedVentaLocal(venta);
    seleccionarVenta(venta);
    setModalVisible(true);
  };


  const tabBarHeight = useBottomTabBarHeight();

  const { idUsuario } = route.params || {};
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [cronogramaTodos, setCronogramaTodos] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [cargandoCronograma, setCargandoCronograma] = useState(false);

  const obtenerIdVenta = (venta) => {
    return venta?.IdVenta ?? venta?.idVenta ?? venta?.Id ?? venta?.id;
  };

  const cargarVentas = async () => {
    try {
      setCargando(true);
      const response = await fetch(`${API_URL}/Venta/venta_Listar`);
      const data = await response.json();
      const ventasUsuario = Array.isArray(data)
        ? data.filter(
            (venta) =>
              venta.IdUsuario?.toString() === idUsuario?.toString() ||
              venta.idUsuario?.toString() === idUsuario?.toString(),
          )
        : [];
      setVentas(ventasUsuario);
      return ventasUsuario;
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      Alert.alert("Error", "No se pudo cargar el listado de ventas.");
      return [];
    } finally {
      setCargando(false);
    }
  };

  const cargarCronogramaUsuario = async () => {
  try {
    setCargandoCronograma(true);
    
    const response = await fetch(`${API_URL}/Cronograma/cronograma_ListarPorVenta/${idUsuario}`);
    
    // Leemos la respuesta como texto primero para evitar errores de parseo
    const textoRespuesta = await response.text();
    
    if (response.ok && textoRespuesta) {
      const data = JSON.parse(textoRespuesta);
      
      // SI EL PROBLEMA ES EL ARRAY, HACEMOS ESTA DOBLE VERIFICACIÓN:
      let listaFinal = [];
      if (Array.isArray(data)) {
        listaFinal = data;
      } else if (data && typeof data === 'object' && data.Table) { 
        // A veces los DataTables de C# vienen envueltos en una propiedad "Table"
        listaFinal = data.Table;
      }

      setCronogramaTodos(listaFinal);
      return listaFinal;
    } else {
      setCronogramaTodos([]);
      return [];
    }
  } catch (error) {
    console.error("Error procesando cronograma:", error);
    setCronogramaTodos([]);
  } finally {
    setCargandoCronograma(false);
  }
};


  const filtrarCronogramaPorVenta = (venta, lista = cronogramaTodos) => {
    if (!venta || !lista || lista.length === 0) return [];
    const idVentaSeleccionada = obtenerIdVenta(venta)?.toString();
    return lista.filter(
      (item) =>
        item.IdVenta?.toString() === idVentaSeleccionada ||
        item.idVenta?.toString() === idVentaSeleccionada,
    );
  };

  const cargarDatosIniciales = async () => {
    if (!idUsuario) return;
    const [ventasUsuario, cronogramaPorUsuario] = await Promise.all([
      cargarVentas(),
      cargarCronogramaUsuario(),
    ]);

    if (ventasUsuario.length > 0) {
      const ventaInicial = ventasUsuario[0];
      setSelectedVenta(ventaInicial);
      setCronograma(filtrarCronogramaPorVenta(ventaInicial, cronogramaPorUsuario));
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, [idUsuario]);

  const seleccionarVenta = (venta) => {
    setSelectedVenta(venta);
    setCronograma(filtrarCronogramaPorVenta(venta));
  };

////////////////////////////////////////////////////////////////////////////////////////////////////////

const cerrarSesion = () => {
    // Simplemente redirigimos y reseteamos el historial
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }], // Cambia 'Login' por el nombre exacto de tu pantalla inicial
    });
  };
/////////////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <View style={styles.mainContainer}>
      {/* --- LISTA DE VENTAS (CONTENEDOR FIJO) --- */}
      <View style={styles.ventasContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Ventas</Text>
          <MaterialCommunityIcons name="sign-real-estate" size={28} color="#069488" />
        </View>
        {/* ///////////////////////////////////////////////////////////////////////////////////////// */}
  {/* funcion de boton desplegable patra idioma y exit */}

      <View style={styles.containerFlotante}>
        <TouchableOpacity 
          style={styles.btnPrincipal} 
          onPress={() => setIsMenuOpen(!isMenuOpen)}
        >
          <MaterialIcons 
          name={isMenuOpen ? "close" : "menu"} // Puedes usar menu/close o flechas
          size={28} 
          color="white" 
          />
        </TouchableOpacity>
        {isMenuOpen && (
          <View style={styles.menuDesplegado}>

            <View>
              <TouchableOpacity style={styles.idioma} onPress={handlechangeLanguage}>
                <Fontisto name="world-o" size={25}/>
              </TouchableOpacity>
            </View>
            <View>
              <TouchableOpacity style={styles.btnsalir} onPress={cerrarSesion}>
                <MaterialIcons
                name="exit-to-app"
                size={28}
                color="white"
                />
              </TouchableOpacity>
            </View>

          </View>
        )}
        
      </View>
  {/* ///////////////////////////////////////////////////////////////////////////////////////// */}
        <Text style={styles.sectionTitle}>Toca una venta para ver el cronograma</Text>
        
        <ScrollView 
          style={styles.scrollVentas} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {cargando ? (
            <ActivityIndicator size="large" color="#069488" />
          ) : ventas.length === 0 ? (
            <Text style={styles.emptyText}>No hay ventas registradas.</Text>
          ) : (
            ventas.map((venta, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.card} 
                onPress={() => manejarSeleccion(venta)}
              >
                <View style={styles.cardHeader}>
                   <View style={styles.loteInfo}>
                      <MaterialCommunityIcons name="map-marker-radius" size={20} color="#069488" />
                      <View style={{marginLeft: 8}}>
                        <Text style={styles.cardLabel}>LOTE</Text>
                        <Text style={styles.cardValue}>{venta.IdLote ?? "N/A"}</Text>
                      </View>
                   </View>
                   <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                </View>

                <View style={styles.cardFooter}>
                   <View style={styles.priceContainer}>
                      <Text style={styles.priceText}>${venta.PrecioVenta ?? "0.00"}</Text>
                      <Text style={styles.subtext}>Tipo Venta: {venta.TipoVenta}</Text>
                      <Text style={styles.subtext}>Tipo pago : {venta.TipoPago}</Text>
                      <Text style={styles.subtext}>Inicial        : {venta.MontoInicial}</Text>
                   </View>
                   <View style={styles.badge}>
                      <Text style={styles.badgeText}>{venta.Estadoventa ?? "Activo"}</Text>
                   </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* PIE DE PÁGINA (OPCIONAL) */}
      <View style={styles.footerHint}>
        <MaterialCommunityIcons name="gesture-swipe-up" size={20} color="#999" />
        <Text style={styles.footerText}>Desliza para ver más lotes</Text>
      </View>

      {/* --- MODAL DEL CRONOGRAMA --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Cronograma de Pagos</Text>
                <Text style={styles.modalSubtitle}>Lote: {selectedVentaLocal?.IdLote}</Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={32} color="#ff5252" />
              </Pressable>
            </View>

            {cargandoCronograma ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#069488" />
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <View style={styles.grid}>
                  {cronograma.map((item, i) => (
                    <TouchableOpacity 
    key={i} 
    style={styles.miniCard} 
    onPress={() => {
      setModalVisible(false); // Cierra el modal actual
      navigation.navigate("DetallePago", { cuota: item, onRefresh: () => cargarDatosIniciales() }); // Te lleva a la nueva pantalla
    }}
  >
    <View style={styles.cuotaHeader}>
      <Text style={styles.cuotaTitle}>Cuota {i + 1}</Text>
      <MaterialCommunityIcons 
        name={item.EstadoCuota === 'Pagado' ? "check-decagram" : "clock-outline"} 
        size={16} 
        color={item.EstadoCuota === 'Pagado' ? "#27ae60" : "#f39c12"} 
      />
    </View>
    <Text style={styles.cuotaMonto}>${item.MontoCuota}</Text>
    <Text style={styles.cuotaFecha}>{item.FechaVencimiento}</Text>
  </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}; 

const styles = StyleSheet.create({
   // estilos para boton desplegable
  containerFlotante: {
    position: 'absolute',
    top: 40,           // Ajusta según la pantalla
    right: 20,
    zIndex: 999,       // Siempre al frente
    alignItems: 'center',
    
    
  },
  menuDesplegado: {
    // Los botones aparecen antes (arriba) del principal, 
    // o puedes ponerlos después para que bajen.
    alignItems:"center",
    marginBottom: 8, 
    gap: 10,          
  },
  btnPrincipal: {
    backgroundColor: '#333', // Un color neutro o el de tu app
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
    // estilos de exit y idioma :
  idioma:{
    top:5,   // Separación del borde inferior
    
    marginTop:5,
    backgroundColor: '#22c5aa', // Color de fondo del botón
    width: 45,
    height: 45,
    borderRadius: 28,     // Hace que sea circular
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,         // Sombra en Android
    shadowColor: '#000',  // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,  
  },
  btnsalir: {
    backgroundColor: "#f30a0a9c",
    marginTop:5,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
// ///////////////////////////////////////////////
  mainContainer: { flex: 1, backgroundColor: "#e4f5f3" },
  ventasContainer: {
    height: height * 0.6, // Ocupa el 60% de la pantalla
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 50,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  sectionTitle: { fontSize: 14, color: '#666', marginBottom: 15 },
  scrollVentas: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#edf0f2',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  loteInfo: { flexDirection: 'row', alignItems: 'center' },
  cardLabel: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  cardValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceText: { fontSize: 18, fontWeight: 'bold', color: '#069488' },
  subtext: { fontSize: 12, color: '#777' },
  badge: { backgroundColor: '#e0f2f1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#069488', fontSize: 12, fontWeight: 'bold' },

  footerHint: { alignItems: 'center', marginTop: 20, opacity: 0.4 },
  footerText: { fontSize: 12, marginTop: 4 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    height: '75%', 
    padding: 24 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  modalSubtitle: { fontSize: 14, color: '#069488', fontWeight: '600' },
  modalScroll: { paddingBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  miniCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    // Sombra suave
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cuotaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cuotaTitle: { fontSize: 11, color: '#888', fontWeight: 'bold', textTransform: 'uppercase' },
  cuotaMonto: { fontSize: 17, fontWeight: 'bold', color: '#2c3e50' },
  cuotaFecha: { fontSize: 12, color: '#999', marginTop: 4 },
  modalLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default Ventas
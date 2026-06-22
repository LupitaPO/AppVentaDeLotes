import "react-native-gesture-handler";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Login from "./screen/login";
import BottomTabs from "./bottomTabs";
import LoginCambiarContrasena from "./screen/Login/loginCambiarContraseña";
import LoginRegistrate from "./screen/Login/loginRegistrate";
import Rproyecto from "./screen/Proyectos/Rproyecto";
import Home from "./screen/home";
import DetalleProyecto from "./screen/Proyectos/DetalleProyecto";
import ModificarProyecto from "./screen/Proyectos/ModificarProyecto";

import ModificarCliente from "./screen/Clientes/ModificarCliente";
import RegistrarCliente from "./screen/Clientes/RegistrarCliente";
import ModificarAsesor from "./screen/Asesor/ModificarAsesor";
import RegistrarAsesor from "./screen/Asesor/RegistrarAsesor";
import ListarProyectos from "./screen/ListarProyectos";
import RegistrarLote from "./screen/Lotes/RegistrarLote";
import RegistrarVenta from "./screen/Ventas/RegistrarVenta";
import ModificarUsuario from "./screen/Usuarios/ModificarUsuario";
import RegistrarUsuario from "./screen/Usuarios/RegistrarUsuario";
import DetallePago from "./screen/DetallePago";
import MenuReportes from "./screen/Reportes/MenuReportes";
import ReporteClientes from "./screen/Reportes/ReporteClientes";
import ReporteAsesores from "./screen/Reportes/ReporteAsesores";
import ReporteProyectos from "./screen/Reportes/ReporteProyectos";
import ReporteLotes from "./screen/Reportes/ReporteLotes";
import ReporteUsuarios from "./screen/Reportes/ReporteUsuarios";
import ReporteCobranzas from "./screen/Reportes/ReporteCobranzas";
import ReportePagos from "./screen/Reportes/ReportePagos";
import Permisos from "./screen/permisos";

const Stack = createStackNavigator();
const rutasConCabeceraPropia = new Set([
  "Login",
  "MainTabs",
  "homme",
  "MenuReportes",
  "Reportes",
  "ReporteClientes",
  "ReporteAsesores",
  "ReporteProyectos",
  "ReporteLotes",
  "ReporteUsuarios",
  "ReporteCobranzas",
  "ReportePagos",
]);

const titulosRuta: Record<string, string> = {
  DetalleProyecto: "Detalle del proyecto",
  Rproyecto: "Registrar proyecto",
  ModificarProyecto: "Modificar proyecto",
  ModificarCliente: "Modificar cliente",
  RegistrarCliente: "Registrar cliente",
  ModificarAsesor: "Modificar asesor",
  RegistrarAsesor: "Registrar asesor",
  RegistrarVenta: "Registrar venta",
  RegistrarLote: "Registrar lote",
  ModificarUsuario: "Modificar usuario",
  RegistrarUsuario: "Registrar usuario",
  DetallePago: "Detalle de pago",
  permisos: "Permisos",
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={({ navigation, route }) => {
          const mostrarCabecera =
            Platform.OS === "web" && !rutasConCabeceraPropia.has(route.name);

          return {
            headerShown: mostrarCabecera,
            headerTitle: titulosRuta[route.name] ?? route.name,
            headerShadowVisible: false,
            headerStyle: styles.webHeader,
            headerTitleStyle: styles.webHeaderTitle,
            headerLeft: () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Regresar a la pantalla anterior"
                onPress={() => {
                  if (navigation.canGoBack()) navigation.goBack();
                  else navigation.navigate("MainTabs" as never);
                }}
                style={styles.webBackButton}
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
                <Text style={styles.webBackText}>Regresar</Text>
              </Pressable>
            ),
          };
        }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen
          name="loginCambiarContraseña"
          component={LoginCambiarContrasena}
        />
        <Stack.Screen name="loginRegistrate" component={LoginRegistrate} />

        <Stack.Screen name="homme" component={Home} />
        <Stack.Screen name="DetalleProyecto" component={DetalleProyecto} />
        <Stack.Screen name="Rproyecto" component={Rproyecto} />
        <Stack.Screen name="ModificarProyecto" component={ModificarProyecto} />
        <Stack.Screen name="ModificarCliente" component={ModificarCliente} />
        <Stack.Screen name="RegistrarCliente" component={RegistrarCliente} />
        <Stack.Screen name="ModificarAsesor" component={ModificarAsesor} />
        <Stack.Screen name="RegistrarAsesor" component={RegistrarAsesor} />
        <Stack.Screen name="ListarProyectos" component={ListarProyectos} />
        <Stack.Screen name="RegistrarVenta" component={RegistrarVenta} />
        <Stack.Screen name="RegistrarLote" component={RegistrarLote} />
        <Stack.Screen name="ModificarUsuario" component={ModificarUsuario} />
        <Stack.Screen name="RegistrarUsuario" component={RegistrarUsuario} />
        <Stack.Screen name="DetallePago" component={DetallePago} />
        <Stack.Screen name="MainTabs" component={BottomTabs} />
        <Stack.Screen name="MenuReportes" component={MenuReportes} />
        <Stack.Screen name="Reportes" component={MenuReportes} />
        <Stack.Screen name="ReporteClientes" component={ReporteClientes} />
        <Stack.Screen name="ReporteAsesores" component={ReporteAsesores}/>
        <Stack.Screen name="ReporteProyectos" component={ReporteProyectos} />
        <Stack.Screen name="ReporteLotes" component={ReporteLotes} />
        <Stack.Screen name="ReporteUsuarios" component={ReporteUsuarios} />
        <Stack.Screen name="ReporteCobranzas" component={ReporteCobranzas} />
        <Stack.Screen name="ReportePagos" component={ReportePagos} />
        <Stack.Screen name="permisos" component={Permisos} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  webHeader: {
    backgroundColor: "#087f76",
  },
  webHeaderTitle: {
    color: "#ffffff",
    fontWeight: "900",
  },
  webBackButton: {
    minHeight: 38,
    marginLeft: 16,
    paddingHorizontal: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",
  },
  webBackText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 13,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

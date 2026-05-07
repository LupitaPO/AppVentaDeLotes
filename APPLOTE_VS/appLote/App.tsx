import "react-native-gesture-handler";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import login from "./screen/login";
import bottomTabs from "./bottomTabs";
import loginCambiarContraseña from "./screen/Login/loginCambiarContraseña";
import loginRegistrate from "./screen/Login/loginRegistrate";
import Rproyecto from "./screen/Proyectos/Rproyecto";
import home from "./screen/home";
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

const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={login} />
        <Stack.Screen
          name="loginCambiarContraseña"
          component={loginCambiarContraseña}
        />
        <Stack.Screen name="loginRegistrate" component={loginRegistrate} />

        <Stack.Screen name="homme" component={home} />
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
        <Stack.Screen name="MainTabs" component={bottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

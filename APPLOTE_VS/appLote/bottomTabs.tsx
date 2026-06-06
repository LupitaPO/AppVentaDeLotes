import { View, Text, StyleSheet, Platform } from "react-native";
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";


import Home from "./screen/home";

import ListarProyectos from "./screen/ListarProyectos";

import Clientes from "./screen/clientes";
import Asesor from "./screen/asesor";
import Ventas from "./screen/Ventas";
import Usuario from "./screen/usuario";
import i18n from "./i18n";
const Tab = createBottomTabNavigator();

const BottomTabs = ({ route }) => {
  const { nombre, rol, idUsuario } = route.params || {};
  const esWeb = Platform.OS === "web";

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#069488",
        tabBarInactiveTintColor: "#64748b",
        headerShown: false,
        tabBarStyle: esWeb ? styles.tabBarWeb : undefined,
        tabBarLabelStyle: esWeb ? styles.tabBarLabelWeb : undefined,
        tabBarItemStyle: esWeb ? styles.tabBarItemWeb : undefined,
      }}
    >
      {rol !== "Cliente" && (
        <Tab.Screen
          name={i18n.t("btDashboard")}
          component={Home}
          initialParams={{ rol, nombre, idUsuario }}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="home"
                color={color}
                size={size}
              />
            ),
          }}
        />
      )}
      <Tab.Screen
        name={i18n.t("btProyectos")}
        component={ListarProyectos}
        initialParams={{ rol, nombre, idUsuario }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map"
              color={color}
              size={size}
            />
          ),
        }}
      />
      {rol !== "Cliente" && (
        <Tab.Screen
         name={i18n.t("btusuario")}
         component={Usuario}
         initialParams={{ rol, nombre, idUsuario }}
         options={{
           tabBarIcon: ({ color, size }) => (
             <MaterialCommunityIcons
               name="account-circle"
               color={color}
               size={size}
             />
           ),
         }}
       />

      )}
      {rol !== "Cliente" && (
        <Tab.Screen
         name={i18n.t("btAsesor")}
         component={Asesor}
         initialParams={{ rol, nombre, idUsuario }}
         options={{
           tabBarIcon: ({ color, size }) => (
             <MaterialCommunityIcons
               name="account-tie"
               color={color}
               size={size}
             />
           ),
         }}
       />

      )}
      {rol !== "Cliente" && (
        <Tab.Screen
          name={i18n.t("btcliente")}
          component={Clientes}
          initialParams={{ rol, nombre, idUsuario }}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account"
                color={color}
                size={size}
              />
            ),
          }}
        />

      )}
     
      <Tab.Screen
        name={i18n.t("btVentas")}
        component={Ventas}
        initialParams={{ rol, nombre, idUsuario }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map-marker-radius"
              color={color}
              size={size}
            />
          ),
        }}
      />
      
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarWeb: {
    height: 72,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(6, 148, 136, 0.12)",
    backgroundColor: "#ffffff",
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 12,
  },
  tabBarLabelWeb: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: 0,
  },
  tabBarItemWeb: {
    paddingVertical: 4,
    minWidth: 96,
  },
});



export default BottomTabs;

<<<<<<< Updated upstream
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Switch, 
  ScrollView, 
  Alert 
} from 'react-native';

// Definición de tipos para la estructura de la tabla
interface PermisoItem {
  id: number;
  descripcion: string;
  grupo: string;
  activo: boolean;
}

export default function PermisosScreen() {
  // Estado para el perfil seleccionado (por defecto Administrador)
  const [perfil, setPerfil] = useState<string>('Administrador');
  
  // Estado con los datos de la tabla basados en tu dibujo
  const [permisos, setPermisos] = useState<PermisoItem[]>([
    { id: 1, descripcion: 'Modificar Prov.', grupo: 'Compras', activo: true },
    { id: 2, descripcion: 'Crear Usuarios', grupo: 'Seguridad', activo: false },
    { id: 3, descripcion: 'Ver Reportes', grupo: 'Finanzas', activo: true },
  ]);

  // Función para cambiar el estado del switch (activo/inactivo)
  const toggleSwitch = (id: number) => {
    setPermisos(prevPermisos =>
      prevPermisos.map(item =>
        item.id === id ? { ...item, activo: !item.activo } : item
      )
    );
  };

  // Función para guardar los cambios
  const handleGuardar = () => {
    Alert.alert(
      'Cambios Guardados', 
      `Los permisos para el perfil ${perfil} se han actualizado con éxito.`
    );
    console.log('Datos guardados:', permisos);
  };

  // Función para salir
  const handleSalir = () => {
    Alert.alert('Salir', 'Has salido de la configuración de permisos.');
  };

  return (
    <View style={styles.container}>
      {/* Título Principal */}
      <Text style={styles.mainTitle}>Permisos</Text>

      {/* Selector de Perfil simulado */}
      <View style={styles.perfilContainer}>
        <Text style={styles.label}>Perfil:</Text>
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => Alert.alert('Seleccionar Perfil', 'Opciones: Administrador, Tesorero, Gerente')}
        >
          <Text style={styles.dropdownText}>{perfil}</Text>
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Tabla de Contenido */}
      <ScrollView style={styles.tableContainer}>
        {/* Cabecera de la Tabla */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerCell, { flex: 1 }]}>ID</Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 3 }]}>Descripción</Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Grupo</Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 2, textAlign: 'center' }]}>Activo</Text>
        </View>

        {/* Filas Dinámicas */}
        {permisos.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={[styles.cell, { flex: 1 }]}>{item.id}</Text>
            <Text style={[styles.cell, { flex: 3 }]}>{item.descripcion}</Text>
            <Text style={[styles.cell, { flex: 2 }]}>{item.grupo}</Text>
            <View style={[styles.cell, { flex: 2, alignItems: 'center' }]}>
              <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={item.activo ? '#007BFF' : '#f4f3f4'}
                onValueChange={() => toggleSwitch(item.id)}
                value={item.activo}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Botones de Acción Inferiores */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.btnSalir]} onPress={handleSalir}>
          <Text style={styles.buttonText}>Salir</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.btnGuardar]} onPress={handleGuardar}>
          <Text style={styles.buttonText}>Guardar Cambios</Text>
=======
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

// ⚠️ REEMPLAZA CON LA IP DE TU COMPUTADORA Y EL PUERTO DE TU API EN C# (ej: 5001 o 7043)
const API_URL = "https://192.168.X.X:PUERTO/api/Usuario"; 

export default function Permisos({ navigation }: any) {
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<number>(0);
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [permisos, setPermisos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Carga los datos de la API de C# al abrir la pantalla
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // 1. Llama al endpoint de usuario_TipoUsuario_pa (Pasamos grupo 0 para listar todos)
      const resPerfiles = await fetch(`${API_URL}/tipos-usuario/0`);
      if (!resPerfiles.ok) throw new Error("Error al traer perfiles");
      const dataPerfiles = await resPerfiles.json();
      setPerfiles(dataPerfiles);

      // 2. Llama al endpoint de formularios_Listar_pa
      const resPermisos = await fetch(`${API_URL}/formularios`);
      if (!resPermisos.ok) throw new Error("Error al traer formularios");
      const dataPermisos = await resPermisos.json();

      // Agregamos la propiedad 'activo' localmente para controlar el switch en la UI
      const permisosConEstado = dataPermisos.map((item: any) => ({
        ...item,
        activo: false, 
      }));

      setPermisos(permisosConEstado);
    } catch (error: any) {
      Alert.alert("Error de Conexión", "No se pudo conectar con el servidor C#");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Alterna el estado del switch usando el IdTipo de la base de datos
  const cambiarPermiso = (idTipo: number) => {
    const nuevos = permisos.map((item) =>
      item.IdTipo === idTipo ? { ...item, activo: !item.activo } : item
    );
    setPermisos(nuevos);
  };

  // BOTON GUARDAR
  const guardarPermisos = () => {
    if (perfilSeleccionado === 0) {
      Alert.alert("Atención", "Por favor, seleccione un perfil primero.");
      return;
    }

    // Filtra los formularios que el usuario activó en la tabla
    const accesosPermitidos = permisos.filter((p) => p.activo);

    console.log("Enviando al backend:");
    console.log("IdTipo Perfil:", perfilSeleccionado);
    console.log("Formularios asignados:", accesosPermitidos);

    Alert.alert(
      "Correcto",
      "Se guardaron los permisos en la base de datos"
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#22c5aa" />
        <Text style={styles.loadingText}>Cargando datos desde la API...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Permisos</Text>

      {/* PERFIL (PICKER DINÁMICO) */}
      <View style={styles.perfilContainer}>
        <Text style={styles.label}>Perfil</Text>
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={perfilSeleccionado}
            onValueChange={(itemValue) => setPerfilSeleccionado(itemValue)}
          >
            <Picker.Item label="-- Seleccione Perfil --" value={0} />
            {perfiles.map((perf) => (
              <Picker.Item
                key={perf.IdTipo}
                label={perf.Descripcion} // Muestra "Administrador", "Tesorería", etc.
                value={perf.IdTipo}      // El valor interno será su ID de la BD
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* TABLA (DATOS DINÁMICOS) */}
      <View style={styles.table}>
        {/* HEADER */}
        <View style={[styles.row, styles.header]}>
          <Text style={[styles.cell, styles.headerText, { flex: 0.5 }]}>Item</Text>
          <Text style={[styles.cell, styles.headerText, { flex: 2 }]}>Descripción</Text>
          <Text style={[styles.cell, styles.headerText]}>Grupo</Text>
          <Text style={[styles.cell, styles.headerText]}>Activo</Text>
        </View>

        <ScrollView>
          {permisos.map((item) => (
            <View key={item.IdTipo} style={styles.row}>
              <Text style={[styles.cell, { flex: 0.5 }]}>{item.Item}</Text>
              <Text style={[styles.cell, { flex: 2, textAlign: "left", paddingLeft: 10 }]}>
                {item.Descripcion}
              </Text>
              <Text style={styles.cell}>{item.Grupo}</Text>

              <TouchableOpacity
                style={styles.cell}
                onPress={() => cambiarPermiso(item.IdTipo)}
              >
                <Ionicons
                  name={item.activo ? "toggle" : "toggle-outline"}
                  size={42}
                  color={item.activo ? "#22c5aa" : "#999"}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* BOTONES */}
      <View style={styles.botonesContainer}>
        <TouchableOpacity style={styles.btnGuardar} onPress={guardarPermisos}>
          <Text style={styles.btnTexto}>Guardar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSalir} onPress={() => navigation.goBack()}>
          <Text style={styles.btnTexto}>Salir</Text>
>>>>>>> Stashed changes
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< Updated upstream
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  perfilContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  tableContainer: {
    flex: 1,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: '#E9ECEF',
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
  },
  cell: {
    fontSize: 14,
    color: '#495057',
    paddingHorizontal: 4,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#212529',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  btnGuardar: {
    backgroundColor: '#007BFF', // Azul requerido
  },
  btnSalir: {
    backgroundColor: '#DC3545', // Rojo requerido
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
=======
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 16 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  perfilContainer: { marginBottom: 20 },
  label: { fontSize: 18, marginBottom: 8, fontWeight: "600" },
  pickerBox: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, overflow: "hidden" },
  table: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, overflow: "hidden", flex: 1 },
  header: { backgroundColor: '#22c5aa' },
  row: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingVertical: 8 },
  cell: { flex: 1, textAlign: "center", paddingHorizontal: 5, fontSize: 15 },
  headerText: { color: "#fff", fontWeight: "bold" },
  botonesContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  btnGuardar: { backgroundColor: "#2563eb", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  btnSalir: { backgroundColor: "#dc2626", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  btnTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
>>>>>>> Stashed changes
});

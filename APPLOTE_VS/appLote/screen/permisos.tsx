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
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});

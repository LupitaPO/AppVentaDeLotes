import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
} from "react-native";
import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./MenuReportesStyles";

// ATAMAINE: Propiedad de navegacion que llega desde React Navigation.
type MenuReportesProps = {
	navigation: any;
	route: any;
};

const MenuReportes = ({ navigation, route }: MenuReportesProps) => {
	// ATAMAINE: Recuperamos los parámetros del usuario (rol, nombre, idUsuario) para pasarlos al reporte seleccionado.
	const { rol, nombre, idUsuario } = route.params || {};

	return (
		// ATAMAINE: Contenedor principal con fondo y efectos decorativos.
		<View style={styles.container}>
			<View style={styles.backgroundGlowTop} />
			<View style={styles.backgroundGlowBottom} />
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				{/* ATAMAINE: Hero principal con encabezado y descripción del módulo de reportes. */}
				<LinearGradient
					colors={["#2d7f7b", "#235e63", "#22364d"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.heroCard}
				>
					<View style={styles.headerRow}>
						<TouchableOpacity
							style={styles.backButton}
							onPress={() => navigation.goBack()}
						>
							<MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
						</TouchableOpacity>
						<View style={styles.heroContent}>
							<Text style={styles.title}>Centro de</Text>
							<Text style={styles.title}>Reportes</Text>
							<Text style={styles.subtitle}>
								Selecciona el tipo de reporte que deseas consultar y descargar en PDF.
							</Text>
						</View>
					</View>
				</LinearGradient>

				{/* ATAMAINE: Tarjeta principal con opciones de reportes disponibles. */}
				<View style={styles.reportsContainer}>
					{/* ATAMAINE: Botón para abrir el reporte de clientes. */}
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() =>
							navigation.navigate("ReporteClientes", { rol, nombre, idUsuario })
						}
					>
						<LinearGradient
							colors={["#0f766e", "#0d5f5a"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.reportCard}
						>
							<View style={styles.reportIconWrap}>
								<MaterialCommunityIcons name="account-multiple" size={40} color="#ffffff" />
							</View>
							<View style={styles.reportInfo}>
								<Text style={styles.reportTitle}>Reporte de Clientes</Text>
								<Text style={styles.reportDescription}>
									Consulta, filtra y exporta el listado completo de clientes registrados en el sistema.
								</Text>
								<View style={styles.reportMeta}>
									<MaterialCommunityIcons name="file-pdf-box" size={16} color="#f59e0b" />
									<Text style={styles.reportMetaText}>Exportar a PDF</Text>
								</View>
							</View>
							<View style={styles.reportArrow}>
								<MaterialCommunityIcons name="chevron-right" size={28} color="#ffffff" />
							</View>
						</LinearGradient>
					</TouchableOpacity>

					{/* ATAMAINE: Botón para abrir el reporte de asesores. */}
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() =>
							navigation.navigate("ReporteAsesores", { rol, nombre, idUsuario })
						}
					>
						<LinearGradient
							colors={["#1e40af", "#1e3a8a"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.reportCard}
						>
							<View style={styles.reportIconWrap}>
								<MaterialCommunityIcons name="account-tie-voice" size={40} color="#ffffff" />
							</View>
							<View style={styles.reportInfo}>
								<Text style={styles.reportTitle}>Reporte de Asesores</Text>
								<Text style={styles.reportDescription}>
									Consulta, filtra y exporta el listado completo de asesores activos en el sistema.
								</Text>
								<View style={styles.reportMeta}>
									<MaterialCommunityIcons name="file-pdf-box" size={16} color="#f59e0b" />
									<Text style={styles.reportMetaText}>Exportar a PDF</Text>
								</View>
							</View>
							<View style={styles.reportArrow}>
								<MaterialCommunityIcons name="chevron-right" size={28} color="#ffffff" />
							</View>
						</LinearGradient>
					</TouchableOpacity>
				</View>

				{/* ATAMAINE: Información adicional sobre el módulo de reportes. */}
				<View style={styles.infoCard}>
					<MaterialCommunityIcons name="information-outline" size={24} color="#0f766e" />
					<View style={styles.infoContent}>
						<Text style={styles.infoTitle}>Sobre los Reportes</Text>
						<Text style={styles.infoText}>
							Todos los reportes se generan en tiempo real desde tu base de datos. Puedes filtrar por DNI o nombre, y exportar los resultados en formato PDF profesional.
						</Text>
					</View>
				</View>
			</ScrollView>
		</View>
	);
};

export default MenuReportes;

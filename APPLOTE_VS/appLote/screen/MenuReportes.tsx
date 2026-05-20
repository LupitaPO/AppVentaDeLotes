import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./MenuReportesStyles";

type MenuReportesProps = {
	route?: any;
	navigation: any;
};

const MenuReportes = ({ route, navigation }: MenuReportesProps) => {
	// ATAMAINE: Recuperamos los parametros que pasó home.tsx con los datos del usuario
	const { rol, nombre, idUsuario } = route?.params || {
		rol: "Usuario",
		nombre: "Usuario",
		idUsuario: 0,
	};

	return (
		<View style={styles.container}>
			<View style={styles.backgroundGlowTop} />
			<View style={styles.backgroundGlowBottom} />
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* ATAMAINE: Tarjeta hero con encabezado y botón para volver */}
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
							<MaterialCommunityIcons
								name="arrow-left"
								size={24}
								color="#ffffff"
							/>
						</TouchableOpacity>
						<View style={styles.heroContent}>
							<Text style={styles.title}>Reportes</Text>
							<Text style={styles.subtitle}>
								Selecciona el tipo de reporte que deseas generar
							</Text>
						</View>
					</View>
				</LinearGradient>

				{/* ATAMAINE: Contenedor de las dos tarjetas de reportes (Clientes y Asesores) */}
				<View style={styles.reportCardsContainer}>
					{/* ATAMAINE: Tarjeta para acceder al reporte de Clientes */}
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() =>
							navigation.navigate("ReporteClientes", {
								rol,
								nombre,
								idUsuario,
							})
						}
					>
						<LinearGradient
							colors={["#0f766e", "#0d7377", "#047857"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={[styles.reportCard, styles.reportCardTeal]}
						>
							<View style={styles.reportCardHeader}>
								<View style={styles.reportCardIcon}>
									<MaterialCommunityIcons
										name="account-multiple"
										size={26}
										color="#ffffff"
									/>
								</View>
								<Text style={styles.reportCardTitle}>
									Reporte de Clientes
								</Text>
								<Text
									style={styles.reportCardDescription}
									numberOfLines={2}
								>
									Consulta, filtra y genera reportes de tus
									clientes registrados
								</Text>
							</View>
							<View style={styles.reportCardFooter}>
								<View style={styles.reportCardBadge}>
									<Text style={styles.reportCardBadgeText}>
										Clientes
									</Text>
								</View>
								<Text style={styles.reportCardArrow}>→</Text>
							</View>
						</LinearGradient>
					</TouchableOpacity>

					{/* ATAMAINE: Tarjeta para acceder al reporte de Asesores */}
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={() =>
							navigation.navigate("ReporteAsesores", {
								rol,
								nombre,
								idUsuario,
							})
						}
					>
						<LinearGradient
							colors={["#1e40af", "#1e3a8a", "#1f2937"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={[styles.reportCard, styles.reportCardBlue]}
						>
							<View style={styles.reportCardHeader}>
								<View style={styles.reportCardIcon}>
									<MaterialCommunityIcons
										name="briefcase-account"
										size={26}
										color="#ffffff"
									/>
								</View>
								<Text style={styles.reportCardTitle}>
									Reporte de Asesores
								</Text>
								<Text
									style={styles.reportCardDescription}
									numberOfLines={2}
								>
									Consulta, filtra y genera reportes de tus
									asesores registrados
								</Text>
							</View>
							<View style={styles.reportCardFooter}>
								<View style={styles.reportCardBadge}>
									<Text style={styles.reportCardBadgeText}>
										Asesores
									</Text>
								</View>
								<Text style={styles.reportCardArrow}>→</Text>
							</View>
						</LinearGradient>
					</TouchableOpacity>
				</View>

				{/* ATAMAINE: Tarjeta informativa con detalles sobre la funcionalidad de reportes */}
				<View style={styles.infoCard}>
					<Text style={styles.infoCardTitle}>
						Información sobre reportes
					</Text>
					<View style={styles.infoCardContent}>
						<View style={styles.infoItem}>
							<View style={styles.infoBullet} />
							<Text style={styles.infoText}>
								Los datos se cargan en tiempo real desde la base de
								datos
							</Text>
						</View>
						<View style={styles.infoItem}>
							<View style={styles.infoBullet} />
							<Text style={styles.infoText}>
								Puedes buscar por DNI, nombre, celular o correo
							</Text>
						</View>
						<View style={styles.infoItem}>
							<View style={styles.infoBullet} />
							<Text style={styles.infoText}>
								Exporta reportes a PDF con formato profesional
							</Text>
						</View>
						<View style={styles.infoItem}>
							<View style={styles.infoBullet} />
							<Text style={styles.infoText}>
								Todos los cambios se sincronizan automáticamente
							</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</View>
	);
};

export default MenuReportes;

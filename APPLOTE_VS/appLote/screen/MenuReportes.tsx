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
					{/* =========================================================
   ATAMAINE - CARD ULTRA PREMIUM | REPORTE CLIENTES
   Diseño REAL SaaS / CRM / Analytics / Fintech
========================================================= */}

<TouchableOpacity
	activeOpacity={0.92}
	onPress={() =>
		navigation.navigate("ReporteClientes", {
			rol,
			nombre,
			idUsuario,
		})
	}
>
	<LinearGradient
		colors={["#071b1a", "#0f766e", "#14b8a6"]}
		start={{ x: 0, y: 0 }}
		end={{ x: 1, y: 1 }}
		style={{
			borderRadius: 22,
			padding: 16,
			marginBottom: 16,

			/* SOMBRA PREMIUM LED */
			shadowColor: "#14b8a6",
			shadowOffset: {
				width: 0,
				height: 8,
			},
			shadowOpacity: 0.35,
			shadowRadius: 18,

			elevation: 12,

			/* EFECTO PREMIUM */
			borderWidth: 1,
			borderColor: "rgba(255,255,255,0.06)",

			overflow: "hidden",
			position: "relative",
		}}
	>
		{/* =========================================
		    EFECTO LED / BRILLO PREMIUM
		========================================= */}
		<View
			style={{
				position: "absolute",
				top: -25,
				right: -20,
				width: 120,
				height: 120,
				borderRadius: 100,

				backgroundColor: "rgba(255,255,255,0.06)",
			}}
		/>

		{/* ================= HEADER ================= */}
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			}}
		>
			{/* ICONO CLIENTES PREMIUM */}
			<View
				style={{
					width: 52,
					height: 52,
					borderRadius: 16,

					backgroundColor: "rgba(255,255,255,0.10)",

					justifyContent: "center",
					alignItems: "center",

					borderWidth: 1,
					borderColor: "rgba(255,255,255,0.08)",
				}}
			>
				<MaterialCommunityIcons
					name="account-group-outline"
					size={27}
					color="#99f6e4"
				/>
			</View>

			{/* ESTADO */}
			<View
				style={{
					backgroundColor: "rgba(16,185,129,0.15)",
					paddingHorizontal: 10,
					paddingVertical: 4,
					borderRadius: 30,
				}}
			>
				<Text
					style={{
						color: "#6ee7b7",
						fontSize: 10,
						fontWeight: "800",
						letterSpacing: 1,
					}}
				>
					LIVE
				</Text>
			</View>
		</View>

		{/* ================= CONTENIDO ================= */}
		<View style={{ marginTop: 15 }}>
			<Text
				style={{
					fontSize: 19,
					fontWeight: "800",
					color: "#ffffff",
				}}
			>
				Reporte de Clientes
			</Text>

			<Text
				numberOfLines={2}
				style={{
					fontSize: 12.8,
					color: "#d1fae5",
					marginTop: 6,
					lineHeight: 20,
				}}
			>
				Análisis inteligente, estadísticas y seguimiento
				de clientes registrados.
			</Text>
		</View>

		{/* ================= FOOTER ================= */}
		<View
			style={{
				marginTop: 18,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			}}
		>
			{/* ANALYTICS */}
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
				}}
			>
				<MaterialCommunityIcons
					name="chart-areaspline"
					size={16}
					color="#5eead4"
				/>

				<Text
					style={{
						color: "#ecfeff",
						marginLeft: 6,
						fontSize: 12,
						fontWeight: "700",
					}}
				>
					CRM Analytics
				</Text>
			</View>

			{/* BOTON PREMIUM */}
			<View
				style={{
					width: 40,
					height: 40,
					borderRadius: 13,

					backgroundColor: "#14b8a6",

					justifyContent: "center",
					alignItems: "center",

					/* EFECTO LED */
					shadowColor: "#2dd4bf",
					shadowOffset: {
						width: 0,
						height: 4,
					},
					shadowOpacity: 0.55,
					shadowRadius: 12,

					elevation: 7,
				}}
			>
				<MaterialCommunityIcons
					name="arrow-top-right"
					size={20}
					color="#ffffff"
				/>
			</View>
		</View>
	</LinearGradient>
</TouchableOpacity>


{/* =========================================================
   ATAMAINE - CARD PREMIUM ULTRA PRO | REPORTE ASESORES
   Diseño compacto + elegante + empresarial real
========================================================= */}

<TouchableOpacity
	activeOpacity={0.92}
	onPress={() =>
		navigation.navigate("ReporteAsesores", {
			rol,
			nombre,
			idUsuario,
		})
	}
>
	<LinearGradient
		colors={["#111827", "#312e81", "#4338ca"]}
		start={{ x: 0, y: 0 }}
		end={{ x: 1, y: 1 }}
		style={{
			borderRadius: 22,
			padding: 16,
			marginBottom: 16,

			/* SOMBRAS PREMIUM */
			shadowColor: "#4338ca",
			shadowOffset: {
				width: 0,
				height: 8,
			},
			shadowOpacity: 0.30,
			shadowRadius: 16,

			elevation: 10,

			/* EFECTO PREMIUM */
			borderWidth: 1,
			borderColor: "rgba(255,255,255,0.06)",
		}}
	>
		{/* ================= HEADER ================= */}
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			}}
		>
			{/* ICONO PREMIUM */}
			<View
				style={{
					width: 52,
					height: 52,
					borderRadius: 16,

					backgroundColor: "rgba(255,255,255,0.10)",

					justifyContent: "center",
					alignItems: "center",

					borderWidth: 1,
					borderColor: "rgba(255,255,255,0.08)",
				}}
			>
				<MaterialCommunityIcons
					name="account-tie-outline"
					size={27}
					color="#c4b5fd"
				/>
			</View>

			{/* ESTADO */}
			<View
				style={{
					backgroundColor: "rgba(34,197,94,0.14)",
					paddingHorizontal: 10,
					paddingVertical: 4,
					borderRadius: 30,
				}}
			>
				<Text
					style={{
						color: "#4ade80",
						fontSize: 10,
						fontWeight: "800",
						letterSpacing: 1,
					}}
				>
					ACTIVO
				</Text>
			</View>
		</View>

		{/* ================= CONTENIDO ================= */}
		<View style={{ marginTop: 15 }}>
			<Text
				style={{
					fontSize: 19,
					fontWeight: "800",
					color: "#ffffff",
				}}
			>
				Reporte de Asesores
			</Text>

			<Text
				numberOfLines={2}
				style={{
					fontSize: 12.8,
					color: "#d1d5db",
					marginTop: 6,
					lineHeight: 20,
				}}
			>
				Visualiza rendimiento, estadísticas y análisis
				de asesores registrados.
			</Text>
		</View>

		{/* ================= FOOTER ================= */}
		<View
			style={{
				marginTop: 18,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			}}
		>
			{/* BADGE */}
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
				}}
			>
				<MaterialCommunityIcons
					name="chart-line"
					size={16}
					color="#a78bfa"
				/>

				<Text
					style={{
						color: "#f3f4f6",
						marginLeft: 6,
						fontSize: 12,
						fontWeight: "700",
					}}
				>
					Analytics
				</Text>
			</View>

			{/* BOTON PREMIUM */}
			<View
				style={{
					width: 40,
					height: 40,
					borderRadius: 13,

					backgroundColor: "#6366f1",

					justifyContent: "center",
					alignItems: "center",

					shadowColor: "#818cf8",
					shadowOffset: {
						width: 0,
						height: 4,
					},
					shadowOpacity: 0.45,
					shadowRadius: 10,

					elevation: 6,
				}}
			>
				<MaterialCommunityIcons
					name="arrow-top-right"
					size={20}
					color="#ffffff"
				/>
			</View>
		</View>
	</LinearGradient>
</TouchableOpacity>
{/* ===== CARD ASESORES ULTRA PRO ===== */}

					

					


{/* =========================================================
   ATAMAINE - CARD PREMIUM ULTRA | REPORTE PROYECTOS
   Diseño Empresarial REAL / SaaS / Analytics / PM
========================================================= */}

<TouchableOpacity
	activeOpacity={0.92}
	onPress={() =>
		navigation.navigate("ReporteProyectos", {
			rol,
			nombre,
			idUsuario,
		})
	}
>
	<LinearGradient
		colors={["#0a0f1f", "#1e293b", "#2563eb"]}
		start={{ x: 0, y: 0 }}
		end={{ x: 1, y: 1 }}
		style={{
			borderRadius: 22,
			padding: 16,
			marginBottom: 16,

			/* SOMBRA LED PREMIUM */
			shadowColor: "#2563eb",
			shadowOffset: {
				width: 0,
				height: 8,
			},
			shadowOpacity: 0.35,
			shadowRadius: 18,

			elevation: 12,

			/* EFECTO PREMIUM */
			borderWidth: 1,
			borderColor: "rgba(255,255,255,0.06)",

			position: "relative",
			overflow: "hidden",
		}}
	>
		{/* =========================================
		    EFECTO VISUAL LED / BRILLO
		========================================= */}
		<View
			style={{
				position: "absolute",
				top: -30,
				right: -25,
				width: 130,
				height: 130,
				borderRadius: 100,

				backgroundColor: "rgba(255,255,255,0.06)",
			}}
		/>

		{/* ================= HEADER ================= */}
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			}}
		>
			{/* ICONO PREMIUM PROYECTOS */}
			<View
				style={{
					width: 52,
					height: 52,
					borderRadius: 16,

					backgroundColor: "rgba(255,255,255,0.10)",

					justifyContent: "center",
					alignItems: "center",

					borderWidth: 1,
					borderColor: "rgba(255,255,255,0.08)",
				}}
			>
				<MaterialCommunityIcons
					name="briefcase-check-outline"
					size={27}
					color="#93c5fd"
				/>
			</View>

			{/* ESTADO */}
			<View
				style={{
					backgroundColor: "rgba(34,197,94,0.15)",
					paddingHorizontal: 10,
					paddingVertical: 4,
					borderRadius: 30,
				}}
			>
				<Text
					style={{
						color: "#4ade80",
						fontSize: 10,
						fontWeight: "800",
						letterSpacing: 1,
					}}
				>
					ACTIVE
				</Text>
			</View>
		</View>

		{/* ================= CONTENIDO ================= */}
		<View style={{ marginTop: 15 }}>
			<Text
				style={{
					fontSize: 19,
					fontWeight: "800",
					color: "#ffffff",
				}}
			>
				Reporte de Proyectos
			</Text>

			<Text
				numberOfLines={2}
				style={{
					fontSize: 12.8,
					color: "#dbeafe",
					marginTop: 6,
					lineHeight: 20,
				}}
			>
				Seguimiento, estadísticas y análisis inteligente
				de proyectos registrados.
			</Text>
		</View>

		{/* ================= FOOTER ================= */}
		<View
			style={{
				marginTop: 18,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
			}}
		>
			{/* ANALYTICS */}
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
				}}
			>
				<MaterialCommunityIcons
					name="chart-timeline-variant"
					size={16}
					color="#7dd3fc"
				/>

				<Text
					style={{
						color: "#eff6ff",
						marginLeft: 6,
						fontSize: 12,
						fontWeight: "700",
					}}
				>
					Project Analytics
				</Text>
			</View>

			{/* BOTON PREMIUM */}
			<View
				style={{
					width: 40,
					height: 40,
					borderRadius: 13,

					backgroundColor: "#2563eb",

					justifyContent: "center",
					alignItems: "center",

					/* EFECTO LED */
					shadowColor: "#3b82f6",
					shadowOffset: {
						width: 0,
						height: 4,
					},
					shadowOpacity: 0.55,
					shadowRadius: 12,

					elevation: 7,
				}}
			>
				<MaterialCommunityIcons
					name="arrow-top-right"
					size={20}
					color="#ffffff"
				/>
			</View>
		</View>
	</LinearGradient>
</TouchableOpacity>



</View>
			</ScrollView>
		</View>
	);
};

export default MenuReportes;

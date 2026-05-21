/* =========================================================
   ATAMAINE - ULTRA GOD LEVEL UI 2026
   SaaS / ERP / AI Dashboard / CRM PREMIUM
   Compacto + elegante + tarjetas más juntas
========================================================= */

import { StyleSheet } from "react-native";

export default StyleSheet.create({
	/* =====================================================
	   MAIN CONTAINER
	===================================================== */
	container: {
		flex: 1,
		backgroundColor: "#030712",
		position: "relative",
	},

	/* =====================================================
	   BACKGROUND GLOW EFFECTS
	===================================================== */
	backgroundGlowTop: {
		position: "absolute",
		top: -120,
		left: -90,

		width: 300,
		height: 300,

		backgroundColor: "rgba(37,99,235,0.12)",

		borderRadius: 200,
		zIndex: 0,
	},

	backgroundGlowBottom: {
		position: "absolute",
		bottom: -100,
		right: -80,

		width: 280,
		height: 280,

		backgroundColor: "rgba(20,184,166,0.10)",

		borderRadius: 200,
		zIndex: 0,
	},

	/* =====================================================
	   SCROLL CONTENT
	   MÁS COMPACTO
	===================================================== */
	scrollContent: {
		paddingTop: 12,
		paddingHorizontal: 12,
		paddingBottom: 18,
	},

	/* =====================================================
	   HERO HEADER ULTRA
	===================================================== */
	heroCard: {
		borderRadius: 26,

		padding: 20,

		marginBottom: 12,

		backgroundColor: "rgba(15,23,42,0.92)",

		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",

		overflow: "hidden",

		shadowColor: "#2563eb",
		shadowOffset: {
			width: 0,
			height: 10,
		},
		shadowOpacity: 0.25,
		shadowRadius: 20,

		elevation: 12,
	},

	headerRow: {
		flexDirection: "row",
		alignItems: "center",
	},

	backButton: {
		width: 46,
		height: 46,

		borderRadius: 16,

		backgroundColor: "rgba(255,255,255,0.06)",

		justifyContent: "center",
		alignItems: "center",

		marginRight: 14,

		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
	},

	heroContent: {
		flex: 1,
	},

	title: {
		fontSize: 29,
		fontWeight: "900",

		color: "#ffffff",

		letterSpacing: 0.4,

		marginBottom: 4,
	},

	subtitle: {
		fontSize: 12.8,

		color: "#94a3b8",

		lineHeight: 19,

		fontWeight: "500",
	},

	/* =====================================================
	   CONTAINER TARJETAS
	   MÁS JUNTAS NIVEL PREMIUM
	===================================================== */
	reportCardsContainer: {
		gap: 8,
		marginBottom: 10,
	},

	/* =====================================================
	   TARJETAS BASE ULTRA
	===================================================== */
	reportCard: {
		borderRadius: 20,

		padding: 15,

		minHeight: 142,

		justifyContent: "space-between",

		borderWidth: 1,

		overflow: "hidden",

		position: "relative",

		/* SHADOW */
		shadowOffset: {
			width: 0,
			height: 8,
		},
		shadowOpacity: 0.30,
		shadowRadius: 16,

		elevation: 10,
	},

	/* =====================================================
	   CARD CLIENTES
	===================================================== */
	reportCardTeal: {
		backgroundColor: "#07131f",

		borderColor: "rgba(45,212,191,0.14)",

		shadowColor: "#14b8a6",
	},

	/* =====================================================
	   CARD PROYECTOS
	===================================================== */
	reportCardBlue: {
		backgroundColor: "#07131f",

		borderColor: "rgba(59,130,246,0.14)",

		shadowColor: "#2563eb",
	},

	/* =====================================================
	   CARD ASESORES
	===================================================== */
	reportCardPurple: {
		backgroundColor: "#07131f",

		borderColor: "rgba(139,92,246,0.14)",

		shadowColor: "#7c3aed",
	},

	/* =====================================================
	   EFECTO BRILLO LED
	===================================================== */
	cardGlow: {
		position: "absolute",
		top: -30,
		right: -25,

		width: 120,
		height: 120,

		borderRadius: 100,

		backgroundColor: "rgba(255,255,255,0.05)",
	},

	/* =====================================================
	   HEADER TARJETA
	===================================================== */
	reportCardHeader: {
		marginBottom: 10,
	},

	/* =====================================================
	   ICONO ULTRA PREMIUM
	===================================================== */
	reportCardIcon: {
		width: 50,
		height: 50,

		borderRadius: 15,

		backgroundColor: "rgba(255,255,255,0.07)",

		justifyContent: "center",
		alignItems: "center",

		marginBottom: 10,

		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
	},

	/* =====================================================
	   TITULO TARJETA
	===================================================== */
	reportCardTitle: {
		fontSize: 17.5,
		fontWeight: "900",

		color: "#ffffff",

		marginBottom: 5,

		letterSpacing: 0.3,
	},

	/* =====================================================
	   DESCRIPCION
	===================================================== */
	reportCardDescription: {
		fontSize: 12.2,

		color: "#94a3b8",

		lineHeight: 18,

		fontWeight: "500",
	},

	/* =====================================================
	   FOOTER
	===================================================== */
	reportCardFooter: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",

		marginTop: 12,
	},

	/* =====================================================
	   BADGES
	===================================================== */
	reportCardBadge: {
		paddingHorizontal: 10,
		paddingVertical: 5,

		borderRadius: 999,

		backgroundColor: "rgba(255,255,255,0.06)",

		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.04)",
	},

	reportCardBadgeText: {
		fontSize: 9.8,

		fontWeight: "800",

		color: "#ffffff",

		letterSpacing: 0.8,

		textTransform: "uppercase",
	},

	/* =====================================================
	   ARROW BUTTON
	===================================================== */
	reportCardArrowContainer: {
		width: 38,
		height: 38,

		borderRadius: 13,

		justifyContent: "center",
		alignItems: "center",
	},

	reportCardArrow: {
		fontSize: 17,
		color: "#ffffff",
	},

	/* =====================================================
	   INFO CARD
	===================================================== */
	infoCard: {
		backgroundColor: "rgba(15,23,42,0.92)",

		borderRadius: 18,

		padding: 15,

		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",

		elevation: 6,
	},

	infoCardTitle: {
		fontSize: 12.5,

		fontWeight: "800",

		color: "#ffffff",

		marginBottom: 10,

		letterSpacing: 0.5,

		textTransform: "uppercase",
	},

	infoCardContent: {
		gap: 7,
	},

	infoItem: {
		flexDirection: "row",
		alignItems: "flex-start",
	},

	infoBullet: {
		width: 6,
		height: 6,

		borderRadius: 3,

		backgroundColor: "#14b8a6",

		marginTop: 6,
		marginRight: 10,
	},

	infoText: {
		fontSize: 11.8,

		color: "#cbd5e1",

		lineHeight: 18,

		fontWeight: "500",

		flex: 1,
	},
});
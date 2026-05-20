import { StyleSheet } from "react-native";

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f0f9fc",
		position: "relative",
	},
	backgroundGlowTop: {
		position: "absolute",
		top: -80,
		left: -60,
		width: 320,
		height: 320,
		backgroundColor: "rgba(15, 118, 110, 0.08)",
		borderRadius: 160,
		zIndex: 0,
	},
	backgroundGlowBottom: {
		position: "absolute",
		bottom: -60,
		right: -80,
		width: 300,
		height: 300,
		backgroundColor: "rgba(30, 58, 138, 0.06)",
		borderRadius: 150,
		zIndex: 0,
	},
	scrollContent: {
		paddingVertical: 16,
		paddingHorizontal: 16,
		paddingBottom: 32,
	},

	// HERO HEADER
	heroCard: {
		borderRadius: 22,
		padding: 24,
		marginBottom: 24,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.12)",
		elevation: 4,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 14,
	},
	backButton: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 2,
	},
	heroContent: {
		flex: 1,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		color: "#ffffff",
		lineHeight: 36,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: "#dbeafe",
		lineHeight: 20,
	},

	// REPORT CARDS GRID
	reportCardsContainer: {
		gap: 16,
		marginBottom: 20,
	},
	reportCard: {
		borderRadius: 18,
		padding: 18,
		overflow: "hidden",
		borderWidth: 1,
		elevation: 3,
		justifyContent: "space-between",
		minHeight: 140,
	},
	reportCardTeal: {
		backgroundColor: "#0d9488",
		borderColor: "rgba(255, 255, 255, 0.12)",
	},
	reportCardBlue: {
		backgroundColor: "#1e40af",
		borderColor: "rgba(255, 255, 255, 0.12)",
	},

	// REPORT CARD CONTENT
	reportCardHeader: {
		marginBottom: 12,
	},
	reportCardIcon: {
		width: 48,
		height: 48,
		borderRadius: 12,
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 10,
	},
	reportCardTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#ffffff",
		marginBottom: 6,
		lineHeight: 22,
	},
	reportCardDescription: {
		fontSize: 12,
		fontWeight: "500",
		color: "rgba(255, 255, 255, 0.8)",
		lineHeight: 16,
	},
	reportCardFooter: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	reportCardBadge: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
	},
	reportCardBadgeText: {
		fontSize: 10,
		fontWeight: "700",
		color: "rgba(255, 255, 255, 0.9)",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	reportCardArrow: {
		fontSize: 16,
		color: "rgba(255, 255, 255, 0.7)",
	},

	// INFO CARD
	infoCard: {
		backgroundColor: "#ffffff",
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: "#dbeafe",
		elevation: 2,
	},
	infoCardTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#0f172a",
		marginBottom: 10,
		letterSpacing: 0.2,
		textTransform: "uppercase",
	},
	infoCardContent: {
		gap: 8,
	},
	infoItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
	},
	infoBullet: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#0f766e",
		marginTop: 6,
	},
	infoText: {
		fontSize: 12,
		fontWeight: "500",
		color: "#475569",
		lineHeight: 16,
		flex: 1,
	},
});

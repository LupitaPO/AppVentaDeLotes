import { StyleSheet } from "react-native";

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f0f9fc",
		position: "relative",
	},
	backgroundGlowTop: {
		position: "absolute",
		top: -100,
		left: -50,
		width: 300,
		height: 300,
		backgroundColor: "rgba(15, 118, 110, 0.08)",
		borderRadius: 150,
		zIndex: 0,
	},
	backgroundGlowBottom: {
		position: "absolute",
		bottom: -50,
		right: -100,
		width: 280,
		height: 280,
		backgroundColor: "rgba(30, 58, 138, 0.06)",
		borderRadius: 140,
		zIndex: 0,
	},
	scrollContent: {
		paddingVertical: 12,
		paddingHorizontal: 14,
		paddingBottom: 24,
	},

	// HERO CARD & HEADER
	heroCard: {
		borderRadius: 26,
		padding: 26,
		marginBottom: 22,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.12)",
		elevation: 6,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 20,
		gap: 14,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 2,
	},
	heroContent: {
		flex: 1,
	},
	liveBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 8,
		alignSelf: "flex-start",
		paddingHorizontal: 10,
		paddingVertical: 6,
		backgroundColor: "rgba(16, 185, 129, 0.2)",
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "rgba(16, 185, 129, 0.4)",
	},
	liveDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#10b981",
	},
	liveBadgeText: {
		fontSize: 11,
		fontWeight: "600",
		color: "#d1fae5",
		letterSpacing: 0.3,
	},
	title: {
		fontSize: 32,
		fontWeight: "900",
		color: "#ffffff",
		lineHeight: 32,
		marginBottom: 2,
	},
	subtitle: {
		fontSize: 13,
		fontWeight: "500",
		color: "#dbeafe",
		marginTop: 8,
		lineHeight: 18,
	},

	// STATS ROW
	statsRow: {
		flexDirection: "row",
		gap: 14,
		justifyContent: "space-between",
	},
	statCard: {
		flex: 1,
		backgroundColor: "rgba(255, 255, 255, 0.08)",
		borderRadius: 18,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.16)",
	},
	statLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: "#a3e4de",
		letterSpacing: 0.4,
		textTransform: "uppercase",
		marginBottom: 6,
	},
	statValue: {
		fontSize: 22,
		fontWeight: "800",
		color: "#ffffff",
		marginBottom: 4,
	},
	statValueSmall: {
		fontSize: 14,
		fontWeight: "700",
		color: "#ffffff",
		marginBottom: 4,
	},
	statCaption: {
		fontSize: 10,
		fontWeight: "500",
		color: "rgba(209, 250, 229, 0.7)",
	},

	// SEARCH CARD
	searchCard: {
		backgroundColor: "#ffffff",
		borderRadius: 18,
		padding: 18,
		marginBottom: 18,
		borderWidth: 1,
		borderColor: "#dbeafe",
		elevation: 2,
	},
	searchTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#0f172a",
		marginBottom: 12,
		letterSpacing: 0.2,
	},
	fieldLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#475569",
		marginBottom: 8,
		letterSpacing: 0.3,
		textTransform: "uppercase",
	},
	input: {
		borderWidth: 1,
		borderColor: "#cbd5e1",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 11,
		fontSize: 14,
		color: "#0f172a",
		marginBottom: 12,
		backgroundColor: "#f8fafc",
		fontWeight: "500",
	},

	// ACTION ROWS
	actionRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 12,
		justifyContent: "space-between",
	},
	actionRowSecondary: {
		flexDirection: "column",
		gap: 10,
		justifyContent: "flex-start",
	},

	// ACTION BUTTON STYLES
	primaryAction: {
		flex: 1,
	},
	secondaryAction: {
		width: "100%",
		alignSelf: "stretch",
	},
	newAction: {
		flex: 1,
	},
	clearAction: {
		flex: 1,
	},
	buttonDisabled: {
		opacity: 0.5,
	},

	actionSurface: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		borderRadius: 14,
		borderWidth: 1,
	},

	primaryActionSurface: {
		backgroundColor: "#dbeafe",
		borderColor: "#7dd3fc",
	},
	secondaryActionSurface: {
		backgroundColor: "#f59e0b",
		borderColor: "#f59e0b",
	},
	newActionSurface: {
		backgroundColor: "#ccfbf1",
		borderColor: "#99f6e4",
	},
	clearActionSurface: {
		backgroundColor: "#f1f5f9",
		borderColor: "#cbd5e1",
	},

	actionIconBadge: {
		width: 26,
		height: 26,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	primaryActionBadge: {
		backgroundColor: "rgba(37, 99, 235, 0.15)",
	},
	secondaryActionBadge: {
		backgroundColor: "rgba(245, 158, 11, 0.15)",
	},
	newActionBadge: {
		backgroundColor: "rgba(16, 185, 129, 0.15)",
	},
	clearActionBadge: {
		backgroundColor: "rgba(100, 116, 139, 0.15)",
	},

	primaryActionText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#ffffff",
	},
	secondaryActionText: {
		fontSize: 16,
		fontWeight: "800",
		color: "#ffffff",
		textAlign: "center",
	},
	newActionText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#ffffff",
	},
	clearActionText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#64748b",
	},

	// CONTENT CARD
	contentCard: {
		backgroundColor: "#ffffff",
		borderRadius: 20,
		padding: 18,
		borderWidth: 1,
		borderColor: "#dbeafe",
		elevation: 3,
	},
	contentTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#0f172a",
		marginBottom: 12,
		letterSpacing: 0.2,
	},

	// LOADER
	loader: {
		marginVertical: 40,
	},

	// MESSAGE BOX
	messageBox: {
		backgroundColor: "#fef3c7",
		borderLeftWidth: 4,
		borderLeftColor: "#f59e0b",
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 8,
		marginBottom: 12,
	},
	messageText: {
		fontSize: 13,
		fontWeight: "500",
		color: "#92400e",
		lineHeight: 18,
	},

	// RESULT COUNTER
	resultCounter: {
		fontSize: 12,
		fontWeight: "600",
		color: "#0f766e",
		marginBottom: 12,
		letterSpacing: 0.2,
		textTransform: "uppercase",
	},

	// EMPTY STATE
	emptyState: {
		alignItems: "center",
		paddingVertical: 40,
	},
	emptyIconWrap: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#ccfbf1",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 12,
	},
	emptyTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#0f172a",
		marginBottom: 6,
	},
	emptyText: {
		fontSize: 13,
		fontWeight: "500",
		color: "#64748b",
		textAlign: "center",
		lineHeight: 18,
	},

	// TABLE
	tableWrapper: {
		borderWidth: 1,
		borderColor: "#0f766e",
		borderRadius: 16,
		overflow: "hidden",
		backgroundColor: "#ffffff",
	},
	tableTopAccent: {
		height: 6,
		backgroundColor: "#0f766e",
	},
	tableHeaderRow: {
		flexDirection: "row",
		backgroundColor: "#0b54c2",
		paddingVertical: 14,
		paddingHorizontal: 12,
		alignItems: "center",
	},
	tableHeaderCell: {
		justifyContent: "center",
		paddingHorizontal: 8,
	},
	tableActionHeaderCell: {
		width: 50,
		justifyContent: "center",
		alignItems: "center",
	},
	tableHeaderText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#ffffff",
		letterSpacing: 0.6,
		textTransform: "uppercase",
	},

	tableDataRow: {
		flexDirection: "row",
		paddingVertical: 12,
		paddingHorizontal: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#f1f5f9",
		alignItems: "center",
	},
	tableRowEven: {
		backgroundColor: "#ffffff",
	},
	tableRowOdd: {
		backgroundColor: "#f8fafc",
	},
	tableRowMatch: {
		backgroundColor: "#e6f7ff",
		borderLeftWidth: 4,
		borderLeftColor: "#0f5bd4",
	},
	tableRowDim: {
		opacity: 0.6,
	},
	tableDataCell: {
		justifyContent: "center",
		paddingHorizontal: 8,
	},
	tableDataText: {
		fontSize: 12,
		fontWeight: "500",
		color: "#0f172a",
	},
	tableActionCell: {
		width: 50,
		justifyContent: "center",
		alignItems: "center",
	},

	// ESTADO BADGE
	estadoBadge: {
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 999,
		justifyContent: "center",
		alignItems: "center",
	},
	estadoBadgeActivo: {
		backgroundColor: "#ecfdf3",
		borderWidth: 1,
		borderColor: "#86efac",
	},
	estadoBadgeInactivo: {
		backgroundColor: "#fff1f2",
		borderWidth: 1,
		borderColor: "#fda4af",
	},
	estadoBadgeText: {
		fontSize: 11,
		fontWeight: "700",
	},
	estadoBadgeTextActivo: {
		color: "#15803d",
	},
	estadoBadgeTextInactivo: {
		color: "#be123c",
	},

	// VER BUTTON
	verButton: {
		paddingVertical: 8,
		paddingHorizontal: 14,
		backgroundColor: "#0f766e",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#0f766e",
		justifyContent: "center",
		alignItems: "center",
	},
	verButtonText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#ffffff",
	},

	// Small verification note used to confirm bundle reloads
	smallNote: {
		fontSize: 11,
		color: "#64748b",
		marginBottom: 10,
		fontWeight: "600",
	},
});

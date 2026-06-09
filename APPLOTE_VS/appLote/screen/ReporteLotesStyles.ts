import { StyleSheet } from "react-native";
import { reporteProyectosStyles } from "./ReporteProyectosStyles";

// ATAMAINE: Reutilizamos el sistema visual premium de reportes y agregamos controles propios de Lotes.
export const reporteLotesStyles = StyleSheet.create({
	...reporteProyectosStyles,
	estadoSelectWrap: {
		position: "relative",
		zIndex: 5,
		marginBottom: 16,
	},
	estadoSelectInput: {
		marginBottom: 0,
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	},
	estadoSelectText: {
		flex: 1,
		fontSize: 14,
		color: "#0f172a",
		fontWeight: "800",
	},
	estadoSelectPlaceholder: {
		flex: 1,
		fontSize: 14,
		color: "#8ba8ae",
		fontWeight: "500",
	},
	estadoOptionsBox: {
		marginTop: 8,
		backgroundColor: "#ffffff",
		borderWidth: 1,
		borderColor: "#bee9ec",
		borderRadius: 16,
		overflow: "hidden",
		elevation: 8,
		shadowColor: "#0f766e",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.14,
		shadowRadius: 16,
	},
	estadoOptionItem: {
		minHeight: 48,
		paddingHorizontal: 14,
		paddingVertical: 11,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderBottomColor: "#eef7f8",
	},
	estadoOptionItemActive: {
		backgroundColor: "#ecfdf3",
	},
	estadoOptionText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#334155",
	},
	estadoOptionTextActive: {
		color: "#0f766e",
	},
});

export default reporteLotesStyles;

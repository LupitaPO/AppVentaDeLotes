import { StyleSheet } from "react-native";
import reporteBaseStyles from "./ReporteClientesStyles";

// ATAMAINE: Usuarios comparte la base visual compacta de los reportes premium
// y agrega un selector escribible alimentado por los tipos publicados en la API.
export const reporteUsuariosStyles = StyleSheet.create({
	...reporteBaseStyles,
	fieldLabel: {
		fontSize: 9,
		fontWeight: "900",
		color: "#334155",
		marginBottom: 6,
	},
	selectorWrap: {
		position: "relative",
		zIndex: 30,
		marginBottom: 8,
	},
	selectorShell: {
		minHeight: 42,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 11,
		paddingRight: 5,
		backgroundColor: "#f8fbff",
		borderRadius: 11,
		borderWidth: 1,
		borderColor: "#cfe0ef",
	},
	selectorShellFocused: {
		borderColor: "#14b8a6",
		backgroundColor: "#f4fffd",
	},
	selectorInput: {
		flex: 1,
		minWidth: 0,
		height: 40,
		paddingVertical: 0,
		fontSize: 10.5,
		fontWeight: "800",
		color: "#0f172a",
	},
	selectorIconButton: {
		width: 31,
		height: 31,
		borderRadius: 9,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#e8f8f5",
	},
	selectorClearButton: {
		width: 25,
		height: 31,
		alignItems: "center",
		justifyContent: "center",
	},
	optionsBox: {
		marginTop: 6,
		maxHeight: 225,
		backgroundColor: "#ffffff",
		borderWidth: 1,
		borderColor: "#bfe3df",
		borderRadius: 12,
		overflow: "hidden",
		elevation: 12,
		shadowColor: "#0f766e",
		shadowOffset: { width: 0, height: 9 },
		shadowOpacity: 0.18,
		shadowRadius: 14,
	},
	optionsHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 11,
		paddingVertical: 7,
		backgroundColor: "#ecfdf8",
		borderBottomWidth: 1,
		borderBottomColor: "#d7f1eb",
	},
	optionsHeaderText: {
		fontSize: 8,
		fontWeight: "900",
		color: "#0f766e",
		textTransform: "uppercase",
		letterSpacing: 0.35,
	},
	optionsScroll: {
		maxHeight: 185,
	},
	optionItem: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		gap: 9,
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderBottomWidth: 1,
		borderBottomColor: "#edf3f7",
	},
	optionItemActive: {
		backgroundColor: "#effcf8",
	},
	optionIcon: {
		width: 30,
		height: 30,
		borderRadius: 9,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#e7f8f4",
	},
	optionTitle: {
		flex: 1,
		fontSize: 10,
		fontWeight: "900",
		color: "#102033",
	},
	optionEmpty: {
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 17,
		gap: 5,
	},
	optionEmptyText: {
		fontSize: 9,
		fontWeight: "800",
		color: "#64748b",
		textAlign: "center",
	},
});

export default reporteUsuariosStyles;

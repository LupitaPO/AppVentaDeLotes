import { StyleSheet } from "react-native";
import reporteBaseStyles from "./ReporteClientesStyles";

// ATAMAINE: Asesores usa la misma base compacta y responsiva de los reportes
// premium, conservando un campo propio para buscar por DNI o nombre.
export const reporteAsesorStyles = StyleSheet.create({
	...reporteBaseStyles,
	fieldLabel: {
		fontSize: 9,
		fontWeight: "900",
		color: "#334155",
		marginBottom: 6,
	},
});

export default reporteAsesorStyles;

import {
	ActivityIndicator,
	Alert,
	Image,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import { API_URL } from "../config/apiUrl";
import styles from "./ReporteUsuariosStyles";
import i18n from "../i18n";

type ReporteItem = Record<string, unknown>;

type UsuarioReporteItem = {
	IdUsuario: string;
	Nombre: string;
	Correo: string;
	Celular: string;
	TipoUsuario: string;
	Estado: string;
};

type ReporteUsuariosProps = {
	navigation: any;
};

const EMPRESA_NOMBRE = "Tu Lote Seguro";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "US";

const escapeHtml = (value: unknown) =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

const parseReporteResponse = (payload: string): ReporteItem[] => {
	try {
		if (!payload) return [];
		const parsed = JSON.parse(payload);
		if (Array.isArray(parsed)) return parsed as ReporteItem[];
		if (typeof parsed === "string") {
			const nested = JSON.parse(parsed);
			return Array.isArray(nested) ? nested : [];
		}

		const keys = ["d", "Data", "data", "result", "Resultado", "resultados", "Resultados"];
		for (const key of keys) {
			const value = (parsed as ReporteItem)[key];
			if (Array.isArray(value)) return value as ReporteItem[];
			if (typeof value === "string") {
				const nested = JSON.parse(value);
				return Array.isArray(nested) ? nested : [];
			}
		}

		return [];
	} catch (error) {
		console.error("Error al parsear reporte de usuarios:", error);
		return [];
	}
};

const COLUMNAS_REPORTE: Array<{
	key: keyof UsuarioReporteItem;
	label: string;
	flex: number;
}> = [
	{ key: "IdUsuario", label: "ID", flex: 0.55 },
	{ key: "Nombre", label: "Nombre", flex: 1.25 },
	{ key: "Correo", label: "Correo", flex: 1.5 },
	{ key: "Celular", label: "Celular", flex: 0.95 },
	{ key: "TipoUsuario", label: "Tipo", flex: 1.05 },
	{ key: "Estado", label: "Estado", flex: 0.9 },
];

const textoLimpio = (value: unknown) => String(value ?? "").trim();

const normalizarEstadoUsuario = (estado: unknown) => {
	const estadoTexto = textoLimpio(estado).toLowerCase();
	const estadosActivos = ["a", "activo", "1", "true", "habilitado"];
	const estadosInactivos = ["i", "x", "0", "false", "inactivo", "anulado", "desactivado"];

	// ATAMAINE: La API puede devolver letras como A, I o X; el reporte muestra estados entendibles.
	if (estadosActivos.includes(estadoTexto)) return "Activo";
	if (estadosInactivos.includes(estadoTexto)) return "Inactivo";
	return estadoTexto ? estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1) : "Activo";
};

const normalizarUsuarios = (items: ReporteItem[]): UsuarioReporteItem[] =>
	items.map((item) => {
		const nombreCompleto = [
			item.Nombre,
			item.Nombre1,
			item.Nombre2,
			item.Apaterno,
			item.Amaterno,
		]
			.map(textoLimpio)
			.filter(Boolean)
			.join(" ");

		// ATAMAINE: No exponemos contraseña en el reporte; solo datos operativos de usuarios.
		return {
			IdUsuario: textoLimpio(item.IdUsuario ?? item.ID ?? item.Id ?? "-"),
			Nombre: nombreCompleto || "-",
			Correo: textoLimpio(item.Correo ?? item.Email ?? "-"),
			Celular: textoLimpio(item.Celular ?? item.Telefono ?? item.Teléfono ?? "-"),
			TipoUsuario: textoLimpio(item.TipoUsuario ?? item.Tipo ?? item.DescripcionTipo ?? "-"),
			Estado: normalizarEstadoUsuario(item.Estado ?? item.EstadoUsuario),
		};
	});

const esUsuarioActivo = (estado: string) => estado.trim().toLowerCase() === "activo";

// ATAMAINE: Desde Ver abrimos el tab de usuarios y mandamos el ID para ubicar la tarjeta en la lista real.
const abrirUsuarioRegistrado = (navigation: any, item: UsuarioReporteItem) => {
	navigation.navigate("MainTabs", {
		screen: i18n.t("btusuario"),
		params: {
			usuarioSeleccionadoId: item.IdUsuario,
			usuarioSeleccionadoNombre: item.Nombre,
		},
	});
};

const obtenerLogoPdfUri = () => {
	const resolver = (Image as any).resolveAssetSource;
	if (typeof resolver !== "function") return "";
	return resolver(require("../assets/splash-icon.png"))?.uri || "";
};

const filtrarUsuariosLocal = (items: UsuarioReporteItem[], nombre: string, tipoUsuario: string) => {
	const nombreFiltro = nombre.trim().toLowerCase();
	const tipoFiltro = tipoUsuario.trim().toLowerCase();

	// ATAMAINE: Respaldo temporal para trabajar hoy aunque reporte_Usuarios aun no este publicado en Somee.
	return items.filter((item) => {
		const coincideNombre = !nombreFiltro || item.Nombre.toLowerCase().includes(nombreFiltro);
		const coincideTipo = !tipoFiltro || item.TipoUsuario.toLowerCase().includes(tipoFiltro);
		return coincideNombre && coincideTipo;
	});
};

const consultarUsuariosBase = async (signal?: AbortSignal) => {
	const response = await fetch(`${API_URL}/Usuario/usuario_Listar`, { signal });
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const rawData = await response.text();
	return normalizarUsuarios(parseReporteResponse(rawData));
};

const consultarUsuariosReporte = async (nombre: string, tipoUsuario: string, signal?: AbortSignal) => {
	const params = new URLSearchParams();
	if (nombre.trim()) params.append("nombre", nombre.trim());
	if (tipoUsuario.trim()) params.append("tipoUsuario", tipoUsuario.trim());

	// ATAMAINE: Primero se consulta el controller oficial; si no existe aun, se usara usuario_Listar.
	const url = `${API_URL}/Reporte/reporte_Usuarios${params.toString() ? `?${params.toString()}` : ""}`;
	const response = await fetch(url, { signal });
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const rawData = await response.text();
	return normalizarUsuarios(parseReporteResponse(rawData));
};

const ReporteUsuarios = ({ navigation }: ReporteUsuariosProps) => {
	const [nombre, setNombre] = useState("");
	const [tipoUsuario, setTipoUsuario] = useState("");
	const [todosUsuarios, setTodosUsuarios] = useState<UsuarioReporteItem[]>([]);
	const [reporte, setReporte] = useState<UsuarioReporteItem[]>([]);
	const [cargando, setCargando] = useState(false);
	const [buscado, setBuscado] = useState(false);
	const [mensaje, setMensaje] = useState("");
	const [ultimoFiltro, setUltimoFiltro] = useState("");
	const [horaActual, setHoraActual] = useState(new Date());
	const fetchControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		const timer = setInterval(() => setHoraActual(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const cargarUsuariosIniciales = async () => {
		try {
			setCargando(true);
			setMensaje("");
			const usuariosBase = await consultarUsuariosBase();
			setTodosUsuarios(usuariosBase);
			setReporte(usuariosBase);
			setBuscado(false);
			setUltimoFiltro("");
			if (!usuariosBase.length) setMensaje("No existen usuarios registrados.");
		} catch (error) {
			console.error("Error al cargar usuarios registrados:", error);
			setTodosUsuarios([]);
			setReporte([]);
			setMensaje("No se pudo cargar la lista de usuarios.");
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargarUsuariosIniciales();
	}, []);

	const limpiarFiltro = async () => {
		setNombre("");
		setTipoUsuario("");
		setBuscado(false);
		setMensaje("");
		await cargarUsuariosIniciales();
	};

	const filtrosTexto = [
		nombre.trim() ? `Nombre: ${nombre.trim()}` : "",
		tipoUsuario.trim() ? `Tipo: ${tipoUsuario.trim()}` : "",
	]
		.filter(Boolean)
		.join(" | ");

	const consultarReporte = async () => {
		const hayFiltro = Boolean(nombre.trim() || tipoUsuario.trim());

		if (!hayFiltro) {
			await cargarUsuariosIniciales();
			return;
		}

		try {
			setCargando(true);
			setMensaje("");
			setUltimoFiltro(filtrosTexto);
			if (fetchControllerRef.current) fetchControllerRef.current.abort();
			fetchControllerRef.current = new AbortController();

			let filtrados: UsuarioReporteItem[] = [];
			try {
				filtrados = await consultarUsuariosReporte(nombre, tipoUsuario, fetchControllerRef.current.signal);
			} catch (error) {
				const base = todosUsuarios.length ? todosUsuarios : await consultarUsuariosBase(fetchControllerRef.current.signal);
				filtrados = filtrarUsuariosLocal(base, nombre, tipoUsuario);
			}

			setReporte(filtrados);
			setBuscado(true);
			if (!filtrados.length) setMensaje("No se encontraron usuarios para ese criterio.");
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			console.error("Error al consultar reporte de usuarios:", error);
			setReporte([]);
			setBuscado(true);
			setMensaje("No se pudo consultar el reporte de usuarios.");
		} finally {
			setCargando(false);
		}
	};

	const horaFormateada = horaActual.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
	const fechaFormateada = horaActual.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
	const usuariosParaPdf = buscado ? reporte : todosUsuarios;
	const logoPdfUri = obtenerLogoPdfUri();

	const construirHtmlReporte = () => {
		const numeroDocumento = `RPT-USU-${horaActual.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
		const logoHtml = logoPdfUri
			? `<img src="${escapeHtml(logoPdfUri)}" style="width:68px;height:68px;border-radius:16px;object-fit:contain;background:white;padding:8px;" />`
			: `<div style="width:68px;height:68px;border-radius:16px;background:white;color:#0f766e;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;">${EMPRESA_SIGLAS}</div>`;
		const columnasPdf = [
			{ label: "N", width: "6%" },
			{ label: "ID", width: "8%" },
			{ label: "Nombre", width: "22%" },
			{ label: "Correo", width: "25%" },
			{ label: "Celular", width: "13%" },
			{ label: "Tipo", width: "14%" },
			{ label: "Estado", width: "12%" },
		];
		const colgroupHtml = columnasPdf.map((columna) => `<col style="width:${columna.width};" />`).join("");
		const encabezadosHtml = columnasPdf
			.map((columna) => `<th style="padding:12px 10px;background:#1d4ed8;color:white;font-size:12px;border:1px solid #d9e6f2;text-align:center;">${escapeHtml(columna.label)}</th>`)
			.join("");
		const filasHtml = usuariosParaPdf
			.map((item, index) => {
				const fondoFila = index % 2 === 0 ? "#ffffff" : "#f6fbff";
				const celdas = COLUMNAS_REPORTE.map((columna) => {
					const valor = String(item[columna.key] ?? "-");
					return `<td style="border:1px solid #dbe4ea;padding:10px;text-align:center;background:${fondoFila};font-size:12px;color:#0f172a;">${escapeHtml(valor)}</td>`;
				}).join("");
				return `<tr><td style="border:1px solid #dbe4ea;padding:10px;text-align:center;background:${fondoFila};font-weight:700;">${index + 1}</td>${celdas}</tr>`;
			})
			.join("");

		// ATAMAINE: HTML compacto para PDF/impresion web con los mismos datos normalizados de pantalla.
		return `<html><head><style>@page{size:A4 landscape;margin:18px 18px 56px 18px;}body{font-family:Arial,sans-serif;color:#0f172a;}table{width:100%;border-collapse:collapse;table-layout:fixed;}td,th{word-break:break-word;overflow-wrap:anywhere;}.footer-wrap{position:fixed;left:24px;right:24px;bottom:8px;display:flex;justify-content:space-between;gap:12px;padding-top:10px;border-top:1px solid #cbd5e1;font-size:10px;color:#475569;}</style></head><body style="padding:24px;"><div style="display:flex;justify-content:space-between;align-items:stretch;margin-bottom:18px;background:linear-gradient(135deg,#0f766e 0%,#164e63 55%,#1e3a8a 100%);border-radius:22px;overflow:hidden;"><div style="display:flex;align-items:center;gap:16px;padding:18px 20px;flex:1;">${logoHtml}<div><p style="margin:0 0 5px;color:#d1fae5;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(EMPRESA_NOMBRE)}</p><h1 style="margin:0;color:white;font-size:26px;">Reporte de Usuarios</h1><p style="margin:8px 0 0;color:#dbeafe;font-size:12px;">Documento generado en tiempo real desde usuarios registrados.</p></div></div><div style="min-width:230px;background:rgba(255,255,255,0.12);padding:18px 20px;"><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Documento:</strong> ${escapeHtml(numeroDocumento)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Fecha:</strong> ${escapeHtml(fechaFormateada)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Hora:</strong> ${escapeHtml(horaFormateada)}</p><p style="margin:0;color:white;font-size:12px;"><strong>Total:</strong> ${usuariosParaPdf.length} registros</p></div></div><div style="border:1px solid #dbe4ea;border-radius:18px;overflow:hidden;"><table><colgroup>${colgroupHtml}</colgroup><thead><tr>${encabezadosHtml}</tr></thead><tbody>${filasHtml}</tbody></table></div><div class="footer-wrap"><div><strong>${escapeHtml(EMPRESA_NOMBRE)}</strong> | Reporte interno de usuarios. Contacto: ${escapeHtml(EMPRESA_CONTACTO)}</div></div></body></html>`;
	};

	const generarPDF = async () => {
		if (!usuariosParaPdf.length) {
			Alert.alert("Aviso", "Primero genera un reporte para exportarlo en PDF.");
			return;
		}
		try {
			const html = construirHtmlReporte();
			if (Platform.OS === "web" && typeof window !== "undefined") {
				const printWindow = window.open("", "_blank");
				if (printWindow) {
					printWindow.document.open();
					printWindow.document.write(html);
					printWindow.document.close();
					printWindow.focus();
					setTimeout(() => printWindow.print(), 300);
					return;
				}
			}
			await Print.printAsync({ html });
			const { uri } = await Print.printToFileAsync({ html });
			if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
		} catch (error) {
			console.error("Error al generar PDF de usuarios:", error);
			Alert.alert("Error", "No se pudo generar el PDF del reporte.");
		}
	};

	const listadoMostrar = buscado ? reporte : todosUsuarios;
	const esColumnaCorta = (key: keyof UsuarioReporteItem) =>
		key === "IdUsuario" || key === "Celular" || key === "TipoUsuario";

	return (
		<View style={styles.container}>
			<View style={styles.backgroundGlowTop} />
			<View style={styles.backgroundGlowBottom} />
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<LinearGradient colors={["#0f766e", "#155e63", "#172554"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
					<View style={styles.headerRow}>
						<TouchableOpacity style={styles.backButtonTouch} onPress={() => navigation.goBack()}>
							<LinearGradient colors={["rgba(255,255,255,0.34)", "rgba(255,255,255,0.12)"]} style={styles.backButton}>
								<MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
							</LinearGradient>
						</TouchableOpacity>
						<View style={styles.heroContent}>
							<View style={styles.liveBadge}>
								<View style={styles.liveDot} />
								<Text style={styles.liveBadgeText}>Tiempo real {horaFormateada}</Text>
							</View>
							<Text style={styles.title}>Gestion Integral</Text>
							<Text style={styles.title}>de Usuarios</Text>
							<Text style={styles.subtitle}>Consulta usuarios por nombre o tipo con datos reales en tiempo real.</Text>
						</View>
					</View>
					<View style={styles.statsRow}>
						<View style={styles.statCard}>
							<Text style={styles.statLabel}>Usuarios Registrados</Text>
							{cargando ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.statValue}>{Math.max(todosUsuarios.length, reporte.length)}</Text>}
							<Text style={styles.statCaption}>Usuarios totales</Text>
						</View>
						<View style={styles.statCard}>
							<Text style={styles.statLabel}>Ultimo Filtro</Text>
							<Text style={styles.statValueSmall}>{ultimoFiltro || "Sin filtro"}</Text>
							<Text style={styles.statCaption}>Dato consultado</Text>
						</View>
					</View>
				</LinearGradient>

				<View style={styles.searchCard}>
					<Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
					<Text style={styles.fieldLabel}>Nombre:</Text>
					<TextInput value={nombre} onChangeText={setNombre} placeholder="Ingresar nombre de usuario" placeholderTextColor="#8ba8ae" style={styles.input} returnKeyType="search" onSubmitEditing={consultarReporte} />
					<Text style={styles.fieldLabel}>Tipo de usuario:</Text>
					<TextInput value={tipoUsuario} onChangeText={setTipoUsuario} placeholder="Administrador, Usuario..." placeholderTextColor="#8ba8ae" style={styles.input} returnKeyType="search" onSubmitEditing={consultarReporte} />

					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.primaryAction} onPress={consultarReporte}>
							<LinearGradient colors={["#ffffff", "#edf5ff"]} style={[styles.actionSurface, styles.primaryActionSurface]}>
								<View style={[styles.actionIconBadge, styles.primaryActionBadge]}>
									<MaterialCommunityIcons name="magnify" size={18} color="#2563eb" />
								</View>
								<Text style={styles.primaryActionText}>Buscar</Text>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity style={styles.newAction} onPress={() => navigation.navigate("RegistrarUsuario")}>
							<LinearGradient colors={["#ffffff", "#e8fff8"]} style={[styles.actionSurface, styles.newActionSurface]}>
								<View style={[styles.actionIconBadge, styles.newActionBadge]}>
									<MaterialCommunityIcons name="plus-circle-outline" size={18} color="#0f766e" />
								</View>
								<Text style={styles.newActionText}>Nuevo</Text>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity style={styles.clearAction} onPress={limpiarFiltro}>
							<LinearGradient colors={["#ffffff", "#f4f7fb"]} style={[styles.actionSurface, styles.clearActionSurface]}>
								<View style={[styles.actionIconBadge, styles.clearActionBadge]}>
									<MaterialCommunityIcons name="close-circle-outline" size={18} color="#64748b" />
								</View>
								<Text style={styles.clearActionText}>Limpiar</Text>
							</LinearGradient>
						</TouchableOpacity>
					</View>
					<View style={styles.actionRowSecondary}>
						<TouchableOpacity style={[styles.secondaryAction, (!usuariosParaPdf.length || cargando) && styles.buttonDisabled]} onPress={generarPDF} disabled={!usuariosParaPdf.length || cargando}>
							<LinearGradient colors={["#ffffff", "#fff7e6"]} style={[styles.actionSurface, styles.secondaryActionSurface]}>
								<View style={[styles.actionIconBadge, styles.secondaryActionBadge]}>
									<MaterialCommunityIcons name="file-pdf-box" size={18} color="#f59e0b" />
								</View>
								<Text style={styles.secondaryActionText}>PDF</Text>
							</LinearGradient>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.contentCard}>
					<Text style={styles.contentTitle}>Listado del Reporte</Text>
					{cargando ? <ActivityIndicator size="large" color="#069488" style={styles.loader} /> : null}
					{!cargando && mensaje ? <View style={styles.messageBox}><Text style={styles.messageText}>{mensaje}</Text></View> : null}
					{!cargando && buscado && reporte.length > 0 ? <Text style={styles.resultCounter}>Mostrando {reporte.length} resultado{reporte.length === 1 ? "" : "s"} para: {ultimoFiltro}</Text> : null}
					{!cargando && listadoMostrar.length > 0 ? (
						<View style={styles.tableWrapper}>
							<View style={styles.tableTopAccent} />
							<View style={styles.tableHeaderRow}>
								{COLUMNAS_REPORTE.map((columna) => (
									<View key={columna.key} style={[styles.tableHeaderCell, { flex: columna.flex }]}>
										<Text style={styles.tableHeaderText}>{columna.label}</Text>
									</View>
								))}
								<View style={styles.tableActionHeaderCell}><Text style={styles.tableHeaderText}>Ver</Text></View>
							</View>
							{listadoMostrar.map((item, index) => (
								<View key={`${item.IdUsuario}-${index}`} style={[styles.tableDataRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
									{COLUMNAS_REPORTE.map((columna) => (
										<View key={`${index}-${columna.key}`} style={[styles.tableDataCell, { flex: columna.flex }]}>
											{columna.key === "Estado" ? (
												<View style={[styles.estadoBadge, esUsuarioActivo(String(item.Estado)) ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo]}>
													<Text style={[styles.estadoBadgeText, esUsuarioActivo(String(item.Estado)) ? styles.estadoBadgeTextActivo : styles.estadoBadgeTextInactivo]}>{String(item[columna.key] ?? "-")}</Text>
												</View>
											) : (
												<Text style={[styles.tableDataText, esColumnaCorta(columna.key) ? styles.tableDataTextTight : null]} numberOfLines={2} adjustsFontSizeToFit={esColumnaCorta(columna.key)} minimumFontScale={0.78}>
													{String(item[columna.key] ?? "-")}
												</Text>
											)}
										</View>
									))}
									<View style={styles.tableActionCell}>
										<TouchableOpacity style={styles.verButton} onPress={() => abrirUsuarioRegistrado(navigation, item)}>
											<Text style={styles.verButtonText}>Ver</Text>
										</TouchableOpacity>
									</View>
								</View>
							))}
						</View>
					) : null}
				</View>
			</ScrollView>
		</View>
	);
};

export default ReporteUsuarios;

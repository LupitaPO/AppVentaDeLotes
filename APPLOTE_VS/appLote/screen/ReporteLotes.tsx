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
import styles from "./ReporteLotesStyles";
import i18n from "../i18n";

type ReporteItem = Record<string, unknown>;

type LoteReporteItem = {
	IdLote: string;
	CodigoLote: string;
	Proyecto: string;
	Manzana: string;
	NumeroLote: string;
	Area: string;
	Precio: string;
	EstadoLote: string;
};

type ReporteLotesProps = {
	navigation: any;
};

const EMPRESA_NOMBRE = "Residencial Santa Fe";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "LS";

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
			const value = (parsed as Record<string, unknown>)[key];
			if (Array.isArray(value)) return value as ReporteItem[];
			if (typeof value === "string") {
				const nested = JSON.parse(value);
				return Array.isArray(nested) ? nested : [];
			}
		}

		return [];
	} catch (error) {
		console.error("Error al parsear reporte de lotes:", error);
		return [];
	}
};

const COLUMNAS_REPORTE: Array<{
	key: keyof LoteReporteItem;
	label: string;
	flex: number;
}> = [
	{ key: "CodigoLote", label: "Codigo", flex: 0.9 },
	{ key: "Proyecto", label: "Proyecto", flex: 1.15 },
	{ key: "Manzana", label: "Mz.", flex: 0.65 },
	{ key: "NumeroLote", label: "Lote", flex: 0.65 },
	{ key: "Area", label: "m2", flex: 0.7 },
	{ key: "Precio", label: "Precio", flex: 0.95 },
	{ key: "EstadoLote", label: "Estado", flex: 0.95 },
];

const normalizarEstadoLote = (estado: unknown) => {
	const estadoTexto = String(estado ?? "").trim().toLowerCase();
	const estadosLibres = ["libre", "disponible", "activo", "a"];
	const estadosVendidos = ["vendido", "ocupado"];
	const estadosDeuda = ["en deuda", "retrasado", "mora", "moroso"];

	// ATAMAINE: Si algun endpoint devuelve X para anulados, el reporte muestra Inactivo en vez de una letra cruda.
	if (["x", "inactivo", "anulado", "desactivado"].includes(estadoTexto)) return "Inactivo";
	if (estadosLibres.includes(estadoTexto)) return "Libre";
	if (estadosVendidos.includes(estadoTexto)) return "Vendido";
	if (estadosDeuda.includes(estadoTexto)) return estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1);
	return estadoTexto ? estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1) : "Libre";
};

const formatoMoneda = (value: unknown) => {
	const numero = Number(value ?? 0);
	if (!Number.isFinite(numero)) return "S/ 0.00";
	return `S/ ${numero.toFixed(2)}`;
};

const normalizarLotes = (items: ReporteItem[]): LoteReporteItem[] =>
	items.map((item) => ({
		IdLote: String(item.IdLote ?? item.ID ?? item.Id ?? "-"),
		CodigoLote: String(item.CodigoLote ?? item.CodLote ?? item.Codigo ?? "-"),
		Proyecto: String(item.NombreProyecto ?? item.Proyecto ?? item.Nombre ?? item.IdProyecto ?? "-"),
		Manzana: String(item.Manzana ?? item.Mz ?? "-"),
		NumeroLote: String(item.NumeroLote ?? item.NumLote ?? item.Lote ?? "-"),
		Area: String(item.TamañoMetros2 ?? item.TamanoMetros2 ?? item.Area ?? item.Metros2 ?? "-"),
		Precio: formatoMoneda(item.Precio ?? item.PrecioLote ?? item.Valor),
		EstadoLote: normalizarEstadoLote(item.EstadoLote ?? item.Estado),
	}));

const esEstadoDisponible = (estado: string) => estado.trim().toLowerCase() === "libre";

// ATAMAINE: Lotes pertenecen a un proyecto; Ver abre Proyectos y marca el proyecto relacionado al lote.
const abrirProyectoDelLote = (navigation: any, item: LoteReporteItem) => {
	navigation.navigate("MainTabs", {
		screen: i18n.t("btProyectos"),
		params: {
			proyectoSeleccionadoNombre: item.Proyecto,
			loteSeleccionadoCodigo: item.CodigoLote,
		},
	});
};

const obtenerLogoPdfUri = () => {
	const resolver = (Image as any).resolveAssetSource;
	if (typeof resolver !== "function") return "";
	return resolver(require("../assets/splash-icon.png"))?.uri || "";
};

const filtrarLotesLocal = (
	items: LoteReporteItem[],
	estadoLote: string,
	nombreProyecto: string,
	precioDesde: string,
) => {
	const estado = estadoLote.trim().toLowerCase();
	const proyecto = nombreProyecto.trim().toLowerCase();
	const precio = Number(precioDesde || 0);

	// ATAMAINE: Fallback local para cuando el controller reporte_Lotes aun no esta publicado en Somee.
	return items.filter((item) => {
		const precioItem = Number(item.Precio.replace(/[^\d.]/g, ""));
		const coincideEstado = !estado || item.EstadoLote.toLowerCase().includes(estado);
		const coincideProyecto = !proyecto || item.Proyecto.toLowerCase().includes(proyecto);
		const coincidePrecio = !precioDesde || (Number.isFinite(precioItem) && precioItem >= precio);
		return coincideEstado && coincideProyecto && coincidePrecio;
	});
};

const consultarLotesBase = async (signal?: AbortSignal) => {
	const response = await fetch(`${API_URL}/Lote/lote_Listar`, { signal });
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const rawData = await response.text();
	return normalizarLotes(parseReporteResponse(rawData));
};

const consultarLotesReporte = async (
	estadoLote: string,
	nombreProyecto: string,
	precioDesde: string,
	signal?: AbortSignal,
) => {
	const params = new URLSearchParams();
	if (estadoLote.trim()) params.append("estadoLote", estadoLote.trim());
	if (nombreProyecto.trim()) params.append("nombreProyecto", nombreProyecto.trim());
	if (precioDesde.trim()) params.append("precioDesde", precioDesde.trim());

	// ATAMAINE: Primero intentamos el controller real reporte_Lotes; si no existe, usamos lote_Listar con filtros locales.
	const url = `${API_URL}/Reporte/reporte_Lotes${params.toString() ? `?${params.toString()}` : ""}`;
	const response = await fetch(url, { signal });
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const rawData = await response.text();
	return normalizarLotes(parseReporteResponse(rawData));
};

const ReporteLotes = ({ navigation }: ReporteLotesProps) => {
	const [estadoLote, setEstadoLote] = useState("");
	const [nombreProyecto, setNombreProyecto] = useState("");
	const [precioDesde, setPrecioDesde] = useState("");
	const [todosLotes, setTodosLotes] = useState<LoteReporteItem[]>([]);
	const [reporte, setReporte] = useState<LoteReporteItem[]>([]);
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

	const cargarLotesIniciales = async () => {
		try {
			setCargando(true);
			setMensaje("");
			const lotesBase = await consultarLotesBase();
			setTodosLotes(lotesBase);
			setReporte(lotesBase);
			setBuscado(false);
			setUltimoFiltro("");
			if (!lotesBase.length) setMensaje("No existen lotes registrados.");
		} catch (error) {
			console.error("Error al cargar lotes registrados:", error);
			setTodosLotes([]);
			setReporte([]);
			setMensaje("No se pudo cargar la lista de lotes.");
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargarLotesIniciales();
	}, []);

	const limpiarFiltro = async () => {
		setEstadoLote("");
		setNombreProyecto("");
		setPrecioDesde("");
		setBuscado(false);
		setMensaje("");
		await cargarLotesIniciales();
	};

	const filtrosTexto = [
		estadoLote.trim() ? `Estado: ${estadoLote.trim()}` : "",
		nombreProyecto.trim() ? `Proyecto: ${nombreProyecto.trim()}` : "",
		precioDesde.trim() ? `Desde: S/ ${precioDesde.trim()}` : "",
	]
		.filter(Boolean)
		.join(" | ");

	const consultarReporte = async () => {
		const hayFiltro = Boolean(estadoLote.trim() || nombreProyecto.trim() || precioDesde.trim());

		if (!hayFiltro) {
			await cargarLotesIniciales();
			return;
		}

		try {
			setCargando(true);
			setMensaje("");
			setUltimoFiltro(filtrosTexto);
			if (fetchControllerRef.current) fetchControllerRef.current.abort();
			fetchControllerRef.current = new AbortController();

			let filtrados: LoteReporteItem[] = [];
			try {
				filtrados = await consultarLotesReporte(
					estadoLote,
					nombreProyecto,
					precioDesde,
					fetchControllerRef.current.signal,
				);
			} catch (error) {
				const base = todosLotes.length ? todosLotes : await consultarLotesBase(fetchControllerRef.current.signal);
				filtrados = filtrarLotesLocal(base, estadoLote, nombreProyecto, precioDesde);
			}

			setReporte(filtrados);
			setBuscado(true);
			if (!filtrados.length) setMensaje("No se encontraron lotes para ese criterio.");
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			console.error("Error al consultar reporte de lotes:", error);
			setReporte([]);
			setBuscado(true);
			setMensaje("No se pudo consultar el reporte de lotes.");
		} finally {
			setCargando(false);
		}
	};

	const horaFormateada = horaActual.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
	const fechaFormateada = horaActual.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
	const loteParaPdf = buscado ? reporte : todosLotes;
	const logoPdfUri = obtenerLogoPdfUri();

	const construirHtmlReporte = () => {
		const numeroDocumento = `RPT-LOT-${horaActual.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
		const logoHtml = logoPdfUri
			? `<img src="${escapeHtml(logoPdfUri)}" style="width: 68px; height: 68px; border-radius: 16px; object-fit: contain; background: white; padding: 8px;" />`
			: `<div style="width:68px;height:68px;border-radius:16px;background:white;color:#0f766e;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;">${EMPRESA_SIGLAS}</div>`;
		const columnasPdf = [
			{ label: "N", width: "6%" },
			{ label: "Codigo", width: "11%" },
			{ label: "Proyecto", width: "17%" },
			{ label: "Mz.", width: "8%" },
			{ label: "Lote", width: "8%" },
			{ label: "m2", width: "10%" },
			{ label: "Precio", width: "17%" },
			{ label: "Estado", width: "13%" },
		];
		const colgroupHtml = columnasPdf.map((columna) => `<col style="width:${columna.width};" />`).join("");
		const encabezadosHtml = columnasPdf
			.map((columna) => `<th style="padding:12px 10px;background:#1d4ed8;color:white;font-size:12px;border:1px solid #d9e6f2;text-align:center;">${escapeHtml(columna.label)}</th>`)
			.join("");
		const filasHtml = loteParaPdf
			.map((item, index) => {
				const fondoFila = index % 2 === 0 ? "#ffffff" : "#f6fbff";
				const celdas = COLUMNAS_REPORTE.map((columna) => {
					const valor = String(item[columna.key] ?? "-");
					return `<td style="border:1px solid #dbe4ea;padding:10px;text-align:center;background:${fondoFila};font-size:12px;color:#0f172a;">${escapeHtml(valor)}</td>`;
				}).join("");
				return `<tr><td style="border:1px solid #dbe4ea;padding:10px;text-align:center;background:${fondoFila};font-weight:700;">${index + 1}</td>${celdas}</tr>`;
			})
			.join("");

		return `<html><head><style>@page{size:A4 landscape;margin:18px 18px 56px 18px;}body{font-family:Arial,sans-serif;color:#0f172a;}table{width:100%;border-collapse:collapse;table-layout:fixed;}td,th{word-break:break-word;overflow-wrap:anywhere;}.footer-wrap{position:fixed;left:24px;right:24px;bottom:8px;display:flex;justify-content:space-between;gap:12px;padding-top:10px;border-top:1px solid #cbd5e1;font-size:10px;color:#475569;}</style></head><body style="padding:24px;"><div style="display:flex;justify-content:space-between;align-items:stretch;margin-bottom:18px;background:linear-gradient(135deg,#0f766e 0%,#164e63 55%,#1e3a8a 100%);border-radius:22px;overflow:hidden;"><div style="display:flex;align-items:center;gap:16px;padding:18px 20px;flex:1;">${logoHtml}<div><p style="margin:0 0 5px;color:#d1fae5;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(EMPRESA_NOMBRE)}</p><h1 style="margin:0;color:white;font-size:26px;">Reporte de Lotes</h1><p style="margin:8px 0 0;color:#dbeafe;font-size:12px;">Documento generado en tiempo real desde lotes registrados.</p></div></div><div style="min-width:230px;background:rgba(255,255,255,0.12);padding:18px 20px;"><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Documento:</strong> ${escapeHtml(numeroDocumento)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Fecha:</strong> ${escapeHtml(fechaFormateada)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Hora:</strong> ${escapeHtml(horaFormateada)}</p><p style="margin:0;color:white;font-size:12px;"><strong>Total:</strong> ${loteParaPdf.length} registros</p></div></div><div style="border:1px solid #dbe4ea;border-radius:18px;overflow:hidden;"><table><colgroup>${colgroupHtml}</colgroup><thead><tr>${encabezadosHtml}</tr></thead><tbody>${filasHtml}</tbody></table></div><div class="footer-wrap"><div><strong>${escapeHtml(EMPRESA_NOMBRE)}</strong> | Reporte interno de lotes. Contacto: ${escapeHtml(EMPRESA_CONTACTO)}</div></div></body></html>`;
	};

	const generarPDF = async () => {
		if (!loteParaPdf.length) {
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
			console.error("Error al generar PDF de lotes:", error);
			Alert.alert("Error", "No se pudo generar el PDF del reporte.");
		}
	};

	const listadoMostrar = buscado ? reporte : todosLotes;
	const esColumnaCorta = (key: keyof LoteReporteItem) =>
		key === "Manzana" || key === "NumeroLote" || key === "Area" || key === "Precio";

	return (
		<View style={styles.container}>
			<View style={styles.backgroundGlowTop} />
			<View style={styles.backgroundGlowBottom} />
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<LinearGradient colors={["#0f766e", "#155e63", "#172554"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
					<View style={styles.headerRow}>
						<TouchableOpacity style={styles.backButtonTouch} onPress={() => navigation.goBack()}>
							{/* ATAMAINE: Boton volver mantiene el patron visual premium de reportes. */}
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
							<Text style={styles.title}>de Lotes</Text>
							<Text style={styles.subtitle}>Consulta lotes por estado, proyecto o precio con datos reales en tiempo real.</Text>
						</View>
					</View>
					<View style={styles.statsRow}>
						<View style={styles.statCard}>
							<Text style={styles.statLabel}>Lotes Registrados</Text>
							{cargando ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.statValue}>{Math.max(todosLotes.length, reporte.length)}</Text>}
							<Text style={styles.statCaption}>Lotes totales</Text>
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
					<Text style={styles.fieldLabel}>Estado del lote:</Text>
					<TextInput value={estadoLote} onChangeText={setEstadoLote} placeholder="Libre, Vendido, En Deuda..." placeholderTextColor="#8ba8ae" style={styles.input} returnKeyType="search" onSubmitEditing={consultarReporte} />
					<Text style={styles.fieldLabel}>Proyecto:</Text>
					<TextInput value={nombreProyecto} onChangeText={setNombreProyecto} placeholder="Nombre del proyecto" placeholderTextColor="#8ba8ae" style={styles.input} returnKeyType="search" onSubmitEditing={consultarReporte} />
					<Text style={styles.fieldLabel}>Precio desde:</Text>
					<TextInput value={precioDesde} onChangeText={setPrecioDesde} placeholder="Ej. 15000" placeholderTextColor="#8ba8ae" style={styles.input} keyboardType="numeric" returnKeyType="search" onSubmitEditing={consultarReporte} />

					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.primaryAction} onPress={consultarReporte}>
							{/* ATAMAINE: Accion principal conectada al reporte real/fallback de lotes. */}
							<LinearGradient colors={["#ffffff", "#edf5ff"]} style={[styles.actionSurface, styles.primaryActionSurface]}>
								<View style={[styles.actionIconBadge, styles.primaryActionBadge]}>
									<MaterialCommunityIcons name="magnify" size={18} color="#2563eb" />
								</View>
								<Text style={styles.primaryActionText}>Buscar</Text>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity style={styles.newAction} onPress={() => navigation.navigate("ListarProyectos")}>
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
						<TouchableOpacity style={[styles.secondaryAction, (!loteParaPdf.length || cargando) && styles.buttonDisabled]} onPress={generarPDF} disabled={!loteParaPdf.length || cargando}>
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
								<View key={index} style={[styles.tableDataRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
									{COLUMNAS_REPORTE.map((columna) => (
										<View key={`${index}-${columna.key}`} style={[styles.tableDataCell, { flex: columna.flex }]}>
											{columna.key === "EstadoLote" ? (
												<View style={[styles.estadoBadge, esEstadoDisponible(String(item.EstadoLote)) ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo]}>
													<Text style={[styles.estadoBadgeText, esEstadoDisponible(String(item.EstadoLote)) ? styles.estadoBadgeTextActivo : styles.estadoBadgeTextInactivo]}>{String(item[columna.key] ?? "-")}</Text>
												</View>
											) : (
												<Text style={[styles.tableDataText, esColumnaCorta(columna.key) ? styles.tableDataTextTight : null]} numberOfLines={2} adjustsFontSizeToFit={esColumnaCorta(columna.key)} minimumFontScale={0.78}>
													{String(item[columna.key] ?? "-")}
												</Text>
											)}
										</View>
									))}
									<View style={styles.tableActionCell}>
										<TouchableOpacity style={styles.verButton} onPress={() => abrirProyectoDelLote(navigation, item)}>
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

export default ReporteLotes;

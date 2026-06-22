import {
	ActivityIndicator,
	Alert,
	Image,
	Keyboard,
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
import { API_URL } from "../../config/apiUrl";
import i18n from "../../i18n";
import styles from "./ReporteAsesorStyles";

type ReporteItem = Record<string, unknown>;

type AsesorReporteItem = {
	IdAsesor: string;
	DNI: string;
	Nombre: string;
	Apellidos: string;
	Celular: string;
	Direccion: string;
	Correo: string;
	Estado: string;
};

type ReporteAsesorProps = { navigation: any };

const EMPRESA_NOMBRE = "Residencial Santa Fe";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "RSF";
const API_BASE_URL = API_URL.replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 15000;

const escapeHtml = (value: unknown) =>
	String(value ?? "-")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

const textoLimpio = (value: unknown, fallback = "-") => {
	const texto = String(value ?? "").trim();
	return texto || fallback;
};

// ATAMAINE: DNI y nombres se comparan sin tildes ni diferencias de mayusculas.
const normalizarBusqueda = (value: unknown) =>
	textoLimpio(value, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const parseReporteResponse = (payload: string): ReporteItem[] => {
	try {
		if (!payload) return [];
		const parsed = JSON.parse(payload);
		if (Array.isArray(parsed)) return parsed as ReporteItem[];
		if (typeof parsed === "string") {
			const nested = JSON.parse(parsed);
			return Array.isArray(nested) ? nested : [];
		}
		if (!parsed || typeof parsed !== "object") return [];

		for (const key of ["d", "Data", "data", "result", "Resultado", "resultados", "Resultados", "Table"]) {
			const value = (parsed as ReporteItem)[key];
			if (Array.isArray(value)) return value as ReporteItem[];
			if (typeof value === "string") {
				const nested = JSON.parse(value);
				if (Array.isArray(nested)) return nested as ReporteItem[];
			}
		}
		return [];
	} catch (error) {
		console.error("Error al parsear reporte de asesores:", error);
		return [];
	}
};

const normalizarEstado = (estado: unknown) => {
	const texto = normalizarBusqueda(estado);
	if (["activo", "a", "1", "true", "vigente", "registrado"].includes(texto)) return "Activo";
	if (["inactivo", "i", "x", "0", "false", "anulado", "borrado", "desactivado"].includes(texto)) return "Inactivo";
	return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "Activo";
};

const normalizarAsesores = (items: ReporteItem[]): AsesorReporteItem[] =>
	items.map((item) => {
		const nombres = [item.Nombre1, item.Nombre2].map((parte) => textoLimpio(parte, "")).filter(Boolean).join(" ");
		const apellidos = [item.Apaterno, item.Amaterno].map((parte) => textoLimpio(parte, "")).filter(Boolean).join(" ");
		const nombreCompleto = textoLimpio(item.NombreCompleto ?? item.Nombre, "");
		const partes = nombreCompleto.split(/\s+/).filter(Boolean);

		return {
			IdAsesor: textoLimpio(item.IdAsesor ?? item.ID ?? item.Id, ""),
			DNI: textoLimpio(item.DNI),
			Nombre: nombres || (partes.length ? partes.slice(0, Math.min(2, partes.length)).join(" ") : "-"),
			Apellidos: apellidos || (partes.length > 2 ? partes.slice(2).join(" ") : textoLimpio(item.Apellidos)),
			Celular: textoLimpio(item.Celular ?? item.Telefono),
			Direccion: textoLimpio(item.Direccion),
			Correo: textoLimpio(item.Correo),
			Estado: normalizarEstado(item.Estado),
		};
	}).filter((asesor, index, lista) =>
		lista.findIndex((otro) => otro.DNI === asesor.DNI) === index,
	);

const esEstadoActivo = (estado: string) => normalizarBusqueda(estado) === "activo";

const filtrarAsesoresLocal = (items: AsesorReporteItem[], filtro: string) => {
	const criterio = normalizarBusqueda(filtro);
	if (!criterio) return items;
	return items.filter((asesor) =>
		asesor.DNI.includes(criterio)
		|| normalizarBusqueda(`${asesor.Nombre} ${asesor.Apellidos}`).includes(criterio)
		|| asesor.Celular.includes(criterio)
		|| normalizarBusqueda(asesor.Correo).includes(criterio),
	);
};

const enriquecerAsesoresReporte = (publicados: AsesorReporteItem[], base: AsesorReporteItem[]) =>
	publicados.map((asesor) => {
		const registrado = base.find((item) => item.DNI === asesor.DNI);
		return registrado ? { ...registrado, ...asesor, IdAsesor: registrado.IdAsesor } : asesor;
	});

const fetchConTimeout = async (url: string, signal?: AbortSignal) => {
	const controller = new AbortController();
	let vencio = false;
	const cancelar = () => controller.abort();
	if (signal?.aborted) cancelar();
	else signal?.addEventListener("abort", cancelar, { once: true });
	const timer = setTimeout(() => { vencio = true; controller.abort(); }, REQUEST_TIMEOUT_MS);

	try {
		return await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
	} catch (error) {
		if (vencio && !signal?.aborted) throw new Error("La API tardo demasiado en responder.");
		throw error;
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener("abort", cancelar);
	}
};

const consultarPrimerEndpoint = async (urls: string[], signal?: AbortSignal) => {
	let ultimoError: Error | null = null;
	for (const url of urls) {
		try {
			const response = await fetchConTimeout(url, signal);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return response.text();
		} catch (error) {
			if ((error as Error).name === "AbortError") throw error;
			ultimoError = error as Error;
		}
	}
	throw ultimoError ?? new Error("Endpoint de asesores no disponible.");
};

const consultarAsesoresBase = async (signal?: AbortSignal) => {
	const payload = await consultarPrimerEndpoint([
		`${API_BASE_URL}/Asesor/asesor_Listar`,
		`${API_BASE_URL}/api/Asesor/asesor_Listar`,
	], signal);
	return normalizarAsesores(parseReporteResponse(payload));
};

const consultarAsesoresReporte = async (filtro: string, signal?: AbortSignal) => {
	const criterio = encodeURIComponent(filtro.trim());
	const payload = await consultarPrimerEndpoint([
		`${API_BASE_URL}/Reporte/reporte_Asesores/${criterio}`,
		`${API_BASE_URL}/api/Reporte/reporte_Asesores/${criterio}`,
	], signal);
	return normalizarAsesores(parseReporteResponse(payload));
};

// ATAMAINE: Ver conserva la sesion y envia el DNI que identifica al asesor real.
const abrirAsesorRegistrado = (navigation: any, item: AsesorReporteItem) => {
	const rutas = navigation.getState?.().routes ?? [];
	const mainTabs = [...rutas].reverse().find((ruta: any) => ruta.name === "MainTabs");
	const sesion = mainTabs?.params ?? {};
	navigation.navigate("MainTabs", {
		...sesion,
		screen: i18n.t("btAsesor"),
		params: {
			idUsuario: sesion.idUsuario,
			nombre: sesion.nombre,
			rol: sesion.rol,
			asesorSeleccionadoDNI: item.DNI,
			asesorSeleccionadoNombre: `${item.Nombre} ${item.Apellidos}`.trim(),
		},
	});
};

const obtenerLogoPdfUri = () => {
	const resolver = (Image as any).resolveAssetSource;
	if (typeof resolver !== "function") return "";
	return resolver(require("../../assets/splash-icon.png"))?.uri || "";
};

const COLUMNAS_REPORTE: Array<{ key: keyof AsesorReporteItem; label: string; flex: number }> = [
	{ key: "DNI", label: "DNI", flex: 0.95 },
	{ key: "Nombre", label: "Nombre", flex: 1.05 },
	{ key: "Apellidos", label: "Apellidos", flex: 1.2 },
	{ key: "Celular", label: "Celular", flex: 1.05 },
	{ key: "Correo", label: "Correo", flex: 1.2 },
	{ key: "Estado", label: "Estado", flex: 0.85 },
];

const ReporteAsesores = ({ navigation }: ReporteAsesorProps) => {
	const [datoBuscar, setDatoBuscar] = useState("");
	const [todosAsesores, setTodosAsesores] = useState<AsesorReporteItem[]>([]);
	const [reporte, setReporte] = useState<AsesorReporteItem[]>([]);
	const [cargando, setCargando] = useState(false);
	const [buscado, setBuscado] = useState(false);
	const [mensaje, setMensaje] = useState("");
	const [ultimoFiltro, setUltimoFiltro] = useState("");
	const [horaActual, setHoraActual] = useState(new Date());
	const fetchControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		// El encabezado no usa segundos; actualizar por minuto evita parpadeos.
		const timer = setInterval(() => setHoraActual(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	const cargarAsesoresIniciales = async () => {
		try {
			setCargando(true);
			setMensaje("");
			fetchControllerRef.current?.abort();
			fetchControllerRef.current = new AbortController();
			const asesores = await consultarAsesoresBase(fetchControllerRef.current.signal);
			setTodosAsesores(asesores);
			setReporte(asesores);
			setBuscado(false);
			setUltimoFiltro("");
			if (!asesores.length) setMensaje("No existen asesores registrados.");
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			console.error("Error al cargar asesores:", error);
			setTodosAsesores([]);
			setReporte([]);
			setMensaje("No se pudo cargar la lista de asesores.");
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		void cargarAsesoresIniciales();
		return () => fetchControllerRef.current?.abort();
	}, []);

	const aplicarFiltroLocal = (value: string) => {
		const filtrados = filtrarAsesoresLocal(todosAsesores, value);
		setReporte(filtrados);
		setBuscado(Boolean(value.trim()));
		setUltimoFiltro(value.trim());
		setMensaje(value.trim() && !filtrados.length ? "No se encontraron asesores para ese criterio." : "");
	};

	const cambiarBusqueda = (value: string) => {
		const limpio = value.replace(/[^0-9a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").slice(0, 60);
		setDatoBuscar(limpio);
		// Escribir filtra de inmediato sin generar una peticion por cada tecla.
		aplicarFiltroLocal(limpio);
	};

	const consultarReporte = async () => {
		const filtro = datoBuscar.trim();
		Keyboard.dismiss();
		if (!filtro) {
			await cargarAsesoresIniciales();
			return;
		}

		try {
			setCargando(true);
			setMensaje("");
			setUltimoFiltro(filtro);
			fetchControllerRef.current?.abort();
			fetchControllerRef.current = new AbortController();
			const base = todosAsesores.length ? todosAsesores : await consultarAsesoresBase(fetchControllerRef.current.signal);
			let publicados: AsesorReporteItem[] = [];
			try {
				publicados = await consultarAsesoresReporte(filtro, fetchControllerRef.current.signal);
			} catch (error) {
				if ((error as Error).name === "AbortError") throw error;
			}
			const enriquecidos = enriquecerAsesoresReporte(publicados, base);
			const filtradosApi = filtrarAsesoresLocal(enriquecidos, filtro);
			const respaldo = filtrarAsesoresLocal(base, filtro);
			const resultado = filtradosApi.length ? filtradosApi : respaldo;
			setTodosAsesores(base);
			setReporte(resultado);
			setBuscado(true);
			if (!resultado.length) setMensaje("No se encontraron asesores para ese criterio.");
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			console.error("Error al consultar reporte de asesores:", error);
			setReporte([]);
			setBuscado(true);
			setMensaje("No se pudo consultar el reporte de asesores.");
		} finally {
			setCargando(false);
		}
	};

	const limpiarFiltro = async () => {
		setDatoBuscar("");
		Keyboard.dismiss();
		await cargarAsesoresIniciales();
	};

	const listadoMostrar = buscado ? reporte : todosAsesores;
	const asesoresActivos = listadoMostrar.filter((asesor) => esEstadoActivo(asesor.Estado)).length;
	const asesoresInactivos = listadoMostrar.length - asesoresActivos;
	const horaFormateada = horaActual.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
	const fechaFormateada = horaActual.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
	const logoPdfUri = obtenerLogoPdfUri();

	const construirHtmlReporte = () => {
		const numeroDocumento = `RPT-ASR-${horaActual.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
		const logoHtml = logoPdfUri
			? `<img src="${escapeHtml(logoPdfUri)}" style="width:68px;height:68px;border-radius:16px;object-fit:contain;background:white;padding:8px;" />`
			: `<div style="width:68px;height:68px;border-radius:16px;background:white;color:#0f766e;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;">${EMPRESA_SIGLAS}</div>`;
		const filas = listadoMostrar.map((item, index) => {
			const fondo = index % 2 === 0 ? "#ffffff" : "#f6fbff";
			const activo = esEstadoActivo(item.Estado);
			const valores = [item.DNI, item.Nombre, item.Apellidos, item.Celular, item.Correo];
			const celdas = valores.map((valor) => `<td style="border:1px solid #dbe4ea;padding:10px;text-align:center;background:${fondo};font-size:12px;">${escapeHtml(valor)}</td>`).join("");
			return `<tr><td style="border:1px solid #dbe4ea;padding:10px;text-align:center;background:${fondo};font-weight:700;">${index + 1}</td>${celdas}<td style="border:1px solid #dbe4ea;padding:10px;text-align:center;background:${fondo};"><span style="padding:6px 10px;border-radius:999px;color:${activo ? "#15803d" : "#be123c"};background:${activo ? "#ecfdf3" : "#fff1f2"};border:1px solid ${activo ? "#86efac" : "#fda4af"};font-weight:700;">${escapeHtml(item.Estado)}</span></td></tr>`;
		}).join("");

		return `<html><head><style>@page{size:A4 landscape;margin:18px 18px 56px 18px;}body{font-family:Arial,sans-serif;color:#0f172a;}table{width:100%;border-collapse:collapse;table-layout:fixed;}td,th{word-break:break-word;overflow-wrap:anywhere;}.footer{position:fixed;left:24px;right:24px;bottom:8px;padding-top:10px;border-top:1px solid #cbd5e1;font-size:10px;color:#475569;}</style></head><body style="padding:24px;"><div style="display:flex;justify-content:space-between;align-items:stretch;margin-bottom:18px;background:linear-gradient(135deg,#0f766e,#164e63 55%,#1e3a8a);border-radius:22px;overflow:hidden;"><div style="display:flex;align-items:center;gap:16px;padding:18px 20px;flex:1;">${logoHtml}<div><p style="margin:0 0 5px;color:#d1fae5;font-size:11px;font-weight:700;">${EMPRESA_NOMBRE}</p><h1 style="margin:0;color:white;font-size:26px;">Reporte de Asesores</h1><p style="margin:8px 0 0;color:#dbeafe;font-size:12px;">Datos reales de asesores registrados.</p></div></div><div style="min-width:230px;background:rgba(255,255,255,.12);padding:18px 20px;color:white;font-size:12px;"><p><strong>Documento:</strong> ${numeroDocumento}</p><p><strong>Fecha:</strong> ${fechaFormateada}</p><p><strong>Hora:</strong> ${horaFormateada}</p><p><strong>Filtro:</strong> ${escapeHtml(ultimoFiltro || "Todos")}</p><p><strong>Total:</strong> ${listadoMostrar.length}</p></div></div><table><thead><tr>${["N", "DNI", "Nombre", "Apellidos", "Celular", "Correo", "Estado"].map((label) => `<th style="padding:12px 8px;background:#1d4ed8;color:white;border:1px solid #d9e6f2;">${label}</th>`).join("")}</tr></thead><tbody>${filas}</tbody></table><div class="footer"><strong>${EMPRESA_NOMBRE}</strong> | Reporte interno de asesores. Contacto: ${EMPRESA_CONTACTO}</div></body></html>`;
	};

	const generarPDF = async () => {
		if (!listadoMostrar.length) {
			Alert.alert("Aviso", "No hay asesores para exportar.");
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
			console.error("Error al generar PDF de asesores:", error);
			Alert.alert("Error", "No se pudo generar el PDF del reporte.");
		}
	};

	const esColumnaCorta = (key: keyof AsesorReporteItem) => key === "DNI" || key === "Celular";

	return (
		<View style={styles.container}>
			<View style={styles.backgroundGlowTop} />
			<View style={styles.backgroundGlowBottom} />
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
				<LinearGradient colors={["#061b2b", "#064e5a", "#0f766e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
					<View style={styles.heroToolbar}>
						<TouchableOpacity style={styles.menuButton} onPress={() => navigation.goBack()} accessibilityLabel="Regresar"><MaterialCommunityIcons name="arrow-left" size={16} color="#ffffff" />{Platform.OS === "web" ? <Text style={styles.backButtonText}>Regresar</Text> : null}</TouchableOpacity>
						<View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveBadgeText}>Tiempo real {horaFormateada}</Text></View>
						<View style={styles.dateCard}><View style={styles.dateLine}><MaterialCommunityIcons name="calendar-month-outline" size={11} color="#bfdbfe" /><Text style={styles.dateText}>{fechaFormateada}</Text></View><View style={styles.dateLine}><MaterialCommunityIcons name="clock-outline" size={11} color="#bfdbfe" /><Text style={styles.dateText}>{horaFormateada}</Text></View></View>
					</View>
					<View style={styles.heroMainRow}>
						<View style={styles.heroContent}><Text style={styles.title}>Gestion Integral</Text><Text style={styles.title}>de Asesores</Text><Text style={styles.subtitle}>Consulta asesores por DNI o nombre usando datos reales de la API.</Text></View>
						<View style={styles.peopleScene}><View style={[styles.personBubble, styles.personBubbleBlue]}><MaterialCommunityIcons name="badge-account-outline" size={17} color="#ffffff" /></View><View style={[styles.personBubble, styles.personBubbleGreen]}><MaterialCommunityIcons name="account-check-outline" size={17} color="#ffffff" /></View><View style={[styles.personBubble, styles.personBubblePurple]}><MaterialCommunityIcons name="briefcase-account-outline" size={17} color="#ffffff" /></View><View style={styles.peopleBase} /></View>
					</View>
					<View style={styles.statsGrid}>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#dbeafe" }]}><MaterialCommunityIcons name="badge-account-horizontal-outline" size={13} color="#2563eb" /></View><Text style={styles.statLabel}>Asesores</Text>{cargando ? <ActivityIndicator size="small" color="#2563eb" style={styles.statLoader} /> : <Text selectable style={styles.statValue}>{listadoMostrar.length}</Text>}<Text style={styles.statCaption}>Resultados</Text><View style={[styles.statAccentLine, { backgroundColor: "#2563eb" }]} /></View>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#d1fae5" }]}><MaterialCommunityIcons name="account-check-outline" size={13} color="#059669" /></View><Text style={styles.statLabel}>Activos</Text><Text selectable style={styles.statValue}>{asesoresActivos}</Text><Text style={styles.statCaption}>Habilitados</Text><View style={[styles.statAccentLine, { backgroundColor: "#10b981" }]} /></View>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#ffe4e6" }]}><MaterialCommunityIcons name="account-cancel-outline" size={13} color="#e11d48" /></View><Text style={styles.statLabel}>Inactivos</Text><Text selectable style={styles.statValue}>{asesoresInactivos}</Text><Text style={styles.statCaption}>Deshabilitados</Text><View style={[styles.statAccentLine, { backgroundColor: "#f43f5e" }]} /></View>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#f3e8ff" }]}><MaterialCommunityIcons name="magnify" size={13} color="#7c3aed" /></View><Text style={styles.statLabel}>Busqueda</Text><Text selectable style={[styles.statValue, styles.statValueText]} numberOfLines={2}>{ultimoFiltro || "Sin filtro"}</Text><Text style={styles.statCaption}>Consulta actual</Text><View style={[styles.statAccentLine, { backgroundColor: "#8b5cf6" }]} /></View>
					</View>
				</LinearGradient>

				<View style={styles.searchCard}>
					<Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
					<Text style={styles.fieldLabel}>DNI o nombre del asesor</Text>
					<View style={styles.inputShell}><MaterialCommunityIcons name="account-search-outline" size={16} color="#8aa0b5" /><TextInput value={datoBuscar} onChangeText={cambiarBusqueda} placeholder="Escribe DNI o nombre" placeholderTextColor="#91a3b6" style={styles.input} returnKeyType="search" autoCorrect={false} onSubmitEditing={() => void consultarReporte()} />{datoBuscar ? <TouchableOpacity onPress={() => cambiarBusqueda("")}><MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}</View>
					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.actionButton} onPress={() => void consultarReporte()}><LinearGradient colors={["#1f75ff", "#0657d9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="magnify" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Buscar</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("RegistrarAsesor", { onRefresh: cargarAsesoresIniciales })}><LinearGradient colors={["#0f9f73", "#047857"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="account-plus-outline" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Nuevo</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={() => void limpiarFiltro()}><LinearGradient colors={["#6b7280", "#475569"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="trash-can-outline" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Limpiar</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={[styles.actionButton, (!listadoMostrar.length || cargando) && styles.buttonDisabled]} onPress={generarPDF} disabled={!listadoMostrar.length || cargando}><LinearGradient colors={["#f59e0b", "#f97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="file-pdf-box" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>PDF</Text></LinearGradient></TouchableOpacity>
					</View>
				</View>

				<View style={styles.contentCard}>
					<View style={styles.contentTitleRow}><MaterialCommunityIcons name="account-details-outline" size={18} color="#2563eb" /><Text style={styles.contentTitle}>Listado del Reporte</Text></View>
					{cargando ? <ActivityIndicator size="large" color="#2563eb" style={styles.loader} /> : null}
					{!cargando && mensaje ? <View style={styles.messageBox}><Text selectable style={styles.messageText}>{mensaje}</Text></View> : null}
					{!cargando && buscado && listadoMostrar.length > 0 ? <Text selectable style={styles.resultCounter}>Mostrando {listadoMostrar.length} resultado{listadoMostrar.length === 1 ? "" : "s"} para: {ultimoFiltro}</Text> : null}
					{!cargando && listadoMostrar.length === 0 && !mensaje ? <View style={styles.emptyState}><View style={styles.emptyIconWrap}><MaterialCommunityIcons name="account-search-outline" size={28} color="#0f766e" /></View><Text style={styles.emptyTitle}>Sin asesores</Text><Text selectable style={styles.emptyText}>No se encontraron asesores para el criterio ingresado.</Text></View> : null}
					{!cargando && listadoMostrar.length > 0 ? <View style={styles.tableWrapper}>
						<LinearGradient colors={["#0f2f89", "#184ec8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tableHeaderRow}>{COLUMNAS_REPORTE.map((columna) => <View key={columna.key} style={[styles.tableHeaderCell, { flex: columna.flex }]}><Text style={styles.tableHeaderText}>{columna.label}</Text></View>)}<View style={styles.tableActionHeaderCell}><Text style={styles.tableHeaderText}>Ver</Text></View></LinearGradient>
						{listadoMostrar.map((item, index) => <View key={`${item.DNI}-${index}`} style={[styles.tableDataRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>{COLUMNAS_REPORTE.map((columna) => <View key={`${index}-${columna.key}`} style={[styles.tableDataCell, { flex: columna.flex }]}>{columna.key === "Estado" ? <View style={[styles.estadoBadge, esEstadoActivo(item.Estado) ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo]}><Text selectable style={[styles.estadoBadgeText, esEstadoActivo(item.Estado) ? styles.estadoBadgeTextActivo : styles.estadoBadgeTextInactivo]}>{item.Estado}</Text></View> : <Text selectable style={[styles.tableDataText, esColumnaCorta(columna.key) ? styles.tableDataTextTight : null]} numberOfLines={2} adjustsFontSizeToFit={esColumnaCorta(columna.key)} minimumFontScale={0.78}>{String(item[columna.key] ?? "-")}</Text>}</View>)}<View style={styles.tableActionCell}><TouchableOpacity style={styles.verButton} onPress={() => abrirAsesorRegistrado(navigation, item)} accessibilityLabel={`Ver asesor ${item.Nombre}`}><MaterialCommunityIcons name="eye-outline" size={14} color="#0f766e" /></TouchableOpacity></View></View>)}
					</View> : null}
				</View>
			</ScrollView>
		</View>
	);
};

export default ReporteAsesores;

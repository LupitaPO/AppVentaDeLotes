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
import i18n from "../i18n";
import styles from "./ReportePagosStyles";

type ReporteItem = Record<string, unknown>;
type FuentePagos = "principal" | "respaldo";
type EndpointPagos = { url: string; fuente: FuentePagos };

type PagoReporteItem = {
	IdPago: string;
	IdVenta: string;
	Cliente: string;
	FechaPago: string;
	Monto: string;
	Cuota: string;
	EstadoPago: string;
};

type ReportePagosProps = {
	navigation: any;
};

const EMPRESA_NOMBRE = "Residencial Santa Fe";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "RSF";
const API_BASE_URL = API_URL.replace(/\/+$/, "");
const ESTADOS_PAGO_RESPALDO = ["Al Dia", "Retrasado", "Pagado", "Pendiente"];

const escapeHtml = (value: unknown) =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

const textoLimpio = (value: unknown, fallback = "-") => {
	const texto = String(value ?? "").trim();
	return texto || fallback;
};

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

		const keys = ["d", "Data", "data", "result", "Resultado", "resultados", "Resultados"];
		for (const key of keys) {
			const value = (parsed as Record<string, unknown>)[key];
			if (Array.isArray(value)) return value as ReporteItem[];
			if (typeof value === "string") {
				const nested = JSON.parse(value);
				if (Array.isArray(nested)) return nested as ReporteItem[];
			}
		}

		return [];
	} catch {
		return [];
	}
};

const obtenerValor = (item: ReporteItem, keys: string[]) => {
	for (const key of keys) {
		const value = item[key];
		if (value !== undefined && value !== null && String(value).trim() !== "") return value;
	}
	return undefined;
};

const consultarPrimerEndpointDisponible = async (endpoints: EndpointPagos[], signal?: AbortSignal) => {
	let ultimoError: Error | null = null;

	for (const endpoint of endpoints) {
		try {
			const response = await fetch(endpoint.url, { signal });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return { payload: await response.text(), fuente: endpoint.fuente };
		} catch (error) {
			if ((error as Error).name === "AbortError") throw error;
			ultimoError = error as Error;
		}
	}

	throw ultimoError ?? new Error("Endpoint no disponible");
};

const construirQueryPagos = (estadoPago: string, idVenta: string, fechaDesde: string, fechaHasta: string) => {
	const params = new URLSearchParams();
	if (estadoPago.trim()) params.append("estadoPago", estadoPago.trim());
	if (idVenta.trim()) params.append("idVenta", idVenta.trim());
	if (fechaDesde.trim()) params.append("fechaDesde", fechaDesde.trim());
	if (fechaHasta.trim()) params.append("fechaHasta", fechaHasta.trim());
	return params.toString();
};

const construirUrlsPagos = (estadoPago: string, idVenta: string, fechaDesde: string, fechaHasta: string): EndpointPagos[] => {
	const query = construirQueryPagos(estadoPago, idVenta, fechaDesde, fechaHasta);
	const fechaDesdeRespaldo = fechaDesde.trim() || "1900-01-01";
	const fechaHastaRespaldo = fechaHasta.trim() || new Date().toISOString().slice(0, 10);
	return [
		{ url: `${API_BASE_URL}/Reporte/reporte_Pagos${query ? `?${query}` : ""}`, fuente: "principal" },
		{ url: `${API_BASE_URL}/api/Reporte/reporte_Pagos${query ? `?${query}` : ""}`, fuente: "principal" },
		{ url: `${API_BASE_URL}/Reporte/reporte_PagosRealizados/${encodeURIComponent(fechaDesdeRespaldo)}/${encodeURIComponent(fechaHastaRespaldo)}`, fuente: "respaldo" },
		{ url: `${API_BASE_URL}/api/Reporte/reporte_PagosRealizados/${encodeURIComponent(fechaDesdeRespaldo)}/${encodeURIComponent(fechaHastaRespaldo)}`, fuente: "respaldo" },
	];
};

const normalizarEstadoPago = (estado: unknown) => {
	const original = String(estado ?? "").trim();
	const texto = original.toLowerCase();
	if (!texto) return "-";
	const correcto = ["al dia", "al dia", "al día", "aldia"];
	const pagados = ["pagado", "pago", "cancelado", "completado", "realizado", "a", "1", "true"];
	const pendientes = ["pendiente", "por pagar", "programado", "p", "0", "false"];
	const vencidos = ["vencido", "en mora", "mora", "atrasado", "retrasado"];
	const anulados = ["anulado", "inactivo", "x", "desactivado"];

	if (correcto.includes(texto)) return "Al Dia";
	if (pagados.includes(texto)) return "Pagado";
	if (pendientes.includes(texto)) return "Pendiente";
	if (texto === "retrasado") return "Retrasado";
	if (vencidos.includes(texto)) return "Vencido";
	if (anulados.includes(texto)) return "Anulado";
	return original;
};

const formatoMoneda = (value: unknown) => {
	const numero = Number(String(value ?? "0").replace(/[^\d.-]/g, ""));
	if (!Number.isFinite(numero)) return "S/ 0.00";
	return `S/ ${numero.toFixed(2)}`;
};

const formatoFecha = (value: unknown) => {
	const texto = String(value ?? "").trim();
	if (!texto) return "-";
	const fecha = new Date(texto);
	if (Number.isNaN(fecha.getTime())) return texto.slice(0, 10);
	return fecha.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const normalizarPagos = (items: ReporteItem[]): PagoReporteItem[] =>
	items.map((item) => {
		const serie = textoLimpio(obtenerValor(item, ["Serie", "serie"]), "");
		const numero = textoLimpio(obtenerValor(item, ["Numero", "NroComprobante", "NumeroComprobante"]), "");
		const comprobante = [serie, numero].filter(Boolean).join("-");
		const venta = obtenerValor(item, [
			"IdVenta",
			"IDVenta",
			"VentaId",
			"idVenta",
			"Venta",
			"NroVenta",
			"NumeroVenta",
			"CodigoVenta",
			"CodigoLote",
			"CodLote",
			"Lote",
			"Codigo",
		]);
		const estadoApi = obtenerValor(item, [
			"EstadoPago",
			"estadoPago",
			"Estado",
			"estado",
			"EstadoVenta",
			"EstadoCuota",
			"EstadoCronograma",
			"EstadoPagoNombre",
			"NombreEstadoPago",
		]);
		return {
			IdPago: textoLimpio(obtenerValor(item, ["IdPago", "Idpago", "IDPago", "Id", "ID"])),
			IdVenta: textoLimpio(venta, comprobante || "-"),
			Cliente: textoLimpio(obtenerValor(item, ["Cliente", "NombreCliente", "NombreCompleto", "DNI", "DocumentoCliente", "RazonSocial"]), comprobante || "-"),
			FechaPago: formatoFecha(obtenerValor(item, ["FechaPago", "Fecha", "FechaRegistro", "FechaEmision"])),
			Monto: formatoMoneda(obtenerValor(item, ["Monto", "MontoPago", "Importe", "Total", "TotalPago"])),
			Cuota: textoLimpio(obtenerValor(item, ["NumeroCuota", "Cuota", "NroCuota", "IdCronograma"])),
			EstadoPago: normalizarEstadoPago(estadoApi),
		};
	});

const contieneTexto = (value: string, filtro: string) =>
	!filtro.trim() || value.trim().toLowerCase().includes(filtro.trim().toLowerCase());

const estaEnRangoFecha = (fechaTexto: string, fechaDesde: string, fechaHasta: string) => {
	if (!fechaDesde.trim() && !fechaHasta.trim()) return true;
	const fecha = new Date(fechaTexto.split("/").reverse().join("-"));
	if (Number.isNaN(fecha.getTime())) return true;
	if (fechaDesde.trim() && fecha < new Date(fechaDesde.trim())) return false;
	if (fechaHasta.trim() && fecha > new Date(fechaHasta.trim())) return false;
	return true;
};

const filtrarPagosLocal = (items: PagoReporteItem[], estadoPago: string, idVenta: string, fechaDesde: string, fechaHasta: string) =>
	items.filter((item) => {
		const coincideEstado = contieneTexto(item.EstadoPago, estadoPago);
		const coincideVenta = !idVenta.trim() || item.IdVenta.trim() === idVenta.trim();
		const coincideFecha = estaEnRangoFecha(item.FechaPago, fechaDesde, fechaHasta);
		return coincideEstado && coincideVenta && coincideFecha;
	});

const consultarPagos = async (estadoPago: string, idVenta: string, fechaDesde: string, fechaHasta: string, signal?: AbortSignal) => {
	const respuesta = await consultarPrimerEndpointDisponible(construirUrlsPagos(estadoPago, idVenta, fechaDesde, fechaHasta), signal);
	const pagos = normalizarPagos(parseReporteResponse(respuesta.payload));
	return {
		fuente: respuesta.fuente,
		pagos: filtrarPagosLocal(pagos, estadoPago, idVenta, fechaDesde, fechaHasta),
	};
};

const obtenerEstadosDesdePagos = (items: PagoReporteItem[]) => {
	const estados = new Map<string, string>();
	items.forEach((item) => {
		const estado = normalizarEstadoPago(item.EstadoPago);
		if (estado && estado !== "-") estados.set(estado.toLowerCase(), estado);
	});
	return estados.size ? Array.from(estados.values()) : ESTADOS_PAGO_RESPALDO;
};

const esEstadoPagado = (estado: string) => ["pagado", "al dia", "al día"].includes(estado.trim().toLowerCase());

const COLUMNAS_REPORTE: Array<{ key: keyof PagoReporteItem; label: string; flex: number }> = [
	{ key: "IdPago", label: "ID", flex: 0.55 },
	{ key: "IdVenta", label: "Venta", flex: 0.7 },
	{ key: "Cliente", label: "Cliente", flex: 1.1 },
	{ key: "FechaPago", label: "Fecha", flex: 0.95 },
	{ key: "Monto", label: "Monto", flex: 0.9 },
	{ key: "Cuota", label: "Cuota", flex: 0.72 },
	{ key: "EstadoPago", label: "Estado", flex: 0.88 },
];

const obtenerLogoPdfUri = () => {
	const resolver = (Image as any).resolveAssetSource;
	if (typeof resolver !== "function") return "";
	return resolver(require("../assets/splash-icon.png"))?.uri || "";
};

const abrirVentas = (navigation: any) => {
	navigation.navigate("MainTabs", { screen: i18n.t("btVentas") });
};

const ReportePagos = ({ navigation }: ReportePagosProps) => {
	const [estadoPago, setEstadoPago] = useState("");
	const [estadosPago, setEstadosPago] = useState<string[]>(ESTADOS_PAGO_RESPALDO);
	const [mostrarEstadosPago, setMostrarEstadosPago] = useState(false);
	const [cargandoEstadosPago, setCargandoEstadosPago] = useState(false);
	const [idVenta, setIdVenta] = useState("");
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");
	const [todosPagos, setTodosPagos] = useState<PagoReporteItem[]>([]);
	const [reporte, setReporte] = useState<PagoReporteItem[]>([]);
	const [cargando, setCargando] = useState(false);
	const [buscado, setBuscado] = useState(false);
	const [mensaje, setMensaje] = useState("");
	const [ultimoFiltro, setUltimoFiltro] = useState("");
	const [horaActual, setHoraActual] = useState(new Date());
	const fetchControllerRef = useRef<AbortController | null>(null);
	const debounceTimerRef = useRef<any>(null);
	const primeraCargaRef = useRef(true);

	const horaFormateada = horaActual.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
	const fechaFormateada = horaActual.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
	const logoPdfUri = obtenerLogoPdfUri();
	const pagosParaPdf = buscado ? reporte : todosPagos;

	const cargarPagos = async (
		forzarFiltros = false,
		filtros?: { estadoPago: string; idVenta: string; fechaDesde: string; fechaHasta: string },
	) => {
		const filtroEstado = filtros?.estadoPago ?? estadoPago;
		const filtroVenta = filtros?.idVenta ?? idVenta;
		const filtroDesde = filtros?.fechaDesde ?? fechaDesde;
		const filtroHasta = filtros?.fechaHasta ?? fechaHasta;
		const hayFiltro = Boolean(filtroEstado.trim() || filtroVenta.trim() || filtroDesde.trim() || filtroHasta.trim());
		const usarFiltros = forzarFiltros || hayFiltro;
		const filtrosResumen = [
			filtroEstado.trim() ? `Estado: ${filtroEstado.trim()}` : "",
			filtroVenta.trim() ? `Venta: ${filtroVenta.trim()}` : "",
			filtroDesde.trim() ? `Desde: ${filtroDesde.trim()}` : "",
			filtroHasta.trim() ? `Hasta: ${filtroHasta.trim()}` : "",
		]
			.filter(Boolean)
			.join(" | ");

		try {
			setCargando(true);
			setMensaje("");
			if (fetchControllerRef.current) fetchControllerRef.current.abort();
			fetchControllerRef.current = new AbortController();

			const resultado = await consultarPagos(
				usarFiltros ? filtroEstado : "",
				usarFiltros ? filtroVenta : "",
				usarFiltros ? filtroDesde : "",
				usarFiltros ? filtroHasta : "",
				fetchControllerRef.current.signal,
			);
			const pagos = resultado.pagos;
			const usaRespaldo = resultado.fuente === "respaldo";

			if (usarFiltros) {
				setReporte(pagos);
				setBuscado(true);
				setUltimoFiltro(filtrosResumen || "Filtro aplicado");
				if (!pagos.length) setMensaje("No se encontraron pagos para ese criterio.");
			} else {
				setTodosPagos(pagos);
				setReporte(pagos);
				setBuscado(false);
				setUltimoFiltro("");
				if (!pagos.length) setMensaje("No existen pagos registrados.");
			}
			if (usaRespaldo && pagos.length) {
				setMensaje("Mostrando pagos publicados. Publica reporte_Pagos para ver IdVenta y EstadoPago reales.");
			}
			setEstadosPago(obtenerEstadosDesdePagos(pagos));
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			// ATAMAINE: Si la API publicada aun no tiene reporte_Pagos, evitamos ruido rojo y mostramos estado controlado.
			setReporte([]);
			if (!buscado) setTodosPagos([]);
			setMensaje("No se pudo cargar el reporte de pagos.");
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		const timer = setInterval(() => setHoraActual(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		void cargarPagos(false);
		return () => {
			if (fetchControllerRef.current) fetchControllerRef.current.abort();
		};
	}, []);

	useEffect(() => {
		if (primeraCargaRef.current) {
			primeraCargaRef.current = false;
			return;
		}
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		debounceTimerRef.current = setTimeout(() => {
			void cargarPagos(false);
		}, 700);
		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		};
	}, [estadoPago, idVenta, fechaDesde, fechaHasta]);

	useEffect(() => {
		const interval = setInterval(() => {
			void cargarPagos(Boolean(estadoPago.trim() || idVenta.trim() || fechaDesde.trim() || fechaHasta.trim()));
		}, 15000);
		return () => clearInterval(interval);
	}, [estadoPago, idVenta, fechaDesde, fechaHasta]);

	const refrescarEstadosPago = async () => {
		try {
			setCargandoEstadosPago(true);
			const resultado = await consultarPagos("", "", "", "");
			setEstadosPago(obtenerEstadosDesdePagos(resultado.pagos));
		} catch (error) {
			setEstadosPago((actuales) => (actuales.length ? actuales : ESTADOS_PAGO_RESPALDO));
		} finally {
			setCargandoEstadosPago(false);
		}
	};

	const limpiarFiltro = async () => {
		setEstadoPago("");
		setMostrarEstadosPago(false);
		setIdVenta("");
		setFechaDesde("");
		setFechaHasta("");
		setBuscado(false);
		setUltimoFiltro("");
		setMensaje("");
		await cargarPagos(false, { estadoPago: "", idVenta: "", fechaDesde: "", fechaHasta: "" });
	};

	const construirHtmlReporte = () => {
		const numeroDocumento = `RPT-PAG-${horaActual.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
		const logoHtml = logoPdfUri
			? `<img src="${escapeHtml(logoPdfUri)}" style="width:68px;height:68px;border-radius:16px;object-fit:contain;background:white;padding:8px;" />`
			: `<div style="width:68px;height:68px;border-radius:16px;background:white;color:#0f766e;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;">${EMPRESA_SIGLAS}</div>`;
		const columnasPdf = [
			{ label: "N", width: "6%" },
			{ label: "ID", width: "8%" },
			{ label: "Venta", width: "9%" },
			{ label: "Cliente", width: "23%" },
			{ label: "Fecha", width: "14%" },
			{ label: "Monto", width: "14%" },
			{ label: "Cuota", width: "10%" },
			{ label: "Estado", width: "16%" },
		];
		const colgroupHtml = columnasPdf.map((columna) => `<col style="width:${columna.width};" />`).join("");
		const encabezadosHtml = columnasPdf
			.map((columna) => `<th style="padding:12px 10px;background:#1d4ed8;color:white;font-size:12px;border:1px solid #d9e6f2;text-align:center;">${escapeHtml(columna.label)}</th>`)
			.join("");
		const filasHtml = pagosParaPdf
			.map((item, index) => {
				const fondoFila = index % 2 === 0 ? "#ffffff" : "#f6fbff";
				const estadoColor = esEstadoPagado(item.EstadoPago) ? "#15803d" : "#be123c";
				const estadoBg = esEstadoPagado(item.EstadoPago) ? "#ecfdf3" : "#fff1f2";
				const celdas = [
					item.IdPago,
					item.IdVenta,
					item.Cliente,
					item.FechaPago,
					item.Monto,
					item.Cuota,
					`<span style="display:inline-block;padding:6px 10px;border-radius:999px;color:${estadoColor};background:${estadoBg};border:1px solid ${esEstadoPagado(item.EstadoPago) ? "#86efac" : "#fda4af"};font-weight:700;">${escapeHtml(item.EstadoPago)}</span>`,
				]
					.map((valor, cellIndex) => `<td style="border:1px solid #dbe4ea;padding:10px;text-align:center;background:${fondoFila};font-size:12px;color:#0f172a;">${cellIndex === 6 ? valor : escapeHtml(valor)}</td>`)
					.join("");
				return `<tr><td style="border:1px solid #dbe4ea;padding:10px;text-align:center;background:${fondoFila};font-weight:700;">${index + 1}</td>${celdas}</tr>`;
			})
			.join("");

		return `<html><head><style>@page{size:A4 landscape;margin:18px 18px 56px 18px;}body{font-family:Arial,sans-serif;color:#0f172a;}table{width:100%;border-collapse:collapse;table-layout:fixed;}td,th{word-break:break-word;overflow-wrap:anywhere;}.footer-wrap{position:fixed;left:24px;right:24px;bottom:8px;display:flex;justify-content:space-between;gap:12px;padding-top:10px;border-top:1px solid #cbd5e1;font-size:10px;color:#475569;}</style></head><body style="padding:24px;"><div style="display:flex;justify-content:space-between;align-items:stretch;margin-bottom:18px;background:linear-gradient(135deg,#0f766e 0%,#164e63 55%,#1e3a8a 100%);border-radius:22px;overflow:hidden;"><div style="display:flex;align-items:center;gap:16px;padding:18px 20px;flex:1;">${logoHtml}<div><p style="margin:0 0 5px;color:#d1fae5;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(EMPRESA_NOMBRE)}</p><h1 style="margin:0;color:white;font-size:26px;">Reporte de Pagos</h1><p style="margin:8px 0 0;color:#dbeafe;font-size:12px;">Documento generado en tiempo real desde pagos registrados.</p></div></div><div style="min-width:230px;background:rgba(255,255,255,0.12);padding:18px 20px;"><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Documento:</strong> ${escapeHtml(numeroDocumento)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Fecha:</strong> ${escapeHtml(fechaFormateada)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Hora:</strong> ${escapeHtml(horaFormateada)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Filtro:</strong> ${escapeHtml(ultimoFiltro || "Todos los pagos")}</p><p style="margin:0;color:white;font-size:12px;"><strong>Total:</strong> ${pagosParaPdf.length} registros</p></div></div><div style="border:1px solid #dbe4ea;border-radius:18px;overflow:hidden;"><table><colgroup>${colgroupHtml}</colgroup><thead><tr>${encabezadosHtml}</tr></thead><tbody>${filasHtml}</tbody></table></div><div class="footer-wrap"><div><strong>${escapeHtml(EMPRESA_NOMBRE)}</strong> | Reporte interno de pagos. Contacto: ${escapeHtml(EMPRESA_CONTACTO)}</div></div></body></html>`;
	};

	const generarPDF = async () => {
		if (!pagosParaPdf.length) {
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
			console.error("Error al generar PDF de pagos:", error);
			Alert.alert("Error", "No se pudo generar el PDF del reporte.");
		}
	};

	const listadoMostrar = buscado ? reporte : todosPagos;
	const esColumnaCorta = (key: keyof PagoReporteItem) => key === "IdPago" || key === "IdVenta" || key === "Monto" || key === "Cuota";

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
							<Text style={styles.title}>de Pagos</Text>
							<Text style={styles.subtitle}>Consulta pagos por estado, venta y rango de fechas con datos reales.</Text>
						</View>
					</View>
					<View style={styles.statsRow}>
						<View style={styles.statCard}>
							<Text style={styles.statLabel}>Pagos Registrados</Text>
							{cargando ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.statValue}>{Math.max(todosPagos.length, reporte.length)}</Text>}
							<Text style={styles.statCaption}>Pagos totales</Text>
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
					<Text style={styles.fieldLabel}>Estado pago:</Text>
					<View style={styles.estadoSelectWrap}>
						<TouchableOpacity
							activeOpacity={0.84}
							style={[styles.input, styles.estadoSelectInput]}
							onPress={() => {
								if (!mostrarEstadosPago) void refrescarEstadosPago();
								setMostrarEstadosPago((visible) => !visible);
							}}
						>
							<Text style={estadoPago ? styles.estadoSelectText : styles.estadoSelectPlaceholder}>{estadoPago || "Seleccionar estado de pago"}</Text>
							{cargandoEstadosPago ? <ActivityIndicator size="small" color="#0f766e" /> : <MaterialCommunityIcons name={mostrarEstadosPago ? "chevron-up" : "chevron-down"} size={22} color="#0f766e" />}
						</TouchableOpacity>
						{mostrarEstadosPago ? (
							<View style={styles.estadoOptionsBox}>
								{estadosPago.map((estado) => {
									const activo = estadoPago.trim().toLowerCase() === estado.trim().toLowerCase();
									return (
										<TouchableOpacity key={estado} activeOpacity={0.84} style={[styles.estadoOptionItem, activo ? styles.estadoOptionItemActive : null]} onPress={() => { setEstadoPago(estado); setMostrarEstadosPago(false); }}>
											<Text style={[styles.estadoOptionText, activo ? styles.estadoOptionTextActive : null]}>{estado}</Text>
											{activo ? <MaterialCommunityIcons name="check-circle" size={18} color="#0f766e" /> : null}
										</TouchableOpacity>
									);
								})}
							</View>
						) : null}
					</View>

					<Text style={styles.fieldLabel}>Id venta:</Text>
					<TextInput value={idVenta} onChangeText={setIdVenta} onFocus={() => setMostrarEstadosPago(false)} placeholder="Ej. 1029" placeholderTextColor="#8ba8ae" style={styles.input} keyboardType="numeric" />
					<Text style={styles.fieldLabel}>Fecha desde:</Text>
					<TextInput value={fechaDesde} onChangeText={setFechaDesde} onFocus={() => setMostrarEstadosPago(false)} placeholder="YYYY-MM-DD" placeholderTextColor="#8ba8ae" style={styles.input} />
					<Text style={styles.fieldLabel}>Fecha hasta:</Text>
					<TextInput value={fechaHasta} onChangeText={setFechaHasta} onFocus={() => setMostrarEstadosPago(false)} placeholder="YYYY-MM-DD" placeholderTextColor="#8ba8ae" style={styles.input} />

					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.primaryAction} onPress={() => cargarPagos(false)}>
							<LinearGradient colors={["#ffffff", "#edf5ff"]} style={[styles.actionSurface, styles.primaryActionSurface]}>
								<View style={[styles.actionIconBadge, styles.primaryActionBadge]}>
									<MaterialCommunityIcons name="magnify" size={18} color="#2563eb" />
								</View>
								<Text style={styles.primaryActionText}>Buscar</Text>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity style={styles.newAction} onPress={() => abrirVentas(navigation)}>
							<LinearGradient colors={["#ffffff", "#e8fff8"]} style={[styles.actionSurface, styles.newActionSurface]}>
								<View style={[styles.actionIconBadge, styles.newActionBadge]}>
									<MaterialCommunityIcons name="cash-plus" size={18} color="#0f766e" />
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
						<TouchableOpacity style={[styles.secondaryAction, (!pagosParaPdf.length || cargando) && styles.buttonDisabled]} onPress={generarPDF} disabled={!pagosParaPdf.length || cargando}>
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
								<View key={`${item.IdPago}-${index}`} style={[styles.tableDataRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
									{COLUMNAS_REPORTE.map((columna) => (
										<View key={`${index}-${columna.key}`} style={[styles.tableDataCell, { flex: columna.flex }]}>
											{columna.key === "EstadoPago" ? (
												<View style={[styles.estadoBadge, esEstadoPagado(item.EstadoPago) ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo]}>
													<Text style={[styles.estadoBadgeText, esEstadoPagado(item.EstadoPago) ? styles.estadoBadgeTextActivo : styles.estadoBadgeTextInactivo]}>{item.EstadoPago}</Text>
												</View>
											) : (
												<Text style={[styles.tableDataText, esColumnaCorta(columna.key) ? styles.tableDataTextTight : null]} numberOfLines={2} adjustsFontSizeToFit={esColumnaCorta(columna.key)} minimumFontScale={0.78}>
													{String(item[columna.key] ?? "-")}
												</Text>
											)}
										</View>
									))}
									<View style={styles.tableActionCell}>
										<TouchableOpacity style={styles.verButton} onPress={() => abrirVentas(navigation)}>
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

export default ReportePagos;

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
import styles from "./ReporteCobranzasStyles";
import i18n from "../i18n";

type ReporteItem = Record<string, unknown>;

type CobranzaReporteItem = {
	IdVenta: string;
	IdCliente: string;
	Cliente: string;
	Lote: string;
	FechaVenta: string;
	TipoVenta: string;
	TipoPago: string;
	PrecioVenta: string;
	MontoInicial: string;
	SaldoPendiente: string;
	EstadoVenta: string;
};

type ReporteCobranzasProps = {
	navigation: any;
};

const EMPRESA_NOMBRE = "Tu Lote Seguro";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "CB";

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

		if (parsed && typeof parsed === "object") {
			const keys = ["d", "Data", "data", "result", "Resultado", "resultados", "Resultados", "Table"];
			for (const key of keys) {
				const value = (parsed as ReporteItem)[key];
				if (Array.isArray(value)) return value as ReporteItem[];
				if (typeof value === "string") {
					const nested = JSON.parse(value);
					return Array.isArray(nested) ? nested : [];
				}
			}
		}

		return [];
	} catch (error) {
		console.error("Error al parsear reporte de cobranzas:", error);
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

const textoLimpio = (value: unknown, fallback = "-") => {
	const texto = String(value ?? "").trim();
	return texto || fallback;
};

const numeroValor = (value: unknown) => {
	if (value === undefined || value === null || value === "") return null;
	const limpio = String(value).replace(/[^0-9.-]/g, "");
	const numero = Number(limpio);
	return Number.isFinite(numero) ? numero : null;
};

const formatoMoneda = (value: unknown, fallback = "-") => {
	const numero = numeroValor(value);
	if (numero === null) return fallback;
	return `S/ ${numero.toFixed(2)}`;
};

const formatoFecha = (value: unknown) => {
	const texto = textoLimpio(value, "");
	if (!texto) return "-";
	const fecha = new Date(texto);
	if (!Number.isNaN(fecha.getTime())) {
		return fecha.toLocaleDateString("es-PE", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	}
	return texto.split("T")[0] || texto;
};

const normalizarEstadoVenta = (estado: unknown) => {
	const estadoTexto = textoLimpio(estado, "").toLowerCase();
	const estadosAlDia = ["a", "activo", "al dia", "aldia", "pagado", "cancelado", "completado", "1", "true"];
	const estadosPendientes = [
		"i",
		"x",
		"0",
		"false",
		"inactivo",
		"anulado",
		"pendiente",
		"vencido",
		"mora",
		"moroso",
		"en deuda",
	];

	if (estadosAlDia.includes(estadoTexto)) return "Al dia";
	if (estadosPendientes.includes(estadoTexto)) {
		return estadoTexto ? estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1) : "Pendiente";
	}
	return estadoTexto ? estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1) : "Pendiente";
};

const obtenerCliente = (item: ReporteItem) => {
	const nombreDirecto = obtenerValor(item, ["Cliente", "NombreCliente", "NombreCompleto", "ClienteNombre"]);
	if (nombreDirecto) return textoLimpio(nombreDirecto);

	const nombres = [
		item.Nombre,
		item.Nombre1,
		item.Nombre2,
		item.Apellidos,
		item.Apaterno,
		item.Amaterno,
	]
		.map((value) => textoLimpio(value, ""))
		.filter(Boolean)
		.join(" ");

	return nombres || `Cliente ${textoLimpio(obtenerValor(item, ["IdCliente", "idCliente"]), "-")}`;
};

const obtenerLote = (item: ReporteItem) => {
	const loteDirecto = obtenerValor(item, ["CodigoLote", "CodLote", "Lote", "NombreLote"]);
	if (loteDirecto) return textoLimpio(loteDirecto);

	const manzana = textoLimpio(obtenerValor(item, ["Manzana", "Mz"]), "");
	const numeroLote = textoLimpio(obtenerValor(item, ["NumeroLote", "NumLote"]), "");
	const combinado = [manzana ? `Mz ${manzana}` : "", numeroLote ? `Lt ${numeroLote}` : ""]
		.filter(Boolean)
		.join(" ");

	return combinado || `Lote ${textoLimpio(obtenerValor(item, ["IdLote", "idLote"]), "-")}`;
};

const calcularSaldo = (item: ReporteItem) => {
	const saldoDirecto = obtenerValor(item, [
		"SaldoPendiente",
		"Saldo",
		"SaldoPorCobrar",
		"Deuda",
		"MontoPendiente",
		"TotalPendiente",
	]);
	if (saldoDirecto !== undefined) return formatoMoneda(saldoDirecto);

	const precio = numeroValor(obtenerValor(item, ["PrecioVenta", "Precio", "MontoVenta", "TotalVenta"]));
	const pagado = numeroValor(obtenerValor(item, ["MontoPagado", "TotalPagado", "Pagado"]));
	const inicial = numeroValor(obtenerValor(item, ["MontoInicial", "Inicial"]));

	if (precio !== null && (pagado !== null || inicial !== null)) {
		return formatoMoneda(precio - (pagado ?? 0) - (inicial ?? 0));
	}

	return "-";
};

const normalizarCobranzas = (items: ReporteItem[]): CobranzaReporteItem[] =>
	items.map((item) => ({
		IdVenta: textoLimpio(obtenerValor(item, ["IdVenta", "idVenta", "IDVenta", "Venta"]), "-"),
		IdCliente: textoLimpio(obtenerValor(item, ["IdCliente", "idCliente", "IDCliente"]), "-"),
		Cliente: obtenerCliente(item),
		Lote: obtenerLote(item),
		FechaVenta: formatoFecha(obtenerValor(item, ["FechaVenta", "fechaVenta", "Fecha", "FechaRegistro"])),
		TipoVenta: textoLimpio(obtenerValor(item, ["TipoVenta", "tipoVenta", "ModalidadVenta"]), "-"),
		TipoPago: textoLimpio(obtenerValor(item, ["TipoPago", "tipoPago", "MetodoPago", "FormaPago"]), "-"),
		PrecioVenta: formatoMoneda(obtenerValor(item, ["PrecioVenta", "Precio", "MontoVenta", "TotalVenta"])),
		MontoInicial: formatoMoneda(obtenerValor(item, ["MontoInicial", "Inicial", "CuotaInicial"])),
		SaldoPendiente: calcularSaldo(item),
		EstadoVenta: normalizarEstadoVenta(obtenerValor(item, ["EstadoVenta", "Estadoventa", "estadoVenta", "Estado"])),
	}));

const COLUMNAS_REPORTE: Array<{
	key: keyof CobranzaReporteItem;
	label: string;
	flex: number;
}> = [
	{ key: "Cliente", label: "Cliente", flex: 1.25 },
	{ key: "Lote", label: "Lote", flex: 0.8 },
	{ key: "FechaVenta", label: "Fecha", flex: 0.8 },
	{ key: "TipoVenta", label: "Tipo", flex: 0.72 },
	{ key: "TipoPago", label: "Pago", flex: 0.8 },
	{ key: "PrecioVenta", label: "Precio", flex: 0.85 },
	{ key: "SaldoPendiente", label: "Saldo", flex: 0.85 },
	{ key: "EstadoVenta", label: "Estado", flex: 0.82 },
];

const esCobranzaAlDia = (estado: string) => estado.trim().toLowerCase() === "al dia";

const obtenerLogoPdfUri = () => {
        const resolver = (Image as any).resolveAssetSource;
        if (typeof resolver !== "function") return "";
        return resolver(require("../assets/splash-icon.png"))?.uri || "";
};

const API_BASE_URL = API_URL.replace(/\/+$/, "");

const construirQueryCobranzas = (
        estadoVenta: string,
        tipoVenta: string,
        tipoPago: string,
        fechaDesde: string,
        fechaHasta: string,
	idCliente: string,
) => {
	const params = new URLSearchParams();
	if (estadoVenta.trim()) params.append("estadoVenta", estadoVenta.trim());
	if (tipoVenta.trim()) params.append("tipoVenta", tipoVenta.trim());
	if (tipoPago.trim()) params.append("tipoPago", tipoPago.trim());
	if (fechaDesde.trim()) params.append("fechaDesde", fechaDesde.trim());
        if (fechaHasta.trim()) params.append("fechaHasta", fechaHasta.trim());
        if (idCliente.trim()) params.append("idCliente", idCliente.trim());

        return params.toString();
};

const agregarQuery = (ruta: string, query: string) =>
        `${API_BASE_URL}${ruta}${query ? `?${query}` : ""}`;

const construirUrlsCobranzas = (
        estadoVenta: string,
        tipoVenta: string,
        tipoPago: string,
        fechaDesde: string,
        fechaHasta: string,
        idCliente: string,
) => {
        const query = construirQueryCobranzas(estadoVenta, tipoVenta, tipoPago, fechaDesde, fechaHasta, idCliente);

        // ATAMAINE: Tu captura indica api/Reporte/reporte_Cobranzas; dejamos tambien la ruta sin api por compatibilidad con otros controllers.
        return [
                agregarQuery("/api/Reporte/reporte_Cobranzas", query),
                agregarQuery("/Reporte/reporte_Cobranzas", query),
        ];
};

const construirUrlsVentasBase = () => [
        `${API_BASE_URL}/api/Venta/venta_Listar`,
        `${API_BASE_URL}/Venta/venta_Listar`,
];

const construirUrlsEstadosVenta = () => [
	`${API_BASE_URL}/api/Venta/venta_Estado_Listar`,
	`${API_BASE_URL}/Venta/venta_Estado_Listar`,
];

const construirUrlsTiposVenta = () => [
	`${API_BASE_URL}/api/Venta/venta_Tipo_Listar`,
	`${API_BASE_URL}/Venta/venta_Tipo_Listar`,
];

const construirUrlsTiposPago = () => [
	`${API_BASE_URL}/api/Venta/venta_TipoPago_Listar`,
	`${API_BASE_URL}/Venta/venta_TipoPago_Listar`,
];

const consultarPrimerEndpointDisponible = async (urls: string[], signal?: AbortSignal) => {
        let ultimoError = new Error("No se pudo consultar ningun endpoint disponible.");

        for (const url of urls) {
                try {
                        const response = await fetch(url, { signal });

                        if (!response.ok) {
                                ultimoError = new Error(`HTTP ${response.status}`);
                                continue;
                        }

                        return await response.text();
                } catch (error) {
                        if ((error as Error).name === "AbortError") throw error;
                        ultimoError = error as Error;
                }
        }

        throw ultimoError;
};

const normalizarEstadosVenta = (items: ReporteItem[]) => {
	const estados = items
		.map((item) => {
			const valor = obtenerValor(item, [
				"EstadoVenta",
				"estadoVenta",
				"Estado",
				"estado",
				"NombreEstado",
				"DescripcionEstado",
				"Descripcion",
				"descripcion",
				"Nombre",
				"nombre",
				"Texto",
				"Value",
			]);

			if (valor !== undefined) return textoLimpio(valor, "");

			const primerValorTexto = Object.entries(item).find(([key, value]) => {
				const nombreCampo = key.toLowerCase();
				return !nombreCampo.startsWith("id") && value !== undefined && value !== null && String(value).trim() !== "";
			});

			return primerValorTexto ? textoLimpio(primerValorTexto[1], "") : "";
		})
		.filter(Boolean);

	return Array.from(new Set(estados));
};

const ESTADOS_VENTA_RESPALDO = ["Activo", "Pendiente", "Cancelado"];

const consultarEstadosVenta = async (signal?: AbortSignal) => {
	try {
		const rawData = await consultarPrimerEndpointDisponible(construirUrlsEstadosVenta(), signal);
		const estadosApi = normalizarEstadosVenta(parseReporteResponse(rawData));
		return estadosApi.length ? estadosApi : ESTADOS_VENTA_RESPALDO;
	} catch (error) {
		if ((error as Error).name === "AbortError") throw error;
		return ESTADOS_VENTA_RESPALDO;
	}
};

const normalizarTiposVenta = (items: ReporteItem[]) => {
	const tipos = items
		.map((item) => {
			const valor = obtenerValor(item, [
				"TipoVenta",
				"tipoVenta",
				"Tipo",
				"tipo",
				"NombreTipo",
				"DescripcionTipo",
				"Descripcion",
				"descripcion",
				"Nombre",
				"nombre",
				"Texto",
				"Value",
			]);

			if (valor !== undefined) return textoLimpio(valor, "");

			const primerValorTexto = Object.entries(item).find(([key, value]) => {
				const nombreCampo = key.toLowerCase();
				return !nombreCampo.startsWith("id") && value !== undefined && value !== null && String(value).trim() !== "";
			});

			return primerValorTexto ? textoLimpio(primerValorTexto[1], "") : "";
		})
		.filter(Boolean);

	return Array.from(new Set(tipos));
};

const TIPOS_VENTA_RESPALDO = ["Contado", "Credito", "Financiado"];

const consultarTiposVenta = async (signal?: AbortSignal) => {
	try {
		const rawData = await consultarPrimerEndpointDisponible(construirUrlsTiposVenta(), signal);
		const tiposApi = normalizarTiposVenta(parseReporteResponse(rawData));
		return tiposApi.length ? tiposApi : TIPOS_VENTA_RESPALDO;
	} catch (error) {
		if ((error as Error).name === "AbortError") throw error;
		return TIPOS_VENTA_RESPALDO;
	}
};

const normalizarTiposPago = (items: ReporteItem[]) => {
	const tipos = items
		.map((item) => {
			const valor = obtenerValor(item, [
				"TipoPago",
				"tipoPago",
				"Tipo",
				"tipo",
				"NombreTipo",
				"DescripcionTipo",
				"Descripcion",
				"descripcion",
				"Nombre",
				"nombre",
				"Texto",
				"Value",
			]);

			if (valor !== undefined) return textoLimpio(valor, "");

			const primerValorTexto = Object.entries(item).find(([key, value]) => {
				const nombreCampo = key.toLowerCase();
				return !nombreCampo.startsWith("id") && value !== undefined && value !== null && String(value).trim() !== "";
			});

			return primerValorTexto ? textoLimpio(primerValorTexto[1], "") : "";
		})
		.filter(Boolean);

	return Array.from(new Set(tipos));
};

const TIPOS_PAGO_RESPALDO = ["Efectivo", "Transferencia", "Deposito"];

const consultarTiposPago = async (signal?: AbortSignal) => {
	try {
		const rawData = await consultarPrimerEndpointDisponible(construirUrlsTiposPago(), signal);
		const tiposApi = normalizarTiposPago(parseReporteResponse(rawData));
		return tiposApi.length ? tiposApi : TIPOS_PAGO_RESPALDO;
	} catch (error) {
		if ((error as Error).name === "AbortError") throw error;
		return TIPOS_PAGO_RESPALDO;
	}
};

const fechaATiempo = (value: string) => {
        const texto = value.trim();
        if (!texto) return null;

        const fechaLatina = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (fechaLatina) {
                const [, dia, mes, anio] = fechaLatina;
                const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
                return Number.isNaN(fecha.getTime()) ? null : fecha.getTime();
        }

        const fecha = new Date(texto);
        return Number.isNaN(fecha.getTime()) ? null : fecha.getTime();
};

const contieneTexto = (origen: string, filtro: string) =>
        !filtro.trim() || origen.toLowerCase().includes(filtro.trim().toLowerCase());

const filtrarCobranzasLocal = (
        items: CobranzaReporteItem[],
        estadoVenta: string,
        tipoVenta: string,
        tipoPago: string,
        fechaDesde: string,
        fechaHasta: string,
        idCliente: string,
) => {
        const desde = fechaATiempo(fechaDesde);
        const hasta = fechaATiempo(fechaHasta);

        // ATAMAINE: Respaldo en tiempo real si el PA de reporte aun no esta publicado en Somee.
        return items.filter((item) => {
                const fechaItem = fechaATiempo(item.FechaVenta);
                const coincideEstado = contieneTexto(item.EstadoVenta, estadoVenta);
                const coincideTipoVenta = contieneTexto(item.TipoVenta, tipoVenta);
                const coincideTipoPago = contieneTexto(item.TipoPago, tipoPago);
                const coincideCliente = !idCliente.trim() || item.IdCliente === idCliente.trim();
                const coincideDesde = desde === null || fechaItem === null || fechaItem >= desde;
                const coincideHasta = hasta === null || fechaItem === null || fechaItem <= hasta;

                return coincideEstado && coincideTipoVenta && coincideTipoPago && coincideCliente && coincideDesde && coincideHasta;
        });
};

const consultarCobranzasReporte = async (
        estadoVenta: string,
        tipoVenta: string,
	tipoPago: string,
	fechaDesde: string,
        fechaHasta: string,
        idCliente: string,
        signal?: AbortSignal,
) => {
        try {
                const rawData = await consultarPrimerEndpointDisponible(
                        construirUrlsCobranzas(estadoVenta, tipoVenta, tipoPago, fechaDesde, fechaHasta, idCliente),
                        signal,
                );
                return normalizarCobranzas(parseReporteResponse(rawData));
        } catch (error) {
                if ((error as Error).name === "AbortError") throw error;

                const rawVentas = await consultarPrimerEndpointDisponible(construirUrlsVentasBase(), signal);
                const cobranzasBase = normalizarCobranzas(parseReporteResponse(rawVentas));
                return filtrarCobranzasLocal(cobranzasBase, estadoVenta, tipoVenta, tipoPago, fechaDesde, fechaHasta, idCliente);
        }
};

const abrirVentaRegistrada = (navigation: any, item: CobranzaReporteItem) => {
	navigation.navigate("MainTabs", {
		screen: i18n.t("btVentas"),
		params: {
			ventaSeleccionadaId: item.IdVenta,
			clienteSeleccionadoId: item.IdCliente,
		},
	});
};

const ReporteCobranzas = ({ navigation }: ReporteCobranzasProps) => {
	const [estadoVenta, setEstadoVenta] = useState("");
	const [estadosVenta, setEstadosVenta] = useState<string[]>(ESTADOS_VENTA_RESPALDO);
	const [mostrarEstadosVenta, setMostrarEstadosVenta] = useState(false);
	const [cargandoEstadosVenta, setCargandoEstadosVenta] = useState(false);
	const [tipoVenta, setTipoVenta] = useState("");
	const [tiposVenta, setTiposVenta] = useState<string[]>(TIPOS_VENTA_RESPALDO);
	const [mostrarTiposVenta, setMostrarTiposVenta] = useState(false);
	const [cargandoTiposVenta, setCargandoTiposVenta] = useState(false);
	const [tipoPago, setTipoPago] = useState("");
	const [tiposPago, setTiposPago] = useState<string[]>(TIPOS_PAGO_RESPALDO);
	const [mostrarTiposPago, setMostrarTiposPago] = useState(false);
	const [cargandoTiposPago, setCargandoTiposPago] = useState(false);
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");
	const [idCliente, setIdCliente] = useState("");
	const [todasCobranzas, setTodasCobranzas] = useState<CobranzaReporteItem[]>([]);
	const [reporte, setReporte] = useState<CobranzaReporteItem[]>([]);
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

	useEffect(() => {
		const controller = new AbortController();

		const cargarListasVenta = async () => {
			try {
				setCargandoEstadosVenta(true);
				setCargandoTiposVenta(true);
				setCargandoTiposPago(true);
				const [estados, tipos, pagos] = await Promise.all([
					consultarEstadosVenta(controller.signal),
					consultarTiposVenta(controller.signal),
					consultarTiposPago(controller.signal),
				]);
				setEstadosVenta(estados);
				setTiposVenta(tipos);
				setTiposPago(pagos);
			} catch (error) {
				if ((error as Error).name !== "AbortError") {
					setEstadosVenta(ESTADOS_VENTA_RESPALDO);
					setTiposVenta(TIPOS_VENTA_RESPALDO);
					setTiposPago(TIPOS_PAGO_RESPALDO);
				}
			} finally {
				setCargandoEstadosVenta(false);
				setCargandoTiposVenta(false);
				setCargandoTiposPago(false);
			}
		};

		cargarListasVenta();
		return () => controller.abort();
	}, []);

	const refrescarTiposVenta = async () => {
		try {
			setCargandoTiposVenta(true);
			const tipos = await consultarTiposVenta();
			setTiposVenta(tipos);
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				setTiposVenta(TIPOS_VENTA_RESPALDO);
			}
		} finally {
			setCargandoTiposVenta(false);
		}
	};

	const refrescarTiposPago = async () => {
		try {
			setCargandoTiposPago(true);
			const tipos = await consultarTiposPago();
			setTiposPago(tipos);
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				setTiposPago(TIPOS_PAGO_RESPALDO);
			}
		} finally {
			setCargandoTiposPago(false);
		}
	};

	const cargarCobranzasIniciales = async () => {
		try {
			setCargando(true);
			setMensaje("");
			const cobranzasBase = await consultarCobranzasReporte("", "", "", "", "", "");
			setTodasCobranzas(cobranzasBase);
			setReporte(cobranzasBase);
			setBuscado(false);
			setUltimoFiltro("");
			if (!cobranzasBase.length) setMensaje("No existen cobranzas registradas.");
		} catch (error) {
			console.error("Error al cargar cobranzas registradas:", error);
			setTodasCobranzas([]);
			setReporte([]);
			setMensaje("No se pudo cargar el reporte de cobranzas.");
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargarCobranzasIniciales();
	}, []);

	const filtrosTexto = [
		estadoVenta.trim() ? `Estado: ${estadoVenta.trim()}` : "",
		tipoVenta.trim() ? `Venta: ${tipoVenta.trim()}` : "",
		tipoPago.trim() ? `Pago: ${tipoPago.trim()}` : "",
		fechaDesde.trim() ? `Desde: ${fechaDesde.trim()}` : "",
		fechaHasta.trim() ? `Hasta: ${fechaHasta.trim()}` : "",
		idCliente.trim() ? `Cliente ID: ${idCliente.trim()}` : "",
	]
		.filter(Boolean)
		.join(" | ");

	const hayFiltro = Boolean(
		estadoVenta.trim() ||
			tipoVenta.trim() ||
			tipoPago.trim() ||
			fechaDesde.trim() ||
			fechaHasta.trim() ||
			idCliente.trim(),
	);

	useEffect(() => {
		let mounted = true;

		const refrescar = async () => {
			try {
				const controller = new AbortController();
				const datos = await consultarCobranzasReporte(
					estadoVenta,
					tipoVenta,
					tipoPago,
					fechaDesde,
					fechaHasta,
					idCliente,
					controller.signal,
				);

				if (!mounted) return;

				if (hayFiltro) {
					setReporte(datos);
					setBuscado(true);
					setUltimoFiltro(filtrosTexto);
				} else {
					setTodasCobranzas(datos);
					setReporte(datos);
					setBuscado(false);
					setUltimoFiltro("");
				}
			} catch (error) {
				// ATAMAINE: El refresco silencioso no interrumpe la consulta manual ni ensucia la pantalla.
			}
		};

		const intervalo = setInterval(refrescar, 15000);
		return () => {
			mounted = false;
			clearInterval(intervalo);
		};
	}, [estadoVenta, tipoVenta, tipoPago, fechaDesde, fechaHasta, idCliente, hayFiltro, filtrosTexto]);

	const limpiarFiltro = async () => {
		setEstadoVenta("");
		setMostrarEstadosVenta(false);
		setTipoVenta("");
		setMostrarTiposVenta(false);
		setTipoPago("");
		setMostrarTiposPago(false);
		setFechaDesde("");
		setFechaHasta("");
		setIdCliente("");
		setBuscado(false);
		setMensaje("");
		await cargarCobranzasIniciales();
	};

	const consultarReporte = async () => {
		if (!hayFiltro) {
			await cargarCobranzasIniciales();
			return;
		}

		try {
			setCargando(true);
			setMensaje("");
			setUltimoFiltro(filtrosTexto);
			if (fetchControllerRef.current) fetchControllerRef.current.abort();
			fetchControllerRef.current = new AbortController();

			const filtrados = await consultarCobranzasReporte(
				estadoVenta,
				tipoVenta,
				tipoPago,
				fechaDesde,
				fechaHasta,
				idCliente,
				fetchControllerRef.current.signal,
			);

			setReporte(filtrados);
			setBuscado(true);
			if (!filtrados.length) setMensaje("No se encontraron cobranzas para ese criterio.");
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			console.error("Error al consultar reporte de cobranzas:", error);
			setReporte([]);
			setBuscado(true);
			setMensaje("No se pudo consultar el reporte de cobranzas.");
		} finally {
			setCargando(false);
		}
	};

	const horaFormateada = horaActual.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
	const fechaFormateada = horaActual.toLocaleDateString("es-PE", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const listadoMostrar = buscado ? reporte : todasCobranzas;
	const cobranzasParaPdf = listadoMostrar;
	const logoPdfUri = obtenerLogoPdfUri();
	const saldoTotalPendiente = listadoMostrar.reduce((total, item) => {
		const saldo = numeroValor(item.SaldoPendiente);
		return total + (saldo ?? 0);
	}, 0);

	const construirHtmlReporte = () => {
		const numeroDocumento = `RPT-COB-${horaActual.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
		const logoHtml = logoPdfUri
			? `<img src="${escapeHtml(logoPdfUri)}" style="width:68px;height:68px;border-radius:16px;object-fit:contain;background:white;padding:8px;" />`
			: `<div style="width:68px;height:68px;border-radius:16px;background:white;color:#0f766e;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;">${EMPRESA_SIGLAS}</div>`;
		const columnasPdf = [
			{ label: "N", width: "5%" },
			{ label: "Venta", width: "8%" },
			{ label: "Cliente", width: "19%" },
			{ label: "Lote", width: "10%" },
			{ label: "Fecha", width: "10%" },
			{ label: "Tipo", width: "10%" },
			{ label: "Pago", width: "10%" },
			{ label: "Precio", width: "11%" },
			{ label: "Saldo", width: "11%" },
			{ label: "Estado", width: "6%" },
		];
		const colgroupHtml = columnasPdf.map((columna) => `<col style="width:${columna.width};" />`).join("");
		const encabezadosHtml = columnasPdf
			.map(
				(columna) =>
					`<th style="padding:11px 8px;background:#1d4ed8;color:white;font-size:11px;border:1px solid #d9e6f2;text-align:center;">${escapeHtml(columna.label)}</th>`,
			)
			.join("");
		const filasHtml = cobranzasParaPdf
			.map((item, index) => {
				const fondoFila = index % 2 === 0 ? "#ffffff" : "#f6fbff";
				const valores = [
					item.IdVenta,
					item.Cliente,
					item.Lote,
					item.FechaVenta,
					item.TipoVenta,
					item.TipoPago,
					item.PrecioVenta,
					item.SaldoPendiente,
					item.EstadoVenta,
				];
				const celdas = valores
					.map(
						(valor) =>
							`<td style="border:1px solid #dbe4ea;padding:9px 7px;text-align:center;background:${fondoFila};font-size:11px;color:#0f172a;">${escapeHtml(valor)}</td>`,
					)
					.join("");
				return `<tr><td style="border:1px solid #dbe4ea;padding:9px 7px;text-align:center;background:${fondoFila};font-weight:700;">${index + 1}</td>${celdas}</tr>`;
			})
			.join("");

		return `<html><head><style>@page{size:A4 landscape;margin:18px 18px 56px 18px;}body{font-family:Arial,sans-serif;color:#0f172a;}table{width:100%;border-collapse:collapse;table-layout:fixed;}td,th{word-break:break-word;overflow-wrap:anywhere;}.footer-wrap{position:fixed;left:24px;right:24px;bottom:8px;display:flex;justify-content:space-between;gap:12px;padding-top:10px;border-top:1px solid #cbd5e1;font-size:10px;color:#475569;}</style></head><body style="padding:24px;"><div style="display:flex;justify-content:space-between;align-items:stretch;margin-bottom:18px;background:linear-gradient(135deg,#0f766e 0%,#164e63 55%,#1e3a8a 100%);border-radius:22px;overflow:hidden;"><div style="display:flex;align-items:center;gap:16px;padding:18px 20px;flex:1;">${logoHtml}<div><p style="margin:0 0 5px;color:#d1fae5;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(EMPRESA_NOMBRE)}</p><h1 style="margin:0;color:white;font-size:26px;">Reporte de Cobranzas</h1><p style="margin:8px 0 0;color:#dbeafe;font-size:12px;">Documento generado en tiempo real desde reporte_Cobranzas.</p></div></div><div style="min-width:245px;background:rgba(255,255,255,0.12);padding:18px 20px;"><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Documento:</strong> ${escapeHtml(numeroDocumento)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Fecha:</strong> ${escapeHtml(fechaFormateada)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Hora:</strong> ${escapeHtml(horaFormateada)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Filtro:</strong> ${escapeHtml(ultimoFiltro || "Todas las cobranzas")}</p><p style="margin:0;color:white;font-size:12px;"><strong>Total:</strong> ${cobranzasParaPdf.length} registros</p></div></div><div style="border:1px solid #dbe4ea;border-radius:18px;overflow:hidden;"><table><colgroup>${colgroupHtml}</colgroup><thead><tr>${encabezadosHtml}</tr></thead><tbody>${filasHtml}</tbody></table></div><div class="footer-wrap"><div><strong>${escapeHtml(EMPRESA_NOMBRE)}</strong> | Reporte interno de cobranzas. Contacto: ${escapeHtml(EMPRESA_CONTACTO)}</div></div></body></html>`;
	};

	const generarPDF = async () => {
		if (!cobranzasParaPdf.length) {
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
			console.error("Error al generar PDF de cobranzas:", error);
			Alert.alert("Error", "No se pudo generar el PDF del reporte.");
		}
	};

	const esColumnaCorta = (key: keyof CobranzaReporteItem) =>
		key === "FechaVenta" || key === "TipoVenta" || key === "TipoPago" || key === "PrecioVenta" || key === "SaldoPendiente";

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
							<Text style={styles.title}>de Cobranzas</Text>
							<Text style={styles.subtitle}>Consulta ventas, pagos y saldos usando el endpoint reporte_Cobranzas.</Text>
						</View>
					</View>
					<View style={styles.statsRow}>
						<View style={styles.statCard}>
							<Text style={styles.statLabel}>Cobranzas</Text>
							{cargando ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.statValue}>{listadoMostrar.length}</Text>}
							<Text style={styles.statCaption}>Registros encontrados</Text>
						</View>
						<View style={styles.statCard}>
							<Text style={styles.statLabel}>Saldo Pendiente</Text>
							<Text style={styles.statValueSmall}>{formatoMoneda(saldoTotalPendiente, "S/ 0.00")}</Text>
							<Text style={styles.statCaption}>{ultimoFiltro || "Todas las cobranzas"}</Text>
						</View>
					</View>
				</LinearGradient>

				<View style={styles.searchCard}>
					<Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
					<Text style={styles.fieldLabel}>Estado venta:</Text>
					<View style={styles.estadoSelectWrap}>
						<TouchableOpacity
							style={[styles.input, styles.estadoSelectInput]}
							activeOpacity={0.85}
							onPress={() => {
								setMostrarTiposVenta(false);
								setMostrarTiposPago(false);
								setMostrarEstadosVenta((visible) => !visible);
							}}
						>
							<Text style={estadoVenta ? styles.estadoSelectText : styles.estadoSelectPlaceholder}>
								{estadoVenta || "Seleccionar estado de venta"}
							</Text>
							{cargandoEstadosVenta ? (
								<ActivityIndicator size="small" color="#069488" />
							) : (
								<MaterialCommunityIcons
									name={mostrarEstadosVenta ? "chevron-up" : "chevron-down"}
									size={22}
									color="#64748b"
								/>
							)}
						</TouchableOpacity>

						{mostrarEstadosVenta ? (
							<View style={styles.estadoOptionsBox}>
								{estadosVenta.map((estado) => {
									const estadoActivo = estadoVenta.trim().toLowerCase() === estado.trim().toLowerCase();
									return (
										<TouchableOpacity
											key={estado}
											style={[styles.estadoOptionItem, estadoActivo && styles.estadoOptionItemActive]}
											activeOpacity={0.82}
											onPress={() => {
												setEstadoVenta(estado);
												setMostrarEstadosVenta(false);
											}}
										>
											<Text style={[styles.estadoOptionText, estadoActivo && styles.estadoOptionTextActive]}>
												{estado}
											</Text>
											{estadoActivo ? (
												<MaterialCommunityIcons name="check-circle" size={18} color="#0f766e" />
											) : null}
										</TouchableOpacity>
									);
								})}
							</View>
						) : null}
					</View>
					<Text style={styles.fieldLabel}>Tipo venta:</Text>
					<View style={styles.estadoSelectWrap}>
						<TouchableOpacity
							style={[styles.input, styles.estadoSelectInput]}
							activeOpacity={0.85}
							onPress={() => {
								setMostrarEstadosVenta(false);
								setMostrarTiposPago(false);
								if (!mostrarTiposVenta) {
									refrescarTiposVenta();
								}
								setMostrarTiposVenta((visible) => !visible);
							}}
						>
							<Text style={tipoVenta ? styles.estadoSelectText : styles.estadoSelectPlaceholder}>
								{tipoVenta || "Seleccionar tipo de venta"}
							</Text>
							{cargandoTiposVenta ? (
								<ActivityIndicator size="small" color="#069488" />
							) : (
								<MaterialCommunityIcons
									name={mostrarTiposVenta ? "chevron-up" : "chevron-down"}
									size={22}
									color="#64748b"
								/>
							)}
						</TouchableOpacity>

						{mostrarTiposVenta ? (
							<View style={styles.estadoOptionsBox}>
								{tiposVenta.map((tipo) => {
									const tipoActivo = tipoVenta.trim().toLowerCase() === tipo.trim().toLowerCase();
									return (
										<TouchableOpacity
											key={tipo}
											style={[styles.estadoOptionItem, tipoActivo && styles.estadoOptionItemActive]}
											activeOpacity={0.82}
											onPress={() => {
												setTipoVenta(tipo);
												setMostrarTiposVenta(false);
											}}
										>
											<Text style={[styles.estadoOptionText, tipoActivo && styles.estadoOptionTextActive]}>
												{tipo}
											</Text>
											{tipoActivo ? (
												<MaterialCommunityIcons name="check-circle" size={18} color="#0f766e" />
											) : null}
										</TouchableOpacity>
									);
								})}
							</View>
						) : null}
					</View>
					<Text style={styles.fieldLabel}>Tipo pago:</Text>
					<View style={styles.estadoSelectWrap}>
						<TouchableOpacity
							style={[styles.input, styles.estadoSelectInput]}
							activeOpacity={0.85}
							onPress={() => {
								setMostrarEstadosVenta(false);
								setMostrarTiposVenta(false);
								if (!mostrarTiposPago) {
									refrescarTiposPago();
								}
								setMostrarTiposPago((visible) => !visible);
							}}
						>
							<Text style={tipoPago ? styles.estadoSelectText : styles.estadoSelectPlaceholder}>
								{tipoPago || "Seleccionar tipo de pago"}
							</Text>
							{cargandoTiposPago ? (
								<ActivityIndicator size="small" color="#069488" />
							) : (
								<MaterialCommunityIcons
									name={mostrarTiposPago ? "chevron-up" : "chevron-down"}
									size={22}
									color="#64748b"
								/>
							)}
						</TouchableOpacity>

						{mostrarTiposPago ? (
							<View style={styles.estadoOptionsBox}>
								{tiposPago.map((tipo) => {
									const tipoActivo = tipoPago.trim().toLowerCase() === tipo.trim().toLowerCase();
									return (
										<TouchableOpacity
											key={tipo}
											style={[styles.estadoOptionItem, tipoActivo && styles.estadoOptionItemActive]}
											activeOpacity={0.82}
											onPress={() => {
												setTipoPago(tipo);
												setMostrarTiposPago(false);
											}}
										>
											<Text style={[styles.estadoOptionText, tipoActivo && styles.estadoOptionTextActive]}>
												{tipo}
											</Text>
											{tipoActivo ? (
												<MaterialCommunityIcons name="check-circle" size={18} color="#0f766e" />
											) : null}
										</TouchableOpacity>
									);
								})}
							</View>
						) : null}
					</View>
					<Text style={styles.fieldLabel}>Fecha desde:</Text>
					<TextInput value={fechaDesde} onChangeText={setFechaDesde} placeholder="YYYY-MM-DD" placeholderTextColor="#8ba8ae" style={styles.input} returnKeyType="search" onSubmitEditing={consultarReporte} />
					<Text style={styles.fieldLabel}>Fecha hasta:</Text>
					<TextInput value={fechaHasta} onChangeText={setFechaHasta} placeholder="YYYY-MM-DD" placeholderTextColor="#8ba8ae" style={styles.input} returnKeyType="search" onSubmitEditing={consultarReporte} />
					<Text style={styles.fieldLabel}>Id cliente:</Text>
					<TextInput value={idCliente} onChangeText={(texto) => setIdCliente(texto.replace(/[^0-9]/g, ""))} placeholder="Ej. 12" placeholderTextColor="#8ba8ae" style={styles.input} keyboardType="number-pad" returnKeyType="search" onSubmitEditing={consultarReporte} />

					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.primaryAction} onPress={consultarReporte}>
							<LinearGradient colors={["#ffffff", "#edf5ff"]} style={[styles.actionSurface, styles.primaryActionSurface]}>
								<View style={[styles.actionIconBadge, styles.primaryActionBadge]}>
									<MaterialCommunityIcons name="magnify" size={18} color="#2563eb" />
								</View>
								<Text style={styles.primaryActionText}>Buscar</Text>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity style={styles.newAction} onPress={() => navigation.navigate("RegistrarVenta")}>
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
						<TouchableOpacity style={[styles.secondaryAction, (!cobranzasParaPdf.length || cargando) && styles.buttonDisabled]} onPress={generarPDF} disabled={!cobranzasParaPdf.length || cargando}>
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
								<View key={`${item.IdVenta}-${index}`} style={[styles.tableDataRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
									{COLUMNAS_REPORTE.map((columna) => (
										<View key={`${index}-${columna.key}`} style={[styles.tableDataCell, { flex: columna.flex }]}>
											{columna.key === "EstadoVenta" ? (
												<View style={[styles.estadoBadge, esCobranzaAlDia(String(item.EstadoVenta)) ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo]}>
													<Text style={[styles.estadoBadgeText, esCobranzaAlDia(String(item.EstadoVenta)) ? styles.estadoBadgeTextActivo : styles.estadoBadgeTextInactivo]}>{String(item[columna.key] ?? "-")}</Text>
												</View>
											) : (
												<Text style={[styles.tableDataText, esColumnaCorta(columna.key) ? styles.tableDataTextTight : null]} numberOfLines={2} adjustsFontSizeToFit={esColumnaCorta(columna.key)} minimumFontScale={0.78}>
													{String(item[columna.key] ?? "-")}
												</Text>
											)}
										</View>
									))}
									<View style={styles.tableActionCell}>
										<TouchableOpacity style={styles.verButton} onPress={() => abrirVentaRegistrada(navigation, item)}>
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

export default ReporteCobranzas;

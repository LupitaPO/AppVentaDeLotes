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
import React, { useEffect, useMemo, useRef, useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import { API_URL } from "../../config/apiUrl";
import styles from "./ReporteLotesStyles";
import i18n from "../../i18n";

type ReporteItem = Record<string, unknown>;

type LoteReporteItem = {
	IdLote: string;
	IdProyecto: string;
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

type ProyectoSelectItem = {
	id: string;
	nombre: string;
	codigo: string;
	ubicacion: string;
};

const EMPRESA_NOMBRE = "Residencial Santa Fe";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "LS";
const API_BASE_URL = API_URL.replace(/\/+$/, "");
const ESTADOS_LOTE_RESPALDO = ["Libre", "Vendido", "En Deuda"];

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

const normalizarTexto = (value: unknown) => String(value ?? "").trim();
const pareceIdNumerico = (value: unknown) => /^\d+$/.test(normalizarTexto(value));

// ATAMAINE: Las coincidencias ignoran tildes y mayusculas para aceptar escritura natural.
const normalizarTerminoBusqueda = (value: unknown) =>
	normalizarTexto(value)
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();

const coincideProyecto = (proyecto: ProyectoSelectItem, criterio: string) => {
	const termino = normalizarTerminoBusqueda(criterio);
	if (!termino) return true;
	return [proyecto.nombre, proyecto.codigo, proyecto.ubicacion, proyecto.id]
		.some((valor) => normalizarTerminoBusqueda(valor).includes(termino));
};

const coincideEstado = (estado: string, criterio: string) =>
	normalizarTerminoBusqueda(estado).includes(normalizarTerminoBusqueda(criterio));

const limpiarPrecio = (value: string) => {
	const normalizado = value.replace(",", ".").replace(/[^0-9.]/g, "");
	const [entero, ...decimales] = normalizado.split(".");
	return decimales.length ? `${entero}.${decimales.join("").slice(0, 2)}` : entero;
};

const consultarPrimerEndpointDisponible = async (urls: string[], signal?: AbortSignal) => {
	let ultimoError: Error | null = null;

	for (const url of urls) {
		try {
			const response = await fetch(url, { signal });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return await response.text();
		} catch (error) {
			if ((error as Error).name === "AbortError") throw error;
			ultimoError = error as Error;
		}
	}

	throw ultimoError ?? new Error("Endpoint no disponible");
};

const construirUrlsEstadosLote = () => [
	`${API_BASE_URL}/api/Lote/lote_Estado_Listar`,
	`${API_BASE_URL}/Lote/lote_Estado_Listar`,
	`${API_BASE_URL}/api/Lote/lote_EstadoListar`,
	`${API_BASE_URL}/Lote/lote_EstadoListar`,
];

const construirUrlsProyectos = () => [
	`${API_BASE_URL}/api/Proyecto/proyecto_Listar_Select`,
	`${API_BASE_URL}/Proyecto/proyecto_Listar_Select`,
	`${API_BASE_URL}/api/Proyecto/proyecto_ListarSelect`,
	`${API_BASE_URL}/Proyecto/proyecto_ListarSelect`,
	`${API_BASE_URL}/api/Proyecto/proyecto_Listar`,
	`${API_BASE_URL}/Proyecto/proyecto_Listar`,
];

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

const obtenerTextoEstadoLote = (item: ReporteItem) => {
	if (typeof item === "string" || typeof item === "number") return String(item).trim();
	if (!item || typeof item !== "object") return "";

	const registro = item as Record<string, unknown>;
	const claves = [
		"EstadoLote",
		"estadoLote",
		"Estado",
		"estado",
		"NombreEstado",
		"DescripcionEstado",
		"Descripcion",
		"Nombre",
		"Texto",
		"Valor",
		"Value",
	];

	for (const clave of claves) {
		const valor = registro[clave];
		if (typeof valor === "string" || typeof valor === "number") {
			const texto = String(valor).trim();
			if (texto) return texto;
		}
	}

	const entrada = Object.entries(registro).find(([clave, valor]) => {
		const claveNormalizada = clave.toLowerCase();
		return !claveNormalizada.includes("id") && (typeof valor === "string" || typeof valor === "number") && String(valor).trim();
	});

	return entrada ? String(entrada[1]).trim() : "";
};

const normalizarOpcionEstadoLote = (estado: unknown) => {
	const texto = String(estado ?? "").trim().replace(/[_-]+/g, " ");
	if (!texto) return "";
	const normalizado = normalizarEstadoLote(texto);
	if (normalizado.toLowerCase() === "en deuda") return "En Deuda";
	return normalizado;
};

const normalizarEstadosLote = (items: ReporteItem[]) => {
	const estados = new Map<string, string>();

	items.forEach((item) => {
		const estado = normalizarOpcionEstadoLote(obtenerTextoEstadoLote(item));
		if (estado) estados.set(estado.toLowerCase(), estado);
	});

	return estados.size ? Array.from(estados.values()) : ESTADOS_LOTE_RESPALDO;
};

const consultarEstadosLote = async (signal?: AbortSignal) => {
	const rawData = await consultarPrimerEndpointDisponible(construirUrlsEstadosLote(), signal);
	return normalizarEstadosLote(parseReporteResponse(rawData));
};

const obtenerTextoProyecto = (item: ReporteItem) => {
	if (typeof item === "string" || typeof item === "number") return normalizarTexto(item);
	if (!item || typeof item !== "object") return "";

	const registro = item as Record<string, unknown>;
	const claves = [
		"NombreProyecto",
		"nombreProyecto",
		"Nombre",
		"nombre",
		"Proyecto",
		"proyecto",
		"Descripcion",
		"descripcion",
		"Texto",
		"texto",
		"Text",
		"text",
		"Label",
		"label",
		"Valor",
		"valor",
		"Value",
		"value",
	];
	const candidatos: string[] = [];

	for (const clave of claves) {
		const valor = registro[clave];
		if (typeof valor === "string" || typeof valor === "number") {
			const texto = normalizarTexto(valor);
			if (texto) candidatos.push(texto);
		}
	}

	const entrada = Object.entries(registro).find(([clave, valor]) => {
		const claveNormalizada = clave.toLowerCase();
		return !claveNormalizada.includes("id") && (typeof valor === "string" || typeof valor === "number") && normalizarTexto(valor);
	});
	if (entrada) candidatos.push(normalizarTexto(entrada[1]));

	return candidatos.find((texto) => !pareceIdNumerico(texto)) ?? candidatos[0] ?? "";
};

const obtenerIdProyecto = (item: ReporteItem) => {
	if (!item || typeof item !== "object") return "";

	const registro = item as Record<string, unknown>;
	const clavesProyecto = ["IdProyecto", "idProyecto", "IDProyecto", "ProyectoId", "proyectoId"];
	const clavesGenericas = ["Id", "ID", "id"];
	const tieneIdLote = "IdLote" in registro || "idLote" in registro || "IDLote" in registro;
	const claves = tieneIdLote ? clavesProyecto : [...clavesProyecto, ...clavesGenericas];

	for (const clave of claves) {
		const valor = registro[clave];
		const id = normalizarTexto(valor);
		if (id) return id;
	}

	return "";
};

const obtenerCampoProyecto = (item: ReporteItem, claves: string[]) => {
	if (!item || typeof item !== "object") return "";
	const registro = item as Record<string, unknown>;
	for (const clave of claves) {
		const valor = normalizarTexto(registro[clave]);
		if (valor) return valor;
	}
	return "";
};

const normalizarProyectos = (items: ReporteItem[]): ProyectoSelectItem[] => {
	const proyectos = new Map<string, ProyectoSelectItem>();

	items.forEach((item) => {
		const nombre = obtenerTextoProyecto(item);
		if (!nombre || pareceIdNumerico(nombre)) return;

		const id = obtenerIdProyecto(item);
		const clave = id ? `id:${id}` : `nombre:${nombre.toLowerCase()}`;
		proyectos.set(clave, {
			id,
			nombre,
			codigo: obtenerCampoProyecto(item, ["CodProyecto", "codProyecto", "CodigoProyecto", "Codigo", "codigo"]),
			ubicacion: obtenerCampoProyecto(item, ["Ubicacion", "ubicacion", "Direccion", "direccion"]),
		});
	});

	return Array.from(proyectos.values());
};

const consultarProyectos = async (signal?: AbortSignal) => {
	const rawData = await consultarPrimerEndpointDisponible(construirUrlsProyectos(), signal);
	return normalizarProyectos(parseReporteResponse(rawData));
};

const consultarProyectosDetallados = async (signal?: AbortSignal) => {
	const response = await fetch(`${API_URL}/Proyecto/proyecto_Listar`, { signal });
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	return normalizarProyectos(parseReporteResponse(await response.text()));
};

const combinarProyectos = (selectItems: ProyectoSelectItem[], detalles: ProyectoSelectItem[]) => {
	const base = selectItems.length ? selectItems : detalles;
	return base.map((proyecto) => {
		const detalle = detalles.find((candidato) =>
			(proyecto.id && candidato.id === proyecto.id) ||
			normalizarTerminoBusqueda(candidato.nombre) === normalizarTerminoBusqueda(proyecto.nombre),
		);
		return {
			...proyecto,
			codigo: proyecto.codigo || detalle?.codigo || "",
			ubicacion: proyecto.ubicacion || detalle?.ubicacion || "",
		};
	});
};

const buscarNombreProyectoPorId = (idProyecto: string, proyectos: ProyectoSelectItem[]) => {
	const id = normalizarTexto(idProyecto);
	if (!id) return "";
	return proyectos.find((proyecto) => proyecto.id && proyecto.id === id)?.nombre ?? "";
};

const resolverNombreProyectoLote = (item: ReporteItem, proyectos: ProyectoSelectItem[] = []) => {
	const idProyecto = obtenerIdProyecto(item);
	const nombrePorId = buscarNombreProyectoPorId(idProyecto, proyectos);
	if (nombrePorId) return nombrePorId;

	const candidato = obtenerTextoProyecto(item);
	const nombrePorCandidatoId = buscarNombreProyectoPorId(candidato, proyectos);
	if (nombrePorCandidatoId) return nombrePorCandidatoId;

	if (candidato && !pareceIdNumerico(candidato)) return candidato;
	return candidato || idProyecto || "-";
};

const formatoMoneda = (value: unknown) => {
	const numero = Number(value ?? 0);
	if (!Number.isFinite(numero)) return "S/ 0.00";
	return `S/ ${numero.toFixed(2)}`;
};

const normalizarLotes = (items: ReporteItem[], proyectos: ProyectoSelectItem[] = []): LoteReporteItem[] =>
	items.map((item) => {
		const idProyecto = obtenerIdProyecto(item);
		return {
			IdLote: String(item.IdLote ?? item.ID ?? item.Id ?? "-"),
			IdProyecto: idProyecto,
			CodigoLote: String(item.CodigoLote ?? item.CodLote ?? item.Codigo ?? "-"),
			Proyecto: resolverNombreProyectoLote(item, proyectos),
			Manzana: String(item.Manzana ?? item.Mz ?? "-"),
			NumeroLote: String(item.NumeroLote ?? item.NumLote ?? item.Lote ?? "-"),
			Area: String(item.TamañoMetros2 ?? item.TamanoMetros2 ?? item.Area ?? item.Metros2 ?? "-"),
			Precio: formatoMoneda(item.Precio ?? item.PrecioLote ?? item.Valor),
			EstadoLote: normalizarEstadoLote(item.EstadoLote ?? item.Estado),
		};
	});

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
	return resolver(require("../../assets/splash-icon.png"))?.uri || "";
};

const filtrarLotesLocal = (
	items: LoteReporteItem[],
	estadoLote: string,
	nombreProyecto: string,
	precioDesde: string,
) => {
	const estado = normalizarTerminoBusqueda(estadoLote);
	const proyecto = normalizarTerminoBusqueda(nombreProyecto);
	const precio = Number(precioDesde || 0);

	// ATAMAINE: Fallback local para cuando el controller reporte_Lotes aun no esta publicado en Somee.
	return items.filter((item) => {
		const precioItem = Number(item.Precio.replace(/[^\d.]/g, ""));
		const coincideEstadoFiltro = !estado || normalizarTerminoBusqueda(item.EstadoLote).includes(estado);
		const coincideProyectoFiltro = !proyecto || normalizarTerminoBusqueda(item.Proyecto).includes(proyecto);
		const coincidePrecio = !precioDesde || (Number.isFinite(precioItem) && precioItem >= precio);
		return coincideEstadoFiltro && coincideProyectoFiltro && coincidePrecio;
	});
};

// ATAMAINE: Si el usuario escribe codigo, ubicacion o una coincidencia unica,
// convertimos ese texto al nombre que espera reporte_Lotes en el backend.
const resolverNombreProyectoFiltro = (criterio: string, proyectos: ProyectoSelectItem[]) => {
	const termino = normalizarTerminoBusqueda(criterio);
	if (!termino) return "";

	const exactas = proyectos.filter((proyecto) =>
		[proyecto.id, proyecto.nombre, proyecto.codigo, proyecto.ubicacion]
			.some((valor) => normalizarTerminoBusqueda(valor) === termino),
	);
	if (exactas.length === 1) return exactas[0].nombre;

	const parciales = proyectos.filter((proyecto) => coincideProyecto(proyecto, criterio));
	return parciales.length === 1 ? parciales[0].nombre : criterio.trim();
};

const obtenerProyectosDesdeLotes = (items: LoteReporteItem[]) => {
	const proyectos = new Map<string, ProyectoSelectItem>();

	items.forEach((item) => {
		const proyecto = item.Proyecto.trim();
		if (proyecto && proyecto !== "-" && !pareceIdNumerico(proyecto)) {
			const clave = item.IdProyecto ? `id:${item.IdProyecto}` : `nombre:${proyecto.toLowerCase()}`;
			proyectos.set(clave, { id: item.IdProyecto, nombre: proyecto, codigo: "", ubicacion: "" });
		}
	});

	return Array.from(proyectos.values());
};

const aplicarNombresProyectoALotes = (items: LoteReporteItem[], proyectos: ProyectoSelectItem[]) =>
	items.map((item) => ({
		...item,
		Proyecto: resolverNombreProyectoLote(
			{
				IdProyecto: item.IdProyecto,
				Proyecto: item.Proyecto,
			},
			proyectos,
		),
	}));

const consultarLotesBase = async (signal?: AbortSignal, proyectos: ProyectoSelectItem[] = []) => {
	const response = await fetch(`${API_URL}/Lote/lote_Listar`, { signal });
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const rawData = await response.text();
	return normalizarLotes(parseReporteResponse(rawData), proyectos);
};

const consultarLotesReporte = async (
	estadoLote: string,
	nombreProyecto: string,
	precioDesde: string,
	signal?: AbortSignal,
	proyectos: ProyectoSelectItem[] = [],
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
	return normalizarLotes(parseReporteResponse(rawData), proyectos);
};

const ReporteLotes = ({ navigation }: ReporteLotesProps) => {
	const [estadoLote, setEstadoLote] = useState("");
	const [estadosLote, setEstadosLote] = useState<string[]>(ESTADOS_LOTE_RESPALDO);
	const [mostrarEstadosLote, setMostrarEstadosLote] = useState(false);
	const [cargandoEstadosLote, setCargandoEstadosLote] = useState(false);
	const [nombreProyecto, setNombreProyecto] = useState("");
	const [proyectos, setProyectos] = useState<ProyectoSelectItem[]>([]);
	const [mostrarProyectos, setMostrarProyectos] = useState(false);
	const [cargandoProyectos, setCargandoProyectos] = useState(false);
	const [campoActivo, setCampoActivo] = useState<"estado" | "proyecto" | null>(null);
	const [precioDesde, setPrecioDesde] = useState("");
	const [todosLotes, setTodosLotes] = useState<LoteReporteItem[]>([]);
	const [reporte, setReporte] = useState<LoteReporteItem[]>([]);
	const [cargando, setCargando] = useState(false);
	const [buscado, setBuscado] = useState(false);
	const [mensaje, setMensaje] = useState("");
	const [ultimoFiltro, setUltimoFiltro] = useState("");
	const [horaActual, setHoraActual] = useState(new Date());
	const fetchControllerRef = useRef<AbortController | null>(null);
	const estadosControllerRef = useRef<AbortController | null>(null);
	const proyectosControllerRef = useRef<AbortController | null>(null);

	const cargarEstadosLote = async (signal?: AbortSignal) => {
		try {
			setCargandoEstadosLote(true);
			const estadosApi = await consultarEstadosLote(signal);
			setEstadosLote(estadosApi.length ? estadosApi : ESTADOS_LOTE_RESPALDO);
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			console.error("Error al cargar estados de lote:", error);
			setEstadosLote(ESTADOS_LOTE_RESPALDO);
		} finally {
			if (!signal?.aborted) setCargandoEstadosLote(false);
		}
	};

	const refrescarEstadosLote = () => {
		if (estadosControllerRef.current) estadosControllerRef.current.abort();
		const controller = new AbortController();
		estadosControllerRef.current = controller;
		void cargarEstadosLote(controller.signal);
	};

	const cargarProyectos = async (signal?: AbortSignal) => {
		try {
			setCargandoProyectos(true);
			const [selectResultado, detalleResultado] = await Promise.allSettled([
				consultarProyectos(signal),
				consultarProyectosDetallados(signal),
			]);
			if (signal?.aborted) return;
			const proyectosApi = selectResultado.status === "fulfilled" ? selectResultado.value : [];
			const proyectosDetalle = detalleResultado.status === "fulfilled" ? detalleResultado.value : [];
			const proyectosFinal = combinarProyectos(proyectosApi, proyectosDetalle);
			const proyectosDisponibles = proyectosFinal.length ? proyectosFinal : obtenerProyectosDesdeLotes(todosLotes);
			setProyectos(proyectosDisponibles);
			if (proyectosDisponibles.length) {
				setTodosLotes((actuales) => aplicarNombresProyectoALotes(actuales, proyectosDisponibles));
				setReporte((actuales) => aplicarNombresProyectoALotes(actuales, proyectosDisponibles));
			}
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			// ATAMAINE: Si el select nuevo aun no esta publicado, seguimos con nombres reales desde lote_Listar.
			setProyectos((actuales) => (actuales.length ? actuales : obtenerProyectosDesdeLotes(todosLotes)));
		} finally {
			if (!signal?.aborted) setCargandoProyectos(false);
		}
	};

	const refrescarProyectos = () => {
		if (proyectosControllerRef.current) proyectosControllerRef.current.abort();
		const controller = new AbortController();
		proyectosControllerRef.current = controller;
		void cargarProyectos(controller.signal);
	};

	const alternarEstadosLote = () => {
		if (mostrarEstadosLote) {
			setMostrarEstadosLote(false);
			setCampoActivo(null);
			return;
		}
		setMostrarProyectos(false);
		setMostrarEstadosLote(true);
		setCampoActivo("estado");
		refrescarEstadosLote();
	};

	const alternarProyectos = () => {
		if (mostrarProyectos) {
			setMostrarProyectos(false);
			setCampoActivo(null);
			return;
		}
		setMostrarEstadosLote(false);
		setMostrarProyectos(true);
		setCampoActivo("proyecto");
		refrescarProyectos();
	};

	const seleccionarEstadoLote = (estado: string) => {
		setEstadoLote(estado);
		setMostrarEstadosLote(false);
		setCampoActivo(null);
		Keyboard.dismiss();
	};

	const seleccionarProyecto = (proyecto: ProyectoSelectItem) => {
		setNombreProyecto(proyecto.nombre);
		setMostrarProyectos(false);
		setCampoActivo(null);
		Keyboard.dismiss();
	};

	useEffect(() => {
		const timer = setInterval(() => setHoraActual(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		refrescarEstadosLote();
		refrescarProyectos();
		return () => {
			if (estadosControllerRef.current) estadosControllerRef.current.abort();
			if (proyectosControllerRef.current) proyectosControllerRef.current.abort();
		};
	}, []);

	const cargarLotesIniciales = async () => {
		try {
			setCargando(true);
			setMensaje("");
			const lotesBase = await consultarLotesBase(undefined, proyectos);
			const lotesConProyecto = proyectos.length ? aplicarNombresProyectoALotes(lotesBase, proyectos) : lotesBase;
			setTodosLotes(lotesConProyecto);
			setReporte(lotesConProyecto);
			setProyectos((actuales) => (actuales.length ? actuales : obtenerProyectosDesdeLotes(lotesConProyecto)));
			setBuscado(false);
			setUltimoFiltro("");
			if (!lotesConProyecto.length) setMensaje("No existen lotes registrados.");
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
		setMostrarEstadosLote(false);
		setNombreProyecto("");
		setMostrarProyectos(false);
		setCampoActivo(null);
		Keyboard.dismiss();
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
		const nombreProyectoConsulta = resolverNombreProyectoFiltro(nombreProyecto, proyectos);
		setMostrarEstadosLote(false);
		setMostrarProyectos(false);
		setCampoActivo(null);
		Keyboard.dismiss();

		if (precioDesde.trim() && !Number.isFinite(Number(precioDesde))) {
			setMensaje("Ingresa un precio valido para realizar la busqueda.");
			return;
		}

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
				const respuestaApi = await consultarLotesReporte(
					estadoLote,
					nombreProyectoConsulta,
					precioDesde,
					fetchControllerRef.current.signal,
					proyectos,
				);
				const respuestaConProyecto = proyectos.length ? aplicarNombresProyectoALotes(respuestaApi, proyectos) : respuestaApi;
				const filtradosApi = filtrarLotesLocal(respuestaConProyecto, estadoLote, nombreProyectoConsulta, precioDesde);
				const respaldoLocal = filtrarLotesLocal(todosLotes, estadoLote, nombreProyectoConsulta, precioDesde);
				filtrados = filtradosApi.length ? filtradosApi : respaldoLocal;
			} catch (error) {
				const base = todosLotes.length ? todosLotes : await consultarLotesBase(fetchControllerRef.current.signal, proyectos);
				const baseConProyecto = proyectos.length ? aplicarNombresProyectoALotes(base, proyectos) : base;
				filtrados = filtrarLotesLocal(baseConProyecto, estadoLote, nombreProyectoConsulta, precioDesde);
			}

			const filtradosConProyecto = proyectos.length ? aplicarNombresProyectoALotes(filtrados, proyectos) : filtrados;
			setReporte(filtradosConProyecto);
			setBuscado(true);
			if (!filtradosConProyecto.length) setMensaje("No se encontraron lotes para ese criterio.");
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
	const estadosFiltrados = useMemo(
		() => estadosLote.filter((estado) => coincideEstado(estado, estadoLote)),
		[estadosLote, estadoLote],
	);
	const proyectosFiltrados = useMemo(
		() => proyectos.filter((proyecto) => coincideProyecto(proyecto, nombreProyecto)).slice(0, 20),
		[proyectos, nombreProyecto],
	);
	const totalLotes = todosLotes.length;
	const totalLibres = todosLotes.filter((item) => esEstadoDisponible(item.EstadoLote)).length;
	const totalVendidos = todosLotes.filter((item) => normalizarTerminoBusqueda(item.EstadoLote) === "vendido").length;
	const esColumnaCorta = (key: keyof LoteReporteItem) =>
		key === "Manzana" || key === "NumeroLote" || key === "Area" || key === "Precio";

	const abrirRegistroLote = () => {
		const criterio = normalizarTerminoBusqueda(nombreProyecto);
		const coincidencias = criterio ? proyectos.filter((proyecto) => coincideProyecto(proyecto, nombreProyecto)) : [];
		const proyectoExacto = proyectos.find((proyecto) =>
			normalizarTerminoBusqueda(proyecto.nombre) === criterio
			|| normalizarTerminoBusqueda(proyecto.codigo) === criterio
			|| normalizarTerminoBusqueda(proyecto.id) === criterio,
		);
		const proyectoSeleccionado = proyectoExacto ?? (coincidencias.length === 1 ? coincidencias[0] : null);

		if (!proyectoSeleccionado?.id) {
			// ATAMAINE: RegistrarLote necesita un IdProyecto real; evitamos abrir el
			// formulario con datos incompletos o navegar por ListarProyectos fuera del tab.
			setCampoActivo("proyecto");
			setMostrarProyectos(true);
			setMostrarEstadosLote(false);
			Alert.alert("Selecciona un proyecto", "Escribe o elige un proyecto activo antes de registrar el nuevo lote.");
			return;
		}

		Keyboard.dismiss();
		navigation.navigate("RegistrarLote", {
			idProyecto: proyectoSeleccionado.id,
			proyectoNombre: proyectoSeleccionado.nombre,
		});
	};

	return (
		<View style={styles.container}>
			<View style={styles.backgroundGlowTop} />
			<View style={styles.backgroundGlowBottom} />
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				contentInsetAdjustmentBehavior="automatic"
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<LinearGradient colors={["#061b2b", "#064e5a", "#0f766e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
					<View style={styles.heroToolbar}>
						<TouchableOpacity style={styles.menuButton} onPress={() => navigation.goBack()} accessibilityLabel="Regresar">
							<MaterialCommunityIcons name="arrow-left" size={16} color="#ffffff" />
							{Platform.OS === "web" ? <Text style={styles.backButtonText}>Regresar</Text> : null}
						</TouchableOpacity>
						<View style={styles.liveBadge}>
							<View style={styles.liveDot} />
							<Text style={styles.liveBadgeText}>Tiempo real {horaFormateada}</Text>
						</View>
						<View style={styles.dateCard}>
							<View style={styles.dateLine}>
								<MaterialCommunityIcons name="calendar-month-outline" size={11} color="#bfdbfe" />
								<Text style={styles.dateText}>{fechaFormateada}</Text>
							</View>
							<View style={styles.dateLine}>
								<MaterialCommunityIcons name="clock-outline" size={11} color="#bfdbfe" />
								<Text style={styles.dateText}>{horaFormateada}</Text>
							</View>
						</View>
					</View>

					<View style={styles.heroMainRow}>
						<View style={styles.heroContent}>
							<Text style={styles.title}>Gestion Integral</Text>
							<Text style={styles.title}>de Lotes</Text>
							<Text style={styles.subtitle}>Filtra por estado, proyecto o precio con datos reales del API.</Text>
						</View>
						<View style={styles.peopleScene}>
							<View style={[styles.personBubble, styles.personBubbleBlue]}><MaterialCommunityIcons name="view-grid-outline" size={17} color="#ffffff" /></View>
							<View style={[styles.personBubble, styles.personBubbleGreen]}><MaterialCommunityIcons name="map-marker-radius-outline" size={17} color="#ffffff" /></View>
							<View style={[styles.personBubble, styles.personBubblePurple]}><MaterialCommunityIcons name="cash-multiple" size={17} color="#ffffff" /></View>
							<View style={styles.peopleBase} />
						</View>
					</View>

					<View style={styles.statsGrid}>
						<View style={styles.statCard}>
							<View style={[styles.statIconWrap, { backgroundColor: "#dbeafe" }]}><MaterialCommunityIcons name="view-grid" size={13} color="#2563eb" /></View>
							<Text style={styles.statLabel}>Registrados</Text>
							{cargando ? <ActivityIndicator size="small" color="#2563eb" style={styles.statLoader} /> : <Text style={styles.statValue}>{totalLotes}</Text>}
							<Text style={styles.statCaption}>Total de lotes</Text>
							<View style={[styles.statAccentLine, { backgroundColor: "#2563eb" }]} />
						</View>
						<View style={styles.statCard}>
							<View style={[styles.statIconWrap, { backgroundColor: "#d1fae5" }]}><MaterialCommunityIcons name="check-circle-outline" size={13} color="#059669" /></View>
							<Text style={styles.statLabel}>Libres</Text>
							<Text style={styles.statValue}>{totalLibres}</Text>
							<Text style={styles.statCaption}>Disponibles</Text>
							<View style={[styles.statAccentLine, { backgroundColor: "#10b981" }]} />
						</View>
						<View style={styles.statCard}>
							<View style={[styles.statIconWrap, { backgroundColor: "#ffe4e6" }]}><MaterialCommunityIcons name="home-outline" size={13} color="#e11d48" /></View>
							<Text style={styles.statLabel}>Vendidos</Text>
							<Text style={styles.statValue}>{totalVendidos}</Text>
							<Text style={styles.statCaption}>Comprometidos</Text>
							<View style={[styles.statAccentLine, { backgroundColor: "#f43f5e" }]} />
						</View>
						<TouchableOpacity style={styles.statCard} activeOpacity={0.82} onPress={cargarLotesIniciales}>
							<View style={[styles.statIconWrap, { backgroundColor: "#f3e8ff" }]}><MaterialCommunityIcons name="refresh" size={13} color="#7c3aed" /></View>
							<Text style={styles.statLabel}>Ultimo Filtro</Text>
							<Text style={[styles.statValue, styles.statValueText]} numberOfLines={2}>{ultimoFiltro || "Sin filtro"}</Text>
							<Text style={styles.statCaption}>Toca para actualizar</Text>
							<View style={[styles.statAccentLine, { backgroundColor: "#8b5cf6" }]} />
						</TouchableOpacity>
					</View>
				</LinearGradient>

				<View style={styles.searchCard}>
					<Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
					<Text style={styles.fieldLabel}>Estado del lote</Text>
					<View style={[styles.selectorWrap, styles.selectorWrapTop]}>
						<View style={[styles.selectorShell, campoActivo === "estado" ? styles.selectorShellFocused : null]}>
							<MaterialCommunityIcons name="tag-outline" size={17} color={campoActivo === "estado" ? "#0f766e" : "#8aa0b5"} />
							<TextInput
								value={estadoLote}
								onChangeText={(texto) => { setEstadoLote(texto); setMostrarEstadosLote(true); setMostrarProyectos(false); }}
								onFocus={() => { setCampoActivo("estado"); setMostrarEstadosLote(true); setMostrarProyectos(false); if (!estadosLote.length) refrescarEstadosLote(); }}
								placeholder={cargandoEstadosLote ? "Cargando estados..." : "Escribe o selecciona un estado"}
								placeholderTextColor="#91a3b6"
								style={styles.selectorInput}
								returnKeyType="next"
								autoCorrect={false}
								accessibilityLabel="Filtrar por estado del lote"
							/>
							{estadoLote ? <TouchableOpacity style={styles.selectorClearButton} onPress={() => { setEstadoLote(""); setMostrarEstadosLote(true); }} accessibilityLabel="Borrar estado"><MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
							<TouchableOpacity style={styles.selectorIconButton} onPress={alternarEstadosLote} accessibilityLabel="Mostrar estados">
								{cargandoEstadosLote ? <ActivityIndicator size="small" color="#0f766e" /> : <MaterialCommunityIcons name={mostrarEstadosLote ? "chevron-up" : "chevron-down"} size={19} color="#0f766e" />}
							</TouchableOpacity>
						</View>
						{mostrarEstadosLote ? (
							<View style={styles.optionsBox}>
								<View style={styles.optionsHeader}><Text style={styles.optionsHeaderText}>Estados disponibles</Text><Text style={styles.optionsHeaderText}>{estadosFiltrados.length}</Text></View>
								{estadosFiltrados.length ? estadosFiltrados.map((estado) => {
									const seleccionado = normalizarTerminoBusqueda(estadoLote) === normalizarTerminoBusqueda(estado);
									return (
										<TouchableOpacity key={estado} style={[styles.optionItem, seleccionado ? styles.optionItemActive : null]} activeOpacity={0.82} onPress={() => seleccionarEstadoLote(estado)}>
											<View style={styles.optionIcon}><MaterialCommunityIcons name={esEstadoDisponible(estado) ? "check-circle-outline" : "tag-outline"} size={16} color="#0f766e" /></View>
											<View style={styles.optionContent}><Text style={styles.optionTitle}>{estado}</Text><Text style={styles.optionMeta}>Seleccionar estado del lote</Text></View>
											{seleccionado ? <MaterialCommunityIcons name="check-circle" size={17} color="#10b981" /> : <MaterialCommunityIcons name="chevron-right" size={16} color="#94a3b8" />}
										</TouchableOpacity>
									);
								}) : <View style={styles.optionEmpty}><MaterialCommunityIcons name="text-search" size={22} color="#94a3b8" /><Text style={styles.optionEmptyText}>No hay estados que coincidan con "{estadoLote}".</Text></View>}
							</View>
						) : null}
					</View>

					<Text style={styles.fieldLabel}>Proyecto</Text>
					<View style={styles.selectorWrap}>
						<View style={[styles.selectorShell, campoActivo === "proyecto" ? styles.selectorShellFocused : null]}>
							<MaterialCommunityIcons name="office-building-marker-outline" size={17} color={campoActivo === "proyecto" ? "#0f766e" : "#8aa0b5"} />
							<TextInput
								value={nombreProyecto}
								onChangeText={(texto) => { setNombreProyecto(texto); setMostrarProyectos(true); setMostrarEstadosLote(false); }}
								onFocus={() => { setCampoActivo("proyecto"); setMostrarProyectos(true); setMostrarEstadosLote(false); if (!proyectos.length) refrescarProyectos(); }}
								placeholder={cargandoProyectos ? "Cargando proyectos..." : "Escribe nombre, codigo o ubicacion"}
								placeholderTextColor="#91a3b6"
								style={styles.selectorInput}
								returnKeyType="search"
								autoCorrect={false}
								autoCapitalize="words"
								onSubmitEditing={consultarReporte}
								accessibilityLabel="Filtrar por proyecto"
							/>
							{nombreProyecto ? <TouchableOpacity style={styles.selectorClearButton} onPress={() => { setNombreProyecto(""); setMostrarProyectos(true); }} accessibilityLabel="Borrar proyecto"><MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
							<TouchableOpacity style={styles.selectorIconButton} onPress={alternarProyectos} accessibilityLabel="Mostrar proyectos">
								{cargandoProyectos ? <ActivityIndicator size="small" color="#0f766e" /> : <MaterialCommunityIcons name={mostrarProyectos ? "chevron-up" : "chevron-down"} size={19} color="#0f766e" />}
							</TouchableOpacity>
						</View>
						{mostrarProyectos ? (
							<View style={styles.optionsBox}>
								<View style={styles.optionsHeader}><Text style={styles.optionsHeaderText}>Proyectos activos</Text><Text style={styles.optionsHeaderText}>{proyectosFiltrados.length} coincidencia{proyectosFiltrados.length === 1 ? "" : "s"}</Text></View>
								{proyectosFiltrados.length ? (
									<ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
										{proyectosFiltrados.map((proyecto) => {
											const seleccionado = normalizarTerminoBusqueda(nombreProyecto) === normalizarTerminoBusqueda(proyecto.nombre);
											const detalle = [proyecto.codigo ? `Cod. ${proyecto.codigo}` : "", proyecto.ubicacion].filter(Boolean).join("  |  ");
											return (
												<TouchableOpacity key={proyecto.id || `${proyecto.nombre}-${proyecto.codigo}`} style={[styles.optionItem, seleccionado ? styles.optionItemActive : null]} activeOpacity={0.82} onPress={() => seleccionarProyecto(proyecto)}>
													<View style={styles.optionIcon}><MaterialCommunityIcons name="office-building-marker-outline" size={16} color="#0f766e" /></View>
													<View style={styles.optionContent}><Text style={styles.optionTitle} numberOfLines={1}>{proyecto.nombre}</Text><Text style={styles.optionMeta} numberOfLines={2}>{detalle || "Proyecto activo"}</Text></View>
													{seleccionado ? <MaterialCommunityIcons name="check-circle" size={17} color="#10b981" /> : <MaterialCommunityIcons name="chevron-right" size={16} color="#94a3b8" />}
												</TouchableOpacity>
											);
										})}
									</ScrollView>
								) : <View style={styles.optionEmpty}><MaterialCommunityIcons name="text-search" size={22} color="#94a3b8" /><Text style={styles.optionEmptyText}>No hay proyectos que coincidan con "{nombreProyecto}".</Text></View>}
							</View>
						) : null}
					</View>

					<Text style={styles.fieldLabel}>Precio desde</Text>
					<View style={[styles.inputShell, styles.priceShell]}>
						<MaterialCommunityIcons name="cash" size={17} color="#8aa0b5" />
						<TextInput
							value={precioDesde}
							onChangeText={(texto) => setPrecioDesde(limpiarPrecio(texto))}
							onFocus={() => { setCampoActivo(null); setMostrarEstadosLote(false); setMostrarProyectos(false); }}
							placeholder="Ej. 15000.00"
							placeholderTextColor="#9aa9ba"
							style={styles.input}
							keyboardType="decimal-pad"
							returnKeyType="search"
							onSubmitEditing={consultarReporte}
						/>
					</View>

					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.actionButton} onPress={consultarReporte}><LinearGradient colors={["#1f75ff", "#0657d9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="magnify" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Buscar</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={abrirRegistroLote}><LinearGradient colors={["#0f9f73", "#047857"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="plus-circle-outline" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Nuevo</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={limpiarFiltro}><LinearGradient colors={["#6b7280", "#475569"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="trash-can-outline" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Limpiar</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={[styles.actionButton, (!loteParaPdf.length || cargando) && styles.buttonDisabled]} onPress={generarPDF} disabled={!loteParaPdf.length || cargando}><LinearGradient colors={["#f59e0b", "#f97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="file-pdf-box" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>PDF</Text></LinearGradient></TouchableOpacity>
					</View>
				</View>

				<View style={styles.contentCard}>
					<View style={styles.contentTitleRow}><MaterialCommunityIcons name="view-list-outline" size={18} color="#2563eb" /><Text style={styles.contentTitle}>Listado del Reporte</Text></View>
					{cargando ? <ActivityIndicator size="large" color="#2563eb" style={styles.loader} /> : null}
					{!cargando && mensaje ? <View style={styles.messageBox}><Text style={styles.messageText}>{mensaje}</Text></View> : null}
					{!cargando && buscado && reporte.length > 0 ? <Text selectable style={styles.resultCounter}>Mostrando {reporte.length} resultado{reporte.length === 1 ? "" : "s"} para: {ultimoFiltro}</Text> : null}
					{!cargando && buscado && reporte.length === 0 && !mensaje ? <View style={styles.emptyState}><View style={styles.emptyIconWrap}><MaterialCommunityIcons name="file-search-outline" size={28} color="#0f766e" /></View><Text style={styles.emptyTitle}>Sin resultados</Text><Text style={styles.emptyText}>No se encontraron lotes para los filtros ingresados.</Text></View> : null}
					{!cargando && listadoMostrar.length > 0 ? (
						<View style={styles.tableWrapper}>
							<LinearGradient colors={["#0f2f89", "#184ec8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tableHeaderRow}>
								{COLUMNAS_REPORTE.map((columna) => (
									<View key={columna.key} style={[styles.tableHeaderCell, { flex: columna.flex }]}>
										<Text style={styles.tableHeaderText}>{columna.label}</Text>
									</View>
								))}
								<View style={styles.tableActionHeaderCell}><Text style={styles.tableHeaderText}>Ver</Text></View>
							</LinearGradient>
							{listadoMostrar.map((item, index) => (
								<View key={index} style={[styles.tableDataRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
									{COLUMNAS_REPORTE.map((columna) => (
										<View key={`${index}-${columna.key}`} style={[styles.tableDataCell, { flex: columna.flex }]}>
											{columna.key === "EstadoLote" ? (
												<View style={[styles.estadoBadge, esEstadoDisponible(String(item.EstadoLote)) ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo]}>
											<Text selectable style={[styles.estadoBadgeText, esEstadoDisponible(String(item.EstadoLote)) ? styles.estadoBadgeTextActivo : styles.estadoBadgeTextInactivo]}>{String(item[columna.key] ?? "-")}</Text>
										</View>
									) : (
										<Text selectable style={[styles.tableDataText, esColumnaCorta(columna.key) ? styles.tableDataTextTight : null]} numberOfLines={2} adjustsFontSizeToFit={esColumnaCorta(columna.key)} minimumFontScale={0.78}>
													{String(item[columna.key] ?? "-")}
												</Text>
											)}
										</View>
									))}
								<View style={styles.tableActionCell}>
									<TouchableOpacity style={styles.verButton} onPress={() => abrirProyectoDelLote(navigation, item)}>
										<MaterialCommunityIcons name="eye-outline" size={14} color="#0f766e" />
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

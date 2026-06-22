import {
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	ScrollView,
	Alert,
	Image,
	Platform,
	TextInput,
	Keyboard,
	StyleSheet,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import reporteBaseStyles from "./ReporteClientesStyles";
import { API_URL } from "../config/apiUrl";
import i18n from "../i18n";

// ATAMAINE: URL base del backend .NET donde consultamos la lista real de proyectos.
// ATAMAINE: API_URL viene de config/apiUrl para que web use proxy CORS y movil use API real.
// ATAMAINE: Datos fijos que usamos para personalizar la cabecera y pie del PDF.
const EMPRESA_NOMBRE = "Residencial Santa Fe";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "RSF";

// ATAMAINE: Tipo genérico para leer la respuesta cruda del backend antes de normalizarla.
type ReporteItem = Record<string, unknown>;

// ATAMAINE: Estructura final que la pantalla usa para pintar proyectos reales del API.
type ProyectoReporteItem = {
        IdProyecto: string;
        CodProyecto: string;
        Nombre: string;
        Ubicacion: string;
        Hectareas: string;
        PartidaRegistral: string;
        Estado: string;
};

// ATAMAINE: Propiedad de navegacion que llega desde React Navigation.
type ReporteProyectosProps = {
	navigation: any;
};

type ProyectoSelectItem = {
	id: string;
	nombre: string;
	codigo: string;
	ubicacion: string;
	estado: string;
};

// ATAMAINE: Proyectos reutiliza la base visual compacta de Clientes, pero el buscador
// avanzado vive aqui para no cambiar el aspecto ni el comportamiento de otros reportes.
const selectorStyles = StyleSheet.create({
	fieldLabel: {
		fontSize: 9,
		fontWeight: "900",
		color: "#334155",
		marginBottom: 6,
	},
	selectorWrap: {
		position: "relative",
		zIndex: 20,
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
		maxHeight: 238,
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
		maxHeight: 200,
	},
	optionItem: {
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		gap: 9,
		paddingHorizontal: 10,
		paddingVertical: 8,
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
	optionContent: {
		flex: 1,
		minWidth: 0,
	},
	optionTitle: {
		fontSize: 10,
		lineHeight: 13,
		fontWeight: "900",
		color: "#102033",
	},
	optionMeta: {
		marginTop: 3,
		fontSize: 8,
		lineHeight: 10,
		fontWeight: "700",
		color: "#64748b",
	},
	optionEmpty: {
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 18,
		gap: 5,
	},
	optionEmptyText: {
		fontSize: 9,
		fontWeight: "800",
		color: "#64748b",
		textAlign: "center",
	},
});

const styles = { ...reporteBaseStyles, ...selectorStyles };

const API_BASE_URL = API_URL.replace(/\/+$/, "");

// ATAMAINE: Escapamos caracteres especiales para que el HTML del PDF no se rompa con datos reales.
const escapeHtml = (value: unknown) =>
	String(value ?? "-")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");

// ATAMAINE: Parseamos la respuesta JSON del backend que puede venir como string anidado.
const parseReporteResponse = (payload: string): ReporteItem[] => {
	if (!payload) {
		return [];
	}

	try {
		const parsed = JSON.parse(payload);

		if (Array.isArray(parsed)) {
			return parsed;
		}

		if (typeof parsed === "string") {
			const nested = JSON.parse(parsed);
			return Array.isArray(nested) ? nested : [];
		}

		// Si viene un objeto con la data dentro de propiedades comunes (d, Data, data, result, Resultado)
		const tryKeys = (obj: any) => {
			const keys = ["d", "Data", "data", "result", "Resultado", "resultados", "Resultados"];
			for (const k of keys) {
				if (Object.prototype.hasOwnProperty.call(obj, k)) {
					const v = obj[k];
					if (Array.isArray(v)) return v;
					if (typeof v === "string") {
						try {
							const parsed2 = JSON.parse(v);
							if (Array.isArray(parsed2)) return parsed2;
						} catch (e) {
							// ignore
						}
					}
				}
			}

			// Si el objeto tiene una sola propiedad cuyo valor es un array o JSON string
			const objKeys = Object.keys(obj);
			if (objKeys.length === 1) {
				const val = obj[objKeys[0]];
				if (Array.isArray(val)) return val;
				if (typeof val === "string") {
					try {
						const parsed3 = JSON.parse(val);
						if (Array.isArray(parsed3)) return parsed3;
					} catch (e) {
						// ignore
					}
				}
			}

			return null;
		};

		const extracted = tryKeys(parsed as any);
		if (extracted) return extracted as ReporteItem[];

		return [];
	} catch (error) {
		console.error("Error al parsear reporte:", error);
		return [];
	}
};

const normalizarTexto = (value: unknown) => String(value ?? "").trim();

// ATAMAINE: Quitamos tildes y diferencias de mayusculas para que la busqueda sea tolerante.
const normalizarTerminoBusqueda = (value: unknown) =>
	normalizarTexto(value)
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();

const coincideProyecto = (proyecto: ProyectoSelectItem | ProyectoReporteItem, criterio: string) => {
	const termino = normalizarTerminoBusqueda(criterio);
	if (!termino) return true;

	const nombre = "nombre" in proyecto ? proyecto.nombre : proyecto.Nombre;
	const codigo = "codigo" in proyecto ? proyecto.codigo : proyecto.CodProyecto;
	const ubicacion = "ubicacion" in proyecto ? proyecto.ubicacion : proyecto.Ubicacion;
	const id = "id" in proyecto ? proyecto.id : proyecto.IdProyecto;

	return [nombre, codigo, ubicacion, id].some((valor) => normalizarTerminoBusqueda(valor).includes(termino));
};

const filtrarProyectosLocal = (items: ProyectoReporteItem[], criterio: string) =>
	items.filter((item) => coincideProyecto(item, criterio));

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

const construirUrlsProyectosSelect = () => [
	`${API_BASE_URL}/api/Proyecto/proyecto_Listar_Select`,
	`${API_BASE_URL}/Proyecto/proyecto_Listar_Select`,
	`${API_BASE_URL}/api/Proyecto/proyecto_ListarSelect`,
	`${API_BASE_URL}/Proyecto/proyecto_ListarSelect`,
	`${API_BASE_URL}/api/Proyecto/proyecto_Listar`,
	`${API_BASE_URL}/Proyecto/proyecto_Listar`,
];

// ATAMAINE: Ajustamos columnas propias de proyectos para que entren en móvil sin campos de clientes.
const COLUMNAS_REPORTE: Array<{
	key: keyof ProyectoReporteItem;
	label: string;
	flex: number;
}> = [
        { key: "IdProyecto", label: "ID", flex: 0.55 },
        { key: "CodProyecto", label: "Cod.", flex: 0.72 },
        { key: "Nombre", label: "Proyecto", flex: 1.15 },
        { key: "Ubicacion", label: "Ubicacion", flex: 1.1 },
        { key: "Hectareas", label: "Has.", flex: 0.62 },
        { key: "PartidaRegistral", label: "Partida", flex: 1.0 },
        { key: "Estado", label: "Estado", flex: 0.82 },
];

// ATAMAINE: Unificamos el texto del estado para mostrarlo limpio en pantalla segun lo que venga en la API.
const normalizarEstado = (estado: unknown) => {
        const estadoTexto = String(estado ?? "").trim().toLowerCase();
        const estadosActivos = ["activo", "a", "1", "true", "vigente", "registrado"];
        // ATAMAINE: La API puede devolver "X" para registros anulados; en el reporte siempre se muestra como Inactivo.
        const estadosInactivos = ["inactivo", "i", "x", "0", "false", "anulado", "borrado", "desactivado"];

	if (estadosActivos.includes(estadoTexto)) {
		return "Activo";
	}

	if (estadosInactivos.includes(estadoTexto)) {
		return "Inactivo";
	}

	if (estadoTexto) {
		return estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1);
	}

	return "Activo";
};

// ATAMAINE: Normalizamos proyectos desde proyecto_Listar o reporte_Proyectos para una tabla estable.
const normalizarProyectos = (items: ReporteItem[]): ProyectoReporteItem[] =>
        items.map((item) => ({
                IdProyecto: String(item.IdProyecto ?? item.ID ?? item.Id ?? "-"),
                // ATAMAINE: Mostramos el codigo y partida porque el API de reporte de proyectos los devuelve como datos reales.
                CodProyecto: String(item.CodProyecto ?? item.Codigo ?? item.CodigoProyecto ?? "-"),
                Nombre: String(item.Nombre ?? item.Proyecto ?? "-"),
                Ubicacion: String(item.Ubicacion ?? item.Direccion ?? "-"),
                Hectareas: String(item.NumeroHectareas ?? item.Hectareas ?? "-"),
                PartidaRegistral: String(item.PartidaRegistral ?? item.Partida ?? "-"),
                Estado: normalizarEstado(item.Estado),
        }));

const obtenerTextoProyectoSelect = (item: ReporteItem) => {
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

	for (const clave of claves) {
		const texto = normalizarTexto(registro[clave]);
		if (texto && !/^\d+$/.test(texto)) return texto;
	}

	const entrada = Object.entries(registro).find(([clave, valor]) => {
		const claveNormalizada = clave.toLowerCase();
		const texto = normalizarTexto(valor);
		return !claveNormalizada.includes("id") && texto && !/^\d+$/.test(texto);
	});

	return entrada ? normalizarTexto(entrada[1]) : "";
};

const obtenerIdProyectoSelect = (item: ReporteItem) => {
	if (!item || typeof item !== "object") return "";

	const registro = item as Record<string, unknown>;
	const claves = ["IdProyecto", "idProyecto", "IDProyecto", "ProyectoId", "proyectoId", "Id", "ID", "id"];

	for (const clave of claves) {
		const id = normalizarTexto(registro[clave]);
		if (id) return id;
	}

	return "";
};

const obtenerCampoProyectoSelect = (item: ReporteItem, claves: string[]) => {
	if (!item || typeof item !== "object") return "";
	const registro = item as Record<string, unknown>;

	for (const clave of claves) {
		const valor = normalizarTexto(registro[clave]);
		if (valor) return valor;
	}

	return "";
};

const normalizarProyectosSelect = (items: ReporteItem[]): ProyectoSelectItem[] => {
	const proyectos = new Map<string, ProyectoSelectItem>();

	items.forEach((item) => {
		const nombre = obtenerTextoProyectoSelect(item);
		if (!nombre) return;

		const id = obtenerIdProyectoSelect(item);
		const clave = id ? `id:${id}` : `nombre:${nombre.toLowerCase()}`;
		proyectos.set(clave, {
			id,
			nombre,
			codigo: obtenerCampoProyectoSelect(item, ["CodProyecto", "codProyecto", "CodigoProyecto", "Codigo", "codigo"]),
			ubicacion: obtenerCampoProyectoSelect(item, ["Ubicacion", "ubicacion", "Direccion", "direccion"]),
			estado: normalizarEstado(obtenerCampoProyectoSelect(item, ["Estado", "estado"])),
		});
	});

	return Array.from(proyectos.values());
};

const consultarProyectosSelect = async (signal?: AbortSignal) => {
	const rawData = await consultarPrimerEndpointDisponible(construirUrlsProyectosSelect(), signal);
	return normalizarProyectosSelect(parseReporteResponse(rawData));
};

const obtenerSelectDesdeProyectos = (items: ProyectoReporteItem[]) => {
	const proyectos = new Map<string, ProyectoSelectItem>();

	items.forEach((item) => {
		const nombre = normalizarTexto(item.Nombre);
		if (!nombre || nombre === "-") return;

		const id = normalizarTexto(item.IdProyecto);
		const clave = id ? `id:${id}` : `nombre:${nombre.toLowerCase()}`;
		proyectos.set(clave, {
			id,
			nombre,
			codigo: item.CodProyecto === "-" ? "" : normalizarTexto(item.CodProyecto),
			ubicacion: item.Ubicacion === "-" ? "" : normalizarTexto(item.Ubicacion),
			estado: item.Estado,
		});
	});

	return Array.from(proyectos.values());
};

// ATAMAINE: El endpoint Select define los proyectos activos y proyecto_Listar completa codigo/ubicacion.
const combinarProyectosSelect = (selectItems: ProyectoSelectItem[], proyectos: ProyectoReporteItem[]) => {
	const detalles = obtenerSelectDesdeProyectos(proyectos);
	const base = selectItems.length
		? selectItems.filter((item) => esEstadoActivo(item.estado))
		: detalles.filter((item) => esEstadoActivo(item.estado));

	return base.map((item) => {
		const detalle = detalles.find((candidato) =>
			(item.id && candidato.id === item.id) ||
			normalizarTerminoBusqueda(candidato.nombre) === normalizarTerminoBusqueda(item.nombre),
		);

		return {
			...item,
			codigo: item.codigo || detalle?.codigo || "",
			ubicacion: item.ubicacion || detalle?.ubicacion || "",
			estado: item.estado || detalle?.estado || "Activo",
		};
	});
};

// ATAMAINE: Detectamos estados para pintarlos distinto dentro de la tabla sin cambiar la data real.
const esEstadoActivo = (estado: string) => estado.trim().toLowerCase() === "activo";

// ATAMAINE: Desde Ver abrimos el tab de proyectos y enviamos el ID/nombre para remarcar el proyecto exacto.
const abrirProyectoRegistrado = (navigation: any, item: ProyectoReporteItem) => {
	navigation.navigate("MainTabs", {
		screen: i18n.t("btProyectos"),
		params: {
			proyectoSeleccionadoId: item.IdProyecto,
			proyectoSeleccionadoNombre: item.Nombre,
		},
	});
};

const obtenerLogoPdfUri = () => {
	// ATAMAINE: En web Image.resolveAssetSource puede no existir; evitamos pantalla blanca al abrir reportes.
	const resolver = (Image as any).resolveAssetSource;
	if (typeof resolver !== "function") {
		return "";
	}

	return resolver(require("../assets/splash-icon.png"))?.uri || "";
};

// ATAMAINE: Fuente principal del listado: proyectos registrados directamente desde el modulo Proyecto.
const consultarProyectosRegistrados = async (signal?: AbortSignal) => {
	const response = await fetch(`${API_URL}/Proyecto/proyecto_Listar`, { signal });

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}

	const rawData = await response.text();
	return normalizarProyectos(parseReporteResponse(rawData));
};

const ReporteProyectos = ({ navigation }: ReporteProyectosProps) => {
	const [datoBuscar, setDatoBuscar] = useState("");
	const [proyectosSelect, setProyectosSelect] = useState<ProyectoSelectItem[]>([]);
	const [mostrarProyectosSelect, setMostrarProyectosSelect] = useState(false);
	const [selectorEnFoco, setSelectorEnFoco] = useState(false);
	const [cargandoProyectosSelect, setCargandoProyectosSelect] = useState(false);
	const [todosProyectos, setTodosProyectos] = useState<ProyectoReporteItem[]>([]);
	const [reporte, setReporte] = useState<ProyectoReporteItem[]>([]);
	const [cargando, setCargando] = useState(false);
	const [buscado, setBuscado] = useState(false);
	const [mensaje, setMensaje] = useState("");
	const [ultimoFiltro, setUltimoFiltro] = useState("");
	const [horaActual, setHoraActual] = useState(new Date());

	// ATAMAINE: Actualizamos el reloj cada segundo para mantener la UI y el PDF en tiempo real.
	useEffect(() => {
		const timer = setInterval(() => {
			setHoraActual(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	// Refs para cancelar peticiones anteriores y evitar respuestas fuera de orden.
	const fetchControllerRef = useRef<AbortController | null>(null);
	const proyectoSelectControllerRef = useRef<AbortController | null>(null);

	const cargarProyectosSelect = async (signal?: AbortSignal) => {
		try {
			setCargandoProyectosSelect(true);
			const proyectosApi = await consultarProyectosSelect(signal);
			const proyectosFinal = combinarProyectosSelect(proyectosApi, todosProyectos);
			setProyectosSelect(proyectosFinal);
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			// ATAMAINE: Si el select nuevo aun no esta publicado, usamos los nombres cargados por proyecto_Listar.
			setProyectosSelect((actuales) => (actuales.length ? actuales : obtenerSelectDesdeProyectos(todosProyectos)));
		} finally {
			if (!signal?.aborted) setCargandoProyectosSelect(false);
		}
	};

	const refrescarProyectosSelect = () => {
		if (proyectoSelectControllerRef.current) proyectoSelectControllerRef.current.abort();
		const controller = new AbortController();
		proyectoSelectControllerRef.current = controller;
		void cargarProyectosSelect(controller.signal);
	};

	const alternarProyectosSelect = () => {
		if (mostrarProyectosSelect) {
			setMostrarProyectosSelect(false);
			return;
		}

		setMostrarProyectosSelect(true);
		setSelectorEnFoco(true);
		refrescarProyectosSelect();
	};

	const seleccionarProyectoSelect = (proyecto: ProyectoSelectItem) => {
		setDatoBuscar(proyecto.nombre);
		setMostrarProyectosSelect(false);
		setSelectorEnFoco(false);
		Keyboard.dismiss();
		void consultarReporte(proyecto.nombre);
	};

	useEffect(() => {
		refrescarProyectosSelect();
		return () => {
			if (proyectoSelectControllerRef.current) proyectoSelectControllerRef.current.abort();
		};
	}, []);

	// Cargar proyectos iniciales (extraído para poder llamarlo desde UI - refresh)
	const cargarProyectosIniciales = async () => {
		try {
			setCargando(true);
			setMensaje("");
			const proyectosBase = await consultarProyectosRegistrados();

			setTodosProyectos(proyectosBase);
			setReporte(proyectosBase);
			setProyectosSelect((actuales) => combinarProyectosSelect(actuales, proyectosBase));
			setBuscado(false);
			setUltimoFiltro("");

			if (!proyectosBase.length) {
				setMensaje("No existen proyectos registrados.");
			}
		} catch (error) {
			console.error("Error al cargar proyectos registrados:", error);
			setTodosProyectos([]);
			setReporte([]);
			setMensaje("No se pudo cargar la lista de proyectos.");
		} finally {
			setCargando(false);
		}
	};

	// Polling periódico para mantener la lista completa en tiempo real (solo actualiza todosClientes y reporte si no hay filtro activo)
	useEffect(() => {
		let mounted = true;
		const refresh = async () => {
			try {
				const controller = new AbortController();
				fetchControllerRef.current = controller;
				const signal = controller.signal;
				// Si hay un filtro activo, refrescamos SOLO los resultados filtrados para mantenerlos en tiempo real
				if (buscado && ultimoFiltro) {
					const resp = await fetch(`${API_URL}/Reporte/reporte_Proyectos/${encodeURIComponent(ultimoFiltro)}`, { signal });
					if (!resp.ok) return;
					const raw = await resp.text();
					const respuestaApi = normalizarProyectos(parseReporteResponse(raw));
					const filtradosApi = filtrarProyectosLocal(respuestaApi, ultimoFiltro);
					const respaldoLocal = filtrarProyectosLocal(todosProyectos, ultimoFiltro);
					const filtrados = filtradosApi.length ? filtradosApi : respaldoLocal;
					if (!mounted) return;
					setReporte(filtrados);
					return;
				}

				const proyectos = await consultarProyectosRegistrados(signal);
				if (!mounted) return;
				setTodosProyectos(proyectos);
				setProyectosSelect((actuales) => combinarProyectosSelect(actuales, proyectos));
				// Si no estamos mostrando resultados filtrados, mantenemos el listado inferior al dia
				if (!buscado) setReporte(proyectos);
			} catch (err) {
				// ignore polling errors silently
			}
		};

		// refresh cada 15 segundos
		refresh();
		const iv = setInterval(refresh, 15000);

		return () => {
			mounted = false;
			clearInterval(iv);
			if (fetchControllerRef.current) fetchControllerRef.current.abort();
		};
	}, [buscado, ultimoFiltro]);

	const limpiarFiltro = async () => {
		setDatoBuscar("");
		setMostrarProyectosSelect(false);
		setSelectorEnFoco(false);
		Keyboard.dismiss();
		setUltimoFiltro("");
		setMensaje("");
		setBuscado(false);

		// Volver a cargar desde el API en tiempo real para asegurar datos frescos
		try {
			setCargando(true);
			const proyectosBase = await consultarProyectosRegistrados();
			setTodosProyectos(proyectosBase);
			setReporte(proyectosBase);
			setProyectosSelect((actuales) => combinarProyectosSelect(actuales, proyectosBase));
		} catch (error) {
			console.error("Error al recargar proyectos al limpiar filtro:", error);
			setTodosProyectos([]);
			setReporte([]);
			setMensaje("No se pudo recargar la lista de proyectos.");
		} finally {
			setCargando(false);
		}
	};

	const horaFormateada = horaActual.toLocaleTimeString("es-PE", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const fechaFormateada = horaActual.toLocaleDateString("es-PE", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const logoPdfUri = obtenerLogoPdfUri();

	const proyectoParaPdf = buscado && ultimoFiltro ? reporte : todosProyectos;

	// ATAMAINE: Al entrar a la pantalla cargamos una sola vez todos los proyectos desde el API en TIEMPO REAL.
	useEffect(() => {
		cargarProyectosIniciales();
	}, []);

	// ATAMAINE: Construimos el PDF en tabla horizontal para que se vea como la lista del reporte.
	const construirHtmlReporte = () => {
		const numeroDocumento = `RPT-PRO-${horaActual
			.toISOString()
			.replace(/[-:TZ.]/g, "")
			.slice(0, 14)}`;
		const logoHtml = logoPdfUri
			? `<img src="${escapeHtml(logoPdfUri)}" style="width: 68px; height: 68px; border-radius: 16px; object-fit: contain; background: white; padding: 8px; border: 1px solid rgba(255,255,255,0.18);" />`
			: `<div style="width: 68px; height: 68px; border-radius: 16px; background: white; color: #0f766e; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; border: 1px solid rgba(255,255,255,0.18);">${escapeHtml(EMPRESA_SIGLAS)}</div>`;

                const columnasPdf = [
                        { label: "N°", width: "7%" },
                        { label: "ID", width: "8%" },
                        { label: "Cod.", width: "10%" },
                        { label: "Proyecto", width: "20%" },
                        { label: "Ubicacion", width: "20%" },
                        { label: "Hectareas", width: "10%" },
                        { label: "Partida", width: "13%" },
                        { label: "Estado", width: "12%" },
                ];

		const colgroupHtml = columnasPdf.map((columna) => `<col style="width: ${columna.width};" />`).join("");

		const encabezadosHtml = columnasPdf
			.map((columna) => `<th style="padding: 12px 10px; background: #1d4ed8; color: white; font-size: 12px; font-weight: 700; border: 1px solid #d9e6f2; text-align: center;">${escapeHtml(columna.label)}</th>`)
			.join("");

		const filasHtml = proyectoParaPdf
			.map((item, index) => {
				const fondoFila = index % 2 === 0 ? "#ffffff" : "#f6fbff";
				const numeracionHtml = `<td style="border: 1px solid #dbe4ea; padding: 10px; text-align: center; background: ${fondoFila}; font-size: 12px; color: #0f172a; font-weight: 700;">${index + 1}</td>`;

				const columnasFila = COLUMNAS_REPORTE.map((columna) => {
					const valor = String(item[columna.key] ?? "-");

					if (columna.key === "Estado") {
						const esActivo = esEstadoActivo(valor);
						return `<td style="border: 1px solid #dbe4ea; padding: 10px; text-align: center; background: ${fondoFila};"><span style="display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; color: ${esActivo ? "#15803d" : "#be123c"}; background: ${esActivo ? "#ecfdf3" : "#fff1f2"}; border: 1px solid ${esActivo ? "#86efac" : "#fda4af"};">${escapeHtml(valor)}</span></td>`;
					}

					return `<td style="border: 1px solid #dbe4ea; padding: 10px; text-align: center; background: ${fondoFila}; font-size: 12px; color: #0f172a;">${escapeHtml(valor)}</td>`;
				}).join("");

				return `<tr>${numeracionHtml}${columnasFila}</tr>`;
			})
			.join("");

		return `
			<html>
				<head>
					<style>
						@page { size: A4 landscape; margin: 18px 18px 56px 18px; }
						body { font-family: Arial, sans-serif; color: #0f172a; padding-bottom: 48px; }
						table { width: 100%; border-collapse: collapse; table-layout: fixed; }
						td, th { word-break: break-word; overflow-wrap: anywhere; vertical-align: middle; }
						tr { page-break-inside: avoid; }
						.footer-wrap { position: fixed; left: 24px; right: 24px; bottom: 8px; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 10px; color: #475569; }
						.footer-page::after { content: "Pagina " counter(page) " de " counter(pages); font-weight: 700; color: #0f172a; }
					</style>
				</head>
				<body style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
					<div style="display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 18px; background: linear-gradient(135deg, #0f766e 0%, #164e63 55%, #1e3a8a 100%); border-radius: 22px; overflow: hidden; border: 1px solid #d9e6f2;">
						<div style="display: flex; align-items: center; gap: 16px; padding: 18px 20px; flex: 1;">
							${logoHtml}
							<div>
								<p style="margin: 0 0 5px; color: #d1fae5; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;">${escapeHtml(EMPRESA_NOMBRE)}</p>
								<h1 style="margin: 0; color: white; font-size: 26px; line-height: 1.15;">Reporte de Proyectos</h1>
								<p style="margin: 8px 0 0; color: #dbeafe; font-size: 12px;">Documento generado en tiempo real desde la lista de proyectos registrados.</p>
							</div>
						</div>
						<div style="min-width: 220px; background: rgba(255,255,255,0.12); border-left: 1px solid rgba(255,255,255,0.16); padding: 18px 20px;">
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Empresa:</strong> ${escapeHtml(EMPRESA_NOMBRE)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Documento:</strong> ${escapeHtml(numeroDocumento)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Fecha:</strong> ${escapeHtml(fechaFormateada)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Hora:</strong> ${escapeHtml(horaFormateada)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Filtro:</strong> ${escapeHtml(ultimoFiltro || "Todos los proyectos")}</p>
							<p style="margin: 0; color: white; font-size: 12px;"><strong>Total:</strong> ${proyectoParaPdf.length} registros</p>
						</div>
					</div>
					<div style="border: 1px solid #dbe4ea; border-radius: 18px; overflow: hidden;">
						<table>
							<colgroup>${colgroupHtml}</colgroup>
							<thead><tr>${encabezadosHtml}</tr></thead>
							<tbody>${filasHtml}</tbody>
						</table>
					</div>
					<div class="footer-wrap">
						<div><strong>${escapeHtml(EMPRESA_NOMBRE)}</strong> | Documento informativo de uso interno. Verifique la vigencia de los datos antes de cualquier gestion comercial. Contacto: ${escapeHtml(EMPRESA_CONTACTO)}</div>
						<div class="footer-page"></div>
					</div>
				</body>
			</html>
		`;
	};

	const generarPDF = async () => {
		if (!proyectoParaPdf.length) {
			Alert.alert("Aviso", "Primero genera un reporte para exportarlo en PDF.");
			return;
		}

		try {
			const html = construirHtmlReporte();
			// ATAMAINE: En navegador abrimos la impresion web para guardar como PDF sin depender de expo-sharing.
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
			const puedeCompartir = await Sharing.isAvailableAsync();

			if (puedeCompartir) {
				await Sharing.shareAsync(uri, {
					UTI: ".pdf",
					mimeType: "application/pdf",
					dialogTitle: "Guardar, descargar o compartir reporte PDF",
				});
				return;
			}

			Alert.alert("Aviso", "Se abrio el panel de impresion.");
		} catch (error) {
			console.error("Error al generar PDF:", error);
			Alert.alert("Error", "No se pudo generar el PDF del reporte.");
		}
	};

	// ATAMAINE: La búsqueda se hace DIRECTAMENTE contra el API EN TIEMPO REAL para obtener datos frescos de la base de datos.
	const consultarReporte = async (filtroParam?: string) => {
		const filtro = (filtroParam !== undefined ? filtroParam : datoBuscar).toString().trim();
		setMostrarProyectosSelect(false);
		setSelectorEnFoco(false);
		Keyboard.dismiss();

		// Si el filtro está vacío consultamos al API con '*' para obtener la lista completa en tiempo real
		if (!filtro) {
			try {
				setCargando(true);
				setMensaje("");
				setUltimoFiltro("");
				const proyectosBase = await consultarProyectosRegistrados();
				setTodosProyectos(proyectosBase);
				setReporte(proyectosBase);
				setProyectosSelect((actuales) => combinarProyectosSelect(actuales, proyectosBase));
				setBuscado(false);
				return;
			} catch (error) {
				console.error("Error al consultar lista completa de proyectos:", error);
				setTodosProyectos([]);
				setReporte([]);
				setMensaje("No se pudo consultar la lista de proyectos.");
			} finally {
				setCargando(false);
			}
		}

		try {
			setCargando(true);
			setMensaje("");
			setUltimoFiltro(filtro);

			// Cancelar petición previa si existe
			if (fetchControllerRef.current) {
				try { fetchControllerRef.current.abort(); } catch (e) {}
			}
			fetchControllerRef.current = new AbortController();
			const signal = fetchControllerRef.current.signal;
			const response = await fetch(`${API_URL}/Reporte/reporte_Proyectos/${encodeURIComponent(filtro)}`, { signal });

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const rawData = await response.text();
			const respuestaApi = normalizarProyectos(parseReporteResponse(rawData));
			// ATAMAINE: Validacion adicional para nombre, codigo, ubicacion o ID aunque el SP publicado filtre solo un campo.
			const filtradosApi = filtrarProyectosLocal(respuestaApi, filtro);
			const respaldoLocal = filtrarProyectosLocal(todosProyectos, filtro);
			const filtrados = filtradosApi.length ? filtradosApi : respaldoLocal;

			setReporte(filtrados);
			setBuscado(true);

			if (filtrados.length === 0) {
				setMensaje("No se encontraron registros para ese criterio.");
			}
		} catch (error) {
			if ((error as Error).name === "AbortError") {
				return;
			}
			console.error("Error al consultar reporte de proyectos:", error);
			const respaldoLocal = filtrarProyectosLocal(todosProyectos, filtro);
			setReporte(respaldoLocal);
			setBuscado(true);
			setMensaje(
				respaldoLocal.length
					? "Mostrando coincidencias locales mientras se restablece la conexion con el API."
					: "No se pudo consultar el reporte en este momento.",
			);
		} finally {
			setCargando(false);
		}
	};

	const listadoMostrar = buscado ? reporte : todosProyectos;
	const proyectosFiltradosSelect = useMemo(
		() => proyectosSelect.filter((proyecto) => coincideProyecto(proyecto, datoBuscar)).slice(0, 20),
		[proyectosSelect, datoBuscar],
	);
	const totalProyectos = todosProyectos.length;
	const totalActivos = todosProyectos.filter((item) => esEstadoActivo(item.Estado)).length;
	const totalInactivos = Math.max(totalProyectos - totalActivos, 0);
	// ATAMAINE: Estas columnas usan ajuste fino para que codigo, hectareas y partida no rompan la fila.
	const esColumnaProyectoCorta = (key: keyof ProyectoReporteItem) =>
		key === "Hectareas" || key === "PartidaRegistral" || key === "CodProyecto";

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
				<LinearGradient
					colors={["#061b2b", "#064e5a", "#0f766e"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.heroCard}
				>
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
							<Text style={styles.title}>de Proyectos</Text>
							<Text style={styles.subtitle}>Busca por nombre, codigo o ubicacion con datos reales del API.</Text>
						</View>
						<View style={styles.peopleScene}>
							<View style={[styles.personBubble, styles.personBubbleBlue]}>
								<MaterialCommunityIcons name="office-building-outline" size={17} color="#ffffff" />
							</View>
							<View style={[styles.personBubble, styles.personBubbleGreen]}>
								<MaterialCommunityIcons name="map-marker-outline" size={17} color="#ffffff" />
							</View>
							<View style={[styles.personBubble, styles.personBubblePurple]}>
								<MaterialCommunityIcons name="map-search-outline" size={17} color="#ffffff" />
							</View>
							<View style={styles.peopleBase} />
						</View>
					</View>

					<View style={styles.statsGrid}>
						<View style={styles.statCard}>
							<View style={[styles.statIconWrap, { backgroundColor: "#dbeafe" }]}>
								<MaterialCommunityIcons name="office-building" size={13} color="#2563eb" />
							</View>
							<Text style={styles.statLabel}>Registrados</Text>
							{cargando ? <ActivityIndicator size="small" color="#2563eb" style={styles.statLoader} /> : <Text style={styles.statValue}>{totalProyectos}</Text>}
							<Text style={styles.statCaption}>Total proyectos</Text>
							<View style={[styles.statAccentLine, { backgroundColor: "#2563eb" }]} />
						</View>
						<View style={styles.statCard}>
							<View style={[styles.statIconWrap, { backgroundColor: "#d1fae5" }]}>
								<MaterialCommunityIcons name="check-decagram-outline" size={13} color="#059669" />
							</View>
							<Text style={styles.statLabel}>Activos</Text>
							<Text style={styles.statValue}>{totalActivos}</Text>
							<Text style={styles.statCaption}>En operacion</Text>
							<View style={[styles.statAccentLine, { backgroundColor: "#10b981" }]} />
						</View>
						<View style={styles.statCard}>
							<View style={[styles.statIconWrap, { backgroundColor: "#ffe4e6" }]}>
								<MaterialCommunityIcons name="close-circle-outline" size={13} color="#e11d48" />
							</View>
							<Text style={styles.statLabel}>Inactivos</Text>
							<Text style={styles.statValue}>{totalInactivos}</Text>
							<Text style={styles.statCaption}>No disponibles</Text>
							<View style={[styles.statAccentLine, { backgroundColor: "#f43f5e" }]} />
						</View>
						<TouchableOpacity style={styles.statCard} activeOpacity={0.82} onPress={cargarProyectosIniciales}>
							<View style={[styles.statIconWrap, { backgroundColor: "#f3e8ff" }]}>
								<MaterialCommunityIcons name="refresh" size={13} color="#7c3aed" />
							</View>
							<Text style={styles.statLabel}>Ultima Busqueda</Text>
							<Text style={[styles.statValue, styles.statValueText]} numberOfLines={2}>{ultimoFiltro || "Sin filtro"}</Text>
							<Text style={styles.statCaption}>Toca para actualizar</Text>
							<View style={[styles.statAccentLine, { backgroundColor: "#8b5cf6" }]} />
						</TouchableOpacity>
					</View>
				</LinearGradient>

				<View style={styles.searchCard}>
					<Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
					<Text style={styles.fieldLabel}>Proyecto activo</Text>
					<View style={styles.selectorWrap}>
						<View style={[styles.selectorShell, selectorEnFoco ? styles.selectorShellFocused : null]}>
							<MaterialCommunityIcons name="magnify" size={17} color={selectorEnFoco ? "#0f766e" : "#8aa0b5"} />
							<TextInput
								value={datoBuscar}
								onChangeText={(texto) => {
									setDatoBuscar(texto);
									setMostrarProyectosSelect(true);
								}}
								onFocus={() => {
									setSelectorEnFoco(true);
									setMostrarProyectosSelect(true);
									if (!proyectosSelect.length) refrescarProyectosSelect();
								}}
								placeholder={cargandoProyectosSelect ? "Cargando proyectos..." : "Escribe nombre, codigo o ubicacion"}
								placeholderTextColor="#91a3b6"
								style={styles.selectorInput}
								returnKeyType="search"
								autoCorrect={false}
								autoCapitalize="words"
								onSubmitEditing={() => consultarReporte()}
								accessibilityLabel="Buscar proyecto por nombre, codigo o ubicacion"
							/>
							{datoBuscar ? (
								<TouchableOpacity
									style={styles.selectorClearButton}
									onPress={() => {
										setDatoBuscar("");
										setMostrarProyectosSelect(true);
									}}
									accessibilityLabel="Borrar texto"
								>
									<MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" />
								</TouchableOpacity>
							) : null}
							<TouchableOpacity style={styles.selectorIconButton} onPress={alternarProyectosSelect} accessibilityLabel="Mostrar proyectos activos">
								{cargandoProyectosSelect ? (
									<ActivityIndicator size="small" color="#0f766e" />
								) : (
									<MaterialCommunityIcons name={mostrarProyectosSelect ? "chevron-up" : "chevron-down"} size={19} color="#0f766e" />
								)}
							</TouchableOpacity>
						</View>

						{mostrarProyectosSelect ? (
							<View style={styles.optionsBox}>
								<View style={styles.optionsHeader}>
									<Text style={styles.optionsHeaderText}>Proyectos activos</Text>
									<Text style={styles.optionsHeaderText}>{proyectosFiltradosSelect.length} coincidencia{proyectosFiltradosSelect.length === 1 ? "" : "s"}</Text>
								</View>
								{proyectosFiltradosSelect.length ? (
									<ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
										{proyectosFiltradosSelect.map((proyecto) => {
											const seleccionado = normalizarTerminoBusqueda(datoBuscar) === normalizarTerminoBusqueda(proyecto.nombre);
											const detalle = [proyecto.codigo ? `Cod. ${proyecto.codigo}` : "", proyecto.ubicacion].filter(Boolean).join("  |  ");
											return (
												<TouchableOpacity
													key={proyecto.id || `${proyecto.nombre}-${proyecto.codigo}`}
													style={[styles.optionItem, seleccionado ? styles.optionItemActive : null]}
													activeOpacity={0.82}
													onPress={() => seleccionarProyectoSelect(proyecto)}
												>
													<View style={styles.optionIcon}>
														<MaterialCommunityIcons name="office-building-marker-outline" size={16} color="#0f766e" />
													</View>
													<View style={styles.optionContent}>
														<Text style={styles.optionTitle} numberOfLines={1}>{proyecto.nombre}</Text>
														<Text style={styles.optionMeta} numberOfLines={2}>{detalle || "Proyecto activo"}</Text>
													</View>
													{seleccionado ? <MaterialCommunityIcons name="check-circle" size={17} color="#10b981" /> : <MaterialCommunityIcons name="chevron-right" size={16} color="#94a3b8" />}
												</TouchableOpacity>
											);
										})}
									</ScrollView>
								) : (
									<View style={styles.optionEmpty}>
										<MaterialCommunityIcons name="text-search" size={22} color="#94a3b8" />
										<Text style={styles.optionEmptyText}>{cargandoProyectosSelect ? "Cargando proyectos..." : `No hay proyectos que coincidan con “${datoBuscar}”.`}</Text>
									</View>
								)}
							</View>
						) : null}
					</View>

					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.actionButton} onPress={() => consultarReporte()}>
							<LinearGradient colors={["#1f75ff", "#0657d9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}>
								<MaterialCommunityIcons name="magnify" size={13} color="#ffffff" />
								<Text style={styles.actionTextLight}>Buscar</Text>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} activeOpacity={0.85} onPress={() => navigation.navigate("Rproyecto", { onRefresh: cargarProyectosIniciales })}>
							<LinearGradient colors={["#0f9f73", "#047857"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}>
								<MaterialCommunityIcons name="plus-circle-outline" size={13} color="#ffffff" />
								<Text style={styles.actionTextLight}>Nuevo</Text>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={limpiarFiltro}>
							<LinearGradient colors={["#6b7280", "#475569"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}>
								<MaterialCommunityIcons name="trash-can-outline" size={13} color="#ffffff" />
								<Text style={styles.actionTextLight}>Limpiar</Text>
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.actionButton, (!proyectoParaPdf.length || cargando) && styles.buttonDisabled]} onPress={generarPDF} disabled={!proyectoParaPdf.length || cargando}>
							<LinearGradient colors={["#f59e0b", "#f97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}>
								<MaterialCommunityIcons name="file-pdf-box" size={13} color="#ffffff" />
								<Text style={styles.actionTextLight}>PDF</Text>
							</LinearGradient>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.contentCard}>
					<View style={styles.contentTitleRow}>
						<MaterialCommunityIcons name="view-list-outline" size={18} color="#2563eb" />
						<Text style={styles.contentTitle}>Listado del Reporte</Text>
					</View>
					{cargando && (
						<ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
					)}

					{!cargando && mensaje ? (
						<View style={styles.messageBox}>
							<Text style={styles.messageText}>{mensaje}</Text>
						</View>
					) : null}

					{!cargando && buscado && reporte.length > 0 ? (
							<Text selectable style={styles.resultCounter}>
							Mostrando {reporte.length} resultado{reporte.length === 1 ? "" : "s"} para: {ultimoFiltro}
						</Text>
					) : null}

					{!cargando && buscado && reporte.length === 0 && !mensaje ? (
						<View style={styles.emptyState}>
							<View style={styles.emptyIconWrap}>
								<MaterialCommunityIcons name="file-search-outline" size={28} color="#0f766e" />
							</View>
							<Text style={styles.emptyTitle}>Sin resultados</Text>
							<Text style={styles.emptyText}>
								No se encontraron datos para el criterio ingresado.
							</Text>
						</View>
					) : null}

					{!cargando && listadoMostrar.length > 0 ? (
						<View style={styles.tableWrapper}>
							<LinearGradient colors={["#0f2f89", "#184ec8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tableHeaderRow}>
								{COLUMNAS_REPORTE.map((columna) => (
									<View key={columna.key} style={[styles.tableHeaderCell, { flex: columna.flex }]}>
										<Text style={styles.tableHeaderText}>{columna.label}</Text>
									</View>
								))}
								<View style={styles.tableActionHeaderCell}>
									<Text style={styles.tableHeaderText}>Ver</Text>
								</View>
							</LinearGradient>

							{listadoMostrar.map((item, index) => (
								<View
									key={index}
									style={[
										styles.tableDataRow,
										index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
									]}
								>
									{COLUMNAS_REPORTE.map((columna) => (
										<View key={`${index}-${columna.key}`} style={[styles.tableDataCell, { flex: columna.flex }]}> 
											{columna.key === "Estado" ? (
												<View
													style={[
													styles.estadoBadge,
													esEstadoActivo(String(item.Estado ?? ""))
														? styles.estadoBadgeActivo
														: styles.estadoBadgeInactivo,
													]}
												>
														<Text selectable
													style={[
													styles.estadoBadgeText,
													esEstadoActivo(String(item.Estado ?? ""))
														? styles.estadoBadgeTextActivo
														: styles.estadoBadgeTextInactivo,
													]}
												>
												{String(item[columna.key] ?? "-")}
												</Text>
												</View>
											) : (
													<Text selectable
													style={[
														styles.tableDataText,
														esColumnaProyectoCorta(columna.key) ? styles.tableDataTextTight : null,
													]}
													numberOfLines={2}
													adjustsFontSizeToFit={esColumnaProyectoCorta(columna.key)}
													minimumFontScale={0.78}
												>
												{String(item[columna.key] ?? "-")}
												</Text>
											)}
										</View>
									))}
									<View style={styles.tableActionCell}>
										<TouchableOpacity
											style={styles.verButton}
											activeOpacity={0.8}
											onPress={() => abrirProyectoRegistrado(navigation, item)}
										>
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

export default ReporteProyectos;

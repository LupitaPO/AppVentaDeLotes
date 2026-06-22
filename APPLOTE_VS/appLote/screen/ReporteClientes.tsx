import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ActivityIndicator,
	ScrollView,
	Alert,
	Image,
	Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRef } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./ReporteClientesStyles";
import { API_URL } from "../config/apiUrl";

// ATAMAINE: URL base del backend .NET donde consultamos la lista real de clientes.
// ATAMAINE: API_URL viene de config/apiUrl para que web use proxy CORS y movil use API real.
// ATAMAINE: Datos fijos que usamos para personalizar la cabecera y pie del PDF.
const EMPRESA_NOMBRE = "Residencial Santa Fe";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "RSF";
const REFRESCO_TIEMPO_REAL_MS = 10000;
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// ATAMAINE: Tipo genérico para leer la respuesta cruda del backend antes de normalizarla.
type ReporteItem = Record<string, unknown>;

// ATAMAINE: Estructura final que la pantalla usa para pintar la tabla y exportar el PDF.
type ClienteReporteItem = {
	IdCliente: string;
	DNI: string;
	Nombre: string;
	Apellidos: string;
	Celular: string;
	Correo: string;
	Estado: string;
};

// ATAMAINE: Propiedad de navegacion que llega desde React Navigation.
type ReporteClientesProps = {
	navigation: any;
};

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

// ATAMAINE: Ajustamos las proporciones para que DNI, celular, correo y estado respiren mejor en pantallas pequeñas.
const COLUMNAS_REPORTE: Array<{
	key: keyof ClienteReporteItem;
	label: string;
	flex: number;
}> = [
	{ key: "DNI", label: "DNI", flex: 0.9 },
	{ key: "Nombre", label: "Nombre", flex: 1.1 },
	{ key: "Apellidos", label: "Apellidos", flex: 1.2 },
	{ key: "Celular", label: "Celular", flex: 1.25 },
	{ key: "Correo", label: "Correo", flex: 1.3 },
	{ key: "Estado", label: "Estado", flex: 0.85 },
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

// ATAMAINE: Normalizamos los datos del cliente para que el reporte siempre tenga las mismas columnas visibles.
const separarNombreCompleto = (item: ReporteItem) => {
        const nombresApi = [item.Nombre1, item.Nombre2].filter(Boolean).join(" ").trim();
        const apellidosApi = [item.Apaterno, item.Amaterno].filter(Boolean).join(" ").trim();

        if (nombresApi || apellidosApi) {
                return {
                        nombre: nombresApi || String(item.Nombre ?? "-"),
                        apellidos: apellidosApi || String(item.Apellidos ?? "-"),
                };
        }

        // ATAMAINE: El endpoint de reporte filtrado devuelve NombreCompleto; lo separamos para no mostrar guiones.
        const nombreCompleto = String(item.NombreCompleto ?? item.Nombre ?? "").trim();
        if (!nombreCompleto) {
                return {
                        nombre: "-",
                        apellidos: String(item.Apellidos ?? "-"),
                };
        }

        const partes = nombreCompleto.split(/\s+/).filter(Boolean);
        if (partes.length >= 4) {
                return {
                        nombre: partes.slice(0, 2).join(" "),
                        apellidos: partes.slice(2).join(" "),
                };
        }

        if (partes.length >= 2) {
                return {
                        nombre: partes[0],
                        apellidos: partes.slice(1).join(" "),
                };
        }

        return {
                nombre: nombreCompleto,
                apellidos: String(item.Apellidos ?? "-"),
        };
};

const normalizarClientes = (items: ReporteItem[]): ClienteReporteItem[] =>
        items.map((item) => {
                const nombreSeparado = separarNombreCompleto(item);

                return {
                        IdCliente: String(item.IdCliente ?? item.idCliente ?? item.IDCliente ?? item.Id ?? ""),
                        DNI: String(item.DNI ?? "-"),
                        Nombre: nombreSeparado.nombre,
                        Apellidos: nombreSeparado.apellidos,
                        Celular: String(item.Celular ?? "-"),
                        Correo: String(item.Correo ?? "-"),
                        Estado: normalizarEstado(item.Estado),
                };
        });

// ATAMAINE: Detectamos estados para pintarlos distinto dentro de la tabla sin cambiar la data real.
const esEstadoActivo = (estado: string) => estado.trim().toLowerCase() === "activo";

const textoLimpio = (value: unknown) => String(value ?? "").trim();
const idsIguales = (left: unknown, right: unknown) => textoLimpio(left) === textoLimpio(right);

const obtenerIdClienteRegistro = (item: ReporteItem | ClienteReporteItem) =>
	textoLimpio((item as any).IdCliente ?? (item as any).idCliente ?? (item as any).IDCliente ?? (item as any).Id);

const obtenerIdLoteRegistro = (item: ReporteItem) =>
	textoLimpio((item as any).IdLote ?? (item as any).idLote ?? (item as any).IDLote ?? (item as any).Id);

const obtenerIdProyectoRegistro = (item: ReporteItem) =>
	textoLimpio((item as any).IdProyecto ?? (item as any).idProyecto ?? (item as any).IDProyecto ?? (item as any).ProyectoId);

const obtenerNombreProyectoRegistro = (item: ReporteItem) =>
	textoLimpio(
		(item as any).NombreProyecto ??
		(item as any).nombreProyecto ??
		(item as any).Nombre ??
		(item as any).nombre ??
		(item as any).Proyecto ??
		(item as any).proyecto,
	);

const obtenerCodigoLoteRegistro = (item: ReporteItem) =>
	textoLimpio((item as any).CodigoLote ?? (item as any).CodLote ?? (item as any).Codigo ?? (item as any).codigoLote);

const obtenerUrlPlanoProyecto = (item: ReporteItem) =>
	textoLimpio(
		(item as any).ImagenUrl ??
		(item as any).imagenUrl ??
		(item as any).UrlCSV ??
		(item as any).urlCSV ??
		(item as any).PlanoUrl ??
		(item as any).planoUrl,
	);

const ventaVigente = (venta: ReporteItem) => {
	const estado = textoLimpio(
		(venta as any).EstadoVenta ??
		(venta as any).Estadoventa ??
		(venta as any).estadoVenta ??
		(venta as any).Estado,
	).toLowerCase();

	return !["cancelada", "cancelado", "anulada", "anulado", "inactivo", "x"].includes(estado);
};

const fechaVentaMs = (venta: ReporteItem) => {
	const fechaRaw = textoLimpio((venta as any).FechaVenta ?? (venta as any).fechaVenta);
	const fecha = fechaRaw ? new Date(fechaRaw) : null;
	return fecha && !Number.isNaN(fecha.getTime()) ? fecha.getTime() : 0;
};

const consultarRegistros = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const rawData = await response.text();
	return parseReporteResponse(rawData);
};

const resolverIdClientePorDNI = async (item: ClienteReporteItem) => {
	const idDesdeReporte = obtenerIdClienteRegistro(item);
	if (idDesdeReporte && idDesdeReporte !== "-") return idDesdeReporte;

	const dni = textoLimpio(item.DNI);
	if (!dni || dni === "-") return "";

	const clientePorDni = await consultarRegistros(`${API_URL}/Cliente/cliente_ObtenerPorDNI/${encodeURIComponent(dni)}`);
	const clienteDirecto = clientePorDni.find((cliente) => textoLimpio(cliente.DNI) === dni) ?? clientePorDni[0];
	const idDirecto = clienteDirecto ? obtenerIdClienteRegistro(clienteDirecto) : "";
	if (idDirecto) return idDirecto;

	const clientes = await consultarRegistros(`${API_URL}/Cliente/cliente_Listar`);
	const cliente = clientes.find((registro) => textoLimpio(registro.DNI) === dni);
	return cliente ? obtenerIdClienteRegistro(cliente) : "";
};

// ATAMAINE: Desde Ver saltamos al proyecto relacionado por la venta/lote del cliente.
const abrirProyectoDelCliente = async (navigation: any, item: ClienteReporteItem) => {
	try {
		const idCliente = await resolverIdClientePorDNI(item);
		if (!idCliente) {
			Alert.alert("Aviso", "No se encontro el identificador del cliente seleccionado.");
			return;
		}

		const [ventas, lotes, proyectos] = await Promise.all([
			consultarRegistros(`${API_URL}/Venta/venta_Listar`),
			consultarRegistros(`${API_URL}/Lote/lote_Listar`),
			consultarRegistros(`${API_URL}/Proyecto/proyecto_Listar`),
		]);

		const ventasCliente = ventas
			.filter((venta) => idsIguales(obtenerIdClienteRegistro(venta), idCliente) && ventaVigente(venta))
			.sort((a, b) => fechaVentaMs(b) - fechaVentaMs(a));

		if (!ventasCliente.length) {
			Alert.alert("Aviso", "Este cliente aun no tiene un lote o proyecto asociado.");
			return;
		}

		const lotesCliente = ventasCliente
			.map((venta) => {
				const idLote = obtenerIdLoteRegistro(venta);
				return lotes.find((lote) => idsIguales(obtenerIdLoteRegistro(lote), idLote));
			})
			.filter(Boolean) as ReporteItem[];

		if (!lotesCliente.length) {
			Alert.alert("Aviso", "No se encontro el lote asociado a este cliente.");
			return;
		}

		const loteReferencia = lotesCliente[0];
		const idProyecto = obtenerIdProyectoRegistro(loteReferencia);
		const proyectoCliente = proyectos.find((proyecto) => idsIguales(obtenerIdProyectoRegistro(proyecto), idProyecto));
		if (!idProyecto || !proyectoCliente) {
			Alert.alert("Aviso", "No se encontro el proyecto asociado a este cliente.");
			return;
		}

		const nombreProyecto = obtenerNombreProyectoRegistro(proyectoCliente) || idProyecto;
		const urlCSV = obtenerUrlPlanoProyecto(proyectoCliente);
		const lotesDelProyecto = lotesCliente.filter((lote) => idsIguales(obtenerIdProyectoRegistro(lote), idProyecto));
		const lotesClienteIds = lotesDelProyecto.map(obtenerIdLoteRegistro).filter(Boolean);
		const codigosLotesCliente = lotesDelProyecto.map(obtenerCodigoLoteRegistro).filter(Boolean);

		if (!urlCSV) {
			Alert.alert("Aviso", "El proyecto asociado no tiene plano registrado para abrir el detalle.");
			return;
		}

		navigation.navigate("DetalleProyecto", {
			idProyecto,
			urlCSV,
			info: proyectoCliente,
			clienteFiltroId: idCliente,
			clienteFiltroDNI: item.DNI,
			clienteFiltroNombre: `${item.Nombre} ${item.Apellidos}`.trim(),
			lotesClienteIds,
			codigosLotesCliente,
		});
	} catch (error) {
		console.error("Error al abrir proyecto del cliente:", error);
		Alert.alert("Error", "No se pudo abrir el proyecto de este cliente en este momento.");
	}
};

const obtenerLogoPdfUri = () => {
	// ATAMAINE: En web Image.resolveAssetSource puede no existir; evitamos pantalla blanca al abrir reportes.
	const resolver = (Image as any).resolveAssetSource;
	if (typeof resolver !== "function") {
		return "";
	}

	return resolver(require("../assets/splash-icon.png"))?.uri || "";
};

const consultarClientesRegistrados = async (signal?: AbortSignal) => {
	const response = await fetch(`${API_URL}/Cliente/cliente_Listar`, { signal });

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}

	const rawData = await response.text();
	return normalizarClientes(parseReporteResponse(rawData));
};

const ReporteClientes = ({ navigation }: ReporteClientesProps) => {
	const [datoBuscar, setDatoBuscar] = useState("");
	const [todosClientes, setTodosClientes] = useState<ClienteReporteItem[]>([]);
	const [reporte, setReporte] = useState<ClienteReporteItem[]>([]);
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

	// Refs para cancelar peticiones sin cruzar busqueda manual con refresco automatico.
	const consultaControllerRef = useRef<AbortController | null>(null);
	const pollingControllerRef = useRef<AbortController | null>(null);
	const debounceTimerRef = useRef<any>(null);

	useEffect(() => {
		return () => {
			consultaControllerRef.current?.abort();
			pollingControllerRef.current?.abort();
		};
	}, []);

	// Cargar clientes iniciales (extraído para poder llamarlo desde UI - refresh)
	const cargarClientesIniciales = async () => {
		try {
			setCargando(true);
			setMensaje("");
			const clientesBase = await consultarClientesRegistrados();

			setTodosClientes(clientesBase);
			setReporte(clientesBase);
			setBuscado(false);
			setUltimoFiltro("");

			if (!clientesBase.length) {
				setMensaje("No existen clientes registrados.");
			}
		} catch (error) {
			console.error("Error al cargar clientes registrados:", error);
			setTodosClientes([]);
			setReporte([]);
			setMensaje("No se pudo cargar la lista de clientes.");
		} finally {
			setCargando(false);
		}
	};

	// Debounce: cuando el texto de búsqueda cambie, lanzamos la búsqueda en tiempo real después de 600ms
	useEffect(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			// Si el campo está vacío consultamos la lista completa
			consultarReporte(datoBuscar);
		}, 600);

		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		};
	}, [datoBuscar]);

	// Polling periódico para mantener la lista completa en tiempo real (solo actualiza todosClientes y reporte si no hay filtro activo)
	useEffect(() => {
		let mounted = true;
		const refresh = async () => {
			try {
				pollingControllerRef.current?.abort();
				const controller = new AbortController();
				pollingControllerRef.current = controller;
				const signal = controller.signal;
				// Si hay un filtro activo, refrescamos SOLO los resultados filtrados para mantenerlos en tiempo real
				if (buscado && ultimoFiltro) {
					const resp = await fetch(`${API_URL}/Reporte/reporte_Clientes/${encodeURIComponent(ultimoFiltro)}`, { signal });
					if (!resp.ok) return;
					const raw = await resp.text();
					const filtrados = normalizarClientes(parseReporteResponse(raw));
					if (!mounted) return;
					setReporte(filtrados);
					return;
				}

				const clientes = await consultarClientesRegistrados(signal);
				if (!mounted) return;
				setTodosClientes(clientes);
				// Si no estamos mostrando resultados filtrados, mantenemos el listado inferior al dia
				if (!buscado) setReporte(clientes);
			} catch (err) {
				// ignore polling errors silently
			}
		};

		// refresh periodico para mantener la pantalla sincronizada con el API real.
		refresh();
		const iv = setInterval(refresh, REFRESCO_TIEMPO_REAL_MS);

		return () => {
			mounted = false;
			clearInterval(iv);
			pollingControllerRef.current?.abort();
		};
	}, [buscado, ultimoFiltro]);

	const limpiarFiltro = async () => {
		setDatoBuscar("");
		setUltimoFiltro("");
		setMensaje("");
		setBuscado(false);

		// Volver a cargar desde el API en tiempo real para asegurar datos frescos
		try {
			setCargando(true);
			const clientesBase = await consultarClientesRegistrados();
			setTodosClientes(clientesBase);
			setReporte(clientesBase);
		} catch (error) {
			console.error("Error al recargar clientes al limpiar filtro:", error);
			setTodosClientes([]);
			setReporte([]);
			setMensaje("No se pudo recargar la lista de clientes.");
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
	const fechaPanel = `${String(horaActual.getDate()).padStart(2, "0")} ${MESES_CORTOS[horaActual.getMonth()]} ${horaActual.getFullYear()}`;
	const logoPdfUri = obtenerLogoPdfUri();

	const clienteParaPdf = buscado && ultimoFiltro ? reporte : todosClientes;
	const clientesActivos = todosClientes.filter((cliente) => esEstadoActivo(cliente.Estado)).length;
	const clientesInactivos = Math.max(todosClientes.length - clientesActivos, 0);
	const totalClientesVista = Math.max(todosClientes.length, reporte.length);
	const metricasClientes: Array<{
		titulo: string;
		valor: string | number;
		detalle: string;
		icono: keyof typeof MaterialCommunityIcons.glyphMap;
		acento: string;
		fondo: string;
	}> = [
		{
			titulo: "Clientes Registrados",
			valor: totalClientesVista,
			detalle: "Total de clientes",
			icono: "account-group-outline",
			acento: "#2563eb",
			fondo: "#eaf1ff",
		},
		{
			titulo: "Clientes Activos",
			valor: clientesActivos,
			detalle: "Clientes activos",
			icono: "account-check-outline",
			acento: "#059669",
			fondo: "#e8fff5",
		},
		{
			titulo: "Clientes Inactivos",
			valor: clientesInactivos,
			detalle: "Clientes inactivos",
			icono: "account-cancel-outline",
			acento: "#ef4444",
			fondo: "#fff0f1",
		},
		{
			titulo: "Ultima Busqueda",
			valor: ultimoFiltro || "Sin filtro",
			detalle: "Dato consultado",
			icono: "magnify",
			acento: "#7c3aed",
			fondo: "#f3e8ff",
		},
	];

	// ATAMAINE: Al entrar a la pantalla cargamos una sola vez todos los clientes desde el API en TIEMPO REAL.
	useEffect(() => {
		cargarClientesIniciales();
	}, []);

	// ATAMAINE: Construimos el PDF en tabla horizontal para que se vea como la lista del reporte.
	const construirHtmlReporte = () => {
		const numeroDocumento = `RPT-CLI-${horaActual
			.toISOString()
			.replace(/[-:TZ.]/g, "")
			.slice(0, 14)}`;
		const logoHtml = logoPdfUri
			? `<img src="${escapeHtml(logoPdfUri)}" style="width: 68px; height: 68px; border-radius: 18px; object-fit: contain; background: white; padding: 8px; border: 1px solid rgba(2,6,23,0.22); box-shadow: 0 10px 24px rgba(2,6,23,0.20);" />`
			: `<div style="width: 68px; height: 68px; border-radius: 18px; background: white; color: #0f766e; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; border: 1px solid rgba(2,6,23,0.22); box-shadow: 0 10px 24px rgba(2,6,23,0.20);">${escapeHtml(EMPRESA_SIGLAS)}</div>`;

		const columnasPdf = [
			{ label: "N°", width: "8%" },
			{ label: "DNI", width: "11%" },
			{ label: "Nombre", width: "14%" },
			{ label: "Apellidos", width: "17%" },
			{ label: "Celular", width: "12%" },
			{ label: "Correo", width: "23%" },
			{ label: "Estado", width: "15%" },
		];

		const colgroupHtml = columnasPdf.map((columna) => `<col style="width: ${columna.width};" />`).join("");

		const encabezadosHtml = columnasPdf
			.map((columna) => `<th style="padding: 12px 10px; background: linear-gradient(135deg, #0f766e 0%, #1d4ed8 100%); color: white; font-size: 12px; font-weight: 900; border: 1px solid rgba(2,6,23,0.24); text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,0.52);">${escapeHtml(columna.label)}</th>`)
			.join("");

		const filasHtml = clienteParaPdf
			.map((item, index) => {
				const fondoFila = index % 2 === 0 ? "#ffffff" : "#eefbfc";
				const numeracionHtml = `<td style="border: 1px solid rgba(15,23,42,0.18); padding: 10px; text-align: center; background: ${fondoFila}; font-size: 12px; color: #07111f; font-weight: 900;">${index + 1}</td>`;

				const columnasFila = COLUMNAS_REPORTE.map((columna) => {
					const valor = String(item[columna.key] ?? "-");

					if (columna.key === "Estado") {
						const esActivo = esEstadoActivo(valor);
						return `<td style="border: 1px solid rgba(15,23,42,0.18); padding: 10px; text-align: center; background: ${fondoFila};"><span style="display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 900; color: ${esActivo ? "#047857" : "#be123c"}; background: ${esActivo ? "#eafff3" : "#fff1f2"}; border: 1px solid ${esActivo ? "#6ee7b7" : "#fb7185"};">${escapeHtml(valor)}</span></td>`;
					}

					return `<td style="border: 1px solid rgba(15,23,42,0.18); padding: 10px; text-align: center; background: ${fondoFila}; font-size: 12px; color: #07111f; font-weight: 800;">${escapeHtml(valor)}</td>`;
				}).join("");

				return `<tr>${numeracionHtml}${columnasFila}</tr>`;
			})
			.join("");

		return `
			<html>
				<head>
					<style>
						@page { size: A4 landscape; margin: 18px 18px 56px 18px; }
						body { font-family: Arial, sans-serif; color: #0f172a; padding-bottom: 48px; background: #edf8fa; }
						table { width: 100%; border-collapse: collapse; table-layout: fixed; }
						td, th { word-break: break-word; overflow-wrap: anywhere; vertical-align: middle; }
						tr { page-break-inside: avoid; }
						.footer-wrap { position: fixed; left: 24px; right: 24px; bottom: 8px; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 10px; color: #475569; }
						.footer-page::after { content: "Pagina " counter(page) " de " counter(pages); font-weight: 700; color: #0f172a; }
					</style>
				</head>
				<body style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
					<div style="display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 18px; background: linear-gradient(135deg, #061b21 0%, #0f766e 48%, #173f91 100%); border-radius: 24px; overflow: hidden; border: 1px solid rgba(2,6,23,0.26); box-shadow: 0 18px 34px rgba(15,23,42,0.18);">
						<div style="display: flex; align-items: center; gap: 16px; padding: 18px 20px; flex: 1;">
							${logoHtml}
							<div>
								<p style="margin: 0 0 5px; color: #d1fae5; font-size: 11px; font-weight: 900; letter-spacing: 0; text-transform: uppercase; text-shadow: 0 1px 2px rgba(0,0,0,0.42);">${escapeHtml(EMPRESA_NOMBRE)}</p>
								<h1 style="margin: 0; color: white; font-size: 27px; line-height: 1.15; text-shadow: 0 2px 3px rgba(0,0,0,0.64);">Reporte de Clientes</h1>
								<p style="margin: 8px 0 0; color: #dbeafe; font-size: 12px;">Documento generado en tiempo real desde la lista de clientes registrados.</p>
							</div>
						</div>
						<div style="min-width: 220px; background: rgba(255,255,255,0.14); border-left: 1px solid rgba(255,255,255,0.22); padding: 18px 20px;">
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Empresa:</strong> ${escapeHtml(EMPRESA_NOMBRE)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Documento:</strong> ${escapeHtml(numeroDocumento)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Fecha:</strong> ${escapeHtml(fechaFormateada)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Hora:</strong> ${escapeHtml(horaFormateada)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Filtro:</strong> ${escapeHtml(ultimoFiltro || "Todos los clientes")}</p>
							<p style="margin: 0; color: white; font-size: 12px;"><strong>Total:</strong> ${clienteParaPdf.length} registros</p>
						</div>
					</div>
					<div style="border: 1px solid rgba(15,23,42,0.20); border-radius: 18px; overflow: hidden; box-shadow: 0 10px 24px rgba(15,23,42,0.10); background: white;">
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
		if (!clienteParaPdf.length) {
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

		// Si el filtro está vacío consultamos al API con '*' para obtener la lista completa en tiempo real
		if (!filtro) {
			try {
				setCargando(true);
				setMensaje("");
				setUltimoFiltro("");
				const clientesBase = await consultarClientesRegistrados();
				setTodosClientes(clientesBase);
				setReporte(clientesBase);
				setBuscado(false);
				return;
			} catch (error) {
				console.error("Error al consultar lista completa:", error);
				setTodosClientes([]);
				setReporte([]);
				setMensaje("No se pudo consultar la lista de clientes.");
			} finally {
				setCargando(false);
			}
		}

		try {
			setCargando(true);
			setMensaje("");
			setUltimoFiltro(filtro);

			// Cancelar petición previa si existe
			if (consultaControllerRef.current) {
				try { consultaControllerRef.current.abort(); } catch (e) {}
			}
			consultaControllerRef.current = new AbortController();
			const signal = consultaControllerRef.current.signal;
			const response = await fetch(`${API_URL}/Reporte/reporte_Clientes/${encodeURIComponent(filtro)}`, { signal });

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const rawData = await response.text();
			const filtrados = normalizarClientes(parseReporteResponse(rawData));

			setReporte(filtrados);
			setBuscado(true);

			if (filtrados.length === 0) {
				setMensaje("No se encontraron registros para ese criterio.");
			}
		} catch (error) {
			if ((error as Error).name === "AbortError") {
				return;
			}
			console.error("Error al consultar reporte desde API:", error);
			setReporte([]);
			setBuscado(true);
			setMensaje("No se pudo consultar el reporte en este momento.");
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		if (typeof navigation?.addListener !== "function") {
			return;
		}

		const unsubscribe = navigation.addListener("focus", () => {
			consultarReporte(datoBuscar);
		});

		return () => {
			if (typeof unsubscribe === "function") {
				unsubscribe();
			}
		};
	}, [navigation, datoBuscar]);

	const listadoMostrar = buscado ? reporte : todosClientes;

	return (
		<View style={styles.container}>
			<View style={styles.backgroundGlowTop} />
			<View style={styles.backgroundGlowBottom} />
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<LinearGradient
					colors={["#061826", "#073147", "#075f61"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.heroCard}
				>
					<View style={styles.heroToolbar}>
						<TouchableOpacity
							style={styles.menuButton}
							onPress={() => navigation.goBack()}
							accessibilityLabel="Regresar"
						>
							<MaterialCommunityIcons name="arrow-left" size={16} color="#dff8ff" />
							{Platform.OS === "web" ? <Text style={styles.backButtonText}>Regresar</Text> : null}
						</TouchableOpacity>

						<View style={styles.liveBadge}>
							<View style={styles.liveDot} />
							<Text style={styles.liveBadgeText}>Tiempo real {horaFormateada}</Text>
						</View>

						<View style={styles.dateCard}>
							<View style={styles.dateLine}>
								<MaterialCommunityIcons name="calendar-month-outline" size={13} color="#bfe8ff" />
								<Text style={styles.dateText}>{fechaPanel}</Text>
							</View>
							<View style={styles.dateLine}>
								<MaterialCommunityIcons name="clock-time-four-outline" size={13} color="#bfe8ff" />
								<Text style={styles.dateText}>{horaFormateada}</Text>
							</View>
						</View>
					</View>

					<View style={styles.heroMainRow}>
						<View style={styles.heroContent}>
							<Text style={styles.title}>Gestion Integral</Text>
							<Text style={styles.title}>de Clientes</Text>
							<Text style={styles.subtitle}>
								Consulta clientes por DNI o nombre con datos reales en tiempo real.
							</Text>
						</View>

						<View style={styles.peopleScene}>
							<View style={[styles.personBubble, styles.personBubbleBlue]}>
								<MaterialCommunityIcons name="account" size={18} color="#f8fbff" />
							</View>
							<View style={[styles.personBubble, styles.personBubbleGreen]}>
								<MaterialCommunityIcons name="account" size={19} color="#f8fbff" />
							</View>
							<View style={[styles.personBubble, styles.personBubblePurple]}>
								<MaterialCommunityIcons name="account" size={16} color="#f8fbff" />
							</View>
							<View style={styles.peopleBase} />
						</View>
					</View>

					<View style={styles.statsGrid}>
						{metricasClientes.map((metrica) => (
							<View key={metrica.titulo} style={styles.statCard}>
								<View style={[styles.statIconWrap, { backgroundColor: metrica.fondo }]}>
									<MaterialCommunityIcons name={metrica.icono} size={17} color={metrica.acento} />
								</View>
								<Text style={styles.statLabel} numberOfLines={2}>
									{metrica.titulo}
								</Text>
								{cargando && metrica.titulo === "Clientes Registrados" ? (
									<ActivityIndicator size="small" color={metrica.acento} style={styles.statLoader} />
								) : (
									<Text
										style={[
											styles.statValue,
											typeof metrica.valor === "string" ? styles.statValueText : null,
										]}
										numberOfLines={2}
										adjustsFontSizeToFit
										minimumFontScale={0.72}
									>
										{metrica.valor}
									</Text>
								)}
								<Text style={styles.statCaption} numberOfLines={2}>
									{metrica.detalle}
								</Text>
								<View style={[styles.statAccentLine, { backgroundColor: metrica.acento }]} />
							</View>
						))}
					</View>
				</LinearGradient>

				<View style={styles.searchCard}>
					<Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
					<View style={styles.inputShell}>
						<MaterialCommunityIcons name="magnify" size={17} color="#8aa0b5" />
						<TextInput
							value={datoBuscar}
							onChangeText={setDatoBuscar}
							placeholder="Ingresar por DNI o nombre"
							placeholderTextColor="#9aa9ba"
							style={styles.input}
							returnKeyType="search"
							onSubmitEditing={() => consultarReporte()}
						/>
					</View>

					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.actionButton} onPress={() => consultarReporte()}>
							<LinearGradient
								colors={["#1f75ff", "#0657d9"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.actionFill}
							>
								<MaterialCommunityIcons name="magnify" size={13} color="#ffffff" />
								<Text style={styles.actionTextLight}>Buscar</Text>
							</LinearGradient>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.actionButton}
							activeOpacity={0.85}
							onPress={() => navigation.navigate("RegistrarCliente", { onRefresh: cargarClientesIniciales })}
						>
							<LinearGradient
								colors={["#0f9f73", "#047857"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.actionFill}
							>
								<MaterialCommunityIcons name="plus-circle-outline" size={13} color="#ffffff" />
								<Text style={styles.actionTextLight}>Nuevo</Text>
							</LinearGradient>
						</TouchableOpacity>

						<TouchableOpacity style={styles.actionButton} onPress={limpiarFiltro}>
							<LinearGradient
								colors={["#6b7280", "#475569"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.actionFill}
							>
								<MaterialCommunityIcons name="trash-can-outline" size={13} color="#ffffff" />
								<Text style={styles.actionTextLight}>Limpiar</Text>
							</LinearGradient>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.actionButton, (!clienteParaPdf.length || cargando) && styles.buttonDisabled]}
							onPress={generarPDF}
							disabled={!clienteParaPdf.length || cargando}
						>
							<LinearGradient
								colors={["#f59e0b", "#f97316"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.actionFill}
							>
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
						<Text style={styles.resultCounter}>
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
							<LinearGradient
								colors={["#0f2f89", "#184ec8"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.tableHeaderRow}
							>
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
												<Text
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
											) : columna.key === "Celular" || columna.key === "Correo" ? (
												<View style={styles.tableIconText}>
													<MaterialCommunityIcons
														name={columna.key === "Celular" ? "phone-outline" : "email-outline"}
														size={11}
														color={columna.key === "Celular" ? "#10b981" : "#2563eb"}
													/>
													<Text
														style={styles.tableDataText}
														numberOfLines={2}
														adjustsFontSizeToFit={columna.key === "Celular"}
														minimumFontScale={0.78}
													>
														{String(item[columna.key] ?? "-")}
													</Text>
												</View>
											) : (
												<Text
													style={styles.tableDataText}
													numberOfLines={2}
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
											onPress={() => abrirProyectoDelCliente(navigation, item)}
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

export default ReporteClientes;

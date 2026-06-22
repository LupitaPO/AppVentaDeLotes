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
const API_BASE_URL = API_URL.replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 15000;

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

		if (!parsed || typeof parsed !== "object") return [];

		const keys = ["d", "Data", "data", "result", "Resultado", "resultados", "Resultados", "Table"];
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

// ATAMAINE: Los filtros comparan sin tildes ni diferencias entre mayusculas.
const normalizarBusqueda = (value: unknown) =>
	textoLimpio(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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
		const nombrePublicado = textoLimpio(item.Nombre ?? item.NombreCompleto);
		const nombreDetallado = [item.Nombre1, item.Nombre2, item.Apaterno, item.Amaterno]
			.map(textoLimpio)
			.filter(Boolean)
			.join(" ");

		// ATAMAINE: No exponemos contraseña en el reporte; solo datos operativos de usuarios.
		return {
			IdUsuario: textoLimpio(item.IdUsuario ?? item.ID ?? item.Id ?? "-"),
			Nombre: nombrePublicado || nombreDetallado || "-",
			Correo: textoLimpio(item.Correo ?? item.Email ?? "-"),
			Celular: textoLimpio(item.Celular ?? item.Telefono ?? item.Teléfono ?? "-"),
			TipoUsuario: textoLimpio(item.TipoUsuario ?? item.Tipo ?? item.DescripcionTipo ?? item.Descripcion ?? item.NombreTipo ?? "-"),
			Estado: normalizarEstadoUsuario(item.Estado ?? item.EstadoUsuario),
		};
	}).filter((usuario, index, lista) => {
		const clave = usuario.IdUsuario !== "-"
			? `id:${usuario.IdUsuario}`
			: `dato:${normalizarBusqueda(usuario.Correo)}:${usuario.Celular}:${normalizarBusqueda(usuario.Nombre)}`;
		return lista.findIndex((otro) => {
			const claveOtro = otro.IdUsuario !== "-"
				? `id:${otro.IdUsuario}`
				: `dato:${normalizarBusqueda(otro.Correo)}:${otro.Celular}:${normalizarBusqueda(otro.Nombre)}`;
			return claveOtro === clave;
		}) === index;
	});

const esUsuarioActivo = (estado: string) => estado.trim().toLowerCase() === "activo";

// ATAMAINE: Desde Ver abrimos el tab de usuarios y mandamos el ID para ubicar la tarjeta en la lista real.
const abrirUsuarioRegistrado = (navigation: any, item: UsuarioReporteItem) => {
	const rutas = navigation.getState?.().routes ?? [];
	const mainTabs = [...rutas].reverse().find((ruta: any) => ruta.name === "MainTabs");
	const sesion = mainTabs?.params ?? {};
	navigation.navigate("MainTabs", {
		...sesion,
		screen: i18n.t("btusuario"),
		params: {
			idUsuario: sesion.idUsuario,
			nombre: sesion.nombre,
			rol: sesion.rol,
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
	const nombreFiltro = normalizarBusqueda(nombre);
	const tipoFiltro = normalizarBusqueda(tipoUsuario);

	// ATAMAINE: Respaldo temporal para trabajar hoy aunque reporte_Usuarios aun no este publicado en Somee.
	return items.filter((item) => {
		const coincideNombre = !nombreFiltro || normalizarBusqueda(item.Nombre).includes(nombreFiltro);
		const coincideTipo = !tipoFiltro || normalizarBusqueda(item.TipoUsuario).includes(tipoFiltro);
		return coincideNombre && coincideTipo;
	});
};

// ATAMAINE: reporte_Usuarios omite IdUsuario y publica el tipo como numero.
// Cruzamos correo/celular/nombre con usuario_Listar para recuperar datos navegables.
const enriquecerUsuariosReporte = (publicados: UsuarioReporteItem[], base: UsuarioReporteItem[]) =>
	publicados.map((usuario) => {
		const correo = normalizarBusqueda(usuario.Correo);
		const nombre = normalizarBusqueda(usuario.Nombre);
		const coincidencia = base.find((registrado) =>
			(usuario.IdUsuario !== "-" && registrado.IdUsuario === usuario.IdUsuario)
			|| (correo && correo !== "-" && normalizarBusqueda(registrado.Correo) === correo)
			|| (usuario.Celular !== "-" && registrado.Celular === usuario.Celular && normalizarBusqueda(registrado.Nombre) === nombre),
		);

		if (!coincidencia) return usuario;
		return {
			...usuario,
			IdUsuario: coincidencia.IdUsuario,
			Nombre: coincidencia.Nombre || usuario.Nombre,
			Correo: coincidencia.Correo || usuario.Correo,
			Celular: coincidencia.Celular || usuario.Celular,
			TipoUsuario: coincidencia.TipoUsuario || usuario.TipoUsuario,
		};
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
	throw ultimoError ?? new Error("Endpoint de usuarios no disponible.");
};

const consultarUsuariosBase = async (signal?: AbortSignal) => {
	const rawData = await consultarPrimerEndpoint([
		`${API_BASE_URL}/Usuario/usuario_Listar`,
		`${API_BASE_URL}/api/Usuario/usuario_Listar`,
	], signal);
	return normalizarUsuarios(parseReporteResponse(rawData));
};

const consultarUsuariosReporte = async (nombre: string, tipoUsuario: string, signal?: AbortSignal) => {
	const params = new URLSearchParams();
	if (nombre.trim()) params.append("nombre", nombre.trim());
	if (tipoUsuario.trim()) params.append("tipoUsuario", tipoUsuario.trim());

	// ATAMAINE: Primero se consulta el controller oficial; si no existe aun, se usara usuario_Listar.
	const query = params.toString() ? `?${params.toString()}` : "";
	const rawData = await consultarPrimerEndpoint([
		`${API_BASE_URL}/Reporte/reporte_Usuarios${query}`,
		`${API_BASE_URL}/api/Reporte/reporte_Usuarios${query}`,
	], signal);
	return normalizarUsuarios(parseReporteResponse(rawData));
};

type SelectorTipoProps = {
	value: string;
	tipos: string[];
	visible: boolean;
	onChange: (value: string) => void;
	onToggle: () => void;
	onSelect: (value: string) => void;
};

// ATAMAINE: Permite escribir o seleccionar tipos publicados por la API real.
const SelectorTipoUsuario = ({ value, tipos, visible, onChange, onToggle, onSelect }: SelectorTipoProps) => {
	const opciones = useMemo(
		() => tipos.filter((tipo) => normalizarBusqueda(tipo).includes(normalizarBusqueda(value))).slice(0, 20),
		[tipos, value],
	);

	return <View style={styles.selectorWrap}>
		<View style={[styles.selectorShell, visible ? styles.selectorShellFocused : null]}>
			<MaterialCommunityIcons name="account-cog-outline" size={17} color={visible ? "#0f766e" : "#8aa0b5"} />
			<TextInput value={value} onChangeText={onChange} placeholder="Escribe o selecciona el tipo" placeholderTextColor="#91a3b6" style={styles.selectorInput} returnKeyType="search" autoCorrect={false} />
			{value ? <TouchableOpacity style={styles.selectorClearButton} onPress={() => onChange("")}><MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
			<TouchableOpacity style={styles.selectorIconButton} onPress={onToggle}><MaterialCommunityIcons name={visible ? "chevron-up" : "chevron-down"} size={19} color="#0f766e" /></TouchableOpacity>
		</View>
		{visible ? <View style={styles.optionsBox}>
			<View style={styles.optionsHeader}><Text style={styles.optionsHeaderText}>Tipos de usuario</Text><Text style={styles.optionsHeaderText}>{opciones.length}</Text></View>
			{opciones.length ? <ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">{opciones.map((tipo) => <TouchableOpacity key={tipo} style={[styles.optionItem, normalizarBusqueda(tipo) === normalizarBusqueda(value) ? styles.optionItemActive : null]} onPress={() => onSelect(tipo)}><View style={styles.optionIcon}><MaterialCommunityIcons name="account-key-outline" size={15} color="#0f766e" /></View><Text style={styles.optionTitle}>{tipo}</Text><MaterialCommunityIcons name="chevron-right" size={16} color="#94a3b8" /></TouchableOpacity>)}</ScrollView> : <View style={styles.optionEmpty}><MaterialCommunityIcons name="account-question-outline" size={22} color="#94a3b8" /><Text style={styles.optionEmptyText}>No hay coincidencias.</Text></View>}
		</View> : null}
	</View>;
};

const ReporteUsuarios = ({ navigation }: ReporteUsuariosProps) => {
	const [nombre, setNombre] = useState("");
	const [tipoUsuario, setTipoUsuario] = useState("");
	const [mostrarTipos, setMostrarTipos] = useState(false);
	const [todosUsuarios, setTodosUsuarios] = useState<UsuarioReporteItem[]>([]);
	const [reporte, setReporte] = useState<UsuarioReporteItem[]>([]);
	const [cargando, setCargando] = useState(false);
	const [buscado, setBuscado] = useState(false);
	const [mensaje, setMensaje] = useState("");
	const [ultimoFiltro, setUltimoFiltro] = useState("");
	const [horaActual, setHoraActual] = useState(new Date());
	const fetchControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		// La cabecera no muestra segundos; un refresco por minuto evita parpadeos en la tabla.
		const timer = setInterval(() => setHoraActual(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	const cargarUsuariosIniciales = async () => {
		try {
			setCargando(true);
			setMensaje("");
			if (fetchControllerRef.current) fetchControllerRef.current.abort();
			fetchControllerRef.current = new AbortController();
			const usuariosBase = await consultarUsuariosBase(fetchControllerRef.current.signal);
			setTodosUsuarios(usuariosBase);
			setReporte(usuariosBase);
			setBuscado(false);
			setUltimoFiltro("");
			if (!usuariosBase.length) setMensaje("No existen usuarios registrados.");
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			console.error("Error al cargar usuarios registrados:", error);
			setTodosUsuarios([]);
			setReporte([]);
			setMensaje("No se pudo cargar la lista de usuarios.");
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		void cargarUsuariosIniciales();
		return () => fetchControllerRef.current?.abort();
	}, []);

	const tiposDisponibles = useMemo(() =>
		Array.from(new Set(todosUsuarios.map((usuario) => usuario.TipoUsuario).filter((tipo) => tipo && tipo !== "-"))).sort((a, b) => a.localeCompare(b)),
	[todosUsuarios]);

	const aplicarFiltroLocal = (nombreSiguiente: string, tipoSiguiente: string) => {
		const hayFiltro = Boolean(nombreSiguiente.trim() || tipoSiguiente.trim());
		if (!hayFiltro) {
			setReporte(todosUsuarios);
			setBuscado(false);
			setUltimoFiltro("");
			setMensaje("");
			return;
		}

		const filtrados = filtrarUsuariosLocal(todosUsuarios, nombreSiguiente, tipoSiguiente);
		const resumen = [nombreSiguiente.trim() ? `Nombre: ${nombreSiguiente.trim()}` : "", tipoSiguiente.trim() ? `Tipo: ${tipoSiguiente.trim()}` : ""].filter(Boolean).join(" | ");
		setReporte(filtrados);
		setBuscado(true);
		setUltimoFiltro(resumen);
		setMensaje(filtrados.length ? "" : "No se encontraron usuarios para ese criterio.");
	};

	const cambiarNombre = (value: string) => {
		const limpio = value.replace(/[^0-9a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").slice(0, 60);
		setNombre(limpio);
		aplicarFiltroLocal(limpio, tipoUsuario);
	};

	const cambiarTipo = (value: string) => {
		const limpio = value.replace(/[^0-9a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").slice(0, 50);
		setTipoUsuario(limpio);
		// Escribir solo filtra; abrir o cerrar las opciones pertenece a la flecha.
		aplicarFiltroLocal(nombre, limpio);
	};

	const seleccionarTipo = (value: string) => {
		setTipoUsuario(value);
		setMostrarTipos(false);
		aplicarFiltroLocal(nombre, value);
		Keyboard.dismiss();
	};

	const limpiarFiltro = async () => {
		setNombre("");
		setTipoUsuario("");
		setMostrarTipos(false);
		setBuscado(false);
		setMensaje("");
		Keyboard.dismiss();
		await cargarUsuariosIniciales();
	};

	const filtrosTexto = [
		nombre.trim() ? `Nombre: ${nombre.trim()}` : "",
		tipoUsuario.trim() ? `Tipo: ${tipoUsuario.trim()}` : "",
	]
		.filter(Boolean)
		.join(" | ");

	const consultarReporte = async () => {
		setMostrarTipos(false);
		Keyboard.dismiss();
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
				const base = todosUsuarios.length ? todosUsuarios : await consultarUsuariosBase(fetchControllerRef.current.signal);
				const publicados = await consultarUsuariosReporte(nombre, tipoUsuario, fetchControllerRef.current.signal);
				const enriquecidos = enriquecerUsuariosReporte(publicados, base);
				const publicadosFiltrados = filtrarUsuariosLocal(enriquecidos, nombre, tipoUsuario);
				const respaldoLocal = filtrarUsuariosLocal(base, nombre, tipoUsuario);
				filtrados = publicadosFiltrados.length ? publicadosFiltrados : respaldoLocal;
			} catch (error) {
				if ((error as Error).name === "AbortError") throw error;
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
	const listadoMostrar = buscado ? reporte : todosUsuarios;
	const usuariosParaPdf = listadoMostrar;
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
		return `<html><head><style>@page{size:A4 landscape;margin:18px 18px 56px 18px;}body{font-family:Arial,sans-serif;color:#0f172a;}table{width:100%;border-collapse:collapse;table-layout:fixed;}td,th{word-break:break-word;overflow-wrap:anywhere;}.footer-wrap{position:fixed;left:24px;right:24px;bottom:8px;display:flex;justify-content:space-between;gap:12px;padding-top:10px;border-top:1px solid #cbd5e1;font-size:10px;color:#475569;}</style></head><body style="padding:24px;"><div style="display:flex;justify-content:space-between;align-items:stretch;margin-bottom:18px;background:linear-gradient(135deg,#0f766e 0%,#164e63 55%,#1e3a8a 100%);border-radius:22px;overflow:hidden;"><div style="display:flex;align-items:center;gap:16px;padding:18px 20px;flex:1;">${logoHtml}<div><p style="margin:0 0 5px;color:#d1fae5;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(EMPRESA_NOMBRE)}</p><h1 style="margin:0;color:white;font-size:26px;">Reporte de Usuarios</h1><p style="margin:8px 0 0;color:#dbeafe;font-size:12px;">Documento generado en tiempo real desde usuarios registrados.</p></div></div><div style="min-width:230px;background:rgba(255,255,255,0.12);padding:18px 20px;"><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Documento:</strong> ${escapeHtml(numeroDocumento)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Fecha:</strong> ${escapeHtml(fechaFormateada)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Hora:</strong> ${escapeHtml(horaFormateada)}</p><p style="margin:0 0 8px;color:white;font-size:12px;"><strong>Filtro:</strong> ${escapeHtml(ultimoFiltro || "Todos los usuarios")}</p><p style="margin:0;color:white;font-size:12px;"><strong>Total:</strong> ${usuariosParaPdf.length} registros</p></div></div><div style="border:1px solid #dbe4ea;border-radius:18px;overflow:hidden;"><table><colgroup>${colgroupHtml}</colgroup><thead><tr>${encabezadosHtml}</tr></thead><tbody>${filasHtml}</tbody></table></div><div class="footer-wrap"><div><strong>${escapeHtml(EMPRESA_NOMBRE)}</strong> | Reporte interno de usuarios. Contacto: ${escapeHtml(EMPRESA_CONTACTO)}</div></div></body></html>`;
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

	const esColumnaCorta = (key: keyof UsuarioReporteItem) =>
		key === "IdUsuario" || key === "Celular" || key === "TipoUsuario";
	const usuariosActivos = listadoMostrar.filter((usuario) => esUsuarioActivo(usuario.Estado)).length;
	const usuariosInactivos = listadoMostrar.length - usuariosActivos;

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
						<View style={styles.heroContent}><Text style={styles.title}>Gestion Integral</Text><Text style={styles.title}>de Usuarios</Text><Text style={styles.subtitle}>Consulta usuarios por nombre y tipo usando datos reales de la API.</Text></View>
						<View style={styles.peopleScene}><View style={[styles.personBubble, styles.personBubbleBlue]}><MaterialCommunityIcons name="account-tie-outline" size={17} color="#ffffff" /></View><View style={[styles.personBubble, styles.personBubbleGreen]}><MaterialCommunityIcons name="account-check-outline" size={17} color="#ffffff" /></View><View style={[styles.personBubble, styles.personBubblePurple]}><MaterialCommunityIcons name="shield-account-outline" size={17} color="#ffffff" /></View><View style={styles.peopleBase} /></View>
					</View>

					<View style={styles.statsGrid}>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#dbeafe" }]}><MaterialCommunityIcons name="account-group-outline" size={13} color="#2563eb" /></View><Text style={styles.statLabel}>Usuarios</Text>{cargando ? <ActivityIndicator size="small" color="#2563eb" style={styles.statLoader} /> : <Text selectable style={styles.statValue}>{listadoMostrar.length}</Text>}<Text style={styles.statCaption}>Resultados</Text><View style={[styles.statAccentLine, { backgroundColor: "#2563eb" }]} /></View>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#d1fae5" }]}><MaterialCommunityIcons name="account-check-outline" size={13} color="#059669" /></View><Text style={styles.statLabel}>Activos</Text><Text selectable style={styles.statValue}>{usuariosActivos}</Text><Text style={styles.statCaption}>Habilitados</Text><View style={[styles.statAccentLine, { backgroundColor: "#10b981" }]} /></View>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#ffe4e6" }]}><MaterialCommunityIcons name="account-cancel-outline" size={13} color="#e11d48" /></View><Text style={styles.statLabel}>Inactivos</Text><Text selectable style={styles.statValue}>{usuariosInactivos}</Text><Text style={styles.statCaption}>Deshabilitados</Text><View style={[styles.statAccentLine, { backgroundColor: "#f43f5e" }]} /></View>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#f3e8ff" }]}><MaterialCommunityIcons name="filter-check-outline" size={13} color="#7c3aed" /></View><Text style={styles.statLabel}>Ultimo filtro</Text><Text selectable style={[styles.statValue, styles.statValueText]} numberOfLines={2}>{ultimoFiltro || "Sin filtro"}</Text><Text style={styles.statCaption}>Consulta actual</Text><View style={[styles.statAccentLine, { backgroundColor: "#8b5cf6" }]} /></View>
					</View>
				</LinearGradient>

				<View style={styles.searchCard}>
					<Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
					<Text style={styles.fieldLabel}>Nombre del usuario</Text>
					<View style={styles.inputShell}><MaterialCommunityIcons name="account-search-outline" size={16} color="#8aa0b5" /><TextInput value={nombre} onChangeText={cambiarNombre} onFocus={() => setMostrarTipos(false)} placeholder="Escribe el nombre del usuario" placeholderTextColor="#91a3b6" style={styles.input} returnKeyType="search" autoCorrect={false} onSubmitEditing={() => void consultarReporte()} />{nombre ? <TouchableOpacity onPress={() => cambiarNombre("")}><MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}</View>
					<Text style={styles.fieldLabel}>Tipo de usuario</Text>
					<SelectorTipoUsuario value={tipoUsuario} tipos={tiposDisponibles} visible={mostrarTipos} onChange={cambiarTipo} onToggle={() => setMostrarTipos((actual) => !actual)} onSelect={seleccionarTipo} />

					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.actionButton} onPress={() => void consultarReporte()}><LinearGradient colors={["#1f75ff", "#0657d9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="magnify" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Buscar</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("RegistrarUsuario", { onRefresh: cargarUsuariosIniciales })}><LinearGradient colors={["#0f9f73", "#047857"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="account-plus-outline" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Nuevo</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={() => void limpiarFiltro()}><LinearGradient colors={["#6b7280", "#475569"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="trash-can-outline" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Limpiar</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={[styles.actionButton, (!usuariosParaPdf.length || cargando) && styles.buttonDisabled]} onPress={generarPDF} disabled={!usuariosParaPdf.length || cargando}><LinearGradient colors={["#f59e0b", "#f97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="file-pdf-box" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>PDF</Text></LinearGradient></TouchableOpacity>
					</View>
				</View>

				<View style={styles.contentCard}>
					<View style={styles.contentTitleRow}><MaterialCommunityIcons name="account-details-outline" size={18} color="#2563eb" /><Text style={styles.contentTitle}>Listado del Reporte</Text></View>
					{cargando ? <ActivityIndicator size="large" color="#2563eb" style={styles.loader} /> : null}
					{!cargando && mensaje ? <View style={styles.messageBox}><Text selectable style={styles.messageText}>{mensaje}</Text></View> : null}
					{!cargando && buscado && listadoMostrar.length > 0 ? <Text selectable style={styles.resultCounter}>Mostrando {listadoMostrar.length} resultado{listadoMostrar.length === 1 ? "" : "s"} para: {ultimoFiltro}</Text> : null}
					{!cargando && listadoMostrar.length === 0 && !mensaje ? <View style={styles.emptyState}><View style={styles.emptyIconWrap}><MaterialCommunityIcons name="account-search-outline" size={28} color="#0f766e" /></View><Text style={styles.emptyTitle}>Sin usuarios</Text><Text selectable style={styles.emptyText}>No se encontraron usuarios para el criterio ingresado.</Text></View> : null}
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
								<View key={`${item.IdUsuario}-${index}`} style={[styles.tableDataRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
									{COLUMNAS_REPORTE.map((columna) => (
										<View key={`${index}-${columna.key}`} style={[styles.tableDataCell, { flex: columna.flex }]}>
											{columna.key === "Estado" ? (
												<View style={[styles.estadoBadge, esUsuarioActivo(String(item.Estado)) ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo]}>
											<Text selectable style={[styles.estadoBadgeText, esUsuarioActivo(String(item.Estado)) ? styles.estadoBadgeTextActivo : styles.estadoBadgeTextInactivo]}>{String(item[columna.key] ?? "-")}</Text>
										</View>
									) : (
										<Text selectable style={[styles.tableDataText, esColumnaCorta(columna.key) ? styles.tableDataTextTight : null]} numberOfLines={2} adjustsFontSizeToFit={esColumnaCorta(columna.key)} minimumFontScale={0.78}>
													{String(item[columna.key] ?? "-")}
												</Text>
											)}
										</View>
								))}
								<View style={styles.tableActionCell}>
									<TouchableOpacity style={styles.verButton} onPress={() => abrirUsuarioRegistrado(navigation, item)} accessibilityLabel={`Ver usuario ${item.Nombre}`}>
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

export default ReporteUsuarios;

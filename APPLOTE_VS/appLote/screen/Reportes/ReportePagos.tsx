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
import i18n from "../../i18n";
import styles from "./ReportePagosStyles";

type ReporteItem = Record<string, unknown>;
type FuentePagos = "principal" | "respaldo";
type EndpointPagos = { url: string; fuente: FuentePagos };

type PagoReporteItem = {
	IdPago: string;
	IdVenta: string;
	IdCliente: string;
	IdUsuario: string;
	Cliente: string;
	Lote: string;
	Comprobante: string;
	FechaPago: string;
	FechaPagoIso: string;
	Monto: string;
	Cuota: string;
	Mora: string;
	EstadoPago: string;
};

type ClienteCatalogoItem = { IdCliente: string; DNI: string; Nombre: string };
type VentaCatalogoItem = { IdVenta: string; IdCliente: string; IdUsuario: string; Cliente: string; Lote: string; Proyecto: string };

type ReportePagosProps = {
	navigation: any;
};

const EMPRESA_NOMBRE = "Residencial Santa Fe";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "RSF";
const API_BASE_URL = API_URL.replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 15000;
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

// ATAMAINE: Los selectores comparan sin distinguir mayusculas ni tildes.
const normalizarTerminoBusqueda = (value: unknown) =>
	textoLimpio(value, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const coincideOpcion = (opcion: string, criterio: string) =>
	normalizarTerminoBusqueda(opcion).includes(normalizarTerminoBusqueda(criterio));

const resolverOpcionFiltro = (criterio: string, opciones: string[]) => {
	const termino = normalizarTerminoBusqueda(criterio);
	if (!termino) return "";
	const exacta = opciones.find((opcion) => normalizarTerminoBusqueda(opcion) === termino);
	if (exacta) return exacta;
	const parciales = opciones.filter((opcion) => coincideOpcion(opcion, criterio));
	return parciales.length === 1 ? parciales[0] : criterio.trim();
};

const limpiarFecha = (value: string) => {
	const digitos = value.replace(/[^0-9]/g, "").slice(0, 8);
	if (digitos.length <= 4) return digitos;
	if (digitos.length <= 6) return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
	return `${digitos.slice(0, 4)}-${digitos.slice(4, 6)}-${digitos.slice(6)}`;
};

const esFechaIsoValida = (value: string) => {
	if (!value.trim()) return true;
	const partes = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!partes) return false;
	const [, anio, mes, dia] = partes;
	const fecha = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
	return fecha.getUTCFullYear() === Number(anio) && fecha.getUTCMonth() === Number(mes) - 1 && fecha.getUTCDate() === Number(dia);
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

		const keys = ["d", "Data", "data", "result", "Resultado", "resultados", "Resultados", "Table"];
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
			const response = await fetchConTimeout(endpoint.url, signal);
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
		...(idVenta.trim()
			? [
				{ url: `${API_BASE_URL}/Pago/pago_ListarPorVenta/${encodeURIComponent(idVenta.trim())}`, fuente: "principal" as FuentePagos },
				{ url: `${API_BASE_URL}/api/Pago/pago_ListarPorVenta/${encodeURIComponent(idVenta.trim())}`, fuente: "principal" as FuentePagos },
			]
			: []),
		{ url: `${API_BASE_URL}/Reporte/reporte_Pagos${query ? `?${query}` : ""}`, fuente: "principal" },
		{ url: `${API_BASE_URL}/api/Reporte/reporte_Pagos${query ? `?${query}` : ""}`, fuente: "principal" },
		{ url: `${API_BASE_URL}/Reporte/reporte_PagosRealizados/${encodeURIComponent(fechaDesdeRespaldo)}/${encodeURIComponent(fechaHastaRespaldo)}`, fuente: "respaldo" },
		{ url: `${API_BASE_URL}/api/Reporte/reporte_PagosRealizados/${encodeURIComponent(fechaDesdeRespaldo)}/${encodeURIComponent(fechaHastaRespaldo)}`, fuente: "respaldo" },
	];
};

const fetchConTimeout = async (url: string, signal?: AbortSignal) => {
	const controller = new AbortController();
	let vencio = false;
	const cancelar = () => controller.abort();
	if (signal?.aborted) cancelar();
	else signal?.addEventListener("abort", cancelar, { once: true });
	const timer = setTimeout(() => { vencio = true; controller.abort(); }, REQUEST_TIMEOUT_MS);

	try {
		return await fetch(url, { signal: controller.signal });
	} catch (error) {
		if (vencio && !signal?.aborted) throw new Error("La API tardo demasiado en responder.");
		throw error;
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener("abort", cancelar);
	}
};

const construirUrlsVentas = (): EndpointPagos[] => [
	{ url: `${API_BASE_URL}/Venta/venta_Listar`, fuente: "principal" },
	{ url: `${API_BASE_URL}/api/Venta/venta_Listar`, fuente: "principal" },
];

const construirUrlsClientes = (): EndpointPagos[] => [
	{ url: `${API_BASE_URL}/Cliente/cliente_Listar`, fuente: "principal" },
	{ url: `${API_BASE_URL}/api/Cliente/cliente_Listar`, fuente: "principal" },
];

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

const formatoFechaIso = (value: unknown) => {
	const texto = textoLimpio(value, "");
	const directa = texto.match(/^(\d{4}-\d{2}-\d{2})/);
	if (directa) return directa[1];
	const fecha = new Date(texto);
	return Number.isNaN(fecha.getTime()) ? "" : fecha.toISOString().slice(0, 10);
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
		const fechaPago = obtenerValor(item, ["FechaPago", "Fecha", "FechaRegistro", "FechaEmision"]);
		return {
			IdPago: textoLimpio(obtenerValor(item, ["IdPago", "Idpago", "IDPago", "Id", "ID"])),
			IdVenta: textoLimpio(venta, "-"),
			IdCliente: textoLimpio(obtenerValor(item, ["IdCliente", "idCliente", "IDCliente"]), ""),
			IdUsuario: textoLimpio(obtenerValor(item, ["IdUsuario", "idUsuario", "IDUsuario"]), ""),
			Cliente: textoLimpio(obtenerValor(item, ["Cliente", "NombreCliente", "NombreCompleto", "DNI", "DocumentoCliente", "RazonSocial"]), ""),
			Lote: textoLimpio(obtenerValor(item, ["CodigoLote", "CodLote", "Lote", "NombreLote"]), ""),
			Comprobante: comprobante || "-",
			FechaPago: formatoFecha(fechaPago),
			FechaPagoIso: formatoFechaIso(fechaPago),
			Monto: formatoMoneda(obtenerValor(item, ["Monto", "MontoPago", "Importe", "Total", "TotalPago"])),
			Cuota: textoLimpio(obtenerValor(item, ["NumeroCuota", "Cuota", "NroCuota", "IdCronograma"])),
			Mora: formatoMoneda(obtenerValor(item, ["MoraPorCuota", "Mora", "MontoMora"])),
			EstadoPago: normalizarEstadoPago(estadoApi),
		};
		});

const normalizarClientesCatalogo = (items: ReporteItem[]): ClienteCatalogoItem[] =>
	items.map((item) => {
		const nombre = [item.Nombre1, item.Nombre2, item.Apaterno, item.Amaterno]
			.map((parte) => textoLimpio(parte, ""))
			.filter(Boolean)
			.join(" ");
		return {
			IdCliente: textoLimpio(obtenerValor(item, ["IdCliente", "idCliente", "IDCliente"]), ""),
			DNI: textoLimpio(obtenerValor(item, ["DNI", "Dni", "dni", "Documento"]), ""),
			Nombre: nombre || textoLimpio(obtenerValor(item, ["Cliente", "NombreCliente", "NombreCompleto"]), "Sin nombre"),
		};
	}).filter((cliente) => Boolean(cliente.IdCliente));

const normalizarVentasCatalogo = (items: ReporteItem[], clientes: ClienteCatalogoItem[]): VentaCatalogoItem[] => {
	const nombres = new Map(clientes.map((cliente) => [cliente.IdCliente, cliente.Nombre]));
	return items.map((item) => {
		const idCliente = textoLimpio(obtenerValor(item, ["IdCliente", "idCliente", "IDCliente"]), "");
		const manzana = textoLimpio(obtenerValor(item, ["Manzana", "Mz"]), "");
		const numeroLote = textoLimpio(obtenerValor(item, ["NumeroLote", "NumLote"]), "");
		const lote = textoLimpio(obtenerValor(item, ["CodigoLote", "CodLote", "Lote"]), [manzana, numeroLote].filter(Boolean).join(""));
		return {
			IdVenta: textoLimpio(obtenerValor(item, ["IdVenta", "idVenta", "IDVenta"]), ""),
			IdCliente: idCliente,
			IdUsuario: textoLimpio(obtenerValor(item, ["IdUsuario", "idUsuario", "IDUsuario"]), ""),
			Cliente: nombres.get(idCliente) || `Cliente ${idCliente || "-"}`,
			Lote: lote || "-",
			Proyecto: textoLimpio(obtenerValor(item, ["Proyecto", "NombreProyecto"]), "Sin proyecto"),
		};
	}).filter((venta) => Boolean(venta.IdVenta));
};

const consultarCatalogosPagos = async (signal?: AbortSignal) => {
	const [clientesRespuesta, ventasRespuesta] = await Promise.all([
		consultarPrimerEndpointDisponible(construirUrlsClientes(), signal),
		consultarPrimerEndpointDisponible(construirUrlsVentas(), signal),
	]);
	const clientes = normalizarClientesCatalogo(parseReporteResponse(clientesRespuesta.payload));
	const ventas = normalizarVentasCatalogo(parseReporteResponse(ventasRespuesta.payload), clientes);
	return { clientes, ventas };
};

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

// ATAMAINE: Completa cliente, usuario y lote usando la venta asociada. De esta
// forma el filtro por DNI funciona aunque el endpoint de pagos no incluya IdCliente.
const enriquecerPagos = (
	items: PagoReporteItem[],
	ventasCatalogo: VentaCatalogoItem[],
	clientesCatalogo: ClienteCatalogoItem[],
) => {
	const ventas = new Map(ventasCatalogo.map((venta) => [venta.IdVenta.trim(), venta]));
	const clientes = new Map(clientesCatalogo.map((cliente) => [cliente.IdCliente.trim(), cliente.Nombre]));

	return items.map((pago) => {
		const venta = ventas.get(pago.IdVenta.trim());
		const idCliente = (pago.IdCliente || venta?.IdCliente || "").trim();
		return {
			...pago,
			IdCliente: idCliente,
			IdUsuario: pago.IdUsuario || venta?.IdUsuario || "",
			Cliente: clientes.get(idCliente) || pago.Cliente || venta?.Cliente || `Cliente ${idCliente || "-"}`,
			Lote: pago.Lote || venta?.Lote || "-",
		};
	});
};

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
	{ key: "Comprobante", label: "Comp.", flex: 0.75 },
	{ key: "IdVenta", label: "Venta", flex: 0.7 },
	{ key: "Cliente", label: "Cliente", flex: 1.1 },
	{ key: "FechaPago", label: "Fecha", flex: 0.95 },
	{ key: "Monto", label: "Monto", flex: 0.9 },
	{ key: "Cuota", label: "Cuota", flex: 0.72 },
	{ key: "EstadoPago", label: "Estado", flex: 0.88 },
];

type SelectorBuscableProps = {
	label: string;
	value: string;
	placeholder: string;
	opciones: string[];
	visible: boolean;
	cargando?: boolean;
	icono: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
	onChange: (value: string) => void;
	onFocus: () => void;
	onToggle: () => void;
	onSelect: (value: string) => void;
	onSubmit: () => void;
};

// ATAMAINE: Selector reutilizable que permite escribir o elegir datos publicados por la API.
const SelectorBuscable = ({ label, value, placeholder, opciones, visible, cargando = false, icono, onChange, onFocus, onToggle, onSelect, onSubmit }: SelectorBuscableProps) => {
	const filtradas = useMemo(() => opciones.filter((opcion) => coincideOpcion(opcion, value)).slice(0, 20), [opciones, value]);
	return <>
		<Text style={styles.fieldLabel}>{label}</Text>
		<View style={styles.selectorWrap}>
			<View style={[styles.selectorShell, visible ? styles.selectorShellFocused : null]}>
				<MaterialCommunityIcons name={icono} size={17} color={visible ? "#0f766e" : "#8aa0b5"} />
				<TextInput value={value} onChangeText={onChange} onFocus={onFocus} placeholder={cargando ? "Cargando opciones..." : placeholder} placeholderTextColor="#91a3b6" style={styles.selectorInput} returnKeyType="search" autoCorrect={false} onSubmitEditing={onSubmit} />
				{value ? <TouchableOpacity style={styles.selectorClearButton} onPress={() => onChange("")}><MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
				<TouchableOpacity style={styles.selectorIconButton} onPress={onToggle}>{cargando ? <ActivityIndicator size="small" color="#0f766e" /> : <MaterialCommunityIcons name={visible ? "chevron-up" : "chevron-down"} size={19} color="#0f766e" />}</TouchableOpacity>
			</View>
			{visible ? <View style={styles.optionsBox}>
				<View style={styles.optionsHeader}><Text style={styles.optionsHeaderText}>Opciones disponibles</Text><Text style={styles.optionsHeaderText}>{filtradas.length}</Text></View>
				{filtradas.length ? <ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">{filtradas.map((opcion) => <TouchableOpacity key={opcion} style={[styles.optionItem, normalizarTerminoBusqueda(opcion) === normalizarTerminoBusqueda(value) ? styles.optionItemActive : null]} onPress={() => onSelect(opcion)}><View style={styles.optionIcon}><MaterialCommunityIcons name={icono} size={15} color="#0f766e" /></View><View style={styles.optionContent}><Text style={styles.optionTitle}>{opcion}</Text><Text style={styles.optionMeta}>Seleccionar filtro</Text></View><MaterialCommunityIcons name="chevron-right" size={16} color="#94a3b8" /></TouchableOpacity>)}</ScrollView> : <View style={styles.optionEmpty}><MaterialCommunityIcons name="text-search" size={22} color="#94a3b8" /><Text style={styles.optionEmptyText}>No hay coincidencias.</Text></View>}
			</View> : null}
		</View>
	</>;
};

type SelectorClienteProps = {
	value: string;
	clientes: ClienteCatalogoItem[];
	visible: boolean;
	seleccionado: ClienteCatalogoItem | null;
	onChange: (value: string) => void;
	onFocus: () => void;
	onToggle: () => void;
	onSelect: (cliente: ClienteCatalogoItem) => void;
	onSubmit: () => void;
};

// ATAMAINE: Un solo buscador acepta DNI numerico o nombre alfabetico.
const SelectorCliente = ({ value, clientes, visible, seleccionado, onChange, onFocus, onToggle, onSelect, onSubmit }: SelectorClienteProps) => {
	const opciones = useMemo(() => {
		const criterio = normalizarTerminoBusqueda(value);
		return clientes
			.filter((cliente) => !criterio || cliente.DNI.includes(criterio) || normalizarTerminoBusqueda(cliente.Nombre).includes(criterio))
			.slice(0, 20);
	}, [clientes, value]);

	return <>
		<Text style={styles.fieldLabel}>Buscar cliente por DNI o nombre</Text>
		<View style={[styles.selectorWrap, styles.clienteSelectorWrap]}>
			<View style={[styles.selectorShell, visible ? styles.selectorShellFocused : null]}>
				<MaterialCommunityIcons name="account-search-outline" size={17} color={visible ? "#0f766e" : "#8aa0b5"} />
				<TextInput value={value} onChangeText={onChange} onFocus={onFocus} placeholder="Escribe DNI o nombre del cliente" placeholderTextColor="#91a3b6" style={styles.selectorInput} returnKeyType="search" autoCorrect={false} autoCapitalize="words" onSubmitEditing={onSubmit} />
				{value ? <TouchableOpacity style={styles.selectorClearButton} onPress={() => onChange("")}><MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
				<TouchableOpacity style={styles.selectorIconButton} onPress={onToggle}><MaterialCommunityIcons name={visible ? "chevron-up" : "chevron-down"} size={19} color="#0f766e" /></TouchableOpacity>
			</View>
			{visible ? <View style={styles.optionsBox}>
				<View style={styles.optionsHeader}><Text style={styles.optionsHeaderText}>Clientes por DNI o nombre</Text><Text style={styles.optionsHeaderText}>{opciones.length}</Text></View>
				{opciones.length ? <ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">{opciones.map((cliente) => {
					const activo = seleccionado?.IdCliente === cliente.IdCliente;
					return <TouchableOpacity key={cliente.IdCliente} style={[styles.optionItem, activo ? styles.optionItemActive : null]} onPress={() => onSelect(cliente)}><View style={styles.optionIcon}><MaterialCommunityIcons name="account-outline" size={15} color="#0f766e" /></View><View style={styles.optionContent}><Text style={styles.optionTitle}>{cliente.DNI || "Sin DNI"}</Text><Text style={styles.optionMeta}>{cliente.Nombre}</Text></View>{activo ? <MaterialCommunityIcons name="check-circle" size={17} color="#10b981" /> : <MaterialCommunityIcons name="chevron-right" size={16} color="#94a3b8" />}</TouchableOpacity>;
				})}</ScrollView> : <View style={styles.optionEmpty}><MaterialCommunityIcons name="account-question-outline" size={22} color="#94a3b8" /><Text style={styles.optionEmptyText}>No hay clientes que coincidan.</Text></View>}
			</View> : null}
		</View>
	</>;
};

type SelectorVentaProps = {
	value: string;
	ventas: VentaCatalogoItem[];
	visible: boolean;
	onChange: (value: string) => void;
	onFocus: () => void;
	onToggle: () => void;
	onSelect: (venta: VentaCatalogoItem) => void;
	onSubmit: () => void;
};

const SelectorVenta = ({ value, ventas, visible, onChange, onFocus, onToggle, onSelect, onSubmit }: SelectorVentaProps) => {
	const opciones = useMemo(() => ventas.filter((venta) => !value || venta.IdVenta.includes(value)).slice(0, 20), [ventas, value]);
	return <>
		<Text style={styles.fieldLabel}>Venta</Text>
		<View style={[styles.selectorWrap, styles.ventaSelectorWrap]}>
			<View style={[styles.selectorShell, visible ? styles.selectorShellFocused : null]}>
				<MaterialCommunityIcons name="file-document-outline" size={17} color={visible ? "#0f766e" : "#8aa0b5"} />
				<TextInput value={value} onChangeText={(texto) => onChange(texto.replace(/[^0-9]/g, ""))} onFocus={onFocus} placeholder="Escribe o selecciona una venta" placeholderTextColor="#91a3b6" style={styles.selectorInput} keyboardType="number-pad" returnKeyType="search" onSubmitEditing={onSubmit} />
				{value ? <TouchableOpacity style={styles.selectorClearButton} onPress={() => onChange("")}><MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
				<TouchableOpacity style={styles.selectorIconButton} onPress={onToggle}><MaterialCommunityIcons name={visible ? "chevron-up" : "chevron-down"} size={19} color="#0f766e" /></TouchableOpacity>
			</View>
			{visible ? <View style={styles.optionsBox}>
				<View style={styles.optionsHeader}><Text style={styles.optionsHeaderText}>Ventas registradas</Text><Text style={styles.optionsHeaderText}>{opciones.length}</Text></View>
				{opciones.length ? <ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">{opciones.map((venta) => <TouchableOpacity key={venta.IdVenta} style={[styles.optionItem, venta.IdVenta === value ? styles.optionItemActive : null]} onPress={() => onSelect(venta)}><View style={styles.optionIcon}><MaterialCommunityIcons name="cash-register" size={15} color="#0f766e" /></View><View style={styles.optionContent}><Text style={styles.optionTitle}>Venta #{venta.IdVenta} · Lote {venta.Lote}</Text><Text style={styles.optionMeta}>{venta.Cliente} · {venta.Proyecto}</Text></View>{venta.IdVenta === value ? <MaterialCommunityIcons name="check-circle" size={17} color="#10b981" /> : <MaterialCommunityIcons name="chevron-right" size={16} color="#94a3b8" />}</TouchableOpacity>)}</ScrollView> : <View style={styles.optionEmpty}><MaterialCommunityIcons name="file-search-outline" size={22} color="#94a3b8" /><Text style={styles.optionEmptyText}>No existe esa venta.</Text></View>}
			</View> : null}
		</View>
	</>;
};

const obtenerLogoPdfUri = () => {
	const resolver = (Image as any).resolveAssetSource;
	if (typeof resolver !== "function") return "";
	return resolver(require("../../assets/splash-icon.png"))?.uri || "";
};

const abrirVentas = (navigation: any, venta: VentaCatalogoItem) => {
	const rutas = navigation.getState?.().routes ?? [];
	const mainTabs = [...rutas].reverse().find((ruta: any) => ruta.name === "MainTabs");
	const sesion = mainTabs?.params ?? {};
	// ATAMAINE: Un pago nace desde una cuota; abrimos la venta exacta y su cronograma.
	navigation.navigate("MainTabs", {
		...sesion,
		screen: i18n.t("btVentas"),
		params: {
			idUsuario: venta.IdUsuario || sesion.idUsuario,
			nombre: sesion.nombre,
			rol: sesion.rol,
			ventaSeleccionadaId: venta.IdVenta,
			clienteSeleccionadoId: venta.IdCliente,
			clienteSeleccionadoNombre: venta.Cliente,
			origenReporteCobranzas: false,
			origenReportePagos: true,
			abrirCronogramaParaPago: true,
			solicitudNuevoPago: Date.now(),
		},
	});
};

const abrirVentaDelPago = (navigation: any, item: PagoReporteItem) => {
	if (!item.IdVenta || item.IdVenta === "-") {
		Alert.alert("Venta no disponible", "Este pago no incluye un identificador de venta.");
		return;
	}
	const rutas = navigation.getState?.().routes ?? [];
	const mainTabs = [...rutas].reverse().find((ruta: any) => ruta.name === "MainTabs");
	const sesion = mainTabs?.params ?? {};
	// ATAMAINE: Abrimos la compra exacta y conservamos los datos de la sesion principal.
	navigation.navigate("MainTabs", {
		...sesion,
		screen: i18n.t("btVentas"),
		params: {
			idUsuario: item.IdUsuario || sesion.idUsuario,
			nombre: sesion.nombre,
			rol: sesion.rol,
			ventaSeleccionadaId: item.IdVenta,
			clienteSeleccionadoId: item.IdCliente,
			clienteSeleccionadoNombre: item.Cliente,
			// Ventas usa este origen para filtrar a la persona y resaltar esta compra.
			origenReporteCobranzas: false,
			origenReportePagos: true,
			abrirCronogramaParaPago: false,
			solicitudNuevoPago: 0,
		},
	});
};

const ReportePagos = ({ navigation }: ReportePagosProps) => {
	const [estadoPago, setEstadoPago] = useState("");
	const [estadosPago, setEstadosPago] = useState<string[]>(ESTADOS_PAGO_RESPALDO);
	const [mostrarEstadosPago, setMostrarEstadosPago] = useState(false);
	const [cargandoEstadosPago, setCargandoEstadosPago] = useState(false);
	const [idVenta, setIdVenta] = useState("");
	const [mostrarVentas, setMostrarVentas] = useState(false);
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");
	const [clientesCatalogo, setClientesCatalogo] = useState<ClienteCatalogoItem[]>([]);
	const [ventasCatalogo, setVentasCatalogo] = useState<VentaCatalogoItem[]>([]);
	const [busquedaCliente, setBusquedaCliente] = useState("");
	const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteCatalogoItem | null>(null);
	const [mostrarClientes, setMostrarClientes] = useState(false);
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
	const filtrosClienteAutomaticosRef = useRef(false);
	const omitirSiguienteDebounceRef = useRef(false);

	const horaFormateada = horaActual.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
	const fechaFormateada = horaActual.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" });
	const logoPdfUri = obtenerLogoPdfUri();
	const listadoMostrar = useMemo(() => {
		const pagosBase = buscado ? reporte : todosPagos;
		const enriquecidos = enriquecerPagos(pagosBase, ventasCatalogo, clientesCatalogo);
		return clienteSeleccionado
			? enriquecidos.filter((pago) => pago.IdCliente.trim() === clienteSeleccionado.IdCliente.trim())
			: enriquecidos;
	}, [buscado, reporte, todosPagos, ventasCatalogo, clientesCatalogo, clienteSeleccionado]);
	const pagosParaPdf = listadoMostrar;
	const ventaSeleccionada = useMemo(() => ventasCatalogo.find((venta) => venta.IdVenta === idVenta) ?? null, [ventasCatalogo, idVenta]);

	const abrirNuevoPago = () => {
		const ventasDelCliente = clienteSeleccionado
			? ventasCatalogo.filter((venta) => venta.IdCliente === clienteSeleccionado.IdCliente)
			: ventasCatalogo;
		const ventaParaPago = ventaSeleccionada ?? (ventasDelCliente.length === 1 ? ventasDelCliente[0] : null);

		if (!ventaParaPago) {
			// ATAMAINE: DetallePago necesita una cuota perteneciente a una venta real.
			setMostrarVentas(true);
			setMostrarClientes(false);
			setMostrarEstadosPago(false);
			Alert.alert("Selecciona una venta", "Escribe o elige la venta antes de registrar un nuevo pago.");
			return;
		}

		Keyboard.dismiss();
		abrirVentas(navigation, ventaParaPago);
	};

	const cargarPagos = async (
		forzarFiltros = false,
		filtros?: { estadoPago: string; idVenta: string; fechaDesde: string; fechaHasta: string },
		silencioso = false,
	) => {
		const filtroEstado = filtros?.estadoPago ?? estadoPago;
		const filtroVenta = filtros?.idVenta ?? idVenta;
		const filtroDesde = filtros?.fechaDesde ?? fechaDesde;
		const filtroHasta = filtros?.fechaHasta ?? fechaHasta;
		if (!esFechaIsoValida(filtroDesde)) {
			setMensaje("La fecha inicial debe tener el formato AAAA-MM-DD y ser valida.");
			return;
		}
		if (!esFechaIsoValida(filtroHasta)) {
			setMensaje("La fecha final debe tener el formato AAAA-MM-DD y ser valida.");
			return;
		}
		if (filtroDesde && filtroHasta && new Date(filtroDesde).getTime() > new Date(filtroHasta).getTime()) {
			setMensaje("La fecha inicial no puede ser posterior a la fecha final.");
			return;
		}
		const hayFiltro = Boolean(filtroEstado.trim() || filtroVenta.trim() || filtroDesde.trim() || filtroHasta.trim());
		const usarFiltros = forzarFiltros || hayFiltro;
		const filtrosResumen = [
			clienteSeleccionado ? `Cliente: ${clienteSeleccionado.DNI || clienteSeleccionado.Nombre}` : "",
			filtroEstado.trim() ? `Estado: ${filtroEstado.trim()}` : "",
			filtroVenta.trim() ? `Venta: ${filtroVenta.trim()}` : "",
			filtroDesde.trim() ? `Desde: ${filtroDesde.trim()}` : "",
			filtroHasta.trim() ? `Hasta: ${filtroHasta.trim()}` : "",
		]
			.filter(Boolean)
			.join(" | ");

		try {
			if (!silencioso) setCargando(true);
			setMensaje("");
			if (fetchControllerRef.current) fetchControllerRef.current.abort();
			fetchControllerRef.current = new AbortController();

			const estadoConsulta = resolverOpcionFiltro(filtroEstado, estadosPago);
			const resultado = await consultarPagos(
				usarFiltros ? estadoConsulta : "",
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
			setEstadosPago((actuales) => Array.from(new Set([...actuales, ...obtenerEstadosDesdePagos(pagos)])));
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			// ATAMAINE: Si la API publicada aun no tiene reporte_Pagos, evitamos ruido rojo y mostramos estado controlado.
			if (!silencioso) {
				setReporte([]);
				if (!buscado) setTodosPagos([]);
			}
			setMensaje("No se pudo cargar el reporte de pagos.");
		} finally {
			if (!silencioso) setCargando(false);
		}
	};

	useEffect(() => {
		// El encabezado no muestra segundos; actualizar por minuto evita rerenderizar toda la tabla cada segundo.
		const timer = setInterval(() => setHoraActual(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		const cargarCatalogos = async () => {
			try {
				const catalogos = await consultarCatalogosPagos(controller.signal);
				setClientesCatalogo(catalogos.clientes);
				setVentasCatalogo(catalogos.ventas);
			} catch (error) {
				if ((error as Error).name !== "AbortError") {
					setClientesCatalogo([]);
					setVentasCatalogo([]);
				}
			}
		};
		void cargarCatalogos();
		return () => controller.abort();
	}, []);

	useEffect(() => {
		void cargarPagos(false);
		return () => {
			if (fetchControllerRef.current) fetchControllerRef.current.abort();
		};
	}, []);

	const aplicarCliente = async (cliente: ClienteCatalogoItem) => {
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		filtrosClienteAutomaticosRef.current = true;
		setClienteSeleccionado(cliente);
		setBusquedaCliente(cliente.DNI || cliente.Nombre);
		setMostrarClientes(false);
		setMostrarEstadosPago(false);
		setMostrarVentas(false);
		Keyboard.dismiss();

		try {
			setCargando(true);
			setMensaje("");
			const pagosBase = todosPagos.length ? todosPagos : (await consultarPagos("", "", "", "")).pagos;
			if (!todosPagos.length) setTodosPagos(pagosBase);
			const pagosCliente = enriquecerPagos(pagosBase, ventasCatalogo, clientesCatalogo)
				.filter((pago) => pago.IdCliente.trim() === cliente.IdCliente.trim())
				.sort((a, b) => (new Date(b.FechaPagoIso).getTime() || 0) - (new Date(a.FechaPagoIso).getTime() || 0) || Number(b.IdPago) - Number(a.IdPago));

			if (!pagosCliente.length) {
				setEstadoPago("");
				setIdVenta("");
				setFechaDesde("");
				setFechaHasta("");
				setReporte([]);
				setBuscado(true);
				setUltimoFiltro(`Cliente: ${cliente.DNI || cliente.Nombre}`);
				setMensaje("El cliente seleccionado no tiene pagos registrados.");
				return;
			}

			// Los controles describen el pago mas reciente; el listado conserva todos los pagos de la persona.
			const ultimoPago = pagosCliente[0];
			setEstadoPago(ultimoPago.EstadoPago);
			setIdVenta(ultimoPago.IdVenta);
			setFechaDesde(ultimoPago.FechaPagoIso);
			setFechaHasta(ultimoPago.FechaPagoIso);
			setReporte(pagosCliente);
			setBuscado(true);
			setUltimoFiltro(`Cliente: ${cliente.DNI || "Sin DNI"} | ${pagosCliente.length} pago${pagosCliente.length === 1 ? "" : "s"} | Ultimo: ${ultimoPago.FechaPago}`);
		} catch (error) {
			console.error("Error al consultar pagos del cliente:", error);
			setReporte([]);
			setBuscado(true);
			setMensaje("No se pudieron consultar los pagos de la persona seleccionada.");
		} finally {
			setCargando(false);
		}
	};

	const manejarCambioCliente = (texto: string) => {
		const limpio = texto.replace(/[^0-9a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").slice(0, 60);
		setBusquedaCliente(limpio);
		setMostrarClientes(true);
		setMostrarEstadosPago(false);
		setMostrarVentas(false);
		if (clienteSeleccionado && normalizarTerminoBusqueda(limpio) !== normalizarTerminoBusqueda(clienteSeleccionado.DNI) && normalizarTerminoBusqueda(limpio) !== normalizarTerminoBusqueda(clienteSeleccionado.Nombre)) {
			filtrosClienteAutomaticosRef.current = false;
			setClienteSeleccionado(null);
			setEstadoPago("");
			setIdVenta("");
			setFechaDesde("");
			setFechaHasta("");
			setReporte(todosPagos);
			setBuscado(false);
			setUltimoFiltro("");
			setMensaje("");
		}
	};

	const buscarClienteEscrito = async () => {
		const criterio = normalizarTerminoBusqueda(busquedaCliente);
		if (!criterio) {
			setMensaje("Escribe un DNI o nombre para buscar al cliente.");
			return;
		}
		const exacto = clientesCatalogo.find((cliente) => cliente.DNI === busquedaCliente.trim() || normalizarTerminoBusqueda(cliente.Nombre) === criterio);
		const parciales = clientesCatalogo.filter((cliente) => cliente.DNI.includes(criterio) || normalizarTerminoBusqueda(cliente.Nombre).includes(criterio));
		const cliente = exacto ?? (parciales.length === 1 ? parciales[0] : null);
		if (!cliente) {
			setMostrarClientes(true);
			setMensaje(parciales.length > 1 ? "Selecciona una persona de la lista de coincidencias." : "No existe un cliente con ese DNI o nombre.");
			return;
		}
		await aplicarCliente(cliente);
	};

	useEffect(() => {
		if (!busquedaCliente.trim() || clienteSeleccionado) return;
		const criterio = normalizarTerminoBusqueda(busquedaCliente);
		const coincidencias = clientesCatalogo.filter((cliente) => cliente.DNI.includes(criterio) || normalizarTerminoBusqueda(cliente.Nombre).includes(criterio));
		const exacto = clientesCatalogo.find((cliente) => cliente.DNI === busquedaCliente.trim() || normalizarTerminoBusqueda(cliente.Nombre) === criterio);
		const esDni = /^\d+$/.test(busquedaCliente.trim());
		const unico = (!esDni && criterio.length >= 3 && coincidencias.length === 1) ? coincidencias[0] : null;
		const clienteAutomatico = exacto ?? unico;
		if (!clienteAutomatico) return;
		const timer = setTimeout(() => void aplicarCliente(clienteAutomatico), 350);
		return () => clearTimeout(timer);
	}, [busquedaCliente, clientesCatalogo, clienteSeleccionado]);

	useEffect(() => {
		if (primeraCargaRef.current) {
			primeraCargaRef.current = false;
			return;
		}
		if (omitirSiguienteDebounceRef.current) {
			omitirSiguienteDebounceRef.current = false;
			return;
		}
		if (filtrosClienteAutomaticosRef.current) return;
		if ((fechaDesde && fechaDesde.length < 10) || (fechaHasta && fechaHasta.length < 10)) return;
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		debounceTimerRef.current = setTimeout(() => {
			void cargarPagos(false, undefined, true);
		}, 700);
		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		};
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
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		omitirSiguienteDebounceRef.current = true;
		filtrosClienteAutomaticosRef.current = false;
		setBusquedaCliente("");
		setClienteSeleccionado(null);
		setMostrarClientes(false);
		setEstadoPago("");
		setMostrarEstadosPago(false);
		setMostrarVentas(false);
		setIdVenta("");
		setFechaDesde("");
		setFechaHasta("");
		setBuscado(false);
		setUltimoFiltro("");
		setMensaje("");
		Keyboard.dismiss();
		await cargarPagos(false, { estadoPago: "", idVenta: "", fechaDesde: "", fechaHasta: "" });
	};

	const buscarPagosManualmente = () => {
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		filtrosClienteAutomaticosRef.current = false;
		void cargarPagos(false);
	};

	const buscarReporte = async () => {
		// Si hay un DNI/nombre pendiente o los campos siguen siendo automaticos,
		// Buscar debe recuperar primero todos los pagos de esa persona.
		if (busquedaCliente.trim() && (!clienteSeleccionado || filtrosClienteAutomaticosRef.current)) {
			if (clienteSeleccionado) await aplicarCliente(clienteSeleccionado);
			else await buscarClienteEscrito();
			return;
		}
		buscarPagosManualmente();
	};

	const construirHtmlReporte = () => {
		const numeroDocumento = `RPT-PAG-${horaActual.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
		const logoHtml = logoPdfUri
			? `<img src="${escapeHtml(logoPdfUri)}" style="width:68px;height:68px;border-radius:16px;object-fit:contain;background:white;padding:8px;" />`
			: `<div style="width:68px;height:68px;border-radius:16px;background:white;color:#0f766e;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;">${EMPRESA_SIGLAS}</div>`;
		const columnasPdf = [
			{ label: "N", width: "5%" },
			{ label: "ID", width: "7%" },
			{ label: "Comprobante", width: "10%" },
			{ label: "Venta", width: "8%" },
			{ label: "Cliente", width: "20%" },
			{ label: "Lote", width: "8%" },
			{ label: "Fecha", width: "11%" },
			{ label: "Monto", width: "11%" },
			{ label: "Cuota", width: "7%" },
			{ label: "Estado", width: "13%" },
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
				item.Comprobante,
				item.IdVenta,
				item.Cliente,
				item.Lote,
				item.FechaPago,
				item.Monto,
				item.Cuota,
					`<span style="display:inline-block;padding:6px 10px;border-radius:999px;color:${estadoColor};background:${estadoBg};border:1px solid ${esEstadoPagado(item.EstadoPago) ? "#86efac" : "#fda4af"};font-weight:700;">${escapeHtml(item.EstadoPago)}</span>`,
				]
					.map((valor, cellIndex) => `<td style="border:1px solid #dbe4ea;padding:10px;text-align:center;background:${fondoFila};font-size:12px;color:#0f172a;">${cellIndex === 8 ? valor : escapeHtml(valor)}</td>`)
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

	const esColumnaCorta = (key: keyof PagoReporteItem) => key === "Comprobante" || key === "IdVenta" || key === "Monto" || key === "Cuota";
	const totalRecaudado = listadoMostrar.reduce((total, item) => total + (Number(item.Monto.replace(/[^0-9.-]/g, "")) || 0), 0);
	const pagosAlDia = listadoMostrar.filter((item) => esEstadoPagado(item.EstadoPago)).length;
	const pagosConRetraso = listadoMostrar.filter((item) => !esEstadoPagado(item.EstadoPago)).length;

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
						<View style={styles.heroContent}><Text style={styles.title}>Gestion Integral</Text><Text style={styles.title}>de Pagos</Text><Text style={styles.subtitle}>Consulta comprobantes, cuotas y estados usando la API real de pagos.</Text></View>
						<View style={styles.peopleScene}><View style={[styles.personBubble, styles.personBubbleBlue]}><MaterialCommunityIcons name="receipt-text-check-outline" size={17} color="#ffffff" /></View><View style={[styles.personBubble, styles.personBubbleGreen]}><MaterialCommunityIcons name="cash-check" size={17} color="#ffffff" /></View><View style={[styles.personBubble, styles.personBubblePurple]}><MaterialCommunityIcons name="credit-card-clock-outline" size={17} color="#ffffff" /></View><View style={styles.peopleBase} /></View>
					</View>

					<View style={styles.statsGrid}>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#dbeafe" }]}><MaterialCommunityIcons name="receipt-text-outline" size={13} color="#2563eb" /></View><Text style={styles.statLabel}>Pagos</Text>{cargando ? <ActivityIndicator size="small" color="#2563eb" style={styles.statLoader} /> : <Text selectable style={styles.statValue}>{listadoMostrar.length}</Text>}<Text style={styles.statCaption}>Resultados</Text><View style={[styles.statAccentLine, { backgroundColor: "#2563eb" }]} /></View>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#d1fae5" }]}><MaterialCommunityIcons name="check-decagram-outline" size={13} color="#059669" /></View><Text style={styles.statLabel}>Al dia</Text><Text selectable style={styles.statValue}>{pagosAlDia}</Text><Text style={styles.statCaption}>Sin retraso</Text><View style={[styles.statAccentLine, { backgroundColor: "#10b981" }]} /></View>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#ffe4e6" }]}><MaterialCommunityIcons name="clock-alert-outline" size={13} color="#e11d48" /></View><Text style={styles.statLabel}>Retrasados</Text><Text selectable style={styles.statValue}>{pagosConRetraso}</Text><Text style={styles.statCaption}>Con incidencia</Text><View style={[styles.statAccentLine, { backgroundColor: "#f43f5e" }]} /></View>
						<TouchableOpacity style={styles.statCard} activeOpacity={0.82} onPress={() => clienteSeleccionado ? void aplicarCliente(clienteSeleccionado) : void cargarPagos(false)}><View style={[styles.statIconWrap, { backgroundColor: "#fef3c7" }]}><MaterialCommunityIcons name="cash-multiple" size={13} color="#d97706" /></View><Text style={styles.statLabel}>Recaudado</Text><Text selectable style={[styles.statValue, styles.statValueText]} numberOfLines={2}>{formatoMoneda(totalRecaudado)}</Text><Text style={styles.statCaption}>Toca para actualizar</Text><View style={[styles.statAccentLine, { backgroundColor: "#f59e0b" }]} /></TouchableOpacity>
					</View>
				</LinearGradient>

				<View style={styles.searchCard}>
					<Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
					<SelectorCliente value={busquedaCliente} clientes={clientesCatalogo} visible={mostrarClientes} seleccionado={clienteSeleccionado} onChange={manejarCambioCliente} onFocus={() => { setMostrarClientes(true); setMostrarEstadosPago(false); setMostrarVentas(false); }} onToggle={() => { setMostrarClientes(!mostrarClientes); setMostrarEstadosPago(false); setMostrarVentas(false); }} onSelect={(cliente) => void aplicarCliente(cliente)} onSubmit={() => void buscarClienteEscrito()} />
					{clienteSeleccionado ? <View style={styles.clienteSelectedCard}><View style={styles.clienteSelectedIcon}><MaterialCommunityIcons name="account-check-outline" size={18} color="#ffffff" /></View><View style={styles.clienteSelectedCopy}><Text style={styles.clienteSelectedLabel}>CLIENTE SELECCIONADO</Text><Text selectable style={styles.clienteSelectedName}>{clienteSeleccionado.Nombre}</Text><Text selectable style={styles.clienteSelectedMeta}>DNI {clienteSeleccionado.DNI || "No registrado"} · Campos: ultimo pago · Listado: todos sus pagos</Text></View><MaterialCommunityIcons name="check-decagram" size={20} color="#10b981" /></View> : null}
					<SelectorBuscable label="Estado del pago" value={estadoPago} placeholder="Escribe o selecciona el estado" opciones={estadosPago} visible={mostrarEstadosPago} cargando={cargandoEstadosPago} icono="check-circle-outline" onChange={(texto) => { filtrosClienteAutomaticosRef.current = false; setEstadoPago(texto); setMostrarEstadosPago(true); setMostrarVentas(false); setMostrarClientes(false); }} onFocus={() => { setMostrarEstadosPago(true); setMostrarVentas(false); setMostrarClientes(false); }} onToggle={() => { if (mostrarEstadosPago) setMostrarEstadosPago(false); else { setMostrarEstadosPago(true); setMostrarVentas(false); setMostrarClientes(false); void refrescarEstadosPago(); } }} onSelect={(valor) => { filtrosClienteAutomaticosRef.current = false; setEstadoPago(valor); setMostrarEstadosPago(false); Keyboard.dismiss(); }} onSubmit={buscarPagosManualmente} />
					<SelectorVenta value={idVenta} ventas={clienteSeleccionado ? ventasCatalogo.filter((venta) => venta.IdCliente === clienteSeleccionado.IdCliente) : ventasCatalogo} visible={mostrarVentas} onChange={(texto) => { filtrosClienteAutomaticosRef.current = false; setIdVenta(texto); setMostrarVentas(true); setMostrarEstadosPago(false); setMostrarClientes(false); }} onFocus={() => { setMostrarVentas(true); setMostrarEstadosPago(false); setMostrarClientes(false); }} onToggle={() => { setMostrarVentas(!mostrarVentas); setMostrarEstadosPago(false); setMostrarClientes(false); }} onSelect={(venta) => { filtrosClienteAutomaticosRef.current = false; setIdVenta(venta.IdVenta); setMostrarVentas(false); Keyboard.dismiss(); }} onSubmit={buscarPagosManualmente} />
					{ventaSeleccionada ? <View style={styles.ventaSelectedCard}><View style={styles.ventaSelectedIcon}><MaterialCommunityIcons name="file-check-outline" size={18} color="#ffffff" /></View><View style={styles.ventaSelectedCopy}><Text style={styles.ventaSelectedLabel}>VENTA SELECCIONADA</Text><Text selectable style={styles.ventaSelectedName}>Venta #{ventaSeleccionada.IdVenta} · Lote {ventaSeleccionada.Lote}</Text><Text selectable style={styles.ventaSelectedMeta}>{ventaSeleccionada.Cliente} · {ventaSeleccionada.Proyecto}</Text></View><MaterialCommunityIcons name="check-decagram" size={20} color="#10b981" /></View> : null}

					<View style={styles.dateRow}>
						<View style={styles.dateColumn}><Text style={styles.fieldLabel}>Fecha desde</Text><View style={[styles.inputShell, styles.filterInputShell]}><MaterialCommunityIcons name="calendar-start" size={16} color="#8aa0b5" /><TextInput value={fechaDesde} onChangeText={(texto) => { filtrosClienteAutomaticosRef.current = false; setFechaDesde(limpiarFecha(texto)); }} onFocus={() => { setMostrarEstadosPago(false); setMostrarVentas(false); setMostrarClientes(false); }} placeholder="AAAA-MM-DD" placeholderTextColor="#9aa9ba" style={styles.input} keyboardType="number-pad" returnKeyType="next" /></View></View>
						<View style={styles.dateColumn}><Text style={styles.fieldLabel}>Fecha hasta</Text><View style={[styles.inputShell, styles.filterInputShell]}><MaterialCommunityIcons name="calendar-end" size={16} color="#8aa0b5" /><TextInput value={fechaHasta} onChangeText={(texto) => { filtrosClienteAutomaticosRef.current = false; setFechaHasta(limpiarFecha(texto)); }} onFocus={() => { setMostrarEstadosPago(false); setMostrarVentas(false); setMostrarClientes(false); }} placeholder="AAAA-MM-DD" placeholderTextColor="#9aa9ba" style={styles.input} keyboardType="number-pad" returnKeyType="search" onSubmitEditing={buscarPagosManualmente} /></View></View>
					</View>

					<View style={styles.actionRow}>
						<TouchableOpacity style={styles.actionButton} onPress={() => void buscarReporte()}><LinearGradient colors={["#1f75ff", "#0657d9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="magnify" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Buscar</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={abrirNuevoPago}><LinearGradient colors={["#0f9f73", "#047857"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="cash-plus" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Nuevo</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={limpiarFiltro}><LinearGradient colors={["#6b7280", "#475569"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="trash-can-outline" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Limpiar</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={[styles.actionButton, (!pagosParaPdf.length || cargando) && styles.buttonDisabled]} onPress={generarPDF} disabled={!pagosParaPdf.length || cargando}><LinearGradient colors={["#f59e0b", "#f97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="file-pdf-box" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>PDF</Text></LinearGradient></TouchableOpacity>
					</View>
				</View>

				<View style={styles.contentCard}>
					<View style={styles.contentTitleRow}><MaterialCommunityIcons name="view-list-outline" size={18} color="#2563eb" /><Text style={styles.contentTitle}>Listado del Reporte</Text></View>
					{cargando ? <ActivityIndicator size="large" color="#2563eb" style={styles.loader} /> : null}
					{!cargando && mensaje ? <View style={styles.messageBox}><Text selectable style={styles.messageText}>{mensaje}</Text></View> : null}
					{!cargando && buscado && listadoMostrar.length > 0 ? <Text selectable style={styles.resultCounter}>Mostrando {listadoMostrar.length} resultado{listadoMostrar.length === 1 ? "" : "s"} para: {ultimoFiltro}</Text> : null}
					{!cargando && listadoMostrar.length === 0 && !mensaje ? <View style={styles.emptyState}><View style={styles.emptyIconWrap}><MaterialCommunityIcons name="receipt-text-remove-outline" size={28} color="#0f766e" /></View><Text style={styles.emptyTitle}>Sin pagos</Text><Text selectable style={styles.emptyText}>No se encontraron pagos para los filtros ingresados.</Text></View> : null}
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
								<View key={`${item.IdPago}-${index}`} style={[styles.tableDataRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
									{COLUMNAS_REPORTE.map((columna) => (
										<View key={`${index}-${columna.key}`} style={[styles.tableDataCell, { flex: columna.flex }]}>
											{columna.key === "EstadoPago" ? (
												<View style={[styles.estadoBadge, esEstadoPagado(item.EstadoPago) ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo]}>
											<Text selectable style={[styles.estadoBadgeText, esEstadoPagado(item.EstadoPago) ? styles.estadoBadgeTextActivo : styles.estadoBadgeTextInactivo]}>{item.EstadoPago}</Text>
												</View>
											) : (
										<Text selectable style={[styles.tableDataText, esColumnaCorta(columna.key) ? styles.tableDataTextTight : null]} numberOfLines={2} adjustsFontSizeToFit={esColumnaCorta(columna.key)} minimumFontScale={0.78}>
													{String(item[columna.key] ?? "-")}
												</Text>
											)}
										</View>
									))}
									<View style={styles.tableActionCell}>
									<TouchableOpacity style={styles.verButton} onPress={() => abrirVentaDelPago(navigation, item)} accessibilityLabel={`Ver venta ${item.IdVenta}`}>
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

export default ReportePagos;

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
import styles from "./ReporteCobranzasStyles";
import i18n from "../../i18n";

type ReporteItem = Record<string, unknown>;

type CobranzaReporteItem = {
	IdVenta: string;
	IdCliente: string;
	Cliente: string;
	Lote: string;
	FechaVenta: string;
	FechaVentaIso: string;
	TipoVenta: string;
	TipoPago: string;
	PrecioVenta: string;
	MontoInicial: string;
	SaldoPendiente: string;
	EstadoVenta: string;
};

type ClienteDniItem = {
	IdCliente: string;
	DNI: string;
	Nombre: string;
	Estado: string;
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

// ATAMAINE: Los autocompletados ignoran tildes y mayusculas al comparar opciones.
const normalizarTerminoBusqueda = (value: unknown) =>
	textoLimpio(value, "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();

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
	if (digitos.length <= 2) return digitos;
	if (digitos.length <= 4) return `${digitos.slice(0, 2)}-${digitos.slice(2)}`;
	return `${digitos.slice(0, 2)}-${digitos.slice(2, 4)}-${digitos.slice(4)}`;
};

const convertirFechaFiltroAIso = (value: string) => {
	const texto = value.trim();
	if (!texto) return "";
	const fechaLatina = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
	if (fechaLatina) {
		const [, dia, mes, anio] = fechaLatina;
		return `${anio}-${mes}-${dia}`;
	}
	const isoDirecto = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	return isoDirecto ? isoDirecto[0] : texto;
};

const convertirFechaIsoAInput = (value: string) => {
	const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!iso) return limpiarFecha(value);
	const [, anio, mes, dia] = iso;
	return `${dia}-${mes}-${anio}`;
};

const esFechaFiltroValida = (value: string) => {
	if (!value.trim()) return true;
	const partes = convertirFechaFiltroAIso(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!partes) return false;
	const [, anio, mes, dia] = partes;
	const fecha = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
	return fecha.getUTCFullYear() === Number(anio) && fecha.getUTCMonth() === Number(mes) - 1 && fecha.getUTCDate() === Number(dia);
};

type SelectorBuscableProps = {
	label: string;
	value: string;
	placeholder: string;
	opciones: string[];
	visible: boolean;
	cargando: boolean;
	enFoco: boolean;
	icono: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
	onChange: (value: string) => void;
	onFocus: () => void;
	onToggle: () => void;
	onSelect: (value: string) => void;
	onSubmit: () => void;
};

// ATAMAINE: Un mismo control garantiza escritura, seleccion y estados vacios coherentes.
const SelectorBuscable = ({
	label,
	value,
	placeholder,
	opciones,
	visible,
	cargando,
	enFoco,
	icono,
	onChange,
	onFocus,
	onToggle,
	onSelect,
	onSubmit,
}: SelectorBuscableProps) => {
	const opcionesFiltradas = useMemo(
		() => opciones.filter((opcion) => coincideOpcion(opcion, value)).slice(0, 20),
		[opciones, value],
	);

	return (
		<>
			<Text style={styles.fieldLabel}>{label}</Text>
			<View style={styles.selectorWrap}>
				<View style={[styles.selectorShell, enFoco ? styles.selectorShellFocused : null]}>
					<MaterialCommunityIcons name={icono} size={17} color={enFoco ? "#0f766e" : "#8aa0b5"} />
					<TextInput
						value={value}
						onChangeText={onChange}
						onFocus={onFocus}
						placeholder={cargando ? "Cargando opciones..." : placeholder}
						placeholderTextColor="#91a3b6"
						style={styles.selectorInput}
						returnKeyType="search"
						autoCorrect={false}
						autoCapitalize="words"
						onSubmitEditing={onSubmit}
						accessibilityLabel={label}
					/>
					{value ? (
						<TouchableOpacity style={styles.selectorClearButton} onPress={() => onChange("")} accessibilityLabel={`Borrar ${label}`}>
							<MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" />
						</TouchableOpacity>
					) : null}
					<TouchableOpacity style={styles.selectorIconButton} onPress={onToggle} accessibilityLabel={`Mostrar ${label}`}>
						{cargando ? <ActivityIndicator size="small" color="#0f766e" /> : <MaterialCommunityIcons name={visible ? "chevron-up" : "chevron-down"} size={19} color="#0f766e" />}
					</TouchableOpacity>
				</View>

				{visible ? (
					<View style={styles.optionsBox}>
						<View style={styles.optionsHeader}>
							<Text style={styles.optionsHeaderText}>Opciones disponibles</Text>
							<Text style={styles.optionsHeaderText}>{opcionesFiltradas.length}</Text>
						</View>
						{opcionesFiltradas.length ? (
							<ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
								{opcionesFiltradas.map((opcion) => {
									const seleccionada = normalizarTerminoBusqueda(value) === normalizarTerminoBusqueda(opcion);
									return (
										<TouchableOpacity key={opcion} style={[styles.optionItem, seleccionada ? styles.optionItemActive : null]} activeOpacity={0.82} onPress={() => onSelect(opcion)}>
											<View style={styles.optionIcon}><MaterialCommunityIcons name={icono} size={16} color="#0f766e" /></View>
											<View style={styles.optionContent}><Text style={styles.optionTitle}>{opcion}</Text><Text style={styles.optionMeta}>Seleccionar filtro</Text></View>
											{seleccionada ? <MaterialCommunityIcons name="check-circle" size={17} color="#10b981" /> : <MaterialCommunityIcons name="chevron-right" size={16} color="#94a3b8" />}
										</TouchableOpacity>
									);
								})}
							</ScrollView>
						) : (
							<View style={styles.optionEmpty}><MaterialCommunityIcons name="text-search" size={22} color="#94a3b8" /><Text style={styles.optionEmptyText}>No hay coincidencias para "{value}".</Text></View>
						)}
					</View>
				) : null}
			</View>
		</>
	);
};

type SelectorDniClienteProps = {
	value: string;
	clientes: ClienteDniItem[];
	visible: boolean;
	cargando: boolean;
	seleccionado: ClienteDniItem | null;
	onChange: (value: string) => void;
	onFocus: () => void;
	onToggle: () => void;
	onSelect: (cliente: ClienteDniItem) => void;
	onSubmit: () => void;
};

// ATAMAINE: El usuario trabaja con DNI; el IdCliente queda resuelto internamente para la API.
const SelectorDniCliente = ({ value, clientes, visible, cargando, seleccionado, onChange, onFocus, onToggle, onSelect, onSubmit }: SelectorDniClienteProps) => {
	const clientesFiltrados = useMemo(() => {
		const criterio = normalizarTerminoBusqueda(value);
		return clientes
			.filter((cliente) => !criterio || cliente.DNI.includes(criterio) || normalizarTerminoBusqueda(cliente.Nombre).includes(criterio))
			.slice(0, 20);
	}, [clientes, value]);

	return (
		<>
			<Text style={styles.fieldLabel}>Buscar cliente por DNI</Text>
			<View style={[styles.selectorWrap, styles.dniSelectorWrap]}>
				<View style={[styles.selectorShell, visible ? styles.selectorShellFocused : null]}>
					<MaterialCommunityIcons name="card-account-details-outline" size={17} color={visible ? "#0f766e" : "#8aa0b5"} />
					<TextInput value={value} onChangeText={(texto) => onChange(texto.replace(/[^0-9]/g, "").slice(0, 8))} onFocus={onFocus} placeholder={cargando ? "Cargando clientes..." : "Escribe o selecciona el DNI"} placeholderTextColor="#91a3b6" style={styles.selectorInput} keyboardType="number-pad" returnKeyType="search" maxLength={8} autoCorrect={false} onSubmitEditing={onSubmit} accessibilityLabel="Buscar cliente por DNI" />
					{value ? <TouchableOpacity style={styles.selectorClearButton} onPress={() => onChange("")} accessibilityLabel="Borrar DNI"><MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" /></TouchableOpacity> : null}
					<TouchableOpacity style={styles.selectorIconButton} onPress={onToggle} accessibilityLabel="Mostrar clientes">
						{cargando ? <ActivityIndicator size="small" color="#0f766e" /> : <MaterialCommunityIcons name={visible ? "chevron-up" : "chevron-down"} size={19} color="#0f766e" />}
					</TouchableOpacity>
				</View>

				{visible ? (
					<View style={styles.optionsBox}>
						<View style={styles.optionsHeader}><Text style={styles.optionsHeaderText}>Clientes por DNI</Text><Text style={styles.optionsHeaderText}>{clientesFiltrados.length}</Text></View>
						{clientesFiltrados.length ? (
							<ScrollView style={styles.optionsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
								{clientesFiltrados.map((cliente) => {
									const activo = seleccionado?.IdCliente === cliente.IdCliente;
									return <TouchableOpacity key={`${cliente.IdCliente}-${cliente.DNI}`} style={[styles.optionItem, activo ? styles.optionItemActive : null]} activeOpacity={0.82} onPress={() => onSelect(cliente)}><View style={styles.optionIcon}><MaterialCommunityIcons name="account-outline" size={16} color="#0f766e" /></View><View style={styles.optionContent}><Text style={styles.optionTitle}>{cliente.DNI}</Text><Text style={styles.optionMeta}>{cliente.Nombre}</Text></View>{activo ? <MaterialCommunityIcons name="check-circle" size={17} color="#10b981" /> : <MaterialCommunityIcons name="chevron-right" size={16} color="#94a3b8" />}</TouchableOpacity>;
								})}
							</ScrollView>
						) : <View style={styles.optionEmpty}><MaterialCommunityIcons name="account-search-outline" size={22} color="#94a3b8" /><Text style={styles.optionEmptyText}>No existe un cliente con el DNI ingresado.</Text></View>}
					</View>
				) : null}
			</View>
		</>
	);
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

const formatoFechaIso = (value: unknown) => {
	const texto = textoLimpio(value, "");
	const isoDirecto = texto.match(/^(\d{4}-\d{2}-\d{2})/);
	if (isoDirecto) return isoDirecto[1];

	const fechaLatina = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
	if (fechaLatina) return `${fechaLatina[3]}-${fechaLatina[2]}-${fechaLatina[1]}`;

	const fecha = new Date(texto);
	return Number.isNaN(fecha.getTime()) ? "" : fecha.toISOString().slice(0, 10);
};

const normalizarEstadoVenta = (estado: unknown) => {
	const estadoTexto = textoLimpio(estado, "").toLowerCase();
	const estadosActivos = ["a", "activo", "activa", "1", "true"];
	const estadosAlDia = ["al dia", "aldia", "pagado"];
	const estadosFinalizados = ["finalizado", "finalizada", "completado", "completada"];
	const estadosCancelados = ["cancelado", "cancelada", "anulado", "anulada"];
	const estadosPendientes = [
		"i",
		"x",
		"0",
		"false",
		"inactivo",
		"pendiente",
		"vencido",
		"mora",
		"moroso",
		"en deuda",
	];

	if (estadosActivos.includes(estadoTexto)) return "Activa";
	if (estadosAlDia.includes(estadoTexto)) return "Al dia";
	if (estadosFinalizados.includes(estadoTexto)) return "Finalizada";
	if (estadosCancelados.includes(estadoTexto)) return "Cancelada";
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
		FechaVentaIso: formatoFechaIso(obtenerValor(item, ["FechaVenta", "fechaVenta", "Fecha", "FechaRegistro"])),
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

const esCobranzaAlDia = (estado: string) => ["activa", "al dia", "finalizada"].includes(normalizarTerminoBusqueda(estado));

const obtenerLogoPdfUri = () => {
        const resolver = (Image as any).resolveAssetSource;
        if (typeof resolver !== "function") return "";
        return resolver(require("../../assets/splash-icon.png"))?.uri || "";
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
	const fechaDesdeIso = convertirFechaFiltroAIso(fechaDesde);
	const fechaHastaIso = convertirFechaFiltroAIso(fechaHasta);
	if (estadoVenta.trim()) params.append("estadoVenta", estadoVenta.trim());
	if (tipoVenta.trim()) params.append("tipoVenta", tipoVenta.trim());
	if (tipoPago.trim()) params.append("tipoPago", tipoPago.trim());
	if (fechaDesdeIso) params.append("fechaDesde", fechaDesdeIso);
        if (fechaHastaIso) params.append("fechaHasta", fechaHastaIso);
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

const construirUrlsClientesDni = () => [
	`${API_BASE_URL}/api/Cliente/cliente_Listar`,
	`${API_BASE_URL}/Cliente/cliente_Listar`,
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

const normalizarClientesDni = (items: ReporteItem[]): ClienteDniItem[] => {
	const clientes = items
		.map((item) => ({
			IdCliente: textoLimpio(obtenerValor(item, ["IdCliente", "idCliente", "IDCliente"]), ""),
			DNI: textoLimpio(obtenerValor(item, ["DNI", "Dni", "dni", "Documento"]), ""),
			Nombre: obtenerCliente(item),
			Estado: textoLimpio(obtenerValor(item, ["Estado", "estado"]), ""),
		}))
		.filter((cliente) => Boolean(cliente.IdCliente && cliente.DNI))
		.sort((a, b) => {
			const aActivo = ["a", "activo", "activa"].includes(normalizarTerminoBusqueda(a.Estado)) ? 0 : 1;
			const bActivo = ["a", "activo", "activa"].includes(normalizarTerminoBusqueda(b.Estado)) ? 0 : 1;
			return a.DNI.localeCompare(b.DNI) || aActivo - bActivo || Number(a.IdCliente) - Number(b.IdCliente);
		});

	// Si la base contiene DNI duplicados, priorizamos el registro activo sin ocultar DNI unicos inactivos.
	return clientes.filter((cliente, index) => clientes.findIndex((item) => item.DNI === cliente.DNI) === index);
};

const consultarClientesDni = async (signal?: AbortSignal) => {
	const rawData = await consultarPrimerEndpointDisponible(construirUrlsClientesDni(), signal);
	return normalizarClientesDni(parseReporteResponse(rawData));
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

        const fechaLatina = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
        if (fechaLatina) {
                const [, dia, mes, anio] = fechaLatina;
                const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
                return Number.isNaN(fecha.getTime()) ? null : fecha.getTime();
        }

        const fecha = new Date(texto);
        return Number.isNaN(fecha.getTime()) ? null : fecha.getTime();
};

const contieneTexto = (origen: string, filtro: string) =>
	!filtro.trim() || normalizarTerminoBusqueda(origen).includes(normalizarTerminoBusqueda(filtro));

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
		const cobranzasApi = normalizarCobranzas(parseReporteResponse(rawData));
		const estadoLocal = estadoVenta.trim() ? normalizarEstadoVenta(estadoVenta) : "";
		// ATAMAINE: Revalidamos la respuesta porque algunos despliegues devuelven toda la tabla aunque reciban filtros.
		return filtrarCobranzasLocal(cobranzasApi, estadoLocal, tipoVenta, tipoPago, fechaDesde, fechaHasta, idCliente);
	} catch (error) {
                if ((error as Error).name === "AbortError") throw error;

                const rawVentas = await consultarPrimerEndpointDisponible(construirUrlsVentasBase(), signal);
                const cobranzasBase = normalizarCobranzas(parseReporteResponse(rawVentas));
		const estadoLocal = estadoVenta.trim() ? normalizarEstadoVenta(estadoVenta) : "";
		return filtrarCobranzasLocal(cobranzasBase, estadoLocal, tipoVenta, tipoPago, fechaDesde, fechaHasta, idCliente);
	}
};

const abrirVentaRegistrada = (navigation: any, item: CobranzaReporteItem) => {
	const rutasStack = navigation.getState?.().routes ?? [];
	const rutaMainTabs = [...rutasStack].reverse().find((ruta: any) => ruta.name === "MainTabs");
	const parametrosSesion = rutaMainTabs?.params ?? {};

	// Conservamos la sesión del navegador principal y añadimos el filtro exclusivo del cliente.
	navigation.navigate("MainTabs", {
		...parametrosSesion,
		screen: i18n.t("btVentas"),
		params: {
			idUsuario: parametrosSesion.idUsuario,
			nombre: parametrosSesion.nombre,
			rol: parametrosSesion.rol,
			ventaSeleccionadaId: item.IdVenta,
			clienteSeleccionadoId: item.IdCliente,
			clienteSeleccionadoNombre: item.Cliente,
			origenReporteCobranzas: true,
			origenReportePagos: false,
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
	const [campoActivo, setCampoActivo] = useState<"estado" | "venta" | "pago" | null>(null);
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");
	const [idCliente, setIdCliente] = useState("");
	const [dniCliente, setDniCliente] = useState("");
	const [clientesDni, setClientesDni] = useState<ClienteDniItem[]>([]);
	const [clienteDniSeleccionado, setClienteDniSeleccionado] = useState<ClienteDniItem | null>(null);
	const [mostrarClientesDni, setMostrarClientesDni] = useState(false);
	const [cargandoClientesDni, setCargandoClientesDni] = useState(false);
	const [todasCobranzas, setTodasCobranzas] = useState<CobranzaReporteItem[]>([]);
	const [reporte, setReporte] = useState<CobranzaReporteItem[]>([]);
	const [cargando, setCargando] = useState(false);
	const [buscado, setBuscado] = useState(false);
	const [mensaje, setMensaje] = useState("");
	const [ultimoFiltro, setUltimoFiltro] = useState("");
	const [horaActual, setHoraActual] = useState(new Date());
	const fetchControllerRef = useRef<AbortController | null>(null);
	const clienteFiltradoRef = useRef("");
	const filtrosDniAutomaticosRef = useRef(false);

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

	useEffect(() => {
		const controller = new AbortController();
		const cargarClientes = async () => {
			try {
				setCargandoClientesDni(true);
				setClientesDni(await consultarClientesDni(controller.signal));
			} catch (error) {
				if ((error as Error).name !== "AbortError") setClientesDni([]);
			} finally {
				setCargandoClientesDni(false);
			}
		};

		void cargarClientes();
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

	const refrescarEstadosVenta = async () => {
		try {
			setCargandoEstadosVenta(true);
			setEstadosVenta(await consultarEstadosVenta());
		} catch (error) {
			if ((error as Error).name !== "AbortError") setEstadosVenta(ESTADOS_VENTA_RESPALDO);
		} finally {
			setCargandoEstadosVenta(false);
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

	const cerrarSelectores = () => {
		setMostrarEstadosVenta(false);
		setMostrarTiposVenta(false);
		setMostrarTiposPago(false);
		setMostrarClientesDni(false);
		setCampoActivo(null);
	};

	const abrirSelector = (campo: "estado" | "venta" | "pago") => {
		setMostrarClientesDni(false);
		setCampoActivo(campo);
		setMostrarEstadosVenta(campo === "estado");
		setMostrarTiposVenta(campo === "venta");
		setMostrarTiposPago(campo === "pago");
	};

	const cargarCobranzasIniciales = async () => {
		try {
			setCargando(true);
			setMensaje("");
			const cobranzasBase = await consultarCobranzasReporte("", "", "", "", "", "");
			setTodasCobranzas(cobranzasBase);
			if (!clienteFiltradoRef.current) {
				setReporte(cobranzasBase);
				setBuscado(false);
				setUltimoFiltro("");
				if (!cobranzasBase.length) setMensaje("No existen cobranzas registradas.");
			}
		} catch (error) {
			console.error("Error al cargar cobranzas registradas:", error);
			if (!clienteFiltradoRef.current) {
				setTodasCobranzas([]);
				setReporte([]);
				setMensaje("No se pudo cargar el reporte de cobranzas.");
			}
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargarCobranzasIniciales();
	}, []);

	const aplicarClientePorDni = async (cliente: ClienteDniItem) => {
		clienteFiltradoRef.current = cliente.IdCliente;
		filtrosDniAutomaticosRef.current = true;
		setClienteDniSeleccionado(cliente);
		setDniCliente(cliente.DNI);
		setIdCliente(cliente.IdCliente);
		setMostrarClientesDni(false);
		setCampoActivo(null);
		Keyboard.dismiss();

		try {
			setCargando(true);
			setMensaje("");
			if (fetchControllerRef.current) fetchControllerRef.current.abort();
			fetchControllerRef.current = new AbortController();

			const base = todasCobranzas.length
				? todasCobranzas
				: await consultarCobranzasReporte("", "", "", "", "", "", fetchControllerRef.current.signal);
			if (!todasCobranzas.length) setTodasCobranzas(base);

			const cobranzasCliente = base
				.filter((item) => item.IdCliente === cliente.IdCliente)
				.sort((a, b) => (fechaATiempo(b.FechaVenta) ?? 0) - (fechaATiempo(a.FechaVenta) ?? 0) || Number(b.IdVenta) - Number(a.IdVenta));

			if (!cobranzasCliente.length) {
				setEstadoVenta("");
				setTipoVenta("");
				setTipoPago("");
				setFechaDesde("");
				setFechaHasta("");
				setReporte([]);
				setBuscado(true);
				setUltimoFiltro(`DNI: ${cliente.DNI} | ${cliente.Nombre}`);
				setMensaje("El cliente seleccionado no tiene cobranzas registradas.");
				return;
			}

			// Si existen varias compras, los controles reflejan la venta mas reciente.
			const ultimaVenta = cobranzasCliente[0];
			const fechaVenta = ultimaVenta.FechaVentaIso || formatoFechaIso(ultimaVenta.FechaVenta);
			setEstadoVenta(ultimaVenta.EstadoVenta);
			setTipoVenta(ultimaVenta.TipoVenta);
			setTipoPago(ultimaVenta.TipoPago);
			setFechaDesde(convertirFechaIsoAInput(fechaVenta));
			setFechaHasta(convertirFechaIsoAInput(fechaVenta));

			// El listado conserva todas las compras del cliente; los campos describen la ultima venta.
			setReporte(cobranzasCliente);
			setBuscado(true);
			setUltimoFiltro(`DNI: ${cliente.DNI} | ${cobranzasCliente.length} compra${cobranzasCliente.length === 1 ? "" : "s"} | Datos de ultima venta: ${ultimaVenta.FechaVenta}`);
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			console.error("Error al filtrar cobranzas por DNI:", error);
			setReporte([]);
			setBuscado(true);
			setMensaje("No se pudo consultar las cobranzas del DNI seleccionado.");
		} finally {
			setCargando(false);
		}
	};

	const manejarCambioDni = (texto: string) => {
		setDniCliente(texto);
		setMostrarClientesDni(true);
		setCampoActivo(null);

		if (clienteDniSeleccionado && texto !== clienteDniSeleccionado.DNI) {
			clienteFiltradoRef.current = "";
			filtrosDniAutomaticosRef.current = false;
			setClienteDniSeleccionado(null);
			setIdCliente("");
			setEstadoVenta("");
			setTipoVenta("");
			setTipoPago("");
			setFechaDesde("");
			setFechaHasta("");
			setReporte(todasCobranzas);
			setBuscado(false);
			setUltimoFiltro("");
			setMensaje("");
		}
	};

	const buscarClientePorDni = async () => {
		const dniExacto = dniCliente.trim();
		if (!/^\d{8}$/.test(dniExacto)) {
			setMensaje("Ingresa un DNI valido de 8 digitos.");
			setMostrarClientesDni(true);
			return;
		}

		const cliente = clientesDni.find((item) => item.DNI === dniExacto);
		if (!cliente) {
			setMensaje("No existe un cliente registrado con ese DNI.");
			setMostrarClientesDni(true);
			return;
		}

		await aplicarClientePorDni(cliente);
	};

	useEffect(() => {
		if (dniCliente.length !== 8 || clienteDniSeleccionado?.DNI === dniCliente) return;
		const clienteExacto = clientesDni.find((cliente) => cliente.DNI === dniCliente);
		if (!clienteExacto) return;
		const timer = setTimeout(() => void aplicarClientePorDni(clienteExacto), 250);
		return () => clearTimeout(timer);
	}, [dniCliente, clientesDni, clienteDniSeleccionado?.DNI]);

	const filtrosTexto = [
		estadoVenta.trim() ? `Estado: ${estadoVenta.trim()}` : "",
		tipoVenta.trim() ? `Venta: ${tipoVenta.trim()}` : "",
		tipoPago.trim() ? `Pago: ${tipoPago.trim()}` : "",
		fechaDesde.trim() ? `Desde: ${fechaDesde.trim()}` : "",
		fechaHasta.trim() ? `Hasta: ${fechaHasta.trim()}` : "",
		dniCliente.trim() ? `DNI: ${dniCliente.trim()}` : "",
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
				const soloClienteDni = filtrosDniAutomaticosRef.current;
				const datos = await consultarCobranzasReporte(
					soloClienteDni ? "" : estadoVenta,
					soloClienteDni ? "" : tipoVenta,
					soloClienteDni ? "" : tipoPago,
					soloClienteDni ? "" : fechaDesde,
					soloClienteDni ? "" : fechaHasta,
					idCliente,
					controller.signal,
				);

				if (!mounted) return;

				if (hayFiltro) {
					setReporte(datos);
					setBuscado(true);
					setUltimoFiltro(soloClienteDni ? `DNI: ${dniCliente} | Todas las compras del cliente` : filtrosTexto);
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
	}, [estadoVenta, tipoVenta, tipoPago, fechaDesde, fechaHasta, idCliente, dniCliente, hayFiltro, filtrosTexto]);

	const limpiarFiltro = async () => {
		clienteFiltradoRef.current = "";
		filtrosDniAutomaticosRef.current = false;
		setEstadoVenta("");
		setTipoVenta("");
		setTipoPago("");
		cerrarSelectores();
		Keyboard.dismiss();
		setFechaDesde("");
		setFechaHasta("");
		setIdCliente("");
		setDniCliente("");
		setClienteDniSeleccionado(null);
		setMostrarClientesDni(false);
		setBuscado(false);
		setMensaje("");
		await cargarCobranzasIniciales();
	};

	const consultarReporte = async () => {
		cerrarSelectores();
		Keyboard.dismiss();

		if (dniCliente.trim() && !idCliente.trim()) {
			await buscarClientePorDni();
			return;
		}
		filtrosDniAutomaticosRef.current = false;

		if (!esFechaFiltroValida(fechaDesde)) {
			setMensaje("La fecha inicial debe tener el formato DD-MM-AAAA y ser valida.");
			return;
		}
		if (!esFechaFiltroValida(fechaHasta)) {
			setMensaje("La fecha final debe tener el formato DD-MM-AAAA y ser valida.");
			return;
		}
		if (fechaDesde && fechaHasta && (fechaATiempo(fechaDesde) ?? 0) > (fechaATiempo(fechaHasta) ?? 0)) {
			setMensaje("La fecha inicial no puede ser posterior a la fecha final.");
			return;
		}

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
			const estadoConsulta = resolverOpcionFiltro(estadoVenta, estadosVenta);
			const tipoVentaConsulta = resolverOpcionFiltro(tipoVenta, tiposVenta);
			const tipoPagoConsulta = resolverOpcionFiltro(tipoPago, tiposPago);

			const filtrados = await consultarCobranzasReporte(
				estadoConsulta,
				tipoVentaConsulta,
				tipoPagoConsulta,
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
	const listadoMostrar = useMemo(() => {
		const origen = buscado ? reporte : todasCobranzas;
		const nombresPorCliente = new Map(clientesDni.map((cliente) => [cliente.IdCliente, cliente.Nombre]));
		const filasDelCliente = clienteDniSeleccionado
			? origen.filter((item) => item.IdCliente === clienteDniSeleccionado.IdCliente)
			: origen;

		// ATAMAINE: El reporte puede devolver "Cliente 1"; mostramos el nombre real del catalogo por IdCliente.
		return filasDelCliente.map((item) => ({
			...item,
			Cliente: nombresPorCliente.get(item.IdCliente) || item.Cliente,
		}));
	}, [buscado, reporte, todasCobranzas, clientesDni, clienteDniSeleccionado]);
	const cobranzasParaPdf = listadoMostrar;
	const logoPdfUri = obtenerLogoPdfUri();
	const saldoTotalPendiente = listadoMostrar.reduce((total, item) => {
		const saldo = numeroValor(item.SaldoPendiente);
		return total + (saldo ?? 0);
	}, 0);
	const cobranzasAlDia = listadoMostrar.filter((item) => esCobranzaAlDia(item.EstadoVenta)).length;
	const cobranzasConSaldo = listadoMostrar.filter((item) => (numeroValor(item.SaldoPendiente) ?? 0) > 0).length;

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
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
				<LinearGradient colors={["#061b2b", "#064e5a", "#0f766e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
					<View style={styles.heroToolbar}>
						<TouchableOpacity style={styles.menuButton} onPress={() => navigation.goBack()} accessibilityLabel="Regresar"><MaterialCommunityIcons name="arrow-left" size={16} color="#ffffff" />{Platform.OS === "web" ? <Text style={styles.backButtonText}>Regresar</Text> : null}</TouchableOpacity>
						<View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveBadgeText}>Tiempo real {horaFormateada}</Text></View>
						<View style={styles.dateCard}>
							<View style={styles.dateLine}><MaterialCommunityIcons name="calendar-month-outline" size={11} color="#bfdbfe" /><Text style={styles.dateText}>{fechaFormateada}</Text></View>
							<View style={styles.dateLine}><MaterialCommunityIcons name="clock-outline" size={11} color="#bfdbfe" /><Text style={styles.dateText}>{horaFormateada}</Text></View>
						</View>
					</View>

					<View style={styles.heroMainRow}>
						<View style={styles.heroContent}><Text style={styles.title}>Gestion Integral</Text><Text style={styles.title}>de Cobranzas</Text><Text style={styles.subtitle}>Consulta ventas, pagos y saldos con el API reporte_Cobranzas.</Text></View>
						<View style={styles.peopleScene}>
							<View style={[styles.personBubble, styles.personBubbleBlue]}><MaterialCommunityIcons name="cash-register" size={17} color="#ffffff" /></View>
							<View style={[styles.personBubble, styles.personBubbleGreen]}><MaterialCommunityIcons name="credit-card-check-outline" size={17} color="#ffffff" /></View>
							<View style={[styles.personBubble, styles.personBubblePurple]}><MaterialCommunityIcons name="chart-timeline-variant" size={17} color="#ffffff" /></View>
							<View style={styles.peopleBase} />
						</View>
					</View>

					<View style={styles.statsGrid}>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#dbeafe" }]}><MaterialCommunityIcons name="file-document-multiple-outline" size={13} color="#2563eb" /></View><Text style={styles.statLabel}>Cobranzas</Text>{cargando ? <ActivityIndicator size="small" color="#2563eb" style={styles.statLoader} /> : <Text style={styles.statValue}>{listadoMostrar.length}</Text>}<Text style={styles.statCaption}>Registros</Text><View style={[styles.statAccentLine, { backgroundColor: "#2563eb" }]} /></View>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#d1fae5" }]}><MaterialCommunityIcons name="check-decagram-outline" size={13} color="#059669" /></View><Text style={styles.statLabel}>Al dia</Text><Text style={styles.statValue}>{cobranzasAlDia}</Text><Text style={styles.statCaption}>Sin atraso</Text><View style={[styles.statAccentLine, { backgroundColor: "#10b981" }]} /></View>
						<View style={styles.statCard}><View style={[styles.statIconWrap, { backgroundColor: "#ffe4e6" }]}><MaterialCommunityIcons name="clock-alert-outline" size={13} color="#e11d48" /></View><Text style={styles.statLabel}>Por cobrar</Text><Text style={styles.statValue}>{cobranzasConSaldo}</Text><Text style={styles.statCaption}>Con saldo</Text><View style={[styles.statAccentLine, { backgroundColor: "#f43f5e" }]} /></View>
						<TouchableOpacity style={styles.statCard} activeOpacity={0.82} onPress={cargarCobranzasIniciales}><View style={[styles.statIconWrap, { backgroundColor: "#fef3c7" }]}><MaterialCommunityIcons name="cash-clock" size={13} color="#d97706" /></View><Text style={styles.statLabel}>Saldo pendiente</Text><Text style={[styles.statValue, styles.statValueText]} numberOfLines={2}>{formatoMoneda(saldoTotalPendiente, "S/ 0.00")}</Text><Text style={styles.statCaption}>Toca para actualizar</Text><View style={[styles.statAccentLine, { backgroundColor: "#f59e0b" }]} /></TouchableOpacity>
					</View>
				</LinearGradient>

			<View style={styles.searchCard}>
				<Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
				<SelectorDniCliente
					value={dniCliente}
					clientes={clientesDni}
					visible={mostrarClientesDni}
					cargando={cargandoClientesDni}
					seleccionado={clienteDniSeleccionado}
					onChange={manejarCambioDni}
					onFocus={() => { cerrarSelectores(); setMostrarClientesDni(true); }}
					onToggle={() => { if (mostrarClientesDni) cerrarSelectores(); else { cerrarSelectores(); setMostrarClientesDni(true); } }}
					onSelect={(cliente) => void aplicarClientePorDni(cliente)}
					onSubmit={() => void buscarClientePorDni()}
				/>
				{clienteDniSeleccionado ? (
					<View style={styles.dniSelectedCard}>
						<View style={styles.dniSelectedIcon}><MaterialCommunityIcons name="account-check-outline" size={18} color="#ffffff" /></View>
					<View style={styles.dniSelectedCopy}><Text style={styles.dniSelectedLabel}>CLIENTE ENCONTRADO</Text><Text style={styles.dniSelectedName} numberOfLines={1}>{clienteDniSeleccionado.Nombre}</Text><Text style={styles.dniSelectedMeta}>DNI {clienteDniSeleccionado.DNI} · Campos: ultima venta · Listado: todas sus compras</Text></View>
						<MaterialCommunityIcons name="check-decagram" size={20} color="#10b981" />
					</View>
				) : null}
				<SelectorBuscable
						label="Estado de venta"
						value={estadoVenta}
						placeholder="Escribe o selecciona un estado"
						opciones={estadosVenta}
						visible={mostrarEstadosVenta}
						cargando={cargandoEstadosVenta}
						enFoco={campoActivo === "estado"}
						icono="tag-check-outline"
					onChange={(texto) => { filtrosDniAutomaticosRef.current = false; setEstadoVenta(texto); abrirSelector("estado"); }}
						onFocus={() => abrirSelector("estado")}
						onToggle={() => { if (mostrarEstadosVenta) cerrarSelectores(); else { abrirSelector("estado"); void refrescarEstadosVenta(); } }}
					onSelect={(valor) => { filtrosDniAutomaticosRef.current = false; setEstadoVenta(valor); cerrarSelectores(); Keyboard.dismiss(); }}
						onSubmit={consultarReporte}
					/>
					<SelectorBuscable
						label="Tipo de venta"
						value={tipoVenta}
						placeholder="Escribe o selecciona el tipo"
						opciones={tiposVenta}
						visible={mostrarTiposVenta}
						cargando={cargandoTiposVenta}
						enFoco={campoActivo === "venta"}
						icono="file-sign"
					onChange={(texto) => { filtrosDniAutomaticosRef.current = false; setTipoVenta(texto); abrirSelector("venta"); }}
						onFocus={() => abrirSelector("venta")}
						onToggle={() => { if (mostrarTiposVenta) cerrarSelectores(); else { abrirSelector("venta"); void refrescarTiposVenta(); } }}
					onSelect={(valor) => { filtrosDniAutomaticosRef.current = false; setTipoVenta(valor); cerrarSelectores(); Keyboard.dismiss(); }}
						onSubmit={consultarReporte}
					/>
					<SelectorBuscable
						label="Tipo de pago"
						value={tipoPago}
						placeholder="Escribe o selecciona el pago"
						opciones={tiposPago}
						visible={mostrarTiposPago}
						cargando={cargandoTiposPago}
						enFoco={campoActivo === "pago"}
						icono="credit-card-outline"
					onChange={(texto) => { filtrosDniAutomaticosRef.current = false; setTipoPago(texto); abrirSelector("pago"); }}
						onFocus={() => abrirSelector("pago")}
						onToggle={() => { if (mostrarTiposPago) cerrarSelectores(); else { abrirSelector("pago"); void refrescarTiposPago(); } }}
					onSelect={(valor) => { filtrosDniAutomaticosRef.current = false; setTipoPago(valor); cerrarSelectores(); Keyboard.dismiss(); }}
						onSubmit={consultarReporte}
					/>

				<View style={styles.dateRow}>
					<View style={styles.dateColumn}><Text style={styles.fieldLabel}>Filtrar desde</Text><View style={[styles.inputShell, styles.filterInputShell]}><MaterialCommunityIcons name="calendar-start" size={16} color="#8aa0b5" /><TextInput value={fechaDesde} onChangeText={(texto) => { filtrosDniAutomaticosRef.current = false; setFechaDesde(limpiarFecha(texto)); }} onFocus={cerrarSelectores} placeholder="DD-MM-AAAA" placeholderTextColor="#9aa9ba" style={styles.input} keyboardType="number-pad" returnKeyType="next" /></View></View>
					<View style={styles.dateColumn}><Text style={styles.fieldLabel}>Filtrar hasta</Text><View style={[styles.inputShell, styles.filterInputShell]}><MaterialCommunityIcons name="calendar-end" size={16} color="#8aa0b5" /><TextInput value={fechaHasta} onChangeText={(texto) => { filtrosDniAutomaticosRef.current = false; setFechaHasta(limpiarFecha(texto)); }} onFocus={cerrarSelectores} placeholder="DD-MM-AAAA" placeholderTextColor="#9aa9ba" style={styles.input} keyboardType="number-pad" returnKeyType="next" /></View></View>
				</View>

				<View style={styles.actionRow}>
						<TouchableOpacity style={styles.actionButton} onPress={consultarReporte}><LinearGradient colors={["#1f75ff", "#0657d9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="magnify" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Buscar</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("RegistrarVenta")}><LinearGradient colors={["#0f9f73", "#047857"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="plus-circle-outline" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Nuevo</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={limpiarFiltro}><LinearGradient colors={["#6b7280", "#475569"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="trash-can-outline" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>Limpiar</Text></LinearGradient></TouchableOpacity>
						<TouchableOpacity style={[styles.actionButton, (!cobranzasParaPdf.length || cargando) && styles.buttonDisabled]} onPress={generarPDF} disabled={!cobranzasParaPdf.length || cargando}><LinearGradient colors={["#f59e0b", "#f97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionFill}><MaterialCommunityIcons name="file-pdf-box" size={13} color="#ffffff" /><Text style={styles.actionTextLight}>PDF</Text></LinearGradient></TouchableOpacity>
					</View>
				</View>

				<View style={styles.contentCard}>
					<View style={styles.contentTitleRow}><MaterialCommunityIcons name="view-list-outline" size={18} color="#2563eb" /><Text style={styles.contentTitle}>Listado del Reporte</Text></View>
					{cargando ? <ActivityIndicator size="large" color="#2563eb" style={styles.loader} /> : null}
					{!cargando && mensaje ? <View style={styles.messageBox}><Text style={styles.messageText}>{mensaje}</Text></View> : null}
				{!cargando && buscado && listadoMostrar.length > 0 ? <Text selectable style={styles.resultCounter}>Mostrando {listadoMostrar.length} resultado{listadoMostrar.length === 1 ? "" : "s"} para: {ultimoFiltro}</Text> : null}
				{!cargando && buscado && listadoMostrar.length === 0 && !mensaje ? <View style={styles.emptyState}><View style={styles.emptyIconWrap}><MaterialCommunityIcons name="file-search-outline" size={28} color="#0f766e" /></View><Text style={styles.emptyTitle}>Sin resultados</Text><Text style={styles.emptyText}>No se encontraron cobranzas para los filtros ingresados.</Text></View> : null}
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
								<View key={`${item.IdVenta}-${index}`} style={[styles.tableDataRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
									{COLUMNAS_REPORTE.map((columna) => (
										<View key={`${index}-${columna.key}`} style={[styles.tableDataCell, { flex: columna.flex }]}>
											{columna.key === "EstadoVenta" ? (
												<View style={[styles.estadoBadge, esCobranzaAlDia(String(item.EstadoVenta)) ? styles.estadoBadgeActivo : styles.estadoBadgeInactivo]}>
											<Text selectable style={[styles.estadoBadgeText, esCobranzaAlDia(String(item.EstadoVenta)) ? styles.estadoBadgeTextActivo : styles.estadoBadgeTextInactivo]}>{String(item[columna.key] ?? "-")}</Text>
												</View>
											) : (
										<Text selectable style={[styles.tableDataText, esColumnaCorta(columna.key) ? styles.tableDataTextTight : null]} numberOfLines={2} adjustsFontSizeToFit={esColumnaCorta(columna.key)} minimumFontScale={0.78}>
													{String(item[columna.key] ?? "-")}
												</Text>
											)}
										</View>
									))}
								<View style={styles.tableActionCell}>
									<TouchableOpacity style={styles.verButton} onPress={() => abrirVentaRegistrada(navigation, item)}>
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

export default ReporteCobranzas;

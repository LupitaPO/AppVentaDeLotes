import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ActivityIndicator,
	ScrollView,
	Alert,
	Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./ReporteClientesStyles";

// ATAMAINE: URL base del backend .NET donde consultamos la lista real de clientes.
const API_URL = "http://www.tulote.somee.com";
// ATAMAINE: Datos fijos que usamos para personalizar la cabecera y pie del PDF.
const EMPRESA_NOMBRE = "Residencial Santa Fe";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "RSF";

// ATAMAINE: Tipo generico para leer la respuesta cruda del backend antes de normalizarla.
type ReporteItem = Record<string, unknown>;

// ATAMAINE: Estructura final que la pantalla usa para pintar la tabla y exportar el PDF.
type ClienteReporteItem = {
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

const parseReporteResponse = (payload: string): ReporteItem[] => {
	// ATAMAINE: Si la API no devuelve nada, evitamos errores devolviendo una lista vacia.
	if (!payload) {
		return [];
	}

	try {
		// ATAMAINE: Algunas respuestas llegan como arreglo directo y otras como JSON string dentro de otro JSON.
		const parsed = JSON.parse(payload);

		if (Array.isArray(parsed)) {
			return parsed;
		}

		if (typeof parsed === "string") {
			const nested = JSON.parse(parsed);
			return Array.isArray(nested) ? nested : [];
		}

		return [];
	} catch (error) {
		console.error("Error al parsear reporte:", error);
		return [];
	}
};

// ATAMAINE: Dejamos una estructura fija para que la tabla entre completa en pantalla y no se desborde.
const COLUMNAS_REPORTE: Array<{
	key: keyof ClienteReporteItem;
	label: string;
	flex: number;
}> = [
	{ key: "DNI", label: "DNI", flex: 0.95 },
	{ key: "Nombre", label: "Nombre", flex: 1.2 },
	{ key: "Apellidos", label: "Apellidos", flex: 1.2 },
	{ key: "Celular", label: "Celular", flex: 1.05 },
	{ key: "Correo", label: "Correo", flex: 1.6 },
	{ key: "Estado", label: "Estado", flex: 0.9 },
];

// ATAMAINE: Unificamos el texto del estado para mostrarlo limpio en pantalla segun lo que venga en la API.
const normalizarEstado = (estado: unknown) => {
	// ATAMAINE: Convertimos cualquier valor a texto comparable y lo limpiamos antes de evaluarlo.
	const estadoTexto = String(estado ?? "").trim().toLowerCase();

	// ATAMAINE: Catalogamos los valores que la API puede usar para representar clientes activos o inactivos.
	const estadosActivos = ["activo", "a", "1", "true", "vigente", "registrado"];
	const estadosInactivos = ["inactivo", "i", "0", "false", "anulado", "borrado", "desactivado"];

	if (estadosActivos.includes(estadoTexto)) {
		return "Activo";
	}

	if (estadosInactivos.includes(estadoTexto)) {
		return "Inactivo";
	}

	// ATAMAINE: Si la API manda otro texto no vacio, lo respetamos capitalizado para no perder informacion real.
	if (estadoTexto) {
		return estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1);
	}

	return "Activo";
};

// ATAMAINE: Normalizamos los datos del cliente para que el reporte siempre tenga las mismas columnas visibles.
const normalizarClientes = (items: ReporteItem[]): ClienteReporteItem[] =>
	// ATAMAINE: Aquí convertimos el modelo crudo del backend al formato fijo usado por esta pantalla.
	items.map((item) => ({
		DNI: String(item.DNI ?? "-"),
		Nombre: [item.Nombre1, item.Nombre2].filter(Boolean).join(" ") || String(item.Nombre ?? "-"),
		Apellidos:
			[item.Apaterno, item.Amaterno].filter(Boolean).join(" ") ||
			String(item.Apellidos ?? "-"),
		Celular: String(item.Celular ?? "-"),
		Correo: String(item.Correo ?? "-"),
		Estado: normalizarEstado(item.Estado),
	}));

// ATAMAINE: Detectamos estados para pintarlos distinto dentro de la tabla sin cambiar la data real.
const esEstadoActivo = (estado: string) => estado.trim().toLowerCase() === "activo";

const ReporteClientes = ({ navigation }: ReporteClientesProps) => {
	// ATAMAINE: Texto escrito por el usuario para filtrar por DNI o por nombre.
	const [datoBuscar, setDatoBuscar] = useState("");
	// ATAMAINE: Lista maestra con todos los clientes traidos inicialmente desde la API.
	const [todosClientes, setTodosClientes] = useState<ClienteReporteItem[]>([]);
	// ATAMAINE: Lista visible en pantalla; puede ser la lista completa o una lista filtrada.
	const [reporte, setReporte] = useState<ClienteReporteItem[]>([]);
	// ATAMAINE: Controla el spinner de carga al consultar datos.
	const [cargando, setCargando] = useState(false);
	// ATAMAINE: Indica si el usuario ya ejecutó una búsqueda para mostrar mensajes o contadores adecuados.
	const [buscado, setBuscado] = useState(false);
	// ATAMAINE: Mensaje informativo o de error que aparece debajo de la zona de acciones.
	const [mensaje, setMensaje] = useState("");
	// ATAMAINE: Guardamos el ultimo filtro aplicado porque tambien lo mostramos dentro del PDF.
	const [ultimoFiltro, setUltimoFiltro] = useState("");
	// ATAMAINE: Reloj local usado para la cabecera visual y para el correlativo del documento PDF.
	const [horaActual, setHoraActual] = useState(new Date());

	// ATAMAINE: Actualizamos el reloj cada segundo para mantener la UI y el PDF en tiempo real.
	useEffect(() => {
		const timer = setInterval(() => {
			setHoraActual(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	// ATAMAINE: Reinicia la búsqueda y devuelve la tabla a su estado base con todos los clientes.
	const limpiarFiltro = () => {
		setDatoBuscar("");
		setUltimoFiltro("");
		setMensaje("");
		setBuscado(false);
		setReporte(todosClientes);
	};

	// ATAMAINE: Formatos listos para mostrar hora y fecha en español dentro de la cabecera y el PDF.
	const horaFormateada = horaActual.toLocaleTimeString("es-PE", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const fechaFormateada = horaActual.toLocaleDateString("es-PE", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	// ATAMAINE: Resolvemos el logo local para usarlo dentro del HTML del PDF con una cabecera mas formal.
	const logoPdfUri = Image.resolveAssetSource(require("../assets/splash-icon.png"))?.uri || "";

	// ATAMAINE: Fuente real del PDF. Sin busqueda usa todos los clientes; con busqueda usa solo el resultado filtrado actual.
	const clientesParaPdf = buscado && ultimoFiltro ? reporte : todosClientes;

	// ATAMAINE: Al entrar a la pantalla cargamos una sola vez todos los clientes para trabajar el filtro localmente.
	useEffect(() => {
		const cargarClientesIniciales = async () => {
			try {
				// ATAMAINE: Activamos estado de carga y limpiamos mensajes previos antes de consumir la API.
				setCargando(true);
				setMensaje("");
				const response = await fetch(`${API_URL}/Cliente/cliente_Listar`);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				const rawData = await response.text();
				// ATAMAINE: Parseamos y normalizamos la data para dejar la tabla consistente aunque cambie el formato del backend.
				const clientesBase = normalizarClientes(parseReporteResponse(rawData));
				setTodosClientes(clientesBase);
				setReporte(clientesBase);
				setBuscado(false);
			} catch (error) {
				console.error("Error al cargar clientes base:", error);
				setTodosClientes([]);
				setReporte([]);
				setMensaje("No se pudo cargar la lista de clientes.");
			} finally {
				setCargando(false);
			}
		};

		cargarClientesIniciales();
	}, []);

	// ATAMAINE: Construimos el PDF en tabla horizontal para que se vea como la lista del reporte y salga mejor al imprimir.
	const construirHtmlReporte = () => {
		// ATAMAINE: Generamos un correlativo simple para identificar el documento exportado sin depender del backend.
		const numeroDocumento = `RPT-CLI-${horaActual
			.toISOString()
			.replace(/[-:TZ.]/g, "")
			.slice(0, 14)}`;
		const logoHtml = logoPdfUri
			? `<img src="${escapeHtml(logoPdfUri)}" style="width: 68px; height: 68px; border-radius: 16px; object-fit: contain; background: white; padding: 8px; border: 1px solid rgba(255,255,255,0.18);" />`
			: `<div style="width: 68px; height: 68px; border-radius: 16px; background: white; color: #0f766e; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; border: 1px solid rgba(255,255,255,0.18);">${escapeHtml(EMPRESA_SIGLAS)}</div>`;

		// ATAMAINE: Estas columnas solo controlan el ancho visual en el PDF, no cambian la tabla mostrada en pantalla.
		const columnasPdf = [
			{ label: "N°", width: "8%" },
			{ label: "DNI", width: "11%" },
			{ label: "Nombre", width: "14%" },
			{ label: "Apellidos", width: "17%" },
			{ label: "Celular", width: "12%" },
			{ label: "Correo", width: "23%" },
			{ label: "Estado", width: "15%" },
		];

		const colgroupHtml = columnasPdf
			.map((columna) => `<col style="width: ${columna.width};" />`)
			.join("");

		// ATAMAINE: Construimos el encabezado HTML de la tabla del PDF según el orden definido arriba.
		const encabezadosHtml = columnasPdf.map(
			(columna) => `
				<th style="padding: 12px 10px; background: #1d4ed8; color: white; font-size: 12px; font-weight: 700; border: 1px solid #d9e6f2; text-align: center;">
					${escapeHtml(columna.label)}
				</th>
			`,
		).join("");

		// ATAMAINE: Convertimos la lista actual en filas HTML listas para imprimir.
		const filasHtml = clientesParaPdf
			.map((item, index) => {
				const fondoFila = index % 2 === 0 ? "#ffffff" : "#f6fbff";
				// ATAMAINE: Cada cliente lleva numeracion visual propia para que el documento escale mejor cuando haya muchos registros.
				const numeracionHtml = `
					<td style="border: 1px solid #dbe4ea; padding: 10px; text-align: center; background: ${fondoFila}; font-size: 12px; color: #0f172a; font-weight: 700;">
						${index + 1}
					</td>
				`;
				// ATAMAINE: Recorremos las columnas visibles para mantener el mismo orden lógico entre app y PDF.
				const columnasFila = COLUMNAS_REPORTE.map((columna) => {
					const valor = String(item[columna.key] ?? "-");

					if (columna.key === "Estado") {
						// ATAMAINE: El estado se dibuja como badge para que sea más fácil de identificar en la impresión.
						const esActivo = esEstadoActivo(valor);
						return `
							<td style="border: 1px solid #dbe4ea; padding: 10px; text-align: center; background: ${fondoFila};">
								<span style="display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; color: ${esActivo ? "#15803d" : "#be123c"}; background: ${esActivo ? "#ecfdf3" : "#fff1f2"}; border: 1px solid ${esActivo ? "#86efac" : "#fda4af"};">
									${escapeHtml(valor)}
								</span>
							</td>
						`;
					}

					// ATAMAINE: Para el resto de columnas imprimimos texto plano centrado y protegido con escapeHtml.
					return `
						<td style="border: 1px solid #dbe4ea; padding: 10px; text-align: center; background: ${fondoFila}; font-size: 12px; color: #0f172a;">
							${escapeHtml(valor)}
						</td>
					`;
				}).join("");

				return `
					<tr>
						${numeracionHtml}
						${columnasFila}
					</tr>
				`;
			})
			.join("");

		// ATAMAINE: Devolvemos un HTML completo con estilos embebidos porque expo-print lo procesa directamente.
		return `
			<html>
				<head>
					<style>
						@page {
							size: A4 landscape;
							margin: 18px 18px 56px 18px;
						}
						body {
							font-family: Arial, sans-serif;
							color: #0f172a;
							padding-bottom: 48px;
						}
						table {
							width: 100%;
							border-collapse: collapse;
							table-layout: fixed;
						}
						td, th {
							word-break: break-word;
							overflow-wrap: anywhere;
							vertical-align: middle;
						}
						tr {
							page-break-inside: avoid;
						}
						.footer-wrap {
							position: fixed;
							left: 24px;
							right: 24px;
							bottom: 8px;
							display: flex;
							justify-content: space-between;
							align-items: center;
							gap: 12px;
							padding-top: 10px;
							border-top: 1px solid #cbd5e1;
							font-size: 10px;
							color: #475569;
						}
						.footer-page::after {
							content: "Pagina " counter(page) " de " counter(pages);
							font-weight: 700;
							color: #0f172a;
						}
					</style>
				</head>
				<body style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
					<div style="display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 18px; background: linear-gradient(135deg, #0f766e 0%, #164e63 55%, #1e3a8a 100%); border-radius: 22px; overflow: hidden; border: 1px solid #d9e6f2;">
						<div style="display: flex; align-items: center; gap: 16px; padding: 18px 20px; flex: 1;">
							${logoHtml}
							<div>
								<p style="margin: 0 0 5px; color: #d1fae5; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;">${escapeHtml(EMPRESA_NOMBRE)}</p>
								<h1 style="margin: 0; color: white; font-size: 26px; line-height: 1.15;">Reporte de Clientes</h1>
								<p style="margin: 8px 0 0; color: #dbeafe; font-size: 12px;">Documento generado en tiempo real desde la lista de clientes registrados.</p>
							</div>
						</div>
						<div style="min-width: 220px; background: rgba(255,255,255,0.12); border-left: 1px solid rgba(255,255,255,0.16); padding: 18px 20px;">
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Empresa:</strong> ${escapeHtml(EMPRESA_NOMBRE)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Documento:</strong> ${escapeHtml(numeroDocumento)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Fecha:</strong> ${escapeHtml(fechaFormateada)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Hora:</strong> ${escapeHtml(horaFormateada)}</p>
							<p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Filtro:</strong> ${escapeHtml(ultimoFiltro || "Todos los clientes")}</p>
							<p style="margin: 0; color: white; font-size: 12px;"><strong>Total:</strong> ${clientesParaPdf.length} registros</p>
						</div>
					</div>

					<div style="border: 1px solid #dbe4ea; border-radius: 18px; overflow: hidden;">
						<table>
							<colgroup>${colgroupHtml}</colgroup>
							<thead>
								<tr>${encabezadosHtml}</tr>
							</thead>
							<tbody>
								${filasHtml}
							</tbody>
						</table>
					</div>

					<div class="footer-wrap">
						<div>
							<strong>${escapeHtml(EMPRESA_NOMBRE)}</strong> | Documento informativo de uso interno. Verifique la vigencia de los datos antes de cualquier gestion comercial. Contacto: ${escapeHtml(EMPRESA_CONTACTO)}
						</div>
						<div class="footer-page"></div>
					</div>
				</body>
			</html>
		`;
	};

	// ATAMAINE: Generamos el PDF segun todos los clientes o segun la busqueda actual y abrimos el flujo nativo de imprimir/guardar, que es lo mas estable en el telefono.
	const generarPDF = async () => {
		// ATAMAINE: Si no hay registros visibles evitamos crear un documento vacío.
		if (!clientesParaPdf.length) {
			Alert.alert("Aviso", "Primero genera un reporte para exportarlo en PDF.");
			return;
		}

		try {
			const html = construirHtmlReporte();

			// ATAMAINE: Primero abrimos la interfaz nativa para imprimir o guardar como PDF.
			await Print.printAsync({ html });

			// ATAMAINE: Como respaldo adicional, tambien generamos el archivo PDF para compartirlo o guardarlo desde el telefono.
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

			Alert.alert("Aviso", "Se abrio el panel de impresion. Si deseas descargar o compartir, usa la opcion del sistema para guardar como PDF.");
		} catch (error) {
			console.error("Error al generar PDF:", error);
			Alert.alert("Error", "No se pudo generar el PDF del reporte.");
		}
	};

	// ATAMAINE: El filtro se hace en memoria para que sea rapido y no dependa de otra llamada al backend.
	const consultarReporte = async () => {   
		const filtro = datoBuscar.trim();

		// ATAMAINE: Si el campo está vacío restauramos la grilla completa y salimos.
		if (!filtro) {
			setReporte(todosClientes);
			setBuscado(false);
			setUltimoFiltro("");
			setMensaje("");
			return;
		}

		try {
			setCargando(true);
			setMensaje("");
			setUltimoFiltro(filtro);
			// ATAMAINE: Comparamos en minúsculas para permitir búsquedas más flexibles por DNI o nombre completo.
			const filtroNormalizado = filtro.toLowerCase();
			const filtrados = todosClientes.filter((cliente) => {
				const nombreCompleto = `${cliente.Nombre} ${cliente.Apellidos}`.toLowerCase();
				return (
					cliente.DNI.toLowerCase().includes(filtroNormalizado) ||
					nombreCompleto.includes(filtroNormalizado)
				);
			});

			setReporte(filtrados);
			setBuscado(true);

			if (filtrados.length === 0) {
				setMensaje("No se encontraron registros para ese criterio.");
			}
		} catch (error) {
			console.error("Error al consultar reporte:", error);
			setReporte(todosClientes);
			setBuscado(true);
			setMensaje("No se pudo consultar el reporte en este momento.");
		} finally {
			setCargando(false);
		}
	};

	return (
		// ATAMAINE: Contenedor principal con fondo y efectos decorativos de la pantalla.
		<View style={styles.container}>
			<View style={styles.backgroundGlowTop} />
			<View style={styles.backgroundGlowBottom} />
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				{/* ATAMAINE: Hero principal con boton de regreso, reloj y resumen rápido del reporte. */}
				<LinearGradient
					colors={["#2d7f7b", "#235e63", "#22364d"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.heroCard}
				>
					<View style={styles.headerRow}>
						<TouchableOpacity
							style={styles.backButton}
							onPress={() => navigation.goBack()}
						>
							<MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
						</TouchableOpacity>
						<View style={styles.heroContent}>
							<View style={styles.liveBadge}>
								<View style={styles.liveDot} />
								<Text style={styles.liveBadgeText}>Tiempo real {horaFormateada}</Text>
							</View>
							<Text style={styles.title}>Gestion Integral</Text>
							<Text style={styles.title}>de Clientes</Text>
							<Text style={styles.subtitle}>
								Gestiona la informacion de los clientes en tiempo real.
							</Text>
						</View>
					</View>

					<View style={styles.statsRow}>
						{/* ATAMAINE: Resumen de clientes cargados desde la API. */}
						<View style={styles.statCard}>
							<Text style={styles.statLabel}>Clientes Registrados</Text>
							<Text style={styles.statValue}>{todosClientes.length}</Text>
							<Text style={styles.statCaption}>Clientes totales</Text>
						</View>
						{/* ATAMAINE: Muestra el último criterio usado por el usuario. */}
						<View style={styles.statCard}>
							<Text style={styles.statLabel}>Ultima Busqueda</Text>
							<Text style={styles.statValueSmall}>{ultimoFiltro || "Sin filtro"}</Text>
							<Text style={styles.statCaption}>Dato consultado</Text>
						</View>
					</View>
				</LinearGradient>

				{/* ATAMAINE: Bloque de filtros y acciones principales del reporte. */}
				<View style={styles.searchCard}>
					<Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
					<Text style={styles.fieldLabel}>DNI/nombre:</Text>
					<TextInput
						value={datoBuscar}
						onChangeText={setDatoBuscar}
						placeholder="Ingresar por DNI o nombre"
						placeholderTextColor="#8ba8ae"
						style={styles.input}
						returnKeyType="search"
						onSubmitEditing={consultarReporte}
					/>

					<View style={styles.actionRow}>
						{/* ATAMAINE: Ejecuta el filtro local según el texto ingresado. */}
						<TouchableOpacity style={styles.primaryAction} onPress={consultarReporte}>
							{/* ATAMAINE: Boton rediseñado tipo tarjeta compacta con color guia por accion. */}
							<View style={[styles.actionSurface, styles.primaryActionSurface]}>
								<View style={[styles.actionIconBadge, styles.primaryActionBadge]}>
									<MaterialCommunityIcons name="magnify" size={18} color="#2563eb" />
								</View>
								<Text style={styles.primaryActionText}>Buscar</Text>
							</View>
						</TouchableOpacity>

						{/* ATAMAINE: Boton visual preparado para una futura accion de alta de cliente. */}
						<TouchableOpacity style={styles.newAction} activeOpacity={0.85}>
							<View style={[styles.actionSurface, styles.newActionSurface]}>
								<View style={[styles.actionIconBadge, styles.newActionBadge]}>
									<MaterialCommunityIcons name="plus-circle-outline" size={18} color="#0f766e" />
								</View>
								<Text style={styles.newActionText}>Nuevo</Text>
							</View>
						</TouchableOpacity>

						{/* ATAMAINE: Limpia el filtro y repone todos los clientes en la tabla. */}
						<TouchableOpacity style={styles.clearAction} onPress={limpiarFiltro}>
							<View style={[styles.actionSurface, styles.clearActionSurface]}>
								<View style={[styles.actionIconBadge, styles.clearActionBadge]}>
									<MaterialCommunityIcons name="close-circle-outline" size={18} color="#64748b" />
								</View>
								<Text style={styles.clearActionText}>Limpiar</Text>
							</View>
						</TouchableOpacity>
					</View>

					<View style={styles.actionRowSecondary}>
						{/* ATAMAINE: Exporta el contenido actual del reporte a PDF respetando el filtro activo. */}
						<TouchableOpacity
							style={[styles.secondaryAction, (!reporte.length || cargando) && styles.buttonDisabled]}
							onPress={generarPDF}
							disabled={!reporte.length || cargando}
						>
							<View style={[styles.actionSurface, styles.secondaryActionSurface]}>
								<View style={[styles.actionIconBadge, styles.secondaryActionBadge]}>
									<MaterialCommunityIcons name="file-pdf-box" size={18} color="#f59e0b" />
								</View>
								<Text style={styles.secondaryActionText}>PDF</Text>
							</View>
						</TouchableOpacity>
					</View>
				</View>

				{/* ATAMAINE: Tarjeta central donde se muestran mensajes, resultados y la tabla final. */}
				<View style={styles.contentCard}>
					<Text style={styles.contentTitle}>Listado de Clientes</Text>
					{/* ATAMAINE: Indicador de carga visible mientras se trae o filtra la informacion. */}
				{cargando && (
					<ActivityIndicator size="large" color="#069488" style={styles.loader} />
				)}

					{/* ATAMAINE: Mensaje de error o aviso general cuando corresponde. */}
					{!cargando && mensaje ? (
						<View style={styles.messageBox}>
							<Text style={styles.messageText}>{mensaje}</Text>
						</View>
					) : null}

					{/* ATAMAINE: Contador de coincidencias mostrado solo después de buscar. */}
					{!cargando && buscado && reporte.length > 0 ? (
						<Text style={styles.resultCounter}>Resultados encontrados: {reporte.length}</Text>
					) : null}

					{/* ATAMAINE: Estado vacío elegante cuando no hay coincidencias para el filtro. */}
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

					{/* ATAMAINE: Tabla principal del reporte, visible cuando hay registros para mostrar. */}
					{!cargando && reporte.length > 0 ? (
						<View style={styles.tableWrapper}>
							<View style={styles.tableTopAccent} />
								{/* ATAMAINE: Fila de encabezados con las columnas visibles en pantalla. */}
								<View style={styles.tableHeaderRow}>
									{COLUMNAS_REPORTE.map((columna) => (
										<View key={columna.key} style={[styles.tableHeaderCell, { flex: columna.flex }]}>
											<Text style={styles.tableHeaderText}>{columna.label}</Text>
										</View>
									))}
									<View style={styles.tableActionHeaderCell}>
										<Text style={styles.tableHeaderText}>Ver</Text>
									</View>
								</View>

								{/* ATAMAINE: Filas dinámicas generadas desde la lista actual del reporte. */}
								{reporte.map((item, index) => (
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
													// ATAMAINE: Estado con badge de color para lectura rápida.
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
												) : (
													// ATAMAINE: Para datos largos limitamos a dos líneas para que la tabla siga compacta.
													<Text style={styles.tableDataText} numberOfLines={2}>
														{String(item[columna.key] ?? "-")}
													</Text>
												)}
											</View>
										))}
										<View style={styles.tableActionCell}>
											{/* ATAMAINE: Boton visual reservado para una futura vista de detalle. */}
											<TouchableOpacity style={styles.verButton} activeOpacity={0.8}>
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

export default ReporteClientes;

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
import { useRef } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./ReporteAsesorStyles";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const EMPRESA_NOMBRE = "Residencial Santa Fe";
const EMPRESA_CONTACTO = "www.tulote.somee.com";
const EMPRESA_SIGLAS = "RSF";

type ReporteItem = Record<string, unknown>;
type AsesorReporteItem = {
    DNI: string;
    Nombre: string;
    Apellidos: string;
    Celular: string;
    Direccion:string;
    Correo: string;
    Estado: string;
}
type ReporteAsesorProps = {
    navigation: any;
};
const escapeHtml = (value: unknown) =>
    String(value ?? "-")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

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

        return [];
    } catch (error) {
        console.error("Error al parsear reporte:", error);
        return [];
    }
};

const COLUMNAS_REPORTE: Array<{
    key: keyof AsesorReporteItem;
    label: string;
    flex: number;
}> = [
    { key: "DNI", label: "DNI", flex: 1.2 },
    { key: "Nombre", label: "Nombre", flex: 1.8 },
    { key: "Apellidos", label: "Apellidos", flex: 1.8 },
    { key: "Celular", label: "Celular", flex: 1.2 },
    { key: "Direccion", label: "Direccion", flex: 2 },
    { key: "Correo", label: "Correo", flex: 2.2 },
    { key: "Estado", label: "Estado", flex: 4 },
];

const normalizarEstado = (estado: unknown) => {
    const estadoTexto = String(estado ?? "").trim().toLowerCase();
    const estadosActivos = ["activo", "a", "1", "true", "vigente", "registrado"];
    const estadosInactivos = ["inactivo", "i", "0", "false", "anulado", "borrado", "desactivado"];
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
// Función para normalizar los datos de asesores, asegurando que siempre haya un valor de texto y un formato consistente. 
//Según la base de datos
const normalizarAsesores = (items: ReporteItem[]): AsesorReporteItem[] =>
    items.map((item) => ({
        DNI: String(item.DNI ?? "-"),
        Nombre: [item.Nombre1, item.Nombre2].filter(Boolean).join(" ") || String(item.Nombre ?? "-"),
        Apellidos:
            [item.Apaterno, item.Amaterno].filter(Boolean).join(" ") ||
            String(item.Apellidos ?? "-"),
        Celular: String(item.Celular ?? "-"),
        Direccion: String(item.Direccion ?? "-"),
        Correo: String(item.Correo ?? "-"),
        Estado: String(item.Estado),
    }));

const esEstadoActivo = (estado: string) => estado.trim().toLowerCase() === "activo";

const ReporteAsesores = ({ navigation }: ReporteAsesorProps) => {
    const [datoBuscar, setDatoBuscar] = useState("");
    const [todosAsesores, setTodosAsesores] = useState<AsesorReporteItem[]>([]);
    const [reporte, setReporte] = useState<AsesorReporteItem[]>([]);
    const [cargando, setCargando] = useState(false);
    const [buscado, setBuscado] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [ultimoFiltro, setUltimoFiltro] = useState("");
    const [horaActual, setHoraActual] = useState(new Date());



    useEffect(() => {
        const timer = setInterval(() => {
            setHoraActual(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const limpiarFiltro = () => {
        setDatoBuscar("");
        setUltimoFiltro("");
        setMensaje("");
        setBuscado(false);
        setReporte(todosAsesores);
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
    const logoPdfUri = Image.resolveAssetSource(require("../assets/splash-icon.png"))?.uri || "";
    const asesorParaPdf = buscado && ultimoFiltro ? reporte : todosAsesores;
// Cargar datos iniciales al montar el componente
    useEffect(() => {
    cargarAsesoresIniciales();
}, []);
const cargarAsesoresIniciales = async () => {
    try {
        setCargando(true);
        setMensaje("");

        // Si no hay filtro => traer todos
        const filtro = datoBuscar.trim();

        const url = filtro
            ? `${API_URL}/Reporte/reporte_Asesores/${encodeURIComponent(filtro)}`
            : `${API_URL}/Asesor/asesor_Listar/`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const rawData = await response.text();

        console.log("API RESPONSE:", rawData);

        const asesoresBase = normalizarAsesores(
            parseReporteResponse(rawData)
        );

        // Guardar todos los asesores
        setTodosAsesores(asesoresBase);

        // Mostrar todos en la tabla
        setReporte(asesoresBase);

        setBuscado(false);

        if (asesoresBase.length === 0) {
            setMensaje("No existen asesores.");
        }

    } catch (error) {

        console.log("ERROR API:", error);

        setTodosAsesores([]);
        setReporte([]);

        setMensaje(
            "No se pudo conectar con la API."
        );

    } finally {
        setCargando(false);
    }
};

    const construirHtmlReporte = () => {
        const numeroDocumento = `RPT-ASR-${horaActual
            .toISOString()
            .replace(/[-:TZ.]/g, "")
            .slice(0, 14)}`;
        const logoHtml = logoPdfUri
            ? `<img src="${escapeHtml(logoPdfUri)}" style="width: 68px; height: 68px; border-radius: 16px; object-fit: contain; background: white; padding: 8px; border: 1px solid rgba(255,255,255,0.18);" />`
            : `<div style="width: 68px; height: 68px; border-radius: 16px; background: white; color: #0f766e; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; border: 1px solid rgba(255,255,255,0.18);">${escapeHtml(EMPRESA_SIGLAS)}</div>`;

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
            .map(
                (columna) => `
                    <th style="padding: 12px 10px; background: #1d4ed8; color: white; font-size: 12px; font-weight: 700; border: 1px solid #d9e6f2; text-align: center;">
                        ${escapeHtml(columna.label)}
                    </th>`,
            )
            .join("");

        const filasHtml = asesorParaPdf
            .map((item, index) => {
                const fondoFila = index % 2 === 0 ? "#ffffff" : "#f6fbff";
                const numeracionHtml = `
                    <td style="border: 1px solid #dbe4ea; padding: 10px; text-align: center; background: ${fondoFila}; font-size: 12px; color: #0f172a; font-weight: 700;">
                        ${index + 1}
                    </td>`;

                const columnasFila = COLUMNAS_REPORTE
                    .map((columna) => {
                        const valor = String(item[columna.key] ?? "-");
                        if (columna.key === "Estado") {
                            const esActivo = esEstadoActivo(valor);
                            return `
                                <td style="border: 1px solid #dbe4ea; padding: 10px; text-align: center; background: ${fondoFila};">
                                    <span style="display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; color: ${esActivo ? "#15803d" : "#be123c"}; background: ${esActivo ? "#ecfdf3" : "#fff1f2"}; border: 1px solid ${esActivo ? "#86efac" : "#fda4af"};">
                                        ${escapeHtml(valor)}
                                    </span>
                                </td>`;
                        }

                        return `
                            <td style="border: 1px solid #dbe4ea; padding: 10px; text-align: center; background: ${fondoFila}; font-size: 12px; color: #0f172a;">
                                ${escapeHtml(valor)}
                            </td>`;
                    })
                    .join("");

                return `
                    <tr>
                        ${numeracionHtml}
                        ${columnasFila}
                    </tr>`;
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
                                <h1 style="margin: 0; color: white; font-size: 26px; line-height: 1.15;">Reporte de Asesores</h1>
                                <p style="margin: 8px 0 0; color: #dbeafe; font-size: 12px;">Documento generado en tiempo real desde la lista de asesores registrados.</p>
                            </div>
                        </div>
                        <div style="min-width: 220px; background: rgba(255,255,255,0.12); border-left: 1px solid rgba(255,255,255,0.16); padding: 18px 20px;">
                            <p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Empresa:</strong> ${escapeHtml(EMPRESA_NOMBRE)}</p>
                            <p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Documento:</strong> ${escapeHtml(numeroDocumento)}</p>
                            <p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Fecha:</strong> ${escapeHtml(fechaFormateada)}</p>
                            <p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Hora:</strong> ${escapeHtml(horaFormateada)}</p>
                            <p style="margin: 0 0 8px; color: white; font-size: 12px;"><strong>Filtro:</strong> ${escapeHtml(ultimoFiltro || "Todos los asesores")}</p>
                            <p style="margin: 0; color: white; font-size: 12px;"><strong>Total:</strong> ${asesorParaPdf.length} registros</p>
                        </div>
                    </div>

                    <div style="border: 1px solid #dbe4ea; border-radius: 18px; overflow: hidden;">
                        <table>
                            <colgroup>${colgroupHtml}</colgroup>
                            <thead>
                                <tr>${encabezadosHtml}</tr>
                            </thead>
                            <tbody>${filasHtml}</tbody>
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

    const generarPDF = async () => {
        if (!asesorParaPdf.length) {
            Alert.alert("Aviso", "Primero genera un reporte para exportarlo en PDF.");
            return;
        }

        try {
            const html = construirHtmlReporte();
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

            Alert.alert("Aviso", "Se abrió el panel de impresión. Si deseas descargar o compartir, usa la opción del sistema para guardar como PDF.");
        } catch (error) {
            console.error("Error al generar PDF:", error);
            Alert.alert("Error", "No se pudo generar el PDF del reporte.");
        }
    };


    // Función para consultar el reporte según el filtro ingresado
const consultarReporte = async () => {
    const filtro = datoBuscar.trim();

    if (!filtro) {
        setReporte(todosAsesores);
        setBuscado(false);
        setUltimoFiltro("");
        setMensaje("");
        return;
    }
    try {
        setCargando(true);
        setMensaje("");
        setUltimoFiltro(filtro);
        const response = await fetch(
            `${API_URL}/Reporte/reporte_Asesores/${encodeURIComponent(filtro)}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            }
        );
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const rawData = await response.text();
        console.log("BUSQUEDA:", rawData);
        const filtrados = normalizarAsesores(
            parseReporteResponse(rawData)
        );
        setReporte(filtrados);
        setBuscado(true);
        if (filtrados.length === 0) {
            setMensaje(
                "No se encontraron resultados."
            );
        }
    } catch (error) {
        console.log("ERROR BUSQUEDA:", error);
        setReporte([]);
        setBuscado(true);
        setMensaje(
            "Error al consultar la API."
        );
    } finally {
        setCargando(false);
    }
};

   



    return (
        <View style={styles.container}>
            <View style={styles.backgroundGlowTop} />
            <View style={styles.backgroundGlowBottom} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#2d7f7b", "#235e63", "#22364d"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
                        </TouchableOpacity>
                        <View style={styles.heroContent}>
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveBadgeText}>Tiempo real {horaFormateada}</Text>
                            </View>
                            <Text style={styles.title}>Gestion Integral</Text>
                            <Text style={styles.title}>de Asesores</Text>
                            <Text style={styles.subtitle}>
                                Gestiona la informacion de los asesores en tiempo real.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Asesores Registrados</Text>
                            <Text style={styles.statValue}>{todosAsesores.length}</Text>
                            <Text style={styles.statCaption}>Asesores totales</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Ultima Busqueda</Text>
                            <Text style={styles.statValueSmall}>{ultimoFiltro || "Sin filtro"}</Text>
                            <Text style={styles.statCaption}>Dato consultado</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.searchCard}>
                    <Text style={styles.searchTitle}>Filtros de Busqueda y Acciones</Text>
                    <Text style={styles.fieldLabel}>DNI/Nombre:</Text>
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
                        <TouchableOpacity style={styles.primaryAction} onPress={consultarReporte}>
                            <View style={[styles.actionSurface, styles.primaryActionSurface]}>
                                <View style={[styles.actionIconBadge, styles.primaryActionBadge]}>
                                    <MaterialCommunityIcons name="magnify" size={18} color="#2563eb" />
                                </View>
                                <Text style={styles.primaryActionText}>Buscar</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.newAction} activeOpacity={0.85}>
                            <View style={[styles.actionSurface, styles.newActionSurface]}>
                                <View style={[styles.actionIconBadge, styles.newActionBadge]}>
                                    <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#0f766e" />
                                </View>
                                <Text style={styles.newActionText}>Nuevo</Text>
                            </View>
                        </TouchableOpacity>

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

                <View style={styles.contentCard}>
                    <Text style={styles.contentTitle}>Listado de Asesores</Text>
                    {cargando && <ActivityIndicator size="large" color="#069488" style={styles.loader} />}

                    {!cargando && mensaje ? (
                        <View style={styles.messageBox}>
                            <Text style={styles.messageText}>{mensaje}</Text>
                        </View>
                    ) : null}

                    {!cargando && buscado && reporte.length > 0 ? (
                        <Text style={styles.resultCounter}>Resultados encontrados: {reporte.length}</Text>
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

                    {!cargando && reporte.length > 0 ? (
                        <View style={styles.tableWrapper}>
                            <View style={styles.tableTopAccent} />
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
                                                <Text style={styles.tableDataText} numberOfLines={2}>
                                                    {String(item[columna.key] ?? "-")}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                    <View style={styles.tableActionCell}>
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

export default ReporteAsesores;

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
import styles from "./ReporteAsesorStyles";
import { API_URL } from "../config/apiUrl";
import i18n from "../i18n";

// ATAMAINE: API_URL viene de config/apiUrl para que web use proxy CORS y movil use API real.

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

        const keys = ["d", "Data", "data", "result", "Resultado", "resultados", "Resultados"];
        for (const key of keys) {
            const value = (parsed as Record<string, unknown>)[key];
            if (Array.isArray(value)) {
                return value as ReporteItem[];
            }
            if (typeof value === "string") {
                const nested = JSON.parse(value);
                return Array.isArray(nested) ? nested : [];
            }
        }

        return [];
    } catch (error) {
        console.error("Error al parsear reporte:", error);
        return [];
    }
};

// ATAMAINE: Ajustamos las proporciones para que DNI, celular, correo y estado respiren mejor en pantallas pequeñas.
const COLUMNAS_REPORTE: Array<{
    key: keyof AsesorReporteItem;
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
// Función para normalizar los datos de asesores, asegurando que siempre haya un valor de texto y un formato consistente. 
//Según la base de datos
const separarNombreCompletoAsesor = (item: ReporteItem) => {
    const nombresApi = [item.Nombre1, item.Nombre2].filter(Boolean).join(" ").trim();
    const apellidosApi = [item.Apaterno, item.Amaterno].filter(Boolean).join(" ").trim();

    if (nombresApi || apellidosApi) {
        return {
            nombre: nombresApi || String(item.Nombre ?? "-"),
            apellidos: apellidosApi || String(item.Apellidos ?? "-"),
        };
    }

    // ATAMAINE: El endpoint de reporte filtrado puede devolver NombreCompleto; lo separamos para mostrar data completa.
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

const normalizarAsesores = (items: ReporteItem[]): AsesorReporteItem[] =>
    items.map((item) => {
        const nombreSeparado = separarNombreCompletoAsesor(item);

        return {
            DNI: String(item.DNI ?? "-"),
            Nombre: nombreSeparado.nombre,
            Apellidos: nombreSeparado.apellidos,
            Celular: String(item.Celular ?? "-"),
            Direccion: String(item.Direccion ?? "-"),
            Correo: String(item.Correo ?? "-"),
            Estado: normalizarEstado(item.Estado),
        };
    });

const esEstadoActivo = (estado: string) => estado.trim().toLowerCase() === "activo";

// ATAMAINE: Desde Ver abrimos el tab real de asesores y enviamos el DNI para resaltar la tarjeta correcta.
const abrirAsesorRegistrado = (navigation: any, item: AsesorReporteItem) => {
    navigation.navigate("MainTabs", {
        screen: i18n.t("btAsesor"),
        params: {
            asesorSeleccionadoDNI: item.DNI,
            asesorSeleccionadoNombre: `${item.Nombre} ${item.Apellidos}`.trim(),
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

const consultarAsesoresRegistrados = async (signal?: AbortSignal) => {
    const response = await fetch(`${API_URL}/Asesor/asesor_Listar`, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const rawData = await response.text();
    return normalizarAsesores(parseReporteResponse(rawData));
};

const ReporteAsesores = ({ navigation }: ReporteAsesorProps) => {
    const [datoBuscar, setDatoBuscar] = useState("");
    const [todosAsesores, setTodosAsesores] = useState<AsesorReporteItem[]>([]);
    const [reporte, setReporte] = useState<AsesorReporteItem[]>([]);
    const [cargando, setCargando] = useState(false);
    const [buscado, setBuscado] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [ultimoFiltro, setUltimoFiltro] = useState("");
    const [horaActual, setHoraActual] = useState(new Date());
    const fetchControllerRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<any>(null);



    useEffect(() => {
        const timer = setInterval(() => {
            setHoraActual(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const limpiarFiltro = async () => {
        setDatoBuscar("");
        setUltimoFiltro("");
        setMensaje("");
        setBuscado(false);

        try {
            setCargando(true);
            const asesoresBase = await consultarAsesoresRegistrados();
            setTodosAsesores(asesoresBase);
            setReporte(asesoresBase);
        } catch (error) {
            console.error("Error al recargar asesores al limpiar filtro:", error);
            setTodosAsesores([]);
            setReporte([]);
            setMensaje("No se pudo recargar la lista de asesores.");
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
    const asesorParaPdf = buscado && ultimoFiltro ? reporte : todosAsesores;
const cargarAsesoresIniciales = async () => {
    try {
        setCargando(true);
        setMensaje("");

        const asesoresBase = await consultarAsesoresRegistrados();
        setTodosAsesores(asesoresBase);
        setReporte(asesoresBase);
        setBuscado(false);
        setUltimoFiltro("");

        if (asesoresBase.length === 0) {
            setMensaje("No existen asesores registrados.");
        }

    } catch (error) {
        console.error("Error al cargar asesores registrados:", error);
        setTodosAsesores([]);
        setReporte([]);
        setMensaje("No se pudo cargar la lista de asesores.");
    } finally {
        setCargando(false);
    }
};

    useEffect(() => {
        cargarAsesoresIniciales();
    }, []);

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            consultarReporte(datoBuscar);
        }, 600);

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [datoBuscar]);

    useEffect(() => {
        let mounted = true;
        const refresh = async () => {
            try {
                const controller = new AbortController();
                fetchControllerRef.current = controller;

                if (buscado && ultimoFiltro) {
                    const response = await fetch(`${API_URL}/Reporte/reporte_Asesores/${encodeURIComponent(ultimoFiltro)}`, {
                        signal: controller.signal,
                    });
                    if (!response.ok) return;
                    const rawData = await response.text();
                    const filtrados = normalizarAsesores(parseReporteResponse(rawData));
                    if (!mounted) return;
                    setReporte(filtrados);
                    return;
                }

                const asesoresBase = await consultarAsesoresRegistrados(controller.signal);
                if (!mounted) return;
                setTodosAsesores(asesoresBase);
                if (!buscado) setReporte(asesoresBase);
            } catch (error) {
                // Refresco silencioso para mantener la pantalla viva sin interrumpir al usuario.
            }
        };

        refresh();
        const interval = setInterval(refresh, 15000);

        return () => {
            mounted = false;
            clearInterval(interval);
            if (fetchControllerRef.current) fetchControllerRef.current.abort();
        };
    }, [buscado, ultimoFiltro]);

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

            Alert.alert("Aviso", "Se abrió el panel de impresión. Si deseas descargar o compartir, usa la opción del sistema para guardar como PDF.");
        } catch (error) {
            console.error("Error al generar PDF:", error);
            Alert.alert("Error", "No se pudo generar el PDF del reporte.");
        }
    };


    // Función para consultar el reporte según el filtro ingresado
const consultarReporte = async (filtroParam?: string) => {
    const filtro = (filtroParam !== undefined ? filtroParam : datoBuscar).toString().trim();

    if (!filtro) {
        try {
            setCargando(true);
            setMensaje("");
            setUltimoFiltro("");
            const asesoresBase = await consultarAsesoresRegistrados();
            setTodosAsesores(asesoresBase);
            setReporte(asesoresBase);
            setBuscado(false);
            return;
        } catch (error) {
            console.error("Error al consultar lista completa de asesores:", error);
            setTodosAsesores([]);
            setReporte([]);
            setMensaje("No se pudo consultar la lista de asesores.");
        } finally {
            setCargando(false);
        }
    }

    try {
        setCargando(true);
        setMensaje("");
        setUltimoFiltro(filtro);
        if (fetchControllerRef.current) {
            try { fetchControllerRef.current.abort(); } catch (error) {}
        }
        fetchControllerRef.current = new AbortController();

        const response = await fetch(
            `${API_URL}/Reporte/reporte_Asesores/${encodeURIComponent(filtro)}`,
            {
                method: "GET",
                signal: fetchControllerRef.current.signal,
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
        if ((error as Error).name === "AbortError") {
            return;
        }
        console.error("Error al consultar reporte de asesores:", error);
        setReporte([]);
        setBuscado(true);
        setMensaje(
            "Error al consultar la API."
        );
    } finally {
        setCargando(false);
    }
};

    const listadoMostrar = buscado ? reporte : todosAsesores;


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
                    colors={["#0f766e", "#155e63", "#172554"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backButtonTouch} onPress={() => navigation.goBack()}>
                            {/* ATAMAINE: Boton de retorno con brillo suave para que combine con la cabecera premium. */}
                            <LinearGradient
                                colors={["rgba(255,255,255,0.34)", "rgba(255,255,255,0.12)"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.backButton}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
                            </LinearGradient>
                        </TouchableOpacity>
                        <View style={styles.heroContent}>
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveBadgeText}>Tiempo real {horaFormateada}</Text>
                            </View>
                            <Text style={styles.title}>Gestion Integral</Text>
                            <Text style={styles.title}>de Asesores</Text>
                            <Text style={styles.subtitle}>
                                Consulta asesores por DNI o nombre con datos reales en tiempo real.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Asesores Registrados</Text>
                            {cargando ? (
                                <ActivityIndicator size="small" color="#ffffff" style={{ marginVertical: 6 }} />
                            ) : (
                                <Text style={styles.statValue}>{Math.max(todosAsesores.length, reporte.length)}</Text>
                            )}
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
                        onSubmitEditing={() => consultarReporte()}
                    />

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.primaryAction} onPress={() => consultarReporte()}>
                            {/* ATAMAINE: Gradiente interno para que la accion principal se vea mas viva sin perder el color base. */}
                            <LinearGradient
                                colors={["#ffffff", "#edf5ff"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.actionSurface, styles.primaryActionSurface]}
                            >
                                <View style={[styles.actionIconBadge, styles.primaryActionBadge]}>
                                    <MaterialCommunityIcons name="magnify" size={18} color="#2563eb" />
                                </View>
                                <Text style={styles.primaryActionText}>Buscar</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.newAction}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate("RegistrarAsesor", { onRefresh: cargarAsesoresIniciales })}
                        >
                            {/* ATAMAINE: Gradiente verde suave para destacar el registro sin romper la paleta. */}
                            <LinearGradient
                                colors={["#ffffff", "#e8fff8"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.actionSurface, styles.newActionSurface]}
                            >
                                <View style={[styles.actionIconBadge, styles.newActionBadge]}>
                                    <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#0f766e" />
                                </View>
                                <Text style={styles.newActionText}>Nuevo</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.clearAction} onPress={limpiarFiltro}>
                            {/* ATAMAINE: Gradiente neutro para limpiar sin competir con buscar o nuevo. */}
                            <LinearGradient
                                colors={["#ffffff", "#f4f7fb"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.actionSurface, styles.clearActionSurface]}
                            >
                                <View style={[styles.actionIconBadge, styles.clearActionBadge]}>
                                    <MaterialCommunityIcons name="close-circle-outline" size={18} color="#64748b" />
                                </View>
                                <Text style={styles.clearActionText}>Limpiar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actionRowSecondary}>
                        <TouchableOpacity
                            style={[styles.secondaryAction, (!reporte.length || cargando) && styles.buttonDisabled]}
                            onPress={generarPDF}
                            disabled={!reporte.length || cargando}
                        >
                            {/* ATAMAINE: PDF mantiene el acento dorado con fondo radiante para lectura rapida. */}
                            <LinearGradient
                                colors={["#ffffff", "#fff7e6"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.actionSurface, styles.secondaryActionSurface]}
                            >
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
                    {cargando && <ActivityIndicator size="large" color="#069488" style={styles.loader} />}

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
                                            ) : (
                                                <Text
                                                    style={[
                                                        styles.tableDataText,
                                                        columna.key === "Celular" ? styles.tableDataTextTight : null,
                                                    ]}
                                                    numberOfLines={columna.key === "Celular" ? 1 : 2}
                                                    adjustsFontSizeToFit={columna.key === "Celular"}
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
                                            onPress={() => abrirAsesorRegistrado(navigation, item)}
                                        >
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

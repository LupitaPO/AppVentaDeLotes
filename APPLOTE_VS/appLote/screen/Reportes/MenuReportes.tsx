import {
        Animated,
        Easing,
        Platform,
        ScrollView,
        Text,
        TouchableOpacity,
        useWindowDimensions,
        View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./MenuReportesStyles";
import ReporteClientes from "./ReporteClientes";
import ReporteAsesores from "./ReporteAsesores";
import ReporteProyectos from "./ReporteProyectos";
import ReporteLotes from "./ReporteLotes";
import ReporteUsuarios from "./ReporteUsuarios";
import ReporteCobranzas from "./ReporteCobranzas";
import ReportePagos from "./ReportePagos";

type MenuReportesProps = {
        route?: any;
        navigation: any;
};

type TipoReporte = "clientes" | "asesores" | "proyectos" | "lotes" | "usuarios" | "cobranzas" | "pagos";
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const REPORTES: Array<{
        tipo: TipoReporte;
        ruta: string;
        titulo: string;
        descripcion: string;
        etiqueta: string;
        puntos: string[];
        estado: "EN VIVO" | "ACTIVO";
        icono: keyof typeof MaterialCommunityIcons.glyphMap;
        iconoAnalisis: keyof typeof MaterialCommunityIcons.glyphMap;
        iconoHero: keyof typeof MaterialCommunityIcons.glyphMap;
        colores: [string, string, string];
        acento: string;
        acentoSuave: string;
}> = [
                {
                        tipo: "clientes",
                        ruta: "ReporteClientes",
                        titulo: "Reporte de Clientes",
                        descripcion: "Analisis inteligente, estadisticas y seguimiento de clientes registrados.",
                        etiqueta: "Analisis CRM",
                        puntos: ["Consulta por DNI o nombre", "Estadisticas en tiempo real", "Reporte detallado en PDF", "Seguimiento CRM"],
                        estado: "EN VIVO",
                        icono: "account-group",
                        iconoAnalisis: "chart-areaspline",
                        iconoHero: "account-group",
                        colores: ["#021318", "#04282c", "#063b3f"],
                        acento: "#16f3de",
                        acentoSuave: "rgba(20, 255, 230, 0.17)",
                },
                {
                        tipo: "asesores",
                        ruta: "ReporteAsesores",
                        titulo: "Reporte de Asesores",
                        descripcion: "Visualiza rendimiento, estadisticas y analisis de asesores registrados.",
                        etiqueta: "Analisis",
                        puntos: ["Rendimiento de asesores", "Estadisticas de ventas", "Analisis comparativo", "Reporte personalizado"],
                        estado: "ACTIVO",
                        icono: "account-tie",
                        iconoAnalisis: "chart-line",
                        iconoHero: "account-tie",
                        colores: ["#100622", "#1d0e4d", "#331076"],
                        acento: "#9b5cff",
                        acentoSuave: "rgba(155, 92, 255, 0.18)",
                },
                {
                        tipo: "proyectos",
                        ruta: "ReporteProyectos",
                        titulo: "Reporte de Proyectos",
                        descripcion: "Seguimiento, estadisticas y analisis inteligente de proyectos registrados.",
                        etiqueta: "Analisis de Proyectos",
                        puntos: ["Proyectos en curso", "Proyectos finalizados", "Avance y seguimiento", "Reporte ejecutivo"],
                        estado: "ACTIVO",
                        icono: "briefcase-check",
                        iconoAnalisis: "chart-timeline-variant",
                        iconoHero: "clipboard-check",
                        colores: ["#031128", "#092a62", "#0a469e"],
                        acento: "#1f8fff",
                        acentoSuave: "rgba(31, 143, 255, 0.18)",
                },
                {
                        tipo: "lotes",
                        ruta: "ReporteLotes",
                        titulo: "Reporte de Terrenos",
                        descripcion: "Control, ubicacion y analisis de terrenos y lotes disponibles.",
                        etiqueta: "Analisis de Terrenos",
                        puntos: ["Terrenos disponibles", "Estado de lotes", "Ubicacion en mapa", "Reporte en PDF"],
                        estado: "EN VIVO",
                        icono: "map-marker",
                        iconoAnalisis: "chart-timeline-variant-shimmer",
                        iconoHero: "map-marker-radius",
                        colores: ["#03170d", "#063c1f", "#075b31"],
                        acento: "#2cff86",
                        acentoSuave: "rgba(44, 255, 134, 0.17)",
                },
                {
                        tipo: "cobranzas",
                        ruta: "ReporteCobranzas",
                        titulo: "Reporte de Cobranzas",
                        descripcion: "Controla ventas, pagos, saldos pendientes y filtros de cobranza en tiempo real.",
                        etiqueta: "Analisis de Cobros",
                        puntos: ["Cobros pendientes", "Saldos por venta", "Seguimiento de pagos", "Reporte financiero"],
                        estado: "EN VIVO",
                        icono: "cash-multiple",
                        iconoAnalisis: "chart-donut",
                        iconoHero: "cash-check",
                        colores: ["#061326", "#0a3143", "#0d5b61"],
                        acento: "#27f5c4",
                        acentoSuave: "rgba(39, 245, 196, 0.18)",
                },
                {
                        tipo: "pagos",
                        ruta: "ReportePagos",
                        titulo: "Reporte de Pagos",
                        descripcion: "Consulta pagos por estado, venta y fechas con datos reales en tiempo real.",
                        etiqueta: "Analisis de Pagos",
                        puntos: ["Pagos registrados", "Estados de pago", "Busqueda por venta", "Exportacion PDF"],
                        estado: "EN VIVO",
                        icono: "credit-card-check",
                        iconoAnalisis: "chart-donut-variant",
                        iconoHero: "cash-fast",
                        colores: ["#071a22", "#0b3b46", "#0e6670"],
                        acento: "#2ef5d0",
                        acentoSuave: "rgba(46, 245, 208, 0.18)",
                },
                {
                        tipo: "usuarios",
                        ruta: "ReporteUsuarios",
                        titulo: "Reporte de Usuarios",
                        descripcion: "Controla usuarios, roles y estados registrados en el sistema.",
                        etiqueta: "Analisis de Usuarios",
                        puntos: ["Usuarios activos", "Roles del sistema", "Estados registrados", "Control operativo"],
                        estado: "ACTIVO",
                        icono: "account-cog",
                        iconoAnalisis: "shield-account",
                        iconoHero: "account-cog",
                        colores: ["#211605", "#5b4108", "#775106"],
                        acento: "#f7b731",
                        acentoSuave: "rgba(247, 183, 49, 0.18)",
                },
        ];

const MenuReportes = ({ route, navigation }: MenuReportesProps) => {
        const { width } = useWindowDimensions();
        const esPantallaPc = width >= 900;
        const [reporteWeb, setReporteWeb] = useState<TipoReporte | null>(null);
        const [horaActual, setHoraActual] = useState(new Date());
        const giroMundo = useRef(new Animated.Value(0)).current;

        // ATAMAINE: Parametros originales del usuario se preservan para que las rutas sigan funcionando.
        const { rol, nombre, idUsuario } = route?.params || {
                rol: "Usuario",
                nombre: "Admin",
                idUsuario: 0,
        };

        useEffect(() => {
                const timer = setInterval(() => {
                        setHoraActual(new Date());
                }, 1000);

                return () => clearInterval(timer);
        }, []);

        // ATAMAINE: Animacion del panel en vivo para mantener movimiento sin tocar rutas ni APIs.
        useEffect(() => {
                Animated.loop(
                        Animated.timing(giroMundo, {
                                toValue: 1,
                                duration: 5200,
                                easing: Easing.linear,
                                useNativeDriver: true,
                        }),
                ).start();
        }, [giroMundo]);

        const rotacionMundo = giroMundo.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
        });
        const horaFormateada = horaActual.toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
        });
        const fechaPanel = `${String(horaActual.getDate()).padStart(2, "0")} ${MESES_CORTOS[horaActual.getMonth()]} ${horaActual.getFullYear()}`;
        const reportesEnVivo = REPORTES.filter((reporte) => reporte.estado === "EN VIVO").length;
        const reportesActivos = REPORTES.length - reportesEnVivo;
        const resumenCards: Array<{
                titulo: string;
                valor: string | number;
                detalle: string;
                icono: keyof typeof MaterialCommunityIcons.glyphMap;
                acento: string;
                fondo: string;
        }> = [
                        {
                                titulo: "REPORTES",
                                valor: REPORTES.length,
                                detalle: "Totales",
                                icono: "view-dashboard-outline",
                                acento: "#16f3de",
                                fondo: "rgba(22, 243, 222, 0.18)",
                        },
                        {
                                titulo: "EN VIVO",
                                valor: reportesEnVivo,
                                detalle: "Tiempo real",
                                icono: "check-decagram",
                                acento: "#2cff86",
                                fondo: "rgba(44, 255, 134, 0.18)",
                        },
                        {
                                titulo: "ACTIVOS",
                                valor: reportesActivos,
                                detalle: "Listos",
                                icono: "account-check",
                                acento: "#ff5c8a",
                                fondo: "rgba(255, 92, 138, 0.18)",
                        },
                        {
                                titulo: "ULTIMA ACTUALIZACION",
                                valor: fechaPanel,
                                detalle: horaFormateada,
                                icono: "clock-time-four-outline",
                                acento: "#1f8fff",
                                fondo: "rgba(31, 143, 255, 0.18)",
                        },
                ];

        const navigationReporteWeb = {
                ...navigation,
                goBack: () => setReporteWeb(null),
                navigate: (...args: any[]) => navigation.navigate(...args),
        };

        // ATAMAINE: En web renderizamos el reporte embebido para evitar pantallas blancas del Stack.
        if (Platform.OS === "web" && reporteWeb === "clientes") {
                return <View style={styles.webReporteContainer}><ReporteClientes navigation={navigationReporteWeb} /></View>;
        }

        if (Platform.OS === "web" && reporteWeb === "asesores") {
                return <View style={styles.webReporteContainer}><ReporteAsesores navigation={navigationReporteWeb} /></View>;
        }

        if (Platform.OS === "web" && reporteWeb === "proyectos") {
                return <View style={styles.webReporteContainer}><ReporteProyectos navigation={navigationReporteWeb} /></View>;
        }

        if (Platform.OS === "web" && reporteWeb === "lotes") {
                return <View style={styles.webReporteContainer}><ReporteLotes navigation={navigationReporteWeb} /></View>;
        }

        if (Platform.OS === "web" && reporteWeb === "usuarios") {
                return <View style={styles.webReporteContainer}><ReporteUsuarios navigation={navigationReporteWeb} /></View>;
        }

        if (Platform.OS === "web" && reporteWeb === "cobranzas") {
                return <View style={styles.webReporteContainer}><ReporteCobranzas navigation={navigationReporteWeb} /></View>;
        }

        if (Platform.OS === "web" && reporteWeb === "pagos") {
                return <View style={styles.webReporteContainer}><ReportePagos navigation={navigationReporteWeb} /></View>;
        }

        const abrirReporte = (tipo: TipoReporte, ruta: string) => {
                if (Platform.OS === "web") {
                        setReporteWeb(tipo);
                        return;
                }

                navigation.navigate(ruta, {
                        rol,
                        nombre,
                        idUsuario,
                });
        };

        return (
                <View style={styles.container}>
                        <View style={styles.backgroundGlowTop} />
                        <View style={styles.backgroundGlowMid} />
                        <View style={styles.backgroundGlowBottom} />

                        <ScrollView
                                style={styles.scrollView}
                                contentContainerStyle={[
                                        styles.scrollContent,
                                        esPantallaPc && styles.scrollContentDesktop,
                                ]}
                                showsVerticalScrollIndicator={false}
                        >
                                <View style={styles.topShell}>
                                        <TouchableOpacity activeOpacity={0.86} style={[styles.menuButton, esPantallaPc && styles.menuButtonWeb]} onPress={() => navigation.goBack()} accessibilityLabel="Regresar">
                                                <MaterialCommunityIcons name="arrow-left" size={26} color="#c8fffb" />
                                                {esPantallaPc ? <Text style={styles.menuButtonText}>Regresar</Text> : null}
                                        </TouchableOpacity>

                                        <View style={styles.greetingBlock}>
                                                <Text style={styles.greetingText}>
                                                        Hola, <Text style={styles.greetingName}>{nombre || "Admin"}</Text> <Text style={styles.waveText}>👋</Text>
                                                </Text>
                                                <Text style={styles.greetingSubText}>Selecciona el tipo de reporte que deseas generar</Text>
                                        </View>

                                        <TouchableOpacity activeOpacity={0.9} style={styles.serverButton}>
                                                <View style={styles.serverPulseWrap}>
                                                        <Animated.View style={[styles.serverPulseRing, { transform: [{ rotate: rotacionMundo }] }]} />
                                                        <MaterialCommunityIcons name="pulse" size={22} color="#24ffec" />
                                                </View>
                                                <View style={styles.serverCopy}>
                                                        <View style={styles.serverLiveRow}>
                                                                <View style={styles.serverDot} />
                                                                <Text style={styles.serverLiveText}>EN VIVO</Text>
                                                        </View>
                                                        <Text style={styles.serverTitle}>Servidor</Text>
                                                        <Text style={styles.serverCode}>ES</Text>
                                                </View>
                                                <MaterialCommunityIcons name="chevron-down" size={22} color="#9ad3dc" />
                                        </TouchableOpacity>
                                </View>

                                <View style={styles.summaryGrid}>
                                        {resumenCards.map((card) => (
                                                <View key={card.titulo} style={styles.summaryCard}>
                                                        <View style={[styles.summaryIconWrap, { backgroundColor: card.fondo, borderColor: card.acento }]}>
                                                                <MaterialCommunityIcons name={card.icono} size={22} color={card.acento} />
                                                        </View>
                                                        <View style={styles.summaryCopy}>
                                                                <Text style={styles.summaryTitle}>{card.titulo}</Text>
                                                                <Text
                                                                        style={[
                                                                                styles.summaryValue,
                                                                                typeof card.valor === "string" ? styles.summaryValueSmall : null,
                                                                        ]}
                                                                        numberOfLines={2}
                                                                        adjustsFontSizeToFit
                                                                        minimumFontScale={0.7}
                                                                >
                                                                        {card.valor}
                                                                </Text>
                                                                <Text style={[styles.summaryDetail, { color: card.acento }]}>{card.detalle}</Text>
                                                        </View>
                                                </View>
                                        ))}
                                </View>

                                <View style={[styles.reportCardsContainer, esPantallaPc && styles.reportCardsContainerDesktop]}>
                                        {REPORTES.map((reporte) => (
                                                <TouchableOpacity
                                                        key={reporte.tipo}
                                                        activeOpacity={0.92}
                                                        style={[styles.reportCardPressable, esPantallaPc && styles.reportCardPressableDesktop]}
                                                        onPress={() => abrirReporte(reporte.tipo, reporte.ruta)}
                                                >
                                                        <LinearGradient
                                                                colors={reporte.colores}
                                                                start={{ x: 0, y: 0 }}
                                                                end={{ x: 1, y: 1 }}
                                                                style={[
                                                                        styles.reportCard,
                                                                        !esPantallaPc && styles.reportCardMobile,
                                                                        {
                                                                                borderColor: reporte.acento,
                                                                                shadowColor: reporte.acento,
                                                                        },
                                                                ]}
                                                        >
                                                                <View style={[styles.cardHalo, { backgroundColor: reporte.acentoSuave }]} />
                                                                <View style={[styles.cardGhostOrbOne, { backgroundColor: reporte.acentoSuave }]} />
                                                                <View style={[styles.cardGhostOrbTwo, { backgroundColor: reporte.acentoSuave }]} />
                                                                <View style={[styles.cardNoiseLine, { backgroundColor: reporte.acento }]} />

                                                                <View style={[styles.statusBadge, { backgroundColor: reporte.acentoSuave, borderColor: reporte.acento }]}>
                                                                        <View style={[styles.statusDot, { backgroundColor: reporte.acento }]} />
                                                                        <Text style={[styles.statusText, { color: reporte.acento }]}>{reporte.estado}</Text>
                                                                </View>

                                                                <View style={styles.cardMainRow}>
                                                                        <View style={[styles.cardIconStage, { borderColor: reporte.acento, shadowColor: reporte.acento }]}>
                                                                                <View style={[styles.cardIconOuterGlow, { borderColor: reporte.acento }]} />
                                                                                <View style={[styles.cardIconBubble, { backgroundColor: reporte.acentoSuave, borderColor: reporte.acento }]}>
                                                                                        <MaterialCommunityIcons name={reporte.icono} size={52} color={reporte.acento} />
                                                                                </View>
                                                                        </View>

                                                                        <View style={styles.cardTextBlock}>
                                                                                <Text style={styles.reportCardTitle}>{reporte.titulo}</Text>
                                                                                <Text style={styles.reportCardDescription}>{reporte.descripcion}</Text>
                                                                                <View style={styles.cardPoints}>
                                                                                        {reporte.puntos.map((punto) => (
                                                                                                <View key={punto} style={styles.cardPointRow}>
                                                                                                        <MaterialCommunityIcons name="check-circle-outline" size={13} color={reporte.acento} />
                                                                                                        <Text style={styles.cardPointText}>{punto}</Text>
                                                                                                </View>
                                                                                        ))}
                                                                                </View>
                                                                        </View>

                                                                        <View style={styles.cardGhostArea}>
                                                                                <MaterialCommunityIcons name={reporte.iconoHero} size={108} color={reporte.acento} style={styles.visualIcon} />
                                                                                <TouchableOpacity
                                                                                        activeOpacity={0.8}
                                                                                        style={[styles.arrowButton, { borderColor: reporte.acento, shadowColor: reporte.acento }]}
                                                                                        onPress={() => abrirReporte(reporte.tipo, reporte.ruta)}
                                                                                >
                                                                                        <MaterialCommunityIcons name="arrow-right" size={34} color="#ffffff" />
                                                                                </TouchableOpacity>
                                                                        </View>
                                                                </View>

                                                                <View style={[styles.cardFooterMini, { borderColor: reporte.acento, backgroundColor: reporte.acentoSuave }]}>
                                                                        <MaterialCommunityIcons name={reporte.iconoAnalisis} size={15} color={reporte.acento} />
                                                                        <Text style={[styles.cardAnalyticsText, { color: reporte.acento }]}>{reporte.etiqueta}</Text>
                                                                </View>
                                                        </LinearGradient>
                                                </TouchableOpacity>
                                        ))}
                                </View>
                        </ScrollView>

                </View>
        );
};

export default MenuReportes;

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

type MenuReportesProps = {
        route?: any;
        navigation: any;
};

type TipoReporte = "clientes" | "asesores" | "proyectos" | "lotes" | "usuarios";

const REPORTES: Array<{
        tipo: TipoReporte;
        ruta: string;
        titulo: string;
        descripcion: string;
        etiqueta: string;
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
                estado: "EN VIVO",
                icono: "account-group",
                iconoAnalisis: "chart-areaspline",
                iconoHero: "account-group",
                colores: ["#02191d", "#053c3d", "#073c48"],
                acento: "#16f3de",
                acentoSuave: "rgba(20, 255, 230, 0.17)",
        },
        {
                tipo: "asesores",
                ruta: "ReporteAsesores",
                titulo: "Reporte de Asesores",
                descripcion: "Visualiza rendimiento, estadisticas y analisis de asesores registrados.",
                etiqueta: "Analisis",
                estado: "ACTIVO",
                icono: "account-tie",
                iconoAnalisis: "chart-line",
                iconoHero: "account-tie",
                colores: ["#120b2e", "#21155a", "#301b78"],
                acento: "#9b5cff",
                acentoSuave: "rgba(155, 92, 255, 0.18)",
        },
        {
                tipo: "proyectos",
                ruta: "ReporteProyectos",
                titulo: "Reporte de Proyectos",
                descripcion: "Seguimiento, estadisticas y analisis inteligente de proyectos registrados.",
                etiqueta: "Analisis de Proyectos",
                estado: "ACTIVO",
                icono: "briefcase-check",
                iconoAnalisis: "chart-timeline-variant",
                iconoHero: "clipboard-check",
                colores: ["#061326", "#0a2854", "#0b3b8f"],
                acento: "#1f8fff",
                acentoSuave: "rgba(31, 143, 255, 0.18)",
        },
        {
                tipo: "lotes",
                ruta: "ReporteLotes",
                titulo: "Reporte de Lotes",
                descripcion: "Monitorea la disponibilidad, ventas y estado de tus lotes en tiempo real.",
                etiqueta: "Analisis de Lotes",
                estado: "EN VIVO",
                icono: "map-marker",
                iconoAnalisis: "chart-timeline-variant-shimmer",
                iconoHero: "map-marker-radius",
                colores: ["#03180e", "#064526", "#075f34"],
                acento: "#2cff86",
                acentoSuave: "rgba(44, 255, 134, 0.17)",
        },
        {
                tipo: "usuarios",
                ruta: "ReporteUsuarios",
                titulo: "Reporte de Usuarios",
                descripcion: "Controla usuarios, roles y estados registrados en el sistema.",
                etiqueta: "Analisis de Usuarios",
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
        const giroMundo = useRef(new Animated.Value(0)).current;

        // ATAMAINE: Parametros originales del usuario se preservan para que las rutas sigan funcionando.
        const { rol, nombre, idUsuario } = route?.params || {
                rol: "Usuario",
                nombre: "Admin",
                idUsuario: 0,
        };

        // ATAMAINE: Animacion del traductor para imitar el mundo girando del diseno premium.
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
                                        <TouchableOpacity activeOpacity={0.86} style={styles.menuButton} onPress={() => navigation.goBack()}>
                                                {/* ATAMAINE: Boton neon superior mantiene regreso real y apariencia del mockup. */}
                                                <MaterialCommunityIcons name="menu" size={34} color="#b9fffb" />
                                        </TouchableOpacity>

                                        <View style={styles.greetingBlock}>
                                                <Text style={styles.greetingText}>
                                                        Hola, <Text style={styles.greetingName}>{nombre || "Admin"}</Text> <Text style={styles.waveText}>👋</Text>
                                                </Text>
                                                <Text style={styles.greetingSubText}>Selecciona el tipo de reporte que deseas generar</Text>
                                        </View>

                                        <TouchableOpacity activeOpacity={0.9} style={styles.translatorButton}>
                                                <View style={styles.translatorGlow} />
                                                <View style={styles.translatorWorldGroup}>
                                                        <View style={styles.translatorBackPlate}>
                                                                <Text style={styles.translatorBackPlateText}>TR</Text>
                                                        </View>
                                                        <Animated.View style={[styles.translatorIconWrap, { transform: [{ rotate: rotacionMundo }] }]}>
                                                                {/* ATAMAINE: Mundo con capas de color para que el traductor se vea premium y vivo. */}
                                                                <LinearGradient
                                                                        colors={["#38f8ff", "#22c55e", "#2563eb"]}
                                                                        start={{ x: 0, y: 0 }}
                                                                        end={{ x: 1, y: 1 }}
                                                                        style={styles.translatorIconGradient}
                                                                >
                                                                        <MaterialCommunityIcons name="earth" size={24} color="#efffff" />
                                                                </LinearGradient>
                                                        </Animated.View>
                                                </View>
                                                <View style={styles.translatorCopy}>
                                                        <Text style={styles.translatorText}>Traductor</Text>
                                                        <Text style={styles.translatorCode}>ES</Text>
                                                </View>
                                                <MaterialCommunityIcons name="chevron-down" size={26} color="#5f8798" />
                                        </TouchableOpacity>
                                </View>

                                <View style={styles.reportCardsContainer}>
                                        {REPORTES.map((reporte) => (
                                                <TouchableOpacity
                                                        key={reporte.tipo}
                                                        activeOpacity={0.92}
                                                        style={styles.reportCardPressable}
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
                                                                <View style={[styles.cardNoiseLine, { backgroundColor: reporte.acento }]} />

                                                                <View style={[styles.cardLeft, !esPantallaPc && styles.cardLeftMobile]}>
                                                                        <View style={[styles.cardIconBubble, { backgroundColor: reporte.acentoSuave, borderColor: reporte.acento }]}>
                                                                                <MaterialCommunityIcons name={reporte.icono} size={34} color={reporte.acento} />
                                                                        </View>

                                                                        <View style={styles.cardTextBlock}>
                                                                                <Text style={styles.reportCardTitle}>{reporte.titulo}</Text>
                                                                                <Text style={styles.reportCardDescription}>{reporte.descripcion}</Text>
                                                                        </View>

                                                                        <View style={styles.cardFooterMini}>
                                                                                <MaterialCommunityIcons name={reporte.iconoAnalisis} size={20} color={reporte.acento} />
                                                                                <Text style={[styles.cardAnalyticsText, { color: reporte.acento }]}>{reporte.etiqueta}</Text>
                                                                        </View>
                                                                </View>

                                                                <View style={[styles.cardRight, !esPantallaPc && styles.cardRightMobile]}>
                                                                        <View style={[styles.statusBadge, { backgroundColor: reporte.acentoSuave }]}>
                                                                                <View style={[styles.statusDot, { backgroundColor: reporte.acento }]} />
                                                                                <Text style={[styles.statusText, { color: reporte.acento }]}>{reporte.estado}</Text>
                                                                        </View>

                                                                        {/* ATAMAINE: Figura central tipo 3D hecha con iconos y capas nativas, sin tocar assets ni API. */}
                                                                        <View style={[styles.visualStage, !esPantallaPc && styles.visualStageMobile]}>
                                                                                <View style={[styles.visualPlatform, { borderColor: reporte.acento, backgroundColor: reporte.acentoSuave }]} />
                                                                                <View style={[styles.visualOrb, { backgroundColor: reporte.acentoSuave }]} />
                                                                                <MaterialCommunityIcons name={reporte.iconoHero} size={86} color={reporte.acento} style={styles.visualIcon} />
                                                                        </View>

                                                                        <View style={[styles.arrowButton, { backgroundColor: reporte.acentoSuave }]}>
                                                                                <MaterialCommunityIcons name="arrow-top-right" size={34} color="#ffffff" />
                                                                        </View>
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

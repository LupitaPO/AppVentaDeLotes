import { StyleSheet } from "react-native";

export default StyleSheet.create({
        container: {
                flex: 1,
                height: "100vh" as any,
                backgroundColor: "#020b13",
                position: "relative",
                overflow: "hidden",
        },

        scrollView: {
                flex: 1,
                width: "100%",
                height: "100vh" as any,
                maxHeight: "100vh" as any,
                overflow: "scroll",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
        } as any,

        scrollContent: {
                flexGrow: 0,
                width: "100%",
                maxWidth: 840,
                alignSelf: "center",
                paddingTop: 18,
                paddingHorizontal: 14,
                paddingBottom: 26,
        },

        scrollContentDesktop: {
                maxWidth: 920,
        },

        backgroundGlowTop: {
                position: "absolute",
                top: -160,
                left: -130,
                width: 360,
                height: 360,
                borderRadius: 180,
                backgroundColor: "rgba(0, 245, 220, 0.10)",
        },

        backgroundGlowMid: {
                position: "absolute",
                top: 330,
                right: -160,
                width: 420,
                height: 420,
                borderRadius: 210,
                backgroundColor: "rgba(31, 143, 255, 0.09)",
        },

        backgroundGlowBottom: {
                position: "absolute",
                bottom: -150,
                left: -110,
                width: 330,
                height: 330,
                borderRadius: 165,
                backgroundColor: "rgba(44, 255, 134, 0.08)",
        },

        topShell: {
                flexDirection: "row",
                alignItems: "center",
                gap: 9,
                height: 68,
                maxHeight: 68,
                marginBottom: 18,
                paddingVertical: 0,
                paddingHorizontal: 0,
        },

        menuButton: {
                width: 46,
                height: 46,
                borderRadius: 23,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(13, 58, 68, 0.76)",
                borderWidth: 1,
                borderColor: "rgba(24, 245, 223, 0.68)",
                shadowColor: "#18f5df",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.52,
                shadowRadius: 22,
                elevation: 14,
        },

        greetingBlock: {
                flex: 1,
                flexShrink: 1,
                minWidth: 0,
        },

        greetingText: {
                color: "#f8fbff",
                fontSize: 17,
                fontWeight: "400",
                letterSpacing: 0,
        },

        greetingName: {
                color: "#ffffff",
                fontWeight: "900",
        },

        waveText: {
                fontSize: 16,
        },

        greetingSubText: {
                marginTop: 3,
                color: "#98a9b9",
                fontSize: 10.5,
                fontWeight: "600",
                lineHeight: 14,
        },

        translatorButton: {
                width: 122,
                minHeight: 50,
                borderRadius: 24,
                paddingHorizontal: 8,
                flexShrink: 0,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                backgroundColor: "rgba(4, 32, 45, 0.88)",
                borderWidth: 1,
                borderColor: "rgba(56, 248, 255, 0.72)",
                shadowColor: "#18f5df",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.62,
                shadowRadius: 20,
                elevation: 12,
                overflow: "hidden",
                position: "relative",
        },

        // ATAMAINE: Resplandor interno del traductor para darle efecto de cristal neon.
        translatorGlow: {
                position: "absolute",
                left: -18,
                top: -22,
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: "rgba(56, 248, 255, 0.20)",
        },

        translatorIconWrap: {
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.12)",
                shadowColor: "#38f8ff",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.72,
                shadowRadius: 12,
                elevation: 8,
        },

        // ATAMAINE: Grupo del mundo con una placa trasera que representa la palabra Traductor mientras gira.
        translatorWorldGroup: {
                width: 42,
                height: 40,
                justifyContent: "center",
                alignItems: "flex-start",
        },

        translatorBackPlate: {
                position: "absolute",
                left: 9,
                width: 30,
                height: 22,
                borderRadius: 11,
                backgroundColor: "rgba(24, 245, 223, 0.18)",
                borderWidth: 1,
                borderColor: "rgba(56, 248, 255, 0.36)",
                justifyContent: "center",
                alignItems: "flex-end",
                paddingRight: 6,
        },

        translatorBackPlateText: {
                color: "#bffcff",
                fontSize: 8,
                fontWeight: "900",
                letterSpacing: 0.8,
        },

        translatorIconGradient: {
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.32)",
        },

        translatorCopy: {
                flex: 1,
        },

        translatorText: {
                color: "#ffffff",
                fontSize: 8.5,
                fontWeight: "900",
        },

        translatorCode: {
                color: "#ffffff",
                fontSize: 15,
                fontWeight: "900",
                lineHeight: 17,
        },

        reportCardsContainer: {
                gap: 16,
        },

        reportCardPressable: {
                width: "100%",
        },

        reportCard: {
                minHeight: 214,
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                position: "relative",
                overflow: "hidden",
                flexDirection: "row",
                justifyContent: "space-between",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.45,
                shadowRadius: 18,
                elevation: 12,
        },

        // ATAMAINE: En movil la tarjeta se ordena en columnas superpuestas para evitar texto cortado.
        reportCardMobile: {
                minHeight: 220,
                padding: 18,
        },

        cardHalo: {
                position: "absolute",
                right: -90,
                top: -80,
                width: 260,
                height: 260,
                borderRadius: 130,
        },

        cardNoiseLine: {
                position: "absolute",
                left: 26,
                right: 26,
                top: 0,
                height: 1,
                opacity: 0.42,
        },

        cardLeft: {
                flex: 1,
                minWidth: 0,
                justifyContent: "space-between",
                paddingRight: 14,
        },

        cardLeftMobile: {
                paddingRight: 0,
                maxWidth: "64%" as any,
                zIndex: 2,
        },

        cardRight: {
                width: 230,
                alignItems: "flex-end",
                justifyContent: "space-between",
        },

        cardRightMobile: {
                position: "absolute",
                top: 18,
                right: 14,
                bottom: 18,
                width: "44%" as any,
                zIndex: 1,
        },

        cardIconBubble: {
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.28,
                shadowRadius: 16,
                elevation: 8,
        },

        cardTextBlock: {
                marginTop: 26,
        },

        reportCardTitle: {
                color: "#ffffff",
                fontSize: 22,
                fontWeight: "900",
                lineHeight: 27,
                marginBottom: 10,
                letterSpacing: 0,
        },

        reportCardDescription: {
                color: "#bac7d4",
                fontSize: 14,
                fontWeight: "500",
                lineHeight: 20,
                maxWidth: 260,
        },

        cardFooterMini: {
                marginTop: 18,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
        },

        cardAnalyticsText: {
                fontSize: 13,
                fontWeight: "900",
        },

        statusBadge: {
                minHeight: 35,
                paddingHorizontal: 12,
                borderRadius: 18,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
        },

        statusDot: {
                width: 9,
                height: 9,
                borderRadius: 5,
        },

        statusText: {
                fontSize: 12,
                fontWeight: "900",
        },

        visualStage: {
                width: 178,
                height: 112,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 10,
        },

        visualStageMobile: {
                width: 126,
                height: 94,
                marginTop: 22,
                alignSelf: "center",
        },

        visualPlatform: {
                position: "absolute",
                bottom: 14,
                width: 118,
                height: 50,
                borderRadius: 28,
                borderWidth: 1,
                transform: [{ skewX: "-16deg" }],
                opacity: 0.78,
        },

        visualOrb: {
                position: "absolute",
                width: 112,
                height: 112,
                borderRadius: 56,
                opacity: 0.6,
        },

        visualIcon: {
                textShadowColor: "rgba(255,255,255,0.22)" as any,
                textShadowOffset: { width: 0, height: 0 } as any,
                textShadowRadius: 18 as any,
        },

        arrowButton: {
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
        },

        webReporteContainer: {
                flex: 1,
                width: "100%",
                height: "100vh" as any,
                maxHeight: "100vh" as any,
                minHeight: 720,
                backgroundColor: "#eaf8fb",
                overflow: "hidden",
        },
});

import { StyleSheet } from "react-native";

export default StyleSheet.create({
        container: {
                flex: 1,
                height: "100vh" as any,
                backgroundColor: "#020811",
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
                maxWidth: 820,
                alignSelf: "center",
                paddingTop: 16,
                paddingHorizontal: 12,
                paddingBottom: 26,
                gap: 14,
        },

        scrollContentDesktop: {
                maxWidth: 900,
        },

        backgroundGlowTop: {
                position: "absolute",
                top: -170,
                left: -130,
                width: 360,
                height: 360,
                borderRadius: 180,
                backgroundColor: "rgba(22, 243, 222, 0.11)",
        },

        backgroundGlowMid: {
                position: "absolute",
                top: 310,
                right: -180,
                width: 420,
                height: 420,
                borderRadius: 210,
                backgroundColor: "rgba(31, 143, 255, 0.10)",
        },

        backgroundGlowBottom: {
                position: "absolute",
                bottom: -150,
                left: -120,
                width: 340,
                height: 340,
                borderRadius: 170,
                backgroundColor: "rgba(44, 255, 134, 0.08)",
        },

        topShell: {
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                minHeight: 66,
        },

        menuButton: {
                width: 50,
                height: 50,
                borderRadius: 25,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(5, 35, 47, 0.92)",
                borderWidth: 1,
                borderColor: "rgba(22, 243, 222, 0.75)",
                shadowColor: "#16f3de",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.48,
                shadowRadius: 22,
                elevation: 14,
        },

        greetingBlock: {
                flex: 1,
                flexShrink: 1,
                minWidth: 0,
        },

        greetingText: {
                color: "#f7fbff",
                fontSize: 18,
                fontWeight: "600",
                letterSpacing: 0,
        },

        greetingName: {
                color: "#16f3de",
                fontWeight: "900",
        },

        waveText: {
                fontSize: 17,
        },

        greetingSubText: {
                marginTop: 3,
                color: "#9fb1c3",
                fontSize: 11,
                fontWeight: "700",
                lineHeight: 15,
        },

        serverButton: {
                width: 132,
                minHeight: 58,
                borderRadius: 29,
                paddingHorizontal: 8,
                flexShrink: 0,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "rgba(4, 25, 36, 0.94)",
                borderWidth: 1,
                borderColor: "rgba(22, 243, 222, 0.72)",
                shadowColor: "#16f3de",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.56,
                shadowRadius: 22,
                elevation: 12,
                overflow: "hidden",
        },

        serverPulseWrap: {
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(22, 243, 222, 0.09)",
        },

        serverPulseRing: {
                position: "absolute",
                width: 42,
                height: 42,
                borderRadius: 21,
                borderWidth: 1,
                borderColor: "rgba(36, 255, 236, 0.82)",
                borderStyle: "dashed",
        },

        serverCopy: {
                flex: 1,
                minWidth: 0,
        },

        serverLiveRow: {
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
        },

        serverDot: {
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#24ffec",
        },

        serverLiveText: {
                color: "#24ffec",
                fontSize: 8.5,
                fontWeight: "900",
        },

        serverTitle: {
                color: "#d7e6ef",
                fontSize: 10,
                fontWeight: "800",
                marginTop: 2,
        },

        serverCode: {
                color: "#ffffff",
                fontSize: 13,
                fontWeight: "900",
                lineHeight: 15,
        },

        summaryGrid: {
                flexDirection: "row",
                gap: 8,
                borderRadius: 17,
                padding: 8,
                backgroundColor: "rgba(3, 21, 31, 0.92)",
                borderWidth: 1,
                borderColor: "rgba(22, 243, 222, 0.34)",
                shadowColor: "#16f3de",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.20,
                shadowRadius: 18,
                elevation: 8,
        },

        summaryCard: {
                flex: 1,
                minHeight: 73,
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                borderRadius: 13,
                paddingHorizontal: 7,
                backgroundColor: "rgba(2, 11, 20, 0.86)",
                borderWidth: 1,
                borderColor: "rgba(148, 163, 184, 0.14)",
        },

        summaryIconWrap: {
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                flexShrink: 0,
        },

        summaryCopy: {
                flex: 1,
                minWidth: 0,
        },

        summaryTitle: {
                color: "#aab9c8",
                fontSize: 7.4,
                fontWeight: "900",
                lineHeight: 9,
        },

        summaryValue: {
                color: "#ffffff",
                fontSize: 15,
                fontWeight: "900",
                lineHeight: 18,
                marginTop: 2,
                fontVariant: ["tabular-nums"],
        },

        summaryValueSmall: {
                fontSize: 9.2,
                lineHeight: 11,
        },

        summaryDetail: {
                marginTop: 1,
                fontSize: 8.2,
                fontWeight: "900",
                lineHeight: 10,
        },

        reportCardsContainer: {
                gap: 14,
        },

        reportCardPressable: {
                width: "100%",
        },

        reportCard: {
                minHeight: 226,
                borderRadius: 21,
                padding: 17,
                borderWidth: 1,
                position: "relative",
                overflow: "hidden",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.52,
                shadowRadius: 18,
                elevation: 12,
        },

        reportCardMobile: {
                minHeight: 232,
                padding: 15,
        },

        cardHalo: {
                position: "absolute",
                left: -70,
                top: -52,
                width: 180,
                height: 180,
                borderRadius: 90,
                opacity: 0.72,
        },

        cardGhostOrbOne: {
                position: "absolute",
                right: 82,
                top: 74,
                width: 42,
                height: 42,
                borderRadius: 21,
                opacity: 0.46,
        },

        cardGhostOrbTwo: {
                position: "absolute",
                right: 22,
                top: 76,
                width: 78,
                height: 78,
                borderRadius: 39,
                opacity: 0.32,
        },

        cardNoiseLine: {
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 1,
                opacity: 0.7,
        },

        statusBadge: {
                position: "absolute",
                right: 16,
                top: 15,
                minHeight: 30,
                paddingHorizontal: 13,
                borderRadius: 15,
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                borderWidth: 1,
                zIndex: 4,
        },

        statusDot: {
                width: 8,
                height: 8,
                borderRadius: 4,
        },

        statusText: {
                fontSize: 10.5,
                fontWeight: "900",
        },

        cardMainRow: {
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 15,
                zIndex: 2,
        },

        cardIconStage: {
                width: 96,
                height: 126,
                borderRadius: 48,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                backgroundColor: "rgba(0, 0, 0, 0.18)",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.70,
                shadowRadius: 18,
                elevation: 10,
                flexShrink: 0,
        },

        cardIconOuterGlow: {
                position: "absolute",
                width: 78,
                height: 78,
                borderRadius: 39,
                borderWidth: 1,
                opacity: 0.58,
        },

        cardIconBubble: {
                width: 66,
                height: 66,
                borderRadius: 33,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
        },

        cardTextBlock: {
                flex: 1,
                minWidth: 0,
                paddingTop: 28,
                paddingBottom: 34,
        },

        reportCardTitle: {
                color: "#ffffff",
                fontSize: 21,
                fontWeight: "900",
                lineHeight: 26,
                marginBottom: 7,
                letterSpacing: 0,
                textShadowColor: "rgba(0,0,0,0.44)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 3,
        },

        reportCardDescription: {
                color: "#bdc9d8",
                fontSize: 12.4,
                fontWeight: "700",
                lineHeight: 17,
                maxWidth: 275,
        },

        cardPoints: {
                marginTop: 12,
                gap: 5,
        },

        cardPointRow: {
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
        },

        cardPointText: {
                color: "#cbd7e5",
                fontSize: 10.8,
                fontWeight: "700",
                lineHeight: 14,
        },

        cardGhostArea: {
                width: 94,
                alignSelf: "stretch",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
        },

        visualIcon: {
                opacity: 0.24,
                textShadowColor: "rgba(255,255,255,0.18)" as any,
                textShadowOffset: { width: 0, height: 0 } as any,
                textShadowRadius: 18 as any,
        },

        arrowButton: {
                position: "absolute",
                right: 0,
                bottom: 20,
                width: 54,
                height: 54,
                borderRadius: 27,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                backgroundColor: "rgba(2, 6, 23, 0.30)",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.82,
                shadowRadius: 16,
                elevation: 12,
        },

        cardFooterMini: {
                position: "absolute",
                left: 18,
                bottom: 15,
                minHeight: 31,
                borderRadius: 16,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                borderWidth: 1,
                zIndex: 3,
        },

        cardAnalyticsText: {
                fontSize: 10.2,
                fontWeight: "900",
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

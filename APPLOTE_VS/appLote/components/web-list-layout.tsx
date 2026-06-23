import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type WebListHeaderProps = {
  title: string;
  subtitle: string;
  count: number;
  actionLabel?: string;
  actionIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onAction?: () => void;
  embedded?: boolean;
};

// Encabezado común de las listas administrativas; se renderiza solo en web.
export const WebListHeader = ({
  title,
  subtitle,
  count,
  actionLabel,
  actionIcon = "plus-circle-outline",
  onAction,
  embedded = false,
}: WebListHeaderProps) => (
  <View style={[styles.header, embedded && styles.headerEmbedded]}>
    <View style={styles.copy}>
      <View style={styles.eyebrowRow}>
        <View style={styles.liveDot} />
        <Text style={styles.eyebrow}>GESTION EN TIEMPO REAL</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count} registros</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>

    {actionLabel && onAction ? (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        activeOpacity={0.86}
        style={styles.actionButton}
        onPress={onAction}
      >
        <MaterialCommunityIcons name={actionIcon} size={21} color="#ffffff" />
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// Estas reglas se aplican condicionalmente en web; los estilos móviles no cambian.
export const webListStyles = StyleSheet.create({
  page: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 104,
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-start",
    gap: 16,
  },
  card: {
    width: "32%",
    minWidth: 320,
    minHeight: 188,
    flexGrow: 1,
    marginBottom: 0,
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
});

const styles = StyleSheet.create({
  header: {
    minHeight: 132,
    marginTop: 20,
    marginHorizontal: 24,
    paddingLeft: 24,
    paddingRight: 96,
    paddingVertical: 18,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcefeb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    boxShadow: "0 14px 35px rgba(15, 118, 110, 0.12)",
  },
  headerEmbedded: {
    marginTop: 0,
    marginHorizontal: 0,
    marginBottom: 16,
    minHeight: 116,
  },
  copy: {
    flex: 1,
    minWidth: 260,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e8faf6",
  },
  countText: {
    color: "#0f766e",
    fontSize: 10,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 5,
    color: "#64748b",
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "600",
  },
  actionButton: {
    minWidth: 210,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#07998d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    boxShadow: "0 10px 22px rgba(7, 153, 141, 0.26)",
  },
  actionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
});

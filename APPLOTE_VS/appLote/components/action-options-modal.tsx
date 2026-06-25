import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type ActionOptionsModalProps = {
  visible: boolean;
  title: string;
  message: string;
  statusLabel: string;
  onStatusPress: () => void;
  onModifyPress: () => void;
  onClose: () => void;
};

export const ActionOptionsModal = ({
  visible,
  title,
  message,
  statusLabel,
  onStatusPress,
  onModifyPress,
  onClose,
}: ActionOptionsModalProps) => {
  const isRestore = statusLabel.toLowerCase().includes("restaurar");

  const runAndClose = (action: () => void) => {
    onClose();
    setTimeout(action, 0);
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, isRestore ? styles.restoreButton : styles.cancelStateButton]}
              onPress={() => runAndClose(onStatusPress)}
              activeOpacity={0.86}
            >
              <MaterialIcons
                name={isRestore ? "restore" : "block"}
                size={18}
                color={isRestore ? "#047857" : "#dc2626"}
              />
              <Text style={[styles.actionText, isRestore ? styles.restoreText : styles.cancelStateText]}>
                {statusLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.modifyButton]}
              onPress={() => runAndClose(onModifyPress)}
              activeOpacity={0.86}
            >
              <MaterialIcons name="edit" size={18} color="#0f766e" />
              <Text style={[styles.actionText, styles.modifyText]}>Modificar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={onClose}
              activeOpacity={0.86}
            >
              <MaterialIcons name="close" size={18} color="#475569" />
              <Text style={[styles.actionText, styles.closeText]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccfbf1",
    shadowColor: "#0f766e",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 26,
    elevation: 12,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#99f6e4",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    color: "#0f172a",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 18,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  cancelStateButton: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  restoreButton: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  modifyButton: {
    backgroundColor: "#ecfdf5",
    borderColor: "#99f6e4",
  },
  closeButton: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    textAlign: "center",
  },
  cancelStateText: {
    color: "#dc2626",
  },
  restoreText: {
    color: "#047857",
  },
  modifyText: {
    color: "#0f766e",
  },
  closeText: {
    color: "#475569",
  },
});

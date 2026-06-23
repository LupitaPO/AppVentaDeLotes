import { Alert, Platform, type AlertButton } from "react-native";

let compatibilidadConfigurada = false;

const construirMensaje = (titulo: string, mensaje?: string) =>
  [titulo, mensaje].filter(Boolean).join("\n\n");

const buscarBotonCancelar = (botones: AlertButton[]) =>
  botones.find((boton) => boton.style === "cancel") ??
  botones.find((boton) => /cancelar|cancel|no/i.test(boton.text ?? ""));

// React Native Web deja Alert.alert sin implementación; este adaptador conserva
// las alertas y callbacks actuales usando los diálogos nativos del navegador.
export const configurarCompatibilidadWeb = () => {
  if (
    compatibilidadConfigurada ||
    Platform.OS !== "web" ||
    typeof window === "undefined"
  ) {
    return;
  }

  compatibilidadConfigurada = true;

  // Garantiza que Expo Web use todo el viewport en monitores pequeños y grandes.
  const style = document.createElement("style");
  style.textContent = `
    html, body, #root {
      width: 100%;
      min-width: 0;
      min-height: 100%;
      margin: 0;
    }
    #root > div {
      width: 100%;
      min-height: 100vh;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);

  Alert.alert = (titulo, mensaje, botones = []) => {
    const texto = construirMensaje(titulo, mensaje);

    if (botones.length <= 1) {
      window.alert(texto);
      botones[0]?.onPress?.();
      return;
    }

    const botonCancelar = buscarBotonCancelar(botones);
    const botonConfirmar = botones.find((boton) => boton !== botonCancelar);
    const confirmado = window.confirm(texto);

    if (confirmado) {
      botonConfirmar?.onPress?.();
    } else {
      botonCancelar?.onPress?.();
    }
  };
};

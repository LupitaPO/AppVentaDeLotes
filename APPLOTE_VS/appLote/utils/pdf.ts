import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

type CompartirPdfOpciones = {
  html: string;
  titulo: string;
};

// En web se usa la impresión del navegador; en móvil se conserva el PDF compartible.
export const compartirPdf = async ({ html, titulo }: CompartirPdfOpciones) => {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") {
      throw new Error("La impresión web no está disponible.");
    }

    const ventanaImpresion = window.open("", "_blank");
    if (!ventanaImpresion) {
      throw new Error("El navegador bloqueó la ventana de impresión.");
    }

    ventanaImpresion.document.open();
    ventanaImpresion.document.write(html);
    ventanaImpresion.document.close();
    ventanaImpresion.document.title = titulo;

    ventanaImpresion.setTimeout(() => {
      ventanaImpresion.focus();
      ventanaImpresion.print();
    }, 250);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: titulo,
      UTI: "com.adobe.pdf",
    });
    return;
  }

  await Print.printAsync({ html });
};

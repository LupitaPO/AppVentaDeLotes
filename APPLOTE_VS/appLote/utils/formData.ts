import { Platform } from "react-native";
import type { DocumentPickerAsset } from "expo-document-picker";

// El navegador requiere un File real; React Native requiere el descriptor con URI.
export const agregarArchivoFormData = (
  formData: FormData,
  campo: string,
  archivo: DocumentPickerAsset,
) => {
  if (Platform.OS === "web" && archivo.file) {
    formData.append(campo, archivo.file, archivo.name);
    return;
  }

  const descriptorNativo = {
    uri: archivo.uri,
    name: archivo.name,
    type: archivo.mimeType || "text/csv",
  };

  formData.append(campo, descriptorNativo as unknown as Blob);
};

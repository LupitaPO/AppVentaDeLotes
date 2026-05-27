import { Platform } from "react-native";

const envApiUrl =
	typeof process !== "undefined" && process.env ? process.env.EXPO_PUBLIC_API_URL : undefined;

// ATAMAINE: En web usamos proxy local para evitar bloqueo CORS del navegador; en movil va directo a tu API real.
export const API_URL =
	envApiUrl ??
	(Platform.OS === "web" ? "http://localhost:3001" : "http://www.tulote.somee.com");

export const API_REAL_URL = "http://www.tulote.somee.com";
 
import { Platform } from "react-native";

const envApiUrl =
	typeof process !== "undefined" && process.env ? process.env.EXPO_PUBLIC_API_URL : undefined;

const envWebApiUrl =
	typeof process !== "undefined" && process.env ? process.env.EXPO_PUBLIC_WEB_API_URL : undefined;

const normalizarUrl = (value?: string) => {
	const limpia = value?.trim().replace(/\/+$/, "");
	return limpia && limpia.length > 0 ? limpia : undefined;
};

export const API_REAL_URL = normalizarUrl(envApiUrl) ?? "http://www.tulote.somee.com";
export const API_WEB_PROXY_URL = normalizarUrl(envWebApiUrl) ?? "http://localhost:3001";

// ATAMAINE: En web usamos proxy local para evitar bloqueo CORS del navegador; en movil va directo a tu API real.
export const API_URL =
	Platform.OS === "web"
		? API_WEB_PROXY_URL
		: API_REAL_URL;

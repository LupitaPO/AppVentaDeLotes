const envApiUrl =
	typeof process !== "undefined" && process.env ? process.env.EXPO_PUBLIC_API_URL : undefined;

const envWebApiUrl =
	typeof process !== "undefined" && process.env ? process.env.EXPO_PUBLIC_WEB_API_URL : undefined;

const normalizarUrl = (value?: string) => {
	const limpia = value?.trim().replace(/\/+$/, "");
	return limpia && limpia.length > 0 ? limpia : undefined;
};

const obtenerOrigenWeb = () => {
	if (typeof window === "undefined" || !window.location?.origin) return undefined;

	const { hostname, port, origin } = window.location;
	const esExpoDev =
		(hostname === "localhost" || hostname === "127.0.0.1") &&
		(port === "8081" || port === "19006");

	return esExpoDev ? undefined : normalizarUrl(origin);
};

export const API_REAL_URL = normalizarUrl(envApiUrl) ?? "http://www.tulote.somee.com";
export const API_WEB_PROXY_URL = normalizarUrl(envWebApiUrl) ?? "http://localhost:3001";

// En web publicada usamos el mismo host que sirve la app; en Expo dev se usa
// la API configurada para conservar el flujo móvil/remoto.
export const API_URL = obtenerOrigenWeb() ?? API_REAL_URL;

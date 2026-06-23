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

// La API publicada ya permite CORS. Usar una única URL evita que la web dependa
// de localhost:3001 y conserva exactamente el mismo backend usado por móvil.
export const API_URL = API_REAL_URL;

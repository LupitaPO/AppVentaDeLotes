const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const loadEnvFile = () => {
	const envPath = path.join(__dirname, ".env");
	if (!fs.existsSync(envPath)) return;

	const content = fs.readFileSync(envPath, "utf8");
	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
		if (!match) continue;

		const [, key, rawValue] = match;
		if (process.env[key] !== undefined) continue;

		process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
	}
};

loadEnvFile();

const TARGET_URL = new URL(process.env.WEB_API_PROXY_TARGET || process.env.EXPO_PUBLIC_API_URL || "http://www.tulote.somee.com");
const PORT = Number(process.env.WEB_API_PROXY_PORT || 3001);
const transport = TARGET_URL.protocol === "https:" ? https : http;

const writeCorsHeaders = (res) => {
	// ATAMAINE: Permitimos que Expo Web en localhost consuma tu API real sin que Chrome bloquee CORS.
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With");
};

const server = http.createServer((req, res) => {
	writeCorsHeaders(res);

	if (req.url === "/__proxy_health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ ok: true, target: TARGET_URL.origin }));
		return;
	}

	if (req.method === "OPTIONS") {
		res.writeHead(204);
		res.end();
		return;
	}

	const upstreamHeaders = { ...req.headers, host: TARGET_URL.host };
	delete upstreamHeaders.origin;
	delete upstreamHeaders.referer;

	const options = {
		protocol: TARGET_URL.protocol,
		hostname: TARGET_URL.hostname,
		port: TARGET_URL.port || (TARGET_URL.protocol === "https:" ? 443 : 80),
		path: req.url,
		method: req.method,
		headers: upstreamHeaders,
	};

	const proxyReq = transport.request(options, (proxyRes) => {
		writeCorsHeaders(res);
		res.writeHead(proxyRes.statusCode || 500, {
			...proxyRes.headers,
			"Access-Control-Allow-Origin": "*",
		});
		proxyRes.pipe(res);
	});

	proxyReq.on("error", (error) => {
		writeCorsHeaders(res);
		res.writeHead(502, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "No se pudo conectar con la API real.", detail: error.message }));
	});

	req.pipe(proxyReq);
});

server.on("error", (error) => {
	if (error.code === "EADDRINUSE") {
		console.log(`ATAMAINE proxy web: el puerto ${PORT} ya esta en uso. Se reutilizara si responde al health-check.`);
		process.exit(0);
	}

	console.error("ATAMAINE proxy web no pudo iniciar:", error);
	process.exit(1);
});

server.listen(PORT, "0.0.0.0", () => {
	console.log(`ATAMAINE proxy web activo: http://localhost:${PORT} -> ${TARGET_URL.origin}`);
});

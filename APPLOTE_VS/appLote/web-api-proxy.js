const http = require("http");

const TARGET_HOST = "www.tulote.somee.com";
const PORT = Number(process.env.WEB_API_PROXY_PORT || 3001);

const writeCorsHeaders = (res) => {
	// ATAMAINE: Permitimos que Expo Web en localhost consuma tu API real sin que Chrome bloquee CORS.
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
};

const server = http.createServer((req, res) => {
	writeCorsHeaders(res);

	if (req.method === "OPTIONS") {
		res.writeHead(204);
		res.end();
		return;
	}

	const upstreamHeaders = { ...req.headers, host: TARGET_HOST };
	delete upstreamHeaders.origin;
	delete upstreamHeaders.referer;

	const options = {
		hostname: TARGET_HOST,
		port: 80,
		path: req.url,
		method: req.method,
		headers: upstreamHeaders,
	};

	const proxyReq = http.request(options, (proxyRes) => {
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

server.listen(PORT, () => {
	console.log(`ATAMAINE proxy web activo: http://localhost:${PORT} -> http://${TARGET_HOST}`);
});

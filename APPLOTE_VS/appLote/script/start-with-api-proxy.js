const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const proxyPort = Number(process.env.WEB_API_PROXY_PORT || 3001);
const expoArgs = process.argv.slice(2);
const args = expoArgs.length > 0 ? expoArgs : ["start"];

let shuttingDown = false;
let proxyProcess = null;
let expoProcess = null;

const requestHealth = () =>
	new Promise((resolve, reject) => {
		const req = http.get(
			{
				hostname: "127.0.0.1",
				port: proxyPort,
				path: "/__proxy_health",
				timeout: 1200,
			},
			(res) => {
				res.resume();
				if (res.statusCode === 200) {
					resolve(true);
					return;
				}
				reject(new Error(`Health-check HTTP ${res.statusCode}`));
			},
		);

		req.on("timeout", () => {
			req.destroy(new Error("Health-check timeout"));
		});
		req.on("error", reject);
	});

const waitForProxy = async () => {
	for (let attempt = 0; attempt < 25; attempt += 1) {
		try {
			await requestHealth();
			return;
		} catch (error) {
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
	}

	throw new Error(`No se pudo levantar el proxy web en http://localhost:${proxyPort}`);
};

const shutdown = (code = 0) => {
	if (shuttingDown) return;
	shuttingDown = true;

	if (expoProcess && !expoProcess.killed) {
		expoProcess.kill();
	}

	if (proxyProcess && !proxyProcess.killed) {
		proxyProcess.kill();
	}

	process.exit(code);
};

const quoteWindowsArg = (value) => {
	const text = String(value);
	if (/^[A-Za-z0-9_./:=@-]+$/.test(text)) return text;
	return `"${text.replace(/"/g, '""')}"`;
};

const spawnExpo = () => {
	if (process.platform === "win32") {
		const command = ["npx", "expo", ...args].map(quoteWindowsArg).join(" ");
		return spawn(command, {
			cwd: rootDir,
			env: process.env,
			stdio: "inherit",
			shell: true,
		});
	}

	return spawn("npx", ["expo", ...args], {
		cwd: rootDir,
		env: process.env,
		stdio: "inherit",
	});
};

const start = async () => {
	proxyProcess = spawn(process.execPath, ["web-api-proxy.js"], {
		cwd: rootDir,
		env: process.env,
		stdio: "inherit",
	});

	proxyProcess.on("exit", (code) => {
		if (!shuttingDown && code && code !== 0) {
			console.error(`El proxy web termino con codigo ${code}.`);
			shutdown(code);
		}
	});

	await waitForProxy();

	expoProcess = spawnExpo();
	expoProcess.on("exit", (code) => {
		shutdown(code ?? 0);
	});
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start().catch((error) => {
	console.error(error.message);
	shutdown(1);
});

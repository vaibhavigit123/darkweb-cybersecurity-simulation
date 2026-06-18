import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { mockProducts } from "./src/productsData";

dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization helper for Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Simulated network state
let stats = {
  visitors: 12540,
  attempts: 4320,
  alerts: 27,
  score: 94
};

// Initial live hacker logs
let logsList: {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  node: string;
}[] = [
  { id: "log-1", timestamp: "23:25:12", level: "INFO", message: "Initial core connection established to gateway.", node: "Node-Reykjavik" },
  { id: "log-2", timestamp: "23:25:45", level: "WARN", message: "Port sweep scanned on external simulation proxy.", node: "Node-Geneva" },
  { id: "log-3", timestamp: "23:26:01", level: "INFO", message: "Intrusion signatures database updated dynamically.", node: "Node-Tokyo" },
  { id: "log-4", timestamp: "23:26:15", level: "SUCCESS", message: "Sublayer scanning attempt safely mitigated via proxy.", node: "Node-Reykjavik" }
];

// API Endpoints
// 1. Get products
app.get("/api/products", (req, res) => {
  res.json(mockProducts);
});

// 2. Get live telemetry stats
app.get("/api/stats", (req, res) => {
  // Introduce mild oscillations to reflect "live" traffic activity
  const visitorsAdjust = Math.floor(Math.random() * 4);
  const attemptsAdjust = Math.floor(Math.random() * 2);
  const alertsAdjust = Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0;

  stats.visitors += visitorsAdjust;
  stats.attempts += attemptsAdjust;
  if (stats.alerts + alertsAdjust >= 5) {
    stats.alerts += alertsAdjust;
  }

  res.json(stats);
});

// 3. Get hacker logs
app.get("/api/logs", (req, res) => {
  res.json(logsList);
});

// 4. Trigger simulated cyber events
app.post("/api/logs/simulate", (req, res) => {
  const { action } = req.body;
  const newLog: {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
    message: string;
    node: string;
  } = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 100)}`,
    timestamp: new Date().toLocaleTimeString(),
    level: "INFO",
    message: "",
    node: "Control-Consol-01"
  };

  switch (action) {
    case "ddos":
      newLog.level = "ERROR" as const;
      newLog.message = "DDoS Flooding Simulation initiated. Absorbing mock SYN packet load on Virtual Gate.";
      stats.alerts += 32;
      break;
    case "exploit":
      newLog.level = "WARN" as const;
      newLog.message = "Intercepted mock unauthorized admin-privilege escalation traversal check.";
      stats.alerts += 8;
      break;
    case "scanning":
      newLog.level = "INFO" as const;
      newLog.message = "Sub-domain routing enumeration protocol query completed by simulated peer node.";
      stats.attempts += 45;
      break;
    case "defense":
      newLog.level = "SUCCESS" as const;
      newLog.message = "Automated adaptive IP rate-limiter rules configured. Malicious queries drop.";
      stats.alerts = Math.max(5, stats.alerts - 15);
      break;
    default:
      newLog.message = "System parameter audit complete. Virtual firewall operational.";
  }

  logsList = [newLog, ...logsList].slice(0, 25);
  res.json({ logs: logsList, stats });
});

// 5. Server-side Gemini AI Ethical and Cyber Advisor Proxy
app.post("/api/gemini/advisor", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing advisor query." });
  }

  const ai = getGemini();

  if (!ai) {
    // Elegant educational fallback when GEMINI_API_KEY is not defined or is placeholder.
    // Keeps app completely interactive for sandbox testing!
    const fallbackAnswers = [
      `🔒 [Specter Cyber-Assistance Protocol]
Your query was processed. Since the Gemini API key is not currently injected, I will deliver an architectural educational prompt:
• Secure Coding: Always sanitize input query parameters to mitigate injection vectors like SQLi or Cross-Site Scripting (XSS).
• Network Audits: Always verify that local services bind on secure local interfaces rather than open configurations.
• Ethical Hacking: Responsible disclosure processes are foundational. Never operate tests without explicit written consent.`,
      
      `🔬 [Specter Cyber-Assistance Protocol - Exploit Mitigation]
Analyzing your prompt in offline mode:
• In real cybersecurity scenarios, phishing campaigns capitalize on psychological triggers—such as urgency or fear.
• Organization-wide defense combines active SPF/DKIM validation logs with randomized phishing awareness training.
• Password safety remains the most cost-effective defensive layer: promote hardware FIDO2 credentials and 16-character entropy passphrases.`,

      `🛡️ [Specter Cyber-Assistance Protocol - Network Hardening]
Cyber awareness assessment recommendations:
• Limit unnecessary port listening on production nodes.
• Prefer transport layer protection (TLS 1.3) with perfect forward secrecy.
• In server setups like Node/Express, avoid leaking precise software signatures in administrative headers (like standard "X-Powered-By" headers).`
    ];

    const randomResponse = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
    // Delay slightly to mimic natural response timing
    await new Promise((resolve) => setTimeout(resolve, 800));
    return res.json({ text: randomResponse, fallback: true });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: query,
      config: {
        systemInstruction: "You are 'Specter Security Engine', a professional server-side AI model representing a simulated cyber security advisor. Your mission is 100% educational, ethical, and defensive. Offer technical breakdowns of cyber awareness, secure architecture, ethical hacking guidelines, digital privacy setups, and standard cryptographic operations. Avoid releasing functional malware or facilitating unauthorized security intrusions.",
        temperature: 0.7,
      }
    });

    res.json({ text: response.text, fallback: false });
  } catch (error: any) {
    console.error("Gemini Advisor Request failed:", error);
    res.status(500).json({ error: error.message || "Advisor error." });
  }
});

// Configure Vite middleware or Static files asset serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted for Development server.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express cyber simulation server operational on port http://localhost:${PORT}`);
  });
}

startServer();

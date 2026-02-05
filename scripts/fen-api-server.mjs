import http from "node:http";
import { spawn } from "node:child_process";

const PORT = process.env.CHESS_FEN_API_PORT || 5179;
const DEFAULT_FEN =
  process.env.CHESS_FEN_STATIC ||
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const MODEL_CMD = process.env.CHESS_FEN_MODEL_CMD || "";
const BOARD_AREA_ENV = process.env.CHESS_BOARD_AREA || "";

const parseBoardArea = (value) => {
  if (!value) return null;
  const parts = value.split(",").map((v) => Number(v.trim()));
  if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) return null;
  const [x1, y1, x2, y2] = parts;
  return {
    topLeft: { x: Math.min(x1, x2), y: Math.min(y1, y2) },
    bottomRight: { x: Math.max(x1, x2), y: Math.max(y1, y2) },
  };
};

let lastBoardArea = parseBoardArea(BOARD_AREA_ENV);

const runModel = async (payload) => {
  if (!MODEL_CMD) return null;

  return new Promise((resolve, reject) => {
    const [cmd, ...args] = MODEL_CMD.split(" ").filter(Boolean);
    if (!cmd) {
      resolve(null);
      return;
    }

    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Model exited with code ${code}`));
        return;
      }

      const output = stdout.trim();
      if (!output) {
        resolve(null);
        return;
      }

      try {
        const json = JSON.parse(output);
        resolve(json);
      } catch {
        resolve({ fen: output });
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
};

const server = http.createServer(async (req, res) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS" && req.url === "/fen") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/fen") {
    res.writeHead(404, { "Content-Type": "application/json", ...corsHeaders });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 10_000_000) {
      req.destroy();
    }
  });

  req.on("end", async () => {
    try {
      const payload = JSON.parse(body || "{}");
      console.log("[fen-api] request", {
        hasImage: Boolean(payload?.imageBase64),
        boardArea: payload?.boardArea || null,
      });
      const modelResult = await runModel(payload);
      const fen =
        modelResult?.fen ||
        modelResult?.data?.fen ||
        modelResult?.result?.fen ||
        payload?.fen ||
        payload?.data?.fen ||
        payload?.result?.fen ||
        DEFAULT_FEN;

      const incomingBoardArea =
        modelResult?.boardArea ||
        modelResult?.data?.boardArea ||
        modelResult?.result?.boardArea ||
        payload?.boardArea ||
        payload?.data?.boardArea ||
        payload?.result?.boardArea ||
        parseBoardArea(BOARD_AREA_ENV) ||
        null;

      if (incomingBoardArea) {
        lastBoardArea = incomingBoardArea;
      }

      const debugImageBase64 =
        modelResult?.debugImageBase64 ||
        modelResult?.data?.debugImageBase64 ||
        modelResult?.result?.debugImageBase64 ||
        payload?.imageBase64 ||
        null;
      const debugImagePath =
        modelResult?.debugImagePath ||
        modelResult?.data?.debugImagePath ||
        modelResult?.result?.debugImagePath ||
        null;
      const debugInfo =
        modelResult?.debugInfo ||
        modelResult?.data?.debugInfo ||
        modelResult?.result?.debugInfo ||
        null;

      console.log("[fen-api] debugImage", JSON.stringify({
        hasDebugBase64: Boolean(debugImageBase64),
        debugSize: debugImageBase64 ? debugImageBase64.length : 0,
        debugImagePath,
        debugInfo,
      }, null, 2));

      const boardArea = lastBoardArea;

      console.log("[fen-api] response", {
        fen: fen ? `${fen.slice(0, 20)}...` : null,
        boardArea,
        debugImagePath,
      });

      res.writeHead(200, { "Content-Type": "application/json", ...corsHeaders });
      res.end(
        JSON.stringify({ fen, boardArea, debugImageBase64, debugImagePath, debugInfo })
      );
    } catch (error) {
      console.error("[fen-api] error", error);
      res.writeHead(400, { "Content-Type": "application/json", ...corsHeaders });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`FEN API listening on http://localhost:${PORT}/fen`);
});

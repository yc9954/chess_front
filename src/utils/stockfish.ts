// Stockfish 엔진 래퍼
type StockfishLike = {
  postMessage: (message: string) => void;
  onmessage: ((event: { data?: string } | string) => void) | null;
  terminate?: () => void;
};

export class StockfishEngine {
  private engine: StockfishLike | null = null;
  private ready = false;
  private analyzing = false;
  private listeners = new Set<(message: string) => void>();
  private initPromise: Promise<void> | null = null;
  private lastError: string | null = null;

  constructor() {
    this.initEngine();
  }

  private async initEngine() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.startEngine();
    return this.initPromise;
  }

  private async startEngine() {
    this.ready = false;
    this.analyzing = false;
    this.engine = null;
    this.lastError = null;
    try {
      // asm.js 버전 사용 (wasm 로딩 문제 회피)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error - stockfish.js has no types
      const mod = await import("stockfish.js/stockfish.js");
      const resolveFactory = (value: unknown) => {
        if (typeof value === "function") return value;
        if (!value || typeof value !== "object") return null;
        const obj = value as Record<string, unknown>;
        const candidates = [
          obj.default,
          obj.stockfish,
          obj.Stockfish,
          obj.worker,
        ];
        for (const candidate of candidates) {
          if (typeof candidate === "function") return candidate;
        }
        return null;
      };

      const factory =
        resolveFactory(mod) ||
        resolveFactory((mod as { default?: unknown }).default) ||
        resolveFactory((mod as { default?: { default?: unknown } }).default?.default);

      if (typeof factory === "function") {
        const instance = (factory as () => StockfishLike | Promise<StockfishLike>)();
        this.engine = typeof (instance as { then?: unknown }).then === "function"
          ? await (instance as Promise<StockfishLike>)
          : (instance as StockfishLike);
      } else {
        // Fallback: create a classic worker from the asm.js bundle
        const workerUrl = new URL("stockfish.js/stockfish.js", import.meta.url);
        const worker = new Worker(workerUrl, { type: "classic" });
        this.engine = worker as unknown as StockfishLike;
      }

      if (this.engine) {
        this.engine.onmessage = (event) => {
          const message = typeof event === "string" ? event : event?.data || "";
          if (!message) return;
          if (message.includes("uciok")) {
            this.ready = true;
          }
          this.listeners.forEach((listener) => listener(message));
        };

        this.sendCommand("uci");
        setTimeout(() => this.sendCommand("isready"), 150);
        setTimeout(() => this.sendCommand("isready"), 600);
      }
    } catch (error) {
      this.lastError = String(error);
      console.error("Failed to initialize Stockfish:", error);
    } finally {
      this.initPromise = null;
    }
  }

  private sendCommand(cmd: string) {
    if (this.engine) {
      this.engine.postMessage(cmd);
    }
  }

  private async waitForReady(timeoutMs = 5000) {
    if (!this.engine) {
      await this.initEngine();
    }
    if (this.ready) return Promise.resolve(true);

    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        this.listeners.delete(onMessage);
        resolve(false);
      }, timeoutMs);

      const onMessage = (message: string) => {
        if (message.includes("uciok") || message.includes("readyok")) {
          clearTimeout(timeout);
          this.listeners.delete(onMessage);
          this.ready = true;
          resolve(true);
        }
      };

      this.listeners.add(onMessage);
      this.sendCommand("isready");
    });
  }

  private async ensureReady() {
    let ready = await this.waitForReady();
    if (ready) return true;
    // Retry once by resetting engine
    this.quit();
    await this.initEngine();
    ready = await this.waitForReady();
    if (!ready) {
      this.lastError = this.lastError || "Engine not ready";
    }
    return ready;
  }

  addListener(listener: (message: string) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus() {
    return {
      ready: this.ready,
      analyzing: this.analyzing,
      hasEngine: Boolean(this.engine),
      lastError: this.lastError,
    };
  }

  async getBestMove(fen: string, depth: number = 15): Promise<string> {
    const ready = await this.ensureReady();
    if (!ready) {
      return "";
    }

    return new Promise((resolve) => {
      if (!this.engine) {
        resolve("");
        return;
      }

      let bestMove = "";

      const handleMessage = (message: string) => {
        if (message.startsWith("bestmove")) {
          const match = message.match(/bestmove (\w+)/);
          if (match) {
            bestMove = match[1];
          }
          this.listeners.delete(handleMessage);
          this.analyzing = false;
          resolve(bestMove);
        }
      };

      this.listeners.add(handleMessage);

      this.analyzing = true;
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);

      setTimeout(() => {
        if (this.analyzing) {
          this.listeners.delete(handleMessage);
          this.analyzing = false;
          resolve(bestMove || "");
        }
      }, 30000);
    });
  }

  async getEvaluation(fen: string, depth: number = 15): Promise<number> {
    const ready = await this.ensureReady();
    if (!ready) {
      return 0;
    }

    return new Promise((resolve) => {
      if (!this.engine) {
        resolve(0);
        return;
      }

      let score = 0;

      const handleMessage = (message: string) => {
        const cpMatch = message.match(/score cp (-?\d+)/);
        if (cpMatch) {
          score = parseInt(cpMatch[1], 10) / 100;
        }

        const mateMatch = message.match(/score mate (-?\d+)/);
        if (mateMatch) {
          const mateIn = parseInt(mateMatch[1], 10);
          score = mateIn > 0 ? 100 : -100;
        }

        if (message.startsWith("bestmove")) {
          this.listeners.delete(handleMessage);
          resolve(score);
        }
      };

      this.listeners.add(handleMessage);

      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);

      setTimeout(() => {
        this.listeners.delete(handleMessage);
        resolve(score);
      }, 30000);
    });
  }

  stop() {
    this.sendCommand("stop");
    this.analyzing = false;
  }

  quit() {
    this.sendCommand("quit");
    this.engine?.terminate?.();
    this.engine = null;
  }
}

export const stockfishEngine = new StockfishEngine();

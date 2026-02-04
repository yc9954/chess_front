// Stockfish 엔진 래퍼
export class StockfishEngine {
  private worker: Worker | null = null;
  private ready = false;
  private analyzing = false;

  constructor() {
    this.initEngine();
  }

  private initEngine() {
    try {
      // Stockfish Worker 초기화
      this.worker = new Worker('/stockfish.js');

      this.worker.addEventListener('message', (e) => {
        const message = e.data;
        if (typeof message === 'string') {
          console.log('Stockfish:', message);
          if (message.includes('uciok')) {
            this.ready = true;
            console.log('Stockfish ready!');
          }
        }
      });

      // UCI 프로토콜 초기화
      this.sendCommand('uci');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
    }
  }

  private sendCommand(cmd: string) {
    if (this.worker) {
      this.worker.postMessage(cmd);
    }
  }

  async getBestMove(fen: string, depth: number = 15): Promise<string> {
    return new Promise((resolve) => {
      if (!this.worker || !this.ready) {
        resolve('');
        return;
      }

      let bestMove = '';

      const handleMessage = (e: MessageEvent) => {
        const message = e.data;
        if (typeof message === 'string') {
          if (message.startsWith('bestmove')) {
            const match = message.match(/bestmove (\w+)/);
            if (match) {
              bestMove = match[1];
              this.worker?.removeEventListener('message', handleMessage);
              this.analyzing = false;
              resolve(bestMove);
            }
          }
        }
      };

      this.worker.addEventListener('message', handleMessage);

      this.analyzing = true;
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);

      // 타임아웃 설정 (30초)
      setTimeout(() => {
        if (this.analyzing) {
          this.worker?.removeEventListener('message', handleMessage);
          this.analyzing = false;
          resolve(bestMove || '');
        }
      }, 30000);
    });
  }

  async getEvaluation(fen: string, depth: number = 15): Promise<number> {
    return new Promise((resolve) => {
      if (!this.worker || !this.ready) {
        resolve(0);
        return;
      }

      let score = 0;

      const handleMessage = (e: MessageEvent) => {
        const message = e.data;
        if (typeof message === 'string') {
          // cp (centipawns) 점수 추출
          const cpMatch = message.match(/score cp (-?\d+)/);
          if (cpMatch) {
            score = parseInt(cpMatch[1]) / 100;
          }

          // mate 점수 추출
          const mateMatch = message.match(/score mate (-?\d+)/);
          if (mateMatch) {
            const mateIn = parseInt(mateMatch[1]);
            score = mateIn > 0 ? 100 : -100;
          }

          if (message.startsWith('bestmove')) {
            this.worker?.removeEventListener('message', handleMessage);
            resolve(score);
          }
        }
      };

      this.worker.addEventListener('message', handleMessage);

      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);

      setTimeout(() => {
        this.worker?.removeEventListener('message', handleMessage);
        resolve(score);
      }, 30000);
    });
  }

  stop() {
    this.sendCommand('stop');
    this.analyzing = false;
  }

  quit() {
    this.sendCommand('quit');
    this.worker?.terminate();
    this.worker = null;
  }
}

export const stockfishEngine = new StockfishEngine();

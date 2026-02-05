export interface Position {
  x: number;
  y: number;
}

export interface BoardArea {
  topLeft: Position;
  bottomRight: Position;
}

export interface RecognizeResult {
  fen: string | null;
  boardArea?: BoardArea | null;
  debugImageBase64?: string | null;
  debugImagePath?: string | null;
}

export async function captureBoardImage(boardArea: BoardArea): Promise<string> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("capture_board_image", { boardArea });
}

export async function captureFullscreenImage(): Promise<string> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("capture_fullscreen_image");
}

export async function fetchFenFromApi(payload: {
  imageBase64: string;
  boardArea?: BoardArea | null;
}): Promise<RecognizeResult> {
  const rawUrl =
    import.meta.env.VITE_CHESS_FEN_API_URL || "http://127.0.0.1:5179/fen";
  const sanitizedUrl = rawUrl.trim().replace(/^['"]|['"]$/g, "");
  const url = sanitizedUrl.replace("localhost", "127.0.0.1");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  const attemptFetch = async () => {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  };

  let response: Response;
  try {
    response = await attemptFetch();
  } catch (error) {
    // Small retry for transient connection drops
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      response = await attemptFetch();
    } catch (retryError) {
      clearTimeout(timeoutId);
      throw new Error(`FEN API 연결 실패: ${url} (${retryError})`);
    }
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`FEN API 오류: ${response.status} ${text}`);
  }

  const data = await response.json();

  if (typeof data === "string") return { fen: data };
  if (data?.fen)
    return {
      fen: data.fen as string,
      boardArea: data.boardArea,
      debugImageBase64: data.debugImageBase64,
      debugImagePath: data.debugImagePath,
    };
  if (data?.data?.fen)
    return {
      fen: data.data.fen as string,
      boardArea: data.data.boardArea,
      debugImageBase64: data.data.debugImageBase64,
      debugImagePath: data.data.debugImagePath,
    };
  if (data?.result?.fen)
    return {
      fen: data.result.fen as string,
      boardArea: data.result.boardArea,
      debugImageBase64: data.result.debugImageBase64,
      debugImagePath: data.result.debugImagePath,
    };

  return {
    fen: null,
    boardArea: data?.boardArea || null,
    debugImageBase64: data?.debugImageBase64 || null,
    debugImagePath: data?.debugImagePath || null,
  };
}

export async function recognizeFen(boardArea?: BoardArea | null): Promise<RecognizeResult> {
  const imageBase64 = boardArea
    ? await captureBoardImage(boardArea)
    : await captureFullscreenImage();
  return fetchFenFromApi({ boardArea: boardArea || null, imageBase64 });
}

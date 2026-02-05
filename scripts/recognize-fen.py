#!/usr/bin/env python3
import base64
import json
import os
import struct
import sys

# Input: JSON via stdin with keys: boardArea, imageBase64
# Output: JSON with key "fen" and detected board position

DEFAULT_FEN = os.environ.get(
    "CHESS_FEN_STATIC",
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
)
BOARD_AREA = os.environ.get("CHESS_BOARD_AREA", "")
DEBUG_OUTPUT = os.environ.get("CHESS_DEBUG_OUTPUT", "")

# ChessVision.ai API 사용 여부 (환경변수로 비활성화 가능)
# board_to_fen 라이브러리 사용 여부 (환경변수로 비활성화 가능)
USE_BOARD_TO_FEN = os.environ.get("USE_BOARD_TO_FEN", "true").lower() == "true"


def recognize_with_board_to_fen(image_bytes):
    """
    board_to_fen 라이브러리를 사용하여 이미지에서 FEN을 추출합니다.
    딥러닝 기반으로 정확도가 높습니다.
    
    Returns: (fen, error) - FEN 문자열 또는 None, 에러 메시지 또는 None
    """
    try:
        from PIL import Image
        from board_to_fen.predict import get_fen_from_image
        import io
        
        # bytes를 PIL Image로 변환
        img = Image.open(io.BytesIO(image_bytes))
        
        # RGB로 변환 (RGBA인 경우)
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        
        # FEN 추출
        fen = get_fen_from_image(img)
        
        if fen:
            return fen, None
        else:
            return None, "No FEN returned"
            
    except ImportError as e:
        return None, f"board_to_fen not installed: {e}"
    except Exception as e:
        return None, str(e)


def call_stockfish_online(fen, depth=15):
    """
    Stockfish.online API를 호출하여 최선의 수를 분석합니다.
    
    Returns: (best_move, evaluation, error)
    """
    try:
        import urllib.request
        import urllib.parse
        import urllib.error
        
        # FEN에서 공백을 언더스코어로 변환 (URL 인코딩)
        fen_encoded = urllib.parse.quote(fen, safe='')
        url = f"https://stockfish.online/api/s/v2.php?fen={fen_encoded}&depth={depth}"
        
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "Mozilla/5.0")
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
            
            if result.get("success"):
                best_move = result.get("bestmove", "").split()[1] if "bestmove" in result else None
                evaluation = result.get("evaluation")
                return best_move, evaluation, None
            else:
                return None, None, "Stockfish analysis failed"
                
    except Exception as e:
        return None, None, str(e)


def has_piece(cell_img, cv2, np):
    """
    체스판 한 칸에 기물이 있는지, 있다면 흰색/검은색인지 판단합니다.
    
    핵심 아이디어: 기물은 **중앙에 집중된 불규칙한 형태**를 가짐.
    빈 칸은 **균일한 색상** (밝은 베이지 또는 어두운 녹색).
    
    Chess.com Green 테마:
    - 밝은 칸: 베이지색 (H: 30-50, S: 20-60, V: 200-255)
    - 어두운 칸: 녹색 (H: 60-90, S: 40-100, V: 100-180)
    - 흰 기물: 거의 흰색 (S < 20, V > 230)
    - 검은 기물: 거의 검은색 (S < 50, V < 50) 또는 회색
    """
    h, w = cell_img.shape[:2]
    if h < 20 or w < 20:
        return ''
    
    # === 1. 강한 블러로 노이즈 제거 ===
    blurred = cv2.GaussianBlur(cell_img, (15, 15), 0)
    
    # === 2. 중앙 영역 추출 (기물이 있는 곳) ===
    margin = int(min(h, w) * 0.2)
    center = blurred[margin:h-margin, margin:w-margin]
    if center.size == 0:
        return ''
    
    # 더 작은 내부 영역 (기물 코어)
    inner_margin = int(min(h, w) * 0.35)
    inner = blurred[inner_margin:h-inner_margin, inner_margin:w-inner_margin]
    if inner.size == 0:
        return ''
    
    hsv_center = cv2.cvtColor(center, cv2.COLOR_BGR2HSV)
    hsv_inner = cv2.cvtColor(inner, cv2.COLOR_BGR2HSV)
    gray_center = cv2.cvtColor(center, cv2.COLOR_BGR2GRAY)
    gray_inner = cv2.cvtColor(inner, cv2.COLOR_BGR2GRAY)
    
    # === 3. 배경(모서리) 색상 분석 ===
    corner_size = max(8, int(min(h, w) * 0.15))
    corners_gray = [
        blurred[:corner_size, :corner_size],
        blurred[:corner_size, w-corner_size:w],
        blurred[h-corner_size:h, :corner_size],
        blurred[h-corner_size:h, w-corner_size:w],
    ]
    corners_hsv = [cv2.cvtColor(c, cv2.COLOR_BGR2HSV) for c in corners_gray]
    
    # 배경 평균 색상
    bg_h = np.mean([np.mean(c[:,:,0]) for c in corners_hsv])
    bg_s = np.mean([np.mean(c[:,:,1]) for c in corners_hsv])
    bg_v = np.mean([np.mean(c[:,:,2]) for c in corners_hsv])
    
    # 중앙 평균 색상
    center_h = np.mean(hsv_inner[:,:,0])
    center_s = np.mean(hsv_inner[:,:,1])
    center_v = np.mean(hsv_inner[:,:,2])
    
    # === 4. 기물 vs 빈칸 판단 ===
    
    # 색상 차이 계산
    h_diff = abs(center_h - bg_h)
    s_diff = abs(center_s - bg_s)
    v_diff = abs(center_v - bg_v)
    
    # 빈칸: 배경과 중앙 색상이 거의 동일
    is_empty = (h_diff < 15 and s_diff < 30 and v_diff < 40)
    
    if is_empty:
        return ''
    
    # === 5. 기물 색상 판단 ===
    
    # 흰 기물: 매우 낮은 채도 + 매우 높은 밝기
    # (배경보다 훨씬 밝고 무채색에 가까움)
    is_white_piece = (center_s < 25 and center_v > 220 and center_v > bg_v + 30)
    
    # 검은 기물: 매우 낮은 밝기 (배경보다 훨씬 어두움)
    is_black_piece = (center_v < 70 and center_v < bg_v - 30)
    
    # 회색 기물 (검은색 기물이 약간 밝은 경우)
    is_gray_piece = (center_s < 40 and center_v < 120 and center_v < bg_v - 20)
    
    if is_white_piece:
        return 'w'
    elif is_black_piece or is_gray_piece:
        return 'b'
    
    # === 6. 추가 확인: 표준 편차 기반 ===
    # 기물이 있으면 내부 표준편차가 높음 (불규칙한 형태)
    inner_std = np.std(gray_inner)
    center_std = np.std(gray_center)
    
    # 빈칸은 균일함 (std < 15)
    if inner_std < 12 and center_std < 15:
        return ''
    
    # 표준편차가 높고 밝으면 흰 기물
    if inner_std > 20 and np.mean(gray_inner) > 200:
        return 'w'
    
    # 표준편차가 높고 어두우면 검은 기물
    if inner_std > 15 and np.mean(gray_inner) < 100:
        return 'b'
    
    return ''


def recognize_board(img, board_area, cv2, np):
    """
    체스판 이미지에서 기물 배치를 인식합니다 (로컬 폴백).
    자동으로 보드 방향(백/흑 시점)을 감지합니다.
    """
    tl = board_area["topLeft"]
    br = board_area["bottomRight"]
    
    board_img = img[tl["y"]:br["y"], tl["x"]:br["x"]]
    h, w = board_img.shape[:2]
    
    cell_w = w // 8
    cell_h = h // 8
    
    # === 1단계: 기물 색상만 먼저 감지 ===
    color_board = []
    for rank in range(8):
        row = []
        for file in range(8):
            x1 = file * cell_w
            y1 = rank * cell_h
            x2 = x1 + cell_w
            y2 = y1 + cell_h
            
            cell_img = board_img[y1:y2, x1:x2]
            piece_color = has_piece(cell_img, cv2, np)
            row.append(piece_color)
        color_board.append(row)
    
    # === 2단계: 보드 방향 감지 ===
    # 흰 기물이 아래쪽(rank 6-7)에 많으면 백 시점
    # 흰 기물이 위쪽(rank 0-1)에 많으면 흑 시점 (뒤집힘)
    white_bottom = sum(1 for r in range(6, 8) for c in range(8) if color_board[r][c] == 'w')
    white_top = sum(1 for r in range(0, 2) for c in range(8) if color_board[r][c] == 'w')
    black_bottom = sum(1 for r in range(6, 8) for c in range(8) if color_board[r][c] == 'b')
    black_top = sum(1 for r in range(0, 2) for c in range(8) if color_board[r][c] == 'b')
    
    # 흑 시점이면 보드 뒤집기
    is_flipped = (white_top + black_bottom) > (white_bottom + black_top)
    
    if is_flipped:
        # 보드를 180도 회전 (상하좌우 반전)
        color_board = [row[::-1] for row in color_board[::-1]]
    
    # === 3단계: 기물 종류 추론 ===
    # 게임 중간이므로 위치 기반 추론 대신 단순화
    board = []
    for rank in range(8):
        row = []
        for file in range(8):
            color = color_board[rank][file]
            
            if color == '':
                row.append('')
            elif color == 'w':
                # 흰 기물: rank 0-1에 있으면 승격 기물 가능
                if rank == 0:
                    row.append('Q')  # 8열 도달 = 승격 (퀸 가정)
                elif rank == 1:
                    row.append('P')  # 7열 = 폰
                elif rank == 7:
                    # 1열: 킹이나 룩일 가능성
                    if file == 4:
                        row.append('K')
                    elif file == 0 or file == 7:
                        row.append('R')
                    else:
                        row.append('P')
                else:
                    row.append('P')  # 기본적으로 폰
            else:  # 'b'
                if rank == 7:
                    row.append('q')  # 1열 도달 = 승격 (퀸 가정)
                elif rank == 6:
                    row.append('p')  # 2열 = 폰
                elif rank == 0:
                    # 8열: 킹이나 룩일 가능성
                    if file == 4:
                        row.append('k')
                    elif file == 0 or file == 7:
                        row.append('r')
                    else:
                        row.append('p')
                else:
                    row.append('p')  # 기본적으로 폰
        board.append(row)
    
    # === 4단계: 킹 보장 ===
    has_white_king = any('K' in row for row in board)
    has_black_king = any('k' in row for row in board)
    
    # 킹이 없으면 가장 적합한 위치에 추가
    if not has_white_king:
        # 흰 기물 중 하나를 킹으로 변경
        for rank in range(7, -1, -1):
            for file in range(8):
                if board[rank][file] in ['P', 'Q', 'R']:
                    board[rank][file] = 'K'
                    has_white_king = True
                    break
            if has_white_king:
                break
        if not has_white_king:
            board[7][4] = 'K'
    
    if not has_black_king:
        for rank in range(8):
            for file in range(8):
                if board[rank][file] in ['p', 'q', 'r']:
                    board[rank][file] = 'k'
                    has_black_king = True
                    break
            if has_black_king:
                break
        if not has_black_king:
            board[0][4] = 'k'
    
    # === 5단계: FEN 생성 ===
    fen_rows = []
    for row in board:
        fen_row = ""
        empty_count = 0
        for piece in row:
            if piece == '':
                empty_count += 1
            else:
                if empty_count > 0:
                    fen_row += str(empty_count)
                    empty_count = 0
                fen_row += piece
        if empty_count > 0:
            fen_row += str(empty_count)
        fen_rows.append(fen_row)
    
    return "/".join(fen_rows), is_flipped


def detect_board_area(img, cv2, np):
    """
    이미지에서 체스판 영역을 감지합니다.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    
    detected_area = None
    method = None
    details = {}
    
    # Try chessboard corner detection
    found, corners = cv2.findChessboardCorners(
        gray, (7, 7),
        cv2.CALIB_CB_ADAPTIVE_THRESH + cv2.CALIB_CB_NORMALIZE_IMAGE + cv2.CALIB_CB_FAST_CHECK,
    )
    if found and corners is not None:
        corners2 = cv2.cornerSubPix(
            gray, corners, (11, 11), (-1, -1),
            (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.001),
        )
        pts = corners2.reshape(-1, 2)
        min_x, min_y = pts.min(axis=0)
        max_x, max_y = pts.max(axis=0)
        grid = corners2.reshape(7, 7, 2)
        dx = np.median(np.diff(grid[0, :, 0]))
        dy = np.median(np.diff(grid[:, 0, 1]))
        square_size = (dx + dy) / 2.0
        pad = int(square_size * 1.05)
        detected_area = {
            "topLeft": {"x": int(max(min_x - pad, 0)), "y": int(max(min_y - pad, 0))},
            "bottomRight": {
                "x": int(min(max_x + pad, img.shape[1] - 1)),
                "y": int(min(max_y + pad, img.shape[0] - 1)),
            },
        }
        method = "chessboard_corners"
        details = {"pad": int(pad), "square_size": float(square_size)}
        return detected_area, method, details
    
    # Try checkerboard score search
    try:
        h, w = gray.shape[:2]
        target_w = 1280 if w > 1280 else w
        scale = target_w / float(w) if w > target_w else 1.0
        small = cv2.resize(gray, (int(w * scale), int(h * scale)))
        sh, sw = small.shape[:2]
        integral_small = cv2.integral(small)
        min_dim = min(sw, sh)
        min_size = int(min_dim * 0.35)
        max_size = int(min_dim * 0.9)
        best_score = 0
        best_box = None
        best_variance = 0
        
        for s in [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85]:
            size = int(min_dim * s)
            cell = max(8, size // 8)
            size = cell * 8
            if size < min_size or size > max_size:
                continue
            step = max(8, cell // 3)
            for y in range(0, sh - size, step):
                y2 = y + size
                for x in range(0, sw - size, step):
                    x2 = x + size
                    white_sum = 0.0
                    black_sum = 0.0
                    white_count = 0
                    black_count = 0
                    for i in range(8):
                        yy1 = y + i * cell
                        yy2 = yy1 + cell
                        for j in range(8):
                            xx1 = x + j * cell
                            xx2 = xx1 + cell
                            cell_sum = (
                                integral_small[yy2, xx2]
                                - integral_small[yy1, xx2]
                                - integral_small[yy2, xx1]
                                + integral_small[yy1, xx1]
                            )
                            if (i + j) % 2 == 0:
                                white_sum += cell_sum
                                white_count += 1
                            else:
                                black_sum += cell_sum
                                black_count += 1
                    
                    white_avg = white_sum / white_count if white_count > 0 else 0
                    black_avg = black_sum / black_count if black_count > 0 else 0
                    contrast = abs(white_avg - black_avg)
                    variance = min(white_avg, black_avg) / max(white_avg, black_avg, 1)
                    score = contrast * (1.0 + variance)
                    
                    if score > best_score:
                        best_score = score
                        best_box = (x, y, size, cell)
                        best_variance = variance
        
        if best_box:
            x, y, size, cell = best_box
            inv = 1.0 / scale
            pad = int(cell * 0.1 * inv)
            x_full = int(x * inv)
            y_full = int(y * inv)
            size_full = int(size * inv)
            detected_area = {
                "topLeft": {"x": max(0, x_full - pad), "y": max(0, y_full - pad)},
                "bottomRight": {
                    "x": min(w - 1, x_full + size_full + pad),
                    "y": min(h - 1, y_full + size_full + pad),
                },
            }
            method = "checkerboard_score"
            details = {"score": float(best_score), "variance": float(best_variance), "scale": float(scale)}
            return detected_area, method, details
    except Exception as e:
        details["checkerboard_error"] = str(e)
    
    # Contour detection fallback
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = None
    best_score = 0
    min_side = int(min(img.shape[0], img.shape[1]) * 0.35)
    max_side = int(min(img.shape[0], img.shape[1]) * 0.95)
    h_img, w_img = img.shape[:2]
    center_x, center_y = w_img / 2, h_img / 2
    
    for cnt in contours:
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) != 4:
            continue
        x, y, w, h = cv2.boundingRect(approx)
        if w <= 0 or h <= 0:
            continue
        if min(w, h) < min_side or max(w, h) > max_side:
            continue
        ratio = w / float(h)
        if ratio < 0.8 or ratio > 1.2:
            continue
        
        area = w * h
        cx, cy = x + w / 2, y + h / 2
        dist_from_center = ((cx - center_x) ** 2 + (cy - center_y) ** 2) ** 0.5
        max_dist = (center_x ** 2 + center_y ** 2) ** 0.5
        centrality = 1.0 - (dist_from_center / max_dist)
        aspect_score = 1.0 - abs(1.0 - ratio)
        score = area * (1.0 + centrality * 0.3) * (1.0 + aspect_score * 0.2)
        
        if score > best_score:
            best_score = score
            best = (x, y, w, h, area)

    if best:
        x, y, w, h, area = best
        pad = int(min(w, h) * 0.02)
        detected_area = {
            "topLeft": {"x": max(0, int(x - pad)), "y": max(0, int(y - pad))},
            "bottomRight": {"x": min(w_img - 1, int(x + w + pad)), "y": min(h_img - 1, int(y + h + pad))},
        }
        method = "contour_square"
        details = {"area": int(area)}
        return detected_area, method, details
    
    return None, None, {}


def main():
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw or "{}")
    except Exception:
        payload = {}

    image_b64 = payload.get("imageBase64")
    detected_area = None
    recognized_fen = None
    debug_info = {"method": None, "details": {}, "attempts": []}
    has_cv2 = False
    has_numpy = False

    image_shape = None
    debug_image_b64 = None
    debug_image_path = None
    img_bytes = None
    api_fen = None
    api_error = None
    
    if image_b64:
        try:
            img_bytes = base64.b64decode(image_b64)
        except Exception:
            img_bytes = None
    
    # === 1. board_to_fen 라이브러리로 딥러닝 기반 인식 ===
    if USE_BOARD_TO_FEN and img_bytes:
        api_fen, api_error = recognize_with_board_to_fen(img_bytes)
        debug_info["details"]["board_to_fen"] = {
            "attempted": True,
            "success": api_fen is not None,
            "error": api_error,
        }
        if api_fen:
            recognized_fen = api_fen + " w KQkq - 0 1" if " " not in api_fen else api_fen
            debug_info["method"] = "board_to_fen"
            debug_info["details"]["ml_fen"] = api_fen
    
    # === 2. 이미지 처리 및 체스판 감지 ===
    if image_b64 and img_bytes:
        try:
            import numpy as np
            import cv2
            has_numpy = True
            has_cv2 = True

            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if img is not None:
                image_shape = img.shape
                
                # 체스판 영역 감지
                detected_area, detect_method, detect_details = detect_board_area(img, cv2, np)
                
                if detect_method and debug_info["method"] is None:
                    debug_info["method"] = detect_method
                debug_info["details"].update(detect_details)
                
                # === 3. API 실패 시 로컬 인식 폴백 ===
                if recognized_fen is None and detected_area is not None:
                    try:
                        piece_placement, is_flipped = recognize_board(img, detected_area, cv2, np)
                        recognized_fen = piece_placement + " w KQkq - 0 1"
                        debug_info["details"]["piece_recognition"] = "local_fallback"
                        debug_info["details"]["recognized_placement"] = piece_placement
                        debug_info["details"]["board_flipped"] = is_flipped
                        if debug_info["method"] is None or debug_info["method"] == "chessvision_api":
                            debug_info["method"] = detect_method or "local_recognition"
                    except Exception as e:
                        debug_info["details"]["piece_recognition_error"] = str(e)

        except ImportError:
            has_numpy = False
            has_cv2 = False
        except Exception as e:
            debug_info["details"]["cv_error"] = str(e)
            
    if image_shape is None and img_bytes:
        try:
            if img_bytes[:8] == b"\x89PNG\r\n\x1a\n":
                width, height = struct.unpack(">II", img_bytes[16:24])
                image_shape = (height, width, 3)
        except Exception:
            pass
            
    board_area = None
    if BOARD_AREA:
        try:
            x1, y1, x2, y2 = [int(v.strip()) for v in BOARD_AREA.split(",")]
            board_area = {
                "topLeft": {"x": min(x1, x2), "y": min(y1, y2)},
                "bottomRight": {"x": max(x1, x2), "y": max(y1, y2)},
            }
        except Exception:
            board_area = None

    if detected_area:
        board_area = detected_area
    elif board_area is None and image_shape is not None:
        height, width = image_shape[0], image_shape[1]
        size = int(min(width, height) * 0.6)
        left = int((width - size) / 2)
        top = int((height - size) / 2)
        board_area = {
            "topLeft": {"x": left, "y": top},
            "bottomRight": {"x": left + size, "y": top + size},
        }
        if debug_info["method"] is None:
            debug_info["method"] = "fallback_center"
            debug_info["details"]["size"] = int(size)

    debug_info.setdefault("details", {})
    debug_info["details"]["hasCv2"] = has_cv2
    debug_info["details"]["hasNumpy"] = has_numpy
    debug_info["details"]["useBoardToFen"] = USE_BOARD_TO_FEN

    # Draw debug overlay
    if image_b64 and image_shape is not None and img_bytes and has_cv2:
        try:
            import numpy as np
            import cv2

            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if img is not None:
                debug_img = img.copy()
                if board_area:
                    tl = board_area["topLeft"]
                    br = board_area["bottomRight"]
                    
                    # Draw green outer rectangle
                    cv2.rectangle(debug_img, (tl["x"], tl["y"]), (br["x"], br["y"]), (0, 255, 0), 8)
                    
                    # Draw yellow 8x8 grid
                    width = br["x"] - tl["x"]
                    height = br["y"] - tl["y"]
                    square_width = width / 8
                    square_height = height / 8
                    
                    for i in range(1, 8):
                        x = int(tl["x"] + i * square_width)
                        cv2.line(debug_img, (x, tl["y"]), (x, br["y"]), (0, 255, 255), 4)
                    
                    for i in range(1, 8):
                        y = int(tl["y"] + i * square_height)
                        cv2.line(debug_img, (tl["x"], y), (br["x"], y), (0, 255, 255), 4)
                    
                    # Draw corner labels
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    font_scale = 1.2
                    font_thickness = 3
                    labels = [
                        {"text": "a8", "x": tl["x"] + 10, "y": tl["y"] + 40},
                        {"text": "h8", "x": br["x"] - 60, "y": tl["y"] + 40},
                        {"text": "a1", "x": tl["x"] + 10, "y": br["y"] - 10},
                        {"text": "h1", "x": br["x"] - 60, "y": br["y"] - 10},
                    ]
                    
                    for label in labels:
                        text_size = cv2.getTextSize(label["text"], font, font_scale, font_thickness)[0]
                        cv2.rectangle(
                            debug_img,
                            (label["x"] - 5, label["y"] - text_size[1] - 5),
                            (label["x"] + text_size[0] + 5, label["y"] + 5),
                            (0, 0, 0),
                            -1,
                        )
                        cv2.putText(debug_img, label["text"], (label["x"], label["y"]), font, font_scale, (0, 0, 255), font_thickness)
                    
                    # API 사용 여부 표시
                    api_status = "ChessVision.ai API: " + ("Success" if api_fen else f"Failed ({api_error})" if api_error else "Disabled")
                    cv2.putText(debug_img, api_status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0) if api_fen else (0, 0, 255), 2)
                    
                    # 인식된 기물 표시
                    if recognized_fen:
                        rows = recognized_fen.split()[0].split("/")
                        for rank_idx, row in enumerate(rows):
                            file_idx = 0
                            for char in row:
                                if char.isdigit():
                                    file_idx += int(char)
                                else:
                                    cx = int(tl["x"] + (file_idx + 0.5) * square_width)
                                    cy = int(tl["y"] + (rank_idx + 0.5) * square_height)
                                    color = (255, 255, 255) if char.isupper() else (0, 0, 0)
                                    cv2.circle(debug_img, (cx, cy), int(square_width * 0.3), color, -1)
                                    cv2.circle(debug_img, (cx, cy), int(square_width * 0.3), (0, 255, 0), 2)
                                    cv2.putText(
                                        debug_img, char, (cx - 15, cy + 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                                        (0, 0, 255) if char.isupper() else (255, 0, 0), 2,
                                    )
                                    file_idx += 1
                
                if DEBUG_OUTPUT:
                    cv2.imwrite(DEBUG_OUTPUT, debug_img)
                    debug_image_path = DEBUG_OUTPUT
                else:
                    debug_image_path = "/tmp/chess_recognition.png"
                    try:
                        cv2.imwrite(debug_image_path, debug_img)
                    except Exception:
                        debug_image_path = None
                
                # Create debug base64
                try:
                    target_w = 600
                    h, w = debug_img.shape[:2]
                    if w > target_w:
                        scale = target_w / float(w)
                        resized = cv2.resize(debug_img, (target_w, int(h * scale)))
                    else:
                        resized = debug_img
                    ok, buf = cv2.imencode(".png", resized)
                    if ok:
                        debug_image_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
                except Exception:
                    pass
        except Exception:
            pass
    elif image_b64 and image_shape is not None and img_bytes and not has_cv2:
        if debug_info["method"] is None:
            debug_info["method"] = "no_cv2"
            debug_info["details"] = {"hasCv2": False, "hasNumpy": has_numpy}

    if debug_image_b64 is None:
        debug_image_b64 = image_b64 if image_b64 else None

    # 최종 FEN 결정
    final_fen = recognized_fen if recognized_fen else DEFAULT_FEN

    print(
        json.dumps(
            {
                "fen": final_fen,
                "boardArea": board_area,
                "debugImageBase64": debug_image_b64,
                "debugImagePath": debug_image_path,
                "debugInfo": debug_info,
            }
        )
    )


if __name__ == "__main__":
    main()

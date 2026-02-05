#!/usr/bin/env python3
import base64
import json
import os
import struct
import sys

# This is a stub. Replace with your real model inference.
# Input: JSON via stdin with keys: boardArea, imageBase64
# Output: JSON with key "fen" OR plain FEN string.

DEFAULT_FEN = os.environ.get(
    "CHESS_FEN_STATIC",
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
)
BOARD_AREA = os.environ.get("CHESS_BOARD_AREA", "")
DEBUG_OUTPUT = os.environ.get("CHESS_DEBUG_OUTPUT", "")

def main():
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw or "{}")
    except Exception:
        payload = {}

    image_b64 = payload.get("imageBase64")
    detected_area = None
    debug_info = {"method": None, "details": {}}
    has_cv2 = False
    has_numpy = False

    image_shape = None
    debug_image_b64 = None
    debug_image_path = None
    img_bytes = None
    if image_b64:
        try:
            img_bytes = base64.b64decode(image_b64)
        except Exception:
            img_bytes = None
    if image_b64 and img_bytes:
        try:
            import numpy as np  # type: ignore
            import cv2  # type: ignore
            has_numpy = True
            has_cv2 = True

            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if img is not None:
                image_shape = img.shape
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                blurred = cv2.GaussianBlur(gray, (5, 5), 0)
                edges = cv2.Canny(blurred, 50, 150)
                # Try chessboard corner detection (inner corners: 7x7)
                found, corners = cv2.findChessboardCorners(
                    gray,
                    (7, 7),
                    cv2.CALIB_CB_ADAPTIVE_THRESH
                    + cv2.CALIB_CB_NORMALIZE_IMAGE
                    + cv2.CALIB_CB_FAST_CHECK,
                )
                if found and corners is not None:
                    corners2 = cv2.cornerSubPix(
                        gray,
                        corners,
                        (5, 5),
                        (-1, -1),
                        (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.01),
                    )
                    pts = corners2.reshape(-1, 2)
                    min_x, min_y = pts.min(axis=0)
                    max_x, max_y = pts.max(axis=0)
                    # Estimate one square size from first row/column spacing
                    grid = corners2.reshape(7, 7, 2)
                    dx = np.median(np.diff(grid[0, :, 0]))
                    dy = np.median(np.diff(grid[:, 0, 1]))
                    pad = int(max(dx, dy))
                    detected_area = {
                        "topLeft": {"x": int(max(min_x - pad, 0)), "y": int(max(min_y - pad, 0))},
                        "bottomRight": {
                            "x": int(min(max_x + pad, img.shape[1] - 1)),
                            "y": int(min(max_y + pad, img.shape[0] - 1)),
                        },
                    }
                    debug_info["method"] = "chessboard_corners"
                    debug_info["details"] = {"pad": int(pad)}
                # Try checkerboard score search on downscaled image
                try:
                    h, w = gray.shape[:2]
                    target_w = 520
                    scale = target_w / float(w) if w > target_w else 1.0
                    small = cv2.resize(gray, (int(w * scale), int(h * scale)))
                    sh, sw = small.shape[:2]
                    integral_small = cv2.integral(small)
                    min_dim = min(sw, sh)
                    min_size = int(min_dim * 0.45)
                    best_score = 0
                    best_box = None
                    for s in [0.4, 0.5, 0.6, 0.7, 0.8]:
                        size = int(min_dim * s)
                        cell = max(4, size // 8)
                        size = cell * 8
                        if size <= 0 or size > min_dim or size < min_size:
                            continue
                        step = max(6, cell // 2)
                        for y in range(0, sh - size, step):
                            y2 = y + size
                            for x in range(0, sw - size, step):
                                x2 = x + size
                                white_sum = 0.0
                                black_sum = 0.0
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
                                        else:
                                            black_sum += cell_sum
                                score = abs(white_sum - black_sum) / float(size * size)
                                if score > best_score:
                                    best_score = score
                                    best_box = (x, y, size)
                    if best_box:
                        x, y, size = best_box
                        inv = 1.0 / scale
                        detected_area = {
                            "topLeft": {"x": int(x * inv), "y": int(y * inv)},
                            "bottomRight": {
                                "x": int((x + size) * inv),
                                "y": int((y + size) * inv),
                            },
                        }
                        debug_info["method"] = "checkerboard_score"
                        debug_info["details"] = {
                            "score": float(best_score),
                            "scale": float(scale),
                            "size": int(size),
                            "minSize": int(min_size),
                        }
                except Exception:
                    pass

                if detected_area is None:
                    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    best = None
                    best_area = 0
                    min_side = int(min(img.shape[0], img.shape[1]) * 0.45)
                    for cnt in contours:
                        peri = cv2.arcLength(cnt, True)
                        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
                        if len(approx) != 4:
                            continue
                        x, y, w, h = cv2.boundingRect(approx)
                        if w <= 0 or h <= 0:
                            continue
                        if min(w, h) < min_side:
                            continue
                        ratio = w / float(h)
                        if ratio < 0.85 or ratio > 1.15:
                            continue
                        area = w * h
                        if area > best_area:
                            best_area = area
                            best = (x, y, w, h)

                    if best:
                        x, y, w, h = best
                        detected_area = {
                            "topLeft": {"x": int(x), "y": int(y)},
                            "bottomRight": {"x": int(x + w), "y": int(y + h)},
                        }
                        if debug_info["method"] is None:
                            debug_info["method"] = "contour_square"
                            debug_info["details"] = {"area": int(best_area)}

                # Fallback: pick square with highest edge density (downscaled)
                if detected_area is None:
                    try:
                        h, w = gray.shape[:2]
                        target_w = 640
                        scale = target_w / float(w) if w > target_w else 1.0
                        small = cv2.resize(gray, (int(w * scale), int(h * scale)))
                        small_edges = cv2.Canny(small, 50, 150)
                        integral = cv2.integral(small_edges)
                        sh, sw = small_edges.shape[:2]
                        min_dim = min(sw, sh)
                        min_size = int(min_dim * 0.45)
                        scales = [0.5, 0.6, 0.7, 0.8]
                        best_score = 0
                        best_box = None
                        for s in scales:
                            size = int(min_dim * s)
                            if size < min_size:
                                continue
                            if size <= 0:
                                continue
                            step = max(8, size // 10)
                            for y in range(0, sh - size, step):
                                y2 = y + size
                                for x in range(0, sw - size, step):
                                    x2 = x + size
                                    score = (
                                        integral[y2, x2]
                                        - integral[y, x2]
                                        - integral[y2, x]
                                        + integral[y, x]
                                    )
                                    if score > best_score:
                                        best_score = score
                                        best_box = (x, y, size)
                        if best_box:
                            x, y, size = best_box
                            density = best_score / float(size * size)
                            if density > 0.02:
                                inv = 1.0 / scale
                                detected_area = {
                                    "topLeft": {
                                        "x": int(x * inv),
                                        "y": int(y * inv),
                                    },
                                    "bottomRight": {
                                        "x": int((x + size) * inv),
                                        "y": int((y + size) * inv),
                                    },
                                }
                                debug_info["method"] = "edge_density"
                                debug_info["details"] = {
                                    "density": float(density),
                                    "scale": float(scale),
                                    "size": int(size),
                                }
                    except Exception:
                        pass

                # Defer debug overlay drawing until board_area is resolved
        except Exception:
            has_numpy = has_numpy or False
            has_cv2 = has_cv2 or False
            pass
    if image_shape is None and img_bytes:
        # Try parsing PNG size without OpenCV
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
        # Fallback: use center square region of the screen
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
            debug_info["details"] = {"size": int(size)}

    # Always report dependency availability
    debug_info.setdefault("details", {})
    debug_info["details"]["hasCv2"] = has_cv2
    debug_info["details"]["hasNumpy"] = has_numpy

    # Draw debug overlay after board_area is finalized
    if image_b64 and image_shape is not None and img_bytes and has_cv2:
        try:
            import numpy as np  # type: ignore
            import cv2  # type: ignore

            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if img is not None:
                debug_img = img.copy()
                if board_area:
                    tl = board_area["topLeft"]
                    br = board_area["bottomRight"]
                    cv2.rectangle(
                        debug_img,
                        (tl["x"], tl["y"]),
                        (br["x"], br["y"]),
                        (0, 255, 0),
                        2,
                    )
                if DEBUG_OUTPUT:
                    cv2.imwrite(DEBUG_OUTPUT, debug_img)
                    debug_image_path = DEBUG_OUTPUT
                else:
                    debug_image_path = "/tmp/chess_recognition.png"
                    try:
                        cv2.imwrite(debug_image_path, debug_img)
                    except Exception:
                        debug_image_path = None
                # Create debug base64 (resize for UI)
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
        if image_b64:
            debug_image_b64 = image_b64
        else:
            debug_image_b64 = None

    print(
        json.dumps(
            {
                "fen": DEFAULT_FEN,
                "boardArea": board_area,
                "debugImageBase64": debug_image_b64,
                "debugImagePath": debug_image_path,
                "debugInfo": debug_info,
            }
        )
    )

if __name__ == "__main__":
    main()

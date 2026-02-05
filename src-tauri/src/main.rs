// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{engine::general_purpose, Engine as _};
use enigo::{Button, Coordinate, Direction, Enigo, Mouse, Settings};
use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;
use std::thread;
use std::time::Duration;
use arboard::Clipboard;

#[derive(Debug, Serialize, Deserialize)]
struct Position {
    x: i32,
    y: i32,
}

#[derive(Debug, Serialize, Deserialize)]
struct MoveCommand {
    from: Position,
    to: Position,
}

#[derive(Debug, Serialize, Deserialize)]
struct BoardArea {
    topLeft: Position,
    bottomRight: Position,
}

// 마우스 클릭 명령
#[tauri::command]
fn click_position(x: i32, y: i32) -> Result<String, String> {
    let settings = Settings::default();
    let mut enigo = Enigo::new(&settings).map_err(|e| format!("Failed to create Enigo: {:?}", e))?;

    // 마우스 이동
    enigo
        .move_mouse(x, y, Coordinate::Abs)
        .map_err(|e| format!("Failed to move mouse: {:?}", e))?;
    thread::sleep(Duration::from_millis(100));

    // 클릭
    enigo
        .button(Button::Left, Direction::Click)
        .map_err(|e| format!("Failed to click: {:?}", e))?;
    thread::sleep(Duration::from_millis(50));

    Ok(format!("Clicked at ({}, {})", x, y))
}

// 체스 이동 실행 (from -> to 드래그 앤 드롭)
// 주의: 좌표는 macOS 화면 절대 좌표 (0,0 = 좌상단)
#[tauri::command]
fn execute_chess_move(move_cmd: MoveCommand) -> Result<String, String> {
    let settings = Settings::default();
    let mut enigo = Enigo::new(&settings).map_err(|e| format!("Failed to create Enigo: {:?}", e))?;

    println!("🎯 [Rust] 이동 명령 받음: ({}, {}) -> ({}, {})",
        move_cmd.from.x, move_cmd.from.y, move_cmd.to.x, move_cmd.to.y);

    // 1단계: From 위치로 이동 - 충분한 시간을 두고 안정화
    println!("🖱️  [Rust] From 위치로 이동: ({}, {})", move_cmd.from.x, move_cmd.from.y);
    enigo
        .move_mouse(move_cmd.from.x, move_cmd.from.y, Coordinate::Abs)
        .map_err(|e| format!("Failed to move mouse: {:?}", e))?;
    thread::sleep(Duration::from_millis(250)); // 마우스 위치 안정화 (200ms -> 250ms)

    // 2단계: 드래그 시작
    println!("⬇️  [Rust] 마우스 버튼 누름 (Press)");
    enigo
        .button(Button::Left, Direction::Press)
        .map_err(|e| format!("Failed to press: {:?}", e))?;
    thread::sleep(Duration::from_millis(350)); // 드래그 시작 인식 대기 (300ms -> 350ms)

    // 3단계: 중간 지점을 거쳐 이동 (더 자연스러운 드래그)
    let mid_x = (move_cmd.from.x + move_cmd.to.x) / 2;
    let mid_y = (move_cmd.from.y + move_cmd.to.y) / 2;

    println!("🖱️  [Rust] 중간 지점으로 이동: ({}, {})", mid_x, mid_y);
    enigo
        .move_mouse(mid_x, mid_y, Coordinate::Abs)
        .map_err(|e| format!("Failed to move mouse to midpoint: {:?}", e))?;
    thread::sleep(Duration::from_millis(100)); // 중간 지점 안정화

    // 4단계: To 위치로 최종 이동
    println!("🖱️  [Rust] To 위치로 드래그: ({}, {})", move_cmd.to.x, move_cmd.to.y);
    enigo
        .move_mouse(move_cmd.to.x, move_cmd.to.y, Coordinate::Abs)
        .map_err(|e| format!("Failed to move mouse: {:?}", e))?;
    thread::sleep(Duration::from_millis(300)); // 도착 지점 안정화 (250ms -> 300ms)

    // 5단계: 드래그 종료
    println!("⬆️  [Rust] 마우스 버튼 뗌 (Release)");
    enigo
        .button(Button::Left, Direction::Release)
        .map_err(|e| format!("Failed to release: {:?}", e))?;
    thread::sleep(Duration::from_millis(200)); // 릴리스 완료 대기 (150ms -> 200ms)

    println!("✅ [Rust] 드래그 앤 드롭 완료");
    Ok(format!(
        "✅ Drag&Drop: ({},{}) → ({},{})",
        move_cmd.from.x, move_cmd.from.y, move_cmd.to.x, move_cmd.to.y
    ))
}

// 현재 마우스 위치 가져오기
#[tauri::command]
fn get_mouse_position() -> Result<Position, String> {
    let settings = Settings::default();
    let mut enigo = Enigo::new(&settings).map_err(|e| format!("Failed to create Enigo: {:?}", e))?;

    let (x, y) = enigo
        .location()
        .map_err(|e| format!("Failed to get mouse location: {:?}", e))?;

    Ok(Position { x, y })
}

// 체스판 영역 스크린샷 캡처 (base64 PNG 반환)
#[tauri::command]
fn capture_board_image(board_area: BoardArea) -> Result<String, String> {
    let x = board_area.topLeft.x;
    let y = board_area.topLeft.y;
    let width = board_area.bottomRight.x - board_area.topLeft.x;
    let height = board_area.bottomRight.y - board_area.topLeft.y;

    if width <= 0 || height <= 0 {
        return Err("Invalid board area dimensions".into());
    }

    let tmp_path = std::env::temp_dir().join("chess_board_capture.png");
    let tmp_path_str = tmp_path
        .to_str()
        .ok_or_else(|| "Invalid temp path".to_string())?;

    let status = Command::new("screencapture")
        .args(["-x", "-R", &format!("{},{},{},{}", x, y, width, height), tmp_path_str])
        .status()
        .map_err(|e| format!("Failed to run screencapture: {:?}", e))?;

    if !status.success() {
        return Err("screencapture failed".into());
    }

    let bytes = fs::read(&tmp_path).map_err(|e| format!("Failed to read capture: {:?}", e))?;
    let _ = fs::remove_file(&tmp_path);

    Ok(general_purpose::STANDARD.encode(bytes))
}

// 전체 화면 스크린샷 캡처 (base64 PNG 반환)
#[tauri::command]
fn capture_fullscreen_image() -> Result<String, String> {
    let tmp_path = std::env::temp_dir().join("chess_screen_capture.png");
    let tmp_path_str = tmp_path
        .to_str()
        .ok_or_else(|| "Invalid temp path".to_string())?;

    let status = Command::new("screencapture")
        .args(["-x", tmp_path_str])
        .status()
        .map_err(|e| format!("Failed to run screencapture: {:?}", e))?;

    if !status.success() {
        return Err("screencapture failed".into());
    }

    let bytes = fs::read(&tmp_path).map_err(|e| format!("Failed to read capture: {:?}", e))?;
    let _ = fs::remove_file(&tmp_path);

    Ok(general_purpose::STANDARD.encode(bytes))
}

// 클립보드에서 텍스트 읽기
#[tauri::command]
fn get_clipboard_text() -> Result<String, String> {
    let mut clipboard = Clipboard::new().map_err(|e| format!("Failed to access clipboard: {:?}", e))?;
    clipboard.get_text().map_err(|e| format!("Failed to get clipboard text: {:?}", e))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            click_position,
            execute_chess_move,
            get_mouse_position,
            capture_board_image,
            capture_fullscreen_image,
            get_clipboard_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use enigo::{Button, Coordinate, Direction, Enigo, Mouse, Settings};
use serde::{Deserialize, Serialize};
use std::thread;
use std::time::Duration;

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

// 체스 이동 실행 (from -> to 클릭)
#[tauri::command]
fn execute_chess_move(move_cmd: MoveCommand) -> Result<String, String> {
    let settings = Settings::default();
    let mut enigo = Enigo::new(&settings).map_err(|e| format!("Failed to create Enigo: {:?}", e))?;

    // From 위치 클릭
    enigo
        .move_mouse(move_cmd.from.x, move_cmd.from.y, Coordinate::Abs)
        .map_err(|e| format!("Failed to move mouse: {:?}", e))?;
    thread::sleep(Duration::from_millis(100));
    enigo
        .button(Button::Left, Direction::Click)
        .map_err(|e| format!("Failed to click: {:?}", e))?;
    thread::sleep(Duration::from_millis(300));

    // To 위치 클릭
    enigo
        .move_mouse(move_cmd.to.x, move_cmd.to.y, Coordinate::Abs)
        .map_err(|e| format!("Failed to move mouse: {:?}", e))?;
    thread::sleep(Duration::from_millis(100));
    enigo
        .button(Button::Left, Direction::Click)
        .map_err(|e| format!("Failed to click: {:?}", e))?;
    thread::sleep(Duration::from_millis(100));

    Ok(format!(
        "Moved from ({}, {}) to ({}, {})",
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            click_position,
            execute_chess_move,
            get_mouse_position
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

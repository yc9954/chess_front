# Tauri macOS 위젯 설정 가이드

## 사전 요구 사항

### 1. Rust 설치

Tauri는 Rust를 필요로 합니다. 다음 명령어로 Rust를 설치하세요:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

설치 후 터미널을 재시작하거나 다음 명령어를 실행하세요:

```bash
source $HOME/.cargo/env
```

설치 확인:

```bash
rustc --version
cargo --version
```

### 2. Node.js 의존성 설치

```bash
npm install
```

## 개발 모드 실행

```bash
npm run tauri dev
```

이 명령어는:
1. Vite 개발 서버를 시작합니다 (http://localhost:1420)
2. Rust 프로젝트를 빌드합니다 (처음 실행 시 시간이 걸릴 수 있습니다)
3. macOS 네이티브 투명 윈도우를 엽니다

## 프로덕션 빌드

```bash
npm run tauri build
```

빌드된 앱은 `src-tauri/target/release/bundle/` 디렉토리에 생성됩니다.

## 문제 해결

### Rust가 설치되지 않은 경우

에러: `failed to run 'cargo metadata' command`

해결: 위의 Rust 설치 단계를 따라주세요.

### Tauri CLI가 설치되지 않은 경우

```bash
npm install -D @tauri-apps/cli@latest
```

### 첫 빌드가 느린 경우

Rust의 첫 빌드는 의존성을 컴파일하므로 시간이 걸립니다. 이후 빌드는 훨씬 빠릅니다.

## 프로젝트 구조

```
yolo/
├── src/                    # React UI 레이어
│   ├── components/ui/     # UI 컴포넌트
│   ├── App.tsx             # 메인 앱
│   └── main.tsx            # React 진입점
├── src-tauri/              # Tauri Rust 백엔드
│   ├── src/main.rs         # 네이티브 프로세스
│   └── tauri.conf.json     # 윈도우 설정
└── index.html              # HTML 템플릿
```

## macOS 위젯 설정

`src-tauri/tauri.conf.json`에서 윈도우 설정:

- `transparent: true` - 투명 윈도우
- `decorations: false` - 프레임/타이틀 바 제거
- `alwaysOnTop: true` - 모든 창 위에 표시
- `width: 600, height: 200` - 윈도우 크기

# Yolo - macOS Desktop Widget

macOS 데스크톱 위에 떠 있는 반투명 위젯 애플리케이션입니다.

## 기술 스택

- **Tauri 2.0** - 네이티브 macOS 윈도우 생성
- **React 18** - UI 레이어
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **Vite** - 빌드 도구

## 요구 사항

- macOS 10.13 이상
- Rust (Tauri 설치 시 자동 설치됨)
- Node.js 18+

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 모드 실행

```bash
npm run tauri dev
```

이 명령어는:
- Vite 개발 서버를 시작합니다 (http://localhost:1420)
- Tauri 네이티브 윈도우를 엽니다
- 투명한 macOS 윈도우 위에 React UI가 렌더링됩니다

### 3. 프로덕션 빌드

```bash
npm run tauri build
```

빌드된 앱은 `src-tauri/target/release/bundle/` 디렉토리에 생성됩니다.

## 윈도우 설정

`src-tauri/tauri.conf.json`에서 윈도우 설정을 변경할 수 있습니다:

- `transparent: true` - 투명 윈도우
- `decorations: false` - 프레임/타이틀 바 제거
- `alwaysOnTop: true` - 항상 위에 떠 있음
- `width`, `height` - 윈도우 크기

## 프로젝트 구조

```
yolo/
├── src/                    # React 소스 코드
│   ├── components/        # React 컴포넌트
│   ├── App.tsx            # 메인 앱 컴포넌트
│   └── main.tsx           # React 진입점
├── src-tauri/             # Tauri Rust 코드
│   ├── src/
│   │   └── main.rs        # Tauri 메인 프로세스
│   └── tauri.conf.json    # Tauri 설정
├── index.html             # HTML 템플릿
└── vite.config.ts         # Vite 설정
```

## 특징

- ✅ macOS 네이티브 투명 윈도우
- ✅ 모든 창 위에 떠 있는 위젯
- ✅ 프레임 없는 디자인
- ✅ 반투명 glass 효과
- ✅ React로 구현된 UI 레이어

## 주의사항

이 프로젝트는 **macOS 전용** 데스크톱 애플리케이션입니다.
웹 서비스나 브라우저 기반 앱이 아닙니다.

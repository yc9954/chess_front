# ♟️ Chess Widget - Auto Player

macOS 스타일의 liquid glass 디자인을 가진 체스 위젯입니다. 두 가지 모드를 지원합니다.

## 🎯 기능

### 1️⃣ 데모 모드 (연습용)
- 인터랙티브 체스 보드
- AI 채팅 기능
- 실시간 분석 로그
- 추천 이동 표시
- macOS liquid glass 스타일 UI

### 2️⃣ 자동 플레이어 모드 (로컬 체스판용)
- **화면의 체스판 자동 인식**
- **자동 마우스 클릭으로 이동 실행**
- Stockfish 엔진 통합 (예정)
- FEN 기반 포지션 분석
- 클릭 딜레이 조절 가능

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 모드 실행
```bash
npm run tauri dev
```

### 3. 프로덕션 빌드
```bash
npm run tauri build
```

## 📖 사용법

### 자동 플레이어 모드 사용 방법

1. **앱 실행 및 모드 선택**
   - 앱 실행 후 "🤖 자동 플레이어" 버튼 클릭

2. **체스판 영역 설정**
   - "체스판 영역 설정" 버튼 클릭
   - 1초 후 체스판의 **좌상단 코너**에 마우스 위치
   - 2초 후 체스판의 **우하단 코너**에 마우스 위치
   - 자동으로 8x8 그리드가 계산됨

3. **FEN 포지션 입력**
   - 현재 체스 포지션의 FEN을 입력창에 입력
   - 기본값: 초기 포지션 (rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1)

4. **자동 이동 시작**
   - **수동 분석**: "수동 분석" 버튼으로 최선의 수만 확인
   - **자동 이동**: "▶ 자동 이동 시작" 버튼 클릭 시 자동으로 마우스가 움직여서 수를 둠

5. **클릭 딜레이 조절**
   - 슬라이더로 클릭 간격 조절 (100ms ~ 2000ms)
   - 느린 시스템이나 애니메이션이 있는 체스판에서는 딜레이를 늘려주세요

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Tauri 2.0 + Rust
- **Chess Engine**: Stockfish.js (WASM)
- **Chess Logic**: chess.js
- **Mouse Automation**: enigo (Rust 라이브러리)
- **Design**: Tailwind CSS + Custom Liquid Glass Effect

## ⚠️ 중요 사항

**이 도구는 교육 및 연구 목적으로만 사용하세요:**
- ✅ 로컬 체스 앱에서 학습 및 연습
- ✅ 오프라인 포지션 분석
- ✅ 체스 전략 연구
- ❌ **온라인 플랫폼에서 사용 절대 금지** (chess.com, lichess 등)

온라인 플랫폼에서 사용 시:
- 계정 영구 정지
- 서비스 약관 위반
- 다른 플레이어에게 불공정

## 🔒 권한 요구사항

이 앱은 다음 권한이 필요합니다:
- **마우스 제어** (자동 클릭)
- **화면 접근** (macOS)

### macOS 권한 설정
1. 시스템 환경설정 → 보안 및 개인 정보 보호
2. 손쉬운 사용 → 앱 권한 허용
3. 화면 기록 → 앱 권한 허용 (필요시)

## 📝 프로젝트 구조

```
chess_front/
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── chess-cheating.tsx    # 데모 모드
│   │       └── auto-chess.tsx         # 자동 플레이어
│   ├── utils/
│   │   └── stockfish.ts               # Stockfish 엔진 래퍼
│   ├── App.tsx                        # 메인 앱 (모드 선택)
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   └── main.rs                    # Rust 백엔드 (마우스 제어)
│   ├── Cargo.toml                     # Rust 의존성
│   └── tauri.conf.json                # Tauri 설정
└── package.json                        # NPM 의존성
```

## 🐛 알려진 이슈

- Stockfish WASM 파일이 필요합니다 (`public/stockfish.js`)
- 현재는 무작위 이동으로 동작 (Stockfish 통합 예정)
- macOS에서만 테스트됨
- 일부 체스 앱에서는 정확한 좌표 인식을 위해 딜레이 조절이 필요할 수 있음

## 🤝 기여

이슈와 PR은 언제나 환영합니다!

## 📄 라이선스

교육 및 연구 목적으로만 사용하세요.

---

**⚠️ 면책 조항**: 이 도구를 부적절하게 사용하여 발생하는 모든 결과에 대해 개발자는 책임지지 않습니다. 온라인 게임에서 사용하지 마세요.

# Electron 설정 가이드

## 설치

먼저 의존성을 설치하세요:

```bash
npm install
```

## 개발 모드 실행

Electron 앱을 개발 모드로 실행하려면:

```bash
npm run electron:dev
```

이 명령어는:
1. Next.js 개발 서버를 시작합니다 (http://localhost:3000)
2. 서버가 준비될 때까지 대기합니다
3. Electron 윈도우를 엽니다

## 프로덕션 빌드

프로덕션 빌드를 만들려면:

```bash
npm run electron:build
```

## macOS 투명 윈도우 기능

이 앱은 macOS의 투명 윈도우 기능을 사용합니다:
- `transparent: true` - 윈도우를 투명하게 만듭니다
- `vibrancy: 'under-window'` - macOS의 vibrancy 효과를 적용합니다
- `frame: false` - 윈도우 프레임을 제거합니다

## 윈도우 설정

현재 윈도우 설정:
- 너비: 600px
- 높이: 200px
- 투명 배경
- 프레임 없음
- 리사이즈 가능

`electron/main.js` 파일에서 윈도우 크기와 설정을 변경할 수 있습니다.

## 문제 해결

### 포트 충돌
만약 포트 3000이 이미 사용 중이라면, Next.js가 다른 포트를 사용할 수 있습니다. 
`electron/main.js`의 `startUrl`을 해당 포트로 변경하세요.

### 투명도가 작동하지 않는 경우
macOS에서 투명 윈도우가 제대로 작동하려면:
1. macOS 10.14 이상이 필요합니다
2. 시스템 설정에서 투명도 효과가 활성화되어 있어야 합니다

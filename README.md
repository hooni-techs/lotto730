# 로또 당첨 콘셉트 웹사이트

종이 로또 용지의 QR 코드를 스캔하면 다음 순서로 진행되는 모바일 웹사이트입니다.

**QR 당첨 확인 → 당첨금 수령 → 명품 가방 당첨 → 브랜드·가방 선택 → "앞을 봐 줘" (현장 스크린에서 영상 재생)**

HTML, CSS, 순수 JavaScript만 사용하고, 백엔드나 빌드 과정 없이 GitHub Pages에 그대로 올려서 씁니다.

---

## 1. 파일 구조

```
├── index.html          # 웹사이트 (단일 페이지, 단계별 화면 전환)
├── style.css           # 디자인
├── script.js           # 화면 전환, 가방 목록, 확인창, 영상 처리
├── config.js           # ★ 문구·로또 번호·가방 목록·마지막 장면 설정 (여기만 고치면 됨)
├── print-lotto.html    # 인쇄용 로또 용지 (QR 포함, 실제 용지와 같은 세로형 80mm × 136mm)
├── .gitignore          # mp4 영상이 실수로 올라가지 않도록 막음
└── assets/
    ├── js/
    │   ├── ticket.js   # 로또 용지 SVG 그리기 (웹 화면과 인쇄용이 같이 사용)
    │   └── qrcode.js   # QR 코드 생성 라이브러리 (qrcode-generator, MIT)
    └── images/         # 가방 사진을 넣는 폴더
```

내 컴퓨터에서 확인할 때는 `index.html`을 브라우저로 열기만 하면 됩니다. 별도 서버는 필요 없습니다.

---

## 2. 마지막 장면: 영상은 현장 스크린에서 (기본값)

영상 파일은 GitHub에 올리지 않습니다. 가방을 고르면 휴대폰에 아래 화면이 순서대로 나옵니다.

1. "마지막으로, 준비된 선물이 하나 더 있어요."
2. 화면이 검게 바뀌고 **"고개를 들어, / 앞을 봐 줘."** 문구가 천천히 나타납니다.

그때 미리 준비한 TV, 빔프로젝터, 노트북 화면에서 직접 영상을 재생하면 됩니다.

**현장 운영 팁**
- 영상을 미리 전체 화면으로 띄워 첫 프레임에 **일시정지**해 두세요. 화면 밝기는 낮추거나 화면을 가려 두는 게 좋습니다.
- 가방 고르는 모습을 옆에서 보다가 "이걸로 결정하기"를 누르면, 약 4초 뒤 "앞을 봐 줘"가 나옵니다. 그 순간 재생하세요.
- 블루투스 리모컨이나 휴대폰 리모컨 앱을 쓰면 자연스럽게 재생할 수 있습니다.

문구는 `config.js`의 `finale`에서 바꿀 수 있습니다.

```js
finale: {
  mode: "screen",          // "screen" = 앞을 봐 줘 / "video" = 휴대폰에서 바로 영상 재생
  lookUpLine1: "고개를 들어,",
  lookUpLine2: "앞을 봐 줘."
},
```

### (선택) 휴대폰에서 영상을 바로 재생하고 싶다면

1. `config.js`에서 `finale.mode`를 `"video"`로 바꿉니다.
2. 영상을 `assets/proposal.mp4`로 넣습니다. 이름만 같으면 코드는 수정하지 않아도 됩니다.
3. 영상을 GitHub에 올리려면 `.gitignore`에서 `*.mp4` 줄을 지웁니다. 외부 주소를 쓸 때는 `video.src`에 전체 URL을 넣으면 됩니다.
4. 영상에 프로포즈 멘트가 들어 있으면 `video.showEndingMessage: false`로 끄세요. 켜 두면 영상이 끝난 뒤 "이제 진짜 선물을 공개할게. / 나랑 결혼해 줄래? ❤️"가 표시됩니다.

이미 구현되어 있는 기능: 모바일 인라인 재생, 원본 비율 유지, 재생 컨트롤과 전체 화면, 자동 재생이 막혔을 때 나오는 재생 버튼, 로딩 실패 시 오류 안내와 재시도.

| 방법 | 장점 | 단점 |
|---|---|---|
| GitHub에 직접 올리기 | 설정이 가장 간단함 | 파일 하나 100MB 제한(웹 업로드는 25MB), 저장소 권장 용량 1GB, 공개 저장소라 누구나 받을 수 있음 |
| 외부 정적 호스팅 (Cloudflare R2, Netlify, Firebase Hosting 등) | 큰 파일도 가능하고 저장소가 가벼움 | 계정 설정이 필요하고, 모바일 재생을 위해 Range 요청을 지원하는지 확인해야 함 |
| 현장 스크린 재생 (기본값) | 용량·네트워크 걱정이 없고 큰 화면으로 볼 수 있음 | 현장에 재생 장비가 있어야 함 |

> 휴대폰 재생용 영상은 H.264 MP4, 1080p 이하, 30~50MB 이내로 압축하는 것을 권장합니다. 예: HandBrake의 "Fast 1080p30" 프리셋.

---

## 3. 자주 바꾸는 설정 (`config.js`)

| 항목 | 설명 |
|---|---|
| `siteUrl` | QR 코드에 넣을 주소. 비워 두면 인쇄 페이지가 열린 주소를 기준으로 자동 계산합니다. |
| `ticket.numbers` | 로또 번호 6개(1~45). 기념일이나 생일 숫자로 바꿔 보세요. 하트 모양 배치는 자동입니다. |
| `ticket.round`, `issuedAt`, `drawDate` … | 용지에 인쇄되는 회차와 날짜 |
| `text` | 각 화면 문구 |
| `brands`, `bags` | 브랜드와 가방 목록. `available: false`면 "COMING SOON · 준비 중" 카드가 되고 선택할 수 없습니다. |

---

## 4. 가방 이미지 넣기

이미지가 없거나 로딩에 실패하면 금색 라인으로 그린 **가방 실루엣**이 자동으로 표시됩니다. 사진이 없어도 화면은 깨지지 않습니다. 브랜드 로고는 그리지 않고 브랜드명만 글자로 표시합니다.

실제 사진을 쓰려면 아래 이름으로 `assets/images/`에 저장하세요. 경로는 `config.js`의 `image`에서 바꿀 수 있습니다.

| 파일명 | 상품 | 찾는 곳 |
|---|---|---|
| `gucci-marmont.jpg` | GG 마몽 숄더백 | gucci.com/kr |
| `gucci-ophidia.jpg` | 오피디아 | gucci.com/kr |
| `lv-alma.jpg` | 알마 BB | kr.louisvuitton.com |
| `lv-neonoe.jpg` | 네오노에 | kr.louisvuitton.com |
| `chanel-classic.jpg` | 클래식 플랩백 | chanel.com/kr |
| `chanel-19.jpg` | 샤넬 19 | chanel.com/kr |
| `prada-galleria.jpg` | 갤러리아 | prada.com/kr |
| `prada-reedition.jpg` | 리에디션 2005 | prada.com/kr |
| `celine-triomphe.jpg` | 트리오페 | celine.com/ko-kr |
| `celine-belt.jpg` | 벨트 백 | celine.com/ko-kr |
| `dior-lady.jpg` | 레이디 디올 | dior.com/ko_kr |
| `dior-booktote.jpg` | 북 토트 | dior.com/ko_kr |

**주의**
- 브랜드 공식 사진은 저작권이 있습니다. 공식 상품 페이지 사진은 이번처럼 **개인적·비상업적 용도로만** 쓰고, 이벤트가 끝나면 저장소를 비공개로 바꾸거나 삭제하는 것을 권장합니다. Unsplash처럼 사용 허가된 사진이나 직접 찍은 사진을 쓰면 더 안전합니다.
- 이미지를 왜곡하거나 로고를 합성하지 마세요.
- 세로 4:5 비율, 긴 변 1000px 이하, 장당 200KB 이하로 줄이면 빠르게 열립니다. 무료 도구 squoosh.app을 쓰면 됩니다.
- 외부 이미지 URL을 그대로 넣어도 됩니다. 링크가 만료되면 실루엣으로 자동 대체됩니다.

---

## 5. GitHub Pages 배포

### ⚠️ 저장소 이름부터 정하세요
QR을 스캔하면 휴대폰 카메라에 **주소가 미리보기로 표시됩니다.**
`proposal`, `marry`, `wedding` 같은 단어가 들어가면 깜짝 이벤트가 들킵니다.
`lotto645`, `lucky-draw`, `lotto-check`처럼 로또와 관련된 이름을 쓰세요. GitHub 아이디도 주소에 함께 보입니다.

### 단계
1. **공개 저장소 만들기**
   GitHub 로그인 → 오른쪽 위 `+` → `New repository` → 이름 입력(예: `lotto645`) → **Public** → `Create repository`
2. **파일 올리기**
   저장소 화면의 `uploading an existing file` → 이 폴더의 **내용물 전체**(index.html, style.css, script.js, config.js, print-lotto.html, README.md, .gitignore, assets 폴더)를 끌어다 놓기 → `Commit changes`
   - 폴더 자체가 아니라 안의 파일들을 올려야 합니다. 저장소 첫 화면에 `index.html`이 바로 보여야 합니다.
   - Git 명령어를 쓴다면:
     ```bash
     git init
     git add .
     git commit -m "first commit"
     git branch -M main
     git remote add origin https://github.com/아이디/lotto645.git
     git push -u origin main
     ```
3. **Pages 켜기**
   저장소 `Settings` → 왼쪽 `Pages` → Source를 `Deploy from a branch`로 설정 → Branch를 `main` / `/(root)`로 선택 → `Save`
4. **주소 확인**
   1~3분 뒤 같은 Pages 화면 위쪽에 `Your site is live at https://아이디.github.io/lotto645/`가 표시됩니다. 이 주소가 최종 주소입니다.
5. **QR 생성과 인쇄**: 아래 6장을 보세요.
6. **실제 휴대폰으로 전체 테스트**: 아래 7장을 보세요.

파일을 수정해서 다시 올리면 1~3분 뒤 반영됩니다. 휴대폰에서 바로 바뀌지 않으면 새로고침하세요.

---

## 6. 로또 용지 인쇄

1. 배포가 끝난 뒤 **배포된 주소의 인쇄 페이지**를 PC에서 엽니다.
   `https://아이디.github.io/lotto645/print-lotto.html`
   → QR 주소가 자동으로 `https://아이디.github.io/lotto645/`로 들어갑니다.
   (또는 `config.js`의 `siteUrl`에 주소를 직접 넣어도 됩니다.)
2. 화면에 보이는 QR을 **휴대폰으로 스캔해서 사이트가 열리는지 꼭 확인**하세요.
3. 번호 6개를 바꾸려면 입력칸에서 고치고 `적용`을 누릅니다. 계속 쓰려면 `config.js`에도 반영하세요.
4. `인쇄하기` → 프린터 설정:
   - 용지 **A4**, 방향 **세로**
   - 배율 **100% / 실제 크기** (페이지에 맞춤 해제)
   - 여백 **없음**, **배경 그래픽 켜기**
5. 점선을 따라 자릅니다. 실제 크기는 80mm × 136mm입니다. 실제 로또는 얇은 흰색 감열지라서 **얇은 흰 종이(70~80g 일반 복사용지)**에 인쇄하면 가장 비슷합니다. 모서리를 살짝 구기거나 반으로 한 번 접으면 더 자연스럽습니다.

> 웹사이트 첫 화면에도 같은 로또 용지가 나오고, "당첨" 도장이 찍히는 확인 연출이 이어집니다.

---

## 7. 테스트 체크리스트

주소 뒤에 `?step=`을 붙이면 원하는 화면부터 볼 수 있습니다.

| 주소 | 화면 |
|---|---|
| `index.html` | 처음부터 (QR 당첨 확인) |
| `index.html?step=win` | 당첨금 수령 |
| `index.html?step=reveal` | 명품 가방 당첨 공개 |
| `index.html?step=shop` | 가방 고르기 |
| `index.html?step=finale` | 앞을 봐 줘 |
| `index.html?step=video` | 영상 재생 (video 모드 확인용) |

- [ ] 인쇄된 용지의 QR → 아이폰 기본 카메라와 갤럭시 카메라에서 모두 열리는지
- [ ] 휴대폰 미리보기 주소에 들킬 만한 단어가 없는지
- [ ] 모든 버튼 동작: 당첨금 수령하기 → 가방 고르러 가기 → 이 가방 고르기 → 이걸로 결정하기 / 다른 가방 보기
- [ ] 에르메스 카드는 눌러도 넘어가지 않는지
- [ ] 휴대폰 뒤로가기를 눌러도 사이트를 벗어나지 않고 이전 화면으로 돌아가는지
- [ ] 현장 스크린의 영상 재생 타이밍 리허설
- [ ] 당일에는 휴대폰 무음 모드와 방해 금지 모드 확인 (카톡 알림이 분위기를 깨지 않도록)

---

## 8. 라이선스 메모
- `assets/js/qrcode.js`: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) © Kazuhiko Arase, MIT License
- 웹 폰트: Google Fonts (Cormorant Garamond, Noto Serif KR, Noto Sans KR, Oswald, Roboto Mono)
- 브랜드명과 모델명은 각 브랜드의 상표입니다. 이 사이트는 개인적인 이벤트용입니다.

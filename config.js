/* =====================================================================
 *  설정 파일 (이 파일만 수정하면 대부분의 내용을 바꿀 수 있습니다)
 *  - index.html 과 print-lotto.html 이 모두 이 파일을 읽습니다.
 * ===================================================================== */
window.SITE_CONFIG = {

  /* ---------------------------------------------------------------
   * 1. 사이트 주소 (QR 코드에 들어갈 주소)
   *    - 비워 두면 print-lotto.html 을 연 주소를 기준으로 자동 계산합니다.
   *      (GitHub Pages 에 배포한 뒤 그 주소에서 print-lotto.html 을 열면 자동으로 맞춰짐)
   *    - 직접 지정하려면 예: "https://아이디.github.io/저장소이름/"
   * --------------------------------------------------------------- */
  siteUrl: "https://hooni-techs.github.io/lotto730/",

  /* ---------------------------------------------------------------
   * 2. 로또 용지 정보
   *    numbers: 1~45 사이 숫자 6개 (의미 있는 날짜 등으로 바꿔 보세요)
   *    하트 모양 배치는 자동으로 계산되며, 작은 수부터 왼쪽 위 → 시계 방향으로 놓입니다.
   * --------------------------------------------------------------- */
  ticket: {
    round: "0730",                     // 회차 (따옴표 안에 쓰면 앞자리 0 도 그대로 인쇄됨)
    numbers: [3, 9, 14, 22, 31, 45],   // 로또 번호 6개
    issuedAt: "2021/07/30 (금) 23시쯤?",
    drawDate: "2026/11/01 (일)",
    payDeadline: "2026/11/07",
    tr: "TR:1633085013",               // 추첨일 옆에 찍히는 거래번호 (아무 숫자)
    codeLine: "56665 97469 47451 82972 58805 10123 51686", // 발행번호 (금액 아래에도 반복 인쇄)
    idLeft: "N5LB7UP2C12CHGFQ",
    idRight: "111003480/0000002017",
    gameLabel: "A",                    // 게임 구분 (A~E)
    price: "₩1,000",                   // 1게임 = 1,000원
    issuer: "동행복권",                 // 로고 위 작은 글씨 (빈칸 "" 이면 생략)
    stripText: "문의안내 1588-6450 ■ 인터넷구매 www.dhlottery.co.kr ■ 문의안내 1588-6450",
    showHeartGuide: true               // 번호 사이 옅은 하트 점선 표시 여부
  },

  /* ---------------------------------------------------------------
   * 3. 화면 문구
   * --------------------------------------------------------------- */
  text: {
    winTitle: "축하합니다!",
    winMessage: "이번 회차 특별 행운의 주인공으로 선정되셨습니다.",
    claimButton: "당첨금 수령하기",
    revealIntro: "축하합니다! 🎉",
    revealTeaser: "특별 당첨 상품은...",
    revealPrize: "명품 가방에 당첨되었습니다!",
    revealSub: "마음에 드는 가방을 직접 골라보세요.",
    confirmTitle: "좋은 선택이에요! ❤️",
    confirmQuestion: "정말 이 가방으로 결정할까요?",
    transition: "마지막으로, 준비된 선물이 하나 더 있어요.",
    endingLine1: "이제 진짜 선물을 공개할게.",
    endingLine2: "나랑 결혼해 줄래? ❤️"
  },

  /* ---------------------------------------------------------------
   * 4. 마지막 장면 방식
   *    "screen" : 휴대폰에는 "앞을 봐 줘" 문구만 띄우고, 영상은 현장 스크린/TV 로 직접 재생 (기본값)
   *    "video"  : 휴대폰에서 바로 영상 재생 (아래 video 설정 사용)
   * --------------------------------------------------------------- */
  finale: {
    mode: "screen",
    lookUpLine1: "고개를 들어,",
    lookUpLine2: "앞을 봐 줘."
  },

  /* ---------------------------------------------------------------
   * 5. 프로포즈 영상 (finale.mode 가 "video" 일 때만 사용)
   *    - 파일을 assets/proposal.mp4 로 덮어쓰면 코드 수정 없이 교체됩니다.
   *    - 외부 호스팅(예: Cloudflare R2, Netlify 등)을 쓰면 전체 URL 을 넣으세요.
   *    - poster: 영상 로딩 전 보여줄 이미지 (없으면 "" )
   * --------------------------------------------------------------- */
  video: {
    src: "assets/proposal.mp4",
    type: "video/mp4",
    poster: "",
    showEndingMessage: true   // 영상 안에 프로포즈 멘트가 있으면 false 로 끄세요
  },

  /* ---------------------------------------------------------------
   * 6. 가방 목록
   *    image: assets/images/ 폴더의 파일 경로 또는 외부 URL.
   *           파일이 없거나 로딩에 실패하면 디자인된 실루엣으로 자동 대체됩니다.
   *    shape: 대체 실루엣 모양 (flap, topHandle, dome, bucket, tote, baguette)
   *    available: false 이면 "COMING SOON · 준비 중" 카드로 표시되고 선택할 수 없습니다.
   * --------------------------------------------------------------- */
  brands: [
    { id: "gucci",  name: "GUCCI",          nameKo: "구찌" },
    { id: "lv",     name: "LOUIS VUITTON",  nameKo: "루이비통" },
    { id: "chanel", name: "CHANEL",         nameKo: "샤넬" },
    { id: "prada",  name: "PRADA",          nameKo: "프라다" },
    { id: "celine", name: "CELINE",         nameKo: "셀린느" },
    { id: "dior",   name: "DIOR",           nameKo: "디올" },
    { id: "hermes", name: "HERMÈS",         nameKo: "에르메스" }
  ],

  bags: [
    {
      brand: "gucci", model: "GG 마몽 숄더백", modelEn: "GG Marmont",
      desc: "부드러운 마틀라세 퀼팅 위 더블 G. 데일리부터 특별한 날까지 자연스럽게.",
      image: "assets/images/gucci-marmont.jpg", shape: "flap", available: true
    },
    {
      brand: "gucci", model: "오피디아 GG", modelEn: "Ophidia",
      desc: "웹 스트라이프와 GG 캔버스, 오래 들어도 질리지 않는 클래식.",
      image: "assets/images/gucci-ophidia.jpg", shape: "baguette", available: true
    },
    {
      brand: "lv", model: "알마 BB", modelEn: "Alma BB",
      desc: "둥근 돔 실루엣의 아이코닉 백. 단정하지만 존재감 있는 하루를 위해.",
      image: "assets/images/lv-alma.jpg", shape: "dome", available: true
    },
    {
      brand: "lv", model: "네오노에", modelEn: "NéoNoé",
      desc: "가볍게 메는 버킷 백. 편안함과 우아함을 동시에.",
      image: "assets/images/lv-neonoe.jpg", shape: "bucket", available: true
    },
    {
      brand: "chanel", model: "클래식 플랩백", modelEn: "Classic Flap",
      desc: "다이아몬드 퀼팅과 CC 턴락, 시간이 지나도 변하지 않는 우아함.",
      image: "assets/images/chanel-classic.jpg", shape: "flap", available: true
    },
    {
      brand: "chanel", model: "샤넬 19", modelEn: "CHANEL 19",
      desc: "부드럽게 부푼 퀼팅과 믹스 체인, 조금 더 여유로운 샤넬.",
      image: "assets/images/chanel-19.jpg", shape: "flap", available: true
    },
    {
      brand: "prada", model: "갤러리아", modelEn: "Galleria",
      desc: "구조적인 사피아노 가죽. 단정한 하루의 완성.",
      image: "assets/images/prada-galleria.jpg", shape: "topHandle", available: true
    },
    {
      brand: "prada", model: "리에디션 2005", modelEn: "Re-Edition 2005",
      desc: "나일론과 가죽의 미니멀한 조화, 가볍고 모던한 무드.",
      image: "assets/images/prada-reedition.jpg", shape: "baguette", available: true
    },
    {
      brand: "celine", model: "트리오페 숄더백", modelEn: "Triomphe",
      desc: "트리오페 잠금장치가 돋보이는 절제된 고급스러움.",
      image: "assets/images/celine-triomphe.jpg", shape: "flap", available: true
    },
    {
      brand: "celine", model: "벨트 백", modelEn: "Belt Bag",
      desc: "벨트 디테일의 부드러운 곡선, 손에 드는 순간 완성되는 실루엣.",
      image: "assets/images/celine-belt.jpg", shape: "topHandle", available: true
    },
    {
      brand: "dior", model: "레이디 디올", modelEn: "Lady Dior",
      desc: "까나쥬 스티칭과 D.I.O.R. 참, 가장 여성스러운 하우스 아이콘.",
      image: "assets/images/dior-lady.jpg", shape: "topHandle", available: true
    },
    {
      brand: "dior", model: "북 토트", modelEn: "Book Tote",
      desc: "자수로 완성된 넉넉한 토트, 여행에도 일상에도.",
      image: "assets/images/dior-booktote.jpg", shape: "tote", available: true
    },
    {
      brand: "hermes", model: "버킨 · 켈리", modelEn: "Birkin · Kelly",
      desc: "곧 만나보실 수 있어요.",
      image: "", shape: "topHandle", available: false
    }
  ]
};

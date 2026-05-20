import type { Locale } from "./i18n";

type LocalizedText = Record<Locale, string>;

export type WorldMapStageLength = "short" | "medium" | "long" | "marathon";
export type WorldMapControlMode = "pc" | "mobile" | "either";

export type WorldMapStageDetail = {
  area: LocalizedText;
  tagline: LocalizedText;
  mood: LocalizedText;
  badge: LocalizedText;
  difficulty: number;
  energy: number;
  length: WorldMapStageLength;
  recommendedMode: WorldMapControlMode;
  missionCount: number;
  secretCount: number;
  reward: LocalizedText;
  gimmicks: LocalizedText[];
  missions: LocalizedText[];
  accent: string;
};

export type WorldMapUiText = {
  daily: string;
  route: string;
  difficulty: string;
  tempo: string;
  length: string;
  control: string;
  missions: string;
  gimmicks: string;
  reward: string;
  secrets: string;
  ghostReady: string;
  ghostEmpty: string;
  ghostLoading: string;
  clearStamp: string;
  visited: string;
  unvisited: string;
  favorite: string;
  favoriteSet: string;
  random: string;
  quickStart: string;
  previous: string;
  next: string;
  lengthLabels: Record<WorldMapStageLength, string>;
  controlLabels: Record<WorldMapControlMode, string>;
};

const text = (ja: string, en: string, zh = en, ko = en): LocalizedText => ({ ja, en, zh, ko });

export const WORLD_MAP_UI_TEXT: Record<Locale, WorldMapUiText> = {
  ja: {
    daily: "本日の注目",
    route: "ルート",
    difficulty: "難度",
    tempo: "テンポ",
    length: "長さ",
    control: "推奨",
    missions: "ミッション",
    gimmicks: "ギミック",
    reward: "ごほうび",
    secrets: "秘密",
    ghostReady: "ランキングゴーストあり",
    ghostEmpty: "ランキングゴーストなし",
    ghostLoading: "ゴースト確認中",
    clearStamp: "CLEARスタンプ獲得",
    visited: "訪問済み",
    unvisited: "未訪問",
    favorite: "お気に入り",
    favoriteSet: "お気に入り中",
    random: "おまかせ",
    quickStart: "このステージへ",
    previous: "前へ",
    next: "次へ",
    lengthLabels: {
      short: "短め",
      medium: "標準",
      long: "長め",
      marathon: "ロング",
    },
    controlLabels: {
      pc: "PC",
      mobile: "スマホ",
      either: "どちらも",
    },
  },
  en: {
    daily: "Daily Pick",
    route: "Route",
    difficulty: "Difficulty",
    tempo: "Tempo",
    length: "Length",
    control: "Best on",
    missions: "Missions",
    gimmicks: "Gimmicks",
    reward: "Reward",
    secrets: "Secrets",
    ghostReady: "Leaderboard ghosts ready",
    ghostEmpty: "No leaderboard ghosts",
    ghostLoading: "Checking ghosts",
    clearStamp: "CLEAR stamp earned",
    visited: "Visited",
    unvisited: "New stop",
    favorite: "Favorite",
    favoriteSet: "Favorited",
    random: "Random",
    quickStart: "Enter stage",
    previous: "Previous",
    next: "Next",
    lengthLabels: {
      short: "Short",
      medium: "Medium",
      long: "Long",
      marathon: "Marathon",
    },
    controlLabels: {
      pc: "PC",
      mobile: "Mobile",
      either: "Either",
    },
  },
  zh: {
    daily: "今日推荐",
    route: "路线",
    difficulty: "难度",
    tempo: "节奏",
    length: "长度",
    control: "推荐",
    missions: "任务",
    gimmicks: "机关",
    reward: "奖励",
    secrets: "秘密",
    ghostReady: "有排行榜幽灵",
    ghostEmpty: "暂无排行榜幽灵",
    ghostLoading: "正在确认幽灵",
    clearStamp: "CLEAR印章已获得",
    visited: "已到访",
    unvisited: "新地点",
    favorite: "收藏",
    favoriteSet: "已收藏",
    random: "随机",
    quickStart: "进入关卡",
    previous: "上一站",
    next: "下一站",
    lengthLabels: {
      short: "短",
      medium: "标准",
      long: "较长",
      marathon: "长跑",
    },
    controlLabels: {
      pc: "电脑",
      mobile: "手机",
      either: "皆可",
    },
  },
  ko: {
    daily: "오늘의 추천",
    route: "루트",
    difficulty: "난도",
    tempo: "템포",
    length: "길이",
    control: "추천",
    missions: "미션",
    gimmicks: "기믹",
    reward: "보상",
    secrets: "비밀",
    ghostReady: "랭킹 고스트 있음",
    ghostEmpty: "랭킹 고스트 없음",
    ghostLoading: "고스트 확인 중",
    clearStamp: "CLEAR 스탬프 획득",
    visited: "방문 완료",
    unvisited: "새 지점",
    favorite: "즐겨찾기",
    favoriteSet: "즐겨찾기 중",
    random: "랜덤",
    quickStart: "스테이지로",
    previous: "이전",
    next: "다음",
    lengthLabels: {
      short: "짧음",
      medium: "보통",
      long: "김",
      marathon: "롱런",
    },
    controlLabels: {
      pc: "PC",
      mobile: "모바일",
      either: "모두",
    },
  },
};

const WORLD_MAP_STAGE_DETAILS: Record<string, WorldMapStageDetail> = {
  originalDowntown: {
    area: text("ウェルカム・ダウンタウン", "Welcome Downtown"),
    tagline: text("公園入口から始まる王道ラン。踏み、拾い、走る基本が全部入っています。", "A classic opening run with stomps, pickups, and clean routes."),
    mood: text("ネオン下町", "Neon downtown"),
    badge: text("入口", "Gate"),
    difficulty: 2,
    energy: 54,
    length: "medium",
    recommendedMode: "either",
    missionCount: 3,
    secretCount: 2,
    reward: text("初回スタンプと基礎ルート練習", "First stamp and route practice"),
    gimmicks: [text("踏みつけ", "Stomps"), text("コイン列", "Coin trails"), text("チェックポイント", "Checkpoints")],
    missions: [text("敵を3体踏む", "Stomp 3 enemies"), text("コイン列を1本取り切る", "Clear one coin trail"), text("ノーダメで中間へ", "Reach midpoint hitless")],
    accent: "#60a5fa",
  },
  neoShibuyaCity: {
    area: text("ネオ・シブヤ交差点", "Neo Shibuya Crossing"),
    tagline: text("看板の明かりと高低差を抜ける、見た目も手触りも派手な街ステージ。", "A flashy city course built around height changes and sign-lit routes."),
    mood: text("都市パレード", "City parade"),
    badge: text("街", "City"),
    difficulty: 3,
    energy: 72,
    length: "long",
    recommendedMode: "pc",
    missionCount: 4,
    secretCount: 3,
    reward: text("高スコア向けルート候補", "High-score route practice"),
    gimmicks: [text("大砲", "Cannons"), text("分岐ルート", "Branch routes"), text("高所ジャンプ", "High jumps")],
    missions: [text("大砲地帯を突破", "Pass the cannon zone"), text("上ルートに入る", "Find the upper route"), text("秘密の足場を踏む", "Touch a secret platform")],
    accent: "#f472b6",
  },
  mobileTouchTutorial: {
    area: text("スマホ練習ひろば", "Touch Practice Plaza"),
    tagline: text("スマホ操作と横画面プレイを落ち着いて試せる、短めのチュートリアル。", "A shorter tutorial stop for mobile controls and landscape play."),
    mood: text("練習日和", "Practice day"),
    badge: text("練習", "Practice"),
    difficulty: 1,
    energy: 36,
    length: "short",
    recommendedMode: "mobile",
    missionCount: 2,
    secretCount: 1,
    reward: text("スマホ操作の感覚合わせ", "Mobile control warmup"),
    gimmicks: [text("仮想スティック", "Virtual stick"), text("短距離ゴール", "Short goal"), text("安全な足場", "Safe platforms")],
    missions: [text("スマホ操作でゴール", "Finish on mobile"), text("ジャンプ台を試す", "Try a spring")],
    accent: "#34d399",
  },
  skybridgeSprint: {
    area: text("スカイブリッジ・スプリント", "Skybridge Sprint"),
    tagline: text("足を止めずに抜けたい高速橋。ダッシュ管理が気持ちよく決まるコース。", "A fast bridge course where stamina routing feels good."),
    mood: text("疾走", "Sprint"),
    badge: text("橋", "Bridge"),
    difficulty: 3,
    energy: 86,
    length: "medium",
    recommendedMode: "pc",
    missionCount: 4,
    secretCount: 2,
    reward: text("ダッシュ温存テクニック練習", "Dash stamina technique practice"),
    gimmicks: [text("ダッシュリング", "Dash rings"), text("落ちる足場", "Falling platforms"), text("空中ルート", "Air routes")],
    missions: [text("リングを2個通る", "Hit 2 rings"), text("落ちる足場を戻らず突破", "Clear falling platforms without backtracking"), text("スタミナを残してゴール", "Finish with stamina left")],
    accent: "#f59e0b",
  },
  skyShaftClimb: {
    area: text("スカイシャフト・クライム", "Sky Shaft Climb"),
    tagline: text("縦に登るアスレチック。落下復帰とジャンプの判断が主役です。", "A vertical athletic course about recovery and jump decisions."),
    mood: text("上昇気流", "Updraft"),
    badge: text("塔", "Tower"),
    difficulty: 4,
    energy: 68,
    length: "long",
    recommendedMode: "pc",
    missionCount: 4,
    secretCount: 4,
    reward: text("空中ジャンプ判断の練習", "Air-jump decision practice"),
    gimmicks: [text("縦スクロール", "Vertical climb"), text("隠しブロック", "Hidden blocks"), text("一方通行ゲート", "One-way gates")],
    missions: [text("上ルートを維持", "Hold the upper route"), text("隠しブロックを見つける", "Find a hidden block"), text("落下後に復帰", "Recover after a fall")],
    accent: "#22d3ee",
  },
  nightmareLongrun: {
    area: text("絶望ロングラン", "Nightmare Longrun"),
    tagline: text("長くて濃い挑戦コース。敵配置、補給、リスク判断を全部試されます。", "A dense endurance challenge with enemies, pickups, and route risk."),
    mood: text("耐久戦", "Endurance"),
    badge: text("長距離", "Longrun"),
    difficulty: 5,
    energy: 94,
    length: "marathon",
    recommendedMode: "pc",
    missionCount: 5,
    secretCount: 5,
    reward: text("ロングラン踏破スタンプ", "Endurance clear stamp"),
    gimmicks: [text("敵ラッシュ", "Enemy rush"), text("回復アイテム", "Recovery items"), text("秘密エリア", "Secret area")],
    missions: [text("中間までノーミス", "No miss to midpoint"), text("秘密エリアに入る", "Enter a secret area"), text("連続踏みを決める", "Chain stomps")],
    accent: "#a78bfa",
  },
  monsterHouse: {
    area: text("モンスターハウス", "Monster House"),
    tagline: text("敵だらけの実験場。踏みつけボーナスと無敵の使い方が光ります。", "An enemy-heavy arena for stomp bonuses and invincibility choices."),
    mood: text("わちゃわちゃ", "Mayhem"),
    badge: text("敵", "Enemy"),
    difficulty: 4,
    energy: 90,
    length: "medium",
    recommendedMode: "either",
    missionCount: 5,
    secretCount: 2,
    reward: text("連続踏みスコア練習", "Stomp-chain score practice"),
    gimmicks: [text("敵の種類追加", "Enemy variety"), text("スター無敵", "Star invincibility"), text("踏みジャンプ", "Stomp jumps")],
    missions: [text("連続踏みを3回つなぐ", "Chain 3 stomps"), text("スター中に突破", "Push through with star"), text("被弾せず敵地帯を抜ける", "Clear the mob hitless")],
    accent: "#fb7185",
  },
  rankingCheck: {
    area: text("ランキング確認ステージ", "Ranking Check Stage"),
    tagline: text("すぐゴールして登録を試すための短距離ステージ。ゴースト確認にも便利です。", "A tiny course for score submission and ghost checks."),
    mood: text("記録確認", "Score check"),
    badge: text("確認", "Check"),
    difficulty: 1,
    energy: 28,
    length: "short",
    recommendedMode: "either",
    missionCount: 2,
    secretCount: 0,
    reward: text("ゴースト保存テスト", "Ghost save test"),
    gimmicks: [text("即ゴール", "Quick goal"), text("アイテム確認", "Item check"), text("ランキング登録", "Leaderboard submit")],
    missions: [text("ランキング登録を確認", "Confirm leaderboard submit"), text("ゴーストを保存確認", "Verify ghost save")],
    accent: "#fde047",
  },
};

const FALLBACK_STAGE_DETAIL: WorldMapStageDetail = {
  area: text("未登録エリア", "Uncharted Area"),
  tagline: text("まだ案内板が準備中のステージです。まずは入って手触りを確かめましょう。", "This stop is still being mapped. Jump in and feel it out."),
  mood: text("調査中", "Survey"),
  badge: text("新規", "New"),
  difficulty: 2,
  energy: 50,
  length: "medium",
  recommendedMode: "either",
  missionCount: 3,
  secretCount: 1,
  reward: text("探索メモ", "Explorer note"),
  gimmicks: [text("探索", "Explore"), text("コイン", "Coins"), text("ゴール", "Goal")],
  missions: [text("ステージを下見する", "Scout the stage"), text("安全ルートを探す", "Find a safe route")],
  accent: "#93c5fd",
};

export function getWorldMapStageDetail(stageId: string) {
  return WORLD_MAP_STAGE_DETAILS[stageId] ?? FALLBACK_STAGE_DETAIL;
}

export function getWorldMapUiText(locale: Locale) {
  return WORLD_MAP_UI_TEXT[locale] ?? WORLD_MAP_UI_TEXT.ja;
}

export function getWorldMapDailyStageId(stageIds: string[], date = new Date()) {
  if (stageIds.length === 0) {
    return "";
  }
  const day = Math.floor(date.getTime() / 86_400_000);
  return stageIds[Math.abs(day) % stageIds.length];
}

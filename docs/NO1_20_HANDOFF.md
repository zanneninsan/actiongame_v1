# No1-No20 Handoff / 作業引き継ぎ

この資料は、新しい Codex コンテキストで No1-No20 の作業を再開するための作業台帳です。

元の No1-No20 の正式リストはリポジトリ内では見つかっていません。ここでは、これまでの会話・実装履歴・`RELEASE_NOTES.md` から復元した現在版として扱ってください。新しいセッションでは、最初に `docs/CODEX_HANDOFF.md` とこのファイルを読んでから作業してください。

## 現在の基準状態

- 最新デプロイ済み main: `v0.1.253`
- Firebase Hosting: `https://zannenin-sisters-leaderboard.web.app/`
- Firebase project: `zannenin-sisters-leaderboard`
- 直近の main 反映済み内容:
  - 踏み後無料ジャンプ
  - 踏み直後の連続踏みコンボ維持
  - スタート画面の省スペース化
  - ランキングゴーストの保存・選択・検証
  - ランキング確認用ステージ `rankingCheck`

## No1-No20 状況

| No | 機能 / テーマ | 状況 | メモ |
| --- | --- | --- | --- |
| 1 | 敵の踏みつけ撃破 | Closed | 上から踏んだ時に撃破する基本挙動は実装済み。複数敵が固まるケースの当たり判定も改善済み。 |
| 2 | ステージ編集状態の保持 | Closed | Rキー・miss restart で編集ステージが失われない修正は取り込み済み。ユーザー判断で No2 はクローズ済み。 |
| 3 | ジャンプ台のタイミング大ジャンプ | Closed | 緑系の大ジャンプ床、タイミング緩和、床接触中の判定、演出追加まで実装済み。 |
| 4 | 通常ジャンプ / 加速ジャンプ調整 | Closed | 通常ジャンプ力と加速中ジャンプ力を微増。後続でジャンプ段階も再整理済み。 |
| 5 | 空中ジャンプ・ダッシュのスタミナ制 | Closed | スタミナ100、空中ジャンプ/ダッシュ消費、地上回復、しゃがみ2倍回復、頭上ゲージ表示まで実装済み。 |
| 6 | HUDのレスポンシブ拡大 | Closed | プレイヤー名、スコア、スタミナ、操作ヒントなどを画面サイズに応じて拡大。 |
| 7 | ダッシュ消費とダッシュ残り時間 | Closed | ダッシュ消費を半減。Shiftを離した後も短く慣性が残り、細かく押すテクニックを許容。 |
| 8 | リプレイゴーストJSON | Closed | 操作記録、ゴール後JSON出力、スタート画面でJSON読込まで実装済み。出力ボタン位置も誤爆しづらく調整済み。 |
| 9 | ランキング上位ゴーストのFirebase保存 | Closed | 10位以内かつベスト更新時に `leaderboardGhosts` へ保存。Firestore保存形式は `compact-v2`。 |
| 10 | スタート画面からランキングゴースト選択 | Closed | セレクトBOXはデフォルト未選択。選択した時点で即読み込み。専用読込ボタンは削除済み。 |
| 11 | ランキングゴーストの保存確認 | Closed | スコア登録後に、実際にFirebaseからゴーストを読めるか確認して結果を表示。 |
| 12 | ランキング不整合対策 | Closed | `hasGhost` だけ残った古いデータは候補から除外。保存本体とフラグはbatchでatomic化。 |
| 13 | ランキング確認用ステージ | Closed | `rankingCheck` を追加。短距離、ゴール近め、アイテム複数、敵なし。Functions側の許可ステージにも追加済み。 |
| 14 | Firebase手動デプロイ手順 | Closed | `docs/CODEX_HANDOFF.md` に Hosting/Functions/Firestore をまとめて `firebase deploy` する手順を記載済み。 |
| 15 | 環境変数・Firebase設定確認 | Closed | `VITE_FIREBASE_*` はビルド時に注入される前提。公開キー相当のFirebase client configは秘密ではないが、漏洩確認は実施済み。 |
| 16 | プレイヤー仕様ページ | In Progress | `public/player-spec/index.html` は存在。ゲーム内ヘルプではなくサイト内Webページの方針。ただし、スタート画面からの「ゲーム仕様」リンクは邪魔なので削除済み。今後は別導線を検討。 |
| 17 | コアプレイヤー向け仕様説明書 | In Progress | 仕様説明ページの立ち位置は「コアなプレイヤー向け」。連続踏み、スタミナ、ジャンプ台、ゴースト、ランキングなどの仕様を整理して追記していく余地あり。 |
| 18 | 連続踏みボーナス | Active Watch | 実装は残っている。`rewardSystem.ts` で 1400ms 以内の連続撃破に倍率。着地でリセット。直近で踏み後無料ジャンプ中の一瞬の着地判定ではリセットしないよう修正済み。体感確認が必要。 |
| 19 | 踏み後無料ジャンプ | Closed / Needs Feel Check | 敵踏み後420ms以内にジャンプ入力するとスタミナ消費なしで再ジャンプ。W/スペース/モバイル対応。操作感は実機確認推奨。 |
| 20 | 残タスク一覧の運用 | Open | 「クローズ都度、残りタスクを一覧表示」運用は会話内で継続。新コンテキストでは、この表を更新しながら進める。 |

## 重要な仕様メモ

### 連続踏みボーナス

- 実装: `src/rewardSystem.ts`
- 定数: `ENEMY_STOMP_COMBO_MS = 1400`
- 仕様:
  - 前回の敵撃破から1400ms以内ならコンボ継続
  - スコアは `敵の基礎踏みスコア * コンボ数`
  - 表示は `+点数 xコンボ数`
  - 地面に着地するとコンボリセット
  - ただし踏み後無料ジャンプ受付中は、一瞬の着地判定ではリセットしない
- 注意:
  - 現在の `addEnemyDefeatScore()` は「踏み」以外のスター撃破でも呼ばれる。純粋に踏みコンボだけにしたい場合は、呼び出し元を分ける必要がある。

### 踏み後無料ジャンプ

- 実装: `src/main.ts`
- 定数: `STOMP_FREE_JUMP_BUFFER_MS = 420`
- 仕様:
  - 敵踏み成功後420ms以内にジャンプ入力すると、スタミナ消費なしでジャンプ
  - 1回使うと受付を消す
  - ミス、リスタート、時間切れでは受付をリセット

### ランキングゴースト

- Client:
  - `src/leaderboard.ts`
  - `src/startModal.ts`
  - `src/leaderboardUi.ts`
- Functions:
  - `functions/src/index.ts`
  - `functions/src/leaderboardValidation.ts`
- Firestore:
  - `leaderboardScores`
  - `leaderboardGhosts`
- 保存形式:
  - `compact-v2`
  - Firestoreは配列の中の配列を保存できないため、framesは配列の中のmap形式
- 確認用ステージ:
  - `rankingCheck`

## 新コンテキストで最初にやること

1. `docs/CODEX_HANDOFF.md` を読む。
2. この `docs/NO1_20_HANDOFF.md` を読む。
3. `git status --short --branch` を確認する。
4. 必要なら `git fetch origin` して、作業ブランチと `main` の差分を見る。
5. No18 / No19 の体感確認から再開するのが自然。

## よく使うコマンド

```powershell
npm run build
npm --prefix functions test
firebase deploy --project zannenin-sisters-leaderboard
firebase deploy --only functions --project zannenin-sisters-leaderboard
```

## データリセットメモ

ランキング確認でデータを消したい場合:

```powershell
firebase firestore:delete leaderboardScores --recursive --force --project zannenin-sisters-leaderboard
firebase firestore:delete leaderboardGhosts --recursive --force --project zannenin-sisters-leaderboard
```

特定プレイヤーだけ消す場合は、ドキュメントIDが `${stageId}_${playerId}` 形式なので、全ステージ分を削除する。

## 次に検証したいこと

- No18: 敵を連続で踏んだ時、必ず `x2`, `x3` の表示とスコア加算が出るか。
- No19: 踏み後無料ジャンプの420msが短すぎないか、長すぎないか。
- No18/19: 無料ジャンプ後に次の敵を踏んだ場合、着地せずにコンボ継続するか。
- ランキングゴースト: `rankingCheck` で1位登録後、`ランキングゴーストを保存確認しました。` が出るか。
- リロード後、スタート画面のランキングゴーストselectに候補が出て、選択した瞬間に読み込まれるか。

# No1-No20 Feature Handoff

このファイルは、新しい Codex コンテキストで No1-No20 の機能確認と追加対応を続けるための引き継ぎ資料です。

ここにある一覧を No1-No20 の正本として扱ってください。以前の復元メモには別作業が混ざっていたため、ユーザーが提示した No1-No20 の表を基準に、コード確認で分かった実装状況を追記しています。

## Current Status

| No | 機能 | 状況 | コード確認メモ |
| --- | --- | --- | --- |
| 1 | 踏みつけ撃破 | クローズ | ユーザー判断で完全クローズ。 |
| 2 | 連続踏みボーナス | 確認中 | `src/rewardSystem.ts` に実装あり。効かない場面がある疑いを継続確認。 |
| 3 | ジャンプ台 | 未確認 | 実装はあるが、この台帳では未確認扱いのまま。 |
| 4 | 落ちる足場 | 実装済・要実機確認 | `fragile` platform として実装・配置あり。 |
| 5 | コイン列 | 実装済・要実機確認 | `coin` item と複数配置あり。 |
| 6 | 隠しブロック | 実装済・要実機確認 | `hidden` bonus block と報酬排出あり。 |
| 7 | はてなブロック | 実装済・要実機確認 | `question` bonus block と報酬排出あり。 |
| 8 | パワーアップアイテム | 実装済・要実機確認 | `powerSpeed` / `powerJump` / `star` / `dashRing` が実装済み。 |
| 9 | スター無敵 | 実装済・要実機確認 | `starPowerUntil` による無敵と接触撃破あり。 |
| 10 | ダッシュリング | 実装済・要実機確認 | `dashRing` item 取得で速度ブーストあり。 |
| 11 | チェックポイント旗 | 実装済・要実機確認 | `CheckpointController` とステージ配置あり。 |
| 12 | ステージ内分岐ルート | 要確認 | 専用システムではなくステージ設計として確認が必要。 |
| 13 | 秘密エリア | 要確認 | 隠しブロック等の部品はあるが、秘密エリアとしての完成確認が必要。 |
| 14 | ゴール評価 | 実装済・表示オフ | ランク計算はあるが `SHOW_CLEAR_RANK_AND_MISSIONS = false`。 |
| 15 | 中間ミニチャレンジ | 未確認 | 専用システムは未確認。ステージ設計で表現している可能性あり。 |
| 16 | 敵の種類追加 | 実装済・要実機確認 | 複数敵タイプとAIが実装済み。 |
| 17 | 砲台・飛び道具ギミック | 実装済・要実機確認 | shooter / turret / projectile 系が実装済み。 |
| 18 | 壊せるブロック | 実装済・要実機確認 | `breakable` bonus block が実装済み。 |
| 19 | 一方通行ゲート | 実装済・要実機確認 | `OneWayGateController` とステージ配置あり。 |
| 20 | ステージミッション | 実装済・表示オフ/要設計 | ミッションまとめ計算はあるが、クリア表示は現在オフ。 |

## Progress Rules

- 作業はこの表の No を基準に進めます。
- 1つクローズするたびに、この表の状況を更新します。
- クローズ都度、残りタスク一覧をユーザーに表示します。
- 実装済みかどうかの確認は、コードと実機確認の両方で行います。
- 「実装済・要実機確認」は、コード上の機能は確認できたが、ユーザー体感でクローズしていない状態です。

## Implementation Notes

### No4 落ちる足場

- 実装: `src/stageInteractives.ts` の fragile platform。
- 定義: `src/assets.ts` の `FragilePlatformConfig` と `PlatformRunPlacement.fragile`。
- 描画: `src/stageRenderer.ts` で fragile 足場に色付けし、hitbox に `platformBehavior = "fragile"` を設定。
- 挙動: プレイヤーが上から乗ると `queueFragilePlatformCollapse()` が走り、猶予後に足場を消し、指定時間後に復活する。
- ステージ配置: `src/stages.ts` に `fragile: { delayMs, respawnMs }` の配置あり。
- 要確認: 体感の猶予、復活タイミング、リスタート時の初期化、敵やアイテムとの重なり。

### No5 コイン列

- 実装: `src/items.ts` の通常アイテム収集処理。
- 定義: `src/assets.ts` の `ItemType = "coin"`、`ITEM_DEFINITIONS.coin.points = 25`。
- ステージ配置: `src/stages.ts` に複数の `coin` 配置あり。弧状・列状の配置も確認できる。
- 取得時: スコア加算、取得演出、効果音、ミッション用のコイン数カウントがある。
- 要確認: 「列を取り切ったボーナス」は現状なし。必要なら追加仕様として扱う。

### No6 隠しブロック

- 実装: `src/bonusBlocks.ts` の `hidden` block。
- 定義: `src/assets.ts` の `BonusBlockPlacement.type = "hidden"`。
- 挙動: 初期状態では非表示。下から叩くと表示され、使用済みになり、報酬があれば排出する。
- ステージ配置: `src/stages.ts` に `hidden` 配置あり。
- 要確認: 発見しやすさ、出現時のめり込み、リスタート時の復元。

### No7 はてなブロック

- 実装: `src/bonusBlocks.ts` の `question` block。
- 定義: `src/assets.ts` の `BonusBlockPlacement.type = "question"`。
- 挙動: 下から叩くと使用済みになり、指定報酬を排出する。
- ステージ配置: `src/stages.ts` に `question` 配置あり。
- 要確認: 見た目が使用前/使用後で十分分かるか、連打で多重報酬が出ないか。

### No8 パワーアップアイテム

- 実装: `src/rewardSystem.ts` の `applyPowerup()`。
- 対象: `powerSpeed`, `powerJump`, `star`, `dashRing`。
- 効果時間: speed/jump/star は 9000ms。dashRing は 900ms。
- 効果:
  - `powerSpeed`: 速度倍率。
  - `powerJump`: ジャンプ倍率。
  - `star`: 無敵タイマー。
  - `dashRing`: 即時横速度付与と短時間速度倍率。
- 要確認: 効果中の見た目が十分か、複数取得時の上書き体感、終了タイミングの分かりやすさ。

### No9 スター無敵

- 実装: `src/rewardSystem.ts` の `starPowerUntil` と `isStarActive()`。
- 接続: `src/main.ts` の `damagePlayer()` でスター中に敵へ触れると、被弾せず敵を撃破する。
- スコア: スター接触撃破でも `addEnemyDefeatScore()` が呼ばれる。
- 要確認: 連続踏みボーナス扱いに含めてよいか、無敵終了直後の被弾体感、穴落ちなどは防げない点の見せ方。

### No10 ダッシュリング

- 実装: `src/rewardSystem.ts` の `dashRingBoostUntil`。
- 定義: `src/assets.ts` の `ItemType = "dashRing"`。
- 挙動: 取得時に向いている方向へ `DASH_RING_VELOCITY_X = 720` を付与し、900ms の速度倍率を付ける。
- ステージ配置: `src/stages.ts` に `dashRing` 配置あり。
- 要確認: リング型ギミックというより現状は取得アイテム。通過リングにしたい場合は追加対応が必要。

### No11 チェックポイント旗

- 実装: `src/stageInteractives.ts` の `CheckpointController`。
- 定義: `src/assets.ts` の `CheckpointPlacement` と `StageDefinition.checkpoints`。
- 挙動: 接触するとステージIDごとに復帰地点を保存し、以降の再開位置に使う。
- 表示: 旗画像、起動時の色変更、`CHECK` / `チェック` の浮遊テキスト。
- 要確認: スコア/取得済みアイテム/倒した敵/足場状態は完全なチェックポイント復元ではなく、主に復帰位置の保存。仕様としてこれでよいか確認。

### No12 ステージ内分岐ルート

- 実装状況: 専用の分岐システムは見つけていない。
- 関連部品: 足場配置、ジャンプ台、ダッシュリング、隠しブロック、一方通行ゲート、チェックポイントで分岐ルートは構成可能。
- 要確認: 実際のステージに「通常ルート/高難度ルート/報酬ルート」と呼べる導線が成立しているか。
- 次に見る場所: `src/stages.ts` のステージ配置。

### No13 秘密エリア

- 実装状況: 秘密エリア専用のデータ型や判定は見つけていない。
- 関連部品: `hidden` block、`breakable` block、分岐ルート、報酬アイテム。
- 要確認: 既存ステージ上に秘密エリアとしてプレイヤーに伝わる場所があるか。なければ追加ステージ設計が必要。

### No14 ゴール評価

- 実装: `src/rewardSystem.ts` の `getClearRank()`。
- 評価: ノーダメージ、残り時間55%以上、スコアしきい値から S/A/B/C を算出。
- 接続: `src/main.ts` の `win()` で計算している。
- 現状: `SHOW_CLEAR_RANK_AND_MISSIONS = false` のため、クリア画面には表示されない。
- 要確認: 表示を戻すか、ランキング/リザルトUIと合わせて見せ方を再設計するか。

### No15 中間ミニチャレンジ

- 実装状況: 専用のミニチャレンジ開始/成功/失敗システムは未確認。
- 関連部品: 落ちる足場、コイン列、ダッシュリング、敵連続踏み、チェックポイント。
- 要確認: ステージ配置としてミニチャレンジ的な区間があるか。報酬や成功判定が必要なら新規実装。

### No16 敵の種類追加

- 実装: `src/assets.ts` の `EnemyType` / `EnemyAiType`、`src/enemies.ts`。
- 敵タイプ: `knifePunk`, `aquaMascot`, `hornedCyborg`, `coneGolem`, `rabbitTraveler`, `neonIdolShooter`, `heartCannonTurret`。
- AI: patrol, flyingPatrol, hoppingPatrol, chase, shooter, turret, stationary など。
- ステージ配置: `src/stages.ts` に複数タイプ配置あり。
- 要確認: 各敵の踏みやすさ、被弾判定、難易度、連続踏みボーナスとの相性。

### No17 砲台・飛び道具ギミック

- 実装: `src/enemies.ts` の shooter / turret / projectile / cannonProjectile。
- 敵: `neonIdolShooter` はハート弾、`heartCannonTurret` は砲台弾を発射する。
- 掃除: 弾はステージ外や下限を超えると破棄される。
- ステージ配置: `src/stages.ts` に shooter / turret 配置あり。
- 要確認: 弾がプレイヤーにとって避けやすいか、スター中の扱い、低FPS時のすり抜け。

### No18 壊せるブロック

- 実装: `src/bonusBlocks.ts` の `breakable` block。
- 定義: `src/assets.ts` の `BonusBlockPlacement.type = "breakable"`。
- 挙動: 下から叩くと使用済みになり、body を無効化して破壊演出後に消える。
- ステージ配置: `src/stages.ts` に `breakable` 配置あり。
- 要確認: 壊せる条件が下叩きのみでよいか、スター/飛び道具/敵との相互作用が必要か。

### No19 一方通行ゲート

- 実装: `src/stageInteractives.ts` の `OneWayGateController`。
- 定義: `src/assets.ts` の `OneWayGatePlacement` と `StageDefinition.oneWayGates`。
- 挙動: プレイヤーがゲート右側へ進むと、ゲート左側に見えない壁を作り逆走を防ぐ。
- 表示: ゲート画像、起動時の色変更、`ONE WAY` / `一方通行` の浮遊テキスト。
- 要確認: 逆方向通行の仕様が意図通りか、高速移動時やチェックポイント復帰時に詰まないか。

### No20 ステージミッション

- 実装: `src/rewardSystem.ts` の `getMissionSummary()`。
- 内容: ノーダメージ状態、コイン取得数、FAST OK/-- をまとめる。
- 接続: `src/main.ts` の `win()` で計算している。
- 現状: `SHOW_CLEAR_RANK_AND_MISSIONS = false` のため、クリア画面には表示されない。
- 仕様ページ: `public/player-spec/index.html` にはミッションまとめの説明がある。
- 要確認: 表示を復活させるか、ステージ別ミッションとして拡張するか。

## Useful Starting Points

- Gameplay core: `src/main.ts`
- Enemy behavior: `src/enemies.ts`
- Stage layout and placements: `src/stages.ts`
- Items and pickups: `src/items.ts`
- Bonus blocks: `src/bonusBlocks.ts`
- Stage interactives: `src/stageInteractives.ts`
- Reward/scoring: `src/rewardSystem.ts`
- Stage rendering behavior: `src/stageRenderer.ts`
- Stage editor behavior: `src/stageEditor.ts`

## Verification Commands

```powershell
git status --short --branch
npm run build
```

Firebase deploy, when requested:

```powershell
firebase deploy --project zannenin-sisters-leaderboard
```

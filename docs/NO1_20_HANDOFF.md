# No1-No20 Feature Handoff

このファイルは、新しい Codex コンテキストで No1-No20 の機能確認と追加対応を続けるための引き継ぎ資料です。

## Current Status

| No | 機能 | 状況 | メモ |
| --- | --- | --- | --- |
| 1 | 踏みつけ撃破 | クローズ | ユーザー判断で完全クローズ。 |
| 2 | 連続踏みボーナス | 確認中 | `src/rewardSystem.ts` に実装あり。効かない場面がある疑いを継続確認。 |
| 3 | ジャンプ台 | 実装済・要実機確認 | `spring` platform と大ジャンプ演出あり。 |
| 4 | 落ちる足場 | 実装済・要実機確認 | `fragile` platform として実装・配置あり。 |
| 5 | コイン列 | 実装済・要実機確認 | `coin` item と複数配置あり。 |
| 6 | 隠しブロック | 実装済・要実機確認 | `hidden` bonus block と報酬排出あり。 |
| 7 | はてなブロック | 実装済・要実機確認 | `question` bonus block と報酬排出あり。 |
| 8 | パワーアップアイテム | 実装済・要実機確認 | `powerSpeed` / `powerJump` / `star` / `dashRing` が実装済み。 |
| 9 | スター無敵 | 実装済・要実機確認 | `starPowerUntil` による無敵と接触撃破あり。 |
| 10 | ダッシュリング | 実装済・要実機確認 | `dashRing` item 取得で速度ブーストあり。 |
| 11 | チェックポイント旗 | 実装済・要実機確認 | `CheckpointController` とステージ配置あり。 |
| 12 | ステージ内分岐ルート | 実装済・要実機確認 | Skybridge Sprint に上側の分岐ルートを追加。 |
| 13 | 秘密エリア | 実装済・要実機確認 | Skybridge Sprint に隠しブロック報酬を絡めた秘密寄りルートを追加。 |
| 14 | ゴール評価 | 実装済・要実機確認 | クリア画面で S/A/B/C ランク表示を復活。 |
| 15 | 中間ミニチャレンジ | 実装済・要実機確認 | コイン収集型ミニチャレンジ、成功判定、ボーナス加算を追加。 |
| 16 | 敵の種類追加 | 実装済・要実機確認 | 複数敵タイプとAIが実装済み。 |
| 17 | 砲台・飛び道具ギミック | 実装済・要実機確認 | shooter / turret / projectile 系が実装済み。 |
| 18 | 壊せるブロック | 実装済・要実機確認 | `breakable` bonus block が実装済み。 |
| 19 | 一方通行ゲート | 実装済・要実機確認 | `OneWayGateController` とステージ配置あり。 |
| 20 | ステージミッション | 実装済・要実機確認 | ステージごとのミッション定義とクリア画面表示を追加。 |

## Progress Rules

- 作業はこの表の No を基準に進めます。
- 1つクローズするたびに、この表の状況を更新します。
- クローズ都度、残りタスク一覧をユーザーに表示します。
- 実装済みかどうかの確認は、コードと実機確認の両方で行います。
- 「実装済・要実機確認」は、コード上の機能は確認できたが、ユーザー体感でクローズしていない状態です。

## Latest Implementation Notes

- No14/20: `src/main.ts` の `SHOW_CLEAR_RANK_AND_MISSIONS` を有効化し、ステージ別ミッション結果をクリア画面に表示します。
- No15: `StageDefinition.miniChallenges` を追加し、チャレンジ範囲内のコイン取得数で成功判定とボーナス加算を行います。
- No12/13: `src/stages.ts` の Skybridge Sprint に上側の分岐足場、追加コイン、隠しブロック報酬を配置しました。
- No20: `StageDefinition.missions` は `noDamage`, `fastClear`, `minCoins`, `defeatEnemies`, `miniChallenge` に対応します。

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
npm.cmd run build
```

Firebase deploy, when requested:

```powershell
firebase.cmd deploy --project zannenin-sisters-leaderboard
```

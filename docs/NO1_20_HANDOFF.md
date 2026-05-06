# No1-No20 Feature Handoff

このファイルは、新しい Codex コンテキストで No1-No20 の機能確認と追加対応を続けるための引き継ぎ資料です。

ここにある一覧を No1-No20 の正本として扱ってください。以前の復元メモには別作業が混ざっていたため、以下の表で上書きしています。

## Current Status

| No | 機能 | 状況 |
| --- | --- | --- |
| 1 | 踏みつけ撃破 | クローズ |
| 2 | 連続踏みボーナス | 確認中 |
| 3 | ジャンプ台 | 未確認 |
| 4 | 落ちる足場 | 未確認 |
| 5 | コイン列 | 未確認 |
| 6 | 隠しブロック | 未確認 |
| 7 | はてなブロック | 未確認 |
| 8 | パワーアップアイテム | 未確認 |
| 9 | スター無敵 | 未確認 |
| 10 | ダッシュリング | 未確認 |
| 11 | チェックポイント旗 | 未確認 |
| 12 | ステージ内分岐ルート | 未確認 |
| 13 | 秘密エリア | 未確認 |
| 14 | ゴール評価 | 未確認 |
| 15 | 中間ミニチャレンジ | 未確認 |
| 16 | 敵の種類追加 | 未確認 |
| 17 | 砲台・飛び道具ギミック | 未確認 |
| 18 | 壊せるブロック | 未確認 |
| 19 | 一方通行ゲート | 未確認 |
| 20 | ステージミッション | 未確認 |

## Progress Rules

- 作業はこの表の No を基準に進めます。
- 1つクローズするたびに、この表の状況を更新します。
- クローズ都度、残りタスク一覧をユーザーに表示します。
- 実装済みかどうかの確認は、コードと実機確認の両方で行います。
- 「確認中」は実装や仕様が存在する可能性はあるが、ユーザー体感または実機確認がまだ残っている状態です。

## Known Context

- No1「踏みつけ撃破」はユーザー判断で完全クローズ済みです。
- No2「連続踏みボーナス」は、効いていないシーンがある疑いが出ており確認中です。
- 新しいコンテキストでは、まず No2 の実装条件と実機挙動を確認してください。

## Useful Starting Points

- Gameplay core: `src/main.ts`
- Enemy behavior: `src/enemies.ts`
- Stage layout and placements: `src/stages.ts`
- Items and pickups: `src/items.ts`
- Reward and scoring logic: search exact symbols first, especially stomp/combo related names.
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

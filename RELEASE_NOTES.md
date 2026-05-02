# Release Notes / リリースノート

## v0.1.39
### English
- Increased the control hint text size and aligned it horizontally with the version display.
### 日本語
- 操作説明の文字サイズを少し大きくし、バージョン表示と横並びになるよう配置しました。

## v0.1.38
### English
- Removed the HUD frame from the in-game display while keeping the artwork asset in the repository.
- Kept the HUD text display, placed score and timer side by side under the player name, and simplified score to total only.
- Moved the control hint to the upper right so it does not overlap the version display.
### 日本語
- HUDフレームをゲーム画面上の表示から外しつつ、素材アセットはリポジトリ内に残しました。
- HUD文字表示は維持し、プレイヤー名の下にスコアとタイマーを横並び配置し、スコア表示を合計のみへ簡略化しました。
- 操作説明を右上へ移動し、バージョン表示と重ならないようにしました。

## v0.1.37
### English
- Increased the HUD text size by one step.
- Saved the player name, volume, and mute state in cookies so they are restored on the next visit.
### 日本語
- HUD内の文字サイズをもう一段階大きくしました。
- プレイヤー名、音量、ミュート状態をCookieへ保存し、次回表示時に復元するようにしました。

## v0.1.36
### English
- Restored the HUD text font sizes after the panel resize.
- Added a short item pickup sound effect and play it when items are collected.
- Aligned the EDITOR, BGM, and options buttons in one top-right row, and restored BGM/options emoji icons.
### 日本語
- HUDパネル縮小後の文字フォントサイズを元の見やすい大きさに戻しました。
- アイテム取得時の短い効果音アセットを追加し、取得時に再生するようにしました。
- EDITOR、BGM、Optionsボタンを右上で横並びに整列し、BGM/Options表示を絵文字アイコンに戻しました。

## v0.1.35
### English
- Resized the fantasy HUD panel and its text layout to 60% of the previous display size.
### 日本語
- ファンタジー調HUDパネルと文字レイアウトを、前回表示サイズの60%に縮小しました。

## v0.1.34
### English
- Replaced the top-left HUD panel with the supplied fantasy frame artwork.
- Processed the HUD artwork as a transparent, cropped game asset and adjusted HUD text placement to fit the new frame.
### 日本語
- 左上HUDパネルを、提供されたファンタジー調フレーム素材に差し替えました。
- HUD素材を透過・トリミングしたゲーム用アセットとして取り込み、新しいフレームに合わせて文字位置を調整しました。

## v0.1.33
### English
- Fixed corrupted BGM and options button labels.
- Recreated the global UI on scene restart so BGM and volume controls always bind to the current scene.
- Stabilized corrupted mobile labels and arrow button markup by using HTML entities.
### 日本語
- BGMボタンとオプションボタンの文字化けを修正しました。
- シーン再起動時にグローバルUIを作り直すようにし、BGMと音量操作が常に現在のシーンへ紐づくようにしました。
- 文字化けで壊れていたモバイル表示と矢印ボタンを、HTMLエンティティ表記に変更して安定化しました。

## v0.1.32
### English
- Fixed a bug where interacting with the volume slider caused the BGM toggle icon to become out of sync.
### 日本語
- 音量スライダー操作時にBGMトグル表示が実際の状態とずれる不具合を修正しました。

## v0.1.31
### English
- Fixed a WebAudio timing issue that caused the BGM toggle icon to be out of sync.
### 日本語
- WebAudioの状態取得タイミングにより、BGMトグル表示がずれる問題を修正しました。

## v0.1.30
### English
- Synced the BGM toggle icon with the volume slider state.
### 日本語
- 音量スライダーの状態とBGMトグル表示が連動するようにしました。

## v0.1.29
### English
- Added `RELEASE_NOTES.md` to track project updates.
### 日本語
- プロジェクト更新履歴を記録するため、`RELEASE_NOTES.md`を追加しました。

## v0.1.28
### English
- Added a one-touch BGM toggle button to the top right of the screen.
- Added an options menu with a volume slider.
### 日本語
- 画面右上にBGMのワンタッチON/OFFボタンを追加しました。
- 音量スライダー付きのオプションメニューを追加しました。

## v0.1.27
### English
- Fixed an issue where WASD and Space inputs were captured by the game while typing in the player name field.
- Added looping background music.
### 日本語
- プレイヤー名入力中にWASDやSpace入力がゲーム側へ取られる問題を修正しました。
- ループ再生されるBGMを追加しました。

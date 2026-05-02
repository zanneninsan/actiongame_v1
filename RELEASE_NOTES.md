# Release Notes / リリースノート

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

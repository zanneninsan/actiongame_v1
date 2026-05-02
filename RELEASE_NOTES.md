# Release Notes / リリースノート

## v0.1.32
### English
- Fixed a bug where interacting with the volume slider caused the BGM toggle icon to become out of sync.
### 日本語
- ボリュームバー操作時にBGMアイコンのON/OFFが正しく切り替わらなくなるバグを修正しました。

## v0.1.31
### English
- Fixed a timing issue in WebAudio state reading that caused the BGM toggle icon to be out of sync.
### 日本語
- WebAudio APIの仕様による遅延で、BGMのON/OFFアイコンが実際の状態と1回分ズレて表示されてしまうバグを完全に修正しました。

## v0.1.30
### English
- Fixed a bug where the BGM toggle icon didn't sync correctly with the volume slider state.
### 日本語
- 音量スライダーの変更とBGMのON/OFFアイコンが正しく連動しないバグを修正しました。

## v0.1.29
### English
- Added `RELEASE_NOTES.md` to track project updates.
### 日本語
- プロジェクトの更新履歴を記録するため、`RELEASE_NOTES.md`を追加。

## v0.1.28
### English
- Added a one-touch BGM toggle button to the top right of the screen.
- Added an options menu with a slider to adjust the master volume from 0 to 100.
### 日本語
- 画面右上にBGMのワンタッチON/OFFボタンを追加しました。
- 音量を0〜100で調整できるオプション画面（スライダー付き）を追加しました。

## v0.1.27
### English
- Fixed an issue where the game engine incorrectly captured WASD and Space key inputs while the user was typing in the player name field on the start screen.
- Added background music (BGM) that automatically loops when the game starts.
### 日本語
- スタート画面のプレイヤー名入力欄で、WASDやスペースキーの入力がゲーム側に奪われてしまう問題を修正しました。
- ゲーム開始時に自動でループ再生されるBGMを追加しました。

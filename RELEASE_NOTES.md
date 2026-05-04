# Release Notes / リリースノート

Older entries through v0.1.100 were moved to `docs/RELEASE_NOTES_ARCHIVE.md`.

## v0.1.109
### English
- Replaced the CSS-built start modal frame with a single fixed-aspect raster window asset.
- Limited CSS on the start modal to sizing, positioning, and form layout so frame ornaments no longer distort or multiply.
### Japanese
- CSSで組み立てていた開始モーダルの枠をやめ、固定アスペクト比の1枚絵ウィンドウ素材に置き換えました。
- 開始モーダルのCSSはサイズ、配置、フォームレイアウト中心に絞り、枠の装飾が歪んだり増殖したりしないようにしました。

## v0.1.108
### English
- Rebuilt the start modal frame from separate corner, edge, fill, and center ornament layers to avoid border-image distortion.
- Centered the start modal frame ornaments independently so they stay aligned on wide windows.
### Japanese
- 開始モーダルの枠を、角、ふち、中面、中央装飾の別レイヤーで組み直し、border-image の引き伸ばしによる歪みを避けました。
- 開始モーダル枠の中央装飾を独立して中央配置し、横長のウィンドウでも位置がずれないようにしました。

## v0.1.107
### English
- Added a long-idle player animation that plays once after the player remains idle for 5 seconds, then returns to the normal idle loop.
### Japanese
- プレイヤーが5秒間待機し続けたときに長めの待機アニメーションを1回再生し、その後は通常の待機アニメーションへ戻るようにしました。

## v0.1.106
### English
- Narrowed the start modal and centered its internal controls with extra side margin to avoid right-edge clipping.
- Added more padding inside the player name field and removed the native select arrow from the language field.
### Japanese
- 開始モーダルを少し狭くし、内部の操作部品に左右余白を持たせて右端が見切れないようにしました。
- プレイヤー名入力欄の内側余白を増やし、言語欄のブラウザ標準矢印を消しました。

## v0.1.105
### English
- Rebuilt the safe-padded fantasy window frame from the single modal frame so neighboring sheet art no longer appears on the left side.
### Japanese
- 安全余白付きのファンタジーウィンドウ枠を単体のモーダル枠から作り直し、左側に隣の素材が出ないようにしました。

## v0.1.104
### English
- Recut the start and options UI frame, title, input, select, and button art with safer transparent padding so right-side ornaments do not clip.
- Updated the start and options windows to use the safer UI assets.
### Japanese
- 開始画面と設定画面で使う枠、タイトル、入力欄、セレクト欄、ボタン素材を、右側の装飾が切れないように余白付きで切り直しました。
- 開始画面と設定画面を、切り直した安全余白付きUI素材へ差し替えました。

## v0.1.103
### English
- Changed the player name field to use a plain fantasy input plate instead of the dropdown-style field art.
- Narrowed the start modal and increased side padding so the right edge of the fantasy frame does not clip.
### Japanese
- プレイヤー名入力欄を、プルダウン風ではない通常入力用のファンタジーUIプレートに変更しました。
- 開始モーダルの幅と左右余白を調整し、右側の外枠が見切れないようにしました。

## v0.1.102
### English
- Split the fantasy window frame into reusable corner, edge, fill, and 9-slice frame assets.
- Rebuilt the start and options windows with scalable 9-slice borders so the frame no longer clips at narrow widths.
- Tightened the start menu sizing and responsive layout to keep controls inside the window.
### Japanese
- ファンタジーUIのウィンドウ枠を、角、ふち、中面、9-slice用フレーム素材に分離しました。
- 開始画面と設定画面を伸縮できる9-slice枠で作り直し、狭い幅でも枠が見切れないようにしました。
- 開始メニューのサイズとレスポンシブ配置を調整し、操作部品がウィンドウ内に収まるようにしました。

## v0.1.101
### English
- Increased the story message UI to roughly 1.2x its previous size while keeping it inside the game frame.
- Added a reusable fantasy UI raster asset set matching the story message frame.
- Restyled the start screen and options screen to use the fantasy UI asset style.
- Started a fresh release notes file and moved older entries to the archive.
### Japanese
- ストーリーメッセージUIを、ゲーム枠内に収めたまま以前の約1.2倍にしました。
- ストーリーメッセージ枠に合わせた、汎用的なファンタジーUIラスター素材セットを追加しました。
- 開始画面と設定画面を、ファンタジーUI素材に合わせた見た目へ変更しました。
- リリースノートを新しく整理し、過去の記録をアーカイブへ移しました。

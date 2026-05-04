# Release Notes / リリースノート

Older entries through v0.1.100 were moved to `docs/RELEASE_NOTES_ARCHIVE.md`.

## v0.1.136
### English
- Converted runtime PNG assets that benefited from compression to WebP and updated game, story, enemy, item, sprite, and UI references.
- Kept the tiny leaderboard plate PNGs unchanged because their WebP versions were larger.
### Japanese
- 圧縮効果の大きい実行時PNG素材をWebPへ変換し、ゲーム本体、ストーリー、敵、アイテム、スプライト、UIの参照を更新しました。
- 小さなランキング用プレート画像はWebP化すると逆に大きくなったため、PNGのまま残しました。

## v0.1.135
### English
- Renamed the English stage display name to Shibu-ya city.
### Japanese
- ステージの英語表示名を「Shibu-ya city」に変更しました。

## v0.1.134
### English
- Renamed the Japanese stage display name from Neon Canal to Shibuya City.
### Japanese
- ステージの日本語表示名を「ネオン運河」から「シブヤシティ」に変更しました。

## v0.1.132
### English
- Added localized stage names with `jp` and `en` fields in stage definitions, while keeping old string-name stage JSON imports compatible.
### Japanese
- ステージ定義の名前に `jp` と `en` を持たせられるようにし、古い文字列形式のステージJSONも引き続き読み込めるようにしました。

## v0.1.131
### English
- Made the fall MISS overlay more dramatic with a screen flash, stronger camera shake, color-offset echoes, and a punchier bounce animation.
### Japanese
- 落下時の MISS 表示に画面フラッシュ、強めのカメラ揺れ、色ズレした残像、勢いのあるバウンド演出を追加しました。

## v0.1.130
### English
- Added TV power-on and power-off style animations when the story message window appears and disappears.
### Japanese
- ストーリーのメッセージウィンドウが表示・非表示になるときに、テレビの電源が入ったり消えたりするような演出を追加しました。

## v0.1.129
### English
- Moved countdown scan lines and glow behind the main lettering, then strengthened the foreground text with a hard dark outline for clearer contrast.
### Japanese
- カウントダウンのスキャンラインと発光を文字の背面へ下げ、前面の文字に硬い黒縁を付けて、3、2、1、GO がくっきり見えるようにしました。

## v0.1.128
### English
- Restyled the start countdown with a heavier arcade font stack, layered neon text, burst lines, scan lines, and a sharper hit animation.
### Japanese
- スタート時のカウントダウンを、重めのアーケード風フォント、重ねたネオン文字、放射線、スキャンライン、鋭い出現アニメーションでよりギラギラした見た目にしました。

## v0.1.127
### English
- Added a dedicated NEW column to the leaderboard so the freshly submitted score is obvious at a glance.
### Japanese
- リーダーボードに NEW 専用の列を追加し、クリア直後に送信したスコアがひと目で分かるようにしました。

## v0.1.126
### English
- Delayed the opening story dialogue until the player passes X 600, then automatically advances and hides the message window on timers.
### Japanese
- 最初の会話ウィンドウを非表示で開始し、プレイヤーのX座標が600を超えたら「人が多いですね……」を表示して、8秒後に次の会話へ進み、さらに8秒後にウィンドウを消すようにしました。

## v0.1.125
### English
- Added the extracted aqua mascot frames as an animated enemy sprite sheet.
- Registered Aqua Mascot as an enemy type and placed a sample enemy in the stage.
### Japanese
- 抽出したアクア系マスコットのフレームを、敵キャラクター用のアニメーションスプライトシートとして追加しました。
- Aqua Mascot を敵タイプとして登録し、ステージ上にサンプル敵として配置しました。

## v0.1.124
### English
- Updated the second story dialogue portrait and automatically advances to it when the player moves past X 600.
### Japanese
- 「先へ進みましょう」の会話に新しい表情アイコンを使い、プレイヤーのX座標が600を超えたら自動でその会話へ切り替わるようにしました。

## v0.1.123
### English
- Increased the contrast of the PC/mobile mode selector and sound ON/OFF selector so the active choices are clearer on phone screens.
### Japanese
- スマホ画面でも現在選ばれている操作モードとサウンド設定が分かりやすいように、選択表示のコントラストを強めました。

## v0.1.122
### English
- Moved the leaderboard NEW marker outside the rank column and auto-scrolls the list to the newly submitted score.
- Made the MISS overlay brighter and heavier with a strong outline and glow.
### Japanese
- リーダーボードの NEW 表示を順位列の外へ移動し、新しく送信したスコア行まで自動でスクロールするようにしました。
- MISS 表示を濃くギラついた色、太い縁取り、強い発光に調整しました。

## v0.1.121
### English
- Highlighted the newly submitted leaderboard score so players can identify their current clear result.
- Restyled the leaderboard scrollbar to match the fantasy UI instead of the default browser scrollbar.
### Japanese
- クリア直後に送信したランキング行を強調し、今回のスコアがどれか分かるようにしました。
- リーダーボードのスクロールバーをブラウザ標準の見た目から、ファンタジーUIに馴染む色へ調整しました。

## v0.1.120
### English
- Updated the opening Shibuya dialogue portrait to use the new message face icon asset.
### Japanese
- 渋谷の会話で「人が多いですね……」と話す場面の顔表示に、新しいメッセージ用表情アイコンを使うようにしました。

## v0.1.119
### English
- Rebuilt the leaderboard window with dedicated raster assets so rows, rank numbers, scores, and dates no longer overlap or inherit dropdown arrows.
### Japanese
- リーダーボード専用のラスタ素材を追加し、順位、名前、スコア、日時が重ならず、不要なドロップダウン矢印も出ない表示に作り直しました。

## v0.1.118
### English
- Extended the fall-miss restart delay so the miss danmaku has time to play before the stage restarts.
### Japanese
- ミス時の弾幕が見えるように、落下ミス演出からリスタートまでの待ち時間を長くしました。

## v0.1.117
### English
- Added an options menu toggle to enable or disable danmaku comments, with the setting saved between sessions.
### Japanese
- オプションメニューに弾幕表示のオン・オフを追加し、設定が次回起動時にも残るようにしました。

## v0.1.116
### English
- Added a fall-miss sequence with a MISS overlay, camera shake, danmaku, and delayed restart when the player drops below the stage.
### Japanese
- ステージ下へ落ちたときに即リスタートせず、MISS表示、カメラ揺れ、弾幕を挟んでからリスタートするミス演出を追加しました。

## v0.1.115
### English
- Added a repeatable Nico-style danmaku burst after jumping 5 times without landing.
### Japanese
- 着地を挟まずにジャンプを5回続けたときに、ニコニコ動画風の弾幕が流れる演出を追加しました。着地すると再発火できるようになります。

## v0.1.114
### English
- Changed the crouch danmaku trigger from 3 seconds to 2 seconds.
### Japanese
- しゃがみ弾幕が流れるまでの時間を3秒から2秒に短くしました。

## v0.1.113
### English
- Added a repeatable Nico-style danmaku burst after crouching for more than 3 seconds.
### Japanese
- しゃがみ状態を3秒以上続けたときに、ニコニコ動画風の弾幕が流れる演出を追加しました。しゃがみを解除すると再発火できるようになります。

## v0.1.112
### English
- Added a Shift speed modifier that doubles movement acceleration, max run speed, and jump launch velocity while held.
### Japanese
- Shift キーを押している間、移動加速度、最高移動速度、ジャンプ初速が2倍になるようにしました。

## v0.1.111
### English
- Added Firebase-backed leaderboard client wiring with score submission on clear and a top-score modal.
- Added Firebase environment, Firestore rules, and Cloud Function setup notes for shared rankings.
- Added a Nico-style scrolling danmaku burst when the item score first exceeds 1000.
### Japanese
- Firebase を使ったランキング連携を追加し、クリア時のスコア送信とトップスコア表示モーダルを入れました。
- 共有ランキング用の Firebase 環境設定、Firestore ルール、Cloud Functions の導入メモを追加しました。
- アイテムスコアが初めて1000を超えたときに、ニコニコ動画風の横流れ弾幕が出る演出を追加しました。

## v0.1.110
### English
- Replaced the options modal CSS-built frame with a single fixed-aspect raster window asset.
- Limited options modal CSS to sizing and form layout so the frame no longer distorts.
### Japanese
- 設定モーダルのCSSで組み立てていた枠を、固定アスペクト比の1枚絵ウィンドウ素材に置き換えました。
- 設定モーダルのCSSをサイズとフォーム配置中心に絞り、枠が歪まないようにしました。

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

# Release Notes / リリースノート

## v0.1.99
### English
- Restored the top HUD text to its original size.
- Reduced the story dialogue panel, portrait, and message text to roughly two-thirds of the previous size.
### Japanese
- 上部HUDの文字サイズを元の大きさに戻しました。
- ストーリー会話枠、顔アイコン、メッセージ文字を以前の約3分の2に小さくしました。
## v0.1.98
### English
- Limited timer, time bonus, and final score displays to two decimal places while keeping millisecond-based calculations.
### Japanese
- タイマー、タイムボーナス、最終スコアの表示を小数2桁に揃えつつ、計算はミリ秒単位のまま維持しました。

## v0.1.97
### English
- Reduced the top HUD text to roughly two-thirds of the v0.1.96 size.
### Japanese
- 上部HUDの文字サイズを v0.1.96 からさらに約3分の2に小さくしました。
## v0.1.96
### English
- Kept the story dialogue panel inside the game canvas, in the top-left area below the player and score HUD.
- Scaled the dialogue panel and text with the rendered game size so it stays compact on mobile screens.
- Reduced the top HUD text to roughly two-thirds of its previous size.
### Japanese
- ストーリーメッセージ枠をゲームキャンバス内に収め、左上のままプレイヤー名とスコア表示の下に配置するようにしました。
- 表示中のゲームサイズに合わせてメッセージ枠と文字を縮小し、スマホ画面で大きくなりすぎないようにしました。
- 上部HUDの文字サイズを以前の約3分の2に小さくしました。
## v0.1.95
### English
- Changed the HUD timer to count down with millisecond precision.
- Included millisecond precision in the goal time bonus and final score calculation.
### Japanese
- HUD の残り時間をミリ秒まで表示してカウントするようにしました。
- ゴール時のタイムボーナスと最終スコアに、ミリ秒単位の残り時間も反映されるようにしました。

## v0.1.94
### English
- Added a four-frame walking animation spritesheet for the Knife Punk enemy from the provided reference sheet.
- Added enemy animation metadata and playback so image-backed enemies can use looping patrol animations.
### Japanese
- 参考シートから「Knife Punk」の4コマ歩行アニメーションを追加しました。
- 敵ごとにアニメーション情報を持てるようにし、巡回中にループ再生できるようにしました。

## v0.1.93
### English
- Added a new Knife Punk enemy type based on the provided reference image.
- Added image-backed enemy loading and per-enemy display/body sizing so future enemy assets can be registered cleanly.
- Placed the new enemy type on the first stage enemy and exposed it in the stage editor enemy selector.
### Japanese
- 参考画像をもとにした新しい敵タイプ「Knife Punk」を追加しました。
- 今後の敵アセット追加に備えて、画像読み込みと敵ごとの表示サイズ、当たり判定サイズを定義できるようにしました。
- ステージ序盤の敵に新しい敵タイプを割り当て、ステージエディタの敵選択にも表示されるようにしました。

## v0.1.92
### English
- Rebuild enemies from their stage placement data when enabling the stage editor so editor selection matches the intended initial positions.
- Keep rebuilt editor enemies frozen while editing, preventing live patrol movement from drifting away from placement data.
### Japanese
- ステージエディタを有効にした瞬間、敵をステージ配置データから作り直し、選択判定が本来の初期位置と合うようにしました。
- 作り直した敵は編集中に停止させ、巡回移動で配置データからズレないようにしました。

## v0.1.91
### English
- Destroy enemies after they fall below the stage reset line so they do not keep simulating off-screen.
- Freeze enemies while the stage editor is enabled, then rebuild them from edited placements when leaving the editor.
### Japanese
- 敵がステージ下のリセットラインより下に落ちたら消えるようにし、画面外で処理され続けないようにしました。
- ステージエディタ中は敵が動かないようにし、エディタ終了時に編集後の配置から作り直すようにしました。

## v0.1.90
### English
- Added enemies as editable stage editor objects with add, select, move, delete, export, and import support.
- Added enemy type metadata so future enemy assets can be registered without changing the stage placement shape.
### Japanese
- ステージエディタで敵を追加、選択、移動、削除、エクスポート、インポートできるようにしました。
- 今後複数の敵アセットを追加しやすいよう、敵配置に種類情報を持てるようにしました。

## v0.1.89
### English
- Extended the physics world below the visible stage so falling into floor gaps reaches the reset threshold instead of catching on the world bottom.
### Japanese
- 床の穴へ落ちたときに物理ワールド下端で止まらないよう、表示ステージの下に余白を追加し、リセット判定まで落下できるようにしました。

## v0.1.88
### English
- Fixed enemies falling through platforms by allowing their dynamic physics bodies to be separated by stage floor collisions.
### Japanese
- 敵の動的ボディが足場との衝突で押し戻されるようにし、足場をすり抜けて落ち続ける問題を修正しました。

## v0.1.87
### English
- Added an enemy near the player start so one is visible within the initial camera area.
- Placed the start-area enemy above the first ground platform so it drops in under gravity like the other enemies.
### Japanese
- スタート地点近くに敵を追加し、初期カメラ内で見えるようにしました。
- 追加した敵も最初の地面足場の上空に配置し、ほかの敵と同じように重力で落下するようにしました。

## v0.1.86
### English
- Removed the automatically generated full-width baseline floor from stage rendering.
- Added explicit ground platform runs to the stage layout with several gaps that reset the run when the player falls.
- Changed falling below the stage to immediately restart the stage without playing the defeat animation.
### Japanese
- ステージ描画で全幅のベースライン床を自動生成しないようにしました。
- ステージ定義に明示的な地面足場を追加し、途中にいくつか穴を用意しました。
- ステージ下へ落ちたときは失敗演出を挟まず、すぐにステージを最初からやり直すようにしました。

## v0.1.85
### English
- Changed enemies to spawn in midair and fall under Arcade Physics gravity before landing on the stage ground.
- Kept enemy patrol movement active after landing while preserving player damage overlap behavior.
### Japanese
- 敵キャラクターを地面配置ではなく中空配置に変更し、Arcade Physics の重力でステージの地面へ落下するようにしました。
- 着地後も敵の巡回移動とプレイヤーへのダメージ判定が続くようにしました。

## v0.1.84
### English
- Refreshed the goal static body after resizing so the collision box lines up with the displayed goal gate.
- Shortened decoration-platform crouch drop-through timing from 1.0 seconds to 0.5 seconds.
### Japanese
- ゴール画像のリサイズ後に静的ボディを更新し、表示されているゴールゲートと当たり判定が合うようにしました。
- 装飾足場からしゃがみですり抜けるまでの時間を1.0秒から0.5秒に短縮しました。

## v0.1.83
### English
- Added simple patrolling enemy characters to the stage.
- Added player damage behavior: touching an enemy triggers knockback, a brief input lock, camera shake, and blinking invulnerability.
### Japanese
- ステージ上に左右へ巡回する簡易的な敵キャラクターを追加しました。
- 敵に触れたとき、プレイヤーがノックバックし、短時間操作不能になり、点滅しながら無敵になるダメージ演出を追加しました。

## v0.1.82
### English
- Moved stage-object top-platform definitions out of `src/main.ts` into a dedicated `src/stageObjectPlatforms.ts` mapping file.
- Added top-landable surfaces for `street-kiosk`, `guard-rail`, `concrete-pillar`, `station-wall-railing`, and `shutter-storefront`.
### Japanese
- ステージオブジェクトの上面当たり判定の定義を `src/main.ts` から `src/stageObjectPlatforms.ts` に切り出しました。
- `street-kiosk`、`guard-rail`、`concrete-pillar`、`station-wall-railing`、`shutter-storefront` の上にも乗れるようにしました。
## v0.1.81
### English
- Added a GPT Image2-generated player defeat sprite sheet with an 8-frame non-graphic down animation.
- Falling below the stage now plays the defeat animation before restarting the stage.
### Japanese
- GPT Image2で生成した8コマのやられモーション用スプライトシートを追加しました。
- ステージ下へ落ちたとき、すぐに再開せず、やられモーションを再生してからリスタートするようにしました。

## v0.1.80
### English
- Added an in-game key-name label above the selected object in stage edit mode.
- The label follows the selection marker and shows asset keys for items, street lamps, and decorations.
### Japanese
- ステージ編集モードで選択中のオブジェクトの上にキー名ラベルを表示するようにしました。
- アイテム、街灯、装飾オブジェクトでは実際のアセットキーが選択枠に合わせて表示されます。
## v0.1.79
### English
- Replaced the generated placeholder goal marker with the provided polished pixel-art goal gate image.
- Cropped the transparent padding from the supplied goal art so it displays crisply at the stage finish.
### Japanese
- 仮のピクセル描画だったゴールを、指定されたドット絵のゴール画像に差し替えました。
- 受け取った画像の透明な余白を切り詰め、ステージ終端で見やすく表示されるようにしました。
## v0.1.78
### English
- Reworked the story dialogue window to use a GPT Image2-generated ornate HUD frame asset instead of CSS-driven decoration.
- Added the HUD asset production rule so rich in-game UI visuals start from generated raster assets, with DOM/CSS limited to positioning and text overlays.
### Japanese
- ストーリー会話ウィンドウを、CSS 装飾ではなく GPT Image2 で生成したリッチな HUD フレーム画像を土台にする形へ作り直しました。
- リッチなゲーム内 HUD は生成画像アセットを基本にし、DOM と CSS は配置やテキスト重ねに絞る制作方針を追加しました。
## v0.1.77
### English
- Added a top-left story dialogue window with a generated character portrait, name plate, translucent message area, and click-through story progression.
- Kept the dialogue implementation in a separate module so future character names, portraits, and messages can be swapped without adding story UI logic to `src/main.ts`.
### Japanese
- 画面左上に、生成したキャラクター顔素材、名前欄、うっすら透過したメッセージ欄を持つストーリー会話ウィンドウを追加しました。
- キャラ名、顔画像、メッセージを差し替えやすい別モジュールにまとめ、`src/main.ts` への追加は薄い接続だけにしました。
## v0.1.76
### English
- Added one-way top platforms to the single and double street lamps so the player can land on their lamp heads from above.
- Reused the decoration platform drop-through behavior, allowing the player to crouch for one second to descend from street lamps.
### Japanese
- シングル街灯とダブル街灯の上部に、上からだけ乗れる当たり判定を追加しました。
- バス停の屋根と同じように、街灯の上でも1秒しゃがむと下に降りられるようにしました。
## v0.1.75
### English
- Fixed bus shelter roof drop-through so the roof becomes landable again after the player passes below it.
### Japanese
- バス停の屋根をすり抜けたあと、下まで抜けたら再び屋根に乗れるように修正しました。
## v0.1.74
### English
- Allow the player to drop through the bus shelter roof after crouching on it for one second.
- Keep the drop-through behavior scoped to decoration top platforms, leaving normal platforms unchanged.
### Japanese
- バス停の屋根の上で1秒しゃがみ続けると、下に降りられるようにしました。
- すり抜け動作は装飾オブジェクトの上面床だけに限定し、通常の足場はこれまで通りにしました。
## v0.1.73
### English
- Added a one-way roof platform to `stage-structures-bus-shelter` so the player can land on the bus shelter from above.
- Kept side and underside collisions disabled for the bus shelter decoration.
### Japanese
- `stage-structures-bus-shelter` の屋根に、上からだけ乗れる当たり判定を追加しました。
- バス停の左右と下側には当たり判定を付けず、装飾としての見た目はそのままにしました。
## v0.1.72
### English
- Request fullscreen in mobile landscape mode only when the available viewport height is clearly too short.
- Keep the landscape-only mobile flow unchanged when the browser already has enough vertical room.
### Japanese
- モバイルの横画面モードで、表示できる縦幅が明らかに足りない場合だけ全画面表示をリクエストするようにしました。
- ブラウザ上で十分な縦幅がある場合は、これまで通り横画面モードのまま開始します。
## v0.1.71
### English
- Generate rear and midground background lists from their asset folders at Vite startup/build time.
- Removed the need to manually register each new background image in `src/main.ts`.
- Reload the dev server page when background files are added to or removed from the managed folders.
### Japanese
- Viteの起動時またはビルド時に、後景と中景の背景リストを各アセットフォルダから生成するようにしました。
- 新しい背景画像を追加するたびに `src/main.ts` へ手動登録する必要をなくしました。
- 管理対象フォルダ内で背景画像が追加または削除されたとき、開発サーバーのページを再読み込みするようにしました。
## v0.1.70
### English
- Added the new normalized midground image to the in-game midground debug switcher.
### Japanese
- 新しく正規化した中景画像を、ゲーム内の中景デバッグ切り替え候補に追加しました。
## v0.1.69
### English
- Split background asset storage into `rear` and `midground` folders.
- Added rear background candidates for `IMG_4202.webp`, `starry_sky.webp`, and `ED96A78D-7F78-4486-8F37-8004120CB7FC.png`.
- Added separate debug buttons for cycling fixed rear backgrounds and scrolling midground backgrounds.
### Japanese
- 背景アセットの保存先を `rear` と `midground` のフォルダに分けました。
- `IMG_4202.webp`、`starry_sky.webp`、`ED96A78D-7F78-4486-8F37-8004120CB7FC.png` を後景候補として整理しました。
- 固定表示の後景とスクロールする中景を、それぞれ別のデバッグボタンで切り替えられるようにしました。
## v0.1.68
### English
- Removed the automatic fullscreen request from mobile mode.
- Added landscape-only mobile start flow: portrait devices now show a rotate prompt and wait until landscape before starting the run.
### Japanese
- モバイルモード開始時に自動で全画面化する処理を削除しました。
- スマホを縦向きにしている場合は横画面への案内を表示し、横向きになってからプレイを開始するようにしました。
## v0.1.67
### English
- Split rear background and midground background definitions so `starry_sky.webp` is managed as the fixed rear layer.
- Added the remaining non-`starry_sky.webp` background images to the midground debug cycle.
### Japanese
- `starry_sky.webp` を固定の後景レイヤーとして扱うように、後景と中景の定義を分けました。
- `starry_sky.webp` 以外の背景画像を、中景のデバッグ切り替え候補に追加しました。
## v0.1.66
### English
- Fixed the stage editor panel so dragging it keeps the compact editor width instead of expanding from its contents.
### Japanese
- ステージエディターパネルを移動しても、中身に合わせて横幅が広がらず、コンパクトな幅を保つように修正しました。
## v0.1.65
### English
- Normalized the existing midground background candidates to 720px high while preserving their aspect ratios.
- Added a debug `BG` button for cycling the game's midground background during play.
### Japanese
- 既存の中景背景候補を、縦横比を保ったまま高さ720pxにそろえました。
- プレイ中に中景背景を切り替えられるデバッグ用の `BG` ボタンを追加しました。
## v0.1.64
### English
- Added an English/Japanese localization dictionary for player-facing UI text.
- Added language selectors to the start modal and options menu, with the selected language saved locally.
- Localized the start modal, HUD labels, control hints, options menu, mobile control labels, countdown text, and stage editor panel.
- Refined Japanese labels for control modes, HUD text, and stage editor tools.
### Japanese
- プレイヤー向けUIテキスト用に英語・日本語の多言語辞書を追加しました。
- 開始モーダルとオプションメニューに言語セレクトを追加し、選択した言語をローカルに保存するようにしました。
- 開始モーダル、HUDラベル、操作ヒント、オプションメニュー、モバイル操作ラベル、カウントダウン、ステージエディタパネルを多言語対応しました。
- 操作モード、画面UI、ステージ編集ツールの日本語ラベルを調整しました。

## v0.1.63
### English
- Added stage editor JSON import from pasted text or a `.json` file.
- Updated stage editor export to copy JSON and download a stage JSON file.
### Japanese
- ステージエディタで、貼り付けたテキストまたは `.json` ファイルからステージJSONをインポートできるようにしました。
- ステージエディタのエクスポートで、JSONのコピーとステージJSONファイルのダウンロードを行うようにしました。

## v0.1.62
### English
- Prevented item pickup while the stage editor is enabled.
### Japanese
- ステージエディタがONの間は、アイテムを取得しないようにしました。

## v0.1.61
### English
- Changed the stage editor Redo shortcut from `R` to `Y` so `R` can restart during editing.
- Added a second-line editor key hint to the top control hint while the editor is enabled.
### Japanese
- エディタのRedoショートカットを `R` から `Y` に変更し、編集中でも `R` でリスタートできるようにしました。
- エディタON中は、画面上部の操作ヒントにエディタ用キー説明の2行目を表示するようにしました。

## v0.1.60
### English
- Added Undo and Redo support to the in-game stage editor.
- Added editor keyboard shortcuts: `Z` for Undo, `R` for Redo, and `Delete` for removing the selected object.
- Split detailed stage editor behavior into `src/stageEditor.ts`, keeping `src/main.ts` focused on core game behavior and thin editor integration.
- Updated editor guidance docs so future large or user-visible updates bump `DEBUG_VERSION` and `RELEASE_NOTES.md` even before pushing.
### Japanese
- ゲーム内ステージエディタにUndo / Redoを追加しました。
- エディタのショートカットを追加しました: `Z` でUndo、`R` でRedo、`Delete` で選択中オブジェクトを削除できます。
- ステージエディタの詳細ロジックを `src/stageEditor.ts` に分割し、`src/main.ts` をゲームの基本処理と薄い連携に整理しました。
- 今後の大きな変更またはユーザーに見える更新では、push前でも `DEBUG_VERSION` と `RELEASE_NOTES.md` を更新するルールをドキュメントに追加しました。

## v0.1.59
### English
- Made decoration `y` optional in stage definitions.
- Applied the resolved stage `groundTopY` as the default decoration Y position when omitted.
### 日本語
- ステージ定義の装飾オブジェクトの`y`を省略可能にしました。
- `y`が未指定の場合は、そのステージの`groundTopY`を初期値として適用するようにしました。
## v0.1.58
### English
- Made street lamp and decoration `scale` optional in stage definitions.
- Applied a default scale of `1` when stage objects omit `scale`.
### 日本語
- ステージ定義の街灯と装飾オブジェクトの`scale`を省略可能にしました。
- `scale`が未指定の場合はデフォルトで`1`を適用するようにしました。
## v0.1.57
### English
- Added optional per-stage overrides for world top, world bottom, ground top, ground visual, and street lamp ground height.
- Updated stage rendering and bounds logic to resolve stage-specific constants with shared defaults.
### 日本語
- ステージごとに空上限、下限、地面高さ、地面描画位置、街灯の地面基準を上書きできるようにしました。
- ステージ描画とワールド境界処理が、ステージ固有値と共通デフォルトを合成して参照するようにしました。
## v0.1.56
### English
- Centralized world bounds and ground-height constants in `stageConstants.ts`.
- Updated gameplay and stage rendering code to import shared ground and sky limits from one place.
### 日本語
- ワールド境界と地面高さの定数を`stageConstants.ts`に一元化しました。
- ゲーム処理とステージ描画が共通の地面・空上限設定を参照するようにしました。
## v0.1.55
### English
- Fixed the swapped stage file by restoring the missing `NEON_CANAL_STAGE` export reference.
- Kept the newly imported stage data intact while allowing `ACTIVE_STAGE` to resolve again.
### 日本語
- 差し替えたステージファイルで不足していた`NEON_CANAL_STAGE`の参照を復旧しました。
- 取り込まれたステージデータ自体は維持しつつ、`ACTIVE_STAGE`が再び解決できるようにしました。
## v0.1.54
### English
- Moved the editor panel MOVE handle inside the expanded editor body so the EDITOR toggle button stays out of the drag target.
- Added Delete-key removal for the currently selected editable object.
- Added direct drag movement for the currently selected editable object on the stage.
### 日本語
- エディタパネルのMOVEハンドルを展開中のエディタ本体内へ移動し、EDITORボタン自体はドラッグ対象から外しました。
- 選択中の編集対象をDeleteキーで削除できるようにしました。
- ステージ上の選択中オブジェクトを直接ドラッグ移動できるようにしました。
## v0.1.53
### English
- Moved the stage editor panel DOM, form controls, export field, and drag handling into a dedicated `stageEditorPanel.ts` module.
- Added a draggable MOVE handle so the editor panel can be repositioned on screen.
### 日本語
- ステージエディタのパネルDOM、フォーム操作、エクスポート欄、ドラッグ処理を専用の`stageEditorPanel.ts`へ分割しました。
- エディタパネルにドラッグ用のMOVEハンドルを追加し、画面上の好きな位置へ移動できるようにしました。
## v0.1.52
### English
- Centered the control hint text at the top of the game screen.
- Added Select, Move Selected, and Delete tools to the stage editor.
- Added a visible selection outline and stage redraw flow so edited placements update the preview and exported JSON together.
### 日本語
- 操作方法の説明テキストを画面上部中央揃えにしました。
- ステージ編集機能にSelect、Move Selected、Deleteツールを追加しました。
- 選択中の枠表示とステージ再描画処理を追加し、編集結果がプレビューとエクスポートJSONに反映されるようにしました。
## v0.1.51
### English
- Renamed the start modal title to `SUPER ZANNENIN SISTERS`.
- Added sound on/off selection to the start modal, linked to the existing volume and mute cookies.
- Moved start modal DOM and event handling into a dedicated `startModal.ts` module.
### 日本語
- 開始時モーダルのタイトルを`SUPER ZANNENIN SISTERS`へ変更しました。
- 開始時モーダルに音あり/音なし選択を追加し、既存の音量・ミュートCookieと連動させました。
- 開始時モーダルのDOM生成とイベント処理を専用の`startModal.ts`へ分割しました。
## v0.1.50
### English
- Moved the start countdown visual and timer logic into a dedicated `countdown.ts` module.
- Kept countdown behavior unchanged while leaving `main.ts` focused on run-state transitions.
### 日本語
- 開始時カウントダウンの表示とタイマー処理を専用の`countdown.ts`へ分割しました。
- カウントダウンの挙動は変えず、`main.ts`側はラン状態の切り替えに集中する形にしました。
## v0.1.49
### English
- Split long static definitions out of `main.ts` into focused `assets.ts`, `stages.ts`, and `rainbowPipeline.ts` modules.
- Kept gameplay behavior unchanged while reducing the amount of code future agents need to read for common gameplay edits.
### 日本語
- `main.ts`内の長い静的定義を、`assets.ts`、`stages.ts`、`rainbowPipeline.ts`へ分割しました。
- ゲーム挙動は変えず、今後のAIエージェントが通常のゲームロジック修正で読むコード量を減らしました。

## v0.1.48
### English
- Made crouching movement slower by reducing crouch acceleration and max horizontal speed.
- Slightly increased both normal jump and boosted jump height.
### 日本語
- しゃがみ中の加速度と最高横移動速度を下げ、しゃがみ移動を少し遅くしました。
- 通常ジャンプと加速中ジャンプの高さをそれぞれ少し高くしました。

## v0.1.47
### English
- Reduced the player collision box while crouching, keeping the feet anchored to the same bottom position.
### 日本語
- しゃがみ中のプレイヤー当たり判定を小さくし、足元位置は通常時と同じ高さに揃えました。

## v0.1.46
### English
- Added a `HIT` debug toggle that displays collision rectangles for the player, platforms, items, and goal.
### 日本語
- プレイヤー、足場、アイテム、ゴールの当たり判定矩形を表示できる`HIT`デバッグ切替ボタンを追加しました。

## v0.1.45
### English
- Cancel the remaining landing animation immediately when crouch input is pressed during landing, then transition directly into the crouch animation.
### 日本語
- 着地モーション中にしゃがみ入力を押した場合、残りの着地モーションを即キャンセルしてしゃがみアニメーションへ直接遷移するようにしました。

## v0.1.44
### English
- Rebuilt the crouch spritesheet with horizontal alignment based on each frame's head center to reduce side-to-side sliding.
### 日本語
- 各フレームの頭中心を基準に横位置を揃えてしゃがみスプライトを再生成し、左右のスライドぶれを抑えました。

## v0.1.43
### English
- Rescaled the crouch spritesheet so its first standing frame matches the idle animation's first-frame character height and foot position.
- Applied the same scale and alignment to all crouch frames for consistent character size.
### 日本語
- しゃがみスプライトの初期立ちフレームが、待機アニメ初期フレームのキャラクター高さと足元位置に合うように再スケールしました。
- 同じ倍率と位置合わせを全しゃがみフレームへ適用し、キャラクターサイズ感を統一しました。

## v0.1.42
### English
- Built a crouch spritesheet from the `mabiki` frame images.
- Added a crouch animation that plays while the down input is held.
### 日本語
- `mabiki`フォルダ内のフレーム画像を結合して、しゃがみ用スプライトシートを作成しました。
- 下入力を押している間、しゃがみアニメーションを再生するようにしました。

## v0.1.41
### English
- Moved the version display into the same top-right DOM layout as the BGM and options buttons to prevent overlap at 16:9 resolutions.
### 日本語
- 16:9解像度で重ならないよう、バージョン表示をBGM/Optionsボタンと同じ右上DOMレイアウト内へ移動しました。

## v0.1.40
### English
- Doubled the remaining landing animation playback speed when the player starts moving left or right during the landing animation.
### 日本語
- 着地モーション中に左右移動を始めた場合、残りの着地アニメーション再生速度が2倍になるようにしました。

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

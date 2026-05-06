# Release Notes / リリースノート

Older entries through v0.1.100 were moved to `docs/RELEASE_NOTES_ARCHIVE.md`.

## v0.1.322
### English
- Added a device-local mobile button layout editor so the lower-left movement pad and lower-right action buttons can be dragged, saved, and reset on each smartphone.
### Japanese
- スマホモードで、左下の移動パッドと右下のアクションボタンをドラッグして配置変更・保存・リセットできるようにしました。配置は端末ごとの保存にしています。

## v0.1.321
### English
- Added Chinese and Korean coverage for the player spec page, high-priority player UI, stage editor controls, and in-game checkpoint / one-way gate callouts.
### Japanese
- ゲーム仕様ページ、プレイヤーがよく見るUI、ステージエディタの操作表示、ゲーム中のチェックポイント・一方通行ゲート表示に中国語・韓国語対応を追加しました。

## v0.1.320
### English
- Added Safari-focused mobile zoom guards to reduce accidental page zoom during touch controls and kept compact form fields above iOS auto-zoom font sizes.
### Japanese
- Safariのモバイル操作中に意図せず画面が拡大されにくいよう、タッチ操作時のズーム対策を追加し、コンパクト表示の入力欄もiOSの自動拡大条件にかかりにくくしました。

## v0.1.319
### English
- Hardened mobile control release handling so touch buttons are less likely to remain stuck after browser gestures, fullscreen changes, or interrupted pointer events.
### Japanese
- モバイル操作のボタンが、ブラウザ操作や全画面切り替え、タッチイベントの中断後に押しっぱなしで固定されにくいよう、解放処理を強化しました。

## v0.1.318
### English
- Merged the latest `origin/main` multilingual updates into the tutorial branch.
- Localized the rebuilt tutorial's movement, jump, dash, multi-jump, crouch, drop-through, and goal prompts for Japanese, English, Chinese, and Korean.
- Kept the recent tutorial flow refinements, including early prompt closing, the dash wall, clearer stamina explanations, and the air-jump multi-jump wording.
### Japanese
- 最新の`origin/main`の多言語対応をチュートリアル作業ブランチへ取り込みました。
- 作り直したチュートリアルの左右移動、移動ジャンプ、ダッシュ、多段ジャンプ、しゃがみ、すり抜け、ゴール説明を日本語・英語・中国語・韓国語に対応しました。
- 説明の早期クローズ、ダッシュ壁、スタミナ説明の明確化、空中ジャンプとしての多段ジャンプ説明など、最近のチュートリアル調整を維持しました。

## v0.1.316
### English
- Added Chinese and Korean translations for leaderboard results, Google account linking prompts, and the account/player ID panel.
### Japanese
- ランキング画面の結果表示、Google連携の案内、アカウント・プレイヤーID画面に残っていた中国語・韓国語未対応の文言を補いました。

## v0.1.315
### English
- Added Chinese and Korean translations for start modal account, anonymous play, ghost replay, orientation, and install prompts.
### Japanese
- トップ画面の匿名プレイ、Googleログイン、ゴースト、横画面確認、ホーム画面追加などの文言に中国語・韓国語訳を追加しました。

## v0.1.314
### English
- Added multilingual text to the first-run sound confirmation and filled in missing Chinese and Korean left-side story messages.
### Japanese
- 初回の音量確認に日英中韓の併記を追加し、左上メッセージUIに残っていた中国語・韓国語未対応のステージ会話を補いました。

## v0.1.313
### English
- Strengthened Chinese font fallbacks for danmaku comments and the left-side story message UI.
### Japanese
- 中国語の弾幕コメントと左上メッセージUIが文字化けしにくいように、中国語フォントのフォールバック指定を強化しました。

## v0.1.312
### English
- Fixed Korean danmaku text rendering by restoring localized comment strings and using CJK font fallbacks, and localized the fixed left-side story messages.
### Japanese
- 韓国語の弾幕コメントが文字化けしないようにローカライズ文字列とCJKフォント指定を修正し、左上の固定メッセージも多言語対応しました。

## v0.1.311
### English
- Localized all danmaku-style comments, live chat names, and reaction bursts for English, Japanese, Chinese, and Korean.
### Japanese
- 弾幕風コメント、ライブチャット風のユーザー名、リアクション連投表示を英語・日本語・中国語・韓国語に対応しました。

## v0.1.310
### English
- Redirected removed card-only share URLs back to the main game page so old cleanup paths no longer serve the SPA fallback.
### Japanese
- 削除したカード専用共有URLがSPAフォールバックで残らないように、本体ページへリダイレクトする設定を追加しました。

## v0.1.309
### English
- Simplified X sharing to use the main game URL with a cache-busting query string and removed the extra card-only share page workaround.
### Japanese
- X共有を本体URLにキャッシュ対策クエリを付ける方式へ整理し、カード専用共有ページの回避策を削除しました。

## v0.1.308
### English
- Switched X share cards to a fresh 1200x600 JPEG image with a new physical URL and removed JavaScript redirects from the card-only share page.
### Japanese
- Xカード用画像を新しい物理URLの1200x600 JPEGに変更し、カード専用共有ページからJavaScript遷移を外しました。

## v0.1.307
### English
- Added a dedicated static X share page with fresh OGP metadata, updated leaderboard sharing to use it, and added a real robots.txt for crawlers.
### Japanese
- Xカード用の静的共有ページを追加し、ランキング共有でそのURLを使うようにしました。クローラー向けにrobots.txtも追加しました。

## v0.1.306
### English
- Updated X sharing to pass the game URL through the Web Intent URL parameter and added cache-busting query strings for the shared URL and OGP image.
### Japanese
- X投稿時にゲームURLをWeb IntentのURLパラメータとして渡すようにし、共有URLとOGP画像にキャッシュ対策のクエリ文字列を付けました。

## v0.1.305
### English
- Made leaderboard Functions accept safe new stage IDs without requiring a Functions allowlist update for every added stage.
### Japanese
- 新しいステージを追加するたびにFunctions側の許可リストを更新しなくても、安全な形式のステージIDならランキング登録できるようにしました。

## v0.1.304
### English
- Changed the maker splash logo so it stays on screen until tapped, with an automatic advance after eight seconds.
### Japanese
- 満足教Presentsのロゴが勝手にすぐ消えず、タップで進み、8秒間操作がない場合だけ自動で進むようにしました。

## v0.1.303
### English
- Updated the leaderboard Functions stage allowlist so current playable stages, including the default Original Downtown stage, can submit scores.
### Japanese
- ランキングFunctions側のステージ許可リストを更新し、デフォルトのOriginal Downtownを含む現在のプレイ可能ステージでスコア登録できるようにしました。

## v0.1.302
### English
- Added Chinese and Korean language options with localized stage labels and key UI text.
- Marked unfinished stages as WIP while leaving Shibu-ya city and Sky Shaft Climb unmarked.
- Made the PRESS TO START prompt hold longer on its centered frame to reduce visual noise.
### Japanese
- 中国語と韓国語の言語選択を追加し、ステージ名と主要なUI文言を表示できるようにしました。
- シブヤシティとスカイシャフト・クライム以外の未完成ステージに作成中表示を付けました。
- PRESS TO STARTが中央位置で長めに止まるようにして、タイトル画面のうるささを抑えました。

## v0.1.301
### English
- Made the account test-data clear action also reset the first-run title sound confirmation flag.
### Japanese
- テストデータ削除時に、初回タイトル音量チェックの確認済みフラグも削除し、次回起動で音量チェックが再表示されるようにしました。

## v0.1.300
### English
- Made title music recover when browser autoplay blocks a later title-screen playback by retrying on the next user gesture and during the title loop.
### Japanese
- 2回目以降のタイトル画面でブラウザの自動再生制限により音楽が止まった場合でも、次の操作やタイトルループ中に再試行してBGMが戻るようにしました。

## v0.1.299
### English
- Slowed the PRESS TO START prompt sheet animation while restoring its previous glow strength.
- Fixed the mobile start confirmation overlay so anonymous mobile play can continue from the start modal.
### Japanese
- PRESS TO STARTの横スライド演出をゆっくりにしつつ、発光の強さは前の状態に戻しました。
- スマホモードで匿名プレイを押した時の確認表示がトップモーダルより前に出るようにし、開始へ進めるようにしました。

## v0.1.298
### English
- Made the PRESS TO START prompt calmer by reducing its size, glow, opacity, and blink speed on the title screen.
### Japanese
- タイトル画面のPRESS TO START表示を少し小さくし、発光、不透明度、点滅速度を抑えて落ち着いた見た目にしました。

## v0.1.297
### English
- Prevented the title logo fade-in from replaying after the first title video playback, so later still-image holds appear immediately.
### Japanese
- タイトル動画の初回再生後に静止画へ戻る時、タイトルロゴのフェードインが再発生しないようにし、2回目以降の静止画はすぐ表示されるようにしました。

## v0.1.296
### English
- Adjusted the title logo loop so the first still image appears after the fade for three seconds before video playback, then repeats with ten-second still holds and no additional fade-in.
### Japanese
- タイトルロゴのループを調整し、初回はフェードイン後に静止画を3秒表示して動画を再生し、その後はフェードインなしで静止画10秒、動画再生を繰り返すようにしました。

## v0.1.295
### English
- Delayed the maker splash animation until after the sound confirmation is dismissed, preserving the intended sound check -> maker logo -> title -> start modal order.
### Japanese
- 音量確認が閉じるまで企業風ロゴのアニメーションを開始しないようにし、音量チェック、企業風ロゴ、タイトル画面、トップモーダルの順番を保つようにしました。

## v0.1.294
### English
- Skipped the splash/logo sequence when returning to the title from gameplay, opening the start modal directly.
### Japanese
- ゲーム中からタイトルへ戻る時は、スプラッシュやタイトルロゴ演出を挟まず、トップモーダルへ直接戻るようにしました。

## v0.1.293
### English
- Changed X share text so the hashtag appears after a blank line below the Best line, followed by another blank line and the game URL.
### Japanese
- Xシェア文で、ベスト行の下に空行を入れてハッシュタグを表示し、さらに空行を入れてゲームURLを表示するようにしました。

## v0.1.292
### English
- Added a first-run sound on/off confirmation before the splash logos.
- Added title-screen music playback with a three-second ending fade and a five-second gap before replaying.
### Japanese
- スプラッシュロゴの前に、初回向けの音量オン/オフ確認を追加しました。
- タイトル画面で音楽を再生し、曲の終わり約3秒でフェードアウトして、約5秒空けてから再び流れるようにしました。

## v0.1.291
### English
- Added a Phaser-level P screenshot shortcut so PC capture works even when browser-level key events are intercepted, and paused gameplay while the screenshot preview is open.
- Added an opaque black mask behind the splash logos so the game canvas cannot briefly show through during title transitions.
### Japanese
- PC版のPキー撮影をPhaser側にも登録してキー入力が取られにくいようにし、スクリーンショットのプレビュー表示中はゲーム進行を一時停止するようにしました。
- スプラッシュロゴの背面に不透明な黒マスクを追加し、タイトル遷移中にゲーム画面が一瞬透けて見えないようにしました。

## v0.1.290
### English
- Added a skippable maker-style splash before the title screen.
- Added the title splash flow with a fading logo, blinking PRESS TO START prompt, still/video loop, and soft blackout transition into the start modal.
- Removed the duplicated title text from the start modal and restored its game-start button to the normal text style.
### Japanese
- タイトル画面のさらに手前に、タップでスキップできるメーカー風スプラッシュロゴを追加しました。
- タイトルロゴのフェード表示、点滅するPRESS TO START、静止画と動画のループ、トップモーダルへ進む時の暗転演出を追加しました。
- トップモーダル内で重複していたタイトル表示を削除し、ゲーム開始ボタンは通常のテキストボタン表示に戻しました。

## v0.1.289
### English
- Restored OGP/Twitter Card metadata and the OGP image asset in the app build, and changed X sharing to pass the game URL through the tweet intent URL parameter.
### Japanese
- アプリのビルドにOGP/Twitter Card用のメタタグとOGP画像を含め直し、XシェアではゲームURLを本文ではなく投稿用URLパラメータとして渡すようにしました。

## v0.1.288
### English
- Swapped the compact header controls so the menu button stays on the right and the screenshot button sits immediately to its left.
### Japanese
- コンパクト表示のヘッダー操作を入れ替え、メニューボタンを右端に置き、その左隣にスクリーンショットボタンを表示するようにしました。

## v0.1.287
### English
- Changed the PC screenshot shortcut from F2 to P because browser or OS shortcuts can intercept function keys.
### Japanese
- PC版のスクリーンショットショートカットをF2キーからPキーに変更し、ブラウザやOS側にキー入力を取られにくくしました。

## v0.1.286
### English
- Kept the screenshot button beside the function menu on compact phone layouts, so captures are available without opening the drawer.
### Japanese
- スマホなどのコンパクト表示でも、スクリーンショットボタンを機能メニューの隣に常時表示し、メニューを開かずに撮影できるようにしました。

## v0.1.285
### English
- Added game-canvas screenshot capture with a keyboard shortcut, a global screenshot button, and a clear-screen preview/download flow.
### Japanese
- キーボードショートカットでゲーム画面だけを撮影し、機能メニューやクリア後のボタンからプレビューして保存できるようにしました。

## v0.1.284
### English
- Made the account test-data clear action also remove local app settings and Firebase sign-in persistence while keeping scores intact.
- Updated the OGP/Twitter card image to the newer game logo artwork and removed the previous source image.
- Added a 1200x630 title illustration as the site's OGP/Twitter card image.
- Fixed leaderboard result actions so share and close buttons align cleanly on desktop and compact mobile layouts.
### Japanese
- アカウント画面のテストデータ削除で、スコアを残したままローカルのアプリ設定とFirebaseログイン保持も削除するようにしました。
- OGP/Twitterカード画像を新しいゲームロゴ画像に差し替え、前の元画像をソース管理から削除しました。
- サイトのOGP/Twitterカード画像として、タイトルイラストを1200×630に加工して設定しました。
- ランキング結果画面のシェアと閉じるボタンがPCとスマホで崩れないよう、下部レイアウトを整理しました。

## v0.1.283
### English
- Made the danmaku options tutorial strictly once per account, so test-data clearing no longer resets its seen flag.
### Japanese
- 弾幕設定案内メッセージをアカウントごとに完全に一度きりにし、テストデータ削除でも表示済み状態が戻らないようにしました。

## v0.1.282
### English
- Added a once-per-account story message that appears after the first non-MISS danmaku finishes, explaining that comment display can be hidden or restyled from Options.
### Japanese
- MISS以外の弾幕が初めて流れた後に、オプションからコメント表示のオンオフやスタイル変更ができることを案内するメッセージを、アカウントごとに一度だけ表示するようにしました。

## v0.1.281
### English
- Replaced the separate danmaku visibility checkbox with a single comment display-style selector that includes Hidden, while keeping Nico-style as the default.
### Japanese
- オプションの弾幕表示チェックボックスをなくし、コメント(弾幕)表示形式のセレクトボックスに「表示なし」を追加しました。デフォルトはニコ動風のままです。

## v0.1.280
### English
- Added a one-time 3.4-second story message with an excited portrait when the goal gate first enters the camera view.
### Japanese
- ゴールゲートが初めて視界に入った時、ワクワクした表情でゴールに気づくメッセージを3.4秒だけ表示するようにしました。

## v0.1.279
### English
- Show an equivalent leaderboard placement for the current score even when the best score is not updated, and use placement wording in share text.
### Japanese
- ベスト未更新でランキングに記録されない今回スコアにも順位相当を表示し、シェア文でもランクではなく順位として伝えるようにしました。

## v0.1.278
### English
- Made X share text show stage, score, rank, and best-update status as clear labeled lines.
### Japanese
- Xシェア文でステージ、スコア、ランク、ベスト更新状態がわかりやすく並ぶようにしました。

## v0.1.277
### English
- Fixed the stage-midpoint story message so its midpoint is recalculated after the selected stage is applied at run start.
- Compressed the leaderboard result layout for landscape phone screens and added an X share button for the submitted score.
### Japanese
- プレイ開始時に選択されたステージを反映した後で中間点を計算し直し、中間地点メッセージが正しく表示されるようにしました。
- スマホ横表示でランキング結果画面が潰れにくいように下部レイアウトを圧縮し、今回のスコアをXでシェアできるボタンを追加しました。

## v0.1.276
### English
- Replaced the PWA and favicon artwork with a cropped face icon from the new character image, including multi-size PNG outputs and a foreground 満 mark.
- Renamed the start-screen advanced panel to "Replay ghost options" so it matches the ghost-only controls inside.
### Japanese
- 新しいキャラクター画像から顔部分を切り抜いたPWA/ファビコン用アイコンに差し替え、複数サイズのPNGと手前の「満」マークを追加しました。
- トップ画面の詳細パネル名を「リプレイゴースト設定」に変更し、中にあるゴースト関連の操作内容と合うようにしました。

## v0.1.275
### English
- Added a one-time 3.5-second story message when stamina first reaches zero during a stage.
### Japanese
- ステージ中に初めてスタミナが0になった時、息切れのメッセージを3.5秒だけ表示するようにしました。

## v0.1.274
### English
- Added a one-time danmaku reaction when gameplay controls are left untouched for 15 seconds, with comments wondering whether the player stepped away, fell asleep, or disconnected.
### Japanese
- プレイ中に操作しない状態が15秒続いた時、一度だけ離席や寝落ち、回線切断を心配する弾幕が流れるようにしました。

## v0.1.273
### English
- Added a one-time four-second story message when the player passes the stage midpoint, using the stage's wider axis for horizontal stages and taller axis for vertical stages.
### Japanese
- ステージが横長か縦長かを判定し、進行方向の中間点を越えた時に一度だけ4秒間のメッセージを表示するようにしました。

## v0.1.272
### English
- Hid the PWA install prompt immediately after the install flow is accepted, including when returning focus to the original browser game screen.
### Japanese
- PWA追加を受け入れた直後や元のブラウザ画面に戻った時に、追加案内が残らないようにしました。

## v0.1.271
### English
- Added an account-screen test tool that clears Google-linked app settings and recorded flags without deleting stage scores.
### Japanese
- アカウント画面に、スコアを残したままGoogle連携の設定や記録済みフラグを削除できるテスト用の操作を追加しました。

## v0.1.270
### English
- Fixed the start button flow so smartphone players are prompted again when starting from a portrait viewport, even after a previous landscape setup succeeded.
### Japanese
- スマホで一度横画面設定に成功した後でも、プレイ開始時に現在の画面が縦向きなら、横向きにするかこのまま開始するかを再確認するようにしました。

## v0.1.269
### English
- Changed the top-right Title shortcut from text to a home-style icon.
- Reflected the imported Shibu-ya city stage JSON into the playable Shibu-ya city stage layout.
- Set the first-play default stage explicitly to Shibu-ya city instead of the legacy neonCanal alias.
### Japanese
- 右上のタイトルへ戻るボタンを文字表示からホーム風のアイコン表示に変更しました。
- 読み込んだシブヤシティのステージJSONを、プレイ対象のシブヤシティのステージ配置に反映しました。
- 初回プレイ時のデフォルトステージを、旧名称のneonCanalではなく明示的にシブヤシティへ設定しました。

## v0.1.268
### English
- Added a short touch-control tutorial stage that introduces movement, jumping, dash, a checkpoint, and a simple stationary enemy.
- Refined smartphone detection to use mobile user agents, coarse touch pointers, and viewport shape consistently across start-screen guidance and PWA prompts.
- Added a mobile fullscreen recovery prompt when fullscreen is dropped after touch play has entered fullscreen once.
### Japanese
- タッチ操作向けの短いチュートリアルステージを追加し、移動、ジャンプ、ダッシュ、チェックポイント、静止敵を軽く試せるようにしました。
- スマートフォン判定を見直し、ユーザーエージェント、タッチポインタ、画面サイズの条件を開始画面の案内とPWA導線で共通化しました。
- モバイルプレイ中にフルスクリーンが解除された場合、フルスクリーンへ戻す案内を表示するようにしました。

## v0.1.267
### English
- Split option-screen audio controls into separate BGM and SE volume sliders while keeping the top sound button as a global mute toggle.
- Migrated existing single-volume settings into both BGM and SE volumes and included the new values in Google-linked setting sync.
### Japanese
- オプション画面の音量設定をBGM音量とSE音量に分け、上部のサウンドボタンは全体ミュートとして使えるようにしました。
- 既存の単一音量設定はBGM/SEの両方へ引き継ぎ、Google連携時の設定同期にも新しい音量値を含めるようにしました。

## v0.1.266
### English
- Added a smartphone home-screen install path with PWA metadata, a service worker, and start-screen guidance.
- Highlighted the mobile control buttons the first time mobile mode starts so new players can spot the touch layout quickly.
### Japanese
- スマートフォン向けにホーム画面追加の導線を追加し、PWA用のメタ情報とサービスワーカー、開始画面での案内を整えました。
- モバイルモード初回開始時だけ操作ボタンをハイライトし、タッチ操作の配置をすぐ把握しやすくしました。

## v0.1.265
### English
- Made leaderboard and Google account failure messages clearer about whether play can continue, highlighted account/ranking errors, and improved mobile safe-area spacing for controls and the top menu.
### Japanese
- ランキングやGoogle連携の失敗時にプレイ継続可否が分かる文言へ調整し、エラー表示を目立たせ、スマホ操作ボタンと上部メニューのsafe-area対応を強化しました。

## v0.1.264
### English
- Improved the smartphone startup flow with a success message after landscape fullscreen setup and a portrait-start confirmation that can either retry landscape fullscreen or start anyway.
### Japanese
- スマートフォン向け初回導線を改善し、横画面・フルスクリーン切り替え成功時の表示と、縦画面開始時に「横向きにする」か「このまま開始」を選べる確認を追加しました。


## v0.1.263
### English
- Aligned the top-left stamina gauge fill with its outer frame at 100 stamina.
### Japanese
- 左上のスタミナゲージが100の時、外枠とゲージ本体のサイズが揃うようにしました。

## v0.1.262
### English
- Temporarily hid clear rank and mission summary lines from the result display while keeping the calculations available for later restoration.
### Japanese
- クリア時のランク表示とミッション達成表示をリザルトから一時的に非表示にし、後で戻せるように計算処理は残しました。

## v0.1.261
### English
- Renamed the top-right spec shortcut to Guide.
- Updated the mobile Full button to request landscape orientation when entering fullscreen and refresh the Phaser layout afterward.
### Japanese
- 右上の「仕様」ボタン表記を「取説」に変更しました。
- スマホモードの「Full」ボタンでフルスクリーンに入る時に横画面もリクエストし、その後Phaserの表示領域を再計算するようにしました。

## v0.1.260
### English
- Forced Phaser to refresh its scale layout after landscape fullscreen restoration so the canvas no longer keeps a portrait-sized drawing area.
### Japanese
- 横フルスクリーンへ戻した後にPhaserのスケール計算を明示的に更新し、描画領域が縦画面サイズのまま残らないようにしました。

## v0.1.259
### English
- Added a mobile restore button after loading a local ghost JSON file so players can re-enter landscape fullscreen when the file picker exits fullscreen or rotates the screen.
### Japanese
- スマホでローカルのゴーストJSONファイルを読み込んだ後、ファイル選択でフルスクリーン解除や縦画面戻りが起きた場合に、横フルスクリーンへ戻れるボタンを表示するようにしました。

## v0.1.258
### English
- Changed the clear result text to use a thin outline.
- Added a Back to Menu button below the clear-screen ghost JSON export button that returns to the initial menu like the Title control.
- Added a mobile-only function menu button that slides out the top-right controls while keeping the version label visible.
- Moved the stage editor panel into the same mobile slide-out flow so it stays tucked away until the menu is opened.
### Japanese
- クリア時の結果表示を細い縁取りに変更しました。
- クリア画面のゴーストJSON出力ボタンの下に「メニューに戻る」を追加し、タイトル操作と同じように最初のメニューへ戻れるようにしました。
- スマホ表示時だけ右上の機能ボタンをメニューアイコンにまとめ、押すと横からスライド表示されるようにしました。
- ステージ編集パネルも同じスマホ用メニューの開閉に合わせて表示し、バージョン表記は常に見えるようにしました。

## v0.1.257
### English
- Renamed the game to スーパー残念院さんランド / SUPER ZANNENIN=SAN LAND and renamed Neo Shibuya City to WIP Neo Shibuya City.
### Japanese
- ゲームタイトルを「スーパー残念院さんランド」/「SUPER ZANNENIN=SAN LAND」に変更し、ステージ名「ネオシブヤシティ」を「作成中ネオシブヤシティ」に変更しました。

## v0.1.256
### English
- Selecting yes on the smartphone landscape fullscreen prompt now also switches the start screen control mode to mobile.
### Japanese
- スマートフォン向けの横画面・フルスクリーン確認で「はい」を選んだ時に、スタート画面の操作モードも自動でモバイルモードへ切り替わるようにしました。

## v0.1.255
### English
- Updated the start screen and browser title to 作成中ネオシブヤシティ.
- Reduced the Skybridge Sprint midground opacity to improve stage readability.
- Added a smartphone startup prompt that asks to switch to landscape fullscreen, attempts fullscreen and orientation lock when accepted, and falls back to a rotate-device retry prompt when the browser blocks it.
### Japanese
- スタート画面とブラウザタイトルを「作成中ネオシブヤシティ」に変更しました。
- 動物園ステージの視認性を上げるため、中景を少し薄く表示するようにしました。
- スマートフォンと思われる環境で、スタート画面の前に横画面・フルスクリーン推奨の確認を表示し、許可された場合は自動切り替えを試み、失敗時は端末を横向きにして再試行できる案内を出すようにしました。

## v0.1.254
### English
- Reworked the mobile start screen into a dedicated vertical layout with a sticky start area, collapsed ghost options, and hidden background controls while the modal is open.
- Reworked leaderboard, account, and options modals for mobile with full-height sheets, tighter columns, fixed modal isolation, and compact landscape layouts.
### Japanese
- スマホ向けスタート画面を専用の縦レイアウトに作り直し、スタート操作を下部に固定し、ゴースト設定を折りたたみ、モーダル表示中は背後の操作UIを隠すようにしました。
- ランキング、アカウント、設定モーダルをスマホ向けの全高シートに作り直し、列幅と横画面レイアウトを調整し、モーダル表示中は背後のUIが干渉しないようにしました。

## v0.1.253
### English
- Prevented stomp combo resets during the brief post-stomp free-jump window, avoiding accidental combo loss from transient landing detection.
### Japanese
- 踏みつけ直後の無料ジャンプ受付中は連続踏みコンボを着地リセットしないようにし、一瞬の着地判定でコンボが切れないようにしました。

## v0.1.252
### English
- Added a short free-jump window after stomping an enemy so pressing jump can launch again without spending stamina.
### Japanese
- 敵を踏んだ直後に短い無料ジャンプ受付を追加し、ジャンプ入力でスタミナを消費せずに再ジャンプできるようにしました。

## v0.1.251
### English
- Tightened the start screen by removing the player spec link, renaming ghost loading to ghost file loading, and placing player name, language, and stage inputs beside their labels.
### Japanese
- スタート画面からゲーム仕様リンクを削除し、ゴースト読込をゴーストFile読込に変更して、プレイヤー名・言語・ステージをラベル左、入力右の横並びにしました。

## v0.1.250
### English
- Changed ranking ghost selection to start unselected and load immediately when a ghost is chosen, removing the separate load button.
### Japanese
- ランキングゴースト選択を初期未選択にし、選択した時点で即読み込むようにして、専用の読込ボタンを削除しました。

## v0.1.249
### English
- Moved the ghost JSON export button to the upper-right of the clear screen so closing the leaderboard modal does not accidentally trigger a download.
### Japanese
- ゴーストJSON出力ボタンをクリア画面の右上に移動し、ランキング画面を閉じる操作で誤ってダウンロードされにくくしました。

## v0.1.248
### English
- Added a short Ranking Check stage with a nearby goal and several items for quick leaderboard and ghost replay testing.
### Japanese
- ランキングとゴースト確認用に、ゴールが近くアイテムを複数配置した短い確認ステージを追加しました。

## v0.1.247
### English
- Changed the Firebase ranking ghost replay storage format so Firestore accepts saved replay frames without nested arrays.
### Japanese
- Firebaseのランキングゴースト保存形式をFirestore対応に変更し、リプレイフレームが保存エラーにならないようにしました。

## v0.1.246
### English
- Added a clear result message after score submission that verifies whether the ranking ghost replay can actually be loaded from Firebase.
### Japanese
- スコア登録後に、ランキングゴーストがFirebaseから実際に読み込める状態かを確認して表示するようにしました。

## v0.1.245
### English
- Restored the three jump-height tiers: normal jumps, speed-boosted jumps from horizontal momentum, and higher Shift dash jumps only while dash input is held.
- Made leaderboard ghost registration atomic so the score entry cannot advertise a ghost unless the ghost replay document is saved with it.
### Japanese
- ジャンプ高さを、通常ジャンプ、横速度による加速中ジャンプ、Shiftダッシュ入力中だけの高いジャンプの3段階に戻しました。
- ランキングゴーストの登録を一括書き込みにし、ゴースト本体が保存されていないのにスコア側だけがゴーストありになる状態を防ぐようにしました。

## v0.1.244
### English
- Limited dash-boosted jumps to moments when dash input is actively held, preventing dash linger momentum from turning normal jumps into super jumps.
- Hid leaderboard ghost choices when the saved ghost replay document is missing or unreadable, preventing unavailable ghosts from being selected.
### Japanese
- ダッシュ強化ジャンプはShift/ダッシュ入力を実際に押している時だけ発生するようにし、ダッシュ残留中の慣性で通常ジャンプがスーパージャンプ化しないようにしました。
- 保存済みゴーストの実体が存在しないランキング項目は、スタート画面のゴースト選択肢に出さないようにしました。

## v0.1.243
### English
- Made stamina recover twice as fast while crouching, and documented crouch recovery plus drop-through floors in the player spec and control hints.
### Japanese
- しゃがみ中はスタミナが通常の2倍速で回復するようにし、取説と操作ヒントにしゃがみ回復と床すり抜けの説明を追記しました。

## v0.1.242
### English
- Halved the display timing for the X-position story dialogue and its follow-up message.
- Halved dash stamina drain and added a short dash linger after releasing Shift so tapping dash can conserve stamina while keeping momentum.
### Japanese
- X軸地点に到達した時に出るストーリーメッセージと、その後のメッセージの表示時間を半分にしました。
- ダッシュのスタミナ消費を半分にし、Shiftを離した後も短くダッシュが持続するようにして、細かく押すことでスタミナを温存できるようにしました。

## v0.1.241
### English
- Added a queued story-message popup for the first Aqua Mascot stomp, using the sad portrait and a five-second apology line.
- Added start-screen controls for selecting and loading saved top-ranking ghosts from Firebase.
### Japanese
- 初めてAqua Mascotを踏んだ時に、sad表情のメッセージUIで謝罪セリフを5秒表示するようにしました。既に会話UIが出ている場合は順番待ちで表示されます。
- スタート画面からFirebaseに保存されたランキング上位ゴーストを選んで読み込めるようにしました。

## v0.1.240
### English
- Changed the time-up danmaku presentation to use the same centered fixed reaction-wave style as MISS while keeping dedicated timeout comments.
- Save ghost replay data to Firebase when an accepted leaderboard submission reaches the stage top 10.
### Japanese
- 時間切れ時の弾幕演出を、専用コメントのままMISS時と同じ中央揃えの固定リアクション波に変更しました。
- ランキング登録でステージ10位以内に入ったプレイのゴーストリプレイをFirebaseに保存するようにしました。

## v0.1.239
### English
- Added a dedicated timeout-scene danmaku comment set so time-up reactions no longer reuse generic miss wording.
- Added ghost replay JSON recording, export after clearing a stage, and ghost JSON loading from the start screen.
### Japanese
- 時間切れシーン専用の弾幕コメントを新しく用意し、通常のMISSとは違うリアクションが出るようにしました。
- ゴーストリプレイ用のJSON記録を追加し、ステージクリア後の出力とスタート画面からの読み込みに対応しました。

## v0.1.238
### English
- Added an overhead stamina gauge that appears above the player while stamina is reduced and hides again at full recovery.
### Japanese
- スタミナが減っている間だけプレイヤーの頭上にスタミナゲージを表示し、全回復すると消えるようにしました。

## v0.1.237
### English
- Expanded the classic MISS danmaku reaction across the full screen height and removed fade-in/fade-out from its fixed comments.
### Japanese
- ニコ動風モードのMISS弾幕を画面の縦幅いっぱいに広げ、固定コメントの出現時・消滅時のフェード演出をなくしました。

## v0.1.236
### English
- Reworked the classic miss danmaku into dense fixed reaction waves that start from the screen center, add multiple centered rows in bursts, and allow some overlap without scrolling.
### Japanese
- ニコ動風モードのMISS時弾幕を、画面中央から始まり、呼応するように複数行が一気に増える固定リアクション演出へ変更しました。スクロールせず、密度高めで一部の行が重なるようにしています。

## v0.1.235
### English
- Changed the classic danmaku miss effect to fixed red, bold, center-aligned comments that stack downward one by one and fade out when the stack is full.
### Japanese
- ニコ動風モードのMISS時弾幕を、赤文字・太字・中央揃えの固定コメントが上から下へ1件ずつ積み重なり、上限を超えると古いコメントからフェードアウトする演出に変更しました。

## v0.1.234
### English
- Added YouTube Live-style emoji-heavy comments to the live chat danmaku mode.
### Japanese
- ライブチャット風の弾幕に、YouTube Liveらしい絵文字多めのコメントが混ざるようにしました。

## v0.1.233
### English
- Updated live chat danmaku comments to show a user icon and name before each comment, and spaced stacked comments by their rendered height to prevent overlap.
### Japanese
- ライブチャット風の弾幕をユーザーアイコン・名前・コメントの体裁にし、表示行の高さに合わせて積み上げることで文字同士が重なりにくいようにしました。

## v0.1.232
### English
- Reworked the item pickup sound into a brighter collection chime and reused the previous pickup sound as the player jump sound effect.
### Japanese
- アイテム取得音をより取得音らしい明るいチャイムに差し替え、これまでの取得音をプレイヤーのジャンプ音として使うようにしました。

## v0.1.231
### English
- Added a danmaku display style setting with a live chat column mode that stacks comments upward from the lower-left side of the screen.
### Japanese
- 弾幕の表示形式を切り替えられる設定を追加し、画面左側で下から上へコメントが積み上がるライブチャット風モードを選べるようにしました。

## v0.1.230
### English
- Increased the score HUD size and aligned the remaining time on the same row.
### Japanese
- スコア表示を少し大きくし、残り時間をスコアと同じ行に並べました。

## v0.1.229
### English
- Moved the player, score, and stamina HUD elements slightly upward.
### Japanese
- プレイヤー名、スコア、スタミナのHUD表示を少し上へ移動しました。

## v0.1.228
### English
- Added a global title button that returns the current session to the start screen.
### Japanese
- プレイ中や編集中にスタート画面へ戻れるタイトルボタンを右上のグローバルUIに追加しました。

## v0.1.227
### English
- Added an empty stage creation button to the stage editor and made edit mode use no-gravity free movement, including downward movement with down input.
### Japanese
- ステージ編集で空のステージを作成できるボタンを追加し、編集モード中は重力なしで移動でき、下入力で下方向へ動けるようにしました。

## v0.1.226
### English
- Added stationary and no-gravity stationary enemy behavior overrides to enemy placements and the stage editor.
### Japanese
- 敵配置の挙動に「その場で静止」と「その場で静止(重力無効)」を追加し、ステージ編集パネルから選べるようにしました。

## v0.1.225
### English
- Added a debug control in the stage editor panel for setting the remaining time during a run.
### Japanese
- デバッグ用に、ステージ編集パネルからプレイ中の残り時間を変更できる入力欄を追加しました。

## v0.1.224
### English
- Made the stage editor panel show only the option rows related to the currently selected tool.
### Japanese
- ステージ編集パネルで、現在選択中のツールに関係する設定項目だけを表示するようにしました。

## v0.1.223
### English
- Added a time-up miss sequence that knocks the player back before showing MISS, with center-burst danmaku comments for timeouts.
### Japanese
- 残り時間が0になったとき、のけぞり後にMISS扱いへ移行し、中央から文字が増える時間切れ用の弾幕を表示するようにしました。

## v0.1.222
### English
- Reduced the stamina cost for air jumps from 28 to 20.
### Japanese
- 空中ジャンプのスタミナ消費を28から20に下げました。

## v0.1.221
### English
- Removed the old moving-platform debug logging preference from the game and Google account settings sync.
### Japanese
- 使わなくなった動く足場のデバッグログ設定を、ゲーム本体とGoogleアカウント同期対象から削除しました。

## v0.1.220
### English
- Sync player preferences to the linked Google account, including name, language, stage, sound, and danmaku settings.
### Japanese
- プレイヤー名、言語、ステージ、サウンド、弾幕設定を、連携済みGoogleアカウントに同期するようにしました。

## v0.1.219
### English
- Added Google login and account status controls to the start screen while keeping anonymous play available.
- Moved the stage editor panel launcher to the upper-left corner to avoid overlapping the upper-right controls.
### Japanese
- 開始画面にGoogleログインと連携状況の表示を追加し、未ログインでも匿名でプレイできる導線を分かりやすくしました。
- 右上の操作UIと重なりにくくするため、ステージ編集パネルの起点を左上へ移動しました。

## v0.1.218
### English
- Made the in-game HUD scale more dynamically with the displayed screen size, including player name, score, timer, stamina, and control hints.
### Japanese
- 画面の表示サイズに応じて、プレイヤー名、スコア、タイマー、スタミナ、操作ヒントなどのHUD表示がより大きく見えるように調整しました。

## v0.1.217
### English
- Added a stamina gauge that limits W air jumps and Shift dash, with gradual recovery while grounded.
### Japanese
- スタミナゲージを追加し、Wの空中ジャンプとShiftダッシュに消費制限を入れ、地上で徐々に回復するようにしました。

## v0.1.216
### English
- Slightly increased normal jump height and boosted running jump height.
### Japanese
- 通常ジャンプと加速中ジャンプのジャンプ力を少しだけ上げました。

## v0.1.215
### English
- Shifted spring platform big-jump timing later by reducing the pre-contact buffer and adding a short post-launch upgrade window.
### Japanese
- ジャンプ台大ジャンプの判定タイミングを後ろ寄りに調整し、接触後の短い猶予でも大ジャンプへ昇格できるようにしました。

## v0.1.214
### English
- Fixed spring platform big jumps so the stronger upward velocity is no longer clamped to the normal vertical speed limit.
### Japanese
- ジャンプ台大ジャンプの上向き速度が通常の縦速度上限で丸められ、通常ジャンプ台と同じ高さになる問題を修正しました。

## v0.1.213
### English
- Added a bright burst, upward sparks, and a BIG JUMP popup when the spring platform big jump succeeds.
### Japanese
- ジャンプ台の大ジャンプ成功時に、発光リング、上向きの火花、BIG JUMP表示が出る演出を追加しました。

## v0.1.212
### English
- Added a Google login path for already-linked leaderboard accounts and made Firebase Auth persistence explicit to keep player IDs stable across reloads.
- Relaxed big spring jump timing so holding jump or pressing jump within a wider input buffer triggers the big launch.
### Japanese
- 連携済みのランキング用Googleアカウントでログインできる導線を追加し、リロード後もプレイヤーIDが維持されるようFirebase Authの永続化を明示しました。
- ジャンプ台大ジャンプの判定を緩和し、ジャンプ入力の押しっぱなしや広めの入力猶予でも大ジャンプが出るようにしました。

## v0.1.211
### English
- Added an account window that shows Google link status, allows unlinking Google, and lists the player's registered scores by stage.
- Added a big spring jump when jump input is timed just before or as the player lands on a spring platform.
### Japanese
- Google連携状況の確認、Google連携の解除、自分のステージ別登録スコアを確認できるアカウント画面を追加しました。
- ジャンプ台に乗る直前または同時にジャンプ入力を押すと、通常より高く跳べる大ジャンプを追加しました。

## v0.1.210
### English
- Renamed the Player Spec display label to Game Spec across the game UI and spec page titles.
### Japanese
- ゲーム内UIと仕様ページの表示名を「プレイヤー仕様」から「ゲーム仕様」に変更しました。

## v0.1.209
### English
- Localized the in-game Game Spec link and SPEC button, and passed the current game language to the Game Spec page.
### Japanese
- ゲーム内のGame SpecリンクとSPECボタンを多言語対応し、現在のゲーム言語をGame Specページへ渡すようにしました。

## v0.1.208
### English
- Localized the Game Spec page with Japanese/English language switching and fixed the broken Japanese text on the page.
### Japanese
- Game Specページを日本語と英語で切り替えられるようにし、ページ内の文字化けしていた日本語を修正しました。

## v0.1.207
### English
- Preserve edited stage layouts across R-key and miss restarts even when the stage editor panel is currently closed.
- Improved responsive layouts for the start, options, and leaderboard modals so they remain usable on narrow mobile screens.
### Japanese
- ステージ編集パネルを閉じている状態でも、Rキーやミスによるリスタートで編集中のステージ配置がリセットされないようにしました。
- スマホなどの狭い画面でも崩れにくいように、スタート、設定、ランキングの各モーダルのレスポンシブ表示を改善しました。

## v0.1.206
### English
- Temporarily disabled leaderboard anti-cheat score and timer checks behind a server-side flag while keeping the validation mechanism in place.
### Japanese
- ランキングの不正チェック機構は残したまま、サーバー側フラグでスコアとタイマーの不正チェックを一時的に無効化しました。

## v0.1.205
### English
- Fixed leaderboard validation so enemy stomp bonus points are accepted as part of the score before time bonus.
- Show a clear leaderboard message when a run used the stage editor and is therefore not submitted.
### Japanese
- 敵の踏みつけ撃破ボーナスを、タイムボーナス前のスコアとしてランキング検証で受け付けるように修正しました。
- ステージ編集を使ったランがランキング登録対象外になる場合、理由が分かるメッセージを表示するようにしました。

## v0.1.204
### English
- Improved stomp collision priority so clustered enemies no longer cause side-damage before a valid top stomp can resolve.
- Updated the Player Spec page with the clustered-enemy stomp priority rule.
### Japanese
- 敵が密集している場面で、上から踏める敵がいるのに横当たりダメージが先に処理される問題を修正しました。
- Player Specページに、敵が重なった時の踏みつけ優先ルールを追記しました。

## v0.1.203
### English
- Moved story message content into stage definitions so each stage can define its own dialogue lines, trigger position, and timing while keeping the message UI renderer reusable.
- Added optional Google account linking after score submission so leaderboard player IDs can persist across browsers and devices while still allowing unregistered play.
- Added a site-level Player Spec page for core players, with readable tables for scoring, stomp combos, power-ups, clear rank, and mission summary rules.
- Added Player Spec links from the start modal and in-game global UI.
### Japanese
- ストーリーメッセージの内容をステージ定義へ移し、ステージごとに会話文、表示位置、進行タイミングを変えられるようにしました。
- スコア登録後に任意でGoogleアカウントと連携できる案内を追加し、未登録のまま遊べる状態を残しつつ、連携後はリーダーボードIDを別ブラウザや別端末でも維持できるようにしました。
- コアプレイヤー向けの仕様説明ページをサイト内に追加し、スコア、踏みつけコンボ、パワーアップ、クリアランク、ミッション表示のルールを表で読みやすく確認できるようにしました。
- スタート画面とゲーム中のグローバルUIから、Player Specページを開ける導線を追加しました。

## v0.1.202
### English
- Hardened leaderboard submission error handling, added server-side stage score limits, skipped edited-stage runs from submission, and added leaderboard fetch retry/logging plus Functions validation tests.
### Japanese
- ランキング登録のエラー処理を強化し、サーバー側のステージ別スコア上限、編集済みランの送信除外、ランキング取得のリトライとログ、Functionsの検証テストを追加しました。

## v0.1.201
### English
- Added the Firestore index needed by leaderboard rank calculation and made rank lookup fail-safe so score submission no longer returns 500 when ranking is temporarily unavailable.
### Japanese
- ランキング順位計算に必要なFirestoreインデックスを追加し、順位取得に失敗してもスコア登録が500エラーにならないようにしました。

## v0.1.200
### English
- Preserved the stage editor enabled state and in-progress edited stage layout across R-key and miss restarts.
### Japanese
- Rキーやミスによるリスタート後も、ステージ編集のON状態と編集中のステージ配置を維持するようにしました。

## v0.1.199
### English
- Paused the remaining-time countdown while the stage editor is enabled, including clear-time score and time bonus calculations.
### Japanese
- ステージ編集が有効な間は残り時間のカウントダウンを止め、クリア時のスコアとタイムボーナス計算にも反映するようにしました。

## v0.1.198
### English
- Restored the leaderboard `NEW` marker after a best score update by matching the current score row by player, score, and rank when the submission id is not yet visible in the fetched entry.
### Japanese
- 繝吶せ繝医せ繧ｳ繧｢譖ｴ譁ｰ蠕後∝叙蠕励＠縺溘Λ繝ｳ繧ｭ繝ｳ繧ｰ陦後↓騾∽ｿ｡ID縺後∪縺蜿肴丐縺輔ｌ縺ｦ縺・↑縺・ｴ蜷医〒繧ゅ√・繝ｬ繧､繝､繝ｼID縲√せ繧ｳ繧｢縲・・ｽ阪°繧我ｻ雁屓縺ｮ陦後ｒ蛻､螳壹＠縺ｦ `NEW` 陦ｨ遉ｺ縺悟・繧九ｈ縺・↓縺励∪縺励◆縲・

## v0.1.197
### English
- Added floating score popups when collecting score items, matching the enemy defeat score feedback.
- Increased floating score popup text size for both item pickups and enemy defeats.
### Japanese
- 繧ｹ繧ｳ繧｢莉倥″繧｢繧､繝・Β繧貞叙縺｣縺滓凾縺ｫ繧ゅ∵雰謦・ｴ譎ゅ→蜷後§繝輔Ο繝ｼ繝・ぅ繝ｳ繧ｰ繧ｹ繧ｳ繧｢陦ｨ遉ｺ繧貞・縺吶ｈ縺・↓縺励∪縺励◆縲・
- 繧｢繧､繝・Β蜿門ｾ玲凾縺ｨ謨ｵ謦・ｴ譎ゅ・繝輔Ο繝ｼ繝・ぅ繝ｳ繧ｰ繧ｹ繧ｳ繧｢陦ｨ遉ｺ繧偵√％繧後∪縺ｧ繧医ｊ螟ｧ縺阪￥縺励∪縺励◆縲・

## v0.1.196
### English
- Added per-enemy stomp score settings, with enemies that do not specify a value defaulting to 10 points.
- Tuned higher-risk enemy types with individual stomp score values for score balance.
### Japanese
- 謨ｵ縺斐→縺ｫ雕上∩縺､縺第茶遐ｴ譎ゅ・蠕礼せ繧定ｨｭ螳壹〒縺阪ｋ繧医≧縺ｫ縺励∵悴險ｭ螳壹・謨ｵ縺ｯ10轤ｹ縺ｫ縺ｪ繧九ｈ縺・↓縺励∪縺励◆縲・
- 蠕礼せ繝舌Λ繝ｳ繧ｹ隱ｿ謨ｴ逕ｨ縺ｫ縲∝些髯ｺ蠎ｦ縺ｮ鬮倥＞謨ｵ縺ｸ蛟句挨縺ｮ雕上∩縺､縺大ｾ礼せ繧定ｨｭ螳壹＠縺ｾ縺励◆縲・

## v0.1.195
### English
- Fixed startup stopping after stage rendering when the HIT debug position readout ran before the player sprite existed.
- Added defensive enemy animation handling so one broken enemy sheet cannot stop the rest of the game scene from starting.
### Japanese
- HIT繝・ヰ繝・げ縺ｮ蠎ｧ讓呵｡ｨ遉ｺ縺後・繝ｬ繧､繝､繝ｼ逕滓・蜑阪↓襍ｰ縺｣縺ｦ縲√せ繝・・繧ｸ謠冗判蠕後↓襍ｷ蜍輔′豁｢縺ｾ繧句撫鬘後ｒ菫ｮ豁｣縺励∪縺励◆縲・
- 謨ｵ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ邏譚舌↓蝠城｡後′縺ゅ▲縺ｦ繧ゅ√ご繝ｼ繝繧ｷ繝ｼ繝ｳ蜈ｨ菴薙・髢句ｧ九′豁｢縺ｾ繧峨↑縺・ｈ縺・↓髦ｲ蠕｡蜃ｦ逅・ｒ霑ｽ蜉縺励∪縺励◆縲・

## v0.1.194
### English
- Added a live player position readout beside the HIT debug toggle while collision debug is enabled.
### Japanese
- HIT繝・ヰ繝・げ繧呈怏蜉ｹ縺ｫ縺励※縺・ｋ髢薙√・繝ｬ繧､繝､繝ｼ縺ｮ迴ｾ蝨ｨ蠎ｧ讓吶ｒHIT繝懊ち繝ｳ縺ｮ讓ｪ縺ｫ陦ｨ遉ｺ縺吶ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.193
### English
- Resolved build-time UI asset URL warnings by making CSS image references resolve through the project asset graph.
- Raised the Vite chunk warning limit to match the current Phaser/Firebase game bundle size and avoid noisy chunk-size warnings.
### Japanese
- CSS蜀・・UI逕ｻ蜒丞盾辣ｧ繧偵ン繝ｫ繝画凾縺ｫ隗｣豎ｺ縺ｧ縺阪ｋ蠖｢縺ｸ逶ｴ縺励ゞI逕ｻ蜒酋RL隴ｦ蜻翫′蜃ｺ縺ｪ縺・ｈ縺・↓縺励∪縺励◆縲・
- Phaser縺ｨFirebase繧貞性繧迴ｾ蝨ｨ縺ｮ繧ｲ繝ｼ繝繝舌Φ繝峨Ν繧ｵ繧､繧ｺ縺ｫ蜷医ｏ縺帙※Vite縺ｮ繝√Ε繝ｳ繧ｯ隴ｦ蜻企明蛟､繧定ｪｿ謨ｴ縺励∽ｸ崎ｦ√↑繝√Ε繝ｳ繧ｯ繧ｵ繧､繧ｺ隴ｦ蜻翫ｒ謚代∴縺ｾ縺励◆縲・

## v0.1.192
### English
- Restored Shibuya City stage data to match `04400ffd636148a98c25cf0b7c1d9b88c6f8bc6f`, removing the moving, fragile, and secret-route additions from the base Shibuya City stage.
### Japanese
- 繧ｷ繝悶Ζ繧ｷ繝・ぅ縺ｮ繧ｹ繝・・繧ｸ繝・・繧ｿ繧蛋04400ffd636148a98c25cf0b7c1d9b88c6f8bc6f`縺ｮ迥ｶ諷九↓謠・∴縲・壼ｸｸ縺ｮ繧ｷ繝悶Ζ繧ｷ繝・ぅ縺九ｉ蜍輔￥雜ｳ蝣ｴ縲∬誠縺｡繧玖ｶｳ蝣ｴ縲∫ｧ伜ｯ・Ν繝ｼ繝郁ｿｽ蜉蛻・ｒ蜿悶ｊ髯､縺阪∪縺励◆縲・

## v0.1.191
### English
- Rebuilt the Rabbit Traveler walk sprite from the pre-transparency source sheet with conservative background removal, and switched the runtime asset to WebP.
- Added documented asset processing rules for WebP runtime outputs, reversible intermediates, and safe-side transparency cleanup.
### Japanese
- 繝ｩ繝薙ャ繝医ヨ繝ｩ繝吶Λ繝ｼ縺ｮ豁ｩ陦後せ繝励Λ繧､繝医ｒ騾城℃蜑阪・蜈・す繝ｼ繝医°繧我ｽ懊ｊ逶ｴ縺励・城℃縺励☆縺弱↑縺・而縺医ａ縺ｪ閭梧勹髯､蜴ｻ縺ｫ螟画峩縺励◆縺・∴縺ｧ縲∝ｮ溯｡梧凾繧｢繧ｻ繝・ヨ繧淡ebP縺ｫ蛻・ｊ譖ｿ縺医∪縺励◆縲・
- 邏譚仙刈蟾･縺ｧ縺ｯ譛邨よ・譫懃黄繧淡ebP縺ｫ縺吶ｋ縺薙→縲・比ｸｭ邨碁℃繧貞庄騾・↑迥ｶ諷九〒谿九☆縺薙→縲・城℃蜃ｦ逅・・螳牙・蛛ｴ縺ｫ蛟偵☆縺薙→繧偵ラ繧ｭ繝･繝｡繝ｳ繝医↓霑ｽ險倥＠縺ｾ縺励◆縲・

## v0.1.190
### English
- Added Heart Cannon turret enemies with generated raster art, aimed heart shots, and new placements in Neo Shibuya City and Skybridge Sprint.
- Added a secret upper-route branch in Neo Shibuya City with hidden dash-ring access, bonus coins, and fragile/moving platforms.
### Japanese
- 逕ｻ蜒冗函謌舌〒菴懈・縺励◆繝上・繝医く繝｣繝弱Φ遐ｲ蜿ｰ繧定ｿｽ蜉縺励∫漁縺・茶縺｡縺ｮ繝上・繝亥ｼｾ縺ｨ繝阪が繧ｷ繝悶Ζ繧ｷ繝・ぅ縲√せ繧ｫ繧､繝悶Μ繝・ず繝ｻ繧ｹ繝励Μ繝ｳ繝医∈縺ｮ驟咲ｽｮ繧貞ｮ溯｣・＠縺ｾ縺励◆縲・
- 繝阪が繧ｷ繝悶Ζ繧ｷ繝・ぅ縺ｫ縲・國縺励ム繝・す繝･繝ｪ繝ｳ繧ｰ縺九ｉ蜈･繧後ｋ荳雁・縺ｮ遘伜ｯ・Ν繝ｼ繝医ｒ霑ｽ蜉縺励√・繝ｼ繝翫せ繧ｳ繧､繝ｳ縲∝｣翫ｌ繧・☆縺・ｶｳ蝣ｴ縲∝虚縺剰ｶｳ蝣ｴ繧堤ｵ・∩霎ｼ縺ｿ縺ｾ縺励◆縲・

## v0.1.189
### English
- Split the enhanced Shibuya City layout into a new Neo Shibuya City stage while restoring Shibuya City to the main-branch layout from `04400ffd636148a98c25cf0b7c1d9b88c6f8bc6f`.
### Japanese
- 蠑ｷ蛹也沿縺ｮ繧ｷ繝悶Ζ繧ｷ繝・ぅ繧呈眠縺励＞繧ｹ繝・・繧ｸ縲後ロ繧ｪ繧ｷ繝悶Ζ繧ｷ繝・ぅ縲阪→縺励※蛻・￠縲√す繝悶Ζ繧ｷ繝・ぅ譛ｬ菴薙・`04400ffd636148a98c25cf0b7c1d9b88c6f8bc6f`譎らせ縺ｮmain繝悶Λ繝ｳ繝√・讒区・縺ｫ謌ｻ縺励∪縺励◆縲・

## v0.1.188
### English
- Added a Mario-style feature pack with enemy stomps and combo scoring, spring and fragile platforms, coins, bonus blocks, powerups, checkpoints, clear ranks, missions, a neon idol shooter enemy, breakable blocks, and one-way gates.
### Japanese
- 謨ｵ縺ｮ雕上∩縺､縺第茶遐ｴ縺ｨ騾｣邯壹・繝ｼ繝翫せ縲√ず繝｣繝ｳ繝怜床縲∝ｴｩ繧後ｋ雜ｳ蝣ｴ縲√さ繧､繝ｳ縲√・縺ｦ縺ｪ繝悶Ο繝・け縺ｨ髫縺励ヶ繝ｭ繝・け縲√ヱ繝ｯ繝ｼ繧｢繝・・縲√メ繧ｧ繝・け繝昴う繝ｳ繝医√け繝ｪ繧｢繝ｩ繝ｳ繧ｯ縲√Α繝・す繝ｧ繝ｳ陦ｨ遉ｺ縲√ロ繧ｪ繝ｳ繧｢繧､繝峨Ν邉ｻ縺ｮ蟆・茶謨ｵ縲∝｣翫○繧九ヶ繝ｭ繝・け縲∽ｸ譁ｹ騾夊｡後ご繝ｼ繝医ｒ霑ｽ蜉縺励∪縺励◆縲・

## v0.1.187
### English
- Disabled the browser context menu so right-clicking the game screen no longer opens the default menu.
### Japanese
- 繧ｲ繝ｼ繝逕ｻ髱｢縺ｧ蜿ｳ繧ｯ繝ｪ繝・け縺励※繧ゅヶ繝ｩ繧ｦ繧ｶ讓呎ｺ悶・繝｡繝九Η繝ｼ縺碁幕縺九↑縺・ｈ縺・↓縺励∪縺励◆縲・

## v0.1.186
### English
- Localized leaderboard titles, status messages, current score labels, and score submission result messages for English and Japanese while keeping the table column headers unchanged.
### Japanese
- 繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ逕ｻ髱｢縺ｮ繧ｿ繧､繝医Ν縲∫憾諷九Γ繝・そ繝ｼ繧ｸ縲∽ｻ雁屓縺ｮ繧ｹ繧ｳ繧｢陦ｨ遉ｺ縲√せ繧ｳ繧｢逋ｻ骭ｲ邨先棡繝｡繝・そ繝ｼ繧ｸ繧呈律譛ｬ隱槭→闍ｱ隱槭・陦ｨ遉ｺ縺ｫ蟇ｾ蠢懊＠縺ｾ縺励◆縲り｡ｨ縺ｮ蛻苓ｦ句・縺励・縺薙ｌ縺ｾ縺ｧ騾壹ｊ闍ｱ蟄苓｡ｨ險倥・縺ｾ縺ｾ縺ｫ縺励※縺・∪縺吶・

## v0.1.185
### English
- Updated the options screen language label to match the start screen bilingual label format.
### Japanese
- 繧ｪ繝励す繝ｧ繝ｳ逕ｻ髱｢縺ｮ險隱槭Λ繝吶Ν繧ゅ・幕蟋狗判髱｢縺ｨ蜷後§縺冗樟蝨ｨ縺ｮ陦ｨ遉ｺ險隱槫錐縺ｨ `Language` 繧剃ｽｵ險倥☆繧玖｡ｨ遉ｺ縺ｫ縺励∪縺励◆縲・

## v0.1.184
### English
- Updated the start screen language label to show both the current UI language label and `Language`.
### Japanese
- 髢句ｧ狗判髱｢縺ｮ險隱槭Λ繝吶Ν繧偵∫樟蝨ｨ縺ｮ陦ｨ遉ｺ險隱槫錐縺ｨ `Language` 繧剃ｽｵ險倥☆繧玖｡ｨ遉ｺ縺ｫ縺励∪縺励◆縲・

## v0.1.183
### English
- Localized the story message UI lines and next-message accessibility label for English and Japanese.
### Japanese
- 繧ｹ繝医・繝ｪ繝ｼ繝｡繝・そ繝ｼ繧ｸUI縺ｮ莨夊ｩｱ譁・→谺｡繝｡繝・そ繝ｼ繧ｸ繝懊ち繝ｳ縺ｮ隱ｭ縺ｿ荳翫￡繝ｩ繝吶Ν繧偵∵律譛ｬ隱槭→闍ｱ隱槭・陦ｨ遉ｺ縺ｫ蟇ｾ蠢懊＠縺ｾ縺励◆縲・

## v0.1.182
### English
- Stopped forcing or waiting for landscape orientation in mobile mode and added a mobile fullscreen toggle button.
### Japanese
- 繧ｹ繝槭・謫堺ｽ懈凾縺ｫ讓ｪ逕ｻ髱｢繧貞ｼｷ蛻ｶ縺励◆繧雁ｾ・ｩ溘＠縺溘ｊ縺吶ｋ蜃ｦ逅・ｒ繧・ａ縲√Δ繝舌う繝ｫ謫堺ｽ懊・繧ｿ繝ｳ縺ｫ蜈ｨ逕ｻ髱｢蛹悶→隗｣髯､繧貞・繧頑崛縺医ｋ繝懊ち繝ｳ繧定ｿｽ蜉縺励∪縺励◆縲・

## v0.1.181
### English
- Normalized leaderboard score payload rounding so Sky Shaft Climb clear scores pass the server-side score validation.
### Japanese
- 繧ｹ繧ｫ繧､繧ｷ繝｣繝輔ヨ繝ｻ繧ｯ繝ｩ繧､繝縺ｮ繧ｯ繝ｪ繧｢繧ｹ繧ｳ繧｢縺後し繝ｼ繝舌・蛛ｴ縺ｮ讀懆ｨｼ繧帝壹ｋ繧医≧縺ｫ縲√Λ繝ｳ繧ｭ繝ｳ繧ｰ騾∽ｿ｡譎ゅ・繧ｹ繧ｳ繧｢荳ｸ繧∝・逅・ｒ謠・∴縺ｾ縺励◆縲・

## v0.1.180
### English
- Fixed descending moving platform carry to align the player's physics body directly to the platform top, avoiding the Game Object sync mismatch shown in debug logs.
### Japanese
- 繝・ヰ繝・げ繝ｭ繧ｰ縺ｧ遒ｺ隱阪〒縺阪◆Game Object蜷梧悄譎ゅ・繧ｺ繝ｬ繧帝∩縺代ｋ縺溘ａ縲∽ｸ区婿蜷代↓蜍輔￥蠎翫〒縺ｯ繝励Ξ繧､繝､繝ｼ縺ｮ迚ｩ逅・ody繧貞ｺ翫・荳企擇縺ｸ逶ｴ謗･蜷医ｏ縺帙ｋ繧医≧縺ｫ菫ｮ豁｣縺励∪縺励◆縲・

## v0.1.179
### English
- Added opt-in moving platform debug logging for descending platform carry, including platform deltas, player body position, grounded flags, and applied correction values.
### Japanese
- 荳区婿蜷代↓蜍輔￥蠎翫・霑ｽ髫冗憾諷九ｒ隱ｿ縺ｹ繧九◆繧√∝ｺ翫・遘ｻ蜍暮㍼縲√・繝ｬ繧､繝､繝ｼ縺ｮ蠖薙◆繧雁愛螳壻ｽ咲ｽｮ縲∵磁蝨ｰ繝輔Λ繧ｰ縲∬｣懈ｭ｣驥上ｒ遒ｺ隱阪〒縺阪ｋ莉ｻ諢乗怏蜉ｹ縺ｮ繝・ヰ繝・げ繝ｭ繧ｰ繧定ｿｽ蜉縺励∪縺励◆縲・

## v0.1.178
### English
- Changed descending moving platform carry to snap the player's feet to the platform top instead of adding the platform's downward movement every frame, preventing the player from sinking into descending platforms.
### Japanese
- 荳区婿蜷代↓蜍輔￥蠎翫・霑ｽ髫丞・逅・ｒ縲∝ｺ翫・遘ｻ蜍暮㍼繧呈ｯ弱ヵ繝ｬ繝ｼ繝雜ｳ縺呎婿蠑上°繧峨・繝ｬ繧､繝､繝ｼ縺ｮ雜ｳ蜈・ｒ蠎翫・荳企擇縺ｸ蜷医ｏ縺帙ｋ譁ｹ蠑上↓螟画峩縺励∽ｸ矩剄蠎翫↓繧√ｊ霎ｼ繧薙〒縺・￥蝠城｡後ｒ菫ｮ豁｣縺励∪縺励◆縲・

## v0.1.177
### English
- Stopped injecting downward velocity while carrying the player on descending platforms, keeping the rider grounded without forcing constant falling collision.
### Japanese
- 荳区婿蜷代↓蜍輔￥蠎翫〒繝励Ξ繧､繝､繝ｼ繧定ｿｽ髫上＆縺帙ｋ譎ゅ∽ｸ句髄縺埼溷ｺｦ繧呈ｯ弱ヵ繝ｬ繝ｼ繝蜉縺医↑縺・ｈ縺・↓縺励※縲∬誠荳玖｡晉ｪ√′邯壹＞縺ｦ讓ｪ遘ｻ蜍輔′荳榊ｮ牙ｮ壹↓縺ｪ繧句撫鬘後ｒ菫ｮ豁｣縺励∪縺励◆縲・

## v0.1.176
### English
- Treated riders on descending moving platforms as grounded for movement, drag, jump, and animation decisions, so horizontal control stays responsive while the platform moves downward.
### Japanese
- 荳区婿蜷代↓蜍輔￥蠎翫・荳翫↓縺・ｋ繝励Ξ繧､繝､繝ｼ繧堤ｧｻ蜍輔・繝峨Λ繝・げ繝ｻ繧ｸ繝｣繝ｳ繝励・繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ蛻､螳壹〒繧よ磁蝨ｰ謇ｱ縺・↓縺励※縲∽ｸ矩剄荳ｭ縺ｮ蠎翫〒繧よｨｪ遘ｻ蜍輔′騾壼ｸｸ騾壹ｊ蜉ｹ縺上ｈ縺・↓縺励∪縺励◆縲・

## v0.1.175
### English
- Kept Arcade Body `prevFrame` in sync after manually carrying the player down with descending platforms, preventing post-update from undoing or duplicating that correction.
### Japanese
- 荳矩剄縺吶ｋ遘ｻ蜍募ｺ翫↓蜷医ｏ縺帙※繝励Ξ繧､繝､繝ｼ繧呈焔蜍輔〒荳九￡縺溷ｾ後、rcade Body縺ｮ`prevFrame`繧ょ酔譛溘＠縺ｦ縲｝ostUpdate縺ｧ陬懈ｭ｣縺悟ｴｩ繧後↑縺・ｈ縺・↓縺励∪縺励◆縲・

## v0.1.174
### English
- Snapped riders down to the top of descending moving platforms when a gap opens, instead of only applying the platform's raw vertical delta.
### Japanese
- 荳区婿蜷代↓蜍輔￥蠎翫〒髫咎俣縺碁幕縺・◆譎ゅ∝ｺ翫・遘ｻ蜍暮㍼縺縺代〒縺ｪ縺丞ｺ翫・螟ｩ髱｢縺ｾ縺ｧ繝励Ξ繧､繝､繝ｼ繧定ｿｽ髫上＆縺帙ｋ繧医≧縺ｫ縺励※縲∽ｸ矩剄蠎翫°繧芽誠縺｡縺ｫ縺上￥縺励∪縺励◆縲・

## v0.1.173
### English
- Let descending moving platforms continue carrying the player while they are just above the platform, preventing downward platforms from dropping out from under the rider.
### Japanese
- 荳区婿蜷代↓遘ｻ蜍輔☆繧句ｺ翫〒縲√・繝ｬ繧､繝､繝ｼ縺悟ｺ翫・縺吶＄荳翫↓縺・ｋ髢薙ｂ荳矩剄霑ｽ髫上ｒ邯壹￠繧九ｈ縺・↓縺励※縲∝ｺ翫□縺代′荳九′縺｣縺ｦ繝励Ξ繧､繝､繝ｼ縺瑚誠縺｡繧句撫鬘後ｒ菫ｮ豁｣縺励∪縺励◆縲・

## v0.1.172
### English
- Stopped manually moving the player horizontally on moving platforms and let Arcade's direct-control platform friction handle horizontal riding, leaving only descending vertical carry as a manual correction.
### Japanese
- 遘ｻ蜍募ｺ贋ｸ翫・繝励Ξ繧､繝､繝ｼ繧呈ｨｪ譁ｹ蜷代↓謇句虚縺ｧ蜍輔°縺吝・逅・ｒ繧・ａ縲∵ｨｪ譁ｹ蜷代・Arcade Physics縺ｮ遘ｻ蜍募ｺ頑束謫ｦ縺ｫ莉ｻ縺帙ｋ繧医≧縺ｫ縺励∪縺励◆縲よ焔蜍戊｣懈ｭ｣縺ｯ荳矩剄譎ゅ・邵ｦ霑ｽ髫上□縺代↓髯仙ｮ壹＠縺ｦ縺・∪縺吶・

## v0.1.171
### English
- Rebuilt moving-platform hitboxes as exact-size textures and advanced them with exact per-frame position steps, making player carry use the same movement amount as the visible platform.
### Japanese
- 遘ｻ蜍募ｺ翫・蠖薙◆繧雁愛螳壹ｒ螳溷ｯｸ繝・け繧ｹ繝√Ε縺ｧ菴懊ｊ縲∬ｨｭ螳夐溷ｺｦ縺九ｉ豈弱ヵ繝ｬ繝ｼ繝豁｣遒ｺ縺ｪ蠎ｧ讓吶せ繝・ャ繝励〒蜍輔°縺呎婿蠑上↓螟画峩縺励※縲√・繝ｬ繧､繝､繝ｼ縺ｮ霑ｽ髫城㍼繧りｦ九◆逶ｮ縺ｮ蠎翫→蜷後§遘ｻ蜍暮㍼縺ｫ縺ｪ繧九ｈ縺・↓縺励∪縺励◆縲・

## v0.1.170
### English
- Applied moving-platform carry after player input and kept Arcade body deltas stable so riders move with the platform without being shoved faster than the platform.
### Japanese
- 遘ｻ蜍募ｺ翫・霑ｽ髫丞・逅・ｒ繝励Ξ繧､繝､繝ｼ蜈･蜉帙・蠕後↓蝗槭＠縲∫黄逅・ody縺ｮ蟾ｮ蛻・ｂ陬懈ｭ｣縺励※縲∝ｺ翫ｈ繧企溘￥謚ｼ縺怜・縺輔ｌ縺壹↓蠎翫→蜷後§騾溷ｺｦ縺ｧ驕九・繧後ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.169
### English
- Made moving platforms carry the player horizontally with a single manual offset while disabling platform friction, so standing riders do not slide off and walking remains responsive.
### Japanese
- 遘ｻ蜍募ｺ翫・鞫ｩ謫ｦ縺ｫ繧医ｋ閾ｪ蜍戊ｿｽ髫上ｒ蛻・ｊ縲∝ｺ翫・遘ｻ蜍暮㍼繧・蝗槭□縺第焔蜍輔〒蜿肴丐縺吶ｋ繧医≧縺ｫ縺励※縲∵ｨｪ遘ｻ蜍募ｺ翫〒遶九▲縺溘∪縺ｾ關ｽ縺｡縺壹∵ｭｩ陦梧桃菴懊ｂ蜉ｹ縺上ｈ縺・↓縺励∪縺励◆縲・

## v0.1.168
### English
- Kept the player attached to diagonal moving platforms while they descend, without changing horizontal walking control.
### Japanese
- 譁懊ａ遘ｻ蜍募ｺ翫′荳九′繧区凾縺ｫ繝励Ξ繧､繝､繝ｼ縺檎ｽｮ縺・※縺・°繧後↑縺・ｈ縺・↓縺励▽縺､縲∵ｨｪ譁ｹ蜷代・豁ｩ陦梧桃菴懊・縺昴・縺ｾ縺ｾ菴ｿ縺医ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.167
### English
- Removed the manual horizontal carry correction from moving platforms so player walking input works normally while Phaser's platform friction handles riding motion.
### Japanese
- 讓ｪ遘ｻ蜍募ｺ翫・謇句虚霑ｽ髫剰｣懈ｭ｣繧貞､悶＠縲￣haser縺ｮ蠎頑束謫ｦ縺ｫ繧医ｋ遘ｻ蜍輔↓莉ｻ縺帙ｋ縺薙→縺ｧ縲∝ｺ翫・荳翫〒繧る壼ｸｸ騾壹ｊ豁ｩ縺代ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.166
### English
- Fixed moving platform carry so horizontal platform motion is not applied twice when Arcade Physics already moved the player.
### Japanese
- 讓ｪ遘ｻ蜍輔☆繧句ｺ翫↓荵励▲縺滓凾縲∫黄逅・愛螳壹〒縺吶〒縺ｫ謚ｼ縺輔ｌ縺ｦ縺・ｋ蛻・↓蜉縺医※霑ｽ髫冗ｧｻ蜍輔′莠碁㍾縺ｫ縺九°繧峨↑縺・ｈ縺・↓菫ｮ豁｣縺励∪縺励◆縲・

## v0.1.165
### English
- Added diagonal moving platforms with editor support for X and Y travel distances, and placed a few in Sky Shaft Climb.
### Japanese
- 譁懊ａ縺ｫ遘ｻ蜍輔☆繧句ｺ翫ｒ霑ｽ蜉縺励√お繝・ぅ繝・ヨ縺ｧ繧９譁ｹ蜷代→Y譁ｹ蜷代・遘ｻ蜍戊ｷ晞屬繧定ｨｭ螳壹〒縺阪ｋ繧医≧縺ｫ縺励∪縺励◆縲ゅせ繧ｫ繧､繧ｷ繝｣繝輔ヨ繝ｻ繧ｯ繝ｩ繧､繝縺ｫ繧ゅ＞縺上▽縺矩・鄂ｮ縺励※縺・∪縺吶・

## v0.1.164
### English
- Changed the five-jump danmaku trigger so it only appears once per run and does not reset on landing.
### Japanese
- 遨ｺ荳ｭ繧ｸ繝｣繝ｳ繝・蝗槭・蠑ｾ蟷戊｡ｨ遉ｺ繧偵∫捩蝨ｰ縺励※繧ょ・陦ｨ遉ｺ縺輔ｌ縺壹√Μ繧ｹ繧ｿ繝ｼ繝医☆繧九∪縺ｧ1蝗槭□縺大・繧九ｈ縺・↓縺励∪縺励◆縲・

## v0.1.163
### English
- Made the player inherit horizontal movement while standing on moving platforms.
### Japanese
- 遘ｻ蜍募ｺ翫↓荵励▲縺ｦ縺・ｋ髢薙∝ｺ翫・讓ｪ遘ｻ蜍輔↓蜷医ｏ縺帙※繝励Ξ繧､繝､繝ｼ繧ゆｸ邱偵↓蜍輔￥繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.162
### English
- Removed the fixed stage allowlist from leaderboard score submissions so newly added stages can submit scores without another Firebase code change.
- Kept stage IDs constrained to safe alphanumeric, underscore, and hyphen values.
### Japanese
- 繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ逋ｻ骭ｲ縺ｮ蝗ｺ螳壹せ繝・・繧ｸ險ｱ蜿ｯ繝ｪ繧ｹ繝医ｒ縺ｪ縺上＠縲∵眠縺励＞繧ｹ繝・・繧ｸ繧定ｿｽ蜉縺励※繧・irebase蛛ｴ縺ｮ繧ｳ繝ｼ繝牙､画峩縺ｪ縺励〒繧ｹ繧ｳ繧｢逋ｻ骭ｲ縺ｧ縺阪ｋ繧医≧縺ｫ縺励∪縺励◆縲・
- 繧ｹ繝・・繧ｸID縺ｯ闍ｱ謨ｰ蟄励√い繝ｳ繝繝ｼ繧ｹ繧ｳ繧｢縲√ワ繧､繝輔Φ縺縺代ｒ險ｱ蜿ｯ縺吶ｋ螳牙・縺ｪ蠖｢蠑上メ繧ｧ繝・け縺ｫ縺励∪縺励◆縲・

## v0.1.161
### English
- Fixed moving platform hitboxes so they match the visible platform size without double-scaling the physics body.
- Smoothed the opening climb in Sky Shaft Climb so the first ascent is less dependent on dash jumps.
### Japanese
- 遘ｻ蜍募ｺ翫・迚ｩ逅・愛螳壹′隕九◆逶ｮ繧医ｊ螟ｧ縺阪￥縺ｪ繧峨↑縺・ｈ縺・↓菫ｮ豁｣縺励∬｡ｨ遉ｺ繧ｵ繧､繧ｺ縺ｨ蠖薙◆繧雁愛螳壹ｒ謠・∴縺ｾ縺励◆縲・
- 繧ｹ繧ｫ繧､繧ｷ繝｣繝輔ヨ繝ｻ繧ｯ繝ｩ繧､繝縺ｮ蠎冗乢繧定ｪｿ謨ｴ縺励∵怙蛻昴・逋ｻ繧翫′繝繝・す繝･繧ｸ繝｣繝ｳ繝怜燕謠舌↓縺ｪ繧翫☆縺弱↑縺・ｈ縺・↓縺励∪縺励◆縲・

## v0.1.160
### English
- Added Sky Shaft Climb, a narrow vertical stage built around small platforms and frequent moving platforms.
- Allowed Sky Shaft Climb score submissions in the leaderboard Cloud Function.
### Japanese
- 讓ｪ蟷・ｒ謚代∴縺溽ｸｦ髟ｷ繧ｹ繝・・繧ｸ縲後せ繧ｫ繧､繧ｷ繝｣繝輔ヨ繝ｻ繧ｯ繝ｩ繧､繝縲阪ｒ霑ｽ蜉縺励∝ｰ上＆縺ｪ雜ｳ蝣ｴ縺ｨ螟壹ａ縺ｮ遘ｻ蜍募ｺ翫ｒ荵励ｊ邯吶＞縺ｧ荳翫∈逋ｻ繧区ｧ区・縺ｫ縺励∪縺励◆縲・
- 繧ｹ繧ｫ繧､繧ｷ繝｣繝輔ヨ繝ｻ繧ｯ繝ｩ繧､繝縺ｮ繧ｹ繧ｳ繧｢繧偵Λ繝ｳ繧ｭ繝ｳ繧ｰ縺ｸ逋ｻ骭ｲ縺ｧ縺阪ｋ繧医≧縺ｫ縲，loud Function縺ｮ險ｱ蜿ｯ繧ｹ繝・・繧ｸ縺ｫ繧りｿｽ蜉縺励∪縺励◆縲・

## v0.1.159
### English
- Added per-enemy AI styles: standard patrol, flying patrol, hopping patrol, and player chase behavior.
- Assigned the Horned Cyborg to flying patrol, Cone Golem to hopping patrol, and Rabbit Traveler to chase behavior.
### Japanese
- 謨ｵ繧ｭ繝｣繝ｩ縺斐→縺ｫ縲・壼ｸｸ蟾｡蝗槭∫ｩｺ荳ｭ蟾｡蝗槭√ず繝｣繝ｳ繝怜ｷ｡蝗槭√・繝ｬ繧､繝､繝ｼ霑ｽ霍｡縺ｮAI繧ｿ繧､繝励ｒ謖√※繧九ｈ縺・↓縺励∪縺励◆縲・
- 繝帙・繝ｳ繝峨し繧､繝懊・繧ｰ縺ｯ遨ｺ荳ｭ蟾｡蝗槭√さ繝ｼ繝ｳ繧ｴ繝ｼ繝ｬ繝縺ｯ繧ｸ繝｣繝ｳ繝怜ｷ｡蝗槭√Λ繝薙ャ繝医ヨ繝ｩ繝吶Λ繝ｼ縺ｯ繝励Ξ繧､繝､繝ｼ霑ｽ霍｡縺ｨ縺励※蜍輔￥繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.158
### English
- Added three new enemy types from supplied character sheets: Horned Cyborg, Cone Golem, and Rabbit Traveler.
- Processed the source sheets into transparent in-game enemy animation sheets and placed examples in Skybridge Sprint.
### Japanese
- 蜿励￠蜿悶▲縺溘く繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧ｷ繝ｼ繝医ｒ蜉蟾･縺励√・繝ｼ繝ｳ繝峨し繧､繝懊・繧ｰ縲√さ繝ｼ繝ｳ繧ｴ繝ｼ繝ｬ繝縲√Λ繝薙ャ繝医ヨ繝ｩ繝吶Λ繝ｼ縺ｮ3遞ｮ鬘槭ｒ謨ｵ繧ｭ繝｣繝ｩ縺ｨ縺励※霑ｽ蜉縺励∪縺励◆縲・
- 蜈・判蜒上°繧蛾城℃繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ邏譚舌ｒ菴懈・縺励√せ繧ｫ繧､繝悶Μ繝・ず繝ｻ繧ｹ繝励Μ繝ｳ繝医↓蜃ｺ迴ｾ萓九ｒ驟咲ｽｮ縺励∪縺励◆縲・

## v0.1.157
### English
- Added moving platform support with horizontal and vertical movement, including stage editor placement controls for direction, distance, speed, and unit count.
- Added moving platform examples to Skybridge Sprint.
### Japanese
- 蟾ｦ蜿ｳ遘ｻ蜍輔→荳贋ｸ狗ｧｻ蜍輔↓蟇ｾ蠢懊＠縺溽ｧｻ蜍募ｺ翫ｒ霑ｽ蜉縺励√せ繝・・繧ｸ繧ｨ繝・ぅ繧ｿ縺九ｉ譁ｹ蜷代∬ｷ晞屬縲・溷ｺｦ縲∬ｶｳ蝣ｴ縺ｮ謨ｰ繧呈欠螳壹＠縺ｦ驟咲ｽｮ縺ｧ縺阪ｋ繧医≧縺ｫ縺励∪縺励◆縲・
- 繧ｹ繧ｫ繧､繝悶Μ繝・ず繝ｻ繧ｹ繝励Μ繝ｳ繝医↓遘ｻ蜍募ｺ翫・驟咲ｽｮ萓九ｒ霑ｽ蜉縺励∪縺励◆縲・

## v0.1.156
### English
- Added per-stage default rear and midground background selections while preserving manual debug background choices across same-stage restarts.
### Japanese
- 繧ｹ繝・・繧ｸ縺斐→縺ｫ譌｢螳壹・蠕梧勹縺ｨ荳ｭ譎ｯ縺ｮ邨・∩蜷医ｏ縺帙ｒ險ｭ螳壹〒縺阪ｋ繧医≧縺ｫ縺励∝酔縺倥せ繝・・繧ｸ縺ｮ繝ｪ繧ｹ繧ｿ繝ｼ繝医〒縺ｯ謇句虚縺ｧ蛻・ｊ譖ｿ縺医◆閭梧勹繧堤ｶｭ謖√☆繧九ｈ縺・↓縺励∪縺励◆縲・

## v0.1.155
### English
- Added a top landing hitbox to the utility box stage decoration.
### Japanese
- 繝ｦ繝ｼ繝・ぅ繝ｪ繝・ぅ繝懊ャ繧ｯ繧ｹ縺ｮ陬・｣ｾ縺ｫ繧ゅ∽ｸ翫↓荵励ｌ繧句ｽ薙◆繧雁愛螳壹ｒ霑ｽ蜉縺励∪縺励◆縲・

## v0.1.154
### English
- Allowed Skybridge Sprint score submissions in the leaderboard Cloud Function.
### Japanese
- 繧ｹ繧ｫ繧､繝悶Μ繝・ず繝ｻ繧ｹ繝励Μ繝ｳ繝医・繧ｹ繧ｳ繧｢繧偵Λ繝ｳ繧ｭ繝ｳ繧ｰ逋ｻ骭ｲ縺ｧ縺阪ｋ繧医≧縺ｫ縲，loud Functions蛛ｴ縺ｮ險ｱ蜿ｯ繧ｹ繝・・繧ｸ縺ｫ霑ｽ蜉縺励∪縺励◆縲・

## v0.1.153
### English
- Kept the selected rear and midground debug backgrounds after restarting the stage.
### Japanese
- 繧ｹ繝・・繧ｸ繧偵Μ繧ｹ繧ｿ繝ｼ繝医＠縺ｦ繧ゅ∝・繧頑崛縺医◆RB閭梧勹縺ｨMG閭梧勹縺後◎縺ｮ縺ｾ縺ｾ邯ｭ謖√＆繧後ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.152
### English
- Fixed dropdown menu option colors so unselected language and stage choices stay readable on the native menu background.
### Japanese
- 繝励Ν繝繧ｦ繝ｳ繝｡繝九Η繝ｼ縺ｮ驕ｸ謚櫁い縺ｮ譁・ｭ苓牡繧定ｪｿ謨ｴ縺励∵悴驕ｸ謚槭・險隱槭ｄ繧ｹ繝・・繧ｸ繧よｨ呎ｺ悶Γ繝九Η繝ｼ閭梧勹縺ｮ荳翫〒隱ｭ繧√ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.151
### English
- Made restart and miss flows close the leaderboard before continuing, while keeping R as a restart command.
### Japanese
- R繧ｭ繝ｼ縺ｮ繝ｪ繧ｹ繧ｿ繝ｼ繝医ｄ關ｽ荳九Α繧ｹ縺ｮ豬√ｌ縺ｧ縺ｯ縲∝・縺ｫ繝ｪ繝ｼ繝繝ｼ繝懊・繝峨ｒ髢峨§縺ｦ縺九ｉ騾壼ｸｸ縺ｮ繝ｪ繧ｹ繧ｿ繝ｼ繝医ｄ繝溘せ貍泌・縺ｸ騾ｲ繧繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.150
### English
- Added the Skybridge Sprint stage and a stage selector to the start screen, with leaderboard scores separated by selected stage.
### Japanese
- 譁ｰ繧ｹ繝・・繧ｸ縲後せ繧ｫ繧､繝悶Μ繝・ず繝ｻ繧ｹ繝励Μ繝ｳ繝医阪→髢句ｧ狗判髱｢縺ｮ繧ｹ繝・・繧ｸ驕ｸ謚槭ｒ霑ｽ蜉縺励√Λ繝ｳ繧ｭ繝ｳ繧ｰ繧る∈謚槭＠縺溘せ繝・・繧ｸ縺斐→縺ｫ蛻・°繧後ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.149
### English
- Made the R key dismiss the result screen first when a result or leaderboard panel is visible.
### Japanese
- 繝ｪ繧ｶ繝ｫ繝医ｄ繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ逕ｻ髱｢縺瑚｡ｨ遉ｺ縺輔ｌ縺ｦ縺・ｋ縺ｨ縺阪・縲ヽ繧ｭ繝ｼ縺ｧ蜈医↓縺昴・逕ｻ髱｢繧帝哩縺倥ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.148
### English
- Formalized Shift dash controls and added left/right mobile dash buttons with updated control hints.
### Japanese
- Shift繧ｭ繝ｼ縺ｧ繝繝・す繝･縺ｧ縺阪ｋ謫堺ｽ懊ｒ豁｣蠑上↑謫堺ｽ懊→縺励※霑ｽ蜉縺励√Δ繝舌う繝ｫ謫堺ｽ懊↓繧ょｷｦ蜿ｳ縺昴ｌ縺槭ｌ縺ｫ繝繝・す繝･繝懊ち繝ｳ繧定ｿｽ蜉縺励∪縺励◆縲・

## v0.1.147
### English
- Added the short leaderboard player ID beside the in-game HUD player name.
### Japanese
- 繧ｲ繝ｼ繝逕ｻ髱｢荳翫・繝励Ξ繧､繝､繝ｼ蜷阪・讓ｪ縺ｫ繧ゅ√Μ繝ｼ繝繝ｼ繝懊・繝臥畑縺ｮ遏ｭ縺・・繝ｬ繧､繝､繝ｼID繧定｡ｨ遉ｺ縺吶ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.146
### English
- Added a separate current-score area below the leaderboard and only shows the NEW row marker when the submitted score updates the saved best score.
### Japanese
- 繝ｪ繝ｼ繝繝ｼ繝懊・繝峨・荳九↓莉雁屓繧ｹ繧ｳ繧｢蟆ら畑繧ｨ繝ｪ繧｢繧定ｿｽ蜉縺励・∽ｿ｡縺励◆繧ｹ繧ｳ繧｢縺瑚・蟾ｱ繝吶せ繝医ｒ譖ｴ譁ｰ縺励◆蝣ｴ蜷医□縺題｡後↓ NEW 繧定｡ｨ遉ｺ縺吶ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.145
### English
- Enforced leaderboard player IDs on the client path and hides any fetched leaderboard rows that do not include a valid player ID.
### Japanese
- 繝ｪ繝ｼ繝繝ｼ繝懊・繝蛾∽ｿ｡譎ゅ↓繝励Ξ繧､繝､繝ｼID繧偵け繝ｩ繧､繧｢繝ｳ繝亥・縺ｧ繧ょｿ・医↓縺励∵怏蜉ｹ縺ｪ繝励Ξ繧､繝､繝ｼID縺後↑縺・Λ繝ｳ繧ｭ繝ｳ繧ｰ陦後・陦ｨ遉ｺ縺励↑縺・ｈ縺・↓縺励∪縺励◆縲・

## v0.1.144
### English
- Removed the NEW label from the leaderboard header while keeping the marker space and current-score NEW badge position unchanged.
### Japanese
- 繝ｪ繝ｼ繝繝ｼ繝懊・繝峨・繝・ム縺九ｉ NEW 縺ｮ隕句・縺励□縺代ｒ螟悶＠縲∽ｽ咏區縺ｨ莉雁屓繧ｹ繧ｳ繧｢縺ｮ NEW 陦ｨ遉ｺ菴咲ｽｮ縺ｯ縺昴・縺ｾ縺ｾ谿九＠縺ｾ縺励◆縲・

## v0.1.143
### English
- Added a fixed leaderboard header and moved the short player ID into its own column beside the player name.
### Japanese
- 繝ｪ繝ｼ繝繝ｼ繝懊・繝峨↓蝗ｺ螳壹・繝・ム繧定ｿｽ蜉縺励∫洒縺・・繝ｬ繧､繝､繝ｼID繧偵・繝ｬ繧､繝､繝ｼ蜷阪・讓ｪ縺ｮ蟆ら畑蛻励↓遘ｻ縺励∪縺励◆縲・

## v0.1.142
### English
- Made the current leaderboard submission show the locally saved short player ID even when older score rows do not yet include a stored player ID field.
### Japanese
- 蜿､縺・Λ繝ｳ繧ｭ繝ｳ繧ｰ陦後↓繝励Ξ繧､繝､繝ｼID縺御ｿ晏ｭ倥＆繧後※縺・↑縺・ｴ蜷医〒繧ゅ∽ｻ雁屓騾∽ｿ｡縺励◆繧ｹ繧ｳ繧｢縺ｫ縺ｯ遶ｯ譛ｫ縺ｫ菫晏ｭ倥＠縺溽洒縺・・繝ｬ繧､繝､繝ｼID繧定｡ｨ遉ｺ縺吶ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.141
### English
- Added a persistent leaderboard player ID so each player keeps one leaderboard row per stage, with the short ID shown beside the player name.
### Japanese
- 繝ｪ繝ｼ繝繝ｼ繝懊・繝臥畑縺ｮ繝励Ξ繧､繝､繝ｼID繧剃ｿ晏ｭ倥＠縲∝酔縺倥せ繝・・繧ｸ縺ｧ縺ｯ1莠ｺ1陦後↓縺ｾ縺ｨ縺ｾ繧九ｈ縺・↓縺励∪縺励◆縲ゅ・繝ｬ繧､繝､繝ｼ蜷阪・讓ｪ縺ｫ遏ｭ縺ИD繧り｡ｨ遉ｺ縺励∪縺吶・

## v0.1.140
### English
- Expanded the leaderboard display from the top 10 to the top 100 scores.
### Japanese
- 繝ｪ繝ｼ繝繝ｼ繝懊・繝峨・陦ｨ遉ｺ莉ｶ謨ｰ繧・0菴阪∪縺ｧ縺九ｉ100菴阪∪縺ｧ縺ｫ蠅励ｄ縺励∪縺励◆縲・

## v0.1.139
### English
- Added electronic countdown sound effects for 3, 2, 1, and a stronger rising cue for GO.
### Japanese
- 3縲・縲・ 縺ｮ繧ｫ繧ｦ繝ｳ繝医↓髮ｻ蟄宣浹繧定ｿｽ蜉縺励；O 縺ｧ縺ｯ蟆代＠蠑ｷ縺・ｸ頑・髻ｳ縺碁ｳｴ繧九ｈ縺・↓縺励∪縺励◆縲・

## v0.1.138
### English
- Removed Neon Bouncer from enemy definitions and replaced its former default stage placements with Aqua Mascot.
### Japanese
- Neon Bouncer 繧呈雰螳夂ｾｩ縺九ｉ蜑企勁縺励√ｂ縺ｨ繧ゅ→繝・ヵ繧ｩ繝ｫ繝域雰縺ｨ縺励※驟咲ｽｮ縺輔ｌ縺ｦ縺・◆蝣ｴ謇繧・Aqua Mascot 縺ｫ鄂ｮ縺肴鋤縺医∪縺励◆縲・

## v0.1.137
### English
- Brightened the start button in the opening modal so it reads as clearly clickable before hover.
### Japanese
- 髢句ｧ九Δ繝ｼ繝繝ｫ縺ｮ繧ｹ繧ｿ繝ｼ繝医・繧ｿ繝ｳ繧帝壼ｸｸ迥ｶ諷九〒繧よ・繧九￥縺励∵款縺帙ｋ繝懊ち繝ｳ縺縺ｨ蛻・°繧翫ｄ縺吶￥縺励∪縺励◆縲・

## v0.1.136
### English
- Converted runtime PNG assets that benefited from compression to WebP and updated game, story, enemy, item, sprite, and UI references.
- Kept the tiny leaderboard plate PNGs unchanged because their WebP versions were larger.
### Japanese
- 蝨ｧ邵ｮ蜉ｹ譫懊・螟ｧ縺阪＞螳溯｡梧凾PNG邏譚舌ｒWebP縺ｸ螟画鋤縺励√ご繝ｼ繝譛ｬ菴薙√せ繝医・繝ｪ繝ｼ縲∵雰縲√い繧､繝・Β縲√せ繝励Λ繧､繝医ゞI縺ｮ蜿ら・繧呈峩譁ｰ縺励∪縺励◆縲・
- 蟆上＆縺ｪ繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ逕ｨ繝励Ξ繝ｼ繝育判蜒上・WebP蛹悶☆繧九→騾・↓螟ｧ縺阪￥縺ｪ縺｣縺溘◆繧√￣NG縺ｮ縺ｾ縺ｾ谿九＠縺ｾ縺励◆縲・

## v0.1.135
### English
- Renamed the English stage display name to Shibu-ya city.
### Japanese
- 繧ｹ繝・・繧ｸ縺ｮ闍ｱ隱櫁｡ｨ遉ｺ蜷阪ｒ縲郡hibu-ya city縲阪↓螟画峩縺励∪縺励◆縲・

## v0.1.134
### English
- Renamed the Japanese stage display name from Neon Canal to Shibuya City.
### Japanese
- 繧ｹ繝・・繧ｸ縺ｮ譌･譛ｬ隱櫁｡ｨ遉ｺ蜷阪ｒ縲後ロ繧ｪ繝ｳ驕区ｲｳ縲阪°繧峨後す繝悶Ζ繧ｷ繝・ぅ縲阪↓螟画峩縺励∪縺励◆縲・

## v0.1.132
### English
- Added localized stage names with `jp` and `en` fields in stage definitions, while keeping old string-name stage JSON imports compatible.
### Japanese
- 繧ｹ繝・・繧ｸ螳夂ｾｩ縺ｮ蜷榊燕縺ｫ `jp` 縺ｨ `en` 繧呈戟縺溘○繧峨ｌ繧九ｈ縺・↓縺励∝商縺・枚蟄怜・蠖｢蠑上・繧ｹ繝・・繧ｸJSON繧ょｼ輔″邯壹″隱ｭ縺ｿ霎ｼ繧√ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.131
### English
- Made the fall MISS overlay more dramatic with a screen flash, stronger camera shake, color-offset echoes, and a punchier bounce animation.
### Japanese
- 關ｽ荳区凾縺ｮ MISS 陦ｨ遉ｺ縺ｫ逕ｻ髱｢繝輔Λ繝・す繝･縲∝ｼｷ繧√・繧ｫ繝｡繝ｩ謠ｺ繧後∬牡繧ｺ繝ｬ縺励◆谿句ワ縲∝兇縺・・縺ゅｋ繝舌え繝ｳ繝画ｼ泌・繧定ｿｽ蜉縺励∪縺励◆縲・

## v0.1.130
### English
- Added TV power-on and power-off style animations when the story message window appears and disappears.
### Japanese
- 繧ｹ繝医・繝ｪ繝ｼ縺ｮ繝｡繝・そ繝ｼ繧ｸ繧ｦ繧｣繝ｳ繝峨え縺瑚｡ｨ遉ｺ繝ｻ髱櫁｡ｨ遉ｺ縺ｫ縺ｪ繧九→縺阪↓縲√ユ繝ｬ繝薙・髮ｻ貅舌′蜈･縺｣縺溘ｊ豸医∴縺溘ｊ縺吶ｋ繧医≧縺ｪ貍泌・繧定ｿｽ蜉縺励∪縺励◆縲・

## v0.1.129
### English
- Moved countdown scan lines and glow behind the main lettering, then strengthened the foreground text with a hard dark outline for clearer contrast.
### Japanese
- 繧ｫ繧ｦ繝ｳ繝医ム繧ｦ繝ｳ縺ｮ繧ｹ繧ｭ繝｣繝ｳ繝ｩ繧､繝ｳ縺ｨ逋ｺ蜈峨ｒ譁・ｭ励・閭碁擇縺ｸ荳九￡縲∝燕髱｢縺ｮ譁・ｭ励↓遑ｬ縺・ｻ堤ｸ√ｒ莉倥￠縺ｦ縲・縲・縲・縲；O 縺後￥縺｣縺阪ｊ隕九∴繧九ｈ縺・↓縺励∪縺励◆縲・

## v0.1.128
### English
- Restyled the start countdown with a heavier arcade font stack, layered neon text, burst lines, scan lines, and a sharper hit animation.
### Japanese
- 繧ｹ繧ｿ繝ｼ繝域凾縺ｮ繧ｫ繧ｦ繝ｳ繝医ム繧ｦ繝ｳ繧偵・㍾繧√・繧｢繝ｼ繧ｱ繝ｼ繝蛾｢ｨ繝輔か繝ｳ繝医・㍾縺ｭ縺溘ロ繧ｪ繝ｳ譁・ｭ励∵叛蟆・ｷ壹√せ繧ｭ繝｣繝ｳ繝ｩ繧､繝ｳ縲・強縺・・迴ｾ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ縺ｧ繧医ｊ繧ｮ繝ｩ繧ｮ繝ｩ縺励◆隕九◆逶ｮ縺ｫ縺励∪縺励◆縲・

## v0.1.127
### English
- Added a dedicated NEW column to the leaderboard so the freshly submitted score is obvious at a glance.
### Japanese
- 繝ｪ繝ｼ繝繝ｼ繝懊・繝峨↓ NEW 蟆ら畑縺ｮ蛻励ｒ霑ｽ蜉縺励√け繝ｪ繧｢逶ｴ蠕後↓騾∽ｿ｡縺励◆繧ｹ繧ｳ繧｢縺後・縺ｨ逶ｮ縺ｧ蛻・°繧九ｈ縺・↓縺励∪縺励◆縲・

## v0.1.126
### English
- Delayed the opening story dialogue until the player passes X 600, then automatically advances and hides the message window on timers.
### Japanese
- 譛蛻昴・莨夊ｩｱ繧ｦ繧｣繝ｳ繝峨え繧帝撼陦ｨ遉ｺ縺ｧ髢句ｧ九＠縲√・繝ｬ繧､繝､繝ｼ縺ｮX蠎ｧ讓吶′600繧定ｶ・∴縺溘ｉ縲御ｺｺ縺悟､壹＞縺ｧ縺吶・窶ｦ窶ｦ縲阪ｒ陦ｨ遉ｺ縺励※縲・遘貞ｾ後↓谺｡縺ｮ莨夊ｩｱ縺ｸ騾ｲ縺ｿ縲√＆繧峨↓8遘貞ｾ後↓繧ｦ繧｣繝ｳ繝峨え繧呈ｶ医☆繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.125
### English
- Added the extracted aqua mascot frames as an animated enemy sprite sheet.
- Registered Aqua Mascot as an enemy type and placed a sample enemy in the stage.
### Japanese
- 謚ｽ蜃ｺ縺励◆繧｢繧ｯ繧｢邉ｻ繝槭せ繧ｳ繝・ヨ縺ｮ繝輔Ξ繝ｼ繝繧偵∵雰繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ逕ｨ縺ｮ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧ｹ繝励Λ繧､繝医す繝ｼ繝医→縺励※霑ｽ蜉縺励∪縺励◆縲・
- Aqua Mascot 繧呈雰繧ｿ繧､繝励→縺励※逋ｻ骭ｲ縺励√せ繝・・繧ｸ荳翫↓繧ｵ繝ｳ繝励Ν謨ｵ縺ｨ縺励※驟咲ｽｮ縺励∪縺励◆縲・

## v0.1.124
### English
- Updated the second story dialogue portrait and automatically advances to it when the player moves past X 600.
### Japanese
- 縲悟・縺ｸ騾ｲ縺ｿ縺ｾ縺励ｇ縺・阪・莨夊ｩｱ縺ｫ譁ｰ縺励＞陦ｨ諠・い繧､繧ｳ繝ｳ繧剃ｽｿ縺・√・繝ｬ繧､繝､繝ｼ縺ｮX蠎ｧ讓吶′600繧定ｶ・∴縺溘ｉ閾ｪ蜍輔〒縺昴・莨夊ｩｱ縺ｸ蛻・ｊ譖ｿ繧上ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.123
### English
- Increased the contrast of the PC/mobile mode selector and sound ON/OFF selector so the active choices are clearer on phone screens.
### Japanese
- 繧ｹ繝槭・逕ｻ髱｢縺ｧ繧ら樟蝨ｨ驕ｸ縺ｰ繧後※縺・ｋ謫堺ｽ懊Δ繝ｼ繝峨→繧ｵ繧ｦ繝ｳ繝芽ｨｭ螳壹′蛻・°繧翫ｄ縺吶＞繧医≧縺ｫ縲・∈謚櫁｡ｨ遉ｺ縺ｮ繧ｳ繝ｳ繝医Λ繧ｹ繝医ｒ蠑ｷ繧√∪縺励◆縲・

## v0.1.122
### English
- Moved the leaderboard NEW marker outside the rank column and auto-scrolls the list to the newly submitted score.
- Made the MISS overlay brighter and heavier with a strong outline and glow.
### Japanese
- 繝ｪ繝ｼ繝繝ｼ繝懊・繝峨・ NEW 陦ｨ遉ｺ繧帝・ｽ榊・縺ｮ螟悶∈遘ｻ蜍輔＠縲∵眠縺励￥騾∽ｿ｡縺励◆繧ｹ繧ｳ繧｢陦後∪縺ｧ閾ｪ蜍輔〒繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺吶ｋ繧医≧縺ｫ縺励∪縺励◆縲・
- MISS 陦ｨ遉ｺ繧呈ｿ・￥繧ｮ繝ｩ縺､縺・◆濶ｲ縲∝､ｪ縺・ｸ∝叙繧翫∝ｼｷ縺・匱蜈峨↓隱ｿ謨ｴ縺励∪縺励◆縲・

## v0.1.121
### English
- Highlighted the newly submitted leaderboard score so players can identify their current clear result.
- Restyled the leaderboard scrollbar to match the fantasy UI instead of the default browser scrollbar.
### Japanese
- 繧ｯ繝ｪ繧｢逶ｴ蠕後↓騾∽ｿ｡縺励◆繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ陦後ｒ蠑ｷ隱ｿ縺励∽ｻ雁屓縺ｮ繧ｹ繧ｳ繧｢縺後←繧後°蛻・°繧九ｈ縺・↓縺励∪縺励◆縲・
- 繝ｪ繝ｼ繝繝ｼ繝懊・繝峨・繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繝舌・繧偵ヶ繝ｩ繧ｦ繧ｶ讓呎ｺ悶・隕九◆逶ｮ縺九ｉ縲√ヵ繧｡繝ｳ繧ｿ繧ｸ繝ｼUI縺ｫ鬥ｴ譟薙・濶ｲ縺ｸ隱ｿ謨ｴ縺励∪縺励◆縲・

## v0.1.120
### English
- Updated the opening Shibuya dialogue portrait to use the new message face icon asset.
### Japanese
- 貂玖ｰｷ縺ｮ莨夊ｩｱ縺ｧ縲御ｺｺ縺悟､壹＞縺ｧ縺吶・窶ｦ窶ｦ縲阪→隧ｱ縺吝ｴ髱｢縺ｮ鬘碑｡ｨ遉ｺ縺ｫ縲∵眠縺励＞繝｡繝・そ繝ｼ繧ｸ逕ｨ陦ｨ諠・い繧､繧ｳ繝ｳ繧剃ｽｿ縺・ｈ縺・↓縺励∪縺励◆縲・

## v0.1.119
### English
- Rebuilt the leaderboard window with dedicated raster assets so rows, rank numbers, scores, and dates no longer overlap or inherit dropdown arrows.
### Japanese
- 繝ｪ繝ｼ繝繝ｼ繝懊・繝牙ｰら畑縺ｮ繝ｩ繧ｹ繧ｿ邏譚舌ｒ霑ｽ蜉縺励・・ｽ阪∝錐蜑阪√せ繧ｳ繧｢縲∵律譎ゅ′驥阪↑繧峨★縲∽ｸ崎ｦ√↑繝峨Ο繝・・繝繧ｦ繝ｳ遏｢蜊ｰ繧ょ・縺ｪ縺・｡ｨ遉ｺ縺ｫ菴懊ｊ逶ｴ縺励∪縺励◆縲・

## v0.1.118
### English
- Extended the fall-miss restart delay so the miss danmaku has time to play before the stage restarts.
### Japanese
- 繝溘せ譎ゅ・蠑ｾ蟷輔′隕九∴繧九ｈ縺・↓縲∬誠荳九Α繧ｹ貍泌・縺九ｉ繝ｪ繧ｹ繧ｿ繝ｼ繝医∪縺ｧ縺ｮ蠕・■譎る俣繧帝聞縺上＠縺ｾ縺励◆縲・

## v0.1.117
### English
- Added an options menu toggle to enable or disable danmaku comments, with the setting saved between sessions.
### Japanese
- 繧ｪ繝励す繝ｧ繝ｳ繝｡繝九Η繝ｼ縺ｫ蠑ｾ蟷戊｡ｨ遉ｺ縺ｮ繧ｪ繝ｳ繝ｻ繧ｪ繝輔ｒ霑ｽ蜉縺励∬ｨｭ螳壹′谺｡蝗櫁ｵｷ蜍墓凾縺ｫ繧よｮ九ｋ繧医≧縺ｫ縺励∪縺励◆縲・

## v0.1.116
### English
- Added a fall-miss sequence with a MISS overlay, camera shake, danmaku, and delayed restart when the player drops below the stage.
### Japanese
- 繧ｹ繝・・繧ｸ荳九∈關ｽ縺｡縺溘→縺阪↓蜊ｳ繝ｪ繧ｹ繧ｿ繝ｼ繝医○縺壹｀ISS陦ｨ遉ｺ縲√き繝｡繝ｩ謠ｺ繧後∝ｼｾ蟷輔ｒ謖溘ｓ縺ｧ縺九ｉ繝ｪ繧ｹ繧ｿ繝ｼ繝医☆繧九Α繧ｹ貍泌・繧定ｿｽ蜉縺励∪縺励◆縲・

## v0.1.115
### English
- Added a repeatable Nico-style danmaku burst after jumping 5 times without landing.
### Japanese
- 逹蝨ｰ繧呈検縺ｾ縺壹↓繧ｸ繝｣繝ｳ繝励ｒ5蝗樒ｶ壹￠縺溘→縺阪↓縲√ル繧ｳ繝九さ蜍慕判鬚ｨ縺ｮ蠑ｾ蟷輔′豬√ｌ繧区ｼ泌・繧定ｿｽ蜉縺励∪縺励◆縲ら捩蝨ｰ縺吶ｋ縺ｨ蜀咲匱轣ｫ縺ｧ縺阪ｋ繧医≧縺ｫ縺ｪ繧翫∪縺吶・

## v0.1.114
### English
- Changed the crouch danmaku trigger from 3 seconds to 2 seconds.
### Japanese
- 縺励ｃ縺後∩蠑ｾ蟷輔′豬√ｌ繧九∪縺ｧ縺ｮ譎る俣繧・遘偵°繧・遘偵↓遏ｭ縺上＠縺ｾ縺励◆縲・

## v0.1.113
### English
- Added a repeatable Nico-style danmaku burst after crouching for more than 3 seconds.
### Japanese
- 縺励ｃ縺後∩迥ｶ諷九ｒ3遘剃ｻ･荳顔ｶ壹￠縺溘→縺阪↓縲√ル繧ｳ繝九さ蜍慕判鬚ｨ縺ｮ蠑ｾ蟷輔′豬√ｌ繧区ｼ泌・繧定ｿｽ蜉縺励∪縺励◆縲ゅ＠繧・′縺ｿ繧定ｧ｣髯､縺吶ｋ縺ｨ蜀咲匱轣ｫ縺ｧ縺阪ｋ繧医≧縺ｫ縺ｪ繧翫∪縺吶・

## v0.1.112
### English
- Added a Shift speed modifier that doubles movement acceleration, max run speed, and jump launch velocity while held.
### Japanese
- Shift 繧ｭ繝ｼ繧呈款縺励※縺・ｋ髢薙∫ｧｻ蜍募刈騾溷ｺｦ縲∵怙鬮倡ｧｻ蜍暮溷ｺｦ縲√ず繝｣繝ｳ繝怜・騾溘′2蛟阪↓縺ｪ繧九ｈ縺・↓縺励∪縺励◆縲・

## v0.1.111
### English
- Added Firebase-backed leaderboard client wiring with score submission on clear and a top-score modal.
- Added Firebase environment, Firestore rules, and Cloud Function setup notes for shared rankings.
- Added a Nico-style scrolling danmaku burst when the item score first exceeds 1000.
### Japanese
- Firebase 繧剃ｽｿ縺｣縺溘Λ繝ｳ繧ｭ繝ｳ繧ｰ騾｣謳ｺ繧定ｿｽ蜉縺励√け繝ｪ繧｢譎ゅ・繧ｹ繧ｳ繧｢騾∽ｿ｡縺ｨ繝医ャ繝励せ繧ｳ繧｢陦ｨ遉ｺ繝｢繝ｼ繝繝ｫ繧貞・繧後∪縺励◆縲・
- 蜈ｱ譛峨Λ繝ｳ繧ｭ繝ｳ繧ｰ逕ｨ縺ｮ Firebase 迺ｰ蠅・ｨｭ螳壹：irestore 繝ｫ繝ｼ繝ｫ縲，loud Functions 縺ｮ蟆主・繝｡繝｢繧定ｿｽ蜉縺励∪縺励◆縲・
- 繧｢繧､繝・Β繧ｹ繧ｳ繧｢縺悟・繧√※1000繧定ｶ・∴縺溘→縺阪↓縲√ル繧ｳ繝九さ蜍慕判鬚ｨ縺ｮ讓ｪ豬√ｌ蠑ｾ蟷輔′蜃ｺ繧区ｼ泌・繧定ｿｽ蜉縺励∪縺励◆縲・

## v0.1.110
### English
- Replaced the options modal CSS-built frame with a single fixed-aspect raster window asset.
- Limited options modal CSS to sizing and form layout so the frame no longer distorts.
### Japanese
- 險ｭ螳壹Δ繝ｼ繝繝ｫ縺ｮCSS縺ｧ邨・∩遶九※縺ｦ縺・◆譫繧偵∝崋螳壹い繧ｹ繝壹け繝域ｯ斐・1譫夂ｵｵ繧ｦ繧｣繝ｳ繝峨え邏譚舌↓鄂ｮ縺肴鋤縺医∪縺励◆縲・
- 險ｭ螳壹Δ繝ｼ繝繝ｫ縺ｮCSS繧偵し繧､繧ｺ縺ｨ繝輔か繝ｼ繝驟咲ｽｮ荳ｭ蠢・↓邨槭ｊ縲∵棧縺梧ｭｪ縺ｾ縺ｪ縺・ｈ縺・↓縺励∪縺励◆縲・

## v0.1.109
### English
- Replaced the CSS-built start modal frame with a single fixed-aspect raster window asset.
- Limited CSS on the start modal to sizing, positioning, and form layout so frame ornaments no longer distort or multiply.
### Japanese
- CSS縺ｧ邨・∩遶九※縺ｦ縺・◆髢句ｧ九Δ繝ｼ繝繝ｫ縺ｮ譫繧偵ｄ繧√∝崋螳壹い繧ｹ繝壹け繝域ｯ斐・1譫夂ｵｵ繧ｦ繧｣繝ｳ繝峨え邏譚舌↓鄂ｮ縺肴鋤縺医∪縺励◆縲・
- 髢句ｧ九Δ繝ｼ繝繝ｫ縺ｮCSS縺ｯ繧ｵ繧､繧ｺ縲・・鄂ｮ縲√ヵ繧ｩ繝ｼ繝繝ｬ繧､繧｢繧ｦ繝井ｸｭ蠢・↓邨槭ｊ縲∵棧縺ｮ陬・｣ｾ縺梧ｭｪ繧薙□繧雁｢玲ｮ悶＠縺溘ｊ縺励↑縺・ｈ縺・↓縺励∪縺励◆縲・

## v0.1.108
### English
- Rebuilt the start modal frame from separate corner, edge, fill, and center ornament layers to avoid border-image distortion.
- Centered the start modal frame ornaments independently so they stay aligned on wide windows.
### Japanese
- 髢句ｧ九Δ繝ｼ繝繝ｫ縺ｮ譫繧偵∬ｧ偵√・縺｡縲∽ｸｭ髱｢縲∽ｸｭ螟ｮ陬・｣ｾ縺ｮ蛻･繝ｬ繧､繝､繝ｼ縺ｧ邨・∩逶ｴ縺励｜order-image 縺ｮ蠑輔″莨ｸ縺ｰ縺励↓繧医ｋ豁ｪ縺ｿ繧帝∩縺代∪縺励◆縲・
- 髢句ｧ九Δ繝ｼ繝繝ｫ譫縺ｮ荳ｭ螟ｮ陬・｣ｾ繧堤峡遶九＠縺ｦ荳ｭ螟ｮ驟咲ｽｮ縺励∵ｨｪ髟ｷ縺ｮ繧ｦ繧｣繝ｳ繝峨え縺ｧ繧ゆｽ咲ｽｮ縺後★繧後↑縺・ｈ縺・↓縺励∪縺励◆縲・

## v0.1.107
### English
- Added a long-idle player animation that plays once after the player remains idle for 5 seconds, then returns to the normal idle loop.
### Japanese
- 繝励Ξ繧､繝､繝ｼ縺・遘帝俣蠕・ｩ溘＠邯壹￠縺溘→縺阪↓髟ｷ繧√・蠕・ｩ溘い繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧・蝗槫・逕溘＠縲√◎縺ｮ蠕後・騾壼ｸｸ縺ｮ蠕・ｩ溘い繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ縺ｸ謌ｻ繧九ｈ縺・↓縺励∪縺励◆縲・

## v0.1.106
### English
- Narrowed the start modal and centered its internal controls with extra side margin to avoid right-edge clipping.
- Added more padding inside the player name field and removed the native select arrow from the language field.
### Japanese
- 髢句ｧ九Δ繝ｼ繝繝ｫ繧貞ｰ代＠迢ｭ縺上＠縲∝・驛ｨ縺ｮ謫堺ｽ憺Κ蜩√↓蟾ｦ蜿ｳ菴咏區繧呈戟縺溘○縺ｦ蜿ｳ遶ｯ縺瑚ｦ句・繧後↑縺・ｈ縺・↓縺励∪縺励◆縲・
- 繝励Ξ繧､繝､繝ｼ蜷榊・蜉帶ｬ・・蜀・・菴咏區繧貞｢励ｄ縺励∬ｨ隱樊ｬ・・繝悶Λ繧ｦ繧ｶ讓呎ｺ也泙蜊ｰ繧呈ｶ医＠縺ｾ縺励◆縲・

## v0.1.105
### English
- Rebuilt the safe-padded fantasy window frame from the single modal frame so neighboring sheet art no longer appears on the left side.
### Japanese
- 螳牙・菴咏區莉倥″縺ｮ繝輔ぃ繝ｳ繧ｿ繧ｸ繝ｼ繧ｦ繧｣繝ｳ繝峨え譫繧貞腰菴薙・繝｢繝ｼ繝繝ｫ譫縺九ｉ菴懊ｊ逶ｴ縺励∝ｷｦ蛛ｴ縺ｫ髫｣縺ｮ邏譚舌′蜃ｺ縺ｪ縺・ｈ縺・↓縺励∪縺励◆縲・

## v0.1.104
### English
- Recut the start and options UI frame, title, input, select, and button art with safer transparent padding so right-side ornaments do not clip.
- Updated the start and options windows to use the safer UI assets.
### Japanese
- 髢句ｧ狗判髱｢縺ｨ險ｭ螳夂判髱｢縺ｧ菴ｿ縺・棧縲√ち繧､繝医Ν縲∝・蜉帶ｬ・√そ繝ｬ繧ｯ繝域ｬ・√・繧ｿ繝ｳ邏譚舌ｒ縲∝承蛛ｴ縺ｮ陬・｣ｾ縺悟・繧後↑縺・ｈ縺・↓菴咏區莉倥″縺ｧ蛻・ｊ逶ｴ縺励∪縺励◆縲・
- 髢句ｧ狗判髱｢縺ｨ險ｭ螳夂判髱｢繧偵∝・繧顔峩縺励◆螳牙・菴咏區莉倥″UI邏譚舌∈蟾ｮ縺玲崛縺医∪縺励◆縲・

## v0.1.103
### English
- Changed the player name field to use a plain fantasy input plate instead of the dropdown-style field art.
- Narrowed the start modal and increased side padding so the right edge of the fantasy frame does not clip.
### Japanese
- 繝励Ξ繧､繝､繝ｼ蜷榊・蜉帶ｬ・ｒ縲√・繝ｫ繝繧ｦ繝ｳ鬚ｨ縺ｧ縺ｯ縺ｪ縺・壼ｸｸ蜈･蜉帷畑縺ｮ繝輔ぃ繝ｳ繧ｿ繧ｸ繝ｼUI繝励Ξ繝ｼ繝医↓螟画峩縺励∪縺励◆縲・
- 髢句ｧ九Δ繝ｼ繝繝ｫ縺ｮ蟷・→蟾ｦ蜿ｳ菴咏區繧定ｪｿ謨ｴ縺励∝承蛛ｴ縺ｮ螟匁棧縺瑚ｦ句・繧後↑縺・ｈ縺・↓縺励∪縺励◆縲・

## v0.1.102
### English
- Split the fantasy window frame into reusable corner, edge, fill, and 9-slice frame assets.
- Rebuilt the start and options windows with scalable 9-slice borders so the frame no longer clips at narrow widths.
- Tightened the start menu sizing and responsive layout to keep controls inside the window.
### Japanese
- 繝輔ぃ繝ｳ繧ｿ繧ｸ繝ｼUI縺ｮ繧ｦ繧｣繝ｳ繝峨え譫繧偵∬ｧ偵√・縺｡縲∽ｸｭ髱｢縲・-slice逕ｨ繝輔Ξ繝ｼ繝邏譚舌↓蛻・屬縺励∪縺励◆縲・
- 髢句ｧ狗判髱｢縺ｨ險ｭ螳夂判髱｢繧剃ｼｸ邵ｮ縺ｧ縺阪ｋ9-slice譫縺ｧ菴懊ｊ逶ｴ縺励∫強縺・ｹ・〒繧よ棧縺瑚ｦ句・繧後↑縺・ｈ縺・↓縺励∪縺励◆縲・
- 髢句ｧ九Γ繝九Η繝ｼ縺ｮ繧ｵ繧､繧ｺ縺ｨ繝ｬ繧ｹ繝昴Φ繧ｷ繝夜・鄂ｮ繧定ｪｿ謨ｴ縺励∵桃菴憺Κ蜩√′繧ｦ繧｣繝ｳ繝峨え蜀・↓蜿弱∪繧九ｈ縺・↓縺励∪縺励◆縲・

## v0.1.101
### English
- Increased the story message UI to roughly 1.2x its previous size while keeping it inside the game frame.
- Added a reusable fantasy UI raster asset set matching the story message frame.
- Restyled the start screen and options screen to use the fantasy UI asset style.
- Started a fresh release notes file and moved older entries to the archive.
### Japanese
- 繧ｹ繝医・繝ｪ繝ｼ繝｡繝・そ繝ｼ繧ｸUI繧偵√ご繝ｼ繝譫蜀・↓蜿弱ａ縺溘∪縺ｾ莉･蜑阪・邏・.2蛟阪↓縺励∪縺励◆縲・
- 繧ｹ繝医・繝ｪ繝ｼ繝｡繝・そ繝ｼ繧ｸ譫縺ｫ蜷医ｏ縺帙◆縲∵ｱ守畑逧・↑繝輔ぃ繝ｳ繧ｿ繧ｸ繝ｼUI繝ｩ繧ｹ繧ｿ繝ｼ邏譚舌そ繝・ヨ繧定ｿｽ蜉縺励∪縺励◆縲・
- 髢句ｧ狗判髱｢縺ｨ險ｭ螳夂判髱｢繧偵√ヵ繧｡繝ｳ繧ｿ繧ｸ繝ｼUI邏譚舌↓蜷医ｏ縺帙◆隕九◆逶ｮ縺ｸ螟画峩縺励∪縺励◆縲・
- 繝ｪ繝ｪ繝ｼ繧ｹ繝弱・繝医ｒ譁ｰ縺励￥謨ｴ逅・＠縲・℃蜴ｻ縺ｮ險倬鹸繧偵い繝ｼ繧ｫ繧､繝悶∈遘ｻ縺励∪縺励◆縲・

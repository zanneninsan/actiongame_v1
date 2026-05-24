# UI Mobile Landscape Audit

Date: 2026-05-25  
Target: 932 x 430 mobile landscape viewport, Edge via Playwright

## Evidence

- Before world map: [screenshots/before-world-map-landscape.webp](ui-audit/screenshots/before-world-map-landscape.webp)
- After world map: [screenshots/after-world-map-landscape.webp](ui-audit/screenshots/after-world-map-landscape.webp)
- Before settings: [screenshots/before-settings-landscape.webp](ui-audit/screenshots/before-settings-landscape.webp)
- After confirmation dialog: [screenshots/after-confirm-landscape.webp](ui-audit/screenshots/after-confirm-landscape.webp)
- After start panel: [screenshots/after-start-panel-landscape.webp](ui-audit/screenshots/after-start-panel-landscape.webp)
- Before gameplay HUD: [screenshots/before-gameplay-landscape.webp](ui-audit/screenshots/before-gameplay-landscape.webp)
- After gameplay HUD: [screenshots/after-gameplay-landscape.webp](ui-audit/screenshots/after-gameplay-landscape.webp)

## Summary

スマホ横画面を中心に、Playwrightでワールドマップ、設定、ステージ確認、開始画面、プレイ中HUDを確認した。主な問題は「操作したいマスやボタンの上に情報パネルが被る」「低い画面高に対して文字付きボタンやカードが大きすぎる」「設定や確認画面を開いた時に背面UIが干渉する」の3系統だった。

今回の修正では、スマホ横画面では地図を主役にして、操作ボタンをアイコン化し、情報カードを左右に分離し、設定・確認中は背面UIの干渉を抑える方針にした。プレイ中HUDも低い横画面では縮小するようにした。

## 20 Findings And Fixes

| No | 改善前 | 改善後 |
| --- | --- | --- |
| 1 | ワールドマップ右側のダッシュボードが選択マスやプレイヤーに被り、Playwrightのクリックでも遮られていた。 | スマホ横画面ではダッシュボードを右下側に寄せ、マス選択の主動線を空けた。 |
| 2 | ツールバーの「前へ」「おまかせ」「設定」などの文字ボタンが横画面の上部を大きく占有していた。 | 横画面ではアイコンボタンに切り替え、上部の占有幅を圧縮した。 |
| 3 | アイコン化すると意味が分かりにくくなる懸念があった。 | 各ツールバーボタンに `title` と `aria-label` を追加し、アクセシビリティと補足情報を残した。 |
| 4 | 設定を開いた直後に言語セレクトへフォーカスし、スマホで不要な入力UIを誘発しやすかった。 | 設定を開いた時は閉じるボタンへフォーカスし、勝手な入力UI表示を避けた。 |
| 5 | 設定パネルの背後にステージカードとダッシュボードが残り、読みにくく操作もしづらかった。 | 設定中は背後のステージカードとダッシュボードを非表示扱いにし、設定操作へ集中させた。 |
| 6 | ステージ開始確認ダイアログの背後でダッシュボードが強く主張し、確認の視線を奪っていた。 | 確認中はダッシュボードを薄くし、ポインターイベントも無効化した。 |
| 7 | ステージカードとダッシュボードが同じ下側エリアを取り合い、地図の道筋が見えにくかった。 | ステージカードは左上、ダッシュボードは右下へ分け、地図中央と下部の道を残した。 |
| 8 | ワールドマップのキャプションが低い画面高で縦方向を圧迫していた。 | 横画面ではキャプションを小さくし、補足行を隠して地図表示を優先した。 |
| 9 | ステージカード内の計画・詳細情報が横画面では情報過多だった。 | 横画面では計画グリッドと詳細グリッドを隠し、ステージ名と主要ステータスだけに絞った。 |
| 10 | ステージ一覧レールが縦に伸び、地図操作エリアを削っていた。 | 横画面では一覧レールの最大高さを下げ、スクロール領域に収めた。 |
| 11 | フィルタや検索を含むダッシュボードが広くなりすぎ、主操作であるマップ移動と競合していた。 | ダッシュボード幅を画面の約半分以下に抑え、右側の補助UIとして扱うようにした。 |
| 12 | ステージカードが左右どちらの配置でも画面幅いっぱいに近く、ノードクリックの邪魔になっていた。 | 横画面ではカード幅を約48%以下に制限し、左上のコンパクト表示にした。 |
| 13 | 開始画面へ進むと、移動前の設定類を移した後の空白が大きく、画面の密度が悪かった。 | 開始画面を自動高さにし、横画面では最終確認に必要な項目だけがまとまるようにした。 |
| 14 | 開始画面のプレイヤー名などが縦積み中心で、低い画面高では余白が目立った。 | 横画面では左ラベル、右入力欄の2カラムにして縦幅を節約した。 |
| 15 | アカウント連携周りが下に張り付き、横画面では開始ボタンとの距離が不自然だった。 | アカウントパネルを通常フローへ戻し、操作ボタンを横並びのコンパクト配置にした。 |
| 16 | ゴースト読込などの詳細設定が開いた時に画面からあふれやすかった。 | 詳細パネルに最大高さと内部スクロールを持たせた。 |
| 17 | ステージへ戻るボタンや開始ボタンが、横画面ではやや大きく間延びしていた。 | 横画面用にボタン高さとフォントサイズを調整し、押しやすさを残して密度を上げた。 |
| 18 | 設定パネルの幅が低い横画面に対して大きく、地図側の文脈を潰していた。 | 設定パネルの幅と余白を抑え、必要な設定だけを読みやすく残した。 |
| 19 | プレイ中の左上HUDがスマホ横画面で大きく、プレイフィールドを覆いすぎていた。 | 低い横画面ではHUDスケールを別計算にし、最大0.92までに抑えた。 |
| 20 | HUDの最小スケールが1固定だったため、画面が低くても縮まらなかった。 | `HUD_MIN_SCALE` を0.76に下げ、横画面時に自然に縮小できるようにした。 |

## Verification

- Playwrightでスマホ横画面相当のビューポートを開き、ワールドマップ、設定、確認ダイアログ、開始画面、プレイ中HUDをスクリーンショット確認した。
- `npm.cmd run build` でTypeScript/Viteビルドが通ることを確認した。


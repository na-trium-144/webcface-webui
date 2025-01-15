## [1.12.0] - 2025-01-16
### Added
* Viewの要素のwidth, heightオプションに対応 (#339)

## [1.11.0] - 2024-12-16
### Changed
* ValueCardのグラフ表示をオフにし現在の値だけを表示する機能を追加 (#329)
* TextCardをデータごとに独立したウィンドウに変更
    * さらに値が変化したときに色を変えてお知らせ
* Cardの名前表示を改良
    * member名を小さく表示するようにし、さらにそれでもはみ出す場合は折り返さず左にellipsis表示

## [1.10.4] - 2024-12-11
### Fixed
* Menuを開閉すると受信したImageのサイズがおかしくなるバグを修正 (#325)

## [1.10.3] - 2024-11-30
### Fixed
* selectの初期値がoption内に無い場合の挙動を修正 (#320)
* クライアントが再接続時にそのメンバーの過去のデータを消す (webcface-js 1.9.1)

## [1.10.2] - 2024-11-26
### Fixed
* webcface-desktop 内でPATHの処理が間違っており webcface-server コマンドが見つからないとなってしまうバグを修正
* webcface-webui のdebパッケージで、webuiのインストール場所を /usr/share/webcface だけでなく /opt/webcface/share/webcface も追加

## [1.10.1] - 2024-11-21
### Fixed
* valueCardでデータが不足しているとき(0,0)に点があるとして描画されているのを修正 (#311)
* entryが送られてきてもsideMenuとlayoutが更新されないことがあったのを修正 (#312)

## [1.10.0] - 2024-10-08
### Added
* Funcの名前を検索する機能を追加 (#302)
* 関数ピン止め機能を追加
### Changed
* FuncのRunボタンはマウスカーソルを載せるかフォーカスしたときにのみ表示
* 全体的にボタンを一回り大きくした (#303)

## [1.9.1] - 2024-10-07
### Fixed
* webuiが切断状態のときpingStatusが切断アイコンになるようにした (#301)

## [1.9.0] - 2024-10-02
### Added
* 名前付きLogの受信 (#294)
    * 今までのLogsカードは「default」という名前になります

## [1.8.3] - 2024-09-17
### Changed
* Connection Info に `git describe --tags` の情報がバージョン番号として表示されるようにした (#283)
### Fixed
* LogCardのスクロール動作を修正 (#281)
* LogCardを閉じて開き直すとログが消えるバグを修正

## [1.8.2] - 2024-09-16
webcface-jsの更新 (1.8.1)

## [1.8.1] - 2024-09-04
### Changed
* モバイル表示のときサーバーアドレスの表示をメニューに移動 (#272)
* serverに未接続のとき関数呼び出しを送信しないようにした (webcface-js 1.8.0)
### Fixed
* LogCardの処理の軽量化 (#273)
    * 50msあたり1000行以上のログは読まないようにする
* Log画面を開いていなくてもLogを受信していたのを修正
* layoutの操作中はlog,value,canvas,imageを再描画しないようにした

## [1.8.0] - 2024-08-29
### Added
* タイトルにhostname追加 (#241)
* webui自体ののping状態を表示 (#241)
### Changed
* ping緑色の閾値を10msから50msに変更 (#241)
* フォントをNoto Sans/Noto Monoに固定 (#264)
* ログを全レベル合計1000行ではなくレベル別に1000行保存するように変更 (#265)
* WebCFace Desktop でwebcface-serverのPATHを設定
### Fixed
* launcher Config のボタン内で改行されてたのを修正 (#265)
* サーバーが実行中でもrestartボタン表示
* LogCardがレベル切替時に画面更新されなかったバグを修正

## [1.7.0] - 2024-07-24
### Changed
* アイコン追加 (#236, #242)
* ValueCardのグラフを仕様変更 (#238)
    * v1.0.0以前でwebgl-plotを使っていた頃のコードを再度持ってきて、timechartからwebgl-plotに移行
    * グリッド表示追加
    * Canvas2Dと同様の操作ボタン追加
    * スクロール操作を改良
* Canvas2D,3Dでもスクロール時にページ自体のスクロールを禁止 (#238)
* LogCardを開いたり閉じたりするとログが消えるバグを修正 (#248)
* LogCardでログの表示をスクロールしている間はログの更新を止めるようにした (#248)
* ViewCardでtoggleInputがクリックできないバグを修正 (#249)
* WebUI ServerMode を「WebCFace Desktop」に名前変更 (機能はまだ何も変わっていない) (#236)
* Windows(x86), Mac(Universal) ビルドもここでリリースするようにした (#247)

## [1.6.0] - 2024-04-08
### Added
* Viewにinput要素を追加 (#180)

## [1.5.0] - 2024-03-16
### Added
* Canvas2DのonClick, textに対応 (#168,#170)
* Canvas2D,3Dをマウスやタッチ操作で拡大、移動できる機能
* Canvas3Dタッチ操作実装
* Canvas2D,3Dの操作説明ボタン、初期位置に戻すボタンなど

## [1.4.1] - 2024-03-08
### Changed
* Client.closeの動作の修正 (#164)
* Client.syncを呼ばないようにした

## [1.4.0] - 2024-02-15
### Added
* Canvas2D (#153)

## [1.3.2] - 2024-01-18
### Fixed
* Viewのbuttonの色がすべて緑になるバグを修正 (#135)
* リリースするdebパッケージ内のwebcface-webui-serverに実行権限追加

## [1.3.1] - 2024-01-17
### Changed
* LauncherConfigの変更 (#127)
    * Launcherの起動が無効のときSave & RestartボタンをSaveボタンにした
    * 設定を保存済みで変更していないときSave & Restartボタンを無効にしてわかりやすくした
    * 設定変更をキャンセルするボタン追加
    * コマンド並べ替え機能追加
* Export Configで保存するファイルの名前に自動で拡張子をつけるようにした (#127)
* 設定をAppDataに保存するときにフォルダを作成するようにした (#127)
* サーバーURLを複数表示できるようにした (#133)
* imageの受信処理の変更 (#130)
    * imageCardのリサイズ時に、受信する画像データもそのサイズに合わせるようにした
    * 画像の受信間隔を10fpsに固定
    * webpの画像がうまく受信できないのでjpegに変更
### Added
* 関数の実行結果表示欄に閉じるボタンを追加 (#129)
### Fixed
* RobotModelの座標変換を修正 (#128)

## [1.3.0] - 2024-01-15
### Added
* Serverモード (#112)
### Fixed
* 関数の実数引数に空文字列を受け付けないよう修正
* canvas3dのメニューでのアイコンがviewと同じになっていたのを変更

## [1.2.0] - 2024-01-10
### Added
* RobotModel, Canvas3Dを表示する機能を追加 (#121)
### Changed
* update webcface-js to 1.3.0
* jsファイルを複数に分割してビルドするようにした

## [1.1.0] - 2023-12-26
### Added
* 画像を表示する機能を追加
### Changed
* update webcface-js to 1.2.0

## [1.0.12] - 2023-12-23
### Changed
* update webcface-js to 1.1.1

## [1.0.11] - 2023-12-19
### Changed
* update webcface-js to 1.1.0 (#97)
* updated dependencies
### Fixed
* connectionInfoCardのoverflowを修正 (#98)

## [1.0.10] - 2023-12-01
### Changed
* 関数のoptionがセットされた引数で初期値を最初の選択肢にした (#80)
* updated dependencies

## [1.0.9] - 2023-12-01
### Fixed
* 起動時の cannot read properties of undefined エラーを修正 (#79)

## [1.0.8] - 2023-11-30
### Changed
* 新しく開いたカードが常に最前面になるようにzIndexを更新するようにした (#78)

## [1.0.7] - 2023-11-30
### Fixed
* メニューでLogとFunctionの表示条件が逆になっていたのを修正 (#72)
### Changed
* 各種データの画面更新を受信と非同期のインターバルでの処理にした (#73)
* ログの表示を1000行までにし、スクロールするとDOMに追加されるようにした (#73)
* update dependencies

## [1.0.6] - 2023-11-20
### Added
* webui自体のサーバーへの接続状態の表示を追加
### Fixed
* 関数やtextが多い時カードをはみ出して表示されるのを修正
### Changed
* value,viewをメニューでフォルダ分けして表示するようにした (#24)
* text, func, viewはデータがなければメニューに表示しないようにした (#63)
* textとconnectionInfoの表示更新タイミングの修正
* updated dependencies

## [1.0.5] - 2023-10-20
### Changed
* update webcface-js to 1.0.3

## [1.0.4] - 2023-10-14
### Fixed
* connectionInfo画面を開いていないときもping statusを受信するようにした (#36)
### Changed
* openedCardsがlocalStorageに保存されるようにした (#36)
* update webcface-js to 1.0.2
* updated dependencies

## [1.0.3] - 2023-10-06
### Fixed
* レイアウトが保存されなかったりするバグを修正 (#26)
### Changed
* react-grid-layoutからreact-grid-layout-nextを使うように変更
* updated dependencies

## [1.0.2] - 2023-10-03
### Fixed
* viewのbuttonの色が反映されないのを修正 (#21)
### Changed
* viewのtextにもtextColorが反映されるようにした (#21)

## [1.0.1] - 2023-09-29
### Fixed
* client名が`a`になってたのを空文字列に変更
* window.locationから7530以外のポートを検出するようにした (#7)
### Changed
* updated dependencies (#4 #5 #6)

## [1.0.0] - 2023-09-28

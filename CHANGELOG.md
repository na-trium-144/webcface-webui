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

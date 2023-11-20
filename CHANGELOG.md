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

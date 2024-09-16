# webcface-webui / webcface-desktop
[![release](https://img.shields.io/github/v/release/na-trium-144/webcface-webui)](https://github.com/na-trium-144/webcface-webui/releases)

UI Application for [WebCFace](https://github.com/na-trium-144/webcface).

## WebUI
* WebCFaceのフロントエンドとなるUIです。
* staticなhtmlにビルドし、webcface-serverをhtmlサーバーとしてブラウザーからアクセスして使います。
* webcface-serverをビルドする際mesonが自動ダウンロードしますが、個別にダウンロードしたい場合は[Releases](https://github.com/na-trium-144/webcface-webui/releases)の tar.gz アーカイブにビルド済みのhtmlファイルが入っています。

### Development

```bash
npm install
npm run dev
```

and open http://localhost:5173/

### Build

```bash
npm run build
```
* 環境変数`WEBUI_NO_SUFFIX`を1にするとpackage.jsonに書かれているバージョンが、そうでなければ`git describe --tags`の結果が Connection Info でバージョン情報として表示されます。

## Desktop

* Electronでビルドし、アプリケーションとして起動して使います。
* WebUIの機能に加え、webcface-serverを自動で起動し、またwebcface-launcherなどの設定と起動ができます。
* webcface-desktop単体は[Releases](https://github.com/na-trium-144/webcface-webui/releases)からzipファイル、tar.gzファイル、debパッケージでダウンロードできますが、これを起動するにはwebcface-serverなどを適切に配置する必要があります
	* [WebCFace](https://github.com/na-trium-144/webcface)のREADMEにしたがってダウンロード、インストールしたほうがかんたんです

### Development

```bash
npm install
npm run edev
```

### Build

```bash
tsc -p tsconfig.electron.json
env ELECTRON=1 vite build
electron-builder --publish never
```

* webcface-serverとwebcface-launcherをwebcface-desktopから見て ../bin/ の位置に、またWebUIをビルドしたdistディレクトリを ../share/webcface/dist/ または ../dist/ として置くとdesktopがserverを自動起動できるようになります。
	* Windowsの場合はwebcfaceのdllもbinに置いてください
	* Linuxの場合はlibwebcface.so.\*を ../lib/ に置いてください
	* MacOSの場合はwebcface-serverとlauncherとlibwebcface.\*.dylibを WebCFace Desktop.app/Contents/MacOS/ に、 distを WebCFace Desktop.app/Contents/dist/ に置いてください



# webcface-webui / webcface-desktop
[![release](https://img.shields.io/github/v/release/na-trium-144/webcface-webui)](https://github.com/na-trium-144/webcface-webui/releases)

UI Application for [WebCFace](https://github.com/na-trium-144/webcface).

## WebUI
* WebCFaceのフロントエンドとなるUIです。
* staticなhtmlにビルドし、webcface-serverをhtmlサーバーとしてブラウザーからアクセスして使います。
* WebCFaceのインストール時、またcmake時に自動でインストールされます。
	* 個別にダウンロードしたい場合は[Releases](https://github.com/na-trium-144/webcface-webui/releases)の tar.gz アーカイブ、または all.deb にビルド済みのhtmlファイルが入っています。

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

## Desktop

* Electronでビルドし、アプリケーションとして起動して使います。
* WebUIの機能に加え、webcface-serverを自動で起動し、またwebcface-launcherなどの設定と起動ができます。
* 個別にダウンロードしたい場合は[Releases](https://github.com/na-trium-144/webcface-webui/releases)のzipファイル(windows)、amd64,arm64,armhfのdebパッケージ(Ubuntu,Debian)、またはAppImage(linux)でダウンロードできます。

### Development

```bash
npm install
npm run edev
```

### Build

* ubuntu, mac
```bash
npm run ebuild
```

* windows
	* cannot create symbolic link エラーになる場合はwindowsの設定から開発者モードをon
```bash
npm run ebuild-win
```

## App name

OpenCode Mobile

## Subtitle

OpenCodeサーバー用モバイルクライアント

## Promotional text

スマートフォンでOpenCodeエージェントと対話。PCとiPhoneの間で会話を途切れずに引き継げます。

## Keywords

opencode, mobile, ai, agent, client, コード, 開発, サーバー, リモート

## Description

OpenCode Mobileなら、OpenCodeエージェントをiPhoneで使えます。コンピュータで動作しているOpenCodeサーバーにアプリを接続すれば、どこにいても自分のコードや開発ツールを使った作業を続けられます。

PCとスマートフォンをシームレスに行き来できます。デスクトップで始めたセッションをiPhoneで続けたり、モバイルで始めた会話をPCで再開したりできます。

（本アプリは独立したオープンソースのコミュニティプロジェクトです。公式アプリではなく、opencode.aiとは提携していません。）

主な機能：

◆ HTTPまたはHTTPSで任意のOpenCodeサーバーに接続。ローカルネットワーク、VPN、Tailscale経由のリモート接続に対応。
◆ 複数のサーバープロファイルを作成し、よく使うサーバーへ自動接続。
◆ QRコードのスキャンまたはリンクの貼り付けでOpenCode v2とペアリング。パスワード保護されたサーバーやOpenCode v1にも対応。
◆ アプリ内でサーバーを管理。下に引っ張って管理・更新するか、メニューを開いて操作できます。
◆ サーバーの状態を自動確認し、待機時間を徐々に延ばしながら再接続。
◆ パスワードはKeychainに安全に保存。
◆ システム設定に自動で合わせるライト／ダークテーマ。
◆ 入力モードを選択可能。Enterで改行、Shift+Enterでメッセージを送信。
◆ オープンソース

不具合の報告や機能のご提案はありますか？

GitHubでissueの報告、機能の提案、pull requestの送信を歓迎します。

GitHubリポジトリ：
https://github.com/bmpenuelas/opencode-mobile-client

クイックスタート：

本アプリを使うには、OpenCodeサーバーを起動しておく必要があります。

OpenCode Mobileは、コードと開発ツールがあるコンピュータ上で動作するOpenCode Webサーバーに接続するクライアントです。

► OpenCode v2

コンピュータで次の2つのコマンドを実行します：

opencode service set hostname 0.0.0.0

opencode pair

次にアプリでサーバーを追加し、QRコードをスキャンするかリンクを貼り付けます。リンクは1回のみ有効で、5分で期限切れになります。

opencode serveを直接実行している場合は、「Use URL and password instead」を選び、表示されたパスワードを入力してください。

► OpenCode v1

サーバーの追加時に「OpenCode v1 server」をオンにし、次のように起動します：

► 認証なし

opencode web --hostname 0.0.0.0 --port 4096

► 認証あり

信頼できるローカルネットワークの外部からサーバーにアクセスできる場合は、認証を有効にすることをおすすめします。

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

認証を有効にした場合、アプリのデフォルトユーザー名はopencodeです。

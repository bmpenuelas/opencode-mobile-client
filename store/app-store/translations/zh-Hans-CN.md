## App name

OpenCode Mobile

## Subtitle

OpenCode 服务器移动客户端

## Promotional text

用手机与 OpenCode 智能体协作，在电脑与 iPhone 之间无缝延续每一次对话。

## Keywords

opencode, mobile, ai, agent, client, 编程, 代码, 服务器, 远程

## Description

OpenCode Mobile 将你的 OpenCode 智能体带到 iPhone。将应用连接到电脑上运行的 OpenCode 服务器，无论身在何处，都能继续使用自己的代码和开发工具。

在电脑与手机之间无缝切换：在手机上接着处理电脑上开启的会话，或回到电脑继续手机上发起的对话。

（这是一个独立的开源社区项目，非官方应用，与 opencode.ai 没有关联。）

主要功能：

◆ 通过 HTTP 或 HTTPS 连接任意 OpenCode 服务器；支持局域网、VPN 或 Tailscale 远程访问。
◆ 创建多个服务器配置，并自动连接到常用服务器。
◆ 扫描二维码或粘贴链接即可与 OpenCode v2 配对，也支持受密码保护的服务器和 OpenCode v1。
◆ 在应用内管理服务器：下拉即可管理或刷新，也可以打开菜单操作。
◆ 自动检查服务器状态，并以逐步延长的间隔重新连接。
◆ 密码安全保存在 Keychain 中。
◆ 深色与浅色主题，自动跟随系统设置。
◆ 可选输入模式：Enter 换行，Shift+Enter 发送消息。
◆ 开源项目

发现问题，或有功能建议？

欢迎在 GitHub 提交 issue、提出建议或发送 pull request。

GitHub 仓库：
https://github.com/bmpenuelas/opencode-mobile-client

快速开始：

使用本应用前，需要先运行 OpenCode 服务器。

OpenCode Mobile 是一个客户端，用于连接运行在电脑上的 OpenCode Web 服务器；该电脑应具备你的代码和开发工具。

► OpenCode v2

在电脑上运行以下两条命令：

opencode service set hostname 0.0.0.0

opencode pair

然后在应用中添加服务器，并扫描二维码或粘贴链接。链接仅可使用一次，5 分钟后失效。

直接运行 opencode serve？请选择“改用 URL 和密码”，并输入它显示的密码。

► OpenCode v1

添加服务器时，请开启“OpenCode v1 服务器”，然后这样启动：

► 无需认证

opencode web --hostname 0.0.0.0 --port 4096

► 使用认证

如果服务器可从受信任局域网以外访问，建议启用认证。

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

启用认证后，应用默认用户名为 opencode。

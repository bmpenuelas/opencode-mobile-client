# Google Play Localized Metadata

# German (Germany) — de-DE

## App name

OpenCode Mobile

## Short description

Deine OpenCode-Agenten auch unterwegs im Chat

## Full description

Mit OpenCode Mobile hast du deine OpenCode-Agenten auch unterwegs dabei. Verbinde dein Smartphone mit dem OpenCode-Server auf deinem Computer und arbeite mit deinem Code und deinen Tools weiter – wo immer du gerade bist.

Wechsle nahtlos zwischen Computer und Smartphone: Setze Sitzungen fort, die du am Desktop begonnen hast, oder öffne mobile Unterhaltungen später wieder auf deinem Computer.

(Dies ist ein inoffizielles Open-Source-Community-Projekt und steht in keiner Verbindung zu opencode.ai.)

FUNKTIONEN:

◆ Verbindung mit jedem OpenCode-Server über HTTP oder HTTPS – im lokalen Netzwerk oder unterwegs über VPN bzw. Tailscale.
◆ Mehrere Serverprofile mit automatischer Verbindung zum bevorzugten Server.
◆ Mit OpenCode v2 koppeln: QR-Code scannen oder Link einfügen. Funktioniert auch mit passwortgeschützten Servern und OpenCode v1.
◆ Serververwaltung direkt in der App: herunterziehen, aktualisieren oder das Menü öffnen.
◆ Automatische Erreichbarkeitsprüfungen und Wiederverbindung mit zunehmenden Wartezeiten.
◆ Sichere Passwortspeicherung auf dem Gerät.
◆ Dunkles und helles Design mit automatischer Anpassung an die Systemeinstellung.
◆ Optionaler Eingabemodus: Enter fügt einen Zeilenumbruch ein, Shift+Enter sendet die Nachricht.
◆ OPEN SOURCE

Fehler entdeckt oder eine Idee zur Verbesserung?

Melde Probleme, schlage Funktionen vor oder reiche einen Pull Request auf GitHub ein:
https://github.com/bmpenuelas/opencode-mobile-client

SCHNELLSTART:

Für die Nutzung der App muss ein OpenCode-Server laufen.

OpenCode Mobile ist ein Client für den OpenCode-Webserver auf dem Computer, auf dem sich dein Code und deine Entwicklungswerkzeuge befinden.

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

Dann in der App einen Server hinzufügen und den QR-Code scannen oder einen Link einfügen. Links funktionieren einmal und laufen nach 5 Minuten ab.

Du startest opencode serve selbst? Wähle „Stattdessen URL und Passwort verwenden“ und gib das angezeigte Passwort ein.

OpenCode v1: Beim Hinzufügen des Servers „OpenCode-v1-Server“ aktivieren und ihn so starten:

Ohne Authentifizierung:
opencode web --hostname 0.0.0.0 --port 4096

Mit Authentifizierung (empfohlen):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

Bei aktivierter Authentifizierung ist in der App „opencode“ als Standardnutzername hinterlegt.

# Spanish (Spain) — es-ES

## App name

OpenCode Mobile

## Short description

Tus agentes de OpenCode contigo, estés donde estés

## Full description

Lleva tus agentes de OpenCode en el bolsillo. Conecta el móvil al servidor OpenCode que ejecutas en tu ordenador y sigue trabajando con tu código y tus herramientas desde cualquier lugar.

Pasa del ordenador al móvil sin perder el hilo: retoma sesiones que empezaste en el escritorio o vuelve al ordenador para continuar una conversación iniciada desde el teléfono.

(Proyecto comunitario de código abierto, no oficial y sin afiliación con opencode.ai.)

CARACTERÍSTICAS:

◆ Conexión a cualquier servidor OpenCode por HTTP o HTTPS, tanto en la red local como a distancia mediante VPN o Tailscale.
◆ Varios perfiles de servidor y conexión automática al que prefieras.
◆ Empareja con OpenCode v2 escaneando un código QR o pegando un enlace. También funciona con servidores protegidos por contraseña y con OpenCode v1.
◆ Gestiona los servidores desde la app: desliza hacia abajo, actualiza o abre el menú.
◆ Comprobaciones automáticas del estado del servidor y reconexión con esperas progresivas.
◆ Contraseñas guardadas de forma segura en el dispositivo.
◆ Tema oscuro y claro, adaptado automáticamente al sistema.
◆ Modo opcional para escribir con comodidad: Intro añade una línea y Mayús+Intro envía el mensaje.
◆ CÓDIGO ABIERTO

¿Has encontrado un error o tienes una idea?

Puedes informar de problemas, proponer mejoras o enviar pull requests en GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

PRIMEROS PASOS:

Necesitas tener un servidor OpenCode en ejecución para usar la app.

OpenCode Mobile es un cliente que se conecta al servidor web de OpenCode que se ejecuta en el ordenador donde tienes el código y las herramientas de desarrollo.

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

Después, en la app, añade un servidor y escanea el código QR o pega un enlace. Los enlaces funcionan una vez y caducan a los 5 minutos.

¿Ejecutas opencode serve directamente? Elige “Usar URL y contraseña” e introduce la contraseña que muestra.

OpenCode v1: Al añadir el servidor, activa “Servidor OpenCode v1” e inícialo así:

Sin autenticación:
opencode web --hostname 0.0.0.0 --port 4096

Con autenticación (recomendado):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

Cuando la autenticación está activada, el nombre de usuario predeterminado de la app es: opencode.

# French (France) — fr-FR

## App name

OpenCode Mobile

## Short description

Retrouvez vos agents OpenCode, même loin du bureau

## Full description

Gardez vos agents OpenCode à portée de main. Connectez votre téléphone au serveur OpenCode qui tourne sur votre ordinateur et poursuivez votre travail avec votre code et vos outils, où que vous soyez.

Passez simplement de l’ordinateur au mobile : reprenez une session commencée sur votre poste, ou retrouvez sur votre ordinateur une conversation démarrée sur votre téléphone.

(Projet communautaire open source, non officiel et sans affiliation avec opencode.ai.)

FONCTIONNALITÉS :

◆ Connexion à tout serveur OpenCode en HTTP ou HTTPS, sur le réseau local ou à distance via un VPN ou Tailscale.
◆ Plusieurs profils de serveur et connexion automatique à votre serveur favori.
◆ Appairage avec OpenCode v2 en scannant un code QR ou en collant un lien. Compatible aussi avec les serveurs protégés par mot de passe et OpenCode v1.
◆ Gestion des serveurs depuis l’app : tirez vers le bas, actualisez ou ouvrez le menu.
◆ Vérifications automatiques de l’état du serveur et reconnexion avec délais progressifs.
◆ Mots de passe stockés de façon sécurisée sur l’appareil.
◆ Thèmes clair et sombre, avec adaptation automatique au système.
◆ Mode de saisie optionnel : Entrée ajoute une ligne, Maj+Entrée envoie le message.
◆ OPEN SOURCE

Une anomalie ou une idée d’amélioration ?

Signalez un problème, proposez une fonctionnalité ou envoyez une pull request sur GitHub :
https://github.com/bmpenuelas/opencode-mobile-client

PRISE EN MAIN :

Un serveur OpenCode doit être en cours d’exécution pour utiliser l’app.

OpenCode Mobile est un client qui se connecte au serveur web OpenCode lancé sur l’ordinateur où se trouvent votre code et vos outils de développement.

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

Ensuite, dans l’app, ajoutez un serveur, puis scannez le code QR ou collez un lien. Les liens fonctionnent une fois et expirent après 5 minutes.

Vous lancez opencode serve directement ? Choisissez « Utiliser l’URL et le mot de passe » et entrez le mot de passe affiché.

OpenCode v1: En ajoutant le serveur, activez « Serveur OpenCode v1 », puis démarrez-le ainsi :

Sans authentification :
opencode web --hostname 0.0.0.0 --port 4096

Avec authentification (recommandé) :
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

Lorsque l’authentification est activée, le nom d’utilisateur par défaut dans l’app est : opencode.

# Hindi (India) — hi-IN

## App name

OpenCode Mobile

## Short description

अपने OpenCode एजेंट्स से कहीं भी चैट करें

## Full description

अपने OpenCode एजेंट्स को अपने साथ रखें। फोन को अपने कंप्यूटर पर चल रहे OpenCode सर्वर से जोड़ें और अपने कोड व टूल्स के साथ काम करना कहीं से भी जारी रखें।

कंप्यूटर और फोन के बीच बिना रुकावट काम करें: डेस्कटॉप पर शुरू किया गया सेशन मोबाइल पर आगे बढ़ाएँ या फोन पर शुरू हुई बातचीत कंप्यूटर पर फिर से खोलें।

(यह एक स्वतंत्र, ओपन-सोर्स कम्युनिटी प्रोजेक्ट है। यह आधिकारिक नहीं है और opencode.ai से संबद्ध नहीं है।)

खास सुविधाएँ:

◆ HTTP या HTTPS के ज़रिए किसी भी OpenCode सर्वर से कनेक्ट करें—लोकल नेटवर्क पर या दूर से VPN / Tailscale के माध्यम से।
◆ कई सर्वर प्रोफ़ाइल बनाएँ और पसंदीदा सर्वर से अपने-आप कनेक्ट हों।
◆ QR कोड स्कैन करके या लिंक पेस्ट करके OpenCode v2 से पेयर करें। पासवर्ड से सुरक्षित सर्वर और OpenCode v1 के साथ भी काम करता है।
◆ ऐप से ही सर्वर मैनेज करें: नीचे खींचें, रिफ़्रेश करें या मेनू खोलें।
◆ सर्वर की उपलब्धता की अपने-आप जाँच और बढ़ते अंतराल के साथ दोबारा कनेक्ट करने की सुविधा।
◆ पासवर्ड डिवाइस पर सुरक्षित रूप से स्टोर होते हैं।
◆ सिस्टम के अनुसार अपने-आप बदलने वाली डार्क और लाइट थीम।
◆ वैकल्पिक टाइपिंग मोड: Enter से नई लाइन और Shift+Enter से संदेश भेजें।
◆ ओपन सोर्स

कोई समस्या मिली या सुधार का सुझाव है?

GitHub पर issue दर्ज करें, फीचर सुझाएँ या pull request भेजें:
https://github.com/bmpenuelas/opencode-mobile-client

शुरू करने के लिए:

ऐप इस्तेमाल करने के लिए OpenCode सर्वर का चलना ज़रूरी है।

OpenCode Mobile एक क्लाइंट है जो उस कंप्यूटर पर चल रहे OpenCode वेब सर्वर से जुड़ता है जहाँ आपका कोड और डेवलपमेंट टूल्स मौजूद हैं।

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

फिर ऐप में सर्वर जोड़ें और QR कोड स्कैन करें या लिंक पेस्ट करें। लिंक एक बार चलते हैं और 5 मिनट में समाप्त हो जाते हैं।

क्या आप opencode serve सीधे चला रहे हैं? “इसके बजाय URL और पासवर्ड का उपयोग करें” चुनें और दिखाया गया पासवर्ड डालें।

OpenCode v1: सर्वर जोड़ते समय “OpenCode v1 सर्वर” चालू करें और इसे ऐसे शुरू करें:

बिना ऑथेंटिकेशन:
opencode web --hostname 0.0.0.0 --port 4096

ऑथेंटिकेशन के साथ (सुझाया गया):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

ऑथेंटिकेशन चालू होने पर ऐप में डिफ़ॉल्ट यूज़रनेम opencode होता है।

# Portuguese (Portugal) — pt-PT

## App name

OpenCode Mobile

## Short description

Os seus agentes OpenCode, sempre consigo

## Full description

Leve os seus agentes OpenCode consigo. Ligue o telemóvel ao servidor OpenCode que está a correr no seu computador e continue a trabalhar com o seu código e as suas ferramentas onde quer que esteja.

Alterne sem esforço entre computador e telemóvel: retome sessões iniciadas no ambiente de trabalho ou continue no computador uma conversa começada no telemóvel.

(Este é um projeto comunitário de código aberto, não oficial e sem afiliação à opencode.ai.)

FUNCIONALIDADES:

◆ Ligação a qualquer servidor OpenCode através de HTTP ou HTTPS, na rede local ou à distância por VPN ou Tailscale.
◆ Vários perfis de servidor e ligação automática ao servidor preferido.
◆ Emparelhe com o OpenCode v2 lendo um código QR ou colando uma ligação. Também funciona com servidores protegidos por palavra-passe e com o OpenCode v1.
◆ Gestão de servidores na própria app: puxe para baixo, atualize ou abra o menu.
◆ Verificações automáticas do servidor e nova ligação com intervalos progressivos.
◆ Palavras-passe guardadas em segurança no dispositivo.
◆ Tema claro e escuro, com adaptação automática às definições do sistema.
◆ Modo de escrita opcional: Enter insere uma nova linha e Shift+Enter envia a mensagem.
◆ CÓDIGO ABERTO

Encontrou um problema ou tem uma sugestão?

Reporte issues, proponha funcionalidades ou envie pull requests no GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

COMEÇAR RAPIDAMENTE:

É necessário ter um servidor OpenCode a correr para utilizar a app.

O OpenCode Mobile é um cliente que se liga ao servidor Web OpenCode em execução no computador onde tem o código e as ferramentas de desenvolvimento.

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

Depois, na app, adicione um servidor e leia o código QR ou cole uma ligação. As ligações funcionam uma vez e expiram ao fim de 5 minutos.

Executa o opencode serve diretamente? Escolha “Usar URL e senha” e introduza a palavra-passe apresentada.

OpenCode v1: Ao adicionar o servidor, ative “Servidor OpenCode v1” e inicie-o assim:

Sem autenticação:
opencode web --hostname 0.0.0.0 --port 4096

Com autenticação (recomendado):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

Com a autenticação ativa, o nome de utilizador predefinido na app é opencode.

# Russian (Russia) — ru-RU

## App name

OpenCode Mobile

## Short description

Общайтесь с агентами OpenCode где угодно

## Full description

Ваши агенты OpenCode всегда под рукой. Подключите телефон к серверу OpenCode, работающему на компьютере, и продолжайте работать с кодом и инструментами где бы вы ни находились.

Легко переключайтесь между компьютером и телефоном: продолжайте сессии, начатые на рабочем столе, или возвращайтесь к мобильному диалогу с компьютера.

(Это независимый открытый проект сообщества. Он не является официальным приложением и не связан с opencode.ai.)

ВОЗМОЖНОСТИ:

◆ Подключение к любому серверу OpenCode по HTTP или HTTPS — в локальной сети или удалённо через VPN либо Tailscale.
◆ Несколько профилей серверов и автоматическое подключение к выбранному серверу.
◆ Сопряжение с OpenCode v2 по QR-коду или ссылке. Также работает с серверами, защищёнными паролем, и с OpenCode v1.
◆ Управление серверами прямо в приложении: потяните вниз, обновите или откройте меню.
◆ Автоматическая проверка доступности сервера и повторное подключение с увеличивающимися интервалами.
◆ Безопасное хранение паролей на устройстве.
◆ Светлая и тёмная темы с автоматической подстройкой под систему.
◆ Дополнительный режим ввода: Enter вставляет новую строку, Shift+Enter отправляет сообщение.
◆ ОТКРЫТЫЙ ИСХОДНЫЙ КОД

Нашли ошибку или хотите предложить улучшение?

Сообщайте о проблемах, предлагайте функции и отправляйте pull request на GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

БЫСТРЫЙ СТАРТ:

Для работы приложения нужен запущенный сервер OpenCode.

OpenCode Mobile — это клиент, который подключается к веб-серверу OpenCode на компьютере, где находятся ваш код и инструменты разработки.

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

Затем добавьте сервер в приложении и отсканируйте QR-код или вставьте ссылку. Ссылки одноразовые и действуют 5 минут.

Запускаете opencode serve напрямую? Выберите «Использовать URL и пароль» и введите показанный пароль.

OpenCode v1: При добавлении сервера включите «Сервер OpenCode v1» и запустите его так:

Без аутентификации:
opencode web --hostname 0.0.0.0 --port 4096

С аутентификацией (рекомендуется):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

Когда аутентификация включена, имя пользователя по умолчанию в приложении — opencode.

# Chinese (Simplified, China) — zh-Hans-CN

## App name

OpenCode Mobile

## Short description

随时随地与 OpenCode 智能体协作

## Full description

把 OpenCode 智能体带在身边。将手机连接到电脑上运行的 OpenCode 服务器，无论身在何处，都能继续使用自己的代码和开发工具。

在电脑与手机之间无缝切换：在手机上接着处理电脑上开启的会话，或回到电脑继续手机上发起的对话。

（这是一个独立的开源社区项目，非官方应用，与 opencode.ai 没有关联。）

主要功能：

◆ 通过 HTTP 或 HTTPS 连接任意 OpenCode 服务器；支持局域网、VPN 或 Tailscale 远程访问。
◆ 创建多个服务器配置，并自动连接到常用服务器。
◆ 扫描二维码或粘贴链接即可与 OpenCode v2 配对，也支持受密码保护的服务器和 OpenCode v1。
◆ 在应用内管理服务器：下拉即可管理或刷新，也可以打开菜单操作。
◆ 自动检查服务器状态，并以逐步延长的间隔重新连接。
◆ 密码安全保存在设备上。
◆ 深色与浅色主题，自动跟随系统设置。
◆ 可选输入模式：Enter 换行，Shift+Enter 发送消息。
◆ 开源项目

发现问题，或有功能建议？

欢迎在 GitHub 提交 issue、提出建议或发送 pull request：
https://github.com/bmpenuelas/opencode-mobile-client

快速开始：

使用本应用前，需要先运行 OpenCode 服务器。

OpenCode Mobile 是一个客户端，用于连接运行在电脑上的 OpenCode Web 服务器；该电脑应具备你的代码和开发工具。

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

然后在应用中添加服务器，并扫描二维码或粘贴链接。链接仅可使用一次，5 分钟后失效。

直接运行 opencode serve？请选择“改用 URL 和密码”，并输入它显示的密码。

OpenCode v1: 添加服务器时，请开启“OpenCode v1 服务器”，然后这样启动：

无需认证：
opencode web --hostname 0.0.0.0 --port 4096

使用认证（推荐）：
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

启用认证后，应用默认用户名为 opencode。

# Japanese (Japan) — ja-JP

## App name

OpenCode Mobile

## Short description

どこでもOpenCodeエージェントと会話

## Full description

OpenCode Mobileなら、OpenCodeエージェントをスマートフォンで使えます。コンピュータで動作しているOpenCodeサーバーに接続すれば、どこにいても自分のコードや開発ツールを使った作業を続けられます。

PCとスマートフォンをシームレスに行き来できます。デスクトップで始めたセッションをスマートフォンで続けたり、モバイルで始めた会話をPCで再開したりできます。

（本アプリは独立したオープンソースのコミュニティプロジェクトです。公式アプリではなく、opencode.aiとは提携していません。）

主な機能：

◆ HTTPまたはHTTPSで任意のOpenCodeサーバーに接続。ローカルネットワーク、VPN、Tailscale経由のリモート接続に対応。
◆ 複数のサーバープロファイルを作成し、よく使うサーバーへ自動接続。
◆ QRコードのスキャンまたはリンクの貼り付けでOpenCode v2とペアリング。パスワード保護されたサーバーやOpenCode v1にも対応。
◆ アプリ内でサーバーを管理。下に引っ張って管理・更新するか、メニューを開いて操作できます。
◆ サーバーの状態を自動確認し、待機時間を徐々に延ばしながら再接続。
◆ パスワードはAndroidの安全なストレージに保存。
◆ システム設定に自動で合わせるライト／ダークテーマ。
◆ 入力モードを選択可能。Enterで改行、Shift+Enterでメッセージを送信。
◆ オープンソース

不具合の報告や機能のご提案はありますか？

GitHubでissueの報告、機能の提案、pull requestの送信を歓迎します：
https://github.com/bmpenuelas/opencode-mobile-client

クイックスタート：

本アプリを使うには、OpenCodeサーバーを起動しておく必要があります。

OpenCode Mobileは、コードと開発ツールがあるコンピュータ上で動作するOpenCode Webサーバーに接続するクライアントです。

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

次にアプリでサーバーを追加し、QRコードをスキャンするかリンクを貼り付けます。リンクは1回のみ有効で、5分で期限切れになります。

opencode serveを直接実行している場合は、「Use URL and password instead」を選び、表示されたパスワードを入力してください。

OpenCode v1: サーバーの追加時に「OpenCode v1 server」をオンにし、次のように起動します：

認証なし：
opencode web --hostname 0.0.0.0 --port 4096

認証あり（推奨）：
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

認証を有効にした場合、アプリのデフォルトユーザー名はopencodeです。

# Korean (South Korea) — ko-KR

## App name

OpenCode Mobile

## Short description

어디서나 OpenCode 에이전트와 대화

## Full description

OpenCode Mobile로 언제 어디서나 OpenCode 에이전트를 사용할 수 있습니다. 컴퓨터에서 실행 중인 OpenCode 서버에 앱을 연결하고, 내 코드와 개발 도구로 작업을 이어가세요.

컴퓨터와 휴대폰을 자유롭게 오가며 작업할 수 있습니다. 데스크톱에서 시작한 세션을 휴대폰에서 계속하거나, 모바일에서 시작한 대화를 컴퓨터에서 다시 열 수 있습니다.

(이 앱은 독립적인 오픈 소스 커뮤니티 프로젝트입니다. 공식 앱이 아니며 opencode.ai와 관련이 없습니다.)

주요 기능:

◆ HTTP 또는 HTTPS로 모든 OpenCode 서버에 연결. 로컬 네트워크는 물론 VPN 또는 Tailscale을 통한 원격 연결도 지원합니다.
◆ 여러 서버 프로필을 만들고 자주 쓰는 서버에 자동으로 연결합니다.
◆ QR 코드를 스캔하거나 링크를 붙여넣어 OpenCode v2와 페어링합니다. 비밀번호로 보호된 서버와 OpenCode v1도 지원합니다.
◆ 앱 안에서 서버를 관리하세요. 아래로 당겨 관리하거나 새로 고치고, 메뉴를 열어 추가 작업을 할 수 있습니다.
◆ 서버 상태를 자동으로 확인하고, 대기 시간을 늘려 가며 재연결합니다.
◆ 비밀번호는 Android의 보안 저장소에 안전하게 저장됩니다.
◆ 시스템 설정을 따르는 라이트 및 다크 테마.
◆ 입력 모드 선택 가능: Enter는 줄 바꿈, Shift+Enter는 메시지 전송.
◆ 오픈 소스

문제를 발견했거나 개선 아이디어가 있나요?

GitHub에서 issue를 등록하고, 기능을 제안하거나 pull request를 보내 주세요:
https://github.com/bmpenuelas/opencode-mobile-client

빠른 시작:

앱을 사용하려면 OpenCode 서버가 실행 중이어야 합니다.

OpenCode Mobile은 코드와 개발 도구가 있는 컴퓨터에서 실행되는 OpenCode 웹 서버에 연결하는 클라이언트입니다.

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

그런 다음 앱에서 서버를 추가하고 QR 코드를 스캔하거나 링크를 붙여넣으세요. 링크는 한 번만 사용할 수 있으며 5분 후 만료됩니다.

opencode serve를 직접 실행하나요? "Use URL and password instead"를 선택하고 표시된 비밀번호를 입력하세요.

OpenCode v1: 서버를 추가할 때 "OpenCode v1 server"를 켜고 다음과 같이 시작하세요:

인증 없이 사용:
opencode web --hostname 0.0.0.0 --port 4096

인증 사용(권장):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

인증을 켜면 앱의 기본 사용자 이름은 opencode입니다.

# Italian (Italy) — it-IT

## App name

OpenCode Mobile

## Short description

I tuoi agenti OpenCode, sempre con te

## Full description

OpenCode Mobile porta i tuoi agenti OpenCode sul telefono. Collega l’app al server OpenCode in esecuzione sul tuo computer e continua a lavorare con il tuo codice e i tuoi strumenti ovunque ti trovi.

Passa dal computer al telefono senza perdere il filo: riprendi sul cellulare le sessioni iniziate sul desktop oppure torna al computer per continuare una conversazione avviata dal telefono.

(Questo è un progetto indipendente, open source e gestito dalla community. Non è un’app ufficiale e non è affiliato a opencode.ai.)

FUNZIONALITÀ:

◆ Connessione a qualsiasi server OpenCode tramite HTTP o HTTPS, sulla rete locale o da remoto via VPN o Tailscale.
◆ Più profili server e connessione automatica al server preferito.
◆ Associa OpenCode v2 scansionando un codice QR o incollando un link. Funziona anche con server protetti da password e con OpenCode v1.
◆ Gestisci i server direttamente dall’app: tira verso il basso, aggiorna oppure apri il menu.
◆ Controlli automatici dello stato del server e riconnessione con intervalli progressivi.
◆ Password archiviate in modo sicuro nella memoria protetta di Android.
◆ Tema chiaro e scuro con adattamento automatico alle impostazioni di sistema.
◆ Modalità di scrittura opzionale: Invio inserisce una nuova riga, Maiusc+Invio invia il messaggio.
◆ OPEN SOURCE

Hai trovato un problema o hai un’idea per migliorare l’app?

Segnala un issue, proponi una funzione o invia una pull request su GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

PER INIZIARE:

Per usare l’app è necessario avere un server OpenCode in esecuzione.

OpenCode Mobile è un client che si collega al server web OpenCode in esecuzione sul computer in cui si trovano il tuo codice e gli strumenti di sviluppo.

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

Poi, nell’app, aggiungi un server e scansiona il codice QR o incolla un link. I link funzionano una sola volta e scadono dopo 5 minuti.

Esegui direttamente opencode serve? Scegli "Use URL and password instead" e inserisci la password mostrata.

OpenCode v1: Quando aggiungi il server, attiva "OpenCode v1 server" e avvialo così:

Senza autenticazione:
opencode web --hostname 0.0.0.0 --port 4096

Con autenticazione (consigliato):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

Quando l’autenticazione è attiva, il nome utente predefinito nell’app è opencode.

# Turkish (Turkey) — tr-TR

## App name

OpenCode Mobile

## Short description

OpenCode ajanlarınız her yerde yanınızda

## Full description

OpenCode Mobile, OpenCode ajanlarınızı telefonunuza taşır. Uygulamayı bilgisayarınızda çalışan OpenCode sunucusuna bağlayın; nerede olursanız olun kodunuz ve geliştirme araçlarınızla çalışmaya devam edin.

Bilgisayar ve telefon arasında akıcı şekilde geçiş yapın: masaüstünde başlattığınız oturumları mobilde sürdürün ya da mobilde başlattığınız bir konuşmaya bilgisayarınızdan geri dönün.

(Bu bağımsız, açık kaynaklı bir topluluk projesidir. Resmî bir uygulama değildir ve opencode.ai ile bağlantısı yoktur.)

ÖZELLİKLER:

◆ Herhangi bir OpenCode sunucusuna HTTP veya HTTPS ile bağlanın; yerel ağda ya da VPN veya Tailscale üzerinden uzaktan çalışın.
◆ Birden fazla sunucu profili oluşturun ve tercih ettiğiniz sunucuya otomatik bağlanın.
◆ QR kodu tarayarak veya bağlantı yapıştırarak OpenCode v2 ile eşleştirin. Parola korumalı sunucularla ve OpenCode v1 ile de çalışır.
◆ Sunucuları uygulama içinden yönetin: aşağı çekin, yenileyin veya menüyü açın.
◆ Otomatik sunucu durum kontrolleri ve giderek artan bekleme süreleriyle yeniden bağlanma.
◆ Parolalar Android’in güvenli depolama alanında korunur.
◆ Sistem ayarlarına otomatik uyum sağlayan açık ve koyu tema.
◆ İsteğe bağlı yazım modu: Enter yeni satır ekler, Shift+Enter mesajı gönderir.
◆ AÇIK KAYNAK

Bir sorun mu buldunuz, yoksa geliştirme fikriniz mi var?

GitHub’da issue bildirebilir, özellik önerebilir veya pull request gönderebilirsiniz:
https://github.com/bmpenuelas/opencode-mobile-client

HIZLI BAŞLANGIÇ:

Uygulamayı kullanmak için çalışan bir OpenCode sunucusu gerekir.

OpenCode Mobile, kodunuzun ve geliştirme araçlarınızın bulunduğu bilgisayarda çalışan OpenCode web sunucusuna bağlanan bir istemcidir.

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

Ardından uygulamada bir sunucu ekleyip QR kodu tarayın veya bir bağlantı yapıştırın. Bağlantılar bir kez çalışır ve 5 dakika sonra geçerliliğini yitirir.

opencode serve komutunu doğrudan mı çalıştırıyorsunuz? "Use URL and password instead" seçeneğini seçip gösterilen parolayı girin.

OpenCode v1: Sunucuyu eklerken "OpenCode v1 server" seçeneğini açın ve şöyle başlatın:

Kimlik doğrulama olmadan:
opencode web --hostname 0.0.0.0 --port 4096

Kimlik doğrulama ile (önerilir):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

Kimlik doğrulama etkin olduğunda uygulamadaki varsayılan kullanıcı adı opencode olur.

# Indonesian (Indonesia) — id-ID

## App name

OpenCode Mobile

## Short description

Agen OpenCode Anda, ke mana pun Anda pergi

## Full description

OpenCode Mobile membawa agen OpenCode ke ponsel Anda. Hubungkan aplikasi ke server OpenCode yang berjalan di komputer, lalu lanjutkan bekerja dengan kode dan alat pengembangan Anda dari mana saja.

Beralih dengan mulus antara komputer dan ponsel: lanjutkan sesi yang dimulai di desktop pada ponsel, atau buka kembali percakapan yang dimulai di ponsel dari komputer.

(Ini adalah proyek komunitas sumber terbuka yang independen. Bukan aplikasi resmi dan tidak berafiliasi dengan opencode.ai.)

FITUR:

◆ Terhubung ke server OpenCode mana pun melalui HTTP atau HTTPS, di jaringan lokal maupun dari jauh lewat VPN atau Tailscale.
◆ Buat beberapa profil server dan terhubung otomatis ke server pilihan Anda.
◆ Pasangkan dengan OpenCode v2 dengan memindai kode QR atau menempelkan tautan. Juga berfungsi dengan server yang dilindungi kata sandi dan OpenCode v1.
◆ Kelola server dari dalam aplikasi: tarik ke bawah, segarkan, atau buka menu.
◆ Pemeriksaan kondisi server otomatis dan penyambungan kembali dengan jeda yang makin panjang.
◆ Kata sandi disimpan dengan aman di penyimpanan aman Android.
◆ Tema terang dan gelap yang otomatis mengikuti pengaturan sistem.
◆ Mode pengetikan opsional: Enter membuat baris baru, Shift+Enter mengirim pesan.
◆ SUMBER TERBUKA

Menemukan masalah atau punya ide untuk perbaikan?

Laporkan issue, usulkan fitur, atau kirim pull request di GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

MULAI CEPAT:

Server OpenCode harus berjalan untuk menggunakan aplikasi ini.

OpenCode Mobile adalah klien yang terhubung ke server web OpenCode yang berjalan di komputer tempat kode dan alat pengembangan Anda berada.

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

Lalu di aplikasi, tambahkan server dan pindai kode QR atau tempelkan tautan. Tautan hanya bisa dipakai sekali dan kedaluwarsa setelah 5 menit.

Menjalankan opencode serve secara langsung? Pilih "Use URL and password instead" dan masukkan kata sandi yang ditampilkan.

OpenCode v1: Saat menambahkan server, aktifkan "OpenCode v1 server" dan jalankan seperti ini:

Tanpa autentikasi:
opencode web --hostname 0.0.0.0 --port 4096

Dengan autentikasi (disarankan):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

Saat autentikasi aktif, nama pengguna default di aplikasi adalah opencode.

# Thai (Thailand) — th-TH

## App name

OpenCode Mobile

## Short description

คุยกับเอเจนต์ OpenCode ได้ทุกที่

## Full description

OpenCode Mobile พาเอเจนต์ OpenCode ของคุณมาไว้บนโทรศัพท์ เชื่อมแอปกับเซิร์ฟเวอร์ OpenCode ที่ทำงานอยู่บนคอมพิวเตอร์ แล้วทำงานกับโค้ดและเครื่องมือพัฒนาของคุณต่อได้จากทุกที่

สลับระหว่างคอมพิวเตอร์กับโทรศัพท์ได้อย่างต่อเนื่อง: ทำเซสชันที่เริ่มบนเดสก์ท็อปต่อบนมือถือ หรือกลับมาเปิดบทสนทนาที่เริ่มจากมือถือบนคอมพิวเตอร์

（นี่คือโครงการชุมชนโอเพนซอร์สอิสระ ไม่ใช่แอปอย่างเป็นทางการ และไม่มีความเกี่ยวข้องกับ opencode.ai）

คุณสมบัติเด่น:

◆ เชื่อมต่อกับเซิร์ฟเวอร์ OpenCode ใดก็ได้ผ่าน HTTP หรือ HTTPS ทั้งบนเครือข่ายภายในและจากระยะไกลผ่าน VPN หรือ Tailscale
◆ สร้างโปรไฟล์เซิร์ฟเวอร์ได้หลายรายการ และเชื่อมต่อกับเซิร์ฟเวอร์ที่ต้องการโดยอัตโนมัติ
◆ จับคู่กับ OpenCode v2 ด้วยการสแกนคิวอาร์โค้ดหรือวางลิงก์ และยังใช้กับเซิร์ฟเวอร์ที่ป้องกันด้วยรหัสผ่านและ OpenCode v1 ได้
◆ จัดการเซิร์ฟเวอร์ในแอปได้เลย: ดึงลงเพื่อจัดการหรือรีเฟรช หรือเปิดเมนูเพื่อดำเนินการ
◆ ตรวจสอบสถานะเซิร์ฟเวอร์อัตโนมัติ และเชื่อมต่อใหม่ด้วยช่วงเวลารอที่ค่อย ๆ เพิ่มขึ้น
◆ เก็บรหัสผ่านไว้อย่างปลอดภัยในพื้นที่จัดเก็บที่ปลอดภัยของ Android
◆ ธีมสว่างและมืดที่ปรับตามการตั้งค่าระบบโดยอัตโนมัติ
◆ โหมดพิมพ์เสริม: Enter ขึ้นบรรทัดใหม่, Shift+Enter ส่งข้อความ
◆ โอเพนซอร์ส

พบปัญหาหรือมีไอเดียอยากเสนอไหม?

แจ้ง issue เสนอฟีเจอร์ หรือส่ง pull request ได้บน GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

เริ่มต้นอย่างรวดเร็ว:

ต้องมีเซิร์ฟเวอร์ OpenCode ที่กำลังทำงานอยู่จึงจะใช้แอปได้

OpenCode Mobile เป็นไคลเอนต์ที่เชื่อมต่อกับ OpenCode Web server ที่ทำงานอยู่บนคอมพิวเตอร์ซึ่งมีโค้ดและเครื่องมือพัฒนาของคุณ

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

จากนั้นเพิ่มเซิร์ฟเวอร์ในแอป แล้วสแกนคิวอาร์โค้ดหรือวางลิงก์ ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 5 นาที

หากเรียกใช้ opencode serve โดยตรง ให้เลือก "Use URL and password instead" แล้วป้อนรหัสผ่านที่แสดง

OpenCode v1: เมื่อเพิ่มเซิร์ฟเวอร์ ให้เปิด "OpenCode v1 server" แล้วเริ่มเซิร์ฟเวอร์ดังนี้:

ไม่ใช้การยืนยันตัวตน:
opencode web --hostname 0.0.0.0 --port 4096

ใช้การยืนยันตัวตน (แนะนำ):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

เมื่อเปิดใช้การยืนยันตัวตน ชื่อผู้ใช้เริ่มต้นในแอปคือ opencode

# Vietnamese (Vietnam) — vi-VN

## App name

OpenCode Mobile

## Short description

Trò chuyện với tác tử OpenCode mọi lúc mọi nơi

## Full description

OpenCode Mobile đưa các tác tử OpenCode lên điện thoại của bạn. Kết nối ứng dụng với máy chủ OpenCode đang chạy trên máy tính, rồi tiếp tục làm việc với mã và công cụ phát triển của bạn ở bất cứ đâu.

Chuyển đổi liền mạch giữa máy tính và điện thoại: tiếp tục trên điện thoại một phiên đã bắt đầu ở máy tính, hoặc mở lại trên máy tính cuộc trò chuyện đã bắt đầu trên điện thoại.

(Đây là dự án cộng đồng mã nguồn mở độc lập. Ứng dụng không chính thức và không liên kết với opencode.ai.)

TÍNH NĂNG:

◆ Kết nối với mọi máy chủ OpenCode qua HTTP hoặc HTTPS, trong mạng cục bộ hoặc từ xa qua VPN hay Tailscale.
◆ Tạo nhiều cấu hình máy chủ và tự động kết nối tới máy chủ bạn ưu tiên.
◆ Ghép nối với OpenCode v2 bằng cách quét mã QR hoặc dán liên kết. Cũng hoạt động với máy chủ có mật khẩu và OpenCode v1.
◆ Quản lý máy chủ ngay trong ứng dụng: kéo xuống, làm mới hoặc mở menu.
◆ Tự động kiểm tra trạng thái máy chủ và kết nối lại với thời gian chờ tăng dần.
◆ Mật khẩu được lưu an toàn trong bộ nhớ bảo mật của Android.
◆ Giao diện sáng và tối tự động theo cài đặt hệ thống.
◆ Chế độ nhập tùy chọn: Enter tạo dòng mới, Shift+Enter gửi tin nhắn.
◆ MÃ NGUỒN MỞ

Phát hiện lỗi hoặc có ý tưởng cải thiện?

Hãy báo issue, đề xuất tính năng hoặc gửi pull request trên GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

BẮT ĐẦU NHANH:

Bạn cần có máy chủ OpenCode đang chạy để sử dụng ứng dụng.

OpenCode Mobile là ứng dụng khách kết nối tới máy chủ web OpenCode đang chạy trên máy tính chứa mã và công cụ phát triển của bạn.

OpenCode v2:
opencode service set hostname 0.0.0.0
opencode pair

Sau đó, trong ứng dụng, hãy thêm máy chủ rồi quét mã QR hoặc dán liên kết. Liên kết chỉ dùng được một lần và hết hạn sau 5 phút.

Bạn chạy trực tiếp opencode serve? Hãy chọn "Use URL and password instead" và nhập mật khẩu được hiển thị.

OpenCode v1: Khi thêm máy chủ, hãy bật "OpenCode v1 server" và khởi động như sau:

Không xác thực:
opencode web --hostname 0.0.0.0 --port 4096

Có xác thực (khuyến nghị):
export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096

Khi bật xác thực, tên người dùng mặc định trong ứng dụng là opencode.

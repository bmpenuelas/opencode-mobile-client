## App name

OpenCode Mobile

## Subtitle

OpenCode sunucuları için mobil istemci

## Promotional text

Telefonunuzdan OpenCode ajanlarınızla sohbet edin; konuşmalarınıza bilgisayar ve iPhone arasında kesintisiz devam edin.

## Keywords

opencode, mobile, ai, agent, client, kodlama, kod, sunucu, uzaktan

## Description

OpenCode Mobile, OpenCode ajanlarınızı iPhone’a taşır. Uygulamayı bilgisayarınızda çalışan OpenCode sunucusuna bağlayın; nerede olursanız olun kodunuz ve geliştirme araçlarınızla çalışmaya devam edin.

Bilgisayar ve telefon arasında akıcı şekilde geçiş yapın: masaüstünde başlattığınız oturumları iPhone’da sürdürün ya da mobilde başlattığınız bir konuşmaya bilgisayarınızdan geri dönün.

(Bu bağımsız, açık kaynaklı bir topluluk projesidir. Resmî bir uygulama değildir ve opencode.ai ile bağlantısı yoktur.)

ÖZELLİKLER:

◆ Herhangi bir OpenCode sunucusuna HTTP veya HTTPS ile bağlanın; yerel ağda ya da VPN veya Tailscale üzerinden uzaktan çalışın.
◆ Birden fazla sunucu profili oluşturun ve tercih ettiğiniz sunucuya otomatik bağlanın.
◆ QR kodu tarayarak veya bağlantı yapıştırarak OpenCode v2 ile eşleştirin. Parola korumalı sunucularla ve OpenCode v1 ile de çalışır.
◆ Sunucuları uygulama içinden yönetin: aşağı çekin, yenileyin veya menüyü açın.
◆ Otomatik sunucu durum kontrolleri ve giderek artan bekleme süreleriyle yeniden bağlanma.
◆ Parolalar Keychain’de güvenle saklanır.
◆ Sistem ayarlarına otomatik uyum sağlayan açık ve koyu tema.
◆ İsteğe bağlı yazım modu: Enter yeni satır ekler, Shift+Enter mesajı gönderir.
◆ AÇIK KAYNAK

Bir sorun mu buldunuz, yoksa geliştirme fikriniz mi var?

GitHub’da issue bildirebilir, özellik önerebilir veya pull request gönderebilirsiniz.

GitHub deposu:
https://github.com/bmpenuelas/opencode-mobile-client

HIZLI BAŞLANGIÇ:

Uygulamayı kullanmak için çalışan bir OpenCode sunucusu gerekir.

OpenCode Mobile, kodunuzun ve geliştirme araçlarınızın bulunduğu bilgisayarda çalışan OpenCode web sunucusuna bağlanan bir istemcidir.

► OpenCode v2

Bilgisayarınızda şu iki komutu çalıştırın:

opencode service set hostname 0.0.0.0

opencode pair

Ardından uygulamada bir sunucu ekleyip QR kodu tarayın veya bir bağlantı yapıştırın. Bağlantılar bir kez çalışır ve 5 dakika sonra geçerliliğini yitirir.

opencode serve komutunu doğrudan mı çalıştırıyorsunuz? "Use URL and password instead" seçeneğini seçip gösterilen parolayı girin.

► OpenCode v1

Sunucuyu eklerken "OpenCode v1 server" seçeneğini açın ve şöyle başlatın:

► Kimlik doğrulama olmadan

opencode web --hostname 0.0.0.0 --port 4096

► Kimlik doğrulama ile

Sunucu güvenilir yerel ağınızın dışından erişilebiliyorsa kimlik doğrulama kullanmanız önerilir.

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

Kimlik doğrulama etkin olduğunda uygulamadaki varsayılan kullanıcı adı opencode olur.

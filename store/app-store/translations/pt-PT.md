## App name

OpenCode Mobile

## Subtitle

Cliente móvel para servidores OpenCode

## Promotional text

Fale com os seus agentes OpenCode no telemóvel e continue as conversas sem interrupções entre computador e iPhone.

## Keywords

opencode, mobile, ai, agent, client, programação, código, servidor, remoto

## Description

OpenCode Mobile leva os seus agentes OpenCode para o iPhone. Ligue a app ao servidor OpenCode que está a correr no seu computador e continue a trabalhar com o seu código e as suas ferramentas onde quer que esteja.

Alterne sem esforço entre computador e telemóvel: retome sessões iniciadas no ambiente de trabalho ou continue no computador uma conversa começada no telemóvel.

(Este é um projeto comunitário de código aberto, não oficial e sem afiliação à opencode.ai.)

FUNCIONALIDADES:

◆ Ligação a qualquer servidor OpenCode através de HTTP ou HTTPS, na rede local ou à distância por VPN ou Tailscale.
◆ Vários perfis de servidor e ligação automática ao servidor preferido.
◆ Emparelhe com o OpenCode v2 lendo um código QR ou colando uma ligação. Também funciona com servidores protegidos por palavra-passe e com o OpenCode v1.
◆ Gestão de servidores na própria app: puxe para baixo, atualize ou abra o menu.
◆ Verificações automáticas do servidor e nova ligação com intervalos progressivos.
◆ Palavras-passe guardadas em segurança no Porta-chaves.
◆ Tema claro e escuro, com adaptação automática às definições do sistema.
◆ Modo de escrita opcional: Enter insere uma nova linha e Shift+Enter envia a mensagem.
◆ CÓDIGO ABERTO

Encontrou um problema ou tem uma sugestão?

Reporte issues, proponha funcionalidades ou envie pull requests no GitHub.

Repositório GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

COMEÇAR RAPIDAMENTE:

É necessário ter um servidor OpenCode a correr para utilizar a app.

O OpenCode Mobile é um cliente que se liga ao servidor Web OpenCode em execução no computador onde tem o código e as ferramentas de desenvolvimento.

► OpenCode v2

Execute estes dois comandos no computador:

opencode service set hostname 0.0.0.0

opencode pair

Depois, na app, adicione um servidor e leia o código QR ou cole uma ligação. As ligações funcionam uma vez e expiram ao fim de 5 minutos.

Executa o opencode serve diretamente? Escolha “Usar URL e senha” e introduza a palavra-passe apresentada.

► OpenCode v1

Ao adicionar o servidor, ative “Servidor OpenCode v1” e inicie-o assim:

► Sem autenticação

opencode web --hostname 0.0.0.0 --port 4096

► Com autenticação

Recomenda-se a autenticação se o servidor estiver acessível fora da sua rede local de confiança.

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

Com a autenticação ativa, o nome de utilizador predefinido na app é opencode.

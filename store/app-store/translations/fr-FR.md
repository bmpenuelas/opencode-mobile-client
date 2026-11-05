## App name

OpenCode Mobile

## Subtitle

Client mobile pour serveurs OpenCode

## Promotional text

Gardez vos agents OpenCode avec vous et poursuivez vos conversations entre votre ordinateur et votre iPhone.

## Keywords

opencode, mobile, ai, agent, client, programmation, code, serveur, distant

## Description

OpenCode Mobile met vos agents OpenCode dans votre poche. Connectez l’app au serveur OpenCode qui tourne sur votre ordinateur et poursuivez votre travail avec votre code et vos outils, où que vous soyez.

Passez simplement de l’ordinateur au mobile : reprenez une session commencée sur votre poste, ou retrouvez sur votre ordinateur une conversation démarrée sur votre téléphone.

(Projet communautaire open source, non officiel et sans affiliation avec opencode.ai.)

FONCTIONNALITÉS :

◆ Connexion à tout serveur OpenCode en HTTP ou HTTPS, sur le réseau local ou à distance via un VPN ou Tailscale.
◆ Plusieurs profils de serveur et connexion automatique à votre serveur favori.
◆ Appairage avec OpenCode v2 en scannant un code QR ou en collant un lien. Compatible aussi avec les serveurs protégés par mot de passe et OpenCode v1.
◆ Gestion des serveurs depuis l’app : tirez vers le bas, actualisez ou ouvrez le menu.
◆ Vérifications automatiques de l’état du serveur et reconnexion avec délais progressifs.
◆ Mots de passe stockés de façon sécurisée dans le trousseau.
◆ Thèmes clair et sombre, avec adaptation automatique au système.
◆ Mode de saisie optionnel : Entrée ajoute une ligne, Maj+Entrée envoie le message.
◆ OPEN SOURCE

Une anomalie ou une idée d’amélioration ?

Signalez un problème, proposez une fonctionnalité ou envoyez une pull request sur GitHub.

Dépôt GitHub :
https://github.com/bmpenuelas/opencode-mobile-client

PRISE EN MAIN :

Un serveur OpenCode doit être en cours d’exécution pour utiliser l’app.

OpenCode Mobile est un client qui se connecte au serveur web OpenCode lancé sur l’ordinateur où se trouvent votre code et vos outils de développement.

► OpenCode v2

Exécutez ces deux commandes sur votre ordinateur :

opencode service set hostname 0.0.0.0

opencode pair

Ensuite, dans l’app, ajoutez un serveur, puis scannez le code QR ou collez un lien. Les liens fonctionnent une fois et expirent après 5 minutes.

Vous lancez opencode serve directement ? Choisissez « Utiliser l’URL et le mot de passe » et entrez le mot de passe affiché.

► OpenCode v1

En ajoutant le serveur, activez « Serveur OpenCode v1 », puis démarrez-le ainsi :

► Sans authentification

opencode web --hostname 0.0.0.0 --port 4096

► Avec authentification

L’authentification est recommandée si votre serveur est accessible au-delà de votre réseau local de confiance.

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

Lorsque l’authentification est activée, le nom d’utilisateur par défaut dans l’app est : opencode.

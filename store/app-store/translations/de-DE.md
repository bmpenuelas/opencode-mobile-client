## App name

OpenCode Mobile

## Subtitle

Dein mobiler Client für OpenCode-Server

## Promotional text

Arbeite unterwegs mit deinen OpenCode-Agenten weiter – Sitzungen nahtlos zwischen Computer und iPhone fortsetzen.

## Keywords

opencode, mobile, ai, agent, client, programmieren, code, server, fernzugriff

## Description

OpenCode Mobile bringt deine OpenCode-Agenten aufs iPhone. Verbinde dich mit dem OpenCode-Server auf deinem Computer und arbeite mit deinem Code und deinen Tools weiter, egal wo du bist.

Wechsle ohne Unterbrechung zwischen Computer und Mobilgerät: Setze Desktop-Sitzungen auf dem iPhone fort oder öffne mobile Unterhaltungen später wieder auf dem Computer.

(Dies ist ein inoffizielles Open-Source-Community-Projekt und steht in keiner Verbindung zu opencode.ai.)

FUNKTIONEN:

◆ Verbindung mit jedem OpenCode-Server per HTTP oder HTTPS – im lokalen Netzwerk oder unterwegs über VPN bzw. Tailscale.
◆ Mehrere Serverprofile mit automatischer Verbindung zum bevorzugten Server.
◆ Mit OpenCode v2 koppeln: QR-Code scannen oder Link einfügen. Funktioniert auch mit passwortgeschützten Servern und OpenCode v1.
◆ Serververwaltung direkt in der App: herunterziehen, aktualisieren oder das Menü öffnen.
◆ Automatische Erreichbarkeitsprüfungen und Wiederverbindung mit zunehmenden Wartezeiten.
◆ Sichere Passwortspeicherung im Schlüsselbund.
◆ Dunkles und helles Design mit automatischer Anpassung an die Systemeinstellung.
◆ Optionaler Eingabemodus: Enter fügt einen Zeilenumbruch ein, Shift+Enter sendet die Nachricht.
◆ OPEN SOURCE

Fehler entdeckt oder eine Idee zur Verbesserung?

Melde Probleme, schlage Funktionen vor oder reiche einen Pull Request auf GitHub ein.

GitHub-Repository:
https://github.com/bmpenuelas/opencode-mobile-client

SCHNELLSTART:

Für die Nutzung der App muss ein OpenCode-Server laufen.

OpenCode Mobile ist ein Client für den OpenCode-Webserver auf dem Computer, auf dem sich dein Code und deine Entwicklungswerkzeuge befinden.

► OpenCode v2

Diese beiden Befehle auf dem Computer ausführen:

opencode service set hostname 0.0.0.0

opencode pair

Dann in der App einen Server hinzufügen und den QR-Code scannen oder einen Link einfügen. Links funktionieren einmal und laufen nach 5 Minuten ab.

Du startest opencode serve selbst? Wähle „Stattdessen URL und Passwort verwenden“ und gib das angezeigte Passwort ein.

► OpenCode v1

Beim Hinzufügen des Servers „OpenCode-v1-Server“ aktivieren und ihn so starten:

► Ohne Authentifizierung

opencode web --hostname 0.0.0.0 --port 4096

► Mit Authentifizierung

Eine Authentifizierung wird empfohlen, sobald dein Server außerhalb deines vertrauenswürdigen lokalen Netzwerks erreichbar ist.

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

Bei aktivierter Authentifizierung ist in der App „opencode“ als Standardnutzername hinterlegt.

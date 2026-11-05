## App name

OpenCode Mobile

## Subtitle

Client mobile per server OpenCode

## Promotional text

Parla con i tuoi agenti OpenCode dal telefono e continua ogni conversazione senza interruzioni tra computer e iPhone.

## Keywords

opencode, mobile, ai, agent, client, programmazione, codice, server, remoto

## Description

OpenCode Mobile porta i tuoi agenti OpenCode su iPhone. Collega l’app al server OpenCode in esecuzione sul tuo computer e continua a lavorare con il tuo codice e i tuoi strumenti ovunque ti trovi.

Passa dal computer al telefono senza perdere il filo: riprendi su iPhone le sessioni iniziate sul desktop oppure torna al computer per continuare una conversazione avviata dal telefono.

(Questo è un progetto indipendente, open source e gestito dalla community. Non è un’app ufficiale e non è affiliato a opencode.ai.)

FUNZIONALITÀ:

◆ Connessione a qualsiasi server OpenCode tramite HTTP o HTTPS, sulla rete locale o da remoto via VPN o Tailscale.
◆ Più profili server e connessione automatica al server preferito.
◆ Associa OpenCode v2 scansionando un codice QR o incollando un link. Funziona anche con server protetti da password e con OpenCode v1.
◆ Gestisci i server direttamente dall’app: tira verso il basso, aggiorna oppure apri il menu.
◆ Controlli automatici dello stato del server e riconnessione con intervalli progressivi.
◆ Password archiviate in modo sicuro nel portachiavi.
◆ Tema chiaro e scuro con adattamento automatico alle impostazioni di sistema.
◆ Modalità di scrittura opzionale: Invio inserisce una nuova riga, Maiusc+Invio invia il messaggio.
◆ OPEN SOURCE

Hai trovato un problema o hai un’idea per migliorare l’app?

Segnala un issue, proponi una funzione o invia una pull request su GitHub.

Repository GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

PER INIZIARE:

Per usare l’app è necessario avere un server OpenCode in esecuzione.

OpenCode Mobile è un client che si collega al server web OpenCode in esecuzione sul computer in cui si trovano il tuo codice e gli strumenti di sviluppo.

► OpenCode v2

Esegui questi due comandi sul computer:

opencode service set hostname 0.0.0.0

opencode pair

Poi, nell’app, aggiungi un server e scansiona il codice QR o incolla un link. I link funzionano una sola volta e scadono dopo 5 minuti.

Esegui direttamente opencode serve? Scegli "Use URL and password instead" e inserisci la password mostrata.

► OpenCode v1

Quando aggiungi il server, attiva "OpenCode v1 server" e avvialo così:

► Senza autenticazione

opencode web --hostname 0.0.0.0 --port 4096

► Con autenticazione

L’autenticazione è consigliata se il server è raggiungibile al di fuori della tua rete locale attendibile.

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

Quando l’autenticazione è attiva, il nome utente predefinito nell’app è opencode.

## App name

OpenCode Mobile

## Subtitle

Cliente móvil para servidores OpenCode

## Promotional text

Habla con tu agente de OpenCode desde el móvil y continúa tus conversaciones sin perder el hilo.

## Keywords

opencode, mobile, ai, agent, client, programación, código, servidor, remoto

## Description

OpenCode Mobile lleva tus agentes de OpenCode al iPhone. Conecta la app al servidor OpenCode que ejecutas en tu ordenador y sigue trabajando con tu código y tus herramientas desde cualquier lugar.

Pasa del ordenador al móvil sin perder el hilo: retoma sesiones que empezaste en el escritorio o vuelve al ordenador para continuar una conversación iniciada desde el teléfono.

(Proyecto comunitario de código abierto, no oficial y sin afiliación con opencode.ai.)

CARACTERÍSTICAS:

◆ Conexión a cualquier servidor OpenCode por HTTP o HTTPS, tanto en la red local como a distancia mediante VPN o Tailscale.
◆ Varios perfiles de servidor y conexión automática al que prefieras.
◆ Empareja con OpenCode v2 escaneando un código QR o pegando un enlace. También funciona con servidores protegidos por contraseña y con OpenCode v1.
◆ Gestiona los servidores desde la app: desliza hacia abajo, actualiza o abre el menú.
◆ Comprobaciones automáticas del estado del servidor y reconexión con esperas progresivas.
◆ Contraseñas guardadas de forma segura en el llavero.
◆ Tema oscuro y claro, adaptado automáticamente al sistema.
◆ Modo opcional para escribir con comodidad: Intro añade una línea y Mayús+Intro envía el mensaje.
◆ CÓDIGO ABIERTO

¿Has encontrado un error o tienes una idea?

Puedes informar de problemas, proponer mejoras o enviar pull requests en GitHub.

Repositorio en GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

PRIMEROS PASOS:

Necesitas tener un servidor OpenCode en ejecución para usar la app.

OpenCode Mobile es un cliente que se conecta al servidor web de OpenCode que se ejecuta en el ordenador donde tienes el código y las herramientas de desarrollo.

► OpenCode v2

Ejecuta estos dos comandos en tu ordenador:

opencode service set hostname 0.0.0.0

opencode pair

Después, en la app, añade un servidor y escanea el código QR o pega un enlace. Los enlaces funcionan una vez y caducan a los 5 minutos.

¿Ejecutas opencode serve directamente? Elige “Usar URL y contraseña” e introduce la contraseña que muestra.

► OpenCode v1

Al añadir el servidor, activa “Servidor OpenCode v1” e inícialo así:

► Sin autenticación

opencode web --hostname 0.0.0.0 --port 4096

► Con autenticación

Se recomienda activar la autenticación si se puede acceder al servidor desde fuera de tu red local de confianza.

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

Cuando la autenticación está activada, el nombre de usuario predeterminado de la app es: opencode.

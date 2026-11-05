## App name

OpenCode Mobile

## Subtitle

OpenCode 서버용 모바일 클라이언트

## Promotional text

휴대폰에서 OpenCode 에이전트와 대화하고, 컴퓨터와 iPhone 사이에서 대화를 자연스럽게 이어가세요.

## Keywords

opencode, mobile, ai, agent, client, 코드, 개발, 서버, 원격

## Description

OpenCode Mobile로 iPhone에서도 OpenCode 에이전트를 사용할 수 있습니다. 컴퓨터에서 실행 중인 OpenCode 서버에 앱을 연결하고, 어디서든 내 코드와 개발 도구로 작업을 이어가세요.

컴퓨터와 휴대폰을 자유롭게 오가며 작업할 수 있습니다. 데스크톱에서 시작한 세션을 iPhone에서 계속하거나, 모바일에서 시작한 대화를 컴퓨터에서 다시 열 수 있습니다.

(이 앱은 독립적인 오픈 소스 커뮤니티 프로젝트입니다. 공식 앱이 아니며 opencode.ai와 관련이 없습니다.)

주요 기능:

◆ HTTP 또는 HTTPS로 모든 OpenCode 서버에 연결. 로컬 네트워크는 물론 VPN 또는 Tailscale을 통한 원격 연결도 지원합니다.
◆ 여러 서버 프로필을 만들고 자주 쓰는 서버에 자동으로 연결합니다.
◆ QR 코드를 스캔하거나 링크를 붙여넣어 OpenCode v2와 페어링합니다. 비밀번호로 보호된 서버와 OpenCode v1도 지원합니다.
◆ 앱 안에서 서버를 관리하세요. 아래로 당겨 관리하거나 새로 고치고, 메뉴를 열어 추가 작업을 할 수 있습니다.
◆ 서버 상태를 자동으로 확인하고, 대기 시간을 늘려 가며 재연결합니다.
◆ 비밀번호는 Keychain에 안전하게 저장됩니다.
◆ 시스템 설정을 따르는 라이트 및 다크 테마.
◆ 입력 모드 선택 가능: Enter는 줄 바꿈, Shift+Enter는 메시지 전송.
◆ 오픈 소스

문제를 발견했거나 개선 아이디어가 있나요?

GitHub에서 issue를 등록하고, 기능을 제안하거나 pull request를 보내 주세요.

GitHub 저장소:
https://github.com/bmpenuelas/opencode-mobile-client

빠른 시작:

앱을 사용하려면 OpenCode 서버가 실행 중이어야 합니다.

OpenCode Mobile은 코드와 개발 도구가 있는 컴퓨터에서 실행되는 OpenCode 웹 서버에 연결하는 클라이언트입니다.

► OpenCode v2

컴퓨터에서 다음 두 명령을 실행하세요:

opencode service set hostname 0.0.0.0

opencode pair

그런 다음 앱에서 서버를 추가하고 QR 코드를 스캔하거나 링크를 붙여넣으세요. 링크는 한 번만 사용할 수 있으며 5분 후 만료됩니다.

opencode serve를 직접 실행하나요? "Use URL and password instead"를 선택하고 표시된 비밀번호를 입력하세요.

► OpenCode v1

서버를 추가할 때 "OpenCode v1 server"를 켜고 다음과 같이 시작하세요:

► 인증 없이 사용

opencode web --hostname 0.0.0.0 --port 4096

► 인증 사용

신뢰할 수 있는 로컬 네트워크 밖에서도 서버에 접근할 수 있다면 인증 사용을 권장합니다.

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

인증을 켜면 앱의 기본 사용자 이름은 opencode입니다.

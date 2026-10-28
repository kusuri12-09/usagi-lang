# Usagi Discord Bot

Discord 슬래시 명령으로 우사기어를 번역하고, 서버의 일반 메시지에 우사기어로 답글을 답니다. Discord 메시지 조회·전송 MCP 서버는 포함하지 않습니다.

## 실행

Cloudflare Worker는 `npx wrangler deploy`로 배포합니다. `DISCORD_BOT_TOKEN`은 `npx wrangler secret put DISCORD_BOT_TOKEN`으로 저장합니다. Worker의 Durable Object가 Discord Gateway에 연결되며, 연결이 끊기면 예약 실행으로 다시 시작합니다. 상태는 `https://usagi-lang-discord-bot.kusuri12.workers.dev/health`에서 확인할 수 있습니다. Worker는 `usagi-lang-mcp` Worker를 서비스 바인딩으로 호출합니다.

아래는 로컬 실행 방법입니다. Worker 봇과 동시에 켜지 마세요. 메시지에 중복 답글을 달 수 있습니다.

Node.js 24 이상에서 `npm install`, `npm run build`를 실행하세요. `.env.example`을 `.env`로 복사하고 `DISCORD_BOT_TOKEN`을 넣습니다. 루트의 `mcp/`에서 `npm run start:http`로 우사기 MCP를 먼저 실행한 뒤 이 폴더에서 `npm start`로 봇을 켭니다. MCP 주소가 다르면 `.env`의 `USAGI_MCP_URL`을 바꿉니다.

봇이 시작되면 전역 `/translate` 슬래시 명령을 등록합니다. Discord 서버에 봇이 설치돼 있어야 사용할 수 있습니다. 메시지 내용은 읽지 않으므로 Message Content Intent는 필요하지 않습니다. 봇에는 채널 보기, 메시지 기록 읽기, 메시지 보내기 권한이 필요합니다.

- `/translate text:<말>`: 사전 규칙에 맞춰 우사기어로 번역합니다. 사전에 없는 말은 랜덤 우사기어를 생성합니다.
- 일반 메시지: 봇이 보낸 메시지를 제외한 서버의 모든 일반 메시지에 랜덤 우사기어로 답글을 답니다. `/reply` 명령이나 입력 인자는 없습니다.

로컬 모드에서는 봇 프로세스와 우사기 MCP가 실행 중이어야 명령에 응답합니다.

# Usagi Lang

- `app/`: 웹 번역기. `node app/server.mjs`로 실행하고 `http://127.0.0.1:4173/`에서 엽니다.
- `mcp/`: 우사기어 MCP 서버. `cd mcp`, `npm install`, `npm run build`, `npm run start:http`로 실행합니다.
- `discord-bot/`: Discord 슬래시 명령 봇. 설정과 실행법은 해당 폴더의 README를 참고하세요.
- `dictionary.json`: 웹 앱과 우사기어 MCP가 함께 읽는 사전입니다.
- `repeated-sounds.json`: 웹 앱과 MCP가 함께 읽는 랜덤 반복형 소리 후보입니다.

## 공개 주소

- 웹 번역기: https://kusuri12-09.github.io/usagi-lang/
- MCP: https://usagi-lang.kusuri12.workers.dev/mcp
- Discord 봇 상태: https://usagi-lang.kusuri12.workers.dev/health

`mcp/wrangler.jsonc`로 MCP와 Discord 봇을 한 Worker에 배포합니다. Discord 봇은 Durable Object에서 Gateway 연결을 유지하며, 분당 한 번 예약 실행으로 끊긴 연결을 다시 시작합니다. 로컬 Discord 봇과 Worker를 동시에 실행하면 메시지에 중복 답글을 달 수 있습니다.

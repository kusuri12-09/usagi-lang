# Usagi MCP

한국어 문장이나 상황에 맞는 우사기어를 사전에서 고르는 로컬 MCP 서버입니다. 자유 생성 표현에는 사전적 뜻을 붙이지 않습니다.

## 실행

Node.js 20 이상이 필요합니다.

```sh
npm install
npm run build
npm start
```

MCP 클라이언트에는 `node` 명령과 이 프로젝트의 `dist/mcp/src/index.js` 절대 경로를 stdio 서버로 등록하세요. 개발 중에는 `npm run dev`로 실행할 수 있습니다. 테스트는 `npm test`입니다.

Cloudflare Worker는 `npx wrangler deploy`로 배포합니다. 공개 MCP 주소는 `https://usagi-lang.kusuri12.workers.dev/mcp`입니다. 같은 Worker에서 Discord 봇도 실행합니다.

원격 MCP 클라이언트용 HTTP 서버는 `npm run start:http`로 실행합니다. 로컬 주소는 `http://127.0.0.1:3000/mcp`이며, 공개 터널을 붙일 때는 `PUBLIC_HOST`에 터널의 호스트 이름을 설정합니다.

Cloudflare Quick Tunnel은 `cloudflared tunnel --url http://127.0.0.1:3000`으로 열 수 있습니다. 출력된 `https://...trycloudflare.com`의 호스트 이름을 `PUBLIC_HOST`로 설정해 HTTP 서버를 실행한 뒤, MCP 클라이언트에는 `https://...trycloudflare.com/mcp`를 등록합니다. Quick Tunnel 주소는 터널을 다시 시작하면 바뀝니다.

## Tools

- `translate_to_usagi`: `{ "text": "케이크 맛있다!" }` → `{ "original": "케이크 맛있다!", "translated": "우아", "tag": "tasty", "matched": true, "generated": false }`
- `generate_usagi_reaction`: `{ "situation": "birthday" }` 또는 `{ "emotion": "happy" }` → 사전 표현. 둘 중 하나만 입력합니다.
- `generate_random_usagi`: `{}` → 뜻이 없는 새 표현과 `generated: true`. 같은 소리의 반복은 붙이고, 다른 소리 사이에는 쉼표·느낌표·띄어쓰기·말줄임표 등을 넣습니다.
- `generate_usagi_reply`: `{ "text": "푸루루!!!" }` → 지정된 우사기어면 허용된 문장부호까지 입력한 그대로, 그 밖에는 랜덤 답변. 특수문자는 비교에서 무시하고, 허용되지 않은 특수문자는 답변에서 제거합니다.

상황 값은 루트의 `../dictionary.json`에 있는 `tags`를 사용합니다. 감정은 `happy`, `excited`, `surprised`, `confident`, `sad`, `angry`, `neutral`을 받습니다. 사전에 없는 감정이나 번역 규칙에 맞지 않는 문장은 랜덤 표현을 반환하며, `matched: false`, `generated: true`, `tag: null`로 구분합니다. 이 결과에는 사전적 의미가 없습니다.

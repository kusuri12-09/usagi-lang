import { DurableObject } from 'cloudflare:workers';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

async function usagi(env, name, args, field) {
  const client = new Client({ name: 'usagi-discord-worker', version: '0.1.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL('https://mcp.internal/mcp'), {
      fetch: (input, init) => env.MCP.fetch(input, init),
    }));
    const response = await client.callTool({ name, arguments: args });
    const value = response.structuredContent?.[field];
    if (response.isError || typeof value !== 'string') throw new Error(`MCP returned no ${field}`);
    return value;
  } finally {
    await client.close();
  }
}

export class DiscordGateway extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.socket = null;
    this.ready = false;
    this.heartbeat = null;
    this.sequence = null;
    this.acknowledged = true;
  }

  async fetch(request) {
    if (new URL(request.url).pathname === '/ensure') this.ensureConnected();
    return Response.json({ connected: this.ready });
  }

  ensureConnected() {
    if (!this.env.DISCORD_BOT_TOKEN || this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;
    const socket = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
    this.socket = socket;
    socket.addEventListener('message', event => {
      this.ctx.waitUntil(this.onPacket(socket, JSON.parse(event.data)).catch(error => console.error('Discord packet failed:', error)));
    });
    socket.addEventListener('close', () => this.disconnected(socket));
    socket.addEventListener('error', () => this.disconnected(socket));
  }

  disconnected(socket) {
    if (this.socket !== socket) return;
    this.socket = null;
    this.ready = false;
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
    this.sequence = null;
  }

  async onPacket(socket, packet) {
    if (this.socket !== socket) return;
    if (packet.s !== null) this.sequence = packet.s;
    if (packet.op === 10) {
      this.acknowledged = true;
      this.heartbeat = setInterval(() => {
        if (!this.acknowledged) return socket.close();
        this.acknowledged = false;
        socket.send(JSON.stringify({ op: 1, d: this.sequence }));
      }, packet.d.heartbeat_interval);
      socket.send(JSON.stringify({ op: 2, d: {
        token: this.env.DISCORD_BOT_TOKEN,
        intents: 513,
        properties: { os: 'cloudflare', browser: 'usagi-worker', device: 'usagi-worker' },
      } }));
    } else if (packet.op === 11) {
      this.acknowledged = true;
    } else if (packet.op === 1) {
      socket.send(JSON.stringify({ op: 1, d: this.sequence }));
    } else if (packet.op === 7 || packet.op === 9) {
      socket.close();
    } else if (packet.op === 0 && packet.t === 'READY') {
      this.ready = true;
    } else if (packet.op === 0 && packet.t === 'MESSAGE_CREATE') {
      await this.reply(packet.d);
    } else if (packet.op === 0 && packet.t === 'INTERACTION_CREATE') {
      await this.translate(packet.d);
    }
  }

  async reply(message) {
    if (!message.guild_id || message.author?.bot || message.webhook_id) return;
    const content = await usagi(this.env, 'generate_random_usagi', {}, 'expression');
    const response = await fetch(`https://discord.com/api/v10/channels/${message.channel_id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${this.env.DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, message_reference: { message_id: message.id, channel_id: message.channel_id, guild_id: message.guild_id, fail_if_not_exists: false }, allowed_mentions: { parse: [], replied_user: false } }),
    });
    if (!response.ok) throw new Error(`Discord reply failed: ${response.status}`);
  }

  async translate(interaction) {
    if (interaction.data?.name !== 'translate') return;
    const callback = `https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`;
    const deferred = await fetch(callback, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 5 }) });
    if (!deferred.ok) throw new Error(`Discord defer failed: ${deferred.status}`);
    let content;
    try {
      const text = interaction.data.options?.find(option => option.name === 'text')?.value;
      if (typeof text !== 'string') throw new Error('Missing translate text');
      content = await usagi(this.env, 'translate_to_usagi', { text }, 'translated');
    } catch (error) {
      console.error('Usagi translation failed:', error);
      content = '하아? 잠시 후 다시 말 걸어 줘.';
    }
    const response = await fetch(`https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
    });
    if (!response.ok) throw new Error(`Discord translation response failed: ${response.status}`);
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if ((path === '/start' || path === '/self-test') && request.method === 'POST') {
      if (request.headers.get('Authorization') !== `Bearer ${env.DISCORD_BOT_TOKEN}`) return new Response('Unauthorized', { status: 401 });
      if (path === '/self-test') return Response.json({ translated: await usagi(env, 'translate_to_usagi', { text: '맛있어' }, 'translated'), reply: await usagi(env, 'generate_random_usagi', {}, 'expression') });
      return env.GATEWAY.getByName('usagi').fetch('https://internal/ensure');
    }
    if (path !== '/health') return new Response('Not found', { status: 404 });
    const stub = env.GATEWAY.getByName('usagi');
    return stub.fetch('https://internal/health');
  },
  async scheduled(_event, env) {
    const stub = env.GATEWAY.getByName('usagi');
    await stub.fetch('https://internal/ensure');
  },
};

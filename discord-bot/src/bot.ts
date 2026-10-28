import { Client, Events, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';
import { replyWithMcp, translateWithMcp } from './usagi.js';

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) throw new Error('DISCORD_BOT_TOKEN is not set');

const commands = [
  new SlashCommandBuilder()
    .setName('translate')
    .setDescription('한국어를 우사기어로 번역해요')
    .addStringOption(option => option.setName('text').setDescription('번역할 말').setRequired(true).setMaxLength(500)),
];

const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

bot.once(Events.ClientReady, async () => {
  try {
    if (!bot.application || !bot.user) throw new Error('Discord bot is not ready');
    await bot.application.commands.set(commands);
    console.log(`Usagi slash commands ready as ${bot.user.tag}`);
  } catch (error) {
    console.error('Could not register slash commands:', error);
    bot.destroy();
    process.exitCode = 1;
  }
});

bot.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'translate') return;
  try {
    await interaction.deferReply();
    const text = interaction.options.getString('text', true);
    const response = await translateWithMcp(text);
    await interaction.editReply({
      content: response,
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    console.error('Usagi command failed:', error);
    if (interaction.deferred) await interaction.editReply('하아? 잠시 후 다시 말 걸어 줘.').catch(console.error);
  }
});

bot.on(Events.MessageCreate, async message => {
  if (!message.inGuild() || message.author.bot || message.webhookId) return;
  try {
    await message.reply({ content: await replyWithMcp(), allowedMentions: { parse: [], repliedUser: false } });
  } catch (error) {
    console.error('Usagi reply failed:', error);
  }
});

await bot.login(token);

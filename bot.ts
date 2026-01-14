import { Bot, Context, session, SessionFlavor } from 'grammy';
import { SessionData } from './types';
import { Keyboards } from './keyboards';
import { quranService } from './quran-service';
import * as dotenv from "dotenv";

dotenv.config();

export type MyContext = Context & SessionFlavor<SessionData>;

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("XATO: TELEGRAM_BOT_TOKEN environment variable topilmadi!");
}

export const bot = new Bot<MyContext>(token);

// Sessiya boshqaruvi
bot.use(session({ initial: (): SessionData => ({ language: 'uz' }) }));

bot.catch((err) => {
  console.error(`❌ Botda xatolik yuz berdi:`, err.error);
});

// --- BUYRUQLAR ---
bot.command('start', async (ctx) => {
  await ctx.reply(
    "<b>Assalomu alaykum!</b> Qur'on botiga xush kelibsiz.\n\n" +
    "Suralarni o'qish va tinglash uchun quyidagi menyudan foydalaning.",
    { reply_markup: Keyboards.mainMenu(), parse_mode: 'HTML' }
  );
});

// --- CALLBACK QUERY ISHLOVCHILARI ---
bot.callbackQuery('list_surahs', async (ctx) => {
  const surahs = await quranService.getSurahs();
  await ctx.editMessageText("📖 Kerakli surani tanlang:", {
    reply_markup: Keyboards.surahList(surahs, 0)
  });
});

bot.callbackQuery(/page_(\d+)/, async (ctx) => {
  const page = parseInt(ctx.match![1]);
  const surahs = await quranService.getSurahs();
  await ctx.editMessageText("📖 Suralar ro'yxati:", {
    reply_markup: Keyboards.surahList(surahs, page)
  });
});

bot.callbackQuery('guide', async (ctx) => {
  await ctx.editMessageText(
    "<b>📚 Qo'llanma</b>\n\n1. Suralar ro'yxatidan surani tanlang.\n2. Oyatni tanlab ma'nosini o'qing.\n3. Audio tugmasi orqali qiroatni tinglang.",
    { parse_mode: 'HTML', reply_markup: Keyboards.mainMenu() }
  );
});

bot.callbackQuery(/view_surah_(\d+)/, async (ctx) => {
  const surahNum = parseInt(ctx.match![1]);
  const surah = await quranService.getSurahDetail(surahNum);
  await ctx.editMessageText(`🕋 <b>${surah.number}. ${surah.name}</b>\n\nOyatni tanlang:`, {
    parse_mode: 'HTML',
    reply_markup: Keyboards.ayahNavigation(surahNum, 1, surah.numberOfAyahs)
  });
});

bot.callbackQuery(/ayah_(\d+)_(\d+)/, async (ctx) => {
  const surahNum = parseInt(ctx.match![1]);
  const ayahNum = parseInt(ctx.match![2]);
  
  try {
    const [uzAyah, arAyah, surah] = await Promise.all([
      quranService.getAyah(surahNum, ayahNum, 'uz.sodik'),
      quranService.getAyah(surahNum, ayahNum, 'quran-simple'),
      quranService.getSurahDetail(surahNum)
    ]);

    const message = `📖 <b>${surah.englishName}, ${ayahNum}-oyat</b>\n\n` +
                    `${arAyah.text}\n\n` +
                    `🇺🇿 <b>Ma'nosi:</b>\n${uzAyah.text}`;

    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.ayahNavigation(surahNum, ayahNum, surah.numberOfAyahs)
    });
  } catch (e) {
    await ctx.answerCallbackQuery("Ma'lumot topilmadi.");
  }
});

bot.callbackQuery(/audio_(\d+)_(\d+)/, async (ctx) => {
  const surahNum = parseInt(ctx.match![1]);
  const ayahNum = parseInt(ctx.match![2]);
  try {
    const audioUrl = await quranService.getAyahAudio(surahNum, ayahNum);
    await ctx.replyWithAudio(audioUrl, { title: `${ayahNum}-oyat` });
    await ctx.answerCallbackQuery();
  } catch (e) {
    await ctx.answerCallbackQuery("Audio yuklashda xatolik.");
  }
});

bot.callbackQuery('back_to_main', async (ctx) => {
  await ctx.editMessageText("Asosiy menyu:", { reply_markup: Keyboards.mainMenu() });
});

bot.callbackQuery('noop', (ctx) => ctx.answerCallbackQuery());

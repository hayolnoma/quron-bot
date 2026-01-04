import { Bot, Context, session, SessionFlavor } from 'grammy';
import { SessionData } from './types';
import { Keyboards } from './keyboards';
import { quranService } from './quran-service';
import * as dotenv from "dotenv";

dotenv.config();

export type MyContext = Context & SessionFlavor<SessionData>;

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn("DIQQAT: TELEGRAM_BOT_TOKEN topilmadi. Vercel Environment Variables sozlamalarini tekshiring.");
}

export const bot = new Bot<MyContext>(token || "dummy_token");

bot.use(session({ initial: (): SessionData => ({ language: 'uz' }) }));

bot.catch((err) => {
  console.error(`❌ Botda xatolik yuz berdi:`, err.error);
});

// --- BUYRUQLAR ---
bot.command('start', async (ctx) => {
  await ctx.reply(
    "<b>Assalomu alaykum!</b> Qur'on botiga xush kelibsiz.\n\n" +
    "Suralarni tanlash uchun quyidagi tugmalardan foydalaning yoki diapazon yuboring (masalan: 1:1-5).",
    { reply_markup: Keyboards.mainMenu(), parse_mode: 'HTML' }
  );
});

// --- MATNLI QIDIRUV (DIAPAZON) ---
bot.hears(/^(\d+)[:\s-](\d+)-(\d+)$/, async (ctx) => {
  if (!ctx.match) return;
  
  const surahNum = parseInt(ctx.match[1]);
  const startAyah = parseInt(ctx.match[2]);
  const endAyah = parseInt(ctx.match[3]);

  if (startAyah > endAyah || (endAyah - startAyah) > 9) {
    return ctx.reply("⚠️ Diapazon noto'g'ri yoki juda katta (maksimum 10 ta oyat yubora olaman).");
  }

  const statusMsg = await ctx.reply("🔄 Audiolar tayyorlanmoqda...");

  try {
    const audioGroup: any[] = [];
    for (let i = startAyah; i <= endAyah; i++) {
      const audioUrl = await quranService.getAyahAudio(surahNum, i);
      audioGroup.push({
        type: "audio",
        media: audioUrl,
        caption: `${surahNum}-sura, ${i}-oyat`
      });
    }
    await ctx.replyWithMediaGroup(audioGroup);
    if (ctx.chat) {
      await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
    }
  } catch (error) {
    if (ctx.chat) {
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, "❌ Audio yuklashda xatolik.").catch(() => {});
    }
  }
});

// --- CALLBACK QUERY ---
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
    "<b>📚 Qo'llanma</b>\n\n1. Suralar ro'yxatidan surani tanlang.\n2. Oyatni tanlab ma'nosini o'qing.\n3. Audio tugmasi orqali qiroatni tinglang.\n4. Diapazon yuborish: <code>1:1-7</code> ko'rinishida yozing.",
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
  } catch (e) {
    await ctx.answerCallbackQuery("Audio xatosi.");
  }
});

bot.callbackQuery('back_to_main', async (ctx) => {
  await ctx.editMessageText("Asosiy menyu:", { reply_markup: Keyboards.mainMenu() });
});

bot.callbackQuery('noop', (ctx) => ctx.answerCallbackQuery());
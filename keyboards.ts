import { InlineKeyboard } from 'grammy';
import { Surah } from './types.js';

export const Keyboards = {
  mainMenu: () => {
    return new InlineKeyboard()
      .text("📖 Suralar ro'yxati", "list_surahs")
      .row()
      .text("📚 Qo'llanma", "guide")
      .text("ℹ️ Bot haqida", "about");
  },

  surahList: (surahs: Surah[], page: number = 0) => {
    const keyboard = new InlineKeyboard();
    const itemsPerPage = 10;
    const start = page * itemsPerPage;
    const currentItems = surahs.slice(start, start + itemsPerPage);

    // Qidiruv tugmasi (Avtomatik inline qidiruvni yoqish)
    keyboard.switchInlineCurrent("🔍 Sura qidirish", "").row();

    currentItems.forEach((s, idx) => {
      keyboard.text(`${s.number}. ${s.englishName}`, `view_surah_${s.number}`);
      if (idx % 2 !== 0) keyboard.row();
    });

    keyboard.row();
    if (page > 0) keyboard.text("⬅️ Oldingi", `page_${page - 1}`);
    const totalPages = Math.ceil(surahs.length / itemsPerPage);
    keyboard.text(`📃 ${page + 1} / ${totalPages}`, "noop");
    if (start + itemsPerPage < surahs.length) keyboard.text("Keyingi ➡️", `page_${page + 1}`);

    return keyboard.row().text("🏠 Asosiy menyu", "back_to_main");
  },

  surahDetail: (surahNum: number) => {
    return new InlineKeyboard()
      .text("📖 Oyatma-oyat o'qish", `ayah_${surahNum}_1`)
      .row()
      .text("🕌 Arabcha matn", `range_ar_${surahNum}`)
      .text("🎧 Audio (range)", `range_audio_${surahNum}`)
      .row()
      .text("⬅️ Orqaga", "list_surahs")
      .text("🏠 Menyu", "back_to_main");
  },

  ayahNavigation: (surahNum: number, currentAyah: number, totalAyahs: number) => {
    const keyboard = new InlineKeyboard();

    // Asosiy harakatlar
    keyboard.text("🔊 Tinglash", `audio_${surahNum}_current_${currentAyah}`)
      .row();

    // Navigatsiya
    if (currentAyah > 1) {
      keyboard.text("⬅️ Oldingi", `ayah_${surahNum}_${currentAyah - 1}`);
    }

    if (currentAyah < totalAyahs) {
      keyboard.text("Keyingi ➡️", `ayah_${surahNum}_${currentAyah + 1}`);
    }

    return keyboard.row()
      .text("📋 Sura ma'lumoti", `view_surah_${surahNum}`)
      .row()
      .text("📚 Suralar ro'yxati", "list_surahs")
      .text("🏠 Asosiy menyu", "back_to_main");
  },

  otherBots: () => {
    return new InlineKeyboard()
      .url("🎬 Islomiy Kinolar", "https://t.me/islomiy_kinolar_bot")
      .url("✨ Islomiy Duolar", "https://t.me/islomiy_duolar_bot");
  }
};


import { InlineKeyboard } from 'grammy';
import { Surah } from './types';

export const Keyboards = {
  mainMenu: () => {
    return new InlineKeyboard()
      .text("📖 Suralar ro'yxati", "list_surahs")
      .row()
      .text("📖 Qo'llanma", "guide");
  },

  surahList: (surahs: Surah[], page: number = 0) => {
    const keyboard = new InlineKeyboard();
    const itemsPerPage = 10;
    const start = page * itemsPerPage;
    const currentItems = surahs.slice(start, start + itemsPerPage);

    currentItems.forEach((s, idx) => {
      keyboard.text(`${s.number}. ${s.englishName}`, `view_surah_${s.number}`);
      if (idx % 2 !== 0) keyboard.row();
    });

    keyboard.row();
    if (page > 0) keyboard.text("⬅️", `page_${page - 1}`);
    const totalPages = Math.ceil(surahs.length / itemsPerPage);
    keyboard.text(`${page + 1} / ${totalPages}`, "noop");
    if (start + itemsPerPage < surahs.length) keyboard.text("➡️", `page_${page + 1}`);
    
    return keyboard.row().text("🏠 Asosiy menyu", "back_to_main");
  },

  ayahNavigation: (surahNum: number, currentAyah: number, totalAyahs: number) => {
    const keyboard = new InlineKeyboard();
    
    keyboard.text("🔊 Audio", `audio_${surahNum}_${currentAyah}`).row();

    if (currentAyah > 1) {
      keyboard.text("⬅️ Oldingi", `ayah_${surahNum}_${currentAyah - 1}`);
    }
    
    if (currentAyah < totalAyahs) {
      keyboard.text("Keyingi ➡️", `ayah_${surahNum}_${currentAyah + 1}`);
    }
    
    return keyboard.row()
      .text("📚 Sura ro'yxatiga", "list_surahs")
      .text("🏠 Menyu", "back_to_main");
  }
};

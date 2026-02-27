import { Surah } from './types.js';

/**
 * Suralarning o'zbekcha va keng tarqalgan nomlari xaritasi.
 * API-da nomlar 'Al-Faatiha' ko'rinishida bo'lgani uchun, 
 * o'zbekcha 'Fotiha' deb qidirganda topish uchun xizmat qiladi.
 */
const UZ_SURAH_NAMES: Record<number, string[]> = {
    1: ["fotiha", "al-fatiha", "fatiha", "fotiha surasi"],
    2: ["baqara", "bakara", "al-baqara", "sigir"],
    3: ["ol-imron", "oli imron", "ali imron", "imron oilasi"],
    4: ["niso", "ayollar", "an-nisa"],
    5: ["moida", "dasturxon", "al-ma'ida"],
    18: ["kahf", "g'or", "al-kahf"],
    36: ["yosin", "yasin", "ya-sin"],
    55: ["ar-roxman", "rahmon", "roxman", "ar-rahman"],
    67: ["mulk", "taborak", "al-mulk"],
    112: ["ixlos", "qulhuvallohu", "al-ikhlas"],
    113: ["falaq", "al-falaq"],
    114: ["nos", "an-nas"]
};

export const SearchUtils = {
    /**
     * Suralarni qidirish funksiyasi
     * @param query Qidiruv matni (nom yoki raqam)
     * @param surahs Barcha suralar ro'yxati
     */
    findSurahs: (query: string, surahs: Surah[]): Surah[] => {
        const q = query.toLowerCase().trim();

        // 1. Raqam bo'yicha qidirish
        if (!isNaN(Number(q))) {
            return surahs.filter(s => s.number.toString() === q);
        }

        // 2. Qidiruv natijalarini to'plash
        return surahs.filter(s => {
            const engName = s.englishName.toLowerCase();
            const translation = s.englishNameTranslation.toLowerCase();
            const uzNames = UZ_SURAH_NAMES[s.number]?.map(n => n.toLowerCase()) || [];

            // O'xshashlikni tekshirish
            return (
                engName.includes(q) ||
                translation.includes(q) ||
                uzNames.some(u => u.includes(q)) ||
                s.name.includes(q) // Arabcha nomi
            );
        });
    }
};

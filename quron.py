#!/usr/bin/env python3 
# file: quran_bot_improved.py

import logging
import requests
import html
import re
from typing import List
import time
import os
from io import BytesIO
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# ----- CONFIG -----
# BOT_TOKEN endi environment variable'dan olinadi
BOT_TOKEN = os.getenv("TOKEN")

API_BASE = "https://api.alquran.cloud/v1"
SURAS_PER_PAGE = 12
BUTTONS_PER_ROW = 3
ARAB_RECITER = "ar.alafasy"  # Arabcha audio (Mishari Alafasy)
# ------------------

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("quran_bot")
logger.setLevel(logging.INFO)

# API so'rovlari uchun session (tezlash uchun)
session = requests.Session()

# Sura nomlari uchun uzbek transliteratsiyasi (qisman, API'da to'liq yo'q)
UZBEK_SURA_NAMES = {
    1: "Fotiha",
    2: "Baqara",
    # Boshqa suralar qo'shilishi mumkin
}

# ----- API -----
def get_surah_list() -> List[dict]:
    """Suralar ro'yxatini API'dan oladi."""
    try:
        r = session.get(f"{API_BASE}/surah", timeout=10)
        r.raise_for_status()
        j = r.json()
        if j.get("status") == "OK" and j.get("data"):
            return j["data"]
    except Exception as e:
        logger.exception(f"get_surah_list error: {str(e)}")
    return []


def get_surah_detail(surah_number: int, edition: str = None) -> dict:
    """Suraning tafsilotlarini API'dan oladi."""
    try:
        url = f"{API_BASE}/surah/{surah_number}"
        if edition:
            url += f"/{edition}"
        r = session.get(url, timeout=12)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.exception(f"get_surah_detail error: {str(e)}")
    return {"status": "ERROR"}


def get_ayah_audio_url(surah_number: int, ayah_number: int, reciter: str) -> str:
    """Oyat audio URL'ini oladi."""
    try:
        ref = f"{surah_number}:{ayah_number}"
        r = session.get(f"{API_BASE}/ayah/{ref}/{reciter}", timeout=10)
        r.raise_for_status()
        j = r.json()
        if j.get("status") == "OK" and j.get("data"):
            return j["data"].get("audio")
    except Exception as e:
        logger.exception(f"get_ayah_audio_url error: {str(e)}")
    return None


# ----- UI -----
def main_menu_keyboard():
    """Asosiy menyu klaviaturasi."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📖 Qur'on suralari (arabcha)", callback_data="menu_surah")],
        [InlineKeyboardButton("🌐 Tarjima (uzbek matni + arab audio)", callback_data="menu_translation")]
    ])


def back_to_menu_keyboard(prefix: str):
    """Suralar ro'yxatiga qaytish uchun klaviatura."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔙 Suralarga", callback_data=f"menu_{prefix}")],
        [InlineKeyboardButton("🏠 Asosiy", callback_data="back_to_main")]
    ])


def build_surah_page_keyboard(surahs: List[dict], page: int = 0, prefix: str = "surah"):
    """Suralar sahifasi uchun klaviatura."""
    start = page * SURAS_PER_PAGE
    chunk = surahs[start:start + SURAS_PER_PAGE]
    kb, row = [], []
    for s in chunk:
        # Uzbek nomlari yoki API'dan nom
        label = f"{s['number']}. {UZBEK_SURA_NAMES.get(s['number'], s.get('englishName', s.get('name')))}"
        row.append(InlineKeyboardButton(label, callback_data=f"{prefix}_{s['number']}"))
        if len(row) >= BUTTONS_PER_ROW:
            kb.append(row)
            row = []
    if row:
        kb.append(row)

    nav = []
    if start > 0:
        nav.append(InlineKeyboardButton("⬅️ Oldingi", callback_data=f"{prefix}_page_prev"))
    if start + SURAS_PER_PAGE < len(surahs):
        nav.append(InlineKeyboardButton("🚀 Keyingi", callback_data=f"{prefix}_page_next"))
    if nav:
        kb.append(nav)

    kb.append([InlineKeyboardButton("🏠 Asosiy", callback_data="back_to_main")])
    return InlineKeyboardMarkup(kb)


# ----- Handlers -----
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Botni boshlash: salomlashish va asosiy menyu."""
    user = update.effective_user
    name = html.escape(user.first_name) if user else "Do'stim"
    text = f"🤲 *Assalamu alaykum, {name}!* \n\nQuyidagi menyudan tanlang:"
    kb = main_menu_keyboard()
    if update.message:
        await update.message.reply_text(text, parse_mode="Markdown", reply_markup=kb)
    elif update.callback_query:
        # agar callback orqali kelgan bo'lsa, eski xabarni tahrirlash
        try:
            await update.callback_query.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
        except Exception:
            await update.callback_query.message.reply_text(text, parse_mode="Markdown", reply_markup=kb)


async def send_surah_page(query, context, page: int = 0, prefix: str = "surah"):
    """Suralar ro'yxatini sahifalab ko'rsatadi, eski xabarni tahrir qiladi."""
    surahs = context.user_data.get("surah_list") or get_surah_list()
    if not surahs:
        await query.message.reply_text("❌ Suralarni olishda xato. Iltimos, qayta urinib ko'ring.")
        return
    context.user_data["surah_list"] = surahs
    context.user_data["page"] = page
    context.user_data["prefix"] = prefix
    total_pages = (len(surahs) - 1) // SURAS_PER_PAGE + 1
    kb = build_surah_page_keyboard(surahs, page, prefix)
    title = "Qur'on suralari" if prefix == "surah" else "Qur'on tarjimasi"
    text = f"📚 *{title}* (sahifa {page+1}/{total_pages})"

    try:
        await query.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
    except Exception:
        # Agar tahrirlash mumkin bo'lmasa (masalan, birinchi marta), yangi xabar
        await query.message.reply_text(text, parse_mode="Markdown", reply_markup=kb)


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback so'rovlarini boshqaradi."""
    query = update.callback_query
    await query.answer()
    data = query.data or ""

    if data == "menu_surah":
        await send_surah_page(query, context, page=0, prefix="surah")
        return
    if data == "menu_translation":
        await send_surah_page(query, context, page=0, prefix="translation")
        return
    if data == "back_to_main":
        await start(update, context)
        return

    # Sahifalash
    m = re.match(r"(surah|translation)_page_(next|prev)$", data)
    if m:
        prefix, which = m.group(1), m.group(2)
        cur_page = context.user_data.get("page", 0)
        cur_page = cur_page + 1 if which == "next" else max(0, cur_page - 1)
        await send_surah_page(query, context, cur_page, prefix)
        return

    # Surah (arabcha)
    m = re.match(r"^surah_(\d+)$", data)
    if m:
        num = int(m.group(1))
        resp = get_surah_detail(num)
        if resp.get("status") != "OK":
            await query.message.reply_text("❌ Sura topilmadi. Iltimos, qayta urinib ko'ring.")
            return
        surah = resp["data"]
        context.user_data["chosen_surah"] = num
        sura_name = UZBEK_SURA_NAMES.get(num, surah.get('englishName', surah.get('name')))
        kb = InlineKeyboardMarkup([
            [InlineKeyboardButton("📜 Matn (arabcha)", callback_data=f"text_{num}"),
             InlineKeyboardButton("🔊 Audio (arabcha)", callback_data=f"audio_{num}")],
            [InlineKeyboardButton("🔙 Suralarga", callback_data="menu_surah"),
             InlineKeyboardButton("🏠 Asosiy", callback_data="back_to_main")]
        ])
        await query.message.edit_text(
            f"🕌 *{sura_name}* ({surah['name']})\n"
            f"📖 Oyatlar soni: {surah['numberOfAyahs']}\n"
            f"🎙 Qori: Mishari Alafasy",
            parse_mode="Markdown", reply_markup=kb
        )
        return

    # Tarjima
    m = re.match(r"^translation_(\d+)$", data)
    if m:
        num = int(m.group(1))
        context.user_data["chosen_surah"] = num
        sura_name = UZBEK_SURA_NAMES.get(num, f"{num}-sura")
        kb = InlineKeyboardMarkup([
            [InlineKeyboardButton("📜 Matn (arab+uz)", callback_data=f"trans_text_{num}"),
             InlineKeyboardButton("🔊 Uzbek matni + Arab audio", callback_data=f"trans_audio_{num}")],
            [InlineKeyboardButton("🔙 Suralarga", callback_data="menu_translation"),
             InlineKeyboardButton("🏠 Asosiy", callback_data="back_to_main")]
        ])
        await query.message.edit_text(
            f"🌐 {sura_name} tarjimasi (Shayx Muhammad Sodiq).",
            parse_mode="Markdown", reply_markup=kb
        )
        return

    # Rejim tanlash
    m = re.match(r"^(text|audio|trans_text|trans_audio)_(\d+)$", data)
    if m:
        mode, surah_num = m.group(1), int(m.group(2))
        context.user_data["mode"] = mode
        context.user_data["chosen_surah"] = surah_num
        sura_name = UZBEK_SURA_NAMES.get(surah_num, f"{surah_num}-sura")
        await query.message.edit_text(
            f"{sura_name} uchun oyat oralig'ini kiriting (masalan: `1-6`).",
            parse_mode="Markdown", reply_markup=back_to_menu_keyboard("surah" if mode in ["text", "audio"] else "translation")
        )
        return


async def handle_range_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Oyat oralig'ini qayta ishlash."""
    text = (update.message.text or "").strip()
    if not re.match(r"^\d+-\d+$", text):
        await update.message.reply_text("⚠️ Format noto‘g‘ri. Masalan: `5-10`", reply_markup=back_to_menu_keyboard(context.user_data.get("prefix", "surah")))
        return
    try:
        a, b = map(int, text.split("-"))
        if a < 1 or b < 1:
            await update.message.reply_text("⚠️ Oyat raqamlari 1 dan kichik bo‘lmasligi kerak.", reply_markup=back_to_menu_keyboard(context.user_data.get("prefix", "surah")))
            return
        if a > b:
            await update.message.reply_text("⚠️ Boshlang‘ich oyat oxirgisidan katta bo‘lmasligi kerak.", reply_markup=back_to_menu_keyboard(context.user_data.get("prefix", "surah")))
            return
    except ValueError:
        await update.message.reply_text("⚠️ Faqat raqam kiriting. Masalan: `2-5`", reply_markup=back_to_menu_keyboard(context.user_data.get("prefix", "surah")))
        return

    surah_num = context.user_data.get("chosen_surah")
    mode = context.user_data.get("mode")
    if not surah_num or not mode:
        await update.message.reply_text("Avval sura va rejim tanlang.", reply_markup=main_menu_keyboard())
        return

    # Sura ma'lumotlari
    resp = get_surah_detail(surah_num)
    if resp.get("status") != "OK":
        await update.message.reply_text("❌ Sura ma'lumotlari topilmadi.", reply_markup=back_to_menu_keyboard(context.user_data.get("prefix", "surah")))
        return
    ayahs = resp["data"]["ayahs"]
    if b > len(ayahs):
        await update.message.reply_text(f"⚠️ Bu surada faqat {len(ayahs)} ta oyat bor.", reply_markup=back_to_menu_keyboard(context.user_data.get("prefix", "surah")))
        return

    if mode == "text":  # Arabcha matn
        out = []
        for i in range(a-1, b):
            num = ayahs[i]["numberInSurah"]
            out.append(f"*{num}.* {ayahs[i]['text']}")
        await update.message.reply_text("\n".join(out), parse_mode="Markdown", reply_markup=back_to_menu_keyboard("surah"))

    elif mode == "audio":  # Arabcha audio
        any_audio = False
        for i in range(a, b+1):
            url = get_ayah_audio_url(surah_num, i, ARAB_RECITER)
            if url:
                try:
                    audio_data = session.get(url, timeout=15).content
                    bio = BytesIO(audio_data)
                    bio.name = f"{surah_num}_{i}.mp3"
                    bio.seek(0)
                    await update.message.reply_audio(audio=bio, caption=f"{surah_num}-sura {i}-oyat (arabcha)")
                    any_audio = True
                except Exception as e:
                    logger.exception(f"audio sending error: {e}")
        await update.message.reply_text("✅ Audio yuborildi." if any_audio else "❌ Audio topilmadi.", reply_markup=back_to_menu_keyboard("surah"))

    elif mode == "trans_text":  # Arabcha + Uzbek matn
        resp_uz = get_surah_detail(surah_num, "uz.sodik")
        if resp_uz.get("status") != "OK":
            await update.message.reply_text("❌ Tarjima topilmadi.", reply_markup=back_to_menu_keyboard("translation"))
            return
        ay_uz = resp_uz["data"]["ayahs"]
        out = []
        for i in range(a-1, b):
            out.append(f"*{ayahs[i]['numberInSurah']}.* {ayahs[i]['text']}\n_{ay_uz[i]['text']}_")
        await update.message.reply_text("\n\n".join(out), parse_mode="Markdown", reply_markup=back_to_menu_keyboard("translation"))

    elif mode == "trans_audio":  # Uzbek matni + Arab audio
        resp_uz = get_surah_detail(surah_num, "uz.sodik")
        if resp_uz.get("status") != "OK":
            await update.message.reply_text("❌ Tarjima topilmadi.", reply_markup=back_to_menu_keyboard("translation"))
            return
        ay_uz = resp_uz["data"]["ayahs"]
        any_audio = False
        for i in range(a, b+1):
            await update.message.reply_text(f"{i}-oyat tarjimasi:\n_{ay_uz[i-1]['text']}_", parse_mode="Markdown")
            url = get_ayah_audio_url(surah_num, i, ARAB_RECITER)  # Faqat arabcha audio
            if url:
                try:
                    audio_data = session.get(url, timeout=15).content
                    bio = BytesIO(audio_data)
                    bio.name = f"{surah_num}_{i}.mp3"
                    bio.seek(0)
                    await update.message.reply_audio(audio=bio, caption=f"{surah_num}-sura {i}-oyat (arabcha)")
                    any_audio = True
                except Exception as e:
                    logger.exception(f"audio sending error: {e}")
        await update.message.reply_text("✅ Tarjima va audio yuborildi." if any_audio else "❌ Audio topilmadi.", reply_markup=back_to_menu_keyboard("translation"))


# ----- Main -----
def main():
    """Botni ishga tushirish."""
    if not BOT_TOKEN:
        logger.error("❌ BOT_TOKEN environment variable o‘rnatilmagan! Iltimos, uni ENV da belgilang.")
        return
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_range_input))
    logger.info("✅ Quran bot ishga tushdi.")
    app.run_polling()


if __name__ == "__main__":
    main()

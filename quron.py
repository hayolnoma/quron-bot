#!/usr/bin/env python3 
# file: quran_bot_improved.py

import logging
import requests
import html
import re
from typing import List
import time
import os   # <-- 🔑 Env uchun qo‘shildi
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
# ✅ BOT_TOKEN endi environment variable'dan olinadi
BOT_TOKEN = os.getenv("TOKEN")  # <-- shu yer o‘zgardi

API_BASE = "https://api.alquran.cloud/v1"
SURAS_PER_PAGE = 12
BUTTONS_PER_ROW = 3
ARAB_RECITER = "ar.alafasy"  # Arabcha audio (Mishari Alafasy)
# Uzbek audio yo'q, shuning uchun faqat arabcha ishlatiladi
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


# 🔽 🔽 🔽 Qolgan kodingizni **hech o‘zgartirmadim**
# Handlers, API, main() va boshqalar o‘z holida qoldi
# 🔼 🔼 🔼


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

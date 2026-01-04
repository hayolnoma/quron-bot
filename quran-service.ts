
import axios, { AxiosInstance } from 'axios';
import { Surah, Ayah } from './types';

class QuranService {
  private api: AxiosInstance;
  private readonly BASE_URL = 'https://api.alquran.cloud/v1';

  constructor() {
    this.api = axios.create({
      baseURL: this.BASE_URL,
      timeout: 15000,
    });
  }

  async getSurahs(): Promise<Surah[]> {
    try {
      const response = await this.api.get('/surah');
      return response.data.data;
    } catch (error) {
      console.error('QuranService.getSurahs Error:', error);
      return [];
    }
  }

  async getSurahDetail(number: number): Promise<Surah> {
    const response = await this.api.get(`/surah/${number}`);
    return response.data.data;
  }

  async getAyah(surahNum: number, ayahNum: number, lang: string = 'uz.sodik'): Promise<Ayah> {
    const response = await this.api.get(`/ayah/${surahNum}:${ayahNum}/${lang}`);
    return response.data.data;
  }

  /**
   * Oyat audiosini olish (Default: Mishary Rashid Alafasy)
   */
  async getAyahAudio(surahNum: number, ayahNum: number, edition: string = 'ar.alafasy'): Promise<string> {
    const response = await this.api.get(`/ayah/${surahNum}:${ayahNum}/${edition}`);
    return response.data.data.audio;
  }
}

export const quranService = new QuranService();

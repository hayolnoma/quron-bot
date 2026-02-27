import axios, { AxiosInstance } from 'axios';
import { Surah, Ayah } from './types.js';

class QuranService {
  private api: AxiosInstance;
  private readonly BASE_URL = 'https://api.alquran.cloud/v1';

  // Oddiy in-memory kesh
  private cache: {
    surahs?: Surah[];
    surahDetails: Record<number, Surah>;
    fullSurahs: Record<string, any>;
  } = {
      surahDetails: {},
      fullSurahs: {}
    };

  constructor() {
    this.api = axios.create({
      baseURL: this.BASE_URL,
      timeout: 10000,
    });
  }

  async getSurahs(): Promise<Surah[]> {
    try {
      if (this.cache.surahs) return this.cache.surahs;
      const response = await this.api.get('/surah');
      this.cache.surahs = response.data.data;
      return response.data.data;
    } catch (error) {
      console.error('getSurahs Error:', error);
      return [];
    }
  }

  async getSurahDetail(number: number): Promise<Surah> {
    try {
      if (this.cache.surahDetails[number]) return this.cache.surahDetails[number];
      const response = await this.api.get(`/surah/${number}`);
      this.cache.surahDetails[number] = response.data.data;
      return response.data.data;
    } catch (error) {
      console.error(`getSurahDetail ${number} Error:`, error);
      throw error;
    }
  }

  async getSurahFull(number: number, edition: string = 'quran-simple'): Promise<any> {
    try {
      const cacheKey = `${number}_${edition}`;
      if (this.cache.fullSurahs[cacheKey]) return this.cache.fullSurahs[cacheKey];
      const response = await this.api.get(`/surah/${number}/${edition}`);
      this.cache.fullSurahs[cacheKey] = response.data.data;
      return response.data.data;
    } catch (error) {
      console.error(`getSurahFull ${number} Error:`, error);
      throw error;
    }
  }

  async getAyah(surahNum: number, ayahNum: number, lang: string = 'uz.sodik'): Promise<Ayah> {
    try {
      const response = await this.api.get(`/ayah/${surahNum}:${ayahNum}/${lang}`);
      return response.data.data;
    } catch (error) {
      console.error('getAyah Error:', error);
      throw error;
    }
  }

  async getAyahAudio(surahNum: number, ayahNum: number, edition: string = 'ar.alafasy'): Promise<string> {
    try {
      const response = await this.api.get(`/ayah/${surahNum}:${ayahNum}/${edition}`);
      return response.data.data.audio;
    } catch (error) {
      console.error('getAyahAudio Error:', error);
      throw error;
    }
  }
}

export const quranService = new QuranService();

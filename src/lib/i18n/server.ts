import { cookies } from 'next/headers';
import enMessages from '@/messages/en.json';
import urMessages from '@/messages/ur.json';

export type ServerLanguage = 'en' | 'ur';

export async function getServerTranslation() {
  let lang: ServerLanguage = 'en';
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get('campusfix_lang')?.value;
    if (cookieVal === 'ur') {
      lang = 'ur';
    }
  } catch {
    // Fallback to default
  }

  const dict = lang === 'ur' ? urMessages : enMessages;

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let cur: any = dict;
    for (const key of keys) {
      if (cur && typeof cur === 'object' && key in cur) {
        cur = cur[key];
      } else {
        return fallback !== undefined ? fallback : path;
      }
    }
    return typeof cur === 'string' ? cur : fallback !== undefined ? fallback : path;
  };

  return {
    lang,
    isRTL: lang === 'ur',
    dir: (lang === 'ur' ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    t,
  };
}

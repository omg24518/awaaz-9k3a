import type { Language, Scheme } from './schemes';

export type ApplicationMode = 'online' | 'office' | 'helpline';

interface ApplicationMethodCopy {
  mode: ApplicationMode;
  label: string;
  shortLabel: string;
  description: string;
  cta: string;
}

export function getApplicationMethodCopy(
  scheme: Scheme,
  language: Language,
): ApplicationMethodCopy {
  const isOnline = scheme.has_online_application !== false;
  const isHelpline =
    !isOnline &&
    (scheme.category.includes('helpline') ||
      scheme.official_link.toLowerCase().includes('telemanas'));

  if (isHelpline) {
    return language === 'hi'
      ? {
          mode: 'helpline',
          label: 'हेल्पलाइन से मदद',
          shortLabel: 'Call helpline',
          description:
            'इसमें फॉर्म भरने की जगह फोन पर मदद मिलती है। कदमों में नंबर और तरीका दिया है।',
          cta: 'कॉल के कदम देखें',
        }
      : {
          mode: 'helpline',
          label: 'Call helpline',
          shortLabel: 'Helpline',
          description:
            'This is handled by phone, not by an online form. The steps show what to call and what to expect.',
          cta: 'See call steps',
        };
  }

  if (isOnline) {
    return language === 'hi'
      ? {
          mode: 'online',
          label: 'ऑनलाइन फॉर्म',
          shortLabel: 'Online form',
          description:
            'सरकारी पोर्टल खुलेगा। पहले नीचे दिए कदम पढ़ लें, फिर फॉर्म जमा करें।',
          cta: 'सरकारी फॉर्म खोलें',
        }
      : {
          mode: 'online',
          label: 'Online form',
          shortLabel: 'Online form',
          description:
            'Opens the official government portal. Read the steps first, then submit the form.',
          cta: 'Open official form',
        };
  }

  return language === 'hi'
    ? {
        mode: 'office',
        label: 'दफ्तर / CSC से अर्ज़ी',
        shortLabel: 'Office / CSC',
        description:
          'इस योजना में ऑनलाइन फॉर्म नहीं है। सही दफ्तर, CSC, पंचायत या बैंक से प्रक्रिया शुरू होती है।',
        cta: 'अर्ज़ी के कदम देखें',
      }
    : {
        mode: 'office',
        label: 'Office / CSC application',
        shortLabel: 'Office / CSC',
        description:
          'There is no direct online form. Start through the right office, CSC, panchayat, or bank.',
        cta: 'See apply steps',
      };
}

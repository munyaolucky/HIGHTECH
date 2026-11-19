export const EVENT_BANNER_PRESETS = [
  { key: 'local:ai-symposium', label: 'Computing & AI Lab', path: '/src/assets/images/hitech_computing_lab_1794981896260.jpg' },
  { key: 'local:open-day', label: 'Main Campus Panoramic', path: '/src/assets/images/campus_hero_banner_1794587290452.jpg' },
  { key: 'local:graduation', label: 'HI-TECH Innovation Campus', path: '/src/assets/images/hitech_innovation_campus_1794981896251.jpg' },
  { key: 'local:cyber-clinic', label: 'Engineering & Robotics Lab', path: '/src/assets/images/dept_engineering_lab_1795068915130.jpg' },
  { key: 'local:alumni-evening', label: 'Business & Executive Seminar Hall', path: '/src/assets/images/dept_business_finance_1795068915149.jpg' },
  { key: 'local:assessment-webinar', label: 'Digital Library & Learning Centre', path: '/src/assets/images/student_library_promo_1794587291004.jpg' },
] as const;

const KEY_TO_PATH: Record<string, string> = {
  'local:ai-symposium': '/src/assets/images/hitech_computing_lab_1794981896260.jpg',
  'local:cyber-clinic': '/src/assets/images/dept_engineering_lab_1795068915130.jpg',
  'local:cloud-devops': '/src/assets/images/hitech_computing_lab_1794981896260.jpg',
  'local:assessment-webinar': '/src/assets/images/student_library_promo_1794587291004.jpg',
  'local:open-day': '/src/assets/images/campus_hero_banner_1794587290452.jpg',
  'local:graduation': '/src/assets/images/hitech_innovation_campus_1794981896251.jpg',
  'local:alumni-evening': '/src/assets/images/dept_business_finance_1795068915149.jpg',
  'local:robotics-expo': '/src/assets/images/dept_engineering_lab_1795068915130.jpg',
};

export function mapEventBannerPath(bannerUrl: string | null | undefined, category?: string): string | null {
  const raw = String(bannerUrl ?? '').trim();
  if (raw) {
    if (KEY_TO_PATH[raw]) return KEY_TO_PATH[raw];
    if (raw.startsWith('/src/assets/')) return raw;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
      return raw;
    }
  }
  const cat = String(category ?? '').toLowerCase();
  if (cat.includes('graduation')) return KEY_TO_PATH['local:graduation'];
  if (cat.includes('open day')) return KEY_TO_PATH['local:open-day'];
  if (cat.includes('workshop') || cat.includes('competition') || cat.includes('hackathon')) {
    return KEY_TO_PATH['local:cyber-clinic'];
  }
  if (cat.includes('webinar')) return KEY_TO_PATH['local:assessment-webinar'];
  return null;
}

import campusHeroBanner from '../../assets/images/campus_hero_banner_1794587290452.jpg';
import hitechComputingLab from '../../assets/images/hitech_computing_lab_1794981896260.jpg';
import hitechInnovationCampus from '../../assets/images/hitech_innovation_campus_1794981896251.jpg';
import studentLibraryPromo from '../../assets/images/student_library_promo_1794587291004.jpg';
import studentProfilePortrait from '../../assets/images/student_profile_portrait_1794587291385.jpg';
import staffPrincipalPortrait from '../../assets/images/staff_principal_portrait_1795068915341.jpg';
import staffHodComputing from '../../assets/images/staff_hod_computing_1795068915093.jpg';
import staffLecturerEngineering from '../../assets/images/staff_lecturer_engineering_1795068915515.jpg';
import staffRegistrarDirector from '../../assets/images/staff_registrar_director_1795068915251.jpg';
import deptBusinessFinance from '../../assets/images/dept_business_finance_1795068915149.jpg';
import deptEngineeringLab from '../../assets/images/dept_engineering_lab_1795068915130.jpg';

const MEDIA_MAP: Record<string, string> = {
  '/src/assets/images/campus_hero_banner_1794587290452.jpg': campusHeroBanner,
  '/src/assets/images/hitech_computing_lab_1794981896260.jpg': hitechComputingLab,
  '/src/assets/images/hitech_innovation_campus_1794981896251.jpg': hitechInnovationCampus,
  '/src/assets/images/student_library_promo_1794587291004.jpg': studentLibraryPromo,
  '/src/assets/images/student_profile_portrait_1794587291385.jpg': studentProfilePortrait,
  '/src/assets/images/staff_principal_portrait_1795068915341.jpg': staffPrincipalPortrait,
  '/src/assets/images/staff_hod_computing_1795068915093.jpg': staffHodComputing,
  '/src/assets/images/staff_lecturer_engineering_1795068915515.jpg': staffLecturerEngineering,
  '/src/assets/images/staff_registrar_director_1795068915251.jpg': staffRegistrarDirector,
  '/src/assets/images/dept_business_finance_1795068915149.jpg': deptBusinessFinance,
  '/src/assets/images/dept_engineering_lab_1795068915130.jpg': deptEngineeringLab,
};

export const STAFF_PHOTO_PRESETS = [
  {
    label: 'Principal / Senior Executive Portrait',
    value: '/src/assets/images/staff_principal_portrait_1795068915341.jpg',
  },
  {
    label: 'HOD Computing / Academic Professor Portrait',
    value: '/src/assets/images/staff_hod_computing_1795068915093.jpg',
  },
  {
    label: 'Senior Technical Lecturer Portrait',
    value: '/src/assets/images/staff_lecturer_engineering_1795068915515.jpg',
  },
  {
    label: 'Registrar / Academic Administrator Portrait',
    value: '/src/assets/images/staff_registrar_director_1795068915251.jpg',
  },
  {
    label: 'Campus Faculty / Staff Portrait',
    value: '/src/assets/images/student_profile_portrait_1794587291385.jpg',
  },
];

export const DEPARTMENT_BANNER_PRESETS = [
  {
    label: 'Computing & Innovation Lab',
    value: '/src/assets/images/hitech_computing_lab_1794981896260.jpg',
  },
  {
    label: 'Business & Finance Seminar Hall',
    value: '/src/assets/images/dept_business_finance_1795068915149.jpg',
  },
  {
    label: 'Engineering & Robotics Workshop',
    value: '/src/assets/images/dept_engineering_lab_1795068915130.jpg',
  },
  {
    label: 'HI-TECH Innovation Campus Exterior',
    value: '/src/assets/images/hitech_innovation_campus_1794981896251.jpg',
  },
  {
    label: 'Learning Resource Centre & Library',
    value: '/src/assets/images/student_library_promo_1794587291004.jpg',
  },
  {
    label: 'Main Campus Panoramic View',
    value: '/src/assets/images/campus_hero_banner_1794587290452.jpg',
  },
];

export function resolveWebsiteMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (MEDIA_MAP[url]) return MEDIA_MAP[url];
  return url;
}

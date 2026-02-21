import { Building2, CalendarDays, FileCheck2, Handshake, ShieldCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type FeatureItem = {
  icon: LucideIcon;
  text: string;
};

export type InfoCard = {
  title: string;
  value: string;
  caption: string;
};

export const AUTH_FEATURES: FeatureItem[] = [
  {
    icon: Building2,
    text: 'Multi-colegio con aislamiento de datos por establecimiento y control de acceso por roles y permisos.',
  },
  {
    icon: CalendarDays,
    text: 'Calendario legal con plazos en dias habiles, seguimiento de hitos y alertas de vencimiento.',
  },
  {
    icon: ShieldCheck,
    text: 'Dashboard de cumplimiento y auditoria para monitorear riesgo normativo en tiempo real.',
  },
  {
    icon: Handshake,
    text: 'Modulo GCC con trazabilidad completa: actas, hitos, compromisos y cierre formal del caso.',
  },
  {
    icon: Users,
    text: 'Trabajo colaborativo con actualizaciones en tiempo real durante las mediaciones.',
  },
  {
    icon: FileCheck2,
    text: 'Gestion documental centralizada con evidencias y trazabilidad historica del expediente.',
  },
  {
    icon: ShieldCheck,
    text: 'Integracion de antecedentes y seguimiento psicosocial para contextualizar el caso y respaldar decisiones formativas.',
  },
];

export const AUTH_INFO_CARDS: InfoCard[] = [
  {
    title: 'Establecimientos conectados',
    value: 'Colegio Demo Convivencia',
    caption: 'Datos aislados y seguros',
  },
  {
    title: 'Estado legal',
    value: 'Vigente para 2026',
    caption: 'Conforme Circulares 781/782',
  },
];

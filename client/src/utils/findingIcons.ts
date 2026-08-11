import type { FindingType } from '../types';

const ICONS: Record<FindingType, string> = {
  'script:external': '🔗',
  'script:internal': '📜',
  'script:in-element': '⚡',
  form: '📝',
  comment: '💬',
  secret: '🔐',
  package: '📦',
  link: '🌐',
};

export function getTypeIcon(type: FindingType): string {
  return ICONS[type] || '📄';
}

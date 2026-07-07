import type { SurveyAnswers } from '../types';
import { computeVars } from './compute';

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      Object.assign(out, flatten(v as Record<string, unknown>, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

export function exportSurveyJSON(answers: SurveyAnswers): string {
  const computed = computeVars(answers);
  const payload = {
    surveyVersion: 'v4.3-pilot-web',
    platform: 'LM_EV_eBus_WebPrototype',
    exportNote: 'Import this JSON for pilot testing. For production fieldwork, program the full logic in SurveyEngine and import Ngene DCE designs.',
    ...answers,
    completedAt: answers.completedAt ?? new Date().toISOString(),
    computed,
    qualityFlags: {
      attn1_fail: answers.attitudes.ATTN1 !== 2,
      attn2_fail: answers.moderators.ATTN2 !== 4,
    },
  };
  return JSON.stringify(payload, null, 2);
}

export function exportSurveyCSV(answers: SurveyAnswers): string {
  const computed = computeVars(answers);
  const flat = flatten({ ...answers, computed });
  const keys = Object.keys(flat);
  const escape = (v: unknown) => {
    const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [keys.join(','), keys.map((k) => escape(flat[k])).join(',')].join('\n');
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

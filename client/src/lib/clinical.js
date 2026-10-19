export const HISTORY_FIELDS = [
  { key: 'familiares', label: '¿Hay antecedentes familiares relevantes?', detailPrompt: 'Indica el familiar y el antecedente (por ejemplo: madre, diabetes).' },
  { key: 'patologicos', label: '¿Tienes antecedentes médicos personales?', detailPrompt: 'Describe el diagnóstico y desde cuándo.' },
  { key: 'medicamentos', label: '¿Tomas medicamentos o suplementos?', detailPrompt: 'Indica cuáles, dosis y frecuencia.' },
  { key: 'cirugias', label: '¿Te han realizado alguna cirugía?', detailPrompt: 'Describe cuál y cuándo.' },
  { key: 'digestivo', label: '¿Presentas molestias digestivas?', detailPrompt: 'Describe los síntomas y con qué frecuencia aparecen.' },
  { key: 'ciclo', label: '¿Presentas irregularidades o molestias en tu ciclo menstrual?', detailPrompt: 'Describe la duración, regularidad o molestias.' },
  { key: 'actividad', label: '¿Realizas actividad física?', detailPrompt: 'Indica el tipo de actividad, duración y frecuencia.' },
  { key: 'sueno', label: '¿Tienes dificultades para dormir?', detailPrompt: 'Describe el problema y cuántas horas duermes.' },
  { key: 'agua', label: '¿Consumes agua durante el día?', detailPrompt: 'Indica aproximadamente cuántos vasos o litros al día.' },
  { key: 'alcohol', label: '¿Consumes bebidas alcohólicas?', details: false },
  { key: 'tabaco', label: '¿Consumes tabaco?', details: false },
];

export function parseHistoryValue(value) {
  if (!value) return { answer: '', details: '' };
  if (value === 'No') return { answer: 'no', details: '' };
  const yesPrefix = `S\u00ed:`;
  if (value === `S\u00ed`) return { answer: 'yes', details: '' };
  if (value.startsWith(yesPrefix)) {
    const serializedDetails = value.slice(yesPrefix.length);
    const details = serializedDetails.startsWith(' ')
      ? serializedDetails.slice(1)
      : serializedDetails;
    return { answer: 'yes', details: details.trim() ? details : '' };
  }
  // Treat existing free-text history as a yes answer with its text as details.
  return { answer: 'yes', details: value };
}

export function serializeHistoryValue(answer, details = '') {
  if (answer === 'no') return 'No';
  if (answer === 'yes') return `S\u00ed: ${details}`;
  return '';
}

export function displayHistoryValue(value) {
  const entry = parseHistoryValue(value);
  if (entry.answer === 'no') return 'No';
  if (entry.answer === 'yes') {
    return entry.details ? `S\u00ed — ${entry.details}` : `S\u00ed`;
  }
  return value;
}

export const DEFAULT_MEALS = [
  'Desayuno',
  'Colación 1',
  'Comida',
  'Colación 2',
  'Cena',
];

export const FREQ_OPTIONS = [
  ['diario', 'Diario'],
  ['4-6', '4-6 por semana'],
  ['1-3', '1-3 por semana'],
  ['rara', 'Rara vez'],
  ['nunca', 'Nunca'],
];

export const FREQ_GROUPS = [
  { key: 'verduras', label: 'Verduras' },
  { key: 'frutas', label: 'Frutas' },
  { key: 'cereales', label: 'Cereales y tubérculos' },
  { key: 'leguminosas', label: 'Leguminosas' },
  { key: 'lacteos', label: 'Leche y derivados' },
  { key: 'res_cerdo', label: 'Res y cerdo' },
  { key: 'pollo', label: 'Pollo' },
  { key: 'pescado', label: 'Pescado y mariscos' },
  { key: 'huevo', label: 'Huevo' },
  { key: 'grasas', label: 'Grasas y oleaginosas' },
  { key: 'dulces', label: 'Azúcares y postres' },
  { key: 'bebidas_azucaradas', label: 'Refrescos y jugos' },
  { key: 'ultraprocesados', label: 'Comida rápida y botanas' },
  { key: 'alcohol', label: 'Alcohol' },
];

export const MEASURE_GROUPS = [
  {
    key: 'basicas',
    title: 'Medidas básicas',
    fields: [
      { key: 'tallaSentado', label: 'Talla sentado', unit: 'cm' },
      { key: 'envergadura', label: 'Envergadura', unit: 'cm' },
    ],
  },
  {
    key: 'pliegues',
    title: 'Pliegues',
    fields: [
      { key: 'triceps', label: 'Tríceps', unit: 'mm' },
      { key: 'subescapular', label: 'Subescapular', unit: 'mm' },
      { key: 'biceps', label: 'Bíceps', unit: 'mm' },
      { key: 'crestaIliaca', label: 'Cresta iliaca', unit: 'mm' },
      { key: 'supraespinal', label: 'Supraespinal', unit: 'mm' },
      { key: 'abdominal', label: 'Abdominal', unit: 'mm' },
      { key: 'muslo', label: 'Muslo', unit: 'mm' },
      { key: 'pierna', label: 'Pantorrilla', unit: 'mm' },
    ],
  },
  {
    key: 'perimetros',
    title: 'Perímetros',
    fields: [
      { key: 'brazoRelajado', label: 'Brazo relajado', unit: 'cm' },
      {
        key: 'brazoContraido',
        label: 'Brazo flexionado y contraído',
        unit: 'cm',
      },
      { key: 'cintura', label: 'Cintura', unit: 'cm' },
      { key: 'cadera', label: 'Cadera', unit: 'cm' },
      { key: 'musloMedio', label: 'Muslo medio', unit: 'cm' },
      { key: 'piernaPerimetro', label: 'Pierna', unit: 'cm' },
    ],
  },
  {
    key: 'diametros',
    title: 'Diámetros',
    fields: [
      { key: 'humero', label: 'Húmero', unit: 'cm' },
      { key: 'biestiloideo', label: 'Biestiloideo', unit: 'cm' },
      { key: 'femur', label: 'Fémur', unit: 'cm' },
    ],
  },
];

// Lista plana para gráficas: [{ group, key, label, unit }]
export const ALL_MEASURES = MEASURE_GROUPS.flatMap((g) =>
  g.fields.map((f) => ({ ...f, group: g.key, groupTitle: g.title })),
);

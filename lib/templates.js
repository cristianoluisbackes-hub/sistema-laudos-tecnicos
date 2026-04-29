// NOTA: Templates agora são dinâmicos e vêm do Supabase
// Os dados padrão abaixo serão inseridos automaticamente na primeira execução
// Veja: supabase/migrations/002_templates_normas.sql

// ⚠️ DEPRECATED: Use listarTemplates() e obterTemplate() de laudosServiceSupabase.js
// @deprecated - Usar listarTemplates() do Supabase
export const TEMPLATES = [
  {
    id: 'completo-couro',
    nome: 'Laudo Completo Couro',
    descricao: '5 análises — bateria padrão para couro acabado',
    cor: 'blue',
    analises: [
      { nome: 'Abrasion Wet',        norma: 'ISO 5470-2',  specification: '>3.5', tipo_foto: 'required' },
      { nome: 'Crocking Wet',        norma: 'ISO 105-X12', specification: '>3',   tipo_foto: 'optional' },
      { nome: 'Tearing Strength',    norma: 'ISO 6775',    specification: '>15',  tipo_foto: 'none'     },
      { nome: 'Tensile Strength',    norma: 'ISO 6775',    specification: '>100', tipo_foto: 'none'     },
      { nome: 'Color Fastness Light',norma: 'ISO 105-B02', specification: '>4',   tipo_foto: 'optional' },
    ],
  },
  {
    id: 'teste-rapido',
    nome: 'Teste Rápido',
    descricao: '2 análises essenciais — aprovação rápida',
    cor: 'green',
    analises: [
      { nome: 'Abrasion Wet',     norma: 'ISO 5470-2', specification: '>3.5', tipo_foto: 'required' },
      { nome: 'Tearing Strength', norma: 'ISO 6775',   specification: '>15',  tipo_foto: 'none'     },
    ],
  },
  {
    id: 'custom',
    nome: 'Custom – Montar do Zero',
    descricao: 'Sem análises pré-configuradas',
    cor: 'gray',
    analises: [],
  },
];

export const TIPO_FOTO_LABEL = {
  required: 'Foto obrigatória',
  optional: 'Foto opcional',
  none: 'Sem foto',
};

// @deprecated - Para compatibilidade
export async function obterTemplatesDinâmicos() {
  try {
    const { listarTemplates } = await import('./laudosServiceSupabase');
    return await listarTemplates();
  } catch (err) {
    console.warn('Erro ao carregar templates dinâmicos, usando templates padrão:', err.message);
    return TEMPLATES;
  }
}

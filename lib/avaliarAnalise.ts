export function avaliarStatus(
  resultado: string,
  specification: string
): 'approved' | 'rejected' | null {
  if (!resultado || !specification) return null;

  const num = parseFloat(resultado.replace(',', '.'));
  if (isNaN(num)) return null;

  const spec = specification.trim();

  if (spec.startsWith('>=')) {
    return num >= parseFloat(spec.slice(2)) ? 'approved' : 'rejected';
  }
  if (spec.startsWith('<=')) {
    return num <= parseFloat(spec.slice(2)) ? 'approved' : 'rejected';
  }
  if (spec.startsWith('>')) {
    return num > parseFloat(spec.slice(1)) ? 'approved' : 'rejected';
  }
  if (spec.startsWith('<')) {
    return num < parseFloat(spec.slice(1)) ? 'approved' : 'rejected';
  }
  if (spec.startsWith('=')) {
    return num === parseFloat(spec.slice(1)) ? 'approved' : 'rejected';
  }

  return null;
}

export function calcularStatusGeral(
  analises: Array<{ resultado: string; specification: string; status_analise: string | null }>
): 'approved' | 'rejected' | 'draft' {
  if (analises.length === 0) return 'draft';

  const comResultado = analises.filter((a) => a.resultado);
  if (comResultado.length === 0) return 'draft';

  const statuses = analises.map((a) =>
    a.status_analise ?? avaliarStatus(a.resultado, a.specification)
  );

  if (statuses.some((s) => s === 'rejected')) return 'rejected';
  if (statuses.every((s) => s === 'approved')) return 'approved';
  return 'draft';
}

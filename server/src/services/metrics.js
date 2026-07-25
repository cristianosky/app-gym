/**
 * Cálculos corporales básicos.
 *
 * Se los pasamos a la IA como punto de partida para que no tenga que estimar
 * de memoria: así el plan de comidas parte de números consistentes.
 * Son estimaciones, no diagnósticos médicos.
 */

/** Índice de masa corporal. */
export function imc(weightKg, heightCm) {
  const m = heightCm / 100;
  return Number((weightKg / (m * m)).toFixed(1));
}

/** Categoría del IMC según la OMS. */
export function categoriaImc(valor) {
  if (valor < 18.5) return 'bajo peso';
  if (valor < 25) return 'peso normal';
  if (valor < 30) return 'sobrepeso';
  if (valor < 35) return 'obesidad grado 1';
  if (valor < 40) return 'obesidad grado 2';
  return 'obesidad grado 3';
}

/**
 * Metabolismo basal por la fórmula de Mifflin-St Jeor.
 * Para quien prefiere no decir su sexo usamos el promedio de ambas fórmulas.
 */
export function metabolismoBasal({ weightKg, heightCm, age, sex }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'hombre') return Math.round(base + 5);
  if (sex === 'mujer') return Math.round(base - 161);
  return Math.round(base - 78);
}

/**
 * Gasto energético diario estimado, según cuántos días entrena a la semana.
 * Factores de actividad estándar (sedentario → muy activo).
 */
export function gastoDiario(perfil) {
  const dias = perfil.trainingDays?.length ?? 0;
  const factor = dias <= 1 ? 1.2 : dias <= 3 ? 1.375 : dias <= 5 ? 1.55 : 1.725;
  return Math.round(metabolismoBasal(perfil) * factor);
}

/** Resumen numérico listo para inyectar en el prompt. */
export function resumenCorporal(perfil) {
  const valorImc = imc(perfil.weightKg, perfil.heightCm);
  return {
    imc: valorImc,
    categoriaImc: categoriaImc(valorImc),
    metabolismoBasal: metabolismoBasal(perfil),
    gastoDiario: gastoDiario(perfil),
  };
}

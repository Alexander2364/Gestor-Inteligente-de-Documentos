export interface ValidationResult {
  valido: boolean;
  errores: string[];
}

type Datos = Record<string, unknown>;

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

function isValidRuc(value: unknown): boolean {
  return /^\d{11}$/.test(text(value));
}

function isValidDate(value: unknown): boolean {
  const valueText = text(value);
  const match = valueText.match(/^(\d{4})-(\d{2})-(\d{2})$|^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const year = Number(match[1] ?? match[6]);
  const month = Number(match[2] ?? match[5]);
  const day = Number(match[3] ?? match[4]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function isValidPeriod(value: unknown): boolean {
  const valueText = text(value);
  if (/^\d{4}$/.test(valueText)) return true;
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(valueText)) return true;
  return /^(0[1-9]|1[0-2])\/\d{4}$/.test(valueText);
}

function isValidNumber(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  const valueText = text(value).replace(/^S\/\s*/i, '').replace(/\s/g, '');
  if (!valueText) return false;

  const normalized = valueText.includes('.') && valueText.includes(',')
    ? valueText.replace(/,/g, '')
    : valueText.replace(',', '.');
  return /^-?\d+(?:\.\d+)?$/.test(normalized) && Number.isFinite(Number(normalized));
}

function addRequired(errors: string[], datos: Datos, field: string, label: string): void {
  if (isBlank(datos[field])) errors.push(`${label} es requerido`);
}

function addRuc(errors: string[], datos: Datos, field = 'ruc'): void {
  if (!isBlank(datos[field]) && !isValidRuc(datos[field])) {
    errors.push('RUC debe contener exactamente 11 dígitos');
  }
}

function addDate(errors: string[], datos: Datos, field: string, label: string): void {
  if (!isBlank(datos[field]) && !isValidDate(datos[field])) {
    errors.push(`${label} debe tener formato YYYY-MM-DD o DD/MM/YYYY y ser válida`);
  }
}

function addNumber(errors: string[], datos: Datos, field: string, label: string): void {
  if (!isBlank(datos[field]) && !isValidNumber(datos[field])) {
    errors.push(`${label} debe ser un número válido`);
  }
}

function result(errors: string[]): ValidationResult {
  return { valido: errors.length === 0, errores: errors };
}

export function validateActa(datos: Datos): ValidationResult {
  const errores: string[] = [];
  addRequired(errores, datos, 'numeroActa', 'Número de acta');
  addRequired(errores, datos, 'fecha', 'Fecha');
  addDate(errores, datos, 'fecha', 'Fecha');
  addDate(errores, datos, 'fechaDeclaracion', 'Fecha de declaración');
  addRuc(errores, datos);
  addNumber(errores, datos, 'peso', 'Peso');

  if (Array.isArray(datos.bienes)) {
    datos.bienes.forEach((bien, index) => {
      if (!bien || typeof bien !== 'object' || Array.isArray(bien)) {
        errores.push(`Bien ${index + 1} debe ser un objeto`);
        return;
      }
      const cantidad = (bien as Record<string, unknown>).cantidad;
      addNumber(errores, { cantidad }, 'cantidad', `Cantidad del bien ${index + 1}`);
    });
  }

  return result(errores);
}

export function validateDeclaracion(datos: Datos): ValidationResult {
  const errores: string[] = [];
  addRequired(errores, datos, 'ruc', 'RUC');
  addRequired(errores, datos, 'periodo', 'Período');
  if (isBlank(datos.razonSocial) && isBlank(datos.contribuyente)) {
    errores.push('Razón social o contribuyente es requerido');
  }
  addRequired(errores, datos, 'ingresos', 'Ingresos');
  addRequired(errores, datos, 'rentaNeta', 'Renta neta');
  if (isBlank(datos.tributoDeterminado) && isBlank(datos.tributoCalculado) && isBlank(datos.tributo)) {
    errores.push('Tributo determinado es requerido');
  }
  if (isBlank(datos.saldoAPagar) && isBlank(datos.saldoAFavor)) {
    errores.push('Saldo a pagar o saldo a favor es requerido');
  }

  addRuc(errores, datos);
  if (!isBlank(datos.periodo) && !isValidPeriod(datos.periodo)) {
    errores.push('Período debe tener formato MM/YYYY, YYYY-MM o YYYY');
  }
  addNumber(errores, datos, 'ingresos', 'Ingresos');
  addNumber(errores, datos, 'rentaNeta', 'Renta neta');
  addNumber(errores, datos, 'tributoDeterminado', 'Tributo determinado');
  addNumber(errores, datos, 'tributoCalculado', 'Tributo calculado');
  addNumber(errores, datos, 'tributo', 'Tributo');
  addNumber(errores, datos, 'saldoAPagar', 'Saldo a pagar');
  addNumber(errores, datos, 'saldoAFavor', 'Saldo a favor');

  return result(errores);
}

export function validateFraccionamiento(datos: Datos): ValidationResult {
  const errores: string[] = [];
  addRequired(errores, datos, 'numeroResolucion', 'Número de resolución');
  addRequired(errores, datos, 'ruc', 'RUC');
  addRequired(errores, datos, 'totalDeuda', 'Total de deuda');
  addRequired(errores, datos, 'modalidad', 'Modalidad');
  addRequired(errores, datos, 'numeroCuotas', 'Número de cuotas');
  addRequired(errores, datos, 'fechaVencimiento', 'Fecha de vencimiento');

  addRuc(errores, datos);
  addDate(errores, datos, 'fechaResolucion', 'Fecha de resolución');
  addDate(errores, datos, 'fechaVencimiento', 'Fecha de vencimiento');
  addNumber(errores, datos, 'totalDeuda', 'Total de deuda');
  addNumber(errores, datos, 'numeroCuotas', 'Número de cuotas');
  addNumber(errores, datos, 'cuotaInicial', 'Cuota inicial');
  addNumber(errores, datos, 'tasaInteres', 'Tasa de interés');

  return result(errores);
}

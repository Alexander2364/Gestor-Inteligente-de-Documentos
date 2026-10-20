import { describe, expect, it } from 'vitest';
import {
  buildExecutiveSummary,
  createExecutiveReport,
  normalizeUrgencia,
} from '../../src/services/ia';
import { CLASSIFIER_TYPE_NAMES, URGENCIA_LEVELS } from '../../src/prompts/classifierSchema';

/** Fecha fija de referencia (lunes) para que los plazos sean deterministas. */
const HOY = new Date('2026-10-19T00:00:00Z');

describe('informe ejecutivo de actas de aduana', () => {
  const campos = {
    numeroActa: '235-0105-2020-000067',
    tipoAccion: 'INMOVILIZACION',
    fecha: '04/03/2020',
    hora: '10:30',
    lugarAccionControl: 'Terminal Portuario del Callao',
    consignatario: 'SANTA CRUZ CABRERA, JUDITH KATHERINE',
    apellidosNombres: 'ALDAZ PESANTES, JHONNY',
    ruc: '20123456789',
    manifiesto: '235-2020-18-144178',
    procedencia: 'PANAMA',
    fundamentoHecho: 'Mercancía no declarada',
    peso: '115.23',
    lugarCustodia: 'Almacén SUNAT Callao',
    bienes: [
      { cantidad: '115', unidadMedida: 'unidades', descripcion: 'collares con dije' },
      { cantidad: '187', unidadMedida: 'sets', descripcion: 'aretes' },
    ],
  };

  it('identifica al consignatario y calcula los plazos legales', () => {
    const informe = createExecutiveReport('ACTA_INMOVILIZACION', campos, 'resumen', HOY);

    expect(informe.contexto).toContain('Prevención del Contrabando');
    expect(informe.estado).toBe('Mercancía en custodia (inmovilización)');
    expect(informe.identificacion).toMatchObject({
      Consignatario: 'SANTA CRUZ CABRERA, JUDITH KATHERINE',
      Intervenido: 'ALDAZ PESANTES, JHONNY',
      RUC: '20123456789',
    });

    const alertas = (informe.alertas ?? []).join(' ');
    expect(alertas).toContain('10 días hábiles');
    expect(alertas).toContain('18/03/2020'); // 10 días hábiles desde el 04/03/2020
    expect(alertas).toContain('20 días hábiles');
    expect(alertas).toContain('01/04/2020'); // 20 días hábiles desde el 04/03/2020
    expect(alertas).toMatch(/Han pasado 6 año/);

    expect(informe.urgencia).toBe('ALTA');
    expect(informe.analisisRiesgo?.urgencia).toBe('ALTO');
    expect(informe.accionesRequeridas.length).toBeGreaterThanOrEqual(4);
  });

  it('muestra los datos clave con etiquetas y sin volcar el mapa en crudo', () => {
    const informe = createExecutiveReport('ACTA_INMOVILIZACION', campos, 'resumen', HOY);
    const claves = Object.keys(informe.datosClave);

    expect(claves).toContain('N° de acta');
    expect(claves).toContain('Mercancía');
    expect(claves).not.toContain('numeroActa');
    expect(informe.datosClave['Mercancía']).toBe(
      '115 unidades de collares con dije; 187 sets de aretes',
    );
    // `areaDestino` se conserva en crudo por compatibilidad con los flujos de n8n.
    expect(informe.datosClave.areaDestino).toBe('PREVENCION_CONTRABANDO_FISCALIZACION_ADUANERA');
  });

  it('resume el acta nombrando al consignatario y la mercancía', () => {
    const resumen = buildExecutiveSummary('ACTA_INMOVILIZACION', campos, HOY);

    expect(resumen).toContain('Acta de inmovilización N° 235-0105-2020-000067 del 04/03/2020');
    expect(resumen).toContain('SANTA CRUZ CABRERA, JUDITH KATHERINE');
    expect(resumen).toContain('115 unidades de collares con dije');
    expect(resumen).toContain('115.23 kg');
    expect(resumen).toContain('Almacén SUNAT Callao');
    expect(resumen).not.toContain('contribuyente no identificado');
  });

  it('baja la urgencia cuando los plazos siguen vigentes', () => {
    const reciente = { ...campos, fecha: '05/10/2026' };
    const informe = createExecutiveReport('ACTA_INMOVILIZACION', reciente, 'resumen', HOY);

    expect(informe.urgencia).toBe('MEDIA');
    expect((informe.alertas ?? []).join(' ')).toContain('vence hoy (19/10/2026)');
  });

  it('advierte cuando no puede calcular los plazos ni identificar al sujeto', () => {
    const informe = createExecutiveReport('ACTA_INCAUTACION', {}, 'resumen', HOY);
    const alertas = (informe.alertas ?? []).join(' ');

    expect(informe.estado).toBe('Mercancía incautada');
    expect(alertas).toContain('No se identificó la fecha del acta');
    expect(alertas).toContain('No se identificó el número de acta');
    expect(alertas).toContain('No se identificaron los bienes');
    expect(alertas).toContain('No se identificó al consignatario');
    expect(informe.identificacion).toEqual({});
  });

  it('no presenta como nombre el ruido del OCR guardado en documentos antiguos', () => {
    const conRuido = { ...campos, consignatario: '', apellidosNombres: '2 Z', razonSocial: '' };
    const informe = createExecutiveReport('ACTA_INMOVILIZACION', conRuido, 'resumen', HOY);
    const resumen = buildExecutiveSummary('ACTA_INMOVILIZACION', conRuido, HOY);

    expect(informe.identificacion).not.toHaveProperty('Intervenido');
    expect(informe.datosClave).not.toHaveProperty('Apellidos y nombres');
    expect((informe.alertas ?? []).join(' ')).toContain('No se identificó al consignatario');
    expect(resumen).not.toContain('2 Z');
    expect(resumen).not.toContain('Consignatario/intervenido');
  });

  it('acota el texto libre largo que ya quedó guardado y no lo arrastra al resumen', () => {
    const conBlob = { ...campos, fundamentoHecho: 'MERCANCIA NO DECLARADA. '.repeat(40) };
    const informe = createExecutiveReport('ACTA_INMOVILIZACION', conBlob, 'resumen', HOY);
    const resumen = buildExecutiveSummary('ACTA_INMOVILIZACION', conBlob, HOY);

    expect(informe.datosClave['Fundamento de hecho'].endsWith('…')).toBe(true);
    expect(informe.datosClave['Fundamento de hecho'].length).toBeLessThanOrEqual(241);
    expect(resumen).not.toContain('Fundamento de hecho');
  });
});

describe('informe ejecutivo de recaudación', () => {
  it('alerta de una orden de pago vencida', () => {
    const informe = createExecutiveReport(
      'ORDEN_PAGO_OP',
      {
        contribuyente: 'INVERSIONES DEL SUR S.A.C.',
        ruc: '20123456789',
        periodo: '08/2026',
        totalDeuda: 'S/ 244.26',
        fechaVencimiento: '18/09/2026',
      },
      'resumen',
      HOY,
    );

    expect(informe.datosClave).toMatchObject({
      Contribuyente: 'INVERSIONES DEL SUR S.A.C.',
      'Deuda total': 'S/ 244.26',
      Vencimiento: '18/09/2026',
    });
    expect((informe.alertas ?? []).join(' ')).toContain('venció hace 31 día(s) (18/09/2026)');
    expect(informe.estado).toBe('Pendiente de pago');
  });

  it('alerta del primer vencimiento de un fraccionamiento', () => {
    const informe = createExecutiveReport(
      'RESOLUCION_FRACCIONAMIENTO',
      {
        contribuyente: 'IMPORTACIONES LOPEZ E.I.R.L.',
        totalDeuda: 'S/ 2,247.19',
        numeroCuotas: '3',
        fechaVencimiento: '10/11/2026',
        modalidad: 'fraccionamiento',
      },
      'resumen',
      HOY,
    );

    expect((informe.alertas ?? []).join(' ')).toContain(
      'Primer vencimiento del cronograma: vence el 10/11/2026',
    );
    expect(informe.analisisCumplimiento).toMatchObject({ beneficio: 'En curso o solicitado' });
  });

  it('alerta del saldo por pagar de una declaración jurada', () => {
    const informe = createExecutiveReport(
      'DECLARACION_JURADA_MENSUAL',
      {
        contribuyente: 'COMERCIAL ANDINA S.A.C.',
        ruc: '20123456789',
        periodo: '08/2026',
        ingresos: 'S/ 108,906.00',
        rentaNeta: 'S/ 9,989.16',
        saldoAPagar: 'S/ 2,247.19',
      },
      'resumen',
      HOY,
    );

    const alertas = (informe.alertas ?? []).join(' ');
    expect(alertas).toContain('Saldo por pagar de S/ 2,247.19');
    expect(alertas).toContain('Cruzar ingresos y deducciones');
    expect(informe.estado).toBe('Saldo pendiente de pago');
  });

  it('alerta del seguimiento de un contribuyente nuevo', () => {
    const informe = createExecutiveReport(
      'SOLICITUD_INSCRIPCION_RUC',
      {
        razonSocial: 'IMPORTACIONES LOPEZ E.I.R.L.',
        ruc: '20123456789',
        fechaInicio: '13/03/2026',
      },
      'resumen',
      HOY,
    );

    const alertas = (informe.alertas ?? []).join(' ');
    expect(alertas).toContain('Inicio de actividades: 13/03/2026');
    expect(alertas).toContain('Contribuyente nuevo');
    expect(alertas).toContain('No se identificó el domicilio fiscal');
  });
});

describe('informe ejecutivo de fiscalización', () => {
  it('explica el riesgo de una resolución de multa', () => {
    const informe = createExecutiveReport(
      'RESOLUCION_MULTA_RM',
      { contribuyente: 'COMERCIAL ANDINA S.A.C.', totalDeuda: 'S/ 1,200.00' },
      'resumen',
      HOY,
    );

    expect(informe.contexto).toContain('fiscalización');
    expect(informe.analisisRiesgo?.exigibilidad).toBe('ALTO');
    expect(informe.accionesRequeridas.join(' ')).toContain('notificación');
  });

  it('explica el riesgo de un requerimiento de fiscalización', () => {
    const informe = createExecutiveReport(
      'REQUERIMIENTO_FISCALIZACION',
      { contribuyente: 'COMERCIAL ANDINA S.A.C.' },
      'resumen',
      HOY,
    );

    expect(informe.analisisRiesgo?.incumplimiento).toBe('ALTO');
    expect(informe.estado).toBe('Requerimiento pendiente de respuesta');
  });
});

describe('resumen ejecutivo en los tipos sin plantilla propia', () => {
  it('usa el sujeto del documento y no "contribuyente no identificado"', () => {
    const resumen = buildExecutiveSummary(
      'NOTIFICACION_ELECTRONICA',
      { contribuyente: 'COMERCIAL ANDINA S.A.C.', ruc: '20123456789' },
      HOY,
    );

    expect(resumen).toContain('COMERCIAL ANDINA S.A.C. (RUC: 20123456789)');
    expect(resumen).toContain('NOTIFICACION ELECTRONICA');
  });

  it('avisa cuando el documento no permite identificar al contribuyente', () => {
    expect(buildExecutiveSummary('CARTA_PRESENTACION', {}, HOY)).toContain(
      'contribuyente no identificado',
    );
  });
});

describe('urgencia del informe ejecutivo', () => {
  it('marca la orden de pago como ALTA, sin texto pegado', () => {
    const conVencimiento = createExecutiveReport(
      'ORDEN_PAGO_OP',
      { fechaVencimiento: '30/07/2026' },
      'resumen',
      HOY,
    );
    const sinVencimiento = createExecutiveReport('ORDEN_PAGO_OP', {}, 'resumen', HOY);

    expect(conVencimiento.urgencia).toBe('ALTA');
    expect(sinVencimiento.urgencia).toBe('ALTA');
  });

  it('cuando trae urgencia, siempre es un nivel y no texto libre', () => {
    for (const tipo of CLASSIFIER_TYPE_NAMES) {
      const informe = createExecutiveReport(tipo, {}, 'resumen', HOY);

      if (informe.urgencia !== undefined) {
        expect(URGENCIA_LEVELS).toContain(informe.urgencia);
      }
    }
  });

  it('sanea la urgencia que llega con explicación añadida', () => {
    expect(normalizeUrgencia('ALTA: revisar antes del vencimiento indicado')).toBe('ALTA');
    expect(normalizeUrgencia(' media ')).toBe('MEDIA');
    expect(normalizeUrgencia('baja')).toBe('BAJA');
    expect(normalizeUrgencia('urgente')).toBeUndefined();
    expect(normalizeUrgencia(undefined)).toBeUndefined();
    expect(normalizeUrgencia(7)).toBeUndefined();
  });
});

describe('campos clave de los tipos que no tenían lista propia', () => {
  it('un requerimiento muestra su número de documento y su deuda', () => {
    const informe = createExecutiveReport(
      'REQUERIMIENTO_FISCALIZACION',
      {
        contribuyente: 'ANDINA S.A.C.',
        ruc: '20123456789',
        periodo: '2026-08',
        totalDeuda: 'S/ 1,500.00',
        numeroDocumento: '045-2026-001234',
        fecha: '10/09/2026',
        fechaVencimiento: '25/09/2026',
      },
      'resumen',
      HOY,
    );

    expect(informe.datosClave).toMatchObject({
      'N° de documento': '045-2026-001234',
      'Deuda total': 'S/ 1,500.00',
      Vencimiento: '25/09/2026',
    });
  });

  it('un aplazamiento y fraccionamiento muestra modalidad y cuotas', () => {
    const informe = createExecutiveReport(
      'RESOLUCION_APLAZAMIENTO_FRACCIONAMIENTO',
      {
        contribuyente: 'LOPEZ E.I.R.L.',
        ruc: '20987654321',
        modalidad: 'fraccionamiento',
        totalDeuda: 'S/ 2,247.19',
        intereses: 'S/ 47.19',
        numeroCuotas: '3',
        fechaVencimiento: '10/11/2026',
      },
      'resumen',
      HOY,
    );

    expect(informe.datosClave).toMatchObject({
      Modalidad: 'fraccionamiento',
      'N° de cuotas': '3',
      'Deuda total': 'S/ 2,247.19',
    });
  });

  it('una notificación electrónica muestra número y plazo', () => {
    const informe = createExecutiveReport(
      'NOTIFICACION_ELECTRONICA',
      {
        contribuyente: 'ANDINA S.A.C.',
        ruc: '20123456789',
        numeroDocumento: '2026-004512',
        numeroDeclaracion: '235-2026-18-144178',
        fecha: '12/10/2026',
        fechaVencimiento: '20/10/2026',
      },
      'resumen',
      HOY,
    );

    expect(informe.datosClave).toMatchObject({
      'N° de documento': '2026-004512',
      'N° de declaración': '235-2026-18-144178',
      Vencimiento: '20/10/2026',
    });
  });
});

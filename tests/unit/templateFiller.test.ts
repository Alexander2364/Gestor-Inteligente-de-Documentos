import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fillTemplate } from '../../src/domain/templates/templateFiller';

const actaHtml = readFileSync(
	path.resolve(process.cwd(), 'src/domain/templates/actaInmovilizacion.html'),
	'utf8',
);

describe('fillTemplate (acta de inmovilización/incautación)', () => {
	it('rellena los campos del acta por atributo name', () => {
		const html = fillTemplate(actaHtml, {
			numeroActa: '235-0105-2020',
			actaCodigo1: '235',
			actaCodigo2: '0105',
			actaAnio: '2020',
			numeroAccionControl: '000067',
			tipoAccion: 'INCAUTACION',
			fecha: '04/03/2020',
			apellidosNombres: 'ALDAZ PEÑANTES JHONNY',
			ruc: '10404826277',
			observaciones: 'PESO: 3.420 KG',
			bienes: [
				{ numero: '01', cantidad: '302', unidadMedida: 'UNID', descripcion: 'COLLAR', observaciones: '' },
			],
		});

		expect(html).toMatch(/name="actaCodigo1"[^>]*value="235"/);
		expect(html).toMatch(/name="actaCodigo2"[^>]*value="0105"/);
		expect(html).toMatch(/name="actaAnio"[^>]*value="2020"/);
		expect(html).toMatch(/name="numeroAccionControl"[^>]*value="000067"/);
		expect(html).toMatch(/name="fecha"[^>]*value="04\/03\/2020"/);
		expect(html).toMatch(/name="ruc"[^>]*value="10404826277"/);
		expect(html).toContain('value="INCAUTACION" selected');
		expect(html).toContain('PESO: 3.420 KG');
		expect(html).toMatch(/name="bienes\[0\]\.cantidad"[^>]*value="302"/);
		expect(html).toMatch(/name="bienes\[0\]\.descripcion"[^>]*value="COLLAR"/);
	});
});

import { describe, expect, it } from 'vitest';
import { load } from 'cheerio';
import { fillTemplate } from '../../src/domain/templates/templateFiller';

describe('fillTemplate', () => {
  it('rellena controles por name y escapa valores HTML', () => {
    const html = '<form><input name="numeroActa"><textarea name="observaciones"></textarea><select name="tipoAccion"><option value="INMOVILIZACION">Inmovilización</option><option value="INCAUTACION">Incautación</option></select></form>';
    const output = fillTemplate(html, {
      numeroActa: 'ACT-001',
      observaciones: '<script>alert(1)</script>',
      tipoAccion: 'INCAUTACION',
    });
    const $ = load(output);

    expect($('[name="numeroActa"]').attr('value')).toBe('ACT-001');
    expect($('[name="observaciones"]').text()).toBe('<script>alert(1)</script>');
    expect($('textarea').html()).toContain('&lt;script&gt;');
    expect($('option[value="INCAUTACION"]').attr('selected')).toBe('selected');
    expect($('option[value="INMOVILIZACION"]').attr('selected')).toBeUndefined();
    expect(output).not.toContain('<script>alert(1)</script>');
  });

  it('rellena rutas anidadas y genera una fila por bien', () => {
    const html = `<table data-template="bienes"><tbody><tr>
      <td><input name="bienes[0].numero"></td>
      <td><input name="bienes[0].descripcion"></td>
    </tr></tbody></table>`;
    const output = fillTemplate(html, {
      bienes: [
        { numero: '1', descripcion: 'Repuestos' },
        { numero: '2', descripcion: 'Motores' },
      ],
    });
    const $ = load(output);

    expect($('tbody tr')).toHaveLength(2);
    expect($('input[name="bienes[0].numero"]').attr('value')).toBe('1');
    expect($('input[name="bienes[1].descripcion"]').attr('value')).toBe('Motores');
  });

  it('deja vacíos los campos sin datos', () => {
    const output = fillTemplate('<input name="fecha"><textarea name="observaciones"></textarea>', {});
    const $ = load(output);

    expect($('[name="fecha"]').attr('value')).toBeUndefined();
    expect($('textarea').text()).toBe('');
  });
});

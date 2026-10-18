import { load } from 'cheerio';

type HtmlSelection = any;
type HtmlQuery = any;

function getNestedValue(data: Record<string, any>, path: string): any {
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  return normalizedPath.split('.').reduce((value, key) => value?.[key], data);
}

function hasValue(value: any): boolean {
  return value !== undefined && value !== null;
}

function setControlValue($: HtmlQuery, control: HtmlSelection, value: any): void {
  if (!hasValue(value)) return;

  const tagName = control.prop('tagName')?.toLowerCase();
  const type = String(control.attr('type') ?? '').toLowerCase();

  if (tagName === 'textarea') {
    control.text(String(value));
    return;
  }

  if (tagName === 'select') {
    control.find('option').each((_index: number, option: any) => {
      const isSelected = String($(option).attr('value') ?? '') === String(value);
      $(option).prop('selected', isSelected);
      if (isSelected) $(option).attr('selected', 'selected');
      else $(option).removeAttr('selected');
    });
    return;
  }

  if (type === 'checkbox' || type === 'radio') {
    const checked = value === true || value === 'true' || value === '1' || value === 1;
    if (checked) control.attr('checked', 'checked');
    else control.removeAttr('checked');
    return;
  }

  control.attr('value', String(value));
}

function fillNamedControls($: HtmlQuery, root: HtmlSelection, datos: Record<string, any>): void {
  root.find('input[name], textarea[name], select[name]').each((_index: number, element: any) => {
    const control = $(element);
    const name = control.attr('name');
    if (!name) return;
    setControlValue($, control, getNestedValue(datos, name));
  });
}

function replaceArrayIndexes($: HtmlQuery, row: HtmlSelection, index: number): void {
  row.find('[name]').each((_childIndex: number, element: any) => {
    const control = $(element);
    const name = control.attr('name');
    if (name) control.attr('name', name.replace(/bienes(?:\[\d+\]|\.\d+)?/, `bienes[${index}]`));
  });
}

function fillArrayRows($: HtmlQuery, datos: Record<string, any>): void {
  const bienes = Array.isArray(datos.bienes) ? datos.bienes : [];
  const explicitContainers = $('[data-template="bienes"]');

  explicitContainers.each((_index: number, container: any) => {
    const target = $(container);
    const templateRow = target.find('tr').first();
    if (!templateRow.length) return;
    const rows = bienes.map((_item: any, itemIndex: number) => {
      const row = templateRow.clone();
      replaceArrayIndexes($, row, itemIndex);
      fillNamedControls($, row, datos);
      return row;
    });
    target.find('tr').remove();
    rows.forEach((row) => target.append(row));
  });

  const indexedRows = $('tr').filter(
    (_index: number, row: any) =>
      $(row).find('[name^="bienes["]').length > 0 &&
      !$(row).closest('[data-template="bienes"]').length,
  );
  if (!indexedRows.length) return;

  const firstRow = indexedRows.first();
  const container = firstRow.parent();
  const templateRow = firstRow.clone();
  indexedRows.remove();
  bienes.forEach((_item: any, itemIndex: number) => {
    const row = templateRow.clone();
    replaceArrayIndexes($, row, itemIndex);
    fillNamedControls($, row, datos);
    container.append(row);
  });
}

export function fillTemplate(html: string, datos: Record<string, any>): string {
  const $ = load(html);
  fillArrayRows($, datos);
  fillNamedControls($, $.root(), datos);
  return $.html();
}

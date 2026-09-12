export interface ExtractedTable {
  name: string;
  rows: string[][];
}

export interface NativeExtractedDocument {
  text: string;
  blocks: string[];
  tables: ExtractedTable[];
  metadata: Record<string, string | number>;
}
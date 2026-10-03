# classifyByKeywords()

> God node · 6 connections · `src/services/ia.ts`

**Community:** [Community 2](Community_2.md)

## Connections by Relation

### calls
- [classifyWithOllama()](classifyWithOllama.md) `EXTRACTED`
- [getAreaByDocumentType()](getAreaByDocumentType.md) `EXTRACTED`
- createExecutiveReport() `EXTRACTED`
- extractFields() `EXTRACTED`
- buildExecutiveSummary() `EXTRACTED`

### contains
- ia.ts `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# classifyWithOllama()

> God node · 7 connections · `src/services/ia.ts`

**Community:** [Community 2](Community_2.md)

## Connections by Relation

### calls
- [normalizeOllamaResult()](normalizeOllamaResult.md) `EXTRACTED`
- [processDocument()](processDocument.md) `EXTRACTED`
- [classifyByKeywords()](classifyByKeywords.md) `EXTRACTED`
- buildClassifierPrompt() `EXTRACTED`
- parseJsonResponse() `EXTRACTED`

### contains
- ia.ts `EXTRACTED`

### imports
- document-processing.ts `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 0

> 25 nodes · cohesion 0.08

## Key Concepts

- **dependencies** (13 connections) — `package.json`
- **bullmq** (2 connections) — `package.json`
- **cors** (2 connections) — `package.json`
- **dotenv** (2 connections) — `package.json`
- **exceljs** (2 connections) — `package.json`
- **express** (2 connections) — `package.json`
- **ioredis** (2 connections) — `package.json`
- **mammoth** (2 connections) — `package.json`
- **multer** (2 connections) — `package.json`
- **pdf-parse** (2 connections) — `package.json`
- **sharp** (2 connections) — `package.json`
- **@supabase/supabase-js** (2 connections) — `package.json`
- **tesseract.js** (2 connections) — `package.json`
- **bullmq** (1 connections) — `package.json`
- **cors** (1 connections) — `package.json`
- **dotenv** (1 connections) — `package.json`
- **exceljs** (1 connections) — `package.json`
- **express** (1 connections) — `package.json`
- **ioredis** (1 connections) — `package.json`
- **mammoth** (1 connections) — `package.json`
- **multer** (1 connections) — `package.json`
- **pdf-parse** (1 connections) — `package.json`
- **sharp** (1 connections) — `package.json`
- **@supabase/supabase-js** (1 connections) — `package.json`
- **tesseract.js** (1 connections) — `package.json`

## Relationships

- [Community 7](Community_7.md) (1 shared connections)

## Source Files

- `package.json`

## Audit Trail

- EXTRACTED: 25 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 1

> 24 nodes · cohesion 0.16

## Key Concepts

- **extractor.ts** (23 connections) — `src/services/extractor.ts`
- **extractText()** (9 connections) — `src/services/extractor.ts`
- **extractFromImage()** (5 connections) — `src/services/extractor.ts`
- **normalizeText()** (5 connections) — `src/services/extractor.ts`
- **docx.ts** (5 connections) — `src/services/parsers/docx.ts`
- **extractFromDocx()** (4 connections) — `src/services/extractor.ts`
- **extractFromXlsx()** (4 connections) — `src/services/extractor.ts`
- **parseDocx()** (4 connections) — `src/services/parsers/docx.ts`
- **types.ts** (4 connections) — `src/services/parsers/types.ts`
- **xlsx.ts** (4 connections) — `src/services/parsers/xlsx.ts`
- **extractFromPdf()** (3 connections) — `src/services/extractor.ts`
- **preprocessImage()** (3 connections) — `src/services/ocr/preprocess.ts`
- **NativeExtractedDocument** (3 connections) — `src/services/parsers/types.ts`
- **parseXlsx()** (3 connections) — `src/services/parsers/xlsx.ts`
- **getOcrWorker()** (2 connections) — `src/services/extractor.ts`
- **preprocess.ts** (2 connections) — `src/services/ocr/preprocess.ts`
- **stripTags()** (2 connections) — `src/services/parsers/docx.ts`
- **extractor.test.ts** (2 connections) — `tests/unit/extractor.test.ts`
- **DOCX_MIME_TYPES** (1 connections) — `src/services/extractor.ts`
- **DOCX_MIMES** (1 connections) — `src/services/extractor.ts`
- **ExtractResult** (1 connections) — `src/services/extractor.ts`
- **IMAGE_MIMES** (1 connections) — `src/services/extractor.ts`
- **SupportedMimeType** (1 connections) — `src/services/extractor.ts`
- **ExtractedTable** (1 connections) — `src/services/parsers/types.ts`

## Relationships

- [Community 5](Community_5.md) (4 shared connections)
- [Community 4](Community_4.md) (3 shared connections)

## Source Files

- `src/services/extractor.ts`
- `src/services/ocr/preprocess.ts`
- `src/services/parsers/docx.ts`
- `src/services/parsers/types.ts`
- `src/services/parsers/xlsx.ts`
- `tests/unit/extractor.test.ts`

## Audit Trail

- EXTRACTED: 50 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 2

> 22 nodes · cohesion 0.18

## Key Concepts

- **ia.ts** (20 connections) — `src/services/ia.ts`
- **normalizeOllamaResult()** (9 connections) — `src/services/ia.ts`
- **classifyWithOllama()** (7 connections) — `src/services/ia.ts`
- **classifyByKeywords()** (6 connections) — `src/services/ia.ts`
- **getAreaByDocumentType()** (5 connections) — `src/domain/sunat/areas.ts`
- **classifier.ts** (4 connections) — `src/prompts/classifier.ts`
- **buildClassifierPrompt()** (4 connections) — `src/prompts/classifier.ts`
- **createExecutiveReport()** (4 connections) — `src/services/ia.ts`
- **asRecord()** (3 connections) — `src/services/ia.ts`
- **asStringRecord()** (3 connections) — `src/services/ia.ts`
- **buildExecutiveSummary()** (3 connections) — `src/services/ia.ts`
- **extractFields()** (3 connections) — `src/services/ia.ts`
- **areas.ts** (2 connections) — `src/domain/sunat/areas.ts`
- **isDocumentType()** (2 connections) — `src/services/ia.ts`
- **parseJsonResponse()** (2 connections) — `src/services/ia.ts`
- **ia.test.ts** (2 connections) — `tests/unit/ia.test.ts`
- **CLASSIFIER_PROMPT** (1 connections) — `src/prompts/classifier.ts`
- **ClassificationResult** (1 connections) — `src/services/ia.ts`
- **InformeEjecutivo** (1 connections) — `src/services/ia.ts`
- **OLLAMA_TIMEOUT_MS** (1 connections) — `src/services/ia.ts`
- **SunatDocumentType** (1 connections) — `src/services/ia.ts`
- **VALID_TYPES** (1 connections) — `src/services/ia.ts`

## Relationships

- [Community 4](Community_4.md) (3 shared connections)

## Source Files

- `src/domain/sunat/areas.ts`
- `src/prompts/classifier.ts`
- `src/services/ia.ts`
- `tests/unit/ia.test.ts`

## Audit Trail

- EXTRACTED: 44 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 3

> 21 nodes · cohesion 0.10

## Key Concepts

- **devDependencies** (11 connections) — `package.json`
- **supertest** (2 connections) — `package.json`
- **tsx** (2 connections) — `package.json`
- **@types/cors** (2 connections) — `package.json`
- **@types/express** (2 connections) — `package.json`
- **@types/multer** (2 connections) — `package.json`
- **@types/node** (2 connections) — `package.json`
- **@types/pdf-parse** (2 connections) — `package.json`
- **@types/supertest** (2 connections) — `package.json`
- **typescript** (2 connections) — `package.json`
- **vitest** (2 connections) — `package.json`
- **supertest** (1 connections) — `package.json`
- **tsx** (1 connections) — `package.json`
- **@types/cors** (1 connections) — `package.json`
- **@types/express** (1 connections) — `package.json`
- **@types/multer** (1 connections) — `package.json`
- **@types/node** (1 connections) — `package.json`
- **@types/pdf-parse** (1 connections) — `package.json`
- **@types/supertest** (1 connections) — `package.json`
- **typescript** (1 connections) — `package.json`
- **vitest** (1 connections) — `package.json`

## Relationships

- [Community 7](Community_7.md) (1 shared connections)

## Source Files

- `package.json`

## Audit Trail

- EXTRACTED: 21 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 4

> 20 nodes · cohesion 0.21

## Key Concepts

- **document-processing.ts** (18 connections) — `src/services/document-processing.ts`
- **document.queue.ts** (10 connections) — `src/queues/document.queue.ts`
- **document.worker.ts** (10 connections) — `src/workers/document.worker.ts`
- **processDocument()** (7 connections) — `src/services/document-processing.ts`
- **jobs.ts** (6 connections) — `src/domain/jobs.ts`
- **types/supabase.ts** (5 connections) — `src/types/supabase.ts`
- **DocumentJobData** (4 connections) — `src/domain/jobs.ts`
- **DocumentJobResult** (4 connections) — `src/domain/jobs.ts`
- **createRedisConnection()** (4 connections) — `src/queues/connection.ts`
- **getDocumentQueue()** (4 connections) — `src/queues/document.queue.ts`
- **connection.ts** (3 connections) — `src/queues/connection.ts`
- **enqueueDocument()** (3 connections) — `src/queues/document.queue.ts`
- **DOCUMENT_QUEUE_NAME** (2 connections) — `src/queues/document.queue.ts`
- **Document** (2 connections) — `src/types/supabase.ts`
- **DocumentAnalysis** (2 connections) — `src/types/supabase.ts`
- **DocumentDerivation** (2 connections) — `src/types/supabase.ts`
- **ExtractedMetadata** (2 connections) — `src/types/supabase.ts`
- **worker** (2 connections) — `src/workers/document.worker.ts`
- **ProcessingStatus** (1 connections) — `src/domain/jobs.ts`
- **DERIVATION_EMAIL** (1 connections) — `src/services/document-processing.ts`

## Relationships

- [Community 5](Community_5.md) (5 shared connections)
- [Community 1](Community_1.md) (3 shared connections)
- [Community 2](Community_2.md) (3 shared connections)
- [Community 8](Community_8.md) (3 shared connections)

## Source Files

- `src/domain/jobs.ts`
- `src/queues/connection.ts`
- `src/queues/document.queue.ts`
- `src/services/document-processing.ts`
- `src/types/supabase.ts`
- `src/workers/document.worker.ts`

## Audit Trail

- EXTRACTED: 53 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 5

> 19 nodes · cohesion 0.13

## Key Concepts

- **upload.ts** (11 connections) — `src/routes/upload.ts`
- **env.ts** (8 connections) — `src/utils/env.ts`
- **app.ts** (6 connections) — `src/app.ts`
- **index.ts** (5 connections) — `src/index.ts`
- **app** (3 connections) — `src/app.ts`
- **isSupportedMimeType()** (3 connections) — `src/services/extractor.ts`
- **router** (2 connections) — `src/routes/upload.ts`
- **closeOcrWorker()** (2 connections) — `src/services/extractor.ts`
- **validateEnv()** (2 connections) — `src/utils/env.ts`
- **upload.test.ts** (2 connections) — `tests/integration/upload.test.ts`
- **createApp()** (1 connections) — `src/app.ts`
- **parsedPort** (1 connections) — `src/index.ts`
- **upload** (1 connections) — `src/routes/upload.ts`
- **getEnv()** (1 connections) — `src/utils/env.ts`
- **getEnvOrThrow()** (1 connections) — `src/utils/env.ts`
- **OPTIONAL_VARS** (1 connections) — `src/utils/env.ts`
- **OptionalVar** (1 connections) — `src/utils/env.ts`
- **REQUIRED_VARS** (1 connections) — `src/utils/env.ts`
- **RequiredVar** (1 connections) — `src/utils/env.ts`

## Relationships

- [Community 4](Community_4.md) (5 shared connections)
- [Community 1](Community_1.md) (4 shared connections)

## Source Files

- `src/app.ts`
- `src/index.ts`
- `src/routes/upload.ts`
- `src/services/extractor.ts`
- `src/utils/env.ts`
- `tests/integration/upload.test.ts`

## Audit Trail

- EXTRACTED: 31 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 6

> 16 nodes · cohesion 0.12

## Key Concepts

- **compilerOptions** (10 connections) — `tsconfig.json`
- **tsconfig.json** (3 connections) — `tsconfig.json`
- **exclude** (3 connections) — `tsconfig.json`
- **include** (2 connections) — `tsconfig.json`
- **dist** (1 connections) — `tsconfig.json`
- **node_modules** (1 connections) — `tsconfig.json`
- **src/**/*** (1 connections) — `tsconfig.json`
- **esModuleInterop** (1 connections) — `tsconfig.json`
- **forceConsistentCasingInFileNames** (1 connections) — `tsconfig.json`
- **module** (1 connections) — `tsconfig.json`
- **outDir** (1 connections) — `tsconfig.json`
- **resolveJsonModule** (1 connections) — `tsconfig.json`
- **rootDir** (1 connections) — `tsconfig.json`
- **skipLibCheck** (1 connections) — `tsconfig.json`
- **strict** (1 connections) — `tsconfig.json`
- **target** (1 connections) — `tsconfig.json`

## Relationships

- No strong cross-community connections detected

## Source Files

- `tsconfig.json`

## Audit Trail

- EXTRACTED: 15 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 7

> 15 nodes · cohesion 0.13

## Key Concepts

- **package.json** (9 connections) — `package.json`
- **scripts** (8 connections) — `package.json`
- **description** (1 connections) — `package.json`
- **keywords** (1 connections) — `package.json`
- **main** (1 connections) — `package.json`
- **name** (1 connections) — `package.json`
- **build** (1 connections) — `package.json`
- **dev** (1 connections) — `package.json`
- **lint** (1 connections) — `package.json`
- **test** (1 connections) — `package.json`
- **test:watch** (1 connections) — `package.json`
- **typecheck** (1 connections) — `package.json`
- **worker** (1 connections) — `package.json`
- **type** (1 connections) — `package.json`
- **version** (1 connections) — `package.json`

## Relationships

- [Community 0](Community_0.md) (1 shared connections)
- [Community 3](Community_3.md) (1 shared connections)

## Source Files

- `package.json`

## Audit Trail

- EXTRACTED: 16 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 8

> 7 nodes · cohesion 0.43

## Key Concepts

- **config/supabase.ts** (6 connections) — `src/config/supabase.ts`
- **getSupabaseClient()** (6 connections) — `src/config/supabase.ts`
- **test-db-connection.ts** (3 connections) — `test-db-connection.ts`
- **validateSupabaseEnv()** (2 connections) — `src/config/supabase.ts`
- **testConnection()** (2 connections) — `test-db-connection.ts`
- **REQUIRED_SUPABASE_VARS** (1 connections) — `src/config/supabase.ts`
- **RequiredSupabaseVar** (1 connections) — `src/config/supabase.ts`

## Relationships

- [Community 4](Community_4.md) (3 shared connections)

## Source Files

- `src/config/supabase.ts`
- `test-db-connection.ts`

## Audit Trail

- EXTRACTED: 12 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 9

> 3 nodes · cohesion 0.67

## Key Concepts

- **graphify.js** (2 connections) — `.opencode/plugins/graphify.js`
- **GraphifyPlugin()** (1 connections) — `.opencode/plugins/graphify.js`
- **IMPORTANT: keep the reminder string free of backticks and $(...) constructs.** (1 connections) — `.opencode/plugins/graphify.js`

## Relationships

- No strong cross-community connections detected

## Source Files

- `.opencode/plugins/graphify.js`

## Audit Trail

- EXTRACTED: 2 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 10

> 2 nodes · cohesion 1.00

## Key Concepts

- **graphify-slash.js** (1 connections) — `.opencode/plugins/graphify-slash.js`
- **GraphifySlashCommand()** (1 connections) — `.opencode/plugins/graphify-slash.js`

## Relationships

- No strong cross-community connections detected

## Source Files

- `.opencode/plugins/graphify-slash.js`

## Audit Trail

- EXTRACTED: 1 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 11

> 1 nodes · cohesion 1.00

## Key Concepts

- **extractor-images.test.ts** (0 connections) — `src/services/ocr/extractor-images.test.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `src/services/ocr/extractor-images.test.ts`

## Audit Trail

- EXTRACTED: 0 (0%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 12

> 1 nodes · cohesion 1.00

## Key Concepts

- **preprocess.test.ts** (0 connections) — `src/services/ocr/preprocess.test.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `src/services/ocr/preprocess.test.ts`

## Audit Trail

- EXTRACTED: 0 (0%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 13

> 1 nodes · cohesion 1.00

## Key Concepts

- **quality.ts** (0 connections) — `src/services/ocr/quality.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `src/services/ocr/quality.ts`

## Audit Trail

- EXTRACTED: 0 (0%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 14

> 1 nodes · cohesion 1.00

## Key Concepts

- **vitest.config.ts** (0 connections) — `tests/fixtures/vitest.config.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `tests/fixtures/vitest.config.ts`

## Audit Trail

- EXTRACTED: 0 (0%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Community 15

> 1 nodes · cohesion 1.00

## Key Concepts

- **vitest.config.mts** (0 connections) — `vitest.config.mts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `vitest.config.mts`

## Audit Trail

- EXTRACTED: 0 (0%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# compilerOptions

> God node · 10 connections · `tsconfig.json`

**Community:** [Community 6](Community_6.md)

## Connections by Relation

### contains
- tsconfig.json `EXTRACTED`
- forceConsistentCasingInFileNames `EXTRACTED`
- resolveJsonModule `EXTRACTED`
- target `EXTRACTED`
- module `EXTRACTED`
- rootDir `EXTRACTED`
- outDir `EXTRACTED`
- strict `EXTRACTED`
- esModuleInterop `EXTRACTED`
- skipLibCheck `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# extractText()

> God node · 9 connections · `src/services/extractor.ts`

**Community:** [Community 1](Community_1.md)

## Connections by Relation

### calls
- [processDocument()](processDocument.md) `EXTRACTED`
- extractFromImage() `EXTRACTED`
- extractFromDocx() `EXTRACTED`
- extractFromXlsx() `EXTRACTED`
- isSupportedMimeType() `EXTRACTED`
- extractFromPdf() `EXTRACTED`

### contains
- extractor.ts `EXTRACTED`

### imports
- document-processing.ts `EXTRACTED`
- extractor.test.ts `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# getAreaByDocumentType()

> God node · 5 connections · `src/domain/sunat/areas.ts`

**Community:** [Community 2](Community_2.md)

## Connections by Relation

### calls
- [normalizeOllamaResult()](normalizeOllamaResult.md) `EXTRACTED`
- [classifyByKeywords()](classifyByKeywords.md) `EXTRACTED`
- createExecutiveReport() `EXTRACTED`

### contains
- areas.ts `EXTRACTED`

### imports
- ia.ts `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# getSupabaseClient()

> God node · 6 connections · `src/config/supabase.ts`

**Community:** [Community 8](Community_8.md)

## Connections by Relation

### calls
- [processDocument()](processDocument.md) `EXTRACTED`
- validateSupabaseEnv() `EXTRACTED`
- testConnection() `EXTRACTED`

### contains
- config/supabase.ts `EXTRACTED`

### imports
- document-processing.ts `EXTRACTED`
- test-db-connection.ts `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# Knowledge Graph Index

> Auto-generated by graphify. Start here — read community articles for context, then drill into god nodes for detail.

**179 nodes · 250 edges · 16 communities**

---

## Communities
(sorted by size, largest first)

- [Community 0](Community_0.md) — 25 nodes
- [Community 1](Community_1.md) — 24 nodes
- [Community 2](Community_2.md) — 22 nodes
- [Community 3](Community_3.md) — 21 nodes
- [Community 4](Community_4.md) — 20 nodes
- [Community 5](Community_5.md) — 19 nodes
- [Community 6](Community_6.md) — 16 nodes
- [Community 7](Community_7.md) — 15 nodes
- [Community 8](Community_8.md) — 7 nodes
- [Community 9](Community_9.md) — 3 nodes
- [Community 10](Community_10.md) — 2 nodes
- [Community 11](Community_11.md) — 1 nodes
- [Community 12](Community_12.md) — 1 nodes
- [Community 13](Community_13.md) — 1 nodes
- [Community 14](Community_14.md) — 1 nodes
- [Community 15](Community_15.md) — 1 nodes

## God Nodes
(most connected concepts — the load-bearing abstractions)

- [compilerOptions](compilerOptions.md) — 10 connections
- [extractText()](extractText.md) — 9 connections
- [normalizeOllamaResult()](normalizeOllamaResult.md) — 9 connections
- [scripts](scripts.md) — 8 connections
- [processDocument()](processDocument.md) — 7 connections
- [classifyWithOllama()](classifyWithOllama.md) — 7 connections
- [getSupabaseClient()](getSupabaseClient.md) — 6 connections
- [classifyByKeywords()](classifyByKeywords.md) — 6 connections
- [getAreaByDocumentType()](getAreaByDocumentType.md) — 5 connections
- [normalizeText()](normalizeText.md) — 5 connections

---

*Generated by [graphify](https://github.com/safishamsi/graphify)*# normalizeOllamaResult()

> God node · 9 connections · `src/services/ia.ts`

**Community:** [Community 2](Community_2.md)

## Connections by Relation

### calls
- [classifyWithOllama()](classifyWithOllama.md) `EXTRACTED`
- [getAreaByDocumentType()](getAreaByDocumentType.md) `EXTRACTED`
- createExecutiveReport() `EXTRACTED`
- asStringRecord() `EXTRACTED`
- extractFields() `EXTRACTED`
- buildExecutiveSummary() `EXTRACTED`
- asRecord() `EXTRACTED`
- isDocumentType() `EXTRACTED`

### contains
- ia.ts `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# normalizeText()

> God node · 5 connections · `src/services/extractor.ts`

**Community:** [Community 1](Community_1.md)

## Connections by Relation

### calls
- extractFromImage() `EXTRACTED`
- extractFromDocx() `EXTRACTED`
- extractFromXlsx() `EXTRACTED`
- extractFromPdf() `EXTRACTED`

### contains
- extractor.ts `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# processDocument()

> God node · 7 connections · `src/services/document-processing.ts`

**Community:** [Community 4](Community_4.md)

## Connections by Relation

### calls
- [extractText()](extractText.md) `EXTRACTED`
- [classifyWithOllama()](classifyWithOllama.md) `EXTRACTED`
- [getSupabaseClient()](getSupabaseClient.md) `EXTRACTED`
- worker `EXTRACTED`

### contains
- document-processing.ts `EXTRACTED`

### imports
- upload.ts `EXTRACTED`
- document.worker.ts `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*# scripts

> God node · 8 connections · `package.json`

**Community:** [Community 7](Community_7.md)

## Connections by Relation

### contains
- package.json `EXTRACTED`
- lint `EXTRACTED`
- test `EXTRACTED`
- test:watch `EXTRACTED`
- worker `EXTRACTED`
- dev `EXTRACTED`
- build `EXTRACTED`
- typecheck `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*
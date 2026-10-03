# Grafo de Conocimiento del Backend (Analizado por Graphify)

## 1. Clusters de Módulos (Agrupaciones naturales de código)
Graph: graphify-out/graph.json (184 nodes) | Traversal: BFS depth=2 | Start: ['src/**/*', 'classifier.ts', 'CLASSIFIER_PROMPT', 'document-processing.ts'] | 66 nodes found

[i] Complete answer over budget: all 66 nodes and 129 edges shown (~6130 tokens vs the requested ~2000-token budget). Edges are never dropped once every node fits, so this is already the full answer — raising --budget further will not shrink it. Narrow with context_filter=['call'] or use get_node for a specific symbol to reduce size instead.

NODE src/**/* [src=tsconfig.json loc=L13 community=compilerOptions]
NODE classifier.ts [src=src/prompts/classifier.ts loc=L1 community=ia.ts]
NODE CLASSIFIER_PROMPT [src=src/prompts/classifier.ts loc=L3 community=ia.ts]
NODE document-processing.ts [src=src/services/document-processing.ts loc=L1 community=upload.ts]
NODE extractor.ts [src=src/services/extractor.ts loc=L1 community=extractor.ts]
NODE ia.ts [src=src/services/ia.ts loc=L1 community=ia.ts]
NODE upload.ts [src=src/routes/upload.ts loc=L1 community=upload.ts]
NODE document.worker.ts [src=src/workers/document.worker.ts loc=L1 community=upload.ts]
NODE extractText() [src=src/services/extractor.ts loc=L75 community=extractor.ts]
NODE classifyWithOllama() [src=src/services/ia.ts loc=L319 community=ia.ts]
NODE jobs.ts [src=src/domain/jobs.ts loc=L1 community=upload.ts]
NODE processDocument() [src=src/services/document-processing.ts loc=L23 community=upload.ts]
NODE DocumentJobData [src=src/domain/jobs.ts loc=L3 community=upload.ts]
NODE DocumentJobResult [src=src/domain/jobs.ts loc=L9 community=upload.ts]
NODE buildClassifierPrompt() [src=src/prompts/classifier.ts loc=L56 community=ia.ts]
NODE ia.test.ts [src=tests/unit/ia.test.ts loc=L1 community=ia.ts]
NODE include [src=tsconfig.json loc=L13 community=compilerOptions]
NODE DERIVATION_EMAIL [src=src/services/document-processing.ts loc=L5 community=upload.ts]
NODE document.queue.ts [src=src/queues/document.queue.ts loc=L1 community=upload.ts]
NODE normalizeOllamaResult() [src=src/services/ia.ts loc=L255 community=ia.ts]
NODE app.ts [src=src/app.ts loc=L1 community=upload.ts]
NODE classifyByKeywords() [src=src/services/ia.ts loc=L284 community=ia.ts]
NODE getAreaByDocumentType() [src=src/domain/sunat/areas.ts loc=L1 community=ia.ts]
NODE extractFromImage() [src=src/services/extractor.ts loc=L143 community=extractor.ts]
NODE normalizeText() [src=src/services/extractor.ts loc=L59 community=extractor.ts]
NODE docx.ts [src=src/services/parsers/docx.ts loc=L1 community=extractor.ts]
NODE createRedisConnection() [src=src/queues/connection.ts loc=L5 community=upload.ts]
NODE getDocumentQueue() [src=src/queues/document.queue.ts loc=L8 community=upload.ts]
NODE extractFromDocx() [src=src/services/extractor.ts loc=L120 community=extractor.ts]
NODE extractFromXlsx() [src=src/services/extractor.ts loc=L131 community=extractor.ts]
NODE createExecutiveReport() [src=src/services/ia.ts loc=L155 community=ia.ts]
NODE parseDocx() [src=src/services/parsers/docx.ts loc=L13 community=extractor.ts]
NODE xlsx.ts [src=src/services/parsers/xlsx.ts loc=L1 community=extractor.ts]
NODE connection.ts [src=src/queues/connection.ts loc=L1 community=upload.ts]
NODE enqueueDocument() [src=src/queues/document.queue.ts loc=L15 community=upload.ts]
NODE extractFromPdf() [src=src/services/extractor.ts loc=L110 community=extractor.ts]
NODE isSupportedMimeType() [src=src/services/extractor.ts loc=L191 community=extractor.ts]
NODE asRecord() [src=src/services/ia.ts loc=L62 community=ia.ts]
NODE asStringRecord() [src=src/services/ia.ts loc=L68 community=ia.ts]
NODE buildExecutiveSummary() [src=src/services/ia.ts loc=L222 community=ia.ts]
NODE extractFields() [src=src/services/ia.ts loc=L74 community=ia.ts]
NODE preprocessImage() [src=src/services/ocr/preprocess.ts loc=L3 community=extractor.ts]
NODE parseXlsx() [src=src/services/parsers/xlsx.ts loc=L4 community=extractor.ts]
NODE tsconfig.json [src=tsconfig.json loc=L1 community=compilerOptions]
NODE areas.ts [src=src/domain/sunat/areas.ts loc=L1 community=ia.ts]
NODE DOCUMENT_QUEUE_NAME [src=src/queues/document.queue.ts loc=L5 community=upload.ts]
NODE router [src=src/routes/upload.ts loc=L9 community=upload.ts]
NODE closeOcrWorker() [src=src/services/extractor.ts loc=L184 community=extractor.ts]
NODE getOcrWorker() [src=src/services/extractor.ts loc=L47 community=extractor.ts]
NODE isDocumentType() [src=src/services/ia.ts loc=L58 community=ia.ts]
NODE parseJsonResponse() [src=src/services/ia.ts loc=L245 community=ia.ts]
NODE preprocess.ts [src=src/services/ocr/preprocess.ts loc=L1 community=extractor.ts]
NODE worker [src=src/workers/document.worker.ts loc=L8 community=upload.ts]
NODE extractor.test.ts [src=tests/unit/extractor.test.ts loc=L1 community=extractor.ts]
NODE ProcessingStatus [src=src/domain/jobs.ts loc=L1 community=upload.ts]
NODE upload [src=src/routes/upload.ts loc=L12 community=upload.ts]
NODE DOCX_MIME_TYPES [src=src/services/extractor.ts loc=L37 community=extractor.ts]
NODE DOCX_MIMES [src=src/services/extractor.ts loc=L35 community=extractor.ts]
NODE ExtractResult [src=src/services/extractor.ts loc=L21 community=extractor.ts]
NODE IMAGE_MIMES [src=src/services/extractor.ts loc=L43 community=extractor.ts]
NODE SupportedMimeType [src=src/services/extractor.ts loc=L9 community=extractor.ts]
NODE ClassificationResult [src=src/services/ia.ts loc=L36 community=ia.ts]
NODE InformeEjecutivo [src=src/services/ia.ts loc=L21 community=ia.ts]
NODE OLLAMA_TIMEOUT_MS [src=src/services/ia.ts loc=L47 community=ia.ts]
NODE SunatDocumentType [src=src/services/ia.ts loc=L4 community=ia.ts]
NODE VALID_TYPES [src=src/services/ia.ts loc=L49 community=ia.ts]
EDGE include --extends [EXTRACTED context=import]--> src/**/* at=tsconfig.json:L13
EDGE document-processing.ts --imports [EXTRACTED context=import]--> extractText() at=src/services/document-processing.ts:L1
EDGE document-processing.ts --imports [EXTRACTED context=import]--> classifyWithOllama() at=src/services/document-processing.ts:L2
EDGE document-processing.ts --imports [EXTRACTED context=import]--> DocumentJobData at=src/services/document-processing.ts:L3
EDGE document-processing.ts --imports [EXTRACTED context=import]--> DocumentJobResult at=src/services/document-processing.ts:L3
EDGE upload.ts --imports_from [EXTRACTED context=import]--> document-processing.ts at=src/routes/upload.ts:L7
EDGE document-processing.ts --imports_from [EXTRACTED context=import]--> extractor.ts at=src/services/document-processing.ts:L1
EDGE document-processing.ts --imports_from [EXTRACTED context=import]--> ia.ts at=src/services/document-processing.ts:L2
EDGE document-processing.ts --imports_from [EXTRACTED context=import]--> jobs.ts at=src/services/document-processing.ts:L3
EDGE document.worker.ts --imports_from [EXTRACTED context=import]--> document-processing.ts at=src/workers/document.worker.ts:L4
EDGE document-processing.ts --contains [EXTRACTED]--> processDocument() at=src/services/document-processing.ts:L23
EDGE document-processing.ts --contains [EXTRACTED]--> DERIVATION_EMAIL at=src/services/document-processing.ts:L5
EDGE ia.ts --imports_from [EXTRACTED context=import]--> classifier.ts at=src/services/ia.ts:L1
EDGE ia.test.ts --imports_from [EXTRACTED context=import]--> classifier.ts at=tests/unit/ia.test.ts:L2
EDGE classifier.ts --contains [EXTRACTED]--> buildClassifierPrompt() at=src/prompts/classifier.ts:L56
EDGE document.queue.ts --imports [EXTRACTED context=import]--> DocumentJobData at=src/queues/document.queue.ts:L2
EDGE document.queue.ts --imports_from [EXTRACTED context=import]--> jobs.ts at=src/queues/document.queue.ts:L2
EDGE jobs.ts --contains [EXTRACTED]--> ProcessingStatus at=src/domain/jobs.ts:L1
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromDocx() at=src/services/extractor.ts:L101
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromXlsx() at=src/services/extractor.ts:L103
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromImage() at=src/services/extractor.ts:L105
EDGE extractText() --calls [EXTRACTED context=call]--> isSupportedMimeType() at=src/services/extractor.ts:L92
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromPdf() at=src/services/extractor.ts:L98
EDGE extractor.test.ts --imports [EXTRACTED context=import]--> extractText() at=tests/unit/extractor.test.ts:L3
EDGE document.worker.ts --imports [EXTRACTED context=import]--> createRedisConnection() at=src/workers/document.worker.ts:L5
EDGE document.worker.ts --imports [EXTRACTED context=import]--> DOCUMENT_QUEUE_NAME at=src/workers/document.worker.ts:L6
EDGE document.worker.ts --imports_from [EXTRACTED context=import]--> connection.ts at=src/workers/document.worker.ts:L5
EDGE document.worker.ts --imports_from [EXTRACTED context=import]--> document.queue.ts at=src/workers/document.worker.ts:L6
EDGE document.worker.ts --contains [EXTRACTED]--> worker at=src/workers/document.worker.ts:L8
EDGE worker --calls [EXTRACTED context=call]--> processDocument() at=src/workers/document.worker.ts:L10
EDGE classifyWithOllama() --calls [EXTRACTED context=call]--> normalizeOllamaResult() at=src/services/ia.ts:L338
EDGE classifyWithOllama() --calls [EXTRACTED context=call]--> parseJsonResponse() at=src/services/ia.ts:L338
EDGE classifyWithOllama() --calls [EXTRACTED context=call]--> classifyByKeywords() at=src/services/ia.ts:L341
EDGE tsconfig.json --contains [EXTRACTED]--> include at=tsconfig.json:L13
EDGE upload.ts --imports [EXTRACTED context=import]--> isSupportedMimeType() at=src/routes/upload.ts:L4
EDGE upload.ts --imports [EXTRACTED context=import]--> closeOcrWorker() at=src/routes/upload.ts:L5
EDGE upload.ts --imports [EXTRACTED context=import]--> enqueueDocument() at=src/routes/upload.ts:L6
EDGE upload.ts --imports [EXTRACTED context=import]--> getDocumentQueue() at=src/routes/upload.ts:L6
EDGE app.ts --imports_from [EXTRACTED context=import]--> upload.ts at=src/app.ts:L3
EDGE upload.ts --imports_from [EXTRACTED context=import]--> document.queue.ts at=src/routes/upload.ts:L6
EDGE upload.ts --contains [EXTRACTED]--> upload at=src/routes/upload.ts:L12
EDGE upload.ts --contains [EXTRACTED]--> router at=src/routes/upload.ts:L9
EDGE extractor.ts --imports [EXTRACTED context=import]--> parseDocx() at=src/services/extractor.ts:L4
EDGE extractor.ts --imports [EXTRACTED context=import]--> parseXlsx() at=src/services/extractor.ts:L5
EDGE extractor.ts --imports [EXTRACTED context=import]--> preprocessImage() at=src/services/extractor.ts:L6
EDGE extractor.ts --imports_from [EXTRACTED context=import]--> docx.ts at=src/services/extractor.ts:L4
EDGE extractor.ts --imports_from [EXTRACTED context=import]--> xlsx.ts at=src/services/extractor.ts:L5
EDGE extractor.ts --imports_from [EXTRACTED context=import]--> preprocess.ts at=src/services/extractor.ts:L6
EDGE extractor.test.ts --imports_from [EXTRACTED context=import]--> extractor.ts at=tests/unit/extractor.test.ts:L3
EDGE extractor.ts --contains [EXTRACTED]--> extractFromPdf() at=src/services/extractor.ts:L110
EDGE extractor.ts --contains [EXTRACTED]--> extractFromDocx() at=src/services/extractor.ts:L120
EDGE extractor.ts --contains [EXTRACTED]--> extractFromXlsx() at=src/services/extractor.ts:L131
EDGE extractor.ts --contains [EXTRACTED]--> extractFromImage() at=src/services/extractor.ts:L143
EDGE extractor.ts --contains [EXTRACTED]--> closeOcrWorker() at=src/services/extractor.ts:L184
EDGE extractor.ts --contains [EXTRACTED]--> isSupportedMimeType() at=src/services/extractor.ts:L191
EDGE extractor.ts --contains [EXTRACTED]--> ExtractResult at=src/services/extractor.ts:L21
EDGE extractor.ts --contains [EXTRACTED]--> DOCX_MIMES at=src/services/extractor.ts:L35
EDGE extractor.ts --contains [EXTRACTED]--> DOCX_MIME_TYPES at=src/services/extractor.ts:L37
EDGE extractor.ts --contains [EXTRACTED]--> IMAGE_MIMES at=src/services/extractor.ts:L43
EDGE extractor.ts --contains [EXTRACTED]--> getOcrWorker() at=src/services/extractor.ts:L47
EDGE extractor.ts --contains [EXTRACTED]--> normalizeText() at=src/services/extractor.ts:L59
EDGE extractor.ts --contains [EXTRACTED]--> SupportedMimeType at=src/services/extractor.ts:L9
EDGE ia.ts --imports [EXTRACTED context=import]--> getAreaByDocumentType() at=src/services/ia.ts:L2
EDGE ia.ts --imports_from [EXTRACTED context=import]--> areas.ts at=src/services/ia.ts:L2
EDGE ia.ts --contains [EXTRACTED]--> createExecutiveReport() at=src/services/ia.ts:L155
EDGE ia.ts --contains [EXTRACTED]--> InformeEjecutivo at=src/services/ia.ts:L21
EDGE ia.ts --contains [EXTRACTED]--> buildExecutiveSummary() at=src/services/ia.ts:L222
EDGE ia.ts --contains [EXTRACTED]--> parseJsonResponse() at=src/services/ia.ts:L245
EDGE ia.ts --contains [EXTRACTED]--> normalizeOllamaResult() at=src/services/ia.ts:L255
EDGE ia.ts --contains [EXTRACTED]--> classifyByKeywords() at=src/services/ia.ts:L284
EDGE ia.ts --contains [EXTRACTED]--> ClassificationResult at=src/services/ia.ts:L36
EDGE ia.ts --contains [EXTRACTED]--> SunatDocumentType at=src/services/ia.ts:L4
EDGE ia.ts --contains [EXTRACTED]--> OLLAMA_TIMEOUT_MS at=src/services/ia.ts:L47
EDGE ia.ts --contains [EXTRACTED]--> VALID_TYPES at=src/services/ia.ts:L49
EDGE ia.ts --contains [EXTRACTED]--> isDocumentType() at=src/services/ia.ts:L58
EDGE ia.ts --contains [EXTRACTED]--> asRecord() at=src/services/ia.ts:L62
EDGE ia.ts --contains [EXTRACTED]--> asStringRecord() at=src/services/ia.ts:L68
EDGE ia.ts --contains [EXTRACTED]--> extractFields() at=src/services/ia.ts:L74
EDGE document.queue.ts --imports [EXTRACTED context=import]--> DocumentJobResult at=src/queues/document.queue.ts:L2
EDGE app.ts --imports [EXTRACTED context=import]--> router at=src/app.ts:L3
EDGE document.worker.ts --imports_from [EXTRACTED context=import]--> jobs.ts at=src/workers/document.worker.ts:L3
EDGE jobs.ts --contains [EXTRACTED]--> DocumentJobData at=src/domain/jobs.ts:L3
EDGE jobs.ts --contains [EXTRACTED]--> DocumentJobResult at=src/domain/jobs.ts:L9
EDGE document.worker.ts --imports [EXTRACTED context=import]--> DocumentJobData at=src/workers/document.worker.ts:L3
EDGE document.worker.ts --imports [EXTRACTED context=import]--> DocumentJobResult at=src/workers/document.worker.ts:L3
EDGE areas.ts --contains [EXTRACTED]--> getAreaByDocumentType() at=src/domain/sunat/areas.ts:L1
EDGE classifyByKeywords() --calls [EXTRACTED context=call]--> getAreaByDocumentType() at=src/services/ia.ts:L311
EDGE createExecutiveReport() --calls [EXTRACTED context=call]--> getAreaByDocumentType() at=src/services/ia.ts:L160
EDGE normalizeOllamaResult() --calls [EXTRACTED context=call]--> getAreaByDocumentType() at=src/services/ia.ts:L274
EDGE classifier.ts --contains [EXTRACTED]--> CLASSIFIER_PROMPT at=src/prompts/classifier.ts:L3
EDGE classifyWithOllama() --calls [EXTRACTED context=call]--> buildClassifierPrompt() at=src/services/ia.ts:L328
EDGE ia.ts --imports [EXTRACTED context=import]--> buildClassifierPrompt() at=src/services/ia.ts:L1
EDGE ia.test.ts --imports [EXTRACTED context=import]--> buildClassifierPrompt() at=tests/unit/ia.test.ts:L2
EDGE document.queue.ts --imports_from [EXTRACTED context=import]--> connection.ts at=src/queues/document.queue.ts:L3
EDGE connection.ts --contains [EXTRACTED]--> createRedisConnection() at=src/queues/connection.ts:L5
EDGE getDocumentQueue() --calls [EXTRACTED context=call]--> createRedisConnection() at=src/queues/document.queue.ts:L10
EDGE document.queue.ts --imports [EXTRACTED context=import]--> createRedisConnection() at=src/queues/document.queue.ts:L3
EDGE document.queue.ts --contains [EXTRACTED]--> enqueueDocument() at=src/queues/document.queue.ts:L15
EDGE document.queue.ts --contains [EXTRACTED]--> DOCUMENT_QUEUE_NAME at=src/queues/document.queue.ts:L5
EDGE document.queue.ts --contains [EXTRACTED]--> getDocumentQueue() at=src/queues/document.queue.ts:L8
EDGE enqueueDocument() --calls [EXTRACTED context=call]--> getDocumentQueue() at=src/queues/document.queue.ts:L16
EDGE upload.ts --imports [EXTRACTED context=import]--> processDocument() at=src/routes/upload.ts:L7
EDGE upload.ts --imports_from [EXTRACTED context=import]--> extractor.ts at=src/routes/upload.ts:L5
EDGE processDocument() --calls [EXTRACTED context=call]--> extractText() at=src/services/document-processing.ts:L25
EDGE processDocument() --calls [EXTRACTED context=call]--> classifyWithOllama() at=src/services/document-processing.ts:L29
EDGE document.worker.ts --imports [EXTRACTED context=import]--> processDocument() at=src/workers/document.worker.ts:L4
EDGE extractor.ts --contains [EXTRACTED]--> extractText() at=src/services/extractor.ts:L75
EDGE extractFromDocx() --calls [EXTRACTED context=call]--> parseDocx() at=src/services/extractor.ts:L121
EDGE extractFromDocx() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L123
EDGE extractFromImage() --calls [EXTRACTED context=call]--> preprocessImage() at=src/services/extractor.ts:L147
EDGE extractFromImage() --calls [EXTRACTED context=call]--> getOcrWorker() at=src/services/extractor.ts:L158
EDGE extractFromImage() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L160
EDGE extractFromPdf() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L113
EDGE extractFromXlsx() --calls [EXTRACTED context=call]--> parseXlsx() at=src/services/extractor.ts:L132
EDGE extractFromXlsx() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L134
EDGE ia.ts --contains [EXTRACTED]--> classifyWithOllama() at=src/services/ia.ts:L319
EDGE asStringRecord() --calls [EXTRACTED context=call]--> asRecord() at=src/services/ia.ts:L70
EDGE normalizeOllamaResult() --calls [EXTRACTED context=call]--> asRecord() at=src/services/ia.ts:L261
EDGE normalizeOllamaResult() --calls [EXTRACTED context=call]--> asStringRecord() at=src/services/ia.ts:L259
EDGE classifyByKeywords() --calls [EXTRACTED context=call]--> buildExecutiveSummary() at=src/services/ia.ts:L307
EDGE normalizeOllamaResult() --calls [EXTRACTED context=call]--> buildExecutiveSummary() at=src/services/ia.ts:L260
EDGE classifyByKeywords() --calls [EXTRACTED context=call]--> extractFields() at=src/services/ia.ts:L306
EDGE classifyByKeywords() --calls [EXTRACTED context=call]--> createExecutiveReport() at=src/services/ia.ts:L308
EDGE normalizeOllamaResult() --calls [EXTRACTED context=call]--> createExecutiveReport() at=src/services/ia.ts:L262
EDGE normalizeOllamaResult() --calls [EXTRACTED context=call]--> extractFields() at=src/services/ia.ts:L259
EDGE normalizeOllamaResult() --calls [EXTRACTED context=call]--> isDocumentType() at=src/services/ia.ts:L256
EDGE preprocess.ts --contains [EXTRACTED]--> preprocessImage() at=src/services/ocr/preprocess.ts:L3
EDGE docx.ts --contains [EXTRACTED]--> parseDocx() at=src/services/parsers/docx.ts:L13
EDGE xlsx.ts --contains [EXTRACTED]--> parseXlsx() at=src/services/parsers/xlsx.ts:L4

## 2. Análisis de Acoplamiento (Archivos más dependientes)
Graph: graphify-out/graph.json (184 nodes) | Traversal: BFS depth=2 | Start: ['src/**/*', 'connection.ts', 'closeOcrWorker()', 'Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)', 'Ramas'] | 54 nodes found

[i] Complete answer over budget: all 54 nodes and 93 edges shown (~4848 tokens vs the requested ~2000-token budget). Edges are never dropped once every node fits, so this is already the full answer — raising --budget further will not shrink it. Narrow with context_filter=['call'] or use get_node for a specific symbol to reduce size instead.

NODE src/**/* [src=tsconfig.json loc=L13 community=compilerOptions]
NODE connection.ts [src=src/queues/connection.ts loc=L1 community=upload.ts]
NODE closeOcrWorker() [src=src/services/extractor.ts loc=L184 community=extractor.ts]
NODE Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) [src=PROJECT_CONTEXT.md loc=L1 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE Ramas [src=README.md loc=L5 community=Reglas del proyecto]
NODE extractor.ts [src=src/services/extractor.ts loc=L1 community=extractor.ts]
NODE upload.ts [src=src/routes/upload.ts loc=L1 community=upload.ts]
NODE document.queue.ts [src=src/queues/document.queue.ts loc=L1 community=upload.ts]
NODE document.worker.ts [src=src/workers/document.worker.ts loc=L1 community=upload.ts]
NODE Reglas del proyecto [src=README.md loc=L3 community=Reglas del proyecto]
NODE createRedisConnection() [src=src/queues/connection.ts loc=L5 community=upload.ts]
NODE include [src=tsconfig.json loc=L13 community=compilerOptions]
NODE PROJECT_CONTEXT.md [src=PROJECT_CONTEXT.md loc=L1 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE 1. Objetivo y Alcance [src=PROJECT_CONTEXT.md loc=L3 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE 2. Estado Actual (Avance 1 - COMPLETADO) [src=PROJECT_CONTEXT.md loc=L13 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE 3. Pendientes Inmediatos (Avance 2 - Semanas 5-6) [src=PROJECT_CONTEXT.md loc=L20 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE 4. Reglas de Interacción con Aider [src=PROJECT_CONTEXT.md loc=L27 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE document-processing.ts [src=src/services/document-processing.ts loc=L1 community=upload.ts]
NODE extractText() [src=src/services/extractor.ts loc=L75 community=extractor.ts]
NODE app.ts [src=src/app.ts loc=L1 community=upload.ts]
NODE jobs.ts [src=src/domain/jobs.ts loc=L1 community=upload.ts]
NODE processDocument() [src=src/services/document-processing.ts loc=L23 community=upload.ts]
NODE extractFromImage() [src=src/services/extractor.ts loc=L143 community=extractor.ts]
NODE normalizeText() [src=src/services/extractor.ts loc=L59 community=extractor.ts]
NODE docx.ts [src=src/services/parsers/docx.ts loc=L1 community=extractor.ts]
NODE DocumentJobData [src=src/domain/jobs.ts loc=L3 community=upload.ts]
NODE DocumentJobResult [src=src/domain/jobs.ts loc=L9 community=upload.ts]
NODE getDocumentQueue() [src=src/queues/document.queue.ts loc=L8 community=upload.ts]
NODE extractFromDocx() [src=src/services/extractor.ts loc=L120 community=extractor.ts]
NODE extractFromXlsx() [src=src/services/extractor.ts loc=L131 community=extractor.ts]
NODE parseDocx() [src=src/services/parsers/docx.ts loc=L13 community=extractor.ts]
NODE xlsx.ts [src=src/services/parsers/xlsx.ts loc=L1 community=extractor.ts]
NODE enqueueDocument() [src=src/queues/document.queue.ts loc=L15 community=upload.ts]
NODE extractFromPdf() [src=src/services/extractor.ts loc=L110 community=extractor.ts]
NODE isSupportedMimeType() [src=src/services/extractor.ts loc=L191 community=extractor.ts]
NODE preprocessImage() [src=src/services/ocr/preprocess.ts loc=L3 community=extractor.ts]
NODE parseXlsx() [src=src/services/parsers/xlsx.ts loc=L4 community=extractor.ts]
NODE tsconfig.json [src=tsconfig.json loc=L1 community=compilerOptions]
NODE README.md [src=README.md loc=L1 community=Reglas del proyecto]
NODE DOCUMENT_QUEUE_NAME [src=src/queues/document.queue.ts loc=L5 community=upload.ts]
NODE router [src=src/routes/upload.ts loc=L9 community=upload.ts]
NODE getOcrWorker() [src=src/services/extractor.ts loc=L47 community=extractor.ts]
NODE preprocess.ts [src=src/services/ocr/preprocess.ts loc=L1 community=extractor.ts]
NODE worker [src=src/workers/document.worker.ts loc=L8 community=upload.ts]
NODE extractor.test.ts [src=tests/unit/extractor.test.ts loc=L1 community=extractor.ts]
NODE Commits [src=README.md loc=L35 community=Reglas del proyecto]
NODE Nombres de ramas [src=README.md loc=L23 community=Reglas del proyecto]
NODE Regla obligatoria [src=README.md loc=L13 community=Reglas del proyecto]
NODE upload [src=src/routes/upload.ts loc=L12 community=upload.ts]
NODE DOCX_MIME_TYPES [src=src/services/extractor.ts loc=L37 community=extractor.ts]
NODE DOCX_MIMES [src=src/services/extractor.ts loc=L35 community=extractor.ts]
NODE ExtractResult [src=src/services/extractor.ts loc=L21 community=extractor.ts]
NODE IMAGE_MIMES [src=src/services/extractor.ts loc=L43 community=extractor.ts]
NODE SupportedMimeType [src=src/services/extractor.ts loc=L9 community=extractor.ts]
EDGE upload.ts --imports [EXTRACTED context=import]--> closeOcrWorker() at=src/routes/upload.ts:L5
EDGE extractor.ts --contains [EXTRACTED]--> closeOcrWorker() at=src/services/extractor.ts:L184
EDGE document.queue.ts --imports_from [EXTRACTED context=import]--> connection.ts at=src/queues/document.queue.ts:L3
EDGE document.worker.ts --imports_from [EXTRACTED context=import]--> connection.ts at=src/workers/document.worker.ts:L5
EDGE connection.ts --contains [EXTRACTED]--> createRedisConnection() at=src/queues/connection.ts:L5
EDGE include --extends [EXTRACTED context=import]--> src/**/* at=tsconfig.json:L13
EDGE Reglas del proyecto --contains [EXTRACTED]--> Ramas at=README.md:L5
EDGE PROJECT_CONTEXT.md --contains [EXTRACTED]--> Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) at=PROJECT_CONTEXT.md:L1
EDGE Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) --contains [EXTRACTED]--> 2. Estado Actual (Avance 1 - COMPLETADO) at=PROJECT_CONTEXT.md:L13
EDGE Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) --contains [EXTRACTED]--> 3. Pendientes Inmediatos (Avance 2 - Semanas 5-6) at=PROJECT_CONTEXT.md:L20
EDGE Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) --contains [EXTRACTED]--> 4. Reglas de Interacción con Aider at=PROJECT_CONTEXT.md:L27
EDGE Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) --contains [EXTRACTED]--> 1. Objetivo y Alcance at=PROJECT_CONTEXT.md:L3
EDGE document.queue.ts --imports [EXTRACTED context=import]--> DocumentJobData at=src/queues/document.queue.ts:L2
EDGE document.queue.ts --imports [EXTRACTED context=import]--> DocumentJobResult at=src/queues/document.queue.ts:L2
EDGE document.queue.ts --imports_from [EXTRACTED context=import]--> jobs.ts at=src/queues/document.queue.ts:L2
EDGE document.queue.ts --contains [EXTRACTED]--> enqueueDocument() at=src/queues/document.queue.ts:L15
EDGE document.queue.ts --contains [EXTRACTED]--> DOCUMENT_QUEUE_NAME at=src/queues/document.queue.ts:L5
EDGE document.queue.ts --contains [EXTRACTED]--> getDocumentQueue() at=src/queues/document.queue.ts:L8
EDGE README.md --contains [EXTRACTED]--> Reglas del proyecto at=README.md:L3
EDGE Reglas del proyecto --contains [EXTRACTED]--> Regla obligatoria at=README.md:L13
EDGE Reglas del proyecto --contains [EXTRACTED]--> Nombres de ramas at=README.md:L23
EDGE Reglas del proyecto --contains [EXTRACTED]--> Commits at=README.md:L35
EDGE getDocumentQueue() --calls [EXTRACTED context=call]--> createRedisConnection() at=src/queues/document.queue.ts:L10
EDGE upload.ts --imports [EXTRACTED context=import]--> isSupportedMimeType() at=src/routes/upload.ts:L4
EDGE upload.ts --imports [EXTRACTED context=import]--> enqueueDocument() at=src/routes/upload.ts:L6
EDGE upload.ts --imports [EXTRACTED context=import]--> getDocumentQueue() at=src/routes/upload.ts:L6
EDGE upload.ts --imports [EXTRACTED context=import]--> processDocument() at=src/routes/upload.ts:L7
EDGE app.ts --imports_from [EXTRACTED context=import]--> upload.ts at=src/app.ts:L3
EDGE upload.ts --imports_from [EXTRACTED context=import]--> document-processing.ts at=src/routes/upload.ts:L7
EDGE upload.ts --contains [EXTRACTED]--> upload at=src/routes/upload.ts:L12
EDGE upload.ts --contains [EXTRACTED]--> router at=src/routes/upload.ts:L9
EDGE tsconfig.json --contains [EXTRACTED]--> include at=tsconfig.json:L13
EDGE document.worker.ts --imports [EXTRACTED context=import]--> DocumentJobData at=src/workers/document.worker.ts:L3
EDGE document.worker.ts --imports [EXTRACTED context=import]--> DocumentJobResult at=src/workers/document.worker.ts:L3
EDGE document.worker.ts --imports [EXTRACTED context=import]--> processDocument() at=src/workers/document.worker.ts:L4
EDGE document.worker.ts --imports [EXTRACTED context=import]--> DOCUMENT_QUEUE_NAME at=src/workers/document.worker.ts:L6
EDGE document.worker.ts --imports_from [EXTRACTED context=import]--> jobs.ts at=src/workers/document.worker.ts:L3
EDGE document.worker.ts --imports_from [EXTRACTED context=import]--> document-processing.ts at=src/workers/document.worker.ts:L4
EDGE document.worker.ts --contains [EXTRACTED]--> worker at=src/workers/document.worker.ts:L8
EDGE extractor.ts --imports [EXTRACTED context=import]--> parseDocx() at=src/services/extractor.ts:L4
EDGE extractor.ts --imports [EXTRACTED context=import]--> parseXlsx() at=src/services/extractor.ts:L5
EDGE extractor.ts --imports [EXTRACTED context=import]--> preprocessImage() at=src/services/extractor.ts:L6
EDGE document-processing.ts --imports_from [EXTRACTED context=import]--> extractor.ts at=src/services/document-processing.ts:L1
EDGE extractor.ts --imports_from [EXTRACTED context=import]--> docx.ts at=src/services/extractor.ts:L4
EDGE extractor.ts --imports_from [EXTRACTED context=import]--> xlsx.ts at=src/services/extractor.ts:L5
EDGE extractor.ts --imports_from [EXTRACTED context=import]--> preprocess.ts at=src/services/extractor.ts:L6
EDGE extractor.test.ts --imports_from [EXTRACTED context=import]--> extractor.ts at=tests/unit/extractor.test.ts:L3
EDGE extractor.ts --contains [EXTRACTED]--> extractFromPdf() at=src/services/extractor.ts:L110
EDGE extractor.ts --contains [EXTRACTED]--> extractFromDocx() at=src/services/extractor.ts:L120
EDGE extractor.ts --contains [EXTRACTED]--> extractFromXlsx() at=src/services/extractor.ts:L131
EDGE extractor.ts --contains [EXTRACTED]--> extractFromImage() at=src/services/extractor.ts:L143
EDGE extractor.ts --contains [EXTRACTED]--> isSupportedMimeType() at=src/services/extractor.ts:L191
EDGE extractor.ts --contains [EXTRACTED]--> ExtractResult at=src/services/extractor.ts:L21
EDGE extractor.ts --contains [EXTRACTED]--> DOCX_MIMES at=src/services/extractor.ts:L35
EDGE extractor.ts --contains [EXTRACTED]--> DOCX_MIME_TYPES at=src/services/extractor.ts:L37
EDGE extractor.ts --contains [EXTRACTED]--> IMAGE_MIMES at=src/services/extractor.ts:L43
EDGE extractor.ts --contains [EXTRACTED]--> getOcrWorker() at=src/services/extractor.ts:L47
EDGE extractor.ts --contains [EXTRACTED]--> normalizeText() at=src/services/extractor.ts:L59
EDGE extractor.ts --contains [EXTRACTED]--> extractText() at=src/services/extractor.ts:L75
EDGE extractor.ts --contains [EXTRACTED]--> SupportedMimeType at=src/services/extractor.ts:L9
EDGE app.ts --imports [EXTRACTED context=import]--> router at=src/app.ts:L3
EDGE document-processing.ts --imports_from [EXTRACTED context=import]--> jobs.ts at=src/services/document-processing.ts:L3
EDGE jobs.ts --contains [EXTRACTED]--> DocumentJobData at=src/domain/jobs.ts:L3
EDGE jobs.ts --contains [EXTRACTED]--> DocumentJobResult at=src/domain/jobs.ts:L9
EDGE document-processing.ts --imports [EXTRACTED context=import]--> DocumentJobData at=src/services/document-processing.ts:L3
EDGE document-processing.ts --imports [EXTRACTED context=import]--> DocumentJobResult at=src/services/document-processing.ts:L3
EDGE document.queue.ts --imports [EXTRACTED context=import]--> createRedisConnection() at=src/queues/document.queue.ts:L3
EDGE document.worker.ts --imports [EXTRACTED context=import]--> createRedisConnection() at=src/workers/document.worker.ts:L5
EDGE upload.ts --imports_from [EXTRACTED context=import]--> document.queue.ts at=src/routes/upload.ts:L6
EDGE document.worker.ts --imports_from [EXTRACTED context=import]--> document.queue.ts at=src/workers/document.worker.ts:L6
EDGE enqueueDocument() --calls [EXTRACTED context=call]--> getDocumentQueue() at=src/queues/document.queue.ts:L16
EDGE upload.ts --imports_from [EXTRACTED context=import]--> extractor.ts at=src/routes/upload.ts:L5
EDGE document-processing.ts --imports [EXTRACTED context=import]--> extractText() at=src/services/document-processing.ts:L1
EDGE document-processing.ts --contains [EXTRACTED]--> processDocument() at=src/services/document-processing.ts:L23
EDGE processDocument() --calls [EXTRACTED context=call]--> extractText() at=src/services/document-processing.ts:L25
EDGE worker --calls [EXTRACTED context=call]--> processDocument() at=src/workers/document.worker.ts:L10
EDGE extractFromDocx() --calls [EXTRACTED context=call]--> parseDocx() at=src/services/extractor.ts:L121
EDGE extractFromDocx() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L123
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromDocx() at=src/services/extractor.ts:L101
EDGE extractFromImage() --calls [EXTRACTED context=call]--> preprocessImage() at=src/services/extractor.ts:L147
EDGE extractFromImage() --calls [EXTRACTED context=call]--> getOcrWorker() at=src/services/extractor.ts:L158
EDGE extractFromImage() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L160
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromImage() at=src/services/extractor.ts:L105
EDGE extractFromPdf() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L113
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromPdf() at=src/services/extractor.ts:L98
EDGE extractFromXlsx() --calls [EXTRACTED context=call]--> parseXlsx() at=src/services/extractor.ts:L132
EDGE extractFromXlsx() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L134
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromXlsx() at=src/services/extractor.ts:L103
EDGE extractText() --calls [EXTRACTED context=call]--> isSupportedMimeType() at=src/services/extractor.ts:L92
EDGE extractor.test.ts --imports [EXTRACTED context=import]--> extractText() at=tests/unit/extractor.test.ts:L3
EDGE preprocess.ts --contains [EXTRACTED]--> preprocessImage() at=src/services/ocr/preprocess.ts:L3
EDGE docx.ts --contains [EXTRACTED]--> parseDocx() at=src/services/parsers/docx.ts:L13
EDGE xlsx.ts --contains [EXTRACTED]--> parseXlsx() at=src/services/parsers/xlsx.ts:L4

## 3. Mapa de Dependencias Directas
Graph: graphify-out/graph.json (184 nodes) | Traversal: BFS depth=2 | Start: ['src/**/*', 'IMPORTANT: keep the reminder string free of backticks and $(...) constructs.', 'closeOcrWorker()'] | 37 nodes found

[i] Complete answer over budget: all 37 nodes and 61 edges shown (~3089 tokens vs the requested ~2000-token budget). Edges are never dropped once every node fits, so this is already the full answer — raising --budget further will not shrink it. Narrow with context_filter=['call'] or use get_node for a specific symbol to reduce size instead.

NODE src/**/* [src=tsconfig.json loc=L13 community=compilerOptions]
NODE IMPORTANT: keep the reminder string free of backticks and $(...) constructs. [src=.opencode/plugins/graphify.js loc=L4 community=graphify.js]
NODE closeOcrWorker() [src=src/services/extractor.ts loc=L184 community=extractor.ts]
NODE extractor.ts [src=src/services/extractor.ts loc=L1 community=extractor.ts]
NODE upload.ts [src=src/routes/upload.ts loc=L1 community=upload.ts]
NODE graphify.js [src=.opencode/plugins/graphify.js loc=L1 community=graphify.js]
NODE include [src=tsconfig.json loc=L13 community=compilerOptions]
NODE document-processing.ts [src=src/services/document-processing.ts loc=L1 community=upload.ts]
NODE document.queue.ts [src=src/queues/document.queue.ts loc=L1 community=upload.ts]
NODE extractText() [src=src/services/extractor.ts loc=L75 community=extractor.ts]
NODE app.ts [src=src/app.ts loc=L1 community=upload.ts]
NODE processDocument() [src=src/services/document-processing.ts loc=L23 community=upload.ts]
NODE extractFromImage() [src=src/services/extractor.ts loc=L143 community=extractor.ts]
NODE normalizeText() [src=src/services/extractor.ts loc=L59 community=extractor.ts]
NODE docx.ts [src=src/services/parsers/docx.ts loc=L1 community=extractor.ts]
NODE getDocumentQueue() [src=src/queues/document.queue.ts loc=L8 community=upload.ts]
NODE extractFromDocx() [src=src/services/extractor.ts loc=L120 community=extractor.ts]
NODE extractFromXlsx() [src=src/services/extractor.ts loc=L131 community=extractor.ts]
NODE parseDocx() [src=src/services/parsers/docx.ts loc=L13 community=extractor.ts]
NODE xlsx.ts [src=src/services/parsers/xlsx.ts loc=L1 community=extractor.ts]
NODE enqueueDocument() [src=src/queues/document.queue.ts loc=L15 community=upload.ts]
NODE extractFromPdf() [src=src/services/extractor.ts loc=L110 community=extractor.ts]
NODE isSupportedMimeType() [src=src/services/extractor.ts loc=L191 community=extractor.ts]
NODE preprocessImage() [src=src/services/ocr/preprocess.ts loc=L3 community=extractor.ts]
NODE parseXlsx() [src=src/services/parsers/xlsx.ts loc=L4 community=extractor.ts]
NODE tsconfig.json [src=tsconfig.json loc=L1 community=compilerOptions]
NODE router [src=src/routes/upload.ts loc=L9 community=upload.ts]
NODE getOcrWorker() [src=src/services/extractor.ts loc=L47 community=extractor.ts]
NODE preprocess.ts [src=src/services/ocr/preprocess.ts loc=L1 community=extractor.ts]
NODE extractor.test.ts [src=tests/unit/extractor.test.ts loc=L1 community=extractor.ts]
NODE GraphifyPlugin() [src=.opencode/plugins/graphify.js loc=L12 community=graphify.js]
NODE upload [src=src/routes/upload.ts loc=L12 community=upload.ts]
NODE DOCX_MIME_TYPES [src=src/services/extractor.ts loc=L37 community=extractor.ts]
NODE DOCX_MIMES [src=src/services/extractor.ts loc=L35 community=extractor.ts]
NODE ExtractResult [src=src/services/extractor.ts loc=L21 community=extractor.ts]
NODE IMAGE_MIMES [src=src/services/extractor.ts loc=L43 community=extractor.ts]
NODE SupportedMimeType [src=src/services/extractor.ts loc=L9 community=extractor.ts]
EDGE IMPORTANT: keep the reminder string free of backticks and $(...) constructs. --rationale_for [EXTRACTED]--> graphify.js at=.opencode/plugins/graphify.js:L4
EDGE include --extends [EXTRACTED context=import]--> src/**/* at=tsconfig.json:L13
EDGE upload.ts --imports [EXTRACTED context=import]--> closeOcrWorker() at=src/routes/upload.ts:L5
EDGE extractor.ts --contains [EXTRACTED]--> closeOcrWorker() at=src/services/extractor.ts:L184
EDGE upload.ts --imports [EXTRACTED context=import]--> isSupportedMimeType() at=src/routes/upload.ts:L4
EDGE upload.ts --imports [EXTRACTED context=import]--> enqueueDocument() at=src/routes/upload.ts:L6
EDGE upload.ts --imports [EXTRACTED context=import]--> getDocumentQueue() at=src/routes/upload.ts:L6
EDGE upload.ts --imports [EXTRACTED context=import]--> processDocument() at=src/routes/upload.ts:L7
EDGE app.ts --imports_from [EXTRACTED context=import]--> upload.ts at=src/app.ts:L3
EDGE upload.ts --imports_from [EXTRACTED context=import]--> document.queue.ts at=src/routes/upload.ts:L6
EDGE upload.ts --imports_from [EXTRACTED context=import]--> document-processing.ts at=src/routes/upload.ts:L7
EDGE upload.ts --contains [EXTRACTED]--> upload at=src/routes/upload.ts:L12
EDGE upload.ts --contains [EXTRACTED]--> router at=src/routes/upload.ts:L9
EDGE extractor.ts --imports [EXTRACTED context=import]--> parseDocx() at=src/services/extractor.ts:L4
EDGE extractor.ts --imports [EXTRACTED context=import]--> parseXlsx() at=src/services/extractor.ts:L5
EDGE extractor.ts --imports [EXTRACTED context=import]--> preprocessImage() at=src/services/extractor.ts:L6
EDGE document-processing.ts --imports_from [EXTRACTED context=import]--> extractor.ts at=src/services/document-processing.ts:L1
EDGE extractor.ts --imports_from [EXTRACTED context=import]--> docx.ts at=src/services/extractor.ts:L4
EDGE extractor.ts --imports_from [EXTRACTED context=import]--> xlsx.ts at=src/services/extractor.ts:L5
EDGE extractor.ts --imports_from [EXTRACTED context=import]--> preprocess.ts at=src/services/extractor.ts:L6
EDGE extractor.test.ts --imports_from [EXTRACTED context=import]--> extractor.ts at=tests/unit/extractor.test.ts:L3
EDGE extractor.ts --contains [EXTRACTED]--> extractFromPdf() at=src/services/extractor.ts:L110
EDGE extractor.ts --contains [EXTRACTED]--> extractFromDocx() at=src/services/extractor.ts:L120
EDGE extractor.ts --contains [EXTRACTED]--> extractFromXlsx() at=src/services/extractor.ts:L131
EDGE extractor.ts --contains [EXTRACTED]--> extractFromImage() at=src/services/extractor.ts:L143
EDGE extractor.ts --contains [EXTRACTED]--> isSupportedMimeType() at=src/services/extractor.ts:L191
EDGE extractor.ts --contains [EXTRACTED]--> ExtractResult at=src/services/extractor.ts:L21
EDGE extractor.ts --contains [EXTRACTED]--> DOCX_MIMES at=src/services/extractor.ts:L35
EDGE extractor.ts --contains [EXTRACTED]--> DOCX_MIME_TYPES at=src/services/extractor.ts:L37
EDGE extractor.ts --contains [EXTRACTED]--> IMAGE_MIMES at=src/services/extractor.ts:L43
EDGE extractor.ts --contains [EXTRACTED]--> getOcrWorker() at=src/services/extractor.ts:L47
EDGE extractor.ts --contains [EXTRACTED]--> normalizeText() at=src/services/extractor.ts:L59
EDGE extractor.ts --contains [EXTRACTED]--> extractText() at=src/services/extractor.ts:L75
EDGE extractor.ts --contains [EXTRACTED]--> SupportedMimeType at=src/services/extractor.ts:L9
EDGE tsconfig.json --contains [EXTRACTED]--> include at=tsconfig.json:L13
EDGE graphify.js --contains [EXTRACTED]--> GraphifyPlugin() at=.opencode/plugins/graphify.js:L12
EDGE app.ts --imports [EXTRACTED context=import]--> router at=src/app.ts:L3
EDGE document.queue.ts --contains [EXTRACTED]--> enqueueDocument() at=src/queues/document.queue.ts:L15
EDGE document.queue.ts --contains [EXTRACTED]--> getDocumentQueue() at=src/queues/document.queue.ts:L8
EDGE enqueueDocument() --calls [EXTRACTED context=call]--> getDocumentQueue() at=src/queues/document.queue.ts:L16
EDGE upload.ts --imports_from [EXTRACTED context=import]--> extractor.ts at=src/routes/upload.ts:L5
EDGE document-processing.ts --imports [EXTRACTED context=import]--> extractText() at=src/services/document-processing.ts:L1
EDGE document-processing.ts --contains [EXTRACTED]--> processDocument() at=src/services/document-processing.ts:L23
EDGE processDocument() --calls [EXTRACTED context=call]--> extractText() at=src/services/document-processing.ts:L25
EDGE extractFromDocx() --calls [EXTRACTED context=call]--> parseDocx() at=src/services/extractor.ts:L121
EDGE extractFromDocx() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L123
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromDocx() at=src/services/extractor.ts:L101
EDGE extractFromImage() --calls [EXTRACTED context=call]--> preprocessImage() at=src/services/extractor.ts:L147
EDGE extractFromImage() --calls [EXTRACTED context=call]--> getOcrWorker() at=src/services/extractor.ts:L158
EDGE extractFromImage() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L160
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromImage() at=src/services/extractor.ts:L105
EDGE extractFromPdf() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L113
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromPdf() at=src/services/extractor.ts:L98
EDGE extractFromXlsx() --calls [EXTRACTED context=call]--> parseXlsx() at=src/services/extractor.ts:L132
EDGE extractFromXlsx() --calls [EXTRACTED context=call]--> normalizeText() at=src/services/extractor.ts:L134
EDGE extractText() --calls [EXTRACTED context=call]--> extractFromXlsx() at=src/services/extractor.ts:L103
EDGE extractText() --calls [EXTRACTED context=call]--> isSupportedMimeType() at=src/services/extractor.ts:L92
EDGE extractor.test.ts --imports [EXTRACTED context=import]--> extractText() at=tests/unit/extractor.test.ts:L3
EDGE preprocess.ts --contains [EXTRACTED]--> preprocessImage() at=src/services/ocr/preprocess.ts:L3
EDGE docx.ts --contains [EXTRACTED]--> parseDocx() at=src/services/parsers/docx.ts:L13
EDGE xlsx.ts --contains [EXTRACTED]--> parseXlsx() at=src/services/parsers/xlsx.ts:L4

## 4. Flujo de Procesamiento de Documentos
Graph: graphify-out/graph.json (184 nodes) | Traversal: BFS depth=2 | Start: ['Gestor-Inteligente-de-Documentos', 'Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)'] | 9 nodes found

NODE Gestor-Inteligente-de-Documentos [src=README.md loc=L1 community=Reglas del proyecto]
NODE Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) [src=PROJECT_CONTEXT.md loc=L1 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE README.md [src=README.md loc=L1 community=Reglas del proyecto]
NODE PROJECT_CONTEXT.md [src=PROJECT_CONTEXT.md loc=L1 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE 1. Objetivo y Alcance [src=PROJECT_CONTEXT.md loc=L3 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE 2. Estado Actual (Avance 1 - COMPLETADO) [src=PROJECT_CONTEXT.md loc=L13 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE 3. Pendientes Inmediatos (Avance 2 - Semanas 5-6) [src=PROJECT_CONTEXT.md loc=L20 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE 4. Reglas de Interacción con Aider [src=PROJECT_CONTEXT.md loc=L27 community=Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT)]
NODE Reglas del proyecto [src=README.md loc=L3 community=Reglas del proyecto]
EDGE README.md --contains [EXTRACTED]--> Gestor-Inteligente-de-Documentos at=README.md:L1
EDGE PROJECT_CONTEXT.md --contains [EXTRACTED]--> Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) at=PROJECT_CONTEXT.md:L1
EDGE Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) --contains [EXTRACTED]--> 2. Estado Actual (Avance 1 - COMPLETADO) at=PROJECT_CONTEXT.md:L13
EDGE Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) --contains [EXTRACTED]--> 3. Pendientes Inmediatos (Avance 2 - Semanas 5-6) at=PROJECT_CONTEXT.md:L20
EDGE Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) --contains [EXTRACTED]--> 4. Reglas de Interacción con Aider at=PROJECT_CONTEXT.md:L27
EDGE Contexto del Proyecto: Gestor Inteligente de Documentos (SUNAT) --contains [EXTRACTED]--> 1. Objetivo y Alcance at=PROJECT_CONTEXT.md:L3
EDGE README.md --contains [EXTRACTED]--> Reglas del proyecto at=README.md:L3

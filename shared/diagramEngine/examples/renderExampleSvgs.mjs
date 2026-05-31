import fs from 'fs';
import path from 'path';
import { allDiagramExamples } from './diagramExamples.js';
import { renderDiagramSpec } from '../diagramRenderer.js';

const outputDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'svg');
fs.mkdirSync(outputDir, { recursive: true });

allDiagramExamples.forEach((spec) => {
  const { svg } = renderDiagramSpec(spec);
  const fileName = `${spec.id}_${spec.type}.svg`;
  fs.writeFileSync(path.join(outputDir, fileName), svg, 'utf8');
});

console.log(`Rendered ${allDiagramExamples.length} SVG examples to ${outputDir}`);

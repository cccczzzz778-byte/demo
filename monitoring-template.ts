import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import c0 from './monitoring-template/chunk0.ts';
import c1 from './monitoring-template/chunk1.ts';
import c2 from './monitoring-template/chunk2.ts';
import c3 from './monitoring-template/chunk3.ts';
import c4 from './monitoring-template/chunk4.ts';
import c5 from './monitoring-template/chunk5.ts';
import c6 from './monitoring-template/chunk6.ts';

export const MONITORING_TEMPLATE_MARKER='BUXORO_SSB_MONITORING_TEMPLATE_V1';
const EXPECTED_SHA256='333fce0b46cd46549f83a359d7fa9d5e2e6328994d27c1b45ef89cab41a5da29';
const TEMPLATE_HTML=brotliDecompressSync(Buffer.from(c0+c1+c2+c3+c4+c5+c6,'base64')).toString('utf8');
const templateHash=createHash('sha256').update(TEMPLATE_HTML).digest('hex');
if(templateHash!==EXPECTED_SHA256)throw new Error(`Monitoring template checksum mismatch: ${templateHash}`);

export function getMonitoringDashboardHtml():string{return TEMPLATE_HTML}

export function prepareMonitoringDashboardHtml(nonce:string):string{
  let html=TEMPLATE_HTML;
  if(!html.includes(MONITORING_TEMPLATE_MARKER)){
    html=html.replace('</head>',`<meta name="buxoro-monitoring-template" content="${MONITORING_TEMPLATE_MARKER}"></head>`);
  }
  if(nonce){
    html=html.replace('<style>',`<style nonce="${nonce}">`);
    html=html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',`<script nonce="${nonce}" src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>`);
    html=html.replace('<script>',`<script nonce="${nonce}">`);
  }
  return html;
}

import { createHash } from 'node:crypto';
import { MONITORING_TEMPLATE_V2_BASE64, MONITORING_TEMPLATE_V2_SHA256 } from './monitoring-template-v2-data.ts';
import { patchTvPresentationModes } from './tv-presentation-patch.ts';

export const MONITORING_TEMPLATE_MARKER='BUXORO_SSB_MONITORING_TEMPLATE_V2';
const TEMPLATE_HTML=Buffer.from(MONITORING_TEMPLATE_V2_BASE64,'base64').toString('utf8');
const templateHash=createHash('sha256').update(TEMPLATE_HTML).digest('hex');
if(templateHash!==MONITORING_TEMPLATE_V2_SHA256){
  console.warn(`Monitoring template checksum metadata drift: expected ${MONITORING_TEMPLATE_V2_SHA256}, got ${templateHash}. Serving embedded v2 template.`);
}

export function getMonitoringDashboardHtml():string{return TEMPLATE_HTML}

export function prepareMonitoringDashboardHtml(nonce:string):string{
  let html=patchTvPresentationModes(TEMPLATE_HTML);
  if(!html.includes(MONITORING_TEMPLATE_MARKER)){
    html=html.replace('</head>',`<meta name="buxoro-monitoring-template" content="${MONITORING_TEMPLATE_MARKER}"></head>`);
  }
  html=html.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
    `<script${nonce?` nonce="${nonce}"`:''} src="/assets/three-r128.min.js"></script>`,
  );
  if(nonce){
    html=html.replace('<style>',`<style nonce="${nonce}">`);
    html=html.replace('<script>',`<script nonce="${nonce}">`);
    html=html.replaceAll('__CSP_NONCE__',nonce);
  }
  return html;
}

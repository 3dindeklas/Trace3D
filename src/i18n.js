import { translations } from './translations.js';
export const supportedLanguages=['nl','en','de','fr'];
export function resolveLanguage(preference='auto',languages=[]){if(supportedLanguages.includes(preference))return preference;for(const value of languages){const base=value.toLowerCase().split(/[-_]/)[0];if(supportedLanguages.includes(base))return base;}return 'en';}
let preference='auto';try{preference=localStorage.getItem('trace3d-language')||'auto';}catch{}
if(!['auto',...supportedLanguages].includes(preference))preference='auto';
let language=resolveLanguage(preference,globalThis.navigator?.languages||[globalThis.navigator?.language||'en']);
export function t(source,params={}){let value=language==='nl'?source:translations[source]?.[language]||source;for(const [key,v] of Object.entries(params))value=value.replaceAll(`{${key}}`,v);return value;}
export const number=value=>new Intl.NumberFormat(language,{maximumFractionDigits:1}).format(value);
export function initLanguages(onChange){
 const texts=[],attributes=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode;if(node.parentElement?.closest('script,style,select'))continue;const source=node.textContent.trim();if(translations[source])texts.push({node,source,prefix:node.textContent.match(/^\s*/)[0],suffix:node.textContent.match(/\s*$/)[0]});}
 for(const node of document.querySelectorAll('[title],[aria-label]'))for(const key of ['title','aria-label'])if(translations[node.getAttribute(key)])attributes.push({node,key,source:node.getAttribute(key)});
 const select=document.getElementById('languageSelect');
 function apply(){document.documentElement.lang=language;document.title=t('Teken naar 3D')+' · 3dindeklas';for(const {node,source,prefix,suffix} of texts)if(node.isConnected)node.textContent=prefix+t(source)+suffix;for(const {node,key,source} of attributes)if(node.isConnected)node.setAttribute(key,t(source));select.querySelector('[value=auto]').textContent=t('Automatisch');select.value=preference;}
 select.addEventListener('change',()=>{preference=select.value;language=resolveLanguage(preference,navigator.languages||[navigator.language]);try{localStorage.setItem('trace3d-language',preference);}catch{}apply();onChange();});
 apply();
}

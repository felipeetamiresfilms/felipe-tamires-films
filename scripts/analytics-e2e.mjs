// Teste de privacidade/consentimento das ferramentas de análise (Etapa 2).
// Chrome DevTools Protocol puro — sem dependências.
//
// Nada sai da máquina: toda coleta (GA4/Clarity) é interceptada e respondida
// com 204; o gtm.js é substituído por um stub que reproduz o contêiner
// documentado em docs/analytics-gtm.md. O gtag.js do GA4 e o Clarity reais
// são baixados — o teste reflete a configuração atual das propriedades.
//
// Uso:
//   1. build:  NEXT_PUBLIC_ANALYTICS_ENABLED=true NEXT_PUBLIC_GTM_ID=GTM-53VX7GCV \
//              NEXT_PUBLIC_GA4_ID=G-75L5HQTG1E NEXT_PUBLIC_CLARITY_PROJECT_ID=yxo7ozj3ak \
//              npm run build && PORT=3100 npm start
//      (para o modo "disabled", build sem essas variáveis)
//   2. Chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//              --headless=new --remote-debugging-port=9333 --user-data-dir=/tmp/ftf-chrome
//   3. node scripts/analytics-e2e.mjs enabled|disabled [pasta-do-log]
//
// Atenção: com sessão ativa o GA4 envia hits em lote (~5–7 s); os cenários
// esperam isso antes de medir.
import { writeFileSync } from "node:fs";

const MODE = process.argv[2] ?? "enabled";
const OUT = process.argv[3] ?? "/tmp";
const BASE = process.env.FTF_BASE ?? "http://localhost:3100";
const GA4 = "G-75L5HQTG1E";
// Assinatura das finalidades configuradas no build testado (ver consent.ts).
const PURPOSES = process.env.FTF_PURPOSES ?? (MODE === "ga-only" ? "a" : "ae");

// Stub que reproduz o contêiner configurado no GTM (espaço de trabalho):
//  - "FTF - Google Tag": Tag do Google, send_page_view=false, acionador
//    Initialization - All Pages (1x/página) -> entra na fila logo após gtm.js,
//    ANTES do gtag('set') da página (mesma ordem de processamento do GTM);
//  - "FTF - GA4 Page View": evento page_view em ftf_page_view com
//    page_tracked == true; parâmetros page_location/page_path/page_referrer/page_title.
const GTM_STUB = `(function(){var ID='${GA4}',dl=window.dataLayer=window.dataLayer||[],i=0;
function args(){return arguments}
var init=dl.findIndex(function(e){return e&&e.event==='gtm.js'});
dl.splice(init+1,0,args('js',new Date()),args('config',ID,{send_page_view:false}));
var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.appendChild(s);
function gtag(){dl.push(arguments)}
window.__ftfStubPageViews=0;
function scan(){for(;i<dl.length;i++){var e=dl[i];if(e&&e.event==='ftf_page_view'&&String(e.page_tracked)==='true'){
gtag('event','page_view',{send_to:ID,page_location:e.page_location,page_path:e.page_path,page_referrer:e.page_referrer,page_title:e.page_title});window.__ftfStubPageViews++;}}}
scan();setInterval(scan,50);})();`;

const TRACKER = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|clarity\.ms|doubleclick\.net|bing\.com|google\.com\/(ccm|g\/collect|pagead)/i;

const target = await (await fetch("http://127.0.0.1:9333/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
const listeners = new Set();
const log = { scripts: [], collects: [], docs: [] };

ws.addEventListener("message", async (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (msg.method === "Network.requestWillBeSent") {
    const { request, type, loaderId } = msg.params;
    if (TRACKER.test(request.url) && type === "Script") log.scripts.push({ url: request.url, loaderId });
    else if (COLLECT.test(request.url)) log.collects.push({ url: request.url, body: request.postData ?? "", loaderId, t: Date.now() });
  }
  if (msg.method === "Page.frameNavigated" && !msg.params.frame.parentId) {
    log.docs.push({ url: msg.params.frame.url, loaderId: msg.params.frame.loaderId });
  }
  if (msg.method === "Fetch.requestPaused") {
    const { requestId, request } = msg.params;
    if (/googletagmanager\.com\/gtm\.js/.test(request.url)) {
      send("Fetch.fulfillRequest", { requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/javascript" }], body: Buffer.from(GTM_STUB).toString("base64") });
    } else {
      send("Fetch.fulfillRequest", { requestId, responseCode: 204, responseHeaders: [] });
    }
  }
  for (const l of listeners) l(msg);
});

function send(method, params = {}) {
  return new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, (m) => (m.error ? rej(new Error(method + ": " + m.error.message)) : res(m.result)));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(expr.slice(0, 80) + " -> " + r.exceptionDetails.text);
  return r.result.value;
}
function waitLoad(timeout = 15000) {
  return new Promise((res) => {
    const t = setTimeout(() => { listeners.delete(h); res(false); }, timeout);
    const h = (m) => { if (m.method === "Page.loadEventFired") { clearTimeout(t); listeners.delete(h); res(true); } };
    listeners.add(h);
  });
}
async function goto(path, wait = 2500) { const l = waitLoad(); await send("Page.navigate", { url: BASE + path }); await l; await sleep(wait); }
async function setConsent(analytics, experience, p = PURPOSES) {
  await send("Network.deleteCookies", { name: "ftf_consent", url: BASE });
  if (analytics === null) return;
  const value = encodeURIComponent(JSON.stringify({ v: 1, p, ts: Date.now(), analytics, experience }));
  await send("Network.setCookie", { name: "ftf_consent", value, url: BASE, path: "/", sameSite: "Lax" });
}
async function trackerCookies() {
  const { cookies } = await send("Network.getAllCookies");
  return cookies.filter((c) => /^_ga|^_cl|^_uet|^MUID|^CLID|^ANONCHK|^MR$|^SM$/.test(c.name)).map((c) => `${c.name}@${c.domain}`);
}
async function clearTrackerState() {
  const { cookies } = await send("Network.getAllCookies");
  for (const c of cookies) await send("Network.deleteCookies", { name: c.name, domain: c.domain, path: c.path });
}
// Atribuição por DOCUMENTO (loaderId): o GA4 envia em lote, às vezes só no
// pagehide — janelas de tempo atribuiriam hits ao cenário errado.
let docMark = 0;
const extra = new Set();
async function currentLoader() { const { frameTree } = await send("Page.getFrameTree"); return frameTree.frame.loaderId; }
/** Novo cenário: descarrega o documento anterior (envia o que estava pendente). */
async function scenario() { const l = waitLoad(); await send("Page.navigate", { url: "about:blank" }); await l; await sleep(1500); docMark = log.docs.length; extra.clear(); }
/** Documentos visitados no cenário (exceto about:blank). */
function docs() { return log.docs.slice(docMark).filter((d) => d.url !== "about:blank"); }
/** Força os envios pendentes e devolve o que os documentos do cenário fizeram. */
async function result() {
  const ids = new Set([...docs().map((d) => d.loaderId), ...extra]);
  // O GA4 agrupa hits (~5–7 s com sessão ativa) e o headless não dispara o
  // envio de pagehide como um navegador real: espera o lote antes de sair.
  await sleep(9000);
  const l = waitLoad(); await send("Page.navigate", { url: "about:blank" }); await l; await sleep(2500);
  return { scripts: log.scripts.filter((x) => ids.has(x.loaderId)), collects: log.collects.filter((x) => ids.has(x.loaderId)), docs: docs() };
}
const byDoc = (r, pred) => { const ids = new Set(r.docs.filter(pred).map((d) => d.loaderId)); return { scripts: r.scripts.filter((x) => ids.has(x.loaderId)), collects: r.collects.filter((x) => ids.has(x.loaderId)) }; };
function parseGa(c) {
  const u = new URL(c.url);
  const shared = Object.fromEntries(u.searchParams);
  const lines = c.body ? c.body.split("\n").filter(Boolean) : [""];
  return lines.map((l) => ({ ...shared, ...Object.fromEntries(new URLSearchParams(l)) }));
}
function gaEvents(collects) {
  return collects.filter((c) => /\/g\/collect/.test(c.url)).flatMap(parseGa).map((e) => ({ en: e.en, dl: e.dl, dr: e.dr ?? "", dt: e.dt, gcs: e.gcs, path: e.dp ?? e["ep.page_path"] })); // o gtag envia page_path como `dp`
}
const clarityHits = (collects) => collects.filter((c) => /clarity\.ms/.test(c.url));
const gtmScripts = (s) => s.filter((x) => /gtm\.js/.test(x.url)).length;
const gtagScripts = (s) => s.filter((x) => /gtag\/js/.test(x.url)).length;
const clarityScripts = (s) => s.filter((x) => /clarity\.ms/.test(x.url)).length;

const COLLECT = /\/g\/collect|clarity\.ms\/(collect|c\.gif)|report\.clarity\.ms|bing\.com|doubleclick\.net|google\.com\/ccm/i;
const safe = (x) => { try { return decodeURIComponent(x); } catch { return x; } };
const results = [];
function check(name, ok, info = "") { results.push(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  — " + info : ""}`); }
function note(name, info) { results.push(`INFO  ${name}  — ${info}`); }
const PRIVATE = /assistir|meus-filmes|backstage|token/i;

await send("Page.enable"); await send("Network.enable"); await send("Runtime.enable");
await send("Fetch.enable", { patterns: [
  { urlPattern: "*googletagmanager.com/gtm.js*" },
  { urlPattern: "*google-analytics.com*" }, { urlPattern: "*analytics.google.com*" },
  { urlPattern: "*://www.google.com/ccm*" }, { urlPattern: "*://www.google.com/g/collect*" }, { urlPattern: "*doubleclick.net*" },
  { urlPattern: "*clarity.ms/collect*" }, { urlPattern: "*c.clarity.ms/*" }, { urlPattern: "*report.clarity.ms/*" }, { urlPattern: "*bing.com*" }, { urlPattern: "*://wa.me/*" },
] });
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
const pv = (r) => gaEvents(r.collects).filter((e) => e.en === "page_view");
const banner = () => ev(`!!document.querySelector('section[aria-labelledby]')`);
const noGlobals = () => ev(`window.__ftfTrackers === undefined && window.dataLayer === undefined && window.clarity === undefined`);
let r;

if (MODE === "disabled") {
  await scenario(); await clearTrackerState(); await setConsent(true, true);
  await goto("/"); await goto("/filmes", 4000);
  check("Chave-mestra desligada + consentimento total: nenhum objeto de ferramenta", await noGlobals());
  r = await result();
  check("Chave-mestra desligada: 0 scripts", r.scripts.length === 0, r.scripts.map((x) => x.url).join(", "));
  check("Chave-mestra desligada: 0 coletas", r.collects.length === 0);
  check("Chave-mestra desligada: 0 cookies de rastreamento", (await trackerCookies()).length === 0);
  await scenario(); await setConsent(null);
  await goto("/", 2500);
  check("Sem ferramenta configurada: sem banner e sem painel", !(await banner()) && !(await ev(`!!document.querySelector('dialog')`)));
  check("Sem ferramenta configurada: rodapé sem 'Preferências de cookies', com a política", !(await ev(`[...document.querySelectorAll('footer button')].some(b=>b.textContent.includes('Preferências'))`)) && (await ev(`!!document.querySelector('footer a[href="/privacidade"]')`)));
  await goto("/privacidade", 2500);
  check("/privacidade: indexável, canonical correto, sem rascunho, sem botão de preferências", (await ev(`!document.querySelector('meta[name=robots]')?.content?.includes('noindex') && document.querySelector('link[rel=canonical]')?.href.endsWith('/privacidade') && !document.body.textContent.includes('Rascunho') && !document.querySelector('article button')`)));
  check("/privacidade: sem pendências, nome empresarial e CNPJ corretos", (await ev(`document.querySelectorAll('mark').length === 0 && !/\\[A (confirmar|preencher)\\]/.test(document.body.textContent) && document.body.textContent.includes('65.934.066 TAMIRES DOS SANTOS DE OLIVEIRA') && document.body.textContent.includes('65.934.066/0001-02')`)));
  check("sitemap.xml inclui /privacidade", (await (await fetch(BASE + "/sitemap.xml")).text()).includes("/privacidade</loc>"));
  console.log(results.join("\n")); process.exit(0);
}

if (MODE === "ga-only") {
  await scenario(); await clearTrackerState(); await setConsent(null);
  await goto("/", 3000);
  const text = await ev(`document.querySelector('section[aria-labelledby]')?.textContent ?? ''`);
  check("Só GA4: banner fala apenas de estatísticas", text.includes("estatísticas de navegação") && !/experiência/i.test(text), text.slice(0, 160));
  await ev(`[...document.querySelectorAll('section[aria-labelledby] button')].find(b=>b.textContent==='Personalizar').click()`);
  await sleep(400);
  const cats = await ev(`JSON.stringify([...document.querySelectorAll('dialog h3')].map(h=>h.textContent))`);
  check("Só GA4: painel com Necessários + Estatísticas (sem Análise de experiência)", cats === JSON.stringify(["Necessários", "Estatísticas"]) && (await ev(`document.querySelectorAll('dialog [role=switch]').length`)) === 1, cats);
  await ev(`[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Aceitar todos').click()`);
  await sleep(5000);
  const rec = await ev(`JSON.parse(decodeURIComponent(document.cookie.match(/ftf_consent=([^;]+)/)[1]))`);
  check("Só GA4: 'Aceitar' concede só Estatísticas (p=a)", rec.analytics === true && rec.experience === false && rec.p === "a", JSON.stringify(rec));
  check("Só GA4: GTM carregado, Clarity inexistente", (await ev(`document.querySelectorAll('script[src*="gtm.js"]').length`)) === 1 && (await ev(`window.clarity === undefined`)));
  await ev(`[...document.querySelectorAll('footer button')].find(b=>b.textContent==='Preferências de cookies').click()`);
  await sleep(400);
  const tW = Date.now();
  { const l = waitLoad(); await ev(`[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Rejeitar opcionais').click()`); await l; await sleep(4000); }
  r = await result();
  check("Só GA4: 1 page_view antes da retirada; 0 coletas depois; Clarity nunca carregado", pv(r).length === 1 && log.collects.filter((c) => c.t >= tW).length === 0 && clarityScripts(r.scripts) === 0, `pv=${pv(r).length}`);
  check("Só GA4: após a retirada, documento sem ferramentas e sem _ga", (await trackerCookies()).length === 0);
  console.log(results.join("\n"));
  console.log(`\n${results.filter((x) => x.startsWith("FAIL")).length} falha(s) em ${results.filter((x) => !x.startsWith("INFO")).length} verificações`);
  process.exit(0);
}

// 1. Sem escolha
await scenario(); await clearTrackerState(); await setConsent(null);
await goto("/", 4000);
check("Sem escolha: banner visível", await banner());
check("Sem escolha: nada enfileirado (dataLayer/clarity inexistentes)", await noGlobals());
r = await result();
check("Sem escolha: 0 scripts, 0 coletas, 0 cookies", r.scripts.length === 0 && r.collects.length === 0 && (await trackerCookies()).length === 0, r.scripts.map((x) => x.url).join(", "));

// 2. Rejeitar tudo (UI)
await scenario(); await clearTrackerState(); await setConsent(null);
await goto("/", 2000);
await ev(`[...document.querySelectorAll('section[aria-labelledby] button')].find(b=>b.textContent==='Rejeitar').click()`);
await sleep(2500);
await goto("/filmes", 3000);
check("Rejeitar: nada enfileirado", await noGlobals());
r = await result();
check("Rejeitar: 0 scripts, 0 coletas, 0 cookies", r.scripts.length === 0 && r.collects.length === 0 && (await trackerCookies()).length === 0);

// 3. Só Estatísticas + navegação client-side
await scenario(); await clearTrackerState(); await setConsent(true, false);
await goto("/", 4000);
const homeLoader = await currentLoader();
const shape = await ev(`JSON.stringify(window.dataLayer.filter(e=>e&&e.event==='ftf_page_view').map(e=>({tracked:e.page_tracked,types:Object.fromEntries(Object.entries(e).filter(([k])=>!k.startsWith('gtm.')).map(([k,v])=>[k,typeof v]))})))`);
check("dataLayer: 1 ftf_page_view, page_tracked booleano true, demais campos string", /^\[\{"tracked":true,"types":\{"event":"string","page_tracked":"boolean","page_location":"string","page_path":"string","page_referrer":"string","page_title":"string","page_type":"string"\}\}\]$/.test(shape), shape);
check("Só Estatísticas: Clarity inexistente", await ev(`window.clarity === undefined`));
const consentQueue = await ev(`JSON.stringify(window.dataLayer.filter(e=>e&&e[0]==='consent').map(e=>[e[1],e[2]]))`);
check("Consent Mode: default negado -> update só analytics, antes do gtm.js",
  /^\[\["default",\{"ad_storage":"denied","ad_user_data":"denied","ad_personalization":"denied","analytics_storage":"denied"/.test(consentQueue) &&
  consentQueue.endsWith('["update",{"analytics_storage":"granted"}]]') &&
  (await ev(`window.dataLayer.findIndex(e=>e&&e[0]==='consent'&&e[1]==='default') < window.dataLayer.findIndex(e=>e&&e.event==='gtm.js')`)), consentQueue);
const c3 = await trackerCookies();
check("Só Estatísticas: cookies _ga, nenhum do Clarity", c3.some((c) => c.startsWith("_ga")) && !c3.some((c) => /^_cl|^_uet/.test(c)), c3.join(", "));
await ev(`document.querySelector('header a[href="/filmes"]').click()`);
await sleep(3500);
check("SPA: mesmo documento", (await currentLoader()) === homeLoader);
check("SPA: GTM injetado 1x no documento", (await ev(`document.querySelectorAll('script[src*="gtm.js"]').length`)) === 1);
r = await result();
check("Só Estatísticas: gtm.js 1x, gtag.js carregado, Clarity não", gtmScripts(r.scripts) === 1 && gtagScripts(r.scripts) >= 1 && clarityScripts(r.scripts) === 0 && clarityHits(r.collects).length === 0, `gtm=${gtmScripts(r.scripts)} gtag=${gtagScripts(r.scripts)} clarity=${clarityScripts(r.scripts)}`);
let views = pv(r);
check("page_view da carga: higienizado, analytics concedido e publicidade negada", views.some((e) => e.dl === BASE + "/" && e.dt === "Início" && /^G1.1$/.test(e.gcs ?? "")), JSON.stringify(views[0]));
check("page_view da navegação SPA: /filmes, título genérico, referrer = página anterior", views.some((e) => e.dl === BASE + "/filmes" && e.dt === "Filmes" && e.dr === BASE + "/"), JSON.stringify(views));
check("page_path enviado e coerente com page_location", views.length === 2 && views.every((e) => e.path === new URL(e.dl).pathname), JSON.stringify(views.map((e) => e.path)));
check("Exatamente 2 page_view (carga + 1 navegação), sem duplicatas", views.length === 2, `${views.length}: ${JSON.stringify(views.map((e) => [e.dl, e.dr, e.dt]))}`);
note("Eventos GA4 do documento", JSON.stringify(gaEvents(r.collects).map((e) => e.en)));

// 3b. Voltar dentro da navegação client-side (mesmo documento)
await scenario(); await setConsent(true, false);
await goto("/", 4000);
await ev(`document.querySelector('header a[href="/filmes"]').click()`);
await sleep(2500);
await ev(`history.back()`);
await sleep(3500);
check("Voltar (SPA): de volta a / no mesmo documento", (await ev(`location.pathname`)) === "/" && docs().length === 1);
r = await result();
views = pv(r);
check("Voltar (SPA): 3 page_view (/, /filmes, /), sem duplicatas", views.length === 3 && views.map((e) => e.path).join(",") === "/,/filmes,/" && views[2].dr === BASE + "/filmes", JSON.stringify(views.map((e) => [e.path, e.dr])));

// 3c. Métrica otimizada do GA4: rolagem + clique de saída não podem gerar eventos
await scenario(); await setConsent(true, false);
await goto("/", 4000);
await ev(`window.scrollTo(0, document.documentElement.scrollHeight)`);
await sleep(2500);
// wa.me é interceptado (204): o clique é real, mas nada chega ao WhatsApp.
await ev(`(()=>{const a=document.querySelector('a[href*="wa.me"]');a.setAttribute('target','_self');a.click();return true})()`);
await sleep(4000);
r = await result();
const em = gaEvents(r.collects).map((e) => e.en);
check("Métrica otimizada: só page_view (sem scroll/click/form/video/download/histórico)", em.filter((n) => n === "page_view").length === 1 && !em.some((n) => /^(scroll|click|file_download|form_start|form_submit|video_|view_search_results)/.test(n)), JSON.stringify(em));
check("Clique no WhatsApp: mensagem/URL do wa.me não aparece em nenhuma coleta", !r.collects.some((c) => /wa\.me|whatsapp/i.test(safe(c.url) + c.body)));

// 4. Só Análise de experiência
await scenario(); await clearTrackerState(); await setConsent(false, true);
await goto("/", 7000);
check("Só Experiência: GA/GTM inexistentes (dataLayer)", await ev(`window.dataLayer === undefined`));
const c4 = await trackerCookies();
check("Só Experiência: cookie _clck, nenhum _ga", c4.some((c) => c.startsWith("_clck")) && !c4.some((c) => c.startsWith("_ga")), c4.join(", "));
r = await result();
check("Só Experiência: Clarity carregado; GTM/gtag não; 0 coletas GA", clarityScripts(r.scripts) >= 1 && gtmScripts(r.scripts) === 0 && gtagScripts(r.scripts) === 0 && gaEvents(r.collects).length === 0, r.scripts.map((x) => x.url).join(", "));
check("Só Experiência: Clarity enviou coleta", clarityHits(r.collects).length > 0, `${clarityHits(r.collects).length} req`);

// 5. Ambos
await scenario(); await clearTrackerState(); await setConsent(true, true);
await goto("/", 7000);
r = await result();
check("Ambos: GTM 1x + Clarity; coletas dos dois; 1 page_view", gtmScripts(r.scripts) === 1 && clarityScripts(r.scripts) >= 1 && clarityHits(r.collects).length > 0 && pv(r).length === 1, `pv=${pv(r).length} clarity=${clarityHits(r.collects).length}`);

// 6. Retirada (ambos -> rejeitar opcionais pelo rodapé)
await scenario(); await setConsent(true, true);
await goto("/", 7000);
await ev(`[...document.querySelectorAll('footer button')].find(b=>b.textContent==='Preferências de cookies').click()`);
await sleep(400);
const reloaded = waitLoad();
const tWithdraw = Date.now();
await ev(`[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Rejeitar opcionais').click()`);
check("Retirada: página recarregada", await reloaded);
await sleep(5000);
check("Retirada: documento novo sem ferramentas", await noGlobals());
const c6 = await trackerCookies();
check("Retirada: cookies primários _ga/_clck/_clsk apagados", !c6.some((c) => /^_ga|^_clck|^_clsk/.test(c) && c.includes("localhost")), c6.join(", ") || "nenhum");
note("Cookies de terceiros remanescentes (domínio da Microsoft, fora do alcance do site)", c6.filter((c) => !c.includes("localhost")).join(", ") || "nenhum");
await goto("/filmes", 3000);
r = await result();
const after = log.collects.filter((c) => c.t >= tWithdraw);
check("Retirada: 0 coletas a partir do clique (inclui unload/beacons)", after.length === 0, after.map((c) => c.url.slice(0, 70)).join(" | "));
check("Retirada: documentos seguintes sem scripts", r.docs.length >= 3 && r.docs.slice(1).every((d) => !r.scripts.some((x) => x.loaderId === d.loaderId)), `${r.docs.length - 1} documentos após a retirada`);

// 7. Recarregar: 1 page_view por carga + query higienizada
await scenario(); await clearTrackerState(); await setConsent(true, false);
await goto("/pacotes?evento=casamento&utm_source=instagram&utm_campaign=outubro&email=fulano@x.com&fbclid=abc&token=xyz", 4000);
{ const l = waitLoad(); await send("Page.reload"); await l; await sleep(4000); }
r = await result();
views = pv(r);
check("Reload: 2 documentos -> 2 page_view", views.length === 2, JSON.stringify(views.map((e) => e.dl)));
check("Query higienizada: só evento validado + utm_*", views.every((e) => e.dl === BASE + "/pacotes?utm_source=instagram&utm_campaign=outubro&evento=casamento"), views[0]?.dl);

// 8. 404 em rota rastreável
await scenario(); await setConsent(true, false);
await goto("/filmes/slug-que-nao-existe-123", 4000);
r = await result();
views = pv(r);
check("404: reportado como /404, título genérico", views.length === 1 && views[0].path === "/404" && views[0].dl === BASE + "/404" && views[0].dt === "Página não encontrada", JSON.stringify(views));

// 9. Público -> /privacidade (fora da allowlist)
await scenario(); await setConsent(true, true);
await goto("/", 4000);
{ const l = waitLoad(); await ev(`document.querySelector('footer a[href="/privacidade"]').click()`); await l; await sleep(5000); }
check("/privacidade: documento novo, sem ferramentas", (await ev(`location.pathname`)) === "/privacidade" && (await noGlobals()));
r = await result();
const priv9 = byDoc(r, (d) => d.url.endsWith("/privacidade"));
check("/privacidade: 0 scripts e 0 coletas do documento", r.docs.some((d) => d.url.endsWith("/privacidade")) && priv9.scripts.length === 0 && priv9.collects.length === 0);

// 10. Áreas privadas: acesso direto
for (const path of ["/assistir/slug-teste-inexistente", "/meus-filmes/token-teste-inexistente", "/backstage-ft/login"]) {
  await scenario(); await setConsent(true, true);
  await goto(path, 5000);
  const ok = !(await banner()) && (await noGlobals()) && (await ev(`document.querySelector('meta[name=referrer]')?.content`)) === "strict-origin";
  r = await result();
  check(`${path}: sem banner/ferramentas, referrer strict-origin, 0 scripts, 0 coletas`, ok && r.scripts.length === 0 && r.collects.length === 0);
}

// 10b. Privado -> público -> Voltar
await scenario(); await setConsent(true, true);
await goto("/assistir/slug-teste-inexistente", 2000);
{ const l = waitLoad(); await ev(`document.querySelector('a[href="/"]').click()`); await l; await sleep(6000); }
check("Privado -> público: document.referrer só com a origem", (await ev(`document.referrer`)) === BASE + "/", await ev(`document.referrer`));
{
  const hist = await send("Page.getNavigationHistory");
  const l = waitLoad(); await send("Page.navigateToHistoryEntry", { entryId: hist.entries[hist.currentIndex - 1].id }); await l; await sleep(5000);
}
check("Voltar -> privado: outro documento, sem ferramentas", (await ev(`location.pathname`)).startsWith("/assistir") && (await noGlobals()));
r = await result();
const pub10 = byDoc(r, (d) => new URL(d.url).pathname === "/");
const prv10 = byDoc(r, (d) => d.url.includes("/assistir/"));
check("Privado -> público: page_view com referrer só de origem", pv({ collects: pub10.collects }).some((e) => e.dl === BASE + "/" && e.dr === BASE), JSON.stringify(pv({ collects: pub10.collects })));
check("Documentos privados (ida e volta): 0 scripts e 0 coletas", prv10.scripts.length === 0 && prv10.collects.length === 0 && r.docs.filter((d) => d.url.includes("/assistir/")).length >= 2, `${r.docs.filter((d) => d.url.includes("/assistir/")).length} docs privados`);

// 11. Failsafe: entrada privada no MESMO documento via history (não ocorre na UI)
await scenario(); await setConsent(true, true);
await goto("/", 7000);
extra.add(await currentLoader());
{ const l = waitLoad(); await ev(`history.pushState(history.state,'','/assistir/forcado-no-mesmo-doc'); history.pushState(history.state,'','/'); history.back();`); await l; await sleep(5000); }
check("Failsafe: popstate para rota privada recarrega e o novo documento não tem ferramentas", (await ev(`location.pathname`)) === "/assistir/forcado-no-mesmo-doc" && (await noGlobals()));
r = await result();
const leak11 = r.collects.filter((c) => PRIVATE.test(safe(c.url + c.body)));
check("Failsafe: nenhuma coleta com caminho privado", leak11.length === 0, leak11.map((c) => c.url.slice(0, 80)).join(" | "));
check("Failsafe: documento privado com 0 scripts/coletas", byDoc(r, (d) => d.url.includes("/assistir/")).collects.length === 0 && byDoc(r, (d) => d.url.includes("/assistir/")).scripts.length === 0);

// 11b. Nova finalidade: escolha feita quando só havia Estatísticas (p=a)
await scenario(); await clearTrackerState(); await setConsent(true, false, "a");
await goto("/", 3000);
check("Nova finalidade: escolha antiga (p=a) é renovada — banner volta e nada carrega", (await banner()) && (await noGlobals()));
r = await result();
check("Nova finalidade: 0 scripts e 0 coletas até nova escolha", r.scripts.length === 0 && r.collects.length === 0);

// 12. GPC
await scenario(); await clearTrackerState(); await setConsent(null);
const gpc = await send("Page.addScriptToEvaluateOnNewDocument", { source: "Object.defineProperty(Navigator.prototype,'globalPrivacyControl',{get:()=>true})" });
await goto("/", 4000);
check("GPC: sem banner, nada enfileirado", !(await banner()) && (await noGlobals()));
await ev(`[...document.querySelectorAll('footer button')].find(b=>b.textContent==='Preferências de cookies').click()`);
await sleep(300);
check("GPC: painel informa o sinal", await ev(`document.querySelector('dialog').textContent.includes('Global Privacy Control')`));
r = await result();
check("GPC: 0 scripts, 0 coletas", r.scripts.length === 0 && r.collects.length === 0);
await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: gpc.identifier });

// 13. Desktop, ambos
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await scenario(); await clearTrackerState(); await setConsent(true, true);
await goto("/", 7000);
r = await result();
check("Desktop: GTM 1x, Clarity com coleta, 1 page_view", gtmScripts(r.scripts) === 1 && clarityHits(r.collects).length > 0 && pv(r).length === 1, `gtm=${gtmScripts(r.scripts)} clarity=${clarityHits(r.collects).length} pv=${pv(r).length}`);

// Varredura global de tudo que foi interceptado
const all = gaEvents(log.collects);
const titles = [...new Set(all.map((e) => e.dt).filter(Boolean))];
check("Global: nenhum dl/dr com caminho privado em hits GA4", !all.some((e) => PRIVATE.test(`${e.dl} ${e.dr}`)));
check("Global: títulos só genéricos", titles.every((t) => ["Início", "Filmes", "Filme", "Pacotes", "Recomendamos", "Parceiro recomendado", "Página não encontrada"].includes(t)), titles.join(" | "));
check("Global: nenhuma coleta (GA ou Clarity) com caminho privado/token/e-mail", !log.collects.some((c) => /assistir|meus-filmes|backstage|token|fulano|fbclid|%40/i.test(safe(c.url) + c.body)));
note("Eventos GA4 vistos (todos os cenários)", JSON.stringify([...new Set(all.map((e) => e.en))]));
note("Total", `${log.scripts.length} scripts de ferramentas, ${log.collects.length} requisições de coleta interceptadas (nenhuma saiu da máquina)`);
writeFileSync(`${OUT}/analytics-e2e-log.json`, JSON.stringify(log, null, 1));
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("FAIL")).length} falha(s) em ${results.filter((r) => !r.startsWith("INFO")).length} verificações`);
process.exit(0);

# Analytics — configurações manuais (GA4, GTM, Clarity, Netlify)

O código do site **não** configura as plataformas. Este guia lista o que precisa
ser feito à mão para a integração da Etapa 2 funcionar como foi testada.

**Não publique** o contêiner do GTM nem ative a variável
`NEXT_PUBLIC_ANALYTICS_ENABLED` em produção antes de a política de
privacidade ser finalizada e aprovada.

Os nomes de menus podem variar conforme as plataformas atualizam suas
interfaces. O que importa é o efeito descrito em cada passo.

---

## Como o site decide o que carrega (resumo)

| Escolha do visitante | GTM / GA4 | Clarity |
|---|---|---|
| Sem escolha, Rejeitar, ou sinal GPC/DNT | não carrega | não carrega |
| Só Estatísticas | carrega | não carrega |
| Só Análise de experiência | não carrega | carrega |
| Ambas | carrega | carrega |

- Só nas rotas `/`, `/filmes`, `/filmes/[slug]`, `/pacotes`, `/recomendamos` e
  `/recomendamos/[slug]`. Nunca em `/assistir`, `/meus-filmes`, `/backstage-ft`,
  `/privacidade` ou em qualquer rota nova não incluída explicitamente.
- O site grava o Consent Mode (`default` com tudo negado e depois `update` só de
  `analytics_storage`) **antes** de injetar o `gtm.js`. A publicidade fica
  sempre negada.
- A cada página, o site envia ao `dataLayer`:

  ```js
  { event: "ftf_page_view", page_tracked: true,      // booleano
    page_location, page_path, page_referrer, page_title, page_type } // strings
  ```

  Junto, executa `gtag('set', { page_location, page_referrer, page_title })`.
  Os valores já vêm higienizados: só parâmetros `utm_*` e `evento`, títulos
  genéricos, `/404` em páginas inexistentes e referrer só com a origem.
- O Clarity é carregado **pelo site**, não pelo GTM.

---

## 1. Google Analytics 4 — corrigir antes de tudo

Verificado em 14/10/2026: a configuração publicada de `G-75L5HQTG1E` **não**
corresponde ao esperado.

### 1.1 Medição otimizada
Caminho: Admin → Fluxos de dados → (fluxo da Web) → Medição otimizada.

- Mantenha **Visualizações de página** ligado.
- Abra a engrenagem de Visualizações de página e **desmarque** "Mudanças de
  página com base em eventos do histórico de navegação".
- **Desligue** Rolagens, Cliques de saída, Pesquisa no site, Interações com
  formulários, Engajamento com vídeos e Downloads de arquivos.

O clique de saída é o item mais crítico. O link do WhatsApp leva a mensagem
pré-preenchida na URL, e essa mensagem pode conter o título do evento.

### 1.2 Coleta de dados fornecidos pelo usuário
Hoje está **ativa, com detecção automática de e-mail, telefone e endereço**.
Desligue:
- Admin → Coleta de dados → "Coleta de dados fornecidos pelo usuário";
- e, nas configurações da tag do Google do fluxo, a detecção automática de
  dados fornecidos pelo usuário.

### 1.3 Demais ajustes
- Indicadores do Google: manter **desativado**. Hoje já está bloqueado em todas
  as regiões; confirme.
- Personalização de anúncios: desativada. Não vincular Google Ads.
- Retenção de dados: escolha o prazo (2 ou 14 meses) e registre-o na política.
- Configurações de dados granulares de local e dispositivo: decisão sua. Se não
  forem necessárias, desative.

### 1.4 Como verificar
As alterações levam alguns minutos para propagar. Depois disso:

```sh
curl -s "https://www.googletagmanager.com/gtag/js?id=G-75L5HQTG1E" \
  | grep -o '"vtp_enable[A-Za-z]*":[a-z]*\|"vtp_isAutoEnabled":[a-z]*\|"vtp_isEnabled":[a-z]*'
```

Esperado: `vtp_enablePageView:true`, e todos os outros `vtp_enable*`, além de
`vtp_isAutoEnabled` e `vtp_isEnabled`, como `false`. Em 14/10/2026 estavam
todos `true`.

---

## 2. Google Tag Manager — `GTM-53VX7GCV`

Hoje o contêiner tem a versão 1 publicada, **vazia** (sem tags). Monte tudo num
espaço de trabalho e **não publique** até a aprovação.

### 2.1 Configurações do contêiner
Admin → Configurações do contêiner → marque **"Ativar visão geral do
consentimento"**.

### 2.2 Variáveis
Crie em Variáveis definidas pelo usuário → Nova → **Variável da camada de
dados**, versão 2:

| Nome da variável | Nome da variável da camada de dados |
|---|---|
| `DLV - page_location` | `page_location` |
| `DLV - page_path` | `page_path` |
| `DLV - page_referrer` | `page_referrer` |
| `DLV - page_title` | `page_title` |
| `DLV - page_tracked` | `page_tracked` |

(`page_type` também é enviado e pode virar variável/parâmetro no futuro.)

### 2.3 Acionador
Nome: **`FTF - Page View`**
- Tipo: **Evento personalizado**
- Nome do evento: `ftf_page_view`, sem regex
- Este acionador é disparado em: **Alguns eventos personalizados** →
  `DLV - page_tracked` **igual a** `true`

### 2.4 Tag 1 — Tag do Google
Nome: **`FTF - Google Tag`**
- Tipo: **Tag do Google**. ID da tag: `G-75L5HQTG1E`
- Configurações → Parâmetro de configuração: `send_page_view` = `false`
- Configurações avançadas → Configurações de consentimento → **Exigir
  consentimento adicional para a tag disparar**: `analytics_storage`
- Opções de disparo da tag: **Uma vez por página**
- Acionamento: **Initialization - All Pages** (configuração adotada em
  14/10/2026). É seguro porque o `gtm.js` só existe em página da allowlist,
  com consentimento, e porque o `send_page_view=false` faz a tag apenas
  configurar, sem enviar hit. Testado: o `gtag('set')` da página chega antes
  do primeiro hit.

### 2.5 Tag 2 — Evento page_view
Nome: **`FTF - GA4 Page View`**
- Tipo: **Google Analytics: evento do GA4**. ID de métricas: `G-75L5HQTG1E`
- Nome do evento: `page_view`
- Parâmetros do evento:

  | Parâmetro | Valor |
  |---|---|
  | `page_location` | `{{DLV - page_location}}` |
  | `page_path` | `{{DLV - page_path}}` (o gtag o envia como `dp`) |
  | `page_referrer` | `{{DLV - page_referrer}}` |
  | `page_title` | `{{DLV - page_title}}` |

- Consentimento: **Exigir consentimento adicional**: `analytics_storage`
- Opções de disparo da tag: **Uma vez por evento**
- Sequenciamento de tags: **Disparar uma tag antes** → `FTF - Google Tag`;
  não disparar se ela falhar ou estiver pausada
- Acionamento: `FTF - Page View`

### 2.6 O que NÃO criar
Nenhum destes itens pode existir no contêiner:
- acionadores amplos em outras tags: "Todas as páginas", "Inicialização do
  consentimento", "Alteração no histórico", "Cliques",
  "Rolagem", "Visibilidade do elemento" ou "Envio de formulário";
- tags de consentimento: o site já faz o `default` e o `update`;
- tags ou modelos do Microsoft Clarity: ele é carregado pelo site e
  duplicaria a instalação;
- Google Ads, Vinculador de conversões, Floodlight ou remarketing;
- tags HTML personalizadas.

### 2.7 Testar antes de publicar
1. Rode `npm run dev` (lê `.env.development.local`, que só existe na sua
   máquina e liga a chave-mestra apenas em dev) e abra o **Visualizar** do GTM
   apontando para `http://localhost:3000/`, com "incluir sinal de depuração na
   URL" marcado.
2. Aceite **Estatísticas** no banner. O Tag Assistant só conecta depois disso,
   porque o GTM não carrega antes.
3. Confira:
   - em cada página, um único `ftf_page_view` com `GA4 - Google tag` (só no
     primeiro) e `GA4 - page_view` disparadas;
   - em Consentimento: `analytics_storage` concedido e `ad_*` negados.
4. Navegue entre Início, Filmes e Pacotes: um `page_view` por página, sem
   duplicatas. No GA4 → DebugView, os títulos devem ser genéricos ("Início",
   "Filmes", "Filme"…).

---

## 3. Microsoft Clarity — `yxo7ozj3ak`

- **Mascaramento: Strict.** Confirmado na configuração publicada
  (`content: false`).
- **Consentimento de cookies:** se houver a opção de exigir consentimento
  ("cookie consent"), ative-a. O site só carrega o Clarity depois do
  consentimento e envia `consentv2` concedido; essa opção é uma proteção
  adicional.
- **Não** ative a integração com o Google Analytics, e não instale o Clarity
  por GTM, plugin ou outro snippet. Ele deve ter uma única instalação, pelo
  site.
- **Microsoft Advertising:** a configuração publicada lista os cookies
  `_uetvid` e `_uetmsclkid` (UET). Confirme que não há vínculo com Microsoft
  Ads ou integração de anúncios ativa. Se não for usar, mantenha desligado.
- **Bloqueio de IP:** adicione os IPs da equipe, para não gravar o próprio uso.

---

## 4. Netlify — variáveis de ambiente (só na liberação)

Em Site configuration → Environment variables, com escopo **Production**:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | `true` (somente Production) |
| `NEXT_PUBLIC_GTM_ID` | `GTM-53VX7GCV` |
| `NEXT_PUBLIC_GA4_ID` | `G-75L5HQTG1E` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | `yxo7ozj3ak` |

Deploy Previews e Branch deploys **não** devem ter
`NEXT_PUBLIC_ANALYTICS_ENABLED`. Como as variáveis `NEXT_PUBLIC_*` entram no
build, alterá-las exige um novo deploy.

---

## 5. Testes automatizados

[`scripts/analytics-e2e.mjs`](../scripts/analytics-e2e.mjs) roda a matriz de
consentimento × rotas em Chrome headless. Toda coleta é interceptada, então
nada chega ao Google ou à Microsoft. As instruções de uso estão no topo do
arquivo.

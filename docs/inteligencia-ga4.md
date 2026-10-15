# Inteligência — conectar a Google Analytics Data API

A seção **Backstage → Inteligência → Relatórios** lê os números do GA4 pela
Google Analytics Data API, **só no servidor**. Enquanto as variáveis abaixo
não existirem, o painel mostra "Integração com o GA4 ainda não configurada" —
nenhum número é exibido.

A API apenas **lê** relatórios: não envia eventos e não altera a coleta do
site (GTM/GA4/consentimento continuam como estão).

## 1. Google Cloud
1. Em https://console.cloud.google.com, crie (ou escolha) um projeto.
2. **APIs e serviços → Biblioteca** → ative **Google Analytics Data API**.
3. **IAM e administrador → Contas de serviço → Criar conta de serviço**
   (ex.: `ftf-inteligencia`). Não é preciso dar papéis do Google Cloud.
4. Na conta criada: **Chaves → Adicionar chave → Criar nova chave → JSON**.
   O arquivo baixado é um segredo: **nunca** o coloque no repositório, em
   código, em chat ou em e-mail. Guarde-o fora da pasta do projeto.

## 2. Google Analytics 4
1. **Administrador → Gerenciamento de acesso à propriedade → +** e adicione o
   e-mail da conta de serviço (`…@….iam.gserviceaccount.com`) com a função
   **Leitor**. Nada além disso.
2. O **ID numérico da propriedade** é `558916123` e já está no código
   (`GA4_PROPERTY_ID_DEFAULT`). Não confundir com o ID de medição
   `G-75L5HQTG1E`.

## 3. Variáveis de ambiente (somente servidor)

| Variável | Valor | De onde vem |
|---|---|---|
| `GA4_PROPERTY_ID` | *opcional* — sobrescreve o padrão `558916123` | GA4 → Detalhes da propriedade |
| `GA4_CLIENT_EMAIL` | e-mail da conta de serviço | campo `client_email` do JSON |
| `GA4_PRIVATE_KEY` | chave privada | campo `private_key` do JSON (com os `\n`) |

**Netlify** (Site configuration → Environment variables):
- marque cada uma como **secreta** ("Contains secret values"), quando a opção
  existir;
- escopo: **Functions** (o painel roda no servidor por requisição; não precisa
  estar no build);
- contexto: **Production** (e, se quiserem testar, Deploy Previews);
- nunca com prefixo `NEXT_PUBLIC_`.
- Atenção: as funções da Netlify têm limite de ~4 KB para o total das
  variáveis disponíveis em runtime. A chave privada ocupa ~1,7 KB — por isso
  ela vai sozinha em `GA4_PRIVATE_KEY`, sem o JSON inteiro.
- Depois de cadastrar, faça um novo deploy.

**Local** (`.env.local`, ignorado pelo git):

```
GA4_CLIENT_EMAIL=ftf-inteligencia@seu-projeto.iam.gserviceaccount.com
GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 4. Como o painel usa a API
- 5 relatórios numa única chamada `batchRunReports` por período (7/30/90 dias
  completos, até ontem), comparados com o mesmo número de dias anterior.
- Cache de 15 minutos no servidor; erros não são guardados em cache.
- Métricas: `activeUsers`, `sessions`, `screenPageViews`,
  `userEngagementDuration` (engajamento médio = duração ÷ usuários ativos),
  `engagedSessions`. Dimensões: `date`, `pagePath`,
  `sessionDefaultChannelGroup`, `sessionSource`, `sessionMedium`,
  `sessionSourceMedium`, `sessionCampaignName`.
- Mensagens distintas para: não configurado, falha de autenticação, sem
  permissão / ID errado, cota esgotada, consulta recusada, falha de conexão e
  ausência de dados.

## 5. Segurança
- Se a chave vazar: desative-a no Google Cloud (Contas de serviço → Chaves) e
  gere outra.
- A conta de serviço só tem **Leitor** no GA4; não acessa nada mais.
- Prefira gerar a chave apenas quando for cadastrá-la e apague o arquivo JSON
  local depois.

import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_PHONE_E164, buildWhatsAppUrl } from "@/config/site";
import { OG_BASE } from "@/config/seo";
import { ConsentPreferencesButton } from "@/components/consent/ConsentPreferencesButton";
import { ctaSecondaryClass } from "@/components/public/cta";

/**
 * Política de privacidade — versão 1.0.
 *
 * Só descreve práticas confirmadas pela empresa ou implementadas no site.
 *
 * Analytics: o texto vale tanto antes quanto depois da ativação — as
 * ferramentas opcionais são descritas como condicionadas à autorização, e
 * o painel só mostra as que estiverem configuradas no build.
 */
const DESCRIPTION = `Como a ${SITE_NAME} trata dados pessoais no atendimento, na entrega dos filmes e neste site.`;

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: DESCRIPTION,
  alternates: { canonical: "/privacidade" },
  openGraph: {
    ...OG_BASE,
    type: "website",
    url: "/privacidade",
    title: `Política de privacidade · ${SITE_NAME}`,
    description: DESCRIPTION,
  },
};

// Data da última atualização do texto (não da vigência): ajuste se a
// publicação acontecer depois de uma nova revisão.
const VERSION = "Versão 1.0 · atualizada em 14 de outubro de 2026";
const CNPJ = "65.934.066/0001-02";
const LEGAL_NAME = "65.934.066 TAMIRES DOS SANTOS DE OLIVEIRA";
const EMAIL = "felipeetamiresfilms@gmail.com";

const PHONE_DISPLAY = SITE_PHONE_E164.replace(
  /^\+55(\d{2})(\d{5})(\d{4})$/,
  "+55 ($1) $2-$3",
);

const linkClass =
  "text-bone underline decoration-brass/50 underline-offset-4 transition-colors hover:decoration-brass focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="flex scroll-mt-10 flex-col gap-4">
      <h2
        id={`${id}-t`}
        className="font-display text-2xl font-light leading-tight text-bone sm:text-3xl"
      >
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-bone-dim sm:text-base [&_h3]:pt-2 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:uppercase [&_h3]:tracking-[0.18em] [&_h3]:text-brass [&_strong]:font-medium [&_strong]:text-bone [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_li]:marker:text-brass/70">
        {children}
      </div>
    </section>
  );
}

function Table({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline">
      {/* Só a tabela larga (cookies) rola na horizontal no celular. */}
      <table
        className={`w-full text-left text-[13px] leading-relaxed ${head.length > 2 ? "min-w-[34rem]" : ""}`}
      >
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface text-xs uppercase tracking-[0.16em] text-brass">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-hairline align-top">
              {row.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="px-4 py-3 font-normal text-bone">
                    {cell}
                  </th>
                ) : (
                  <td key={j} className="px-4 py-3">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PURPOSES: React.ReactNode[][] = [
  [
    "Responder contatos e preparar orçamentos",
    "Procedimentos preliminares a um contrato (art. 7º, V)",
  ],
  [
    "Planejar, registrar, editar e entregar os filmes contratados",
    "Execução de contrato (art. 7º, V)",
  ],
  [
    "Formalizar contratos, registrar pagamentos e cumprir obrigações fiscais",
    "Cumprimento de obrigação legal (art. 7º, II) e exercício regular de direitos (art. 7º, VI)",
  ],
  [
    "Divulgar filmes e imagens no portfólio público",
    "Autorização específica, prevista em cláusula contratual (art. 7º, I)",
  ],
  [
    "Manter o site funcionando e seguro",
    "Legítimo interesse (art. 7º, IX)",
  ],
  [
    "Guardar sua escolha sobre cookies, para poder respeitá-la e demonstrá-la",
    "Cumprimento de obrigação legal (art. 7º, II)",
  ],
  [
    "Estatísticas de navegação das páginas públicas",
    "Consentimento (art. 7º, I) — só com a sua autorização",
  ],
];

const COOKIES: React.ReactNode[][] = [
  [
    <code key="c" className="font-mono text-xs">ftf_consent</code>,
    "Necessário",
    "Guardar a sua escolha sobre cookies opcionais.",
    "6 meses",
    SITE_NAME,
  ],
  [
    "Cookies de login",
    "Necessário — só na área administrativa",
    "Manter a sessão da equipe autenticada. Não são gravados para visitantes.",
    "Enquanto durar a sessão",
    SITE_NAME,
  ],
  [
    <code key="g" className="font-mono text-xs">_ga, _ga_&lt;ID&gt;</code>,
    "Estatísticas (opcional)",
    "Distinguir visitas, de forma agregada, no Google Analytics. Só são gravados se você autorizar.",
    "Até 2 anos",
    "Google",
  ],
];

const VENDORS: React.ReactNode[][] = [
  ["Netlify", "Hospedagem deste site"],
  ["Supabase", "Banco de dados do site e armazenamento das imagens (como capas)"],
  ["Railway", "Hospedagem do nosso sistema de atendimento (CRM)"],
  ["MongoDB Atlas", "Banco de dados do sistema de atendimento (CRM)"],
  ["Autentique", "Assinatura eletrônica e guarda dos contratos"],
  [
    "Google",
    "YouTube (hospedagem e exibição dos filmes), Google Drive (arquivos para download) e, somente com sua autorização, Google Tag Manager e Google Analytics",
  ],
  ["WhatsApp (Meta)", "Conversas de atendimento iniciadas por você"],
];

export default function PrivacidadePage() {
  return (
    <article className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-8 sm:py-24">
      <div className="flex flex-col gap-14">
        <header className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.32em] text-brass">
            Privacidade
          </span>
          <h1 className="font-display font-light leading-[1.05] text-bone [font-size:clamp(2.25rem,5vw,3.5rem)]">
            Política de privacidade
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-bone-dim">
            {VERSION}
          </p>
          <p className="text-sm leading-relaxed text-bone-dim sm:text-base">
            A gente trabalha com memórias — e cuida delas, e dos dados de quem
            confia esse trabalho a nós, com o mesmo carinho. Esta política
            explica, de forma direta, quais dados pessoais tratamos no
            atendimento, na produção e entrega dos filmes e neste site; para
            quê; com quem; e como você exerce seus direitos, conforme a Lei
            Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>

          <div className="mt-2 flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-5 text-sm leading-relaxed text-bone-dim">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-brass">
              Em resumo
            </p>
            <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-brass/70">
              <li>
                Usamos seus dados para conversar com você, preparar propostas,
                realizar o seu evento e entregar os seus filmes.
              </li>
              <li>
                Estatísticas de navegação são opcionais, só funcionam com a sua
                autorização e nunca nas páginas privadas de entrega de filmes.
              </li>
              <li>
                Filmes e imagens só vão para o portfólio público com autorização
                específica no contrato.
              </li>
              <li>
                Você pode pedir acesso, correção ou exclusão dos seus dados pelo
                e-mail{" "}
                <a href={`mailto:${EMAIL}`} className={linkClass}>
                  {EMAIL}
                </a>
                .
              </li>
            </ul>
          </div>
        </header>

        <Section id="quem-somos" title="1. Quem somos">
          <p>
            A <strong>{SITE_NAME}</strong> é uma produtora de filmes de eventos
            — casamentos, aniversários, festas de 15 anos e outras
            celebrações. {SITE_NAME} é a marca utilizada pela empresa
            individual <strong>{LEGAL_NAME}</strong>, inscrita no CNPJ sob nº{" "}
            {CNPJ}, microempreendedora individual (MEI) estabelecida no Rio
            Grande do Sul, Brasil, responsável (controladora) pelo tratamento
            dos dados descritos aqui.
          </p>
          <ul>
            <li>
              E-mail (inclusive para assuntos de privacidade):{" "}
              <a href={`mailto:${EMAIL}`} className={linkClass}>
                {EMAIL}
              </a>
            </li>
            <li>
              WhatsApp:{" "}
              <a
                href={buildWhatsAppUrl("Olá! Tenho uma dúvida sobre privacidade e meus dados.")}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {PHONE_DISPLAY}
              </a>
            </li>
            <li>Site: felipeetamiresfilms.com.br</li>
          </ul>
          <p>
            Para qualquer assunto de proteção de dados, fale diretamente com a
            gente por esses canais.
          </p>
        </Section>

        <Section id="abrangencia" title="2. A quem esta política se aplica">
          <ul>
            <li>
              <strong>Visitantes</strong> das páginas públicas do site: início,
              filmes, pacotes, recomendações e esta página.
            </li>
            <li>
              <strong>Pessoas que entram em contato</strong> para conhecer o
              trabalho ou pedir um orçamento.
            </li>
            <li>
              <strong>Clientes</strong> que contratam os nossos serviços e
              recebem os filmes por páginas privadas de entrega.
            </li>
            <li>
              <strong>Pessoas que aparecem nos filmes</strong>, como
              convidados e familiares presentes nos eventos registrados.
            </li>
          </ul>
          <p>
            Ela não cobre sites e aplicativos de terceiros acessados a partir
            daqui — como WhatsApp, YouTube e os perfis dos profissionais e
            lugares indicados em &ldquo;Recomendamos&rdquo; —, que têm políticas
            próprias.
          </p>
        </Section>

        <Section id="dados" title="3. Quais dados tratamos">
          <h3>Navegação no site</h3>
          <p>
            Para entregar as páginas e as imagens, o provedor de hospedagem e o
            serviço de armazenamento de imagens recebem dados técnicos de cada
            acesso, como endereço IP, tipo de navegador e data e hora. Também
            guardamos, no seu navegador, a sua escolha sobre cookies. Se você
            autorizar, coletamos estatísticas de navegação (seção 8).
          </p>

          <h3>Atendimento e orçamentos</h3>
          <p>
            Quando você fala com a gente — principalmente pelo WhatsApp —,
            tratamos o que for necessário para responder e preparar uma
            proposta: nome, telefone, e-mail (quando informado), tipo de
            evento, data, local e outras informações que você compartilhar
            sobre o que imagina para o dia.
          </p>

          <h3>Clientes e contratos</h3>
          <p>
            Ao contratar, os dados acima passam a fazer parte do seu cadastro,
            junto com informações do evento, do contrato e dos pagamentos. Na
            captação comercial habitual, pedimos apenas informações de contato
            e do evento, sem exigir CPF ou documentos de identificação.
            Contratos e outros processos, porém, podem envolver dados
            adicionais necessários à sua formalização.
          </p>

          <h3>Filmes e imagens</h3>
          <p>
            O nosso trabalho é registrar o evento: os filmes e imagens contêm a
            imagem e a voz de quem estava presente — clientes, familiares e
            convidados. Esse material é tratado para produzir e entregar os
            filmes contratados e, apenas com autorização específica, para
            compor o portfólio público (seção 6).
          </p>
        </Section>

        <Section id="finalidades" title="4. Para que usamos e com qual base legal">
          <Table
            caption="Finalidades e bases legais"
            head={["Finalidade", "Base legal (LGPD)"]}
            rows={PURPOSES}
          />
          <p>
            Quando o tratamento depende do seu consentimento, você pode
            retirá-lo a qualquer momento — o que não afeta o que foi feito
            antes da retirada.
          </p>
        </Section>

        <Section id="atendimento" title="5. Atendimento, contratos e fornecedores">
          <p>
            Os contatos chegam principalmente pelo WhatsApp. As conversas
            seguem também as regras do próprio WhatsApp. Para organizar
            contatos, orçamentos, eventos e o histórico de atendimento, usamos
            um sistema interno de relacionamento (CRM), com acesso restrito a
            usuários autorizados.
          </p>
          <p>
            Os contratos são assinados e guardados eletronicamente na
            plataforma Autentique, que trata os dados necessários à assinatura
            conforme a política dela.
          </p>
          <p>
            Para tudo isso, contamos com fornecedores que tratam dados em nosso
            nome ou quando você interage com eles. Os principais são:
          </p>
          <Table
            caption="Principais fornecedores"
            head={["Fornecedor", "Para quê"]}
            rows={VENDORS}
          />
          <p>
            Essa lista reúne os principais fornecedores ligados às atividades
            descritas aqui; ela não é necessariamente exaustiva e pode mudar
            com o tempo. Dados também podem ser compartilhados com autoridades
            públicas quando houver obrigação legal. Nos perfis de &ldquo;Recomendamos&rdquo;, o
            botão de contato leva ao WhatsApp do próprio parceiro — essa
            conversa não passa pela {SITE_NAME}.
          </p>

          <h3>Transferência internacional</h3>
          <p>
            Vários desses fornecedores mantêm servidores ou operações fora do
            Brasil, por exemplo nos Estados Unidos. Por isso, alguns dados
            podem ser armazenados ou processados em outros países. Buscamos que
            essas transferências ocorram nas hipóteses admitidas pela LGPD
            (art. 33) e de acordo com os compromissos de proteção de dados
            assumidos por esses fornecedores.
          </p>
        </Section>

        <Section id="filmes" title="6. Filmes, entrega e portfólio">
          <h3>Como os filmes são entregues</h3>
          <p>
            Os filmes de cada evento ficam em páginas privadas, acessadas por
            links exclusivos enviados ao cliente. Os vídeos são hospedados no
            YouTube, normalmente como <strong>não listados</strong>: eles não
            aparecem em buscas, mas qualquer pessoa que tenha o link consegue
            assisti-los. Os arquivos para download são disponibilizados pelo
            Google Drive, também por link.
          </p>
          <p>
            Esses links reduzem bastante a exposição, mas não são uma garantia
            absoluta de confidencialidade. Compartilhe-os apenas com quem você
            quiser — e, se um link tiver sido repassado indevidamente, fale com
            a gente.
          </p>

          <h3>Preservação dos filmes</h3>
          <p>
            Preservar memórias é o centro do nosso trabalho. A nossa intenção é
            manter os filmes disponíveis por muitos anos, por prazo
            indeterminado, enquanto houver condições técnicas, operacionais e
            legais para isso. Ainda assim, não podemos garantir armazenamento
            vitalício: recomendamos que você guarde as suas próprias cópias dos
            arquivos entregues. Você também pode pedir a remoção dos seus
            filmes a qualquer momento.
          </p>

          <h3>Portfólio público</h3>
          <p>
            Filmes e imagens de clientes só são divulgados no site e nas nossas
            redes com autorização específica, prevista em cláusula do contrato.
            Quem autorizou pode pedir, a qualquer momento, que o material deixe
            de ser exibido; providenciaremos a retirada dos nossos canais. A
            retirada não alcança cópias feitas por terceiros.
          </p>
        </Section>

        <Section id="menores" title="7. Crianças e adolescentes">
          <p>
            Registramos eventos em que aparecem crianças e adolescentes, como
            festas de 15 anos. O uso dessas imagens deve atender ao melhor
            interesse deles e depende de autorização adequada dos pais ou
            responsáveis legais — em especial para qualquer divulgação pública
            (LGPD, art. 14; Estatuto da Criança e do Adolescente).
          </p>
          <p>
            Pais e responsáveis podem, a qualquer momento, pedir informações,
            revisão ou a retirada de imagens do portfólio público pelos canais
            da seção 1.
          </p>
        </Section>

        <Section id="cookies" title="8. Cookies e estatísticas de navegação">
          <p>
            Cookies são pequenos arquivos gravados no seu navegador. Usamos
            sempre os necessários ao funcionamento do site. Os opcionais só
            são usados depois da sua autorização, separadamente para cada
            finalidade — e recusar não muda em nada o acesso ao site.
          </p>
          <Table
            caption="Cookies utilizados"
            head={["Cookie", "Categoria", "Finalidade", "Duração", "De quem"]}
            rows={COOKIES}
          />

          <h3>Estatísticas (opcional)</h3>
          <p>
            Para entender quais páginas públicas despertam interesse e de onde
            vêm as visitas — por exemplo, de uma campanha —, podemos utilizar o
            Google Tag Manager e o Google Analytics 4. Eles só são carregados
            depois que você autoriza &ldquo;Estatísticas&rdquo;; antes disso,
            nada é carregado. Enquanto essas ferramentas não estiverem em uso,
            a opção simplesmente não aparece nas preferências.
          </p>
          <ul>
            <li>
              Usamos o Modo de Consentimento do Google: tudo começa negado, e a
              sua autorização libera apenas a medição estatística.
            </li>
            <li>
              Publicidade, remarketing e personalização de anúncios ficam
              sempre desativados.
            </li>
            <li>
              Enviamos apenas o endereço da página pública visitada (sem
              parâmetros desnecessários), um título genérico da página e a
              origem da visita. As páginas de filmes do portfólio têm
              endereços públicos, que podem conter o nome do evento.
            </li>
          </ul>

          <h3>Análise de experiência</h3>
          <p>
            Hoje não usamos ferramentas de gravação de sessão ou mapas de calor.
            Se passarmos a usar uma — como o Microsoft Clarity —, ela só
            funcionará com a sua autorização específica, esta política será
            atualizada antes, e a sua escolha será pedida novamente.
          </p>

          <h3>Como escolher, mudar de ideia e retirar</h3>
          <ul>
            <li>
              Quando houver ferramentas opcionais em uso, um aviso discreto
              oferece as opções Aceitar, Rejeitar e Personalizar, com o mesmo
              destaque.
            </li>
            <li>
              Você pode mudar sua escolha a qualquer momento pelo link
              &ldquo;Preferências de cookies&rdquo;, no rodapé das páginas
              públicas.
            </li>
            <li>
              Ao retirar uma autorização, a coleta é interrompida na hora e a
              página é recarregada para encerrar a ferramenta. Apagamos os
              cookies dela gravados no nosso domínio; cookies gravados por
              terceiros no domínio deles só podem ser apagados pelas
              configurações do seu navegador.
            </li>
            <li>
              <strong>Sinais de privacidade do navegador:</strong> se o seu
              navegador envia o sinal Global Privacy Control (GPC) ou Do Not
              Track (DNT), tratamos isso como recusa — o aviso não é exibido e
              nada opcional é ativado. Se depois você autorizar algo
              explicitamente nas preferências, essa escolha prevalece.
            </li>
          </ul>

          <h3>Páginas privadas</h3>
          <p>
            Nas páginas privadas de entrega de filmes e na área administrativa,
            nenhuma ferramenta de estatística ou de análise de experiência é
            carregada — mesmo que você tenha autorizado no site público. Os
            endereços dessas páginas também não são repassados a essas
            ferramentas.
          </p>

          <div className="pt-1">
            <ConsentPreferencesButton className={ctaSecondaryClass}>
              Preferências de cookies
            </ConsentPreferencesButton>
          </div>
        </Section>

        <Section id="seguranca" title="9. Segurança">
          <p>
            Adotamos medidas técnicas e organizacionais para proteger os dados:
            o site usa conexão criptografada (HTTPS), a área administrativa do
            site tem acesso restrito à equipe e exige autenticação, os sistemas
            internos têm acesso restrito a usuários autorizados e as páginas de
            entrega de filmes não são indexadas por buscadores.
          </p>
          <p>
            Nenhum sistema é totalmente imune a falhas. Se ocorrer um incidente
            de segurança que possa trazer risco ou dano relevante, faremos as
            comunicações exigidas pela lei.
          </p>
        </Section>

        <Section id="conservacao" title="10. Por quanto tempo guardamos">
          <p>
            Guardamos cada dado pelo tempo necessário à finalidade para a qual
            foi coletado, ou pelo tempo exigido por lei:
          </p>
          <ul>
            <li>
              <strong>Contatos e orçamentos que não viraram contrato:</strong>{" "}
              enquanto forem úteis para o atendimento. Você pode pedir a
              exclusão a qualquer momento.
            </li>
            <li>
              <strong>Cadastro de clientes e informações dos eventos:</strong>{" "}
              durante a relação com você e, depois, pelo tempo necessário à
              entrega e à preservação dos filmes, ao cumprimento de obrigações
              legais e à defesa de direitos.
            </li>
            <li>
              <strong>Contratos e registros de pagamento:</strong> pelos prazos
              exigidos pela legislação civil e fiscal e enquanto puderem ser
              necessários para o exercício regular de direitos.
            </li>
            <li>
              <strong>Filmes e arquivos de entrega:</strong> conforme a seção
              6 — a intenção é preservá-los por muitos anos, sem garantia de
              armazenamento vitalício.
            </li>
            <li>
              <strong>Dados técnicos de acesso:</strong> pelos prazos dos
              provedores de hospedagem e armazenamento.
            </li>
            <li>
              <strong>Escolha sobre cookies:</strong> 6 meses; depois disso,
              perguntamos de novo.
            </li>
            <li>
              <strong>Estatísticas de navegação:</strong> pelo prazo de
              retenção configurado no Google Analytics, que nas contas padrão é
              de no máximo 14 meses; os cookies duram até 2 anos.
            </li>
          </ul>
          <p>
            Quando um dado deixa de ser necessário, ele pode ser excluído ou
            anonimizado — e você pode pedir isso a qualquer momento, respeitados
            os casos em que a lei exige a guarda.
          </p>
        </Section>

        <Section id="direitos" title="11. Seus direitos">
          <p>Pela LGPD (art. 18), você pode pedir:</p>
          <ul>
            <li>confirmação de que tratamos seus dados e acesso a eles;</li>
            <li>correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>
              anonimização, bloqueio ou eliminação de dados desnecessários,
              excessivos ou tratados em desconformidade com a lei;
            </li>
            <li>portabilidade dos dados;</li>
            <li>
              informação sobre com quem compartilhamos seus dados e sobre a
              possibilidade de não dar consentimento;
            </li>
            <li>
              eliminação dos dados tratados com base no consentimento e a
              revogação desse consentimento.
            </li>
          </ul>
          <p>
            Para exercer qualquer direito, use os canais da seção 12.
            Responderemos nos prazos previstos na LGPD e, para proteger você,
            podemos pedir uma confirmação de identidade antes de atender. Você
            também pode apresentar reclamação à Autoridade Nacional de Proteção
            de Dados (ANPD).
          </p>
        </Section>

        <Section id="contato" title="12. Contato">
          <p>Para dúvidas, solicitações ou pedidos sobre seus dados:</p>
          <ul>
            <li>
              E-mail:{" "}
              <a href={`mailto:${EMAIL}`} className={linkClass}>
                {EMAIL}
              </a>
            </li>
            <li>
              WhatsApp:{" "}
              <a
                href={buildWhatsAppUrl("Olá! Tenho uma dúvida sobre privacidade e meus dados.")}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {PHONE_DISPLAY}
              </a>
            </li>
          </ul>
        </Section>

        <Section id="atualizacoes" title="13. Atualizações desta política">
          <p>
            Esta política pode ser atualizada para refletir mudanças nos nossos
            serviços, nas ferramentas usadas ou na legislação. A versão e a
            data de atualização ficam no topo da página. Quando mudarem as
            finalidades ou as ferramentas opcionais, pediremos a sua escolha
            novamente.
          </p>
        </Section>

        <p className="text-sm text-bone-dim">
          <Link href="/" className={linkClass}>
            Voltar ao início
          </Link>
        </p>
      </div>
    </article>
  );
}

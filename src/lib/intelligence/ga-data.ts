import "server-only";
import { createSign } from "node:crypto";

/**
 * Cliente mínimo da Google Analytics Data API (v1beta), só no servidor.
 *
 * Autenticação por conta de serviço: um JWT assinado com a chave privada
 * (RS256, `node:crypto`) é trocado por um access token de escopo
 * `analytics.readonly`. Sem SDK, sem dependência nova.
 *
 * Credenciais SOMENTE em variáveis de ambiente do servidor (nunca
 * `NEXT_PUBLIC_*`, nunca no repositório):
 *   GA4_CLIENT_EMAIL  e-mail da conta de serviço
 *   GA4_PRIVATE_KEY   chave privada PEM (com "\n" escapados, se preciso)
 *
 * O ID numérico da propriedade não é segredo: fica aqui como padrão e pode
 * ser sobrescrito por `GA4_PROPERTY_ID`.
 *
 * Esta API só LÊ relatórios: não envia eventos nem cria coleta paralela.
 */

export type GaErrorKind =
  | "not_configured"
  | "auth"
  | "permission"
  | "quota"
  | "invalid_request"
  | "network";

export class GaDataError extends Error {
  constructor(
    readonly kind: GaErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "GaDataError";
  }
}

/** ID numérico da propriedade GA4 da FTF — NÃO é o ID de medição "G-…". */
export const GA4_PROPERTY_ID_DEFAULT = "558916123";

type Credentials = { propertyId: string; clientEmail: string; privateKey: string };

export type CredentialStatus =
  | { ok: true; credentials: Credentials }
  | { ok: false; missing: string[] };

/** Remove espaços e UM par de aspas nas pontas (valor colado do JSON). */
function unquote(value: string | undefined): string {
  const v = (value ?? "").trim();
  return /^(["'])[\s\S]*\1$/.test(v) ? v.slice(1, -1).trim() : v;
}

/** Lê e valida as variáveis. Devolve só NOMES do que falta — nunca valores. */
export function readCredentials(): CredentialStatus {
  const propertyId = unquote(process.env.GA4_PROPERTY_ID) || GA4_PROPERTY_ID_DEFAULT;
  const clientEmail = unquote(process.env.GA4_CLIENT_EMAIL);
  // Aceita "\n" literais (formato do JSON), quebras reais e \r\n.
  const privateKey = unquote(process.env.GA4_PRIVATE_KEY).replace(/\\n/g, "\n").trim();

  const missing: string[] = [];
  // Numérico: impede usar por engano o ID de medição "G-XXXXXXX".
  if (!/^\d{6,15}$/.test(propertyId)) missing.push("GA4_PROPERTY_ID");
  if (!/^[^@\s]+@[^@\s]+\.iam\.gserviceaccount\.com$/.test(clientEmail)) {
    missing.push("GA4_CLIENT_EMAIL");
  }
  if (!/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(privateKey)) missing.push("GA4_PRIVATE_KEY");

  return missing.length
    ? { ok: false, missing }
    : { ok: true, credentials: { propertyId, clientEmail, privateKey } };
}

// Token reaproveitado enquanto a instância do servidor viver (~1 h).
let token: { value: string; expiresAt: number; email: string } | null = null;

async function getAccessToken(c: Credentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (token && token.email === c.clientEmail && token.expiresAt - 60 > now) {
    return token.value;
  }

  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: c.clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;

  let signature: string;
  try {
    signature = createSign("RSA-SHA256").update(unsigned).sign(c.privateKey).toString("base64url");
  } catch {
    throw new GaDataError("auth", "A chave privada da conta de serviço é inválida.");
  }

  let res: Response;
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature}`,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new GaDataError("network", "Sem conexão com o serviço de autenticação do Google.");
  }
  if (!res.ok) {
    throw new GaDataError("auth", `O Google recusou a conta de serviço (HTTP ${res.status}).`);
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new GaDataError("auth", "Resposta de autenticação sem token.");
  }
  token = {
    value: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600),
    email: c.clientEmail,
  };
  return token.value;
}

export type GaRow = {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
};

export type GaReport = {
  rows?: GaRow[];
  metadata?: {
    subjectToThresholding?: boolean;
    dataLossFromOtherRow?: boolean;
    samplingMetadatas?: unknown[];
  };
};

/** Até 5 relatórios numa só chamada (`batchRunReports`) — economiza cota. */
export async function batchRunReports(requests: object[]): Promise<GaReport[]> {
  const status = readCredentials();
  if (!status.ok) {
    throw new GaDataError("not_configured", "Integração com o GA4 não configurada.");
  }
  const { propertyId } = status.credentials;
  const accessToken = await getAccessToken(status.credentials);

  let res: Response;
  try {
    res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    throw new GaDataError("network", "Sem conexão com a Google Analytics Data API.");
  }

  if (res.status === 401) {
    token = null;
    throw new GaDataError("auth", "Token recusado pela Data API.");
  }
  if (res.status === 403 || res.status === 404) {
    throw new GaDataError(
      "permission",
      "A conta de serviço não tem acesso a esta propriedade (ou o ID está errado).",
    );
  }
  if (res.status === 429) {
    throw new GaDataError("quota", "Cota da Data API esgotada por enquanto.");
  }
  if (!res.ok) {
    throw new GaDataError("invalid_request", `A Data API recusou a consulta (HTTP ${res.status}).`);
  }

  const json = (await res.json()) as { reports?: GaReport[] };
  return json.reports ?? [];
}

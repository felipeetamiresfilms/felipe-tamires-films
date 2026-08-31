/**
 * Área da EQUIPE: `/backstage-ft/*`.
 * Sem header/rodapé público. A navegação administrativa (Dashboard / Clientes
 * / Eventos / Sair) vive em `(protected)/layout.tsx`; a tela de login não tem
 * navegação. Autenticação e RLS inalteradas.
 */
export default function BackstageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex flex-1 flex-col">{children}</main>;
}

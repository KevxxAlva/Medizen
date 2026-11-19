import type { JSX } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  LEGAL_DOCUMENTS,
  LEGAL_DOC_IDS,
  parseLegalDocId,
  type LegalDocId,
} from "@/lib/legal/legalDocuments";
import {
  DOC_ICONS,
  LegalHeader,
  LegalPrintLetterhead,
  LegalIntroBanner,
  LegalMobileNav,
  LegalDesktopSidebar,
  LegalDocumentBody,
  LegalPagination,
  LegalFooter,
} from "@/components/legal/LegalPageSections";

export const Route = createFileRoute("/legal")({
  validateSearch: (search: Record<string, unknown>): { doc: LegalDocId } => ({
    doc: parseLegalDocId(search.doc),
  }),
  head: () => ({
    meta: [
      { title: "Centro Legal y Privacidad — Medizen" },
      {
        name: "description",
        content:
          "Términos de uso, política de privacidad clínica, confidencialidad médica, almacenamiento PWA y arquitectura de seguridad de Medizen.",
      },
    ],
  }),
  component: LegalPage,
});

function LegalPage(): JSX.Element {
  const { doc } = Route.useSearch();
  const activeDocId: LegalDocId = parseLegalDocId(doc);
  const activeDoc = LEGAL_DOCUMENTS[activeDocId];
  const ActiveIcon = DOC_ICONS[activeDocId];

  const activeIndex = LEGAL_DOC_IDS.indexOf(activeDocId);
  const prevDoc = activeIndex > 0 ? LEGAL_DOCUMENTS[LEGAL_DOC_IDS[activeIndex - 1]] : null;
  const nextDoc =
    activeIndex < LEGAL_DOC_IDS.length - 1 ? LEGAL_DOCUMENTS[LEGAL_DOC_IDS[activeIndex + 1]] : null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans flex flex-col print:bg-white print:text-black">
      <LegalHeader onPrint={handlePrint} />
      <LegalPrintLetterhead />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8 print:py-0">
        <LegalIntroBanner />
        <LegalMobileNav activeDocId={activeDocId} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <LegalDesktopSidebar activeDocId={activeDocId} activeDoc={activeDoc} />

          <article className="lg:col-span-8 space-y-6 print:col-span-12">
            <LegalDocumentBody activeDoc={activeDoc} activeIcon={ActiveIcon} />
            <LegalPagination prevDoc={prevDoc} nextDoc={nextDoc} />
          </article>
        </div>

        <LegalFooter />
      </main>
    </div>
  );
}

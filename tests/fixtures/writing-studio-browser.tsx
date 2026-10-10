// Local browser regression fixture. The form, editor, parser and undo stack are
// production code; only the server action boundary is replaced by the test server.
import { createRoot } from "react-dom/client";
import { WritingForm } from "@/components/admin/writing-form";
import { LocaleProvider } from "@/components/i18n/locale-context";
import type { AdminWritingArticle } from "@/types/writing";

async function mount() {
  const article: AdminWritingArticle = await fetch("/__fixture/article").then((response) => response.json());
  createRoot(document.getElementById("root")!).render(<LocaleProvider locale="de"><WritingForm article={article} /><a href="/outside">Leave Studio fixture</a></LocaleProvider>);
}
void mount();

import { notFound } from "next/navigation";
import { App } from "@/components/App";
import { hasLocale } from "@/i18n/dict";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <App lang={lang} />;
}

import Link from "next/link";
import { buttonClass, Card, Container, Icon } from "@/kit";
import { getT } from "@/i18n/get-locale";

export function HowItWorks() {
  const t = getT();
  const steps = [
    { icon: "disc" as const, title: t("home.how1Title"), body: t("home.how1Body") },
    { icon: "wallet" as const, title: t("home.how2Title"), body: t("home.how2Body") },
    { icon: "sparkles" as const, title: t("home.how3Title"), body: t("home.how3Body") },
  ];
  return (
    <section className="border-t border-border py-16">
      <Container>
        <h2 className="text-2xl font-bold tracking-tight">{t("home.howTitle")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Card key={s.title} className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Icon name={s.icon} />
              </div>
              <p className="text-xs font-medium text-muted">0{i + 1}</p>
              <h3 className="mt-1 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-3 p-6">
            <Icon name="headphones" className="text-accent" />
            <h3 className="text-lg font-semibold">{t("home.splitRapperTitle")}</h3>
            <p className="text-sm text-muted">{t("home.splitRapperBody")}</p>
            <Link href="/" className={buttonClass({ size: "sm", className: "mt-auto w-fit" })}>
              {t("home.splitRapperCta")}
            </Link>
          </Card>
          <Card className="flex flex-col gap-3 border-accent/30 p-6">
            <Icon name="flame" className="text-accent" />
            <h3 className="text-lg font-semibold">{t("home.splitProducerTitle")}</h3>
            <p className="text-sm text-muted">{t("home.splitProducerBody")}</p>
            <Link href="/upload" className={buttonClass({ size: "sm", className: "mt-auto w-fit" })}>
              <Icon name="upload" size="sm" />
              {t("home.splitProducerCta")}
            </Link>
          </Card>
        </div>
      </Container>
    </section>
  );
}

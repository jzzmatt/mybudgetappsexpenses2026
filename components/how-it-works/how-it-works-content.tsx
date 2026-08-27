import Link from "next/link";
import { getTranslations } from "@/lib/i18n/server";

const steps = [
  { titleKey: "landing.step1Title", descriptionKey: "landing.step1Description" },
  { titleKey: "landing.step2Title", descriptionKey: "landing.step2Description" },
  { titleKey: "landing.step3Title", descriptionKey: "landing.step3Description" },
  { titleKey: "landing.step4Title", descriptionKey: "landing.step4Description" },
  { titleKey: "landing.step5Title", descriptionKey: "landing.step5Description" },
] as const;

const features = [
  { titleKey: "landing.feature1Title", descriptionKey: "landing.feature1Description" },
  { titleKey: "landing.feature2Title", descriptionKey: "landing.feature2Description" },
  { titleKey: "landing.feature3Title", descriptionKey: "landing.feature3Description" },
  { titleKey: "landing.feature4Title", descriptionKey: "landing.feature4Description" },
] as const;

export async function HowItWorksContent() {
  const { t } = await getTranslations();

  return (
    <div className="how-it-works-page">
      <section className="how-it-works-intro">
        <div className="how-it-works-intro-copy">
          <h2 className="how-it-works-heading">{t("landing.title")}</h2>
          <p className="how-it-works-subtitle">{t("landing.subtitle")}</p>
        </div>
        <div aria-hidden="true" className="how-it-works-visual">
          <div className="how-it-works-card how-it-works-card--secondary">
            <span className="how-it-works-label">{t("projects.totalPaid")}</span>
            <span className="how-it-works-value">Kz 17,637,651</span>
          </div>
          <div className="how-it-works-card how-it-works-card--primary">
            <span className="how-it-works-label">{t("projects.totalBudget")}</span>
            <span className="how-it-works-balance">Kz 62,765,175</span>
            <span className="how-it-works-change">+12.5%</span>
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <h2>{t("landing.stepsTitle")}</h2>
        <ol className="how-it-works-steps">
          {steps.map((step, index) => (
            <li className="how-it-works-step" key={step.titleKey}>
              <span className="how-it-works-step-number">{index + 1}</span>
              <div>
                <h3>{t(step.titleKey)}</h3>
                <p>{t(step.descriptionKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="how-it-works-section">
        <h2>{t("landing.featuresTitle")}</h2>
        <div className="how-it-works-features">
          {features.map((feature) => (
            <article className="how-it-works-feature-card" key={feature.titleKey}>
              <h3>{t(feature.titleKey)}</h3>
              <p>{t(feature.descriptionKey)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-it-works-footer-cta">
        <h2>{t("landing.ctaFooterTitle")}</h2>
        <p>{t("landing.ctaFooterDescription")}</p>
        <Link className="button how-it-works-cta-button" href="/projects/new">
          {t("common.addProject")}
        </Link>
      </section>
    </div>
  );
}

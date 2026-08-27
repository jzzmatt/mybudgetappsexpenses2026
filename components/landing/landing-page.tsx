import Link from "next/link";
import { BudgetAppLogo } from "@/components/auth/budget-app-logo";
import { LanguageSelector } from "@/components/i18n/language-selector";
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

export async function LandingPage() {
  const { t } = await getTranslations();

  return (
    <main className="landing-page">
      <a className="skip-link" href="#landing-main">
        {t("landing.skipToContent")}
      </a>

      <header className="landing-header">
        <BudgetAppLogo />
        <div className="landing-header-actions">
          <LanguageSelector />
          <Link className="button button-outline landing-header-button" href="/login">
            {t("landing.ctaSecondary")}
          </Link>
          <Link className="button landing-header-button" href="/register">
            {t("landing.ctaPrimary")}
          </Link>
        </div>
      </header>

      <div className="landing-main" id="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <h1>{t("landing.title")}</h1>
            <p className="landing-subtitle">{t("landing.subtitle")}</p>
            <div className="landing-hero-actions">
              <Link className="button landing-cta-button" href="/register">
                {t("landing.ctaPrimary")}
              </Link>
              <Link className="button button-outline landing-cta-button" href="/login">
                {t("landing.ctaSecondary")}
              </Link>
            </div>
          </div>
          <div aria-hidden="true" className="landing-hero-visual">
            <div className="landing-hero-card landing-hero-card--secondary">
              <span className="landing-hero-label">{t("projects.totalPaid")}</span>
              <span className="landing-hero-value">Kz 17,637,651</span>
            </div>
            <div className="landing-hero-card landing-hero-card--primary">
              <span className="landing-hero-label">{t("projects.totalBudget")}</span>
              <span className="landing-hero-balance">Kz 62,765,175</span>
              <span className="landing-hero-change">+12.5%</span>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <h2>{t("landing.stepsTitle")}</h2>
          <ol className="landing-steps">
            {steps.map((step, index) => (
              <li className="landing-step" key={step.titleKey}>
                <span className="landing-step-number">{index + 1}</span>
                <div>
                  <h3>{t(step.titleKey)}</h3>
                  <p>{t(step.descriptionKey)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section">
          <h2>{t("landing.featuresTitle")}</h2>
          <div className="landing-features">
            {features.map((feature) => (
              <article className="landing-feature-card" key={feature.titleKey}>
                <h3>{t(feature.titleKey)}</h3>
                <p>{t(feature.descriptionKey)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-footer-cta">
          <h2>{t("landing.ctaFooterTitle")}</h2>
          <p>{t("landing.ctaFooterDescription")}</p>
          <Link className="button landing-cta-button" href="/register">
            {t("landing.ctaPrimary")}
          </Link>
        </section>
      </div>
    </main>
  );
}

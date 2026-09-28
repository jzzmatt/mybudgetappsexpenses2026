import { notFound } from "next/navigation";
import { PaymentBatchDetail } from "@/components/payments/payment-batch-detail";
import { AppShell } from "@/components/layout/app-shell";
import { getTranslations } from "@/lib/i18n/server";
import { getPaymentBatchDetail } from "@/lib/payments/history";

type PaymentBatchPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PaymentBatchPage({ params }: PaymentBatchPageProps) {
  const { id } = await params;
  const { t } = await getTranslations();
  const batch = await getPaymentBatchDetail(id);

  if (!batch) {
    notFound();
  }

  return (
    <AppShell description={batch.reference} title={t("payments.historyTitle")}>
      <PaymentBatchDetail batch={batch} />
    </AppShell>
  );
}

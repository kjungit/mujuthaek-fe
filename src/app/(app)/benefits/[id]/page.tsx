import { Suspense } from "react";
import type { Metadata } from "next";
import { Responsive } from "@/components/layout/Responsive";
import { benefitsSummary } from "@/mocks/benefits";
import { MBenefitDetail } from "@/screens/benefits/MBenefitDetail";
import { WebBenefits } from "@/screens/benefits/WebBenefits";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return benefitsSummary.items.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const b = benefitsSummary.items.find((x) => x.id === id) ?? benefitsSummary.items[0];
  return { title: `${b.title} | 무주택자들` };
}

async function BenefitDetail({ params }: Params) {
  const { id } = await params;
  return <Responsive web={<WebBenefits initialId={id} />} mobile={<MBenefitDetail id={id} />} />;
}

export default function BenefitDetailPage({ params }: Params) {
  return (
    <Suspense>
      <BenefitDetail params={params} />
    </Suspense>
  );
}

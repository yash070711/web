"use client";

import { CoverageStudio } from "./CoverageStudio";
import { QuestionnaireStudio } from "./QuestionnaireStudio";
import { EligibilityStudio } from "./EligibilityStudio";
import { RatingStudio } from "./RatingStudio";
import { UnderwritingStudio } from "./UnderwritingStudio";
import { DistributionStudio } from "./DistributionStudio";
import { DocumentStudio } from "./DocumentStudio";
import { RiskStudio } from "./RiskStudio";
import { JurisdictionStudio } from "./JurisdictionStudio";
import type { Row } from "./shared";
import type { Product } from "@/lib/types";

export function StudioSwitch({
  studio,
  product,
  version,
  collections,
}: {
  studio: string;
  product: Product;
  version: string;
  collections: Record<string, Row[]>;
}) {
  const props = {
    productId: product.id,
    version,
    productName: product.name,
    status: product.status,
  };
  const covers = collections.covers || [];
  const groups = collections.questionGroups || [];
  const questions = groups.flatMap((g) => (Array.isArray(g.questions) ? (g.questions as Row[]) : []));

  if (studio === "coverage") return <CoverageStudio {...props} items={covers} />;
  if (studio === "questionnaire") return <QuestionnaireStudio {...props} items={groups} />;
  if (studio === "eligibility") {
    return (
      <EligibilityStudio
        {...props}
        items={collections.eligibilityRules || []}
        covers={covers}
        riskAttributes={collections.riskAttributes || []}
        questions={questions}
        underwriting={collections.underwritingRules || []}
      />
    );
  }
  if (studio === "rating") return <RatingStudio {...props} items={collections.ratingComponents || []} />;
  if (studio === "underwriting") return <UnderwritingStudio {...props} items={collections.underwritingRules || []} />;
  if (studio === "distribution") return <DistributionStudio {...props} items={collections.channels || []} />;
  if (studio === "document") return <DocumentStudio {...props} items={collections.documents || []} />;
  if (studio === "risk") return <RiskStudio {...props} items={collections.riskAttributes || []} />;
  if (studio === "jurisdiction") return <JurisdictionStudio product={product} />;
  return <div className="page-inner"><p className="text-muted">Unknown guide.</p></div>;
}

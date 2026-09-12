import { redirectToActiveStudio } from "@/lib/active-studio";

export default async function CoverageStudioAlias() {
  await redirectToActiveStudio("coverage");
}

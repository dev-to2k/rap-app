/** Exclusive may be sold only when sampleFlag is exactly "clean". */
export function exclusiveSampleIsClean(sampleFlag: string | null | undefined): boolean {
  return sampleFlag === "clean";
}

/** Share of sea-level oxygen pressure at a height, from the International Standard Atmosphere (troposphere). */
export function oxygenShare(heightM: number): number {
  return Math.pow(1 - 2.25577e-5 * heightM, 5.25588);
}

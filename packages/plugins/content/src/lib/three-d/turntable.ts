/** 360° yörünge açıları — index + azimuth (derece). Saf, deterministik. O(count). */
export const orbitAngles = (count = 72, stepDeg = 5): { index: number; azimuthDeg: number }[] =>
  Array.from({ length: count }, (_, index) => ({ index, azimuthDeg: index * stepDeg }))

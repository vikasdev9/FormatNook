/**
 * Calculates the bounding box required to contain an image rotated by an arbitrary angle
 */
export function calculateRotatedBoundingBox(
  width: number,
  height: number,
  angleDeg: number
): { width: number; height: number } {
  const normAngle = ((angleDeg % 360) + 360) % 360;
  if (normAngle === 0 || normAngle === 180) {
    return { width, height };
  }
  if (normAngle === 90 || normAngle === 270) {
    return { width: height, height: width };
  }

  const rad = (normAngle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  return {
    width: Math.max(1, Math.round(width * cos + height * sin)),
    height: Math.max(1, Math.round(width * sin + height * cos)),
  };
}

/**
 * Normalizes an angle into the -180 to +180 degree range
 */
export function normalizeAngle(angle: number): number {
  let a = angle % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return Math.round(a);
}

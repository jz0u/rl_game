/**
 * Returns the uniform scale factor that fits `src` within a `maxSize` square.
 * @param {{ width: number, height: number }} src
 * @param {number} maxSize
 */
export function scaleIcon(src, maxSize) {
  return Math.min(maxSize / src.width, maxSize / src.height);
}

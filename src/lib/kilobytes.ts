// A byte count, as the settings line says it out loud.
//
// This was `Math.round(bytes / 1024)`, and the rounding did not merely lose precision -- it misled.
// Two stores 223 bytes apart displayed "6 KB" and "7 KB", which is how a kilobyte of difference
// that did not exist came to be investigated as though it did. At these sizes a whole number is
// coarser than the thing it describes: one byte can move the label.
//
// Below 10 KB, then, one decimal. Above it the extra digit says nothing a user would act on, and a
// meter that reads "97.3 KB of 100 KB" is noisier than one that reads "97 KB of 100 KB".
//
// Localised because the separator is not a detail: "6,3" is how the number is written in the
// language half this interface is already in, and "6.3" reads there as a different number.
export function kilobytes(bytes: number, language?: string): string {
  const value = bytes / 1024
  const digits = value < 10 ? 1 : 0
  return value.toLocaleString(language, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

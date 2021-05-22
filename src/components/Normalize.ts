const inputLookup = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  ",": ".",
  ".": ".",
  " ": ""
}

export function normalize(input: string): string {
  return input.toString()
    .split("")
    .map(c => inputLookup[c] ?? "")
    .join("")
}

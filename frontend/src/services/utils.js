export const csvToOpponents = (csv) =>
  csv
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((id) => ({ id }));

export const opponentsToCsv = (arr) => arr.map((o) => o.id).join(",");
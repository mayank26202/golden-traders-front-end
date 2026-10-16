export function weightResult(stockLeft: number) {
  const kg = Math.round(Math.abs(stockLeft) * 100) / 100;
  return stockLeft < 0 ? kg + " kg profit" : stockLeft > 0 ? kg + " kg loss" : "0 kg loss / profit";
}

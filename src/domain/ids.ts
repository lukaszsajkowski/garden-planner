let counter = Date.now();

export function newId(): string {
  counter += 1;
  return 'e' + counter.toString(36);
}

export async function load(path) {
  const request = await fetch(path);
  return await request.json();
}

export const randomBool = () => Math.random() < 0.5;

export const shuffle = (values) =>
  values
    .map((value) => ({ value, sort: Math.random() }))
    .sort((x, y) => x.sort - y.sort)
    .map(({ value }) => value);

export const zip = (as, bs) => as.map((a, i) => [a, bs[i]]);

export const max = (values, keyFunc) =>
  values.reduce(
    (max, value) => (keyFunc(value) > keyFunc(max) ? value : max),
    values[0],
  );

export function modulo(dividend, divisor) {
  return ((dividend % divisor) + divisor) % divisor;
}

export function product(...iterables) {
  const pools = iterables.map((iterable) => [...iterable]);
  let result = [[]];
  for (const pool of pools) {
    result = [...result.flatMap((x) => pool.map((y) => [...x, y]))];
  }
  return result;
}

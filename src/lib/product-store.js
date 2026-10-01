import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const file = path.join(process.cwd(), 'database/products.json');
let mutations = Promise.resolve();
export async function readProducts() {
  const products = JSON.parse(await readFile(file, 'utf8'));
  if (!Array.isArray(products)) throw new Error('Invalid product store');
  return products;
}
export async function saveProducts(products) {
  const temporary = file + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temporary, JSON.stringify(products, null, 2) + '\n', 'utf8');
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}
// Serialize the complete read/modify/write operation, including create and update.
export function withProductLock(operation) {
  const result = mutations.then(operation);
  mutations = result.catch(() => {});
  return result;
}

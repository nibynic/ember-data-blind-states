export default function(original, hash) {
  for (let prop in hash) {
    original[prop] = hash[prop];
  }

  return original;
}

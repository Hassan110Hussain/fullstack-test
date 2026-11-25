// Run with:  node logic2.js

// ---------- a) Total price and most expensive item per category ----------
const items = [
  { name: "Pen", category: "stationery", price: 2 },
  { name: "Laptop", category: "tech", price: 900 },
  { name: "Notebook", category: "stationery", price: 5 },
  { name: "Mouse", category: "tech", price: 25 },
];

function summarizeByCategory(list) {
  const result = {};
  const topPrice = {}; // tracks the highest price seen per category

  for (const { name, category, price } of list) {
    if (!result[category]) {
      result[category] = { total: 0, top: name };
      topPrice[category] = price;
    }
    result[category].total += price;
    if (price > topPrice[category]) {
      topPrice[category] = price;
      result[category].top = name;
    }
  }
  return result;
}

console.log(summarizeByCategory(items));
// { stationery: { total: 7, top: 'Notebook' }, tech: { total: 925, top: 'Laptop' } }

// ---------- b) Anagram check ----------
function isAnagram(a, b) {
  const clean = (s) => s.toLowerCase().replace(/\s+/g, "").split("").sort().join("");
  return clean(a) === clean(b);
}

console.log(isAnagram("Listen", "Silent"));       // true
console.log(isAnagram("Dormitory", "Dirty room")); // true
console.log(isAnagram("hello", "world"));         // false

// ---------- c) Throttle ----------
// Debounce waits until calls STOP for `delay` ms, then runs once (last call wins).
// Throttle runs at most once per `delay` ms WHILE calls keep coming (first call wins).
function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

const throttled = throttle((msg) => console.log("throttled:", msg), 200);
throttled("1"); // runs
throttled("2"); // ignored (too soon)
setTimeout(() => throttled("3"), 250); // runs (200ms has passed)

// ---------- d) Output order ----------
// Prints: A, D, C, B
//
// Why:
// 1. "A" and "D" are synchronous, so they run first, in order.
// 2. Promise.then() callbacks go to the MICROTASK queue.
// 3. setTimeout callbacks go to the MACROTASK queue, even with a 0ms delay.
// 4. After the call stack empties, ALL microtasks run before the next macrotask,
//    so "C" prints before "B".
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");

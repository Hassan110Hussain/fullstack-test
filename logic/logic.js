// Run with:  node logic.js

const employees = [
  { name: "A", dept: "x" },
  { name: "B", dept: "y" },
  { name: "C", dept: "x" },
  { name: "D", dept: "z" },
  { name: "E", dept: "x" },
  { name: "F", dept: "y" },
];

// 1) Group employees by department
//    { x: [{...}, {...}], y: [...], z: [...] }
function groupByDept(list) {
  return list.reduce((groups, emp) => {
    (groups[emp.dept] ||= []).push(emp);
    return groups;
  }, {});
}

// 2) Count employees per department
//    { x: 3, y: 2, z: 1 }
function countByDept(list) {
  return list.reduce((counts, emp) => {
    counts[emp.dept] = (counts[emp.dept] || 0) + 1;
    return counts;
  }, {});
}

// 3) Department with the most employees
//    Returns { dept, count }, or null for empty input.
//    On a tie, returns the first one found.
function topDept(list) {
  const counts = countByDept(list);
  let best = null;
  for (const [dept, count] of Object.entries(counts)) {
    if (!best || count > best.count) best = { dept, count };
  }
  return best;
}

// If asked for ALL departments on a tie:
function topDepts(list) {
  const counts = countByDept(list);
  const max = Math.max(...Object.values(counts));
  return Object.keys(counts).filter((d) => counts[d] === max);
}

// 4) Debounce: run fn only after `delay` ms with no new calls
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ---------- Tests ----------
console.log(groupByDept(employees));
console.log(countByDept(employees));      // { x: 3, y: 2, z: 1 }
console.log(topDept(employees));          // { dept: 'x', count: 3 }
console.log(topDepts(employees));         // [ 'x' ]
console.log(topDept([]));                 // null

const log = debounce((msg) => console.log("debounced:", msg), 300);
log("a");
log("b");
log("c"); // only "c" prints, after 300ms

/* eslint-disable @typescript-eslint/no-require-imports */
const Fuse = require('fuse.js');

const vans = [
  { name: "Toyota HiAce LWB", features: ["reverse camera"] },
  { name: "Mercedes Sprinter LWB", features: ["reverse camera"] },
  { name: "Renault Master", features: ["reverse camera"] }
];

const fuseStrict = new Fuse(vans, {
  keys: [
    { name: "name", weight: 3 },
    { name: "features", weight: 1 }
  ],
  threshold: 0.2,
  ignoreLocation: true
});

console.log("Threshold 0.2, query 'merc':");
console.log(fuseStrict.search("merc").map(r => r.item.name));

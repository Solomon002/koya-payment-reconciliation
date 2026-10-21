// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Only the latest attempt per txn_id counts, and only if it succeeded.
// Run:  node reconcile.js

const fs = require("fs");

const latest = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split(/\r?\n/);
for (const line of lines) {
  if (line.trim().length === 0) continue;

  let event;
  try {
    event = JSON.parse(line);
  } catch (err) {
    continue; // unreadable line
  }

  if (event === null || typeof event !== "object") continue;
  if (event.txn_id === undefined || event.txn_id === null || event.txn_id === "") continue;

  const prev = latest.get(event.txn_id);
  if (!prev || event.ts >= prev.ts) {
    latest.set(event.txn_id, event);
  }
}

let total = 0;
let count = 0;
for (const event of latest.values()) {
  if (event.status === "success") {
    total += Number(String(event.amount).replace(/,/g, ""));
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}

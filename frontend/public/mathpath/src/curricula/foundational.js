// foundational.js — a generic, mastery-based arithmetic ladder (no national framework).
// Useful as a default and as a template for how a curriculum maps onto the engine:
// `groups` are the display sections (here, levels) and every skill carries a generator `spec`.

export default {
  id: 'foundational',
  country: 'Generic',
  framework: 'Foundational arithmetic (mastery levels)',
  label: 'Foundational Arithmetic',
  source: null,
  groups: [
    { id: 'A', name: 'Level A', subtitle: 'Addition Foundations' },
    { id: 'B', name: 'Level B', subtitle: 'Subtraction Foundations' },
    { id: 'C', name: 'Level C', subtitle: 'Two-Digit Addition' },
    { id: 'D', name: 'Level D', subtitle: 'Two-Digit Subtraction' },
  ],
  skills: [
    { id: 'A1', group: 'A', name: 'Adding within 5',
      hint: 'Start at the bigger number and count up.', example: '3 + 2 = 5', timeTarget: 6,
      spec: { kind: 'add', aRange: [1, 4], bRange: [1, 4], maxSum: 5 } },
    { id: 'A2', group: 'A', name: 'Adding within 10',
      hint: 'Think "how many more to make 10?" then add the rest.', example: '6 + 3 = 9', timeTarget: 7,
      spec: { kind: 'add', aRange: [1, 9], bRange: [1, 9], maxSum: 10 } },
    { id: 'A3', group: 'A', name: 'Adding within 20',
      hint: 'Make a 10 first, e.g. 8 + 5 → 8 + 2 + 3 = 15.', example: '8 + 7 = 15', timeTarget: 8,
      spec: { kind: 'add', aRange: [2, 9], bRange: [2, 9], minSum: 11, maxSum: 18 } },

    { id: 'B1', group: 'B', name: 'Subtracting within 10',
      hint: 'Count back from the first number.', example: '9 − 4 = 5', timeTarget: 7,
      spec: { kind: 'sub', aRange: [2, 10], bRange: [1, 9] } },
    { id: 'B2', group: 'B', name: 'Subtracting within 20',
      hint: 'Take away down to the nearest 10 first, then the rest.', example: '15 − 7 = 8', timeTarget: 9,
      spec: { kind: 'sub', aRange: [11, 18], bRange: [2, 9] } },

    { id: 'C1', group: 'C', name: '2-digit + 1-digit (no carrying)',
      hint: 'Add the ones, then bring down the tens.', example: '42 + 5 = 47', timeTarget: 10,
      spec: { kind: 'add', aRange: [10, 89], bRange: [1, 9], carry: false } },
    { id: 'C2', group: 'C', name: '2-digit + 2-digit (no carrying)',
      hint: 'Add the ones column, then the tens column.', example: '34 + 25 = 59', timeTarget: 12,
      spec: { kind: 'add', aRange: [10, 80], bRange: [10, 80], carry: false, maxSum: 99 } },
    { id: 'C3', group: 'C', name: '2-digit + 2-digit (with carrying)',
      hint: 'When the ones add to 10 or more, carry 1 ten into the next column.', example: '48 + 37 = 85', timeTarget: 15,
      spec: { kind: 'add', aRange: [15, 84], bRange: [15, 84], carry: true, maxSum: 99 } },

    { id: 'D1', group: 'D', name: '2-digit − 1-digit (no borrowing)',
      hint: 'Subtract the ones, then bring down the tens.', example: '47 − 5 = 42', timeTarget: 11,
      spec: { kind: 'sub', aRange: [12, 99], bRange: [1, 9], borrow: false } },
    { id: 'D2', group: 'D', name: '2-digit − 2-digit (no borrowing)',
      hint: 'Subtract the ones column, then the tens column.', example: '58 − 23 = 35', timeTarget: 13,
      spec: { kind: 'sub', aRange: [20, 99], bRange: [10, 79], borrow: false } },
    { id: 'D3', group: 'D', name: '2-digit − 2-digit (with borrowing)',
      hint: 'When the top ones digit is too small, borrow 1 ten and regroup.', example: '52 − 27 = 25', timeTarget: 16,
      spec: { kind: 'sub', aRange: [21, 99], bRange: [12, 89], borrow: true } },
  ],
};

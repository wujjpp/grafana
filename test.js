const flatted = require('flatted');

let obj = {
  groupid: '43',
  isQiyeManager: false,
  isEntOwner: false,
};

let str = flatted.stringify(obj);

console.log(str);

console.log(flatted.parse(str));

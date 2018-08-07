0: [
      function (require, module, exports) { "use strict";

var _message = require("./message.js");

var _message2 = _interopRequireDefault(_message);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log(_message2.default); /* entry.js */ },
      {"./message.js":1},
    ],1: [
      function (require, module, exports) { "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _name = require("./name.js");

exports.default = "Hello " + _name.name + "!"; /* message.js */ },
      {"./name.js":2},
    ],2: [
      function (require, module, exports) { "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/* name.js */
var name = exports.name = 'World'; },
      {},
    ],
// sls.js
require("ts-node").register({ transpileOnly: true }); // 载入 ts 运行时环境，配置忽略类型错误
module.exports = require("./app.ts"); // 直接引入业务逻辑，下面我会和你一起实现
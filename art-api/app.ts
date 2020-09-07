require("dotenv").config(); // 载入 .env 环境变量，可以将一些密钥配置在环境变量中，并通过 .gitignore 阻止提交
import Koa from "koa";
import Router from "@koa/router";
import koaBody from "koa-body";
import cors from '@koa/cors'
import util from 'util'
import COS from 'cos-nodejs-sdk-v5'
import axios from 'axios'

const app = new Koa();
const router = new Router();

var cos = new COS({
  SecretId: process.env.SecretId,
  SecretKey: process.env.SecretKey
});

const cosInfo = {
  Bucket: "art-oss-1254074572", // 部署oss后获取
  Region: "ap-guangzhou",
}

const putObjectSync = util.promisify(cos.putObject.bind(cos));
const getBucketSync = util.promisify(cos.getBucket.bind(cos));

router.get("/", async (ctx) => {
  ctx.body = 'hello world!'
})

router.get("/api/images", async (ctx) => {
  const files = await getBucketSync({
    ...cosInfo,
    Prefix: "result",
  });

  const cosURL = `https://${cosInfo.Bucket}.cos.${cosInfo.Region}.myqcloud.com`;
  ctx.body = files.Contents.map((it) => {
    const [timestamp, size] = it.Key.split(".jpg")[0].split("__");
    const [width, height] = size.split("_");
    return {
      url: `${cosURL}/${it.Key}`,
      width,
      height,
      timestamp: Number(timestamp),
      name: it.Key,
    };
  })
    .filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp);
});

router.post("/api/images/upload", async (ctx) => {
  const { imgBase64, style } = JSON.parse(ctx.request.body)
  const buf = Buffer.from(imgBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64')
  // 调用tensorflow服务加工图片
  const { data } = await axios.post('https://service-edtflvxk-1254074572.gz.apigw.tencentcs.com/release/', {
    imgBase64: buf.toString('base64'),
    style
  })
  if (data.success) {
    const afterImg = await putObjectSync({
      ...cosInfo,
      Key: `result/${Date.now()}__400_200.jpg`,
      Body: Buffer.from(data.data, 'base64'),
    });
    ctx.body = {
      success: true,
      data: 'https://' + afterImg.Location
    }
  }
});

app.use(cors());
app.use(koaBody({
  formLimit: "10mb",
  jsonLimit: '10mb',
  textLimit: "10mb"
}));
app.use(router.routes()).use(router.allowedMethods());

const port = 8080;
app.listen(port, () => {
  console.log("listen in http://localhost:%s", port);
});

module.exports = app;

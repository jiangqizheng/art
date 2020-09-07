const isProd = process.env.NODE_ENV === "production";

const STATIC_URL =
  "https://art-front-1254074572.cos.ap-guangzhou.myqcloud.com/";

module.exports = {
  assetPrefix: isProd ? STATIC_URL : "",
};

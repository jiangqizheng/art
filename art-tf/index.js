const fs = require("fs");
let tf, jpeg, loadModel, images;

if (process.env.NODE_ENV !== "production") {
  tf = require("@tensorflow/tfjs-node");
  jpeg = require("jpeg-js");
  images = require("images");
  loadModel = async () => tf.node.loadSavedModel("./model");
} else {
  tf = require("/mnt/nodelib/node_modules/@tensorflow/tfjs-node");
  jpeg = require("/mnt/nodelib/node_modules/jpeg-js");
  images = require("/mnt/nodelib/node_modules/images");
  loadModel = async () => tf.node.loadSavedModel("/mnt/model");
}

exports.main_handler = async (event) => {
  const { imgBase64, style } = JSON.parse(event.body)
  if (!imgBase64 || !style) {
    return { success: false, message: "需要提供完整的参数imgBase64、style" };
  }
  time = Date.now();
  console.log("解析图片--");
  const styleImg = tf.node.decodeJpeg(fs.readFileSync(`./imgs/style_${style}.jpeg`));
  const contentImg = tf.node.decodeJpeg(
    images(Buffer.from(imgBase64, 'base64')).size(400).encode("jpg", { operation: 50 }) // 压缩图片尺寸
  );
  const a = styleImg.toFloat().div(tf.scalar(255)).expandDims();
  const b = contentImg.toFloat().div(tf.scalar(255)).expandDims();
  console.log("--解析图片 %s ms", Date.now() - time);


  time = Date.now();
  console.log("载入模型--");
  const model = await loadModel();
  console.log("--载入模型 %s ms", Date.now() - time);


  time = Date.now();
  console.log("执行模型--");
  const stylized = tf.tidy(() => {
    const x = model.predict([b, a])[0];
    return x.squeeze();
  });
  console.log("--执行模型 %s ms", Date.now() - time);

  time = Date.now();

  const imgData = await tf.browser.toPixels(stylized);
  var rawImageData = {
    data: Buffer.from(imgData),
    width: stylized.shape[1],
    height: stylized.shape[0],
  };

  const result = images(jpeg.encode(rawImageData, 50).data)
    .draw(
      images("./imgs/logo.png"),
      Math.random() * rawImageData.width * 0.9,
      Math.random() * rawImageData.height * 0.9
    )
    .encode("jpg", { operation: 50 });

  return { success: true, data: result.toString('base64') };
};
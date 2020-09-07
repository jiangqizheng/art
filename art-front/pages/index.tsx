import React from "react";
import { Card, Upload, message, Radio, Spin, Divider } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import useSWR from "swr";

let origin = 'http://localhost:8080/'
if (process.env.NODE_ENV === 'production') {
  origin = 'https://service-81ajirls-1254074572.gz.apigw.tencentcs.com/release/'
}

const { Dragger } = Upload;

const STYLE_MODE = {
  cube: "cube",
  starryNight: "starryNight",
};

export default function Index() {
  const { data } = useSWR(`${origin}api/images`);

  const [img, setImg] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const uploadImg = React.useCallback((file, style) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const res = await fetch(
        `${origin}api/images/upload`, {
        method: 'POST',
        body: JSON.stringify({
          imgBase64: reader.result,
          style
        }),
        mode: 'cors'
      }
      ).then((res) => res.json());

      if (res.success) {
        setImg(res.data);
      } else {
        message.error(res.message);
      }
      setLoading(false);
    }
  }, []);

  const [artStyle, setStyle] = React.useState(STYLE_MODE.cube);

  return (
    <div>
      <div style={{ textAlign: "center", padding: 16 }}>
        <span style={{ marginRight: 24 }}>风格选择:</span>
        <Radio.Group
          onChange={(e) => {
            setStyle(e.target.value);
          }}
          value={artStyle}
        >
          <Radio value={STYLE_MODE.cube}>方块</Radio>
          <Radio value={STYLE_MODE.starryNight}>星空</Radio>
        </Radio.Group>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Dragger
          style={{ padding: 24 }}
          {...{
            name: "art_img",
            showUploadList: false,
            action: `${origin}/api/upload`,
            onChange: (info) => {
              const { status } = info.file;
              if (status !== "uploading") {
                console.log(info.file, info.fileList);
              }
              if (status === "done") {
                setImg(info.file.response);
                message.success(`${info.file.name} 上传成功`);
                setLoading(false);
              } else if (status === "error") {
                message.error(`${info.file.name} 上传失败`);
                setLoading(false);
              }
            },
            beforeUpload: (file) => {
              if (
                !["image/png", "image/jpg", "image/jpeg"].includes(file.type)
              ) {
                message.error("图片格式必须是 png、jpg、jpeg");
                return false;
              }
              const isLt10M = file.size / 1024 / 1024 < 10;
              if (!isLt10M) {
                message.error("文件大小超过10M");
                return false;
              }
              setLoading(true);

              uploadImg(file, artStyle);
              return false;
            },
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或将文件拖拽到这里上传</p>
          <p className="ant-upload-hint">
            支持扩展名：jpg、jpeg、png，文件最大不超过10M
          </p>
        </Dragger>
        <Spin spinning={loading}>
          <div
            style={{
              width: 200,
              height: 200,
              background: "#f1f1f1",
              borderRadius: 3,
              overflow: "hidden",
              marginLeft: 8,
            }}
          >
            {img && (
              <img
                style={{ width: 200, height: 200, objectFit: "cover" }}
                src={img}
                alt=""
              />
            )}
          </div>
        </Spin>
      </div>
      <Divider />

      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {data ? (
          data.map((it) => (
            <Card
              key={it.url}
              style={{
                width: it.width,
                marginLeft: 24,
                marginBottom: 24,
                borderRadius: 4,
              }}
              hoverable
              cover={<img src={it.url} />}
            >
              <Card.Meta
                description={`上传时间：${dayjs(it.timestamp).format(
                  "YYYY-MM-DD hh:mm:ss"
                )}，尺寸：${it.width}*${it.height}`}
              />
            </Card>
          ))
        ) : (
            <div style={{ textAlign: "center" }}>loading...</div>
          )}
      </div>
    </div>
  );
}

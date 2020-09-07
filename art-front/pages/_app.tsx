import React from "react";
import "antd/dist/antd.css";
import { SWRConfig } from "swr";

export default function MyApp({ Component, pageProps }) {
  return (
    <SWRConfig
      value={{
        refreshInterval: 2000,
        fetcher: (...args) => fetch(args[0], args[1]).then((res) => res.json()),
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  );
}

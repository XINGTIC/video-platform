import '../styles/globals.css'
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>成人视频平台</title>
        <meta name="description" content="成人视频平台 - 每日免费观看" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

import { defineConfig } from "vite";

export default defineConfig(({ command, mode }) => {
  if (mode === "development") {
    // 開発環境でのテスト用
    return {
      build: {
        rollupOptions: {
          input: {
            main: "./index.html",
            // server: "./server/server.ts",
          },
        },
      },
      server: {
        port: 3000, // 使用するポート番号
        // hmr: { port: 3003 }, // ホットリロード用の設定. 今は動かないので意味がない
      },
    };
  };
  // 本番環境のビルド用
  return {
    build: {
      rollupOptions: {
        input: {
          main: "./index.html",
        },
      },
      outDir: "./dist/public",
    },
  };
});

// export default defineConfig({
//   // plugins: [
//   //   VitePluginNode({
//   //     adapter: "express",
//   //     appPath: "./server/server.ts", // アプリケーションエントリーポイント
//   //   }),
//   // ],
//   build: {
//     // lib: {
//     //   entry: resolve(__dirname, "server/server.ts"),
//     //   formats: ["cjs"], // サーバーではCommonJS形式を使用
//     // },
//     outDir: "dist",  // 出力先のフォルダを変更
//     rollupOptions: {
//       input: {
//         main: "./index.html",
//       },
//     },
//   },
//   server: {
//     port: 3000, // 使用するポート番号
//     hmr: { port: 3003 },
//   },
// });

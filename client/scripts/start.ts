#!/usr/bin/env ts-node

import dotenv from "dotenv";

// Apply all the configuration provided in the .env file if it isn't already in
// the environment.
dotenv.config();

import chalk from "chalk";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import { createCompiler, prepareUrls } from "./WebpackDevServerUtils";

import createDevServerConfig from "../config/webpackDevServer.config";
import config from "../src/core/build/config";
import createWebpackConfig from "../src/core/build/createWebpackConfig";

/* eslint-disable no-console */

// Enforce environment to be development.
config.validate().set("env", "development");

process.env.WEBPACK = "true";
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", (err) => {
  throw err;
});

const PORT = config.get("dev_port");
const HOST = "0.0.0.0";

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(`Learn more here: ${chalk.yellow("http://bit.ly/2mwWSwH")}`);
  console.log();
}

const urls = prepareUrls("http", HOST, PORT);
const webpackConfig = createWebpackConfig(config, { watch: true });

const devSocket = {
  warnings: (warnings: any) =>
    (devServer as any).sockWrite(
      (devServer as any).sockets,
      "warnings",
      warnings
    ),
  errors: (errors: any) =>
    (devServer as any).sockWrite((devServer as any).sockets, "errors", errors),
};

// Create a webpack compiler that is configured with custom messages.
const compiler = createCompiler({
  webpack,
  config: webpackConfig,
  appName: "Coral",
  urls,
  // useTypeScript: true, /* This is currently not working, as the ForkTsCheckerWebpackPlugin hooks are not triggering for some reason */
  useTypeScript: false, // This would
  useYarn: false,
  devSocket,
});

// Serve webpack assets generated by the compiler over a web sever.
const serverConfig = createDevServerConfig({
  allowedHost: urls.lanUrlForConfig,
  serverPort: config.get("port"),
  devPort: PORT,
  publicPath: webpackConfig[0].output!.publicPath!,
});

// Disable the host check on the dev server as this is used exclusively for
// development and not in production.
serverConfig.disableHostCheck = true;

const devServer = new WebpackDevServer(compiler, serverConfig);
// Launch WebpackDevServer.
devServer.listen(PORT, HOST, (err: Error) => {
  if (err) {
    return console.log(err);
  }
  console.log(chalk.cyan("Starting the development server...\n"));
  console.log(
    chalk.yellow(`devPort: ${PORT}, serverPort: ${serverConfig.port}`)
  );
});

["SIGINT", "SIGTERM"].forEach((sig: any) => {
  process.once(sig, () => {
    devServer.close();
    process.exit();
  });
});

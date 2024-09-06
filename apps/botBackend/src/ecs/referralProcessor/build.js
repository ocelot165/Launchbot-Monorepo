const esbuild = require("esbuild");

function createBuildSettings(options) {
  return {
    entryPoints: ["src/index.js"],
    outfile: "output/bundle.js",
    bundle: true,
    ...options,
  };
}

const settings = createBuildSettings({ minify: true });

esbuild.build(settings);

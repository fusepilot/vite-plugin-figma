import { constants } from 'fs';
import { access, readFile } from 'fs/promises';
import { relative } from 'path';
import { transformWithEsbuild, PluginOption, EsbuildTransformOptions } from 'vite';

export type PluginConfig = {
  /**
   * The path to the Figma plugin source file. This will be compiled and output to the "main" location set in the manifest.
   * @default 'src/plugin.ts'
   * @type {string}
    */
  entryPath: string,
  /**
  * The path to the Figma manifest.json that describes the plugin.
  * @default 'manifest.json'
  * @type {string}
   */
  manifestPath: string,
  transformOptions?: EsbuildTransformOptions;
};

export default function figmaPlugin(config: PluginConfig = { entryPath: "src/plugin.ts", manifestPath: "manifest.json" }): PluginOption {
  return {
    name: 'vite-figma-plugin',
    enforce: 'post',
    async buildStart() {
      try {
        await access(config.entryPath, constants.F_OK);
      } catch (error) {
        this.error(`Error: Missing plugin file: "${ config.entryPath }."`);
      }
      this.addWatchFile(config.entryPath);

      try {
        await access(config.manifestPath, constants.F_OK);
      } catch (error) {
        this.error(`Error: Missing manifest file: "${ config.manifestPath }."`);
      }
      this.addWatchFile(config.manifestPath);
    },
    async generateBundle(output) {
      let code: string;
      try {
        const pluginCode = await readFile(config.entryPath, 'utf8');
        const res = await transformWithEsbuild(pluginCode, config.entryPath, Object.assign({ minify: true, treeShaking: true }, config.transformOptions));
        code = res.code;
      } catch (error) {
        this.error(`Error: Can't read plugin file: "${ config.entryPath }\n${ error }"`);
      }
      this.emitFile({
        name: config.entryPath,
        fileName: "plugin.js",
        type: "asset",
        source: code
      });

      let manifest: any;
      try {
        const manifestCode = await readFile(config.manifestPath, 'utf8');
        manifest = JSON.parse(manifestCode);
      } catch (error) {
        this.error(`Error: Can't read manifest file: "${ config.manifestPath }\n${ error }"`);
      }

      if (manifest) {
        const correctedManifest = {
          ...manifest,
          main: relative(output.dir ?? "", manifest.main),
          ui: relative(output.dir ?? "", manifest.ui),
        };

        this.emitFile({
          name: config.manifestPath,
          fileName: "manifest.json",
          type: "asset",
          source: JSON.stringify(correctedManifest, undefined, 2)
        });
      }
    }
  };
}
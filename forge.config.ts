import type { ForgeConfig } from '@electron-forge/shared-types'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerDMG } from '@electron-forge/maker-dmg'
import { VitePlugin } from '@electron-forge/plugin-vite'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { FuseV1Options, FuseVersion } from '@electron/fuses'

const config: ForgeConfig = {
  packagerConfig: {
    icon: 'assets/icons/icon',
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      // https://js.electronforge.io/interfaces/_electron_forge_maker_squirrel.InternalOptions.SquirrelWindowsOptions.html
      // timestampServer: 'http://timestamp.comodoca.com',
      //   certificateFile: process.env.WINDOWS_CERTIFICATE_PATH,
      //   certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
      setupIcon: 'assets/icons/icon.ico',
      windowsSign: {
        automaticallySelectCertificate: true,
      },
      iconUrl:
        'https://raw.githubusercontent.com/gwe9001/deploy-helper/refs/heads/main/assets/icons/icon.ico',
    }),
    new MakerZIP(
      {
        // https://js.electronforge.io/interfaces/_electron_forge_maker_zip.MakerZIPConfig.html
      },
      ['darwin'],
    ),
    new MakerDMG({
      appPath: '', // https://github.com/electron/forge/issues/3712
      icon: 'assets/icons/icon.icns',
    }),
    new MakerRpm({
      // https://js.electronforge.io/interfaces/_electron_forge_maker_rpm.InternalOptions.MakerRpmConfigOptions.html
      options: {
        productName: 'Deploy Helper',
        genericName: 'Utility',
        icon: 'assets/icons/icon.svg',
        homepage: 'https://github.com/gwe9001/deploy-helper',
        categories: ['Utility'],
      },
    }),
    new MakerDeb({
      // https://js.electronforge.io/interfaces/_electron_forge_maker_deb.InternalOptions.MakerDebConfigOptions.html
      options: {
        productName: 'Deploy Helper',
        genericName: 'Utility',
        icon: 'assets/icons/icon.svg',
        homepage: 'https://github.com/gwe9001/deploy-helper',
        categories: ['Utility'],
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/electron/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/electron/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'gwe9001',
          name: 'deploy-helper',
        },
        prerelease: true,
        generateReleaseNotes: true,
      },
    },
  ],
}

export default config

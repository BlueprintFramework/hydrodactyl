<h2 align='center'>
  <samp>vite-plugin-manifest-sri</samp>
</h2>

<p align='center'>Subresource Integrity for Vite.js Manifests</p>

<p align='center'>
  <a href='https://www.npmjs.com/package/vite-plugin-manifest-sri'>
    <img src='https://img.shields.io/npm/v/vite-plugin-manifest-sri?color=222&style=flat-square'>
  </a>
  <a href='https://github.com/ElMassimo/vite-plugin-manifest-sri/blob/main/LICENSE.txt'>
    <img src='https://img.shields.io/badge/license-MIT-blue.svg'>
  </a>
</p>

<br>

[Vite]: https://vitejs.dev/
[Vite Ruby]: https://github.com/ElMassimo/vite_ruby
[SRI]: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
[manifest]: https://vitejs.dev/guide/backend-integration.html#backend-integration

[rollup-plugin-sri]: https://github.com/JonasKruckenberg/rollup-plugin-sri
[vite-plugin-sri]: https://github.com/small-tech/vite-plugin-sri
[manifest]: https://vitejs.dev/guide/backend-integration.html
[rendering]: https://vite-ruby.netlify.app/overview.html#in-production

## Why? 🤔

[Vite] does [not provide support](https://github.com/vitejs/vite/issues/2377) for [subresource integrity][sri].

Both <kbd>[vite-plugin-sri]</kbd> and <kbd>[rollup-plugin-sri]</kbd> are good
options to automatically add an [`integrity`][sri] hash to script and link tags. However, these rely on transforming an HTML file, which is typically not the case when using a backend integration such as [Vite Ruby].

This plugin extends [`manifest.json`][manifest] to include an [`integrity`][sri] field which can be used when [rendering] tags.

## Installation 💿

Install the package as a development dependency:

```bash
npm i -D vite-plugin-manifest-sri # pnpm i -D vite-plugin-manifest-sri
```

## Usage 🚀

Add it to your plugins in `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import manifestSRI from 'vite-plugin-manifest-sri'

export default defineConfig({
  plugins: [
    manifestSRI(),
  ],
})
```

Note that the [`build.manifest`](https://vitejs.dev/config/#build-manifest) option
must be enabled in order to generate a `manifest.json` file ([Vite Ruby] enables it by default).

### With [Vite Ruby] 💎

Experimental support is [available](https://github.com/ElMassimo/vite_ruby/issues/176#issuecomment-1015920689), you can try it now by explicitly adding `4.0.0.alpha1` to your `Gemfile`:

```ruby
gem 'vite_rails', '~> 4.0.0.alpha1'
```

## Configuration ⚙️

The following options can be provided:

- <kbd>algorithms</kbd>
  
  Hashing algorithms to use when calculate the integrity hash for each asset.

  __Default:__ `['sha384']`

  ``` js
  manifestSRI({ algorithms: ['sha384', 'sha512'] }),
  ``` 

## Acknowledgements

The following plugins might be useful for Vite apps based around an `index.html` file:

- [`rollup-plugin-sri`](https://github.com/JonasKruckenberg/rollup-plugin-sri)
- [`vite-plugin-sri`](https://github.com/small-tech/vite-plugin-sri)

## License

This library is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

# hCaptcha Loader

This is a JavaScript library to easily configure the loading of the [hCaptcha](https://www.hcaptcha.com) JS client SDK with built-in error handling. It also includes a retry mechanism that will attempt to load the hCaptcha script several times in the event it fails to load due to a network or unforeseen issue.

> [hCaptcha](https://www.hcaptcha.com) is a drop-replacement for reCAPTCHA that protects user privacy.
>
> Sign up at [hCaptcha](https://www.hcaptcha.com) to get your sitekey today. **You need a sitekey to use this library.**

- [hCaptcha Loader](#hcaptcha-loader)
  - [Installation](#installation)
  - [Implementation](#implementation)
  - [Props](#props)
  - [Legacy Support](#legacy-support)
    - [Import Bundle(s)](#import-bundles)
    - [TypeScript](#typescript)
    - [CDN](#cdn)
  - [CSP](#csp)
  - [Sentry](#sentry)

## Installation
```
npm install @hcaptcha/loader
```

Or use UNPKG to load via CDN, [as described below](#CDN).

## Implementation

```js
import { hCaptchaLoader } from '@hcaptcha/loader';

await hCaptchaLoader();

hcaptcha.render({
  sitekey: '<your_sitekey>'
});

const { response } = await hcaptcha.execute({ async: true });
```

## Props
| Name              | Values/Type | Required | Default                            | Description                                                                                                                                               |
|-------------------|-------------|----------|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `loadAsync`       | Boolean     | No       | `true`                             | Set if the script should be loaded asynchronously.                                                                                                        |
| `cleanup`         | Boolean     | No       | `false`                            | Remove script tag after setup.                                                                                                                            |
| `crossOrigin`     | String      | No       | `anonymous`                        | Set script cross origin attribute such as "anonymous".                                                                                                    |
| `scriptSource`    | String      | No       | `https://js.hcaptcha.com/1/api.js` | Set script source URI. Takes precedence over `secureApi`.                                                                                                 |
| `scriptLocation`  | HTMLElement | No       | `document.head`                    | Location of where to append the script tag. Make sure to add it to an area that will persist to prevent loading multiple times in the same document view. |
| `secureApi`       | Boolean     | No       | `false`                            | See enterprise docs.                                                                                                                                      |
| `apihost`         | String      | No       | `-`                                | See enterprise docs.                                                                                                                                      |
| `assethost`       | String      | No       | `-`                                | See enterprise docs.                                                                                                                                      |
| `endpoint`        | String      | No       | `-`                                | See enterprise docs.                                                                                                                                      |
| `hl`              | String      | No       | `-`                                | See enterprise docs.                                                                                                                                      |
| `host`            | String      | No       | `-`                                | See enterprise docs.                                                                                                                                      |
| `imghost`         | String      | No       | `-`                                | See enterprise docs.                                                                                                                                      |
| `recaptchacompat` | String      | No       | `-`                                | See enterprise docs.                                                                                                                                      |
| `reportapi`       | String      | No       | `-`                                | See enterprise docs.                                                                                                                                      |
| `sentry`          | Boolean     | No       | `-`                                | See enterprise docs.                                                                                                                                      |
| `uj`              | Boolean     | No       | `-`                                | See enterprise docs.                                                                                                                                      |
| `custom`          | Boolean     | No       | `-`                                | See enterprise docs.                                                                                                                                      |



## Legacy Support
In order to support older browsers, a separate bundle is generated in which all ES6 code is compiled down to ES5 along with an optional polyfill bundle.

- `polyfills.js`: Provides polyfills for features not supported in older browsers.
- `index.es5.js`: **@hcaptcha/loader** package compiled for ES5 environments.

### Import Bundle(s)
Both bundles generated use IIFE format rather than a more modern import syntax such as `require` or `esm`.

```js
// Optional polyfill import
import '@hCaptcha/loader/dist/polyfills.js';
// ES5 version of hCaptcha Loader
import '@hCaptcha/loader/dist/index.es5.js';

hCaptchaLoader().then(function(hcaptcha) {
    var element = document.createElement('div');
    // hCaptcha API is ready
    hcaptcha.render(element, {
        sitekey: 'YOUR_SITE_KEY',
        // Additional options here
    });
});

```
### TypeScript
To handle typescript with ES5 version, use the following statement.
```ts
declare global {
  interface Window {
    hCaptchaLoader: any;
  }
}
```

### CDN
The hCaptcha Loader targeted for older browsers can also be imported via CDN by using [UNPKG](https://www.unpkg.com/), see example below.


```html
<!DOCTYPE html>
<head>
    <script type="text/javascript" src="https://unpkg.com/@hcaptcha/loader@latest/dist/polyfills.js"></script>
    <script type="text/javascript" src="https://unpkg.com/@hcaptcha/loader@latest/dist/index.es5.js"></script>
</head>
<body>
<div id="container"></div>
<script type="text/javascript">
    hCaptchaLoader().then(function(hcaptcha) {
        // hCaptcha API is ready
        hcaptcha.render('container', {
            sitekey: 'YOUR_SITE_KEY',
            // Additional options here
        });
    });
</script>
</body>
</html>
```

## CSP

Note that you should use the `strict-dynamic` policy for this loader, as it needs to load the SDK via `appendChild()`.

## Sentry

You can disable Sentry error tracking by setting the `sentry` flag to false, which will prevent client-side error reports from being sent to us.

```js
hCaptchaLoader({ sentry: false });
```

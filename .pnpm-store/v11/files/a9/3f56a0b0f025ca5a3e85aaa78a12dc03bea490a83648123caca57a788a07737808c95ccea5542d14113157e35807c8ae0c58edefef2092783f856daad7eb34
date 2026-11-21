# IBM Telemetry JS

> JavaScript telemetry tooling for open/inner source projects

[![IBM Telemetry JS is released under the Apache-2.0 license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/ibm-telemetry/telemetry-js/blob/main/LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/carbon-design-system/carbon/blob/master/CONTRIBUTING.md)

[![NPM version](https://img.shields.io/npm/v/%40ibm/telemetry-js.svg)](https://npmjs.org/package/@ibm/telemetry-js)
[![NPM downloads](https://img.shields.io/npm/dm/%40ibm/telemetry-js.svg)](https://npmjs.org/package/@ibm/telemetry-js)

[![Quality gate status](https://sonarcloud.io/api/project_badges/measure?project=ibm-telemetry_telemetry-js&metric=alert_status)](https://sonarcloud.io/dashboard?id=ibm-telemetry_telemetry-js)
[![Continuous integration checks status](https://github.com/ibm-telemetry/telemetry-js/actions/workflows/ci-checks.yml/badge.svg)](https://github.com/ibm-telemetry/telemetry-js/actions/workflows/ci-checks.yml)

## Quality metrics

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=ibm-telemetry_telemetry-js&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=ibm-telemetry_telemetry-js)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=ibm-telemetry_telemetry-js&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=ibm-telemetry_telemetry-js)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=ibm-telemetry_telemetry-js&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=ibm-telemetry_telemetry-js)

[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=ibm-telemetry_telemetry-js&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=ibm-telemetry_telemetry-js)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=ibm-telemetry_telemetry-js&metric=bugs)](https://sonarcloud.io/summary/new_code?id=ibm-telemetry_telemetry-js)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=ibm-telemetry_telemetry-js&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=ibm-telemetry_telemetry-js)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ibm-telemetry_telemetry-js&metric=coverage)](https://sonarcloud.io/summary/new_code?id=ibm-telemetry_telemetry-js)

## Overview

IBM Telemetry collects anonymized usage data for open source and inner source packages when they
have been instrumented with this JavaScript tooling. The data is reported back to a central server
so package maintainers can analyze usage and make improvements.

IBM Telemetry uses [OpenTelemetry](https://opentelemetry.io) as the foundation of its data transport
format.

Find out more detailed documentation and guidelines by choosing from the following sections what
best describes your use case:

- [I use a package that is collecting data via IBM Telemetry](#ibm-telemetry-collection-basics)
- [I have a package that I want to onboard to IBM Telemetry](#onboarding-a-package-to-ibm-telemetry)
- [I don't work for IBM. Can I still use this?](#i-dont-work-for-ibm-can-i-still-use-this)

## IBM Telemetry collection basics

If you're reading this section, you're likely using a package and have noticed that it is collecting
telemetry data using IBM Telemetry. We call that an "instrumented package". Here's what you need to
know about how that works:

- Telemetry data collection runs on CI servers, like GitHub Actions, Travis CI, or Jenkins. It never
  runs locally on a developer's machine. However, collection will occur when running inside a
  container, like Docker, or Podman, as we consider these environments part of CI workflows.
- When `npm install` (or equivalent) is run on the CI server/container (resulting in the
  instrumented package getting installed), IBM Telemetry gets installed too and runs a script which
  analyzes your source code and captures data about your usage of the instrumented package.
- This data is anonymized and reported back to a server at IBM. Details on what data is captured and
  how data is anonymized are described below.
- Though IBM Telemetry is installed as a regular dependency in the instrumented package, it has no
  exports and therefore **does not impact your project's source code or build output in any way.**
  Said differently: this is not a runtime package. It has no "shippable code". It is static source
  code analysis performed during builds.

The point of capturing this data is to help the open source and inner source maintainers within IBM
by giving them meaningful insights and metrics based on actual data. IBM Telemetry's purpose is to
enable data-driven decision-making to enable maintainers to focus on features that are actually used
by developers like you.

### What data gets collected?

Depending on the nature of the instrumented package and its telemetry configuration, IBM Telemetry
may capture the following data about your project:

**General**

- Date and time of collection
- A de-identified version of your project's git repository URL
- A de-identified version of your project's most recent Git commit hash
- De-identified versions of the branches and tags associated with that commit hash

**NPM data**

- A de-identified version of your project's name (as defined in your package.json file)
- Your project's version (as defined in package.json) with any identifiable parts removed
- De-identified names and versions of your project's dependencies

**JSX data**

- JSX elements (aka components) imported by your project from the instrumented package and details
  about the elements’ attributes (aka props) including names, values, and import paths.

Element attribute names that haven't been **specifically configured** by the instrumented package to
be collected will be anonymized before collection.

Boolean and number values will be captured for allowed attribute names. String values that haven't
been **specifically configured** by the instrumented package and other value types (such as complex
objects or variable names) are also anonymized. This means your project-specific data supplied to
JSX elements will never be captured.

**JS data**

- JavaScript tokens and functions imported by your project from the instrumented package and details
  such as function arguments.

The argument boolean, number, and string values are handled the same as JSX data with instrumented
package allowlist configurations.

Sensitive data that may contain confidential or personally identifiable information that gets
collected by the IBM Telemetry JS tooling gets anonymized/de-identified using the SHA-256
cryptographic function prior to storage in our database, see
[anonymizing](#anonymizing--de-identifying).

### When does data get collected?

Telemetry collection runs exclusively in CI environments. Collection will never occur on local
development environments or on projects that aren't configured to run automated scripts in a CI
environment (e.g. GitHub Actions, Travis CI, etc.) However, if your project runs inside a container
(e.g. Docker, Podman), telemetry may be collected, as containerized environments are considered
production-like and thus fall under the scope of CI workflows.

During a build or any other CI operation that installs package dependencies (`npm install`,
`yarn install`, ...), IBM telemetry will run as a background process and perform data collection.

### Opting out of IBM Telemetry data collection

IBM Telemetry will collect metric data for instrumented packages by default. If your project is
installing an IBM Telemetry-instrumented package and you want to opt-out of metric collection, set
the following environment variable to prevent **any and all** data from being collected in your
project.

#### Unix, Linux, MacOS, BSD, etc.

```sh
IBM_TELEMETRY_DISABLED='true'
```

#### Windows (powershell)

```powershell
$Env:IBM_TELEMETRY_DISABLED='true'
```

### Anonymizing / de-identifying

When data is to be de-identified, it is hashed using the SHA-256 cryptographic function, meaning an
instrumented package owner can query for specific known names/values but can never recover original
values from the stored data in the database.

When data is to be anonymized, it is redacted/substituted in a way where its original value can
never be recovered, and there is no meaningful way to query the data to ascertain its value.

As a general philosophy, we favor anonymizing fields over de-identifying them.

## Onboarding a package to IBM Telemetry

### 1. Obtain a project ID from the IBM Telemetry team by opening an issue [here](https://github.com/ibm-telemetry/telemetry-js/issues/new/choose).

The IBM Telemetry team will assign you a project ID to include in your `telemetry.yml` config file.

### 2. Create a `telemetry.yml` config file.

> [!IMPORTANT] This config file needs to be included in your published NPM package!

This file defines what types of metrics will be captured for your project as well as some general
configuration settings.

See the [telemetry config schema](https://github.com/ibm-telemetry/telemetry-config-schema) for a
detailed explanation of all available configuration options.

Sample:

```yaml path="sample-telemetry.yml"
# yaml-language-server: $schema=https://unpkg.com/@ibm/telemetry-config-schema@1/dist/config.schema.json
version: 1
projectId: '<your assigned project id>'
endpoint: 'https://example.com/v1/metrics'
collect:
  npm:
    dependencies: null
  jsx:
    elements:
      allowedAttributeNames:
        - 'size'
        - 'title'
        - 'etc.'
      allowedAttributeStringValues:
        - 'small'
        - 'medium'
        - 'large'
        - 'title1'
        - 'title2'
        - 'etc.'
```

> **Note**: Though this file can live anywhere within your project, it is customary to place it at
> the root level.

Optionally, use the
[IBM Telemetry Js Config Generator](https://www.npmjs.com/package/@ibm/telemetry-js-config-generator)
script to automatically generate the config file. Remember to verify that the generated output is
correct before using the config file.

### 3. Install `@ibm/telemetry-js` dependency.

> **Note**: This must be installed as a regular dependency, not a dev dependency in the instrumented
> project.

`npm install @ibm/telemetry-js`

or

`yarn add @ibm/telemetry-js`

### 4. Add a `postinstall` script to your `package.json` file.

The `postinstall` script runs telemetry collection anytime your package gets installed inside of
another project.

```jsonc path="package.json"
// ...
"scripts": {
  // ...
  "postinstall": "ibmtelemetry --config=path/to/your/telemetry.yml"
}
// ...
```

Make sure the `--config` option points to your `telemetry.yml` file within your package.

### 5. Add telemetry collection notice to your docs.

You'll want to be as transparent as possible about telemetry collection and the data that is being
stored. You should strongly consider adding an informational paragraph to your docs (usually the
README) as follows:

```markdown
## <picture><source height="20" width="20" media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-dark.svg"><source height="20" width="20" media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-light.svg"><img height="20" width="20" alt="IBM Telemetry" src="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-light.svg"></picture> IBM Telemetry

This package uses IBM Telemetry to collect de-identified and anonymized metrics data. By installing
this package as a dependency you are agreeing to telemetry collection. To opt out, see
[Opting out of IBM Telemetry data collection](https://github.com/ibm-telemetry/telemetry-js/tree/main#opting-out-of-ibm-telemetry-data-collection).
For more information on the data being collected, please see the
[IBM Telemetry documentation](https://github.com/ibm-telemetry/telemetry-js/tree/main#ibm-telemetry-collection-basics).
```

<details>
  <summary>Preview notice</summary>

## <picture><source height="20" width="20" media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-dark.svg"><source height="20" width="20" media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-light.svg"><img height="20" width="20" alt="IBM Telemetry" src="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-light.svg"></picture> IBM Telemetry

This package uses IBM Telemetry to collect de-identified and anonymized metrics data. By installing
this package as a dependency you are agreeing to telemetry collection. To opt out, see
[Opting out of IBM Telemetry data collection](https://github.com/ibm-telemetry/telemetry-js/tree/main#opting-out-of-ibm-telemetry-data-collection).
For more information on the data being collected, please see the
[IBM Telemetry documentation](https://github.com/ibm-telemetry/telemetry-js/tree/main#ibm-telemetry-collection-basics).

</details>

### 6. Publish a new version of your package.

Package consumers need to install a version of your package that includes both the config file and
post-install script in order for telemetry collection to occur.

### 7. Done!

Whenever consumers pick up a version of your package that includes the config file and post-install
script, telemetry collection will run and collect metrics.

## I don't work for IBM. Can I still use this?

Yes! This package can send its output to any OpenTelemetry-compatible collector endpoint via the
standard `v1/metrics`
[Rest API endpoint](https://opentelemetry.io/docs/specs/otlp/#otlphttp-request). All you need to do
is specify your collector endpoint's URL in the `endpoint` configuration setting in your
`telemetry.yml` file.

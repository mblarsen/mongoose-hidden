# Changelog

1.3.0

New: Nested document can be a Schema (thanks to @lykmapipo)

1.2.0

Fixed regressions and added linting

1.1.0

Rewrote to getPathnames to rely on schema tree rather than scheme path. This
should be more reliable.

1.0.0

First release. API unlikely to change.

**0.9.2-3**

Bug-fixes and code improvements.

**0.9.0**

Another internal rewrite to make the hide-logic more readable.

**0.8.0**

Internal rewrite to make nested documents and non-schema-values work.

**0.7.0**

Add `hidden` option.

**0.6.4**

Limited dependency version range for `should`.

**0.6.2**

Removed lodash dependency.

**0.6.1**

Fixes [Issue #3](https://github.com/mblarsen/mongoose-hidden/issues/3)

**0.6.0**

New: If a `transform` has already been set before loading plugin that function will be applied before applying plugin tranforms.

Other: Reduced code size.

**0.4.0**

Changed: Default `virtuals` value set to `{ }` meaning `id` will no longer be hidden by default.

**0.3.2**

Fixed: `id` virtual was included by mistake in `0.3.1`.

**0.3.1**

New: Introduced hiding of virtuals.

**0.3.0**

Changed: `require('mongoose-hidden')` is now `require('mongoose-hidden')(defaults)` with optional defaults.

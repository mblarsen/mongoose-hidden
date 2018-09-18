# Changelog


1.6.0

Drop support for node 4 + 5, supported node version is [Maintenance LTS](https://github.com/nodejs/Release). Version 1.5.4 is the last version
to support older Node versions.

1.5.2

- chore(package): update mongoose to version 5.0.0
- chore(package): update mocha to version 5.0.0

1.5.1

- fix: 1.5.0 would add entries from the schema that were not in the original transform (thanks to @proswdev)

1.5.0

refactor: Replaced get and delete path parts with mpath

I had wanted to get rid of the dot-path code for a long time. With this
commit mpath is introduced. The same package used in Mongoose. It could
not replace the set function, since it has no create functionality but
only set.

I also cleaned up the options and test section so they are easier to
reason about.

Overall a slimmer package.

1.4.2

Chore: Mocha dev dependency upgrade.
New: Added license
Fix: Minor style changes

1.4.1

Chore: Mongoose dev dependency upgrade

1.4.0

Support subdocument schema transformations (thanks to @Bajix)

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

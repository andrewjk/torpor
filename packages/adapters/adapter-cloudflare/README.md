# torpor/adapter-cloudflare

A @torpor/build adapter for deploying to Cloudflare Pages.

## Installation

Install the adapter using `npm` (or your preferred package manager):

```bash
npm install @torpor/adapter-cloudflare
```

Then use the adapter in your `site.config`:

```javascript
import { cloudflare } from "@torpor/adapter-cloudflare";
import { Site } from "@torpor/build";

const site: Site = new Site();
site.adapter = cloudflare;
```

# torpor/adapter-node

A @torpor/build adapter for running on Node.

🚧 WARNING: WORK IN PROGRESS 🚧

## Installation

Install the adapter using `npm` (or your preferred package manager):

```bash
npm install @torpor/adapter-node
```

Then use the adapter in your `site.config`:

```javascript
import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";

const site: Site = new Site();
site.adapter = node;
```

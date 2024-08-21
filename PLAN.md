# Things to do

use: functionality -- or can this just be done with components
dom ref (via bind:this?)
special tags:
~ head
~ html ^
~ md ^
~ trim
~ self
~ component
~ element
~ window
~ body
~ document
^ should these be control instead??
benchmarks
config settings:
~ debug (print more stuff)
can we type context?
all the stuff from https://component-party.dev/
perf!

## Front-end

- /view: JS front-end framework
- /ui: re-usable, unstyled components for use in your UI
- /motion: animations
- /form: forms, validation etc
- /utils: utility functions for use in your UI

- /bin: CLI
- /dev: dev tools
- /lsp: language server

## Sites

- /site: everything needed to create a website
  - middleware for routing, auth etc
- /router: type-safe routing with GETs, POSTs, ACTIONs
- /socket: type-safe websocket communication
- /queue: background tasks, immediate or scheduled
- /auth: authentication and authorization
- /i18n: internationalization
- /logs: logs and (basic) analytics

versioning? with migrations??

## Demos

- /samples: small demo sites for e.g. how to interact with popular libs, how to do auth
- /recipes: real-world working sites
  - product
  - documentation
  - blog
  - the real world app

## Perf

Move more things into the ranges so they can be run when deleting instead of looping through context

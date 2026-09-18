# Vision Engine package

AssistantGM consumes the public npm package root of
`@chrisgawbill/vision-engine`. The dependency resolves from npm's default
registry; no package-specific registry configuration or authentication is
required locally or in CI.

The application imports only `@chrisgawbill/vision-engine`, never internal
engine paths.

## Edit Lines photo requirement

AssistantGM's `edit-lines-defense-even-strength` configuration defines logical
pairing regions without assuming the source photo is a fixed-size screenshot.
The Vision Engine must eventually detect/isolate the game display and resolve
those regions for a perspective phone photo before region-scoped extraction can
be reliable. AssistantGM does not implement that perception behavior.

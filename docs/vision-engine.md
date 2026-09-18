# Vision Engine package

AssistantGM consumes the public npm package root of
`@chrisgawbill/vision-engine`. The dependency resolves from npm's default
registry; no package-specific registry configuration or authentication is
required locally or in CI.

The application imports only `@chrisgawbill/vision-engine`, never internal
engine paths.

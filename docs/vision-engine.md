# Vision Engine package

AssistantGM consumes the public npm package root of
`@chrisgawbill/vision-engine`. The dependency resolves from npm's default
registry; no package-specific registry configuration or authentication is
required locally or in CI.

The application imports only `@chrisgawbill/vision-engine`, never internal
engine paths.

## Edit Lines photo requirement

The Edit Lines photo path (`src/application/vision-engine-edit-lines-photo.ts`)
runs the untouched source photo through Vision Engine's
`DisplayIsolationDetector` (display isolation / perspective normalization,
VE-20) before lineup extraction. When isolation succeeds, the
`edit-lines-defense-even-strength` game-config resolves its three pairing
regions and per-field spatial sources as fractions of the isolated display's
own pixel dimensions (`DisplayDetectionResult.geometry.display`) — never a
fixed or assumed source-photo resolution. When isolation is missing or
ambiguous, the path falls back to Vision Engine's existing auto-detection on
the untouched source photo instead of applying pairing-region assumptions to
an unresolved display; the isolation outcome is always returned to the
caller so that failure stays explicit rather than being silently absorbed.

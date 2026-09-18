# NHL 27 Edit Lines phone-photo trial

The supplied handheld phone photo was used for manual evaluation only and is
not committed to the repository. It shows the TV/game display occupying most,
but not all, of the source image with mild perspective, glare, and display
compression.

Player names and the large line/player cards were readable by inspection. The
small chemistry labels, bottom controls, and some position/overall text are
more likely to be low-confidence or ambiguous. This is a concrete perception
requirement for `vision-engine`: locate the game-display content within a
larger phone photo and expose uncertainty for small text affected by glare and
perspective. AssistantGM does not implement that preprocessing or detection;
the Edit Lines mapping keeps those values missing or ambiguous when returned
that way.

AG-5 outcome: the application path produced the typed three-pairing lineup
shape and preserved missing values, but the current generic detector exposed
only a display/content region and did not provide reliable pairing regions or
field extraction for this photo. The narrow Vision Engine follow-up is
display isolation plus perspective-aware spatial extraction for Edit Lines
regions; no AssistantGM OCR/CV was added.

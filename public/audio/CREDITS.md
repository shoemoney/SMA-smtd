# Firearm audio credits

Bundled recordings are from The Free Firearm Sound Library, created and recorded by Ben Jaszczak, Brian Nelson, Kevin Heras and Matthew Nanney.

Source and license: https://opengameart.org/content/the-free-firearm-sound-library — CC0 / no rights reserved.
CC0 deed: https://creativecommons.org/publicdomain/zero/1.0/

- pistol-shot.wav: Walther PPQ X_39P.wav, copied unchanged from ShoeINATOR's mono 44.1 kHz import.
- rifle-shot.wav: AR-15 D_32P.wav, copied unchanged from ShoeINATOR's mono 44.1 kHz import.
- gunner-burst.wav: AK-47 C_29P.wav, first short burst cropped at 0.98 seconds for 1.12 seconds, converted to mono 44.1 kHz / 16-bit with reduced amplitude and boundary fades.

Attribution is retained voluntarily. These files may be reused under CC0. Game code and procedural effects have their separate MIT license.

Each of the six soldier roles applies its own pitch, volume and filter (lowpass/highpass/bandpass) to these three recordings so every role has a distinct firing voice, all done in code in `src/audio.ts` with no additional recordings. Enemy death, boss death, the Berserker Rage proc and the boss-arrival cue are likewise original procedural tones and a synthesized noise-burst buffer, not recordings.

The suppressed-shot and casing recordings already hosted for Last Engineer are not part of this source package and are not covered by the CC0 statement above. Production on arcade.shoemoney.com reuses those existing same-origin URLs at the owner's request; forks and local builds use original procedural/treatment fallback. See ASSETS.md in the repository for the complete source and rights distinction.

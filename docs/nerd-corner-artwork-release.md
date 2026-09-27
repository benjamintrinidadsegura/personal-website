# Nerd Corner provider artwork release status

## Current boundary

The TMDB and IGDB artwork identities in Nerd Corner were prepared against the providers' documented non-commercial developer-use conditions. This records the implementation basis; it does not classify bts.online legally or grant publication rights.

The user-facing provider links, exact TMDB notice, IGDB source statement, external-image privacy disclosure, host restrictions, accessible alternative text, and graceful artwork fallback are implemented.

## TMDB approved logo

The approved official TMDB logo variant **Alt short (blue) - SVG** is integrated at `public/brand/providers/tmdb-alt-short-blue.svg` without modifying its SVG content, color, crop, or aspect ratio.

Official source: https://www.themoviedb.org/about/logos-attribution

Direct asset source: https://www.themoviedb.org/assets/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg

The exact required TMDB disclaimer remains visible in Nerd Corner Media Credits. Visible IGDB attribution and its provider link remain present. Privacy discloses the external artwork requests to the exact TMDB and IGDB image hosts. Rendering these already resolved images requires no provider runtime API credentials.

The provider-asset release gate is cleared. This records completion of the documented credit implementation and does not claim legal certainty beyond the provider requirements recorded for this integration.

## Commercial-use review trigger

If bts.online's primary purpose later becomes revenue generation, or this artwork or provider data becomes part of a commercial product offering, review TMDB commercial licensing and IGDB commercial partnership requirements before continuing that provider use.

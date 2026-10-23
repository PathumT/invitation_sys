# Grand Opening · Hardware artwork

Saved asset: [grand-opening-hardware-v1.png](./grand-opening-hardware-v1.png).

Created with the built-in `image_gen` tool, using the user's supplied “Grand Opening Hardware Celebration.png” as a visual reference. The generated artwork contains no company names, logos, dates, venue text, or other lettering. Editable React/Konva text layers supply those details from the event form. No CLI/API fallback was used. The original reference file was not modified.

## Final generation prompt

```text
Use case: ads-marketing. Create a reusable editable grand-opening invitation BACKGROUND inspired by the attached reference, portrait aspect ratio 2:3. Retain the rich royal blue/navy construction-site silhouettes, diagonal metallic gold corner trim, polished red satin ribbon with gold scissors across the upper middle, subtle gold confetti along the edges, and photorealistic hardware tools (yellow safety helmet, tape measure, hammer, screws, level and wood) confined to the bottom 14% of the image. Remove ALL brand names, logos, letters, numbers, words, dates and typography from the reference: absolutely NO TEXT anywhere. Do not recreate H & K or Dilneth names. Instead leave calm clean navy negative space for live editable text: top area from 7% to 20% is empty blue, middle 22% to 45% empty blue for a large headline, a ribbon and scissors may occupy only 45%-53%, then 55%-82% clean dark blue for title, host, message and date/venue details. No white logo box, no placeholder lines, no fake labels. Decorative construction elements stay at left/right edges with very low contrast so real text remains legible. High-quality glossy celebratory Sri Lankan hardware store opening flyer aesthetic, gold and red accents. Generate only the raster background artwork, not a UI mockup.
```

The poster composition is in `src/services/grandOpeningTemplate.ts`. Public guests see a compact responsive version with the same artwork, live business/host details, event facts, Maps and RSVP controls; “View invitation artwork” expands the full editable-poster rendering. PNG export uses the 480 × 720 logical canvas at 2× resolution.

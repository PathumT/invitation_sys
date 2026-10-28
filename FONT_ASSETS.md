# Invitation font assets

Noto Sans Sinhala and Noto Sans Tamil (regular 400) are bundled through the pinned @fontsource packages. Copyright 2022 The Noto Project Authors. Both packages include SIL Open Font License 1.1; full notices are retained in public/licenses/NotoSansSinhala-OFL.txt and public/licenses/NotoSansTamil-OFL.txt.

Font files are served with the app rather than requested from an external font CDN. Font faces use swap display; the editor explicitly loads the script faces before canvas rendering, and exports wait for the font-loading set. Existing design font choices are preserved with Sinhala/Tamil fallback faces added. Interface language activation remains English-only until translation review.

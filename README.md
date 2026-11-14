# Ottomila — expeditions to the eight-thousanders

A demo site for a fictional expedition company: Ama Dablam, Manaslu, Everest and K2 drawn as live topographic maps from real satellite elevation data. Scroll a file and the camera climbs the route camp by camp. A four-question clearance stamps which mountains you could attempt. Booking is by phone only.

**Live:** https://yehorss.github.io/ottomila/ · Italian, English, Ukrainian

- Terrain: Copernicus DEM GLO-30, a 20 km square per mountain baked into 16-bit PNGs (`tools/bake.mjs`), draped with real Sentinel-2 imagery at 10 m (`tools/satellite.mjs` reads a cloud-free autumn pass straight from the open COGs on AWS, tones the 16-bit bands and resamples from UTM), with 500 m contours on top.
- Routes for K2 and Ama Dablam are traced down their ridges on the terrain (`tools/ridge.mjs`); camps sit where the route reaches their height.
- Vite + TypeScript, no framework. `npm test` covers the clearance rules, the oxygen formula, the camera path, heightmap decoding and the three languages.

The company, prices, dates and phone number are invented. Mountains, heights, camps and history are real; sources are listed on the site.

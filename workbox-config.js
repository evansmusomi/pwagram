module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{html,ico,json,css,js}",
    "src/images/*.{png,jpg}"
  ],
  "swDest": "public/service-worker.js",
  "swSrc": "public/sw-base.js",
  "globIgnores": [
    "../workbox-config.js",
    "sw.js",
    "help/**"
  ]
};
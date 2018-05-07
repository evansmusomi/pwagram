module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{html,ico,json,css,js}",
    "src/images/*.{png,jpg}"
  ],
  "swDest": "public/service-worker.js",
  "globIgnores": [
    "../workbox-config.js",
    "sw.js",
    "help/**"
  ]
};
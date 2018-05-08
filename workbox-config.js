module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{html,ico,json,css}",
    "src/images/*.{png,jpg}",
    "src/js/*.min.js"
  ],
  "swDest": "public/service-worker.js",
  "swSrc": "public/sw-base.js",
  "globIgnores": [
    "../workbox-config.js",
    "sw.js",
    "sw-base.js",
    "help/**"
  ]
};
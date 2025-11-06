module.exports = {
  content: ['./build/index.html', './build/static/js/*.js'],
  css: ['./build/static/css/*.css'],
  safelist: {
    // No queremos que purgue las clases de react-slick o leaflet
    greedy: [/slick-/, /leaflet-/, /rbc-/],
  },
  // Podríamos añadir un extractor para clases con caracteres especiales si fuera necesario
};
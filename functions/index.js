const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {getStorage} = require("firebase-admin/storage");
const os = require("os");
const path = require("path");
const fs = require("fs");

admin.initializeApp();
const db = admin.firestore();

// CONFIGURACIÓN
const DOMAIN = "https://turismosanantoniopalopo.com";
// IMPORTANTE: Definimos explícitamente el bucket
const BUCKET_NAME = "turismo-municipal.firebasestorage.app";

/**
 * Genera el sitemap XML.
 * @param {Date|null} lastmod - Fecha de referencia para logs.
 * @return {Promise<string>} XML del sitemap.
 */
async function generateSitemapContent(lastmod) {
  try {
    functions.logger.log("INICIO: Generando contenido del sitemap...");

    const urls = [
      {loc: DOMAIN, priority: "1.0", changefreq: "weekly"},
      {loc: `${DOMAIN}/mapa`, priority: "0.9", changefreq: "weekly"},
      {loc: `${DOMAIN}/categorias`, priority: "0.8", changefreq: "monthly"},
      {loc: `${DOMAIN}/eventos`, priority: "0.8", changefreq: "monthly"},
      {loc: `${DOMAIN}/historia`, priority: "0.8", changefreq: "monthly"},
      {loc: `${DOMAIN}/sobre-nosotros`, priority: "0.8", changefreq: "monthly"},
      {loc: `${DOMAIN}/contacto`, priority: "0.7", changefreq: "monthly"},
      {loc: `${DOMAIN}/privacidad`, priority: "0.5", changefreq: "yearly"},
      {loc: `${DOMAIN}/terminos`, priority: "0.5", changefreq: "yearly"},
    ];

    // 1. SITIOS
    functions.logger.log("Consultando colección 'sites'...");
    const sitesQuery = db.collection("sites");
    const sitesSnapshot = await sitesQuery.get();
    functions.logger.log(`Sitios encontrados: ${sitesSnapshot.size}`);

    sitesSnapshot.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const category = data.parentCategory || "sitios";

      const lm = data.lastmod?.toDate().toISOString().split("T")[0] ||
                 new Date().toISOString().split("T")[0];

      const catPath = encodeURIComponent(category.toLowerCase());
      const slugPath = encodeURIComponent(slug);

      urls.push({
        loc: `${DOMAIN}/${catPath}/${slugPath}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: lm,
      });
    });

    // 2. EVENTOS
    functions.logger.log("Consultando colección 'events'...");
    const eventsQuery = db.collection("events");
    const eventsSnapshot = await eventsQuery.get();
    functions.logger.log(`Eventos encontrados: ${eventsSnapshot.size}`);

    eventsSnapshot.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const lm = data.lastmod?.toDate().toISOString().split("T")[0] ||
                 new Date().toISOString().split("T")[0];

      urls.push({
        loc: `${DOMAIN}/eventos/${encodeURIComponent(slug)}`,
        priority: "0.7",
        changefreq: "daily",
        lastmod: lm,
      });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    functions.logger.log("Sitemap XML generado correctamente en memoria.");
    return xml;
  } catch (error) {
    functions.logger.error("ERROR CRITICO en generateSitemapContent:", error);
    throw error;
  }
}

/**
 * HTTP para pruebas: /generateSitemap
 */
exports.generateSitemapHttp = onRequest(async (req, res) => {
  try {
    const sitemapXml = await generateSitemapContent(null);
    res.set("Content-Type", "application/xml");
    res.status(200).send(sitemapXml);
  } catch (error) {
    functions.logger.error("Error Http:", error);
    res.status(500).send("Error interno: " + error.message);
  }
});

/**
 * Serve Sitemap desde Storage (Hosting Rewrite)
 */
exports.serveSitemap = onRequest({cors: true}, async (req, res) => {
  try {
    functions.logger.log("Iniciando serveSitemap...");

    const bucket = getStorage().bucket(BUCKET_NAME);
    const file = bucket.file("sitemaps/sitemap.xml");
    const [exists] = await file.exists();

    if (!exists) {
      functions.logger.warn("El archivo no existe. Creando nuevo...");
      const sitemapXml = await generateSitemapContent(null);

      functions.logger.log(`Guardando en bucket: ${BUCKET_NAME}`);
      await file.save(sitemapXml, {
        contentType: "application/xml",
        public: true,
        metadata: {cacheControl: "public, max-age=3600"},
      });

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.status(200).send(sitemapXml);
      return;
    }

    functions.logger.log("Archivo encontrado. Enviando al cliente.");
    const [contents] = await file.download();
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.status(200).send(contents);
  } catch (error) {
    functions.logger.error("ERROR en serveSitemap:", error);
    res.status(500).send("Error sirviendo sitemap. Ver logs.");
  }
});

/**
 * Cron Job: Cada 72 horas
 */
exports.updateSitemapScheduled = onSchedule("every 72 hours", async (event) => {
  try {
    const sitemapXml = await generateSitemapContent(null);
    const tempFilePath = path.join(os.tmpdir(), "sitemap.xml");
    fs.writeFileSync(tempFilePath, sitemapXml);

    const bucket = getStorage().bucket(BUCKET_NAME);
    const destination = "sitemaps/sitemap.xml";

    const [file] = await bucket.upload(tempFilePath, {
      destination: destination,
      public: true,
      metadata: {
        contentType: "application/xml",
        cacheControl: "public, max-age=3600",
      },
    });

    await file.makePublic();
    functions.logger.log("Cron Job: Sitemap actualizado exitosamente.");
  } catch (error) {
    functions.logger.error("Error en Cron Job:", error);
  }
  return null;
});

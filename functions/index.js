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

const DOMAIN = "https://turismosanantoniopalopo.com";

/**
 * Genera el contenido XML del sitemap.
 * @param {Date|null} lastmod - La fecha de última modificación para filtrar.
 * @return {Promise<string>} El contenido del sitemap en formato XML.
 */
async function generateSitemapContent(lastmod) {
  try {
    let sitesQuery = db.collection("sites");

    if (lastmod) {
      functions.logger.log(
          `Generando sitemap para sitios modificados desde: ${
            lastmod.toISOString()}`,
      );
      sitesQuery = sitesQuery.where("lastmod", ">", lastmod);
    } else {
      functions.logger.log("Generando sitemap completo por primera vez.");
    }

    const sitesSnapshot = await sitesQuery.get();

    const urls = [
      // URLs estáticas
      {loc: DOMAIN, priority: "1.0", changefreq: "weekly"},
      {loc: `${DOMAIN}/mapa`, priority: "0.9", changefreq: "weekly"},
      {loc: `${DOMAIN}/categorias`, priority: "0.8", changefreq: "monthly"},
      {loc: `${DOMAIN}/eventos`, priority: "0.8", changefreq: "monthly"},
    ];

    // Agregar todas las páginas de sitios turísticos
    sitesSnapshot.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const category = data.parentCategory || "sitios";

      urls.push({
        loc: `${DOMAIN}/${encodeURIComponent(
            category.toLowerCase(),
        )}/${encodeURIComponent(slug)}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: data.lastmod?.toDate().toISOString().split("T")[0] ||
                 new Date().toISOString().split("T")[0],
      });
    });

    // Generar XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    return xml;
  } catch (error) {
    functions.logger.error("Error generando sitemap:", error);
    throw new functions.https.HttpsError(
        "internal",
        "No se pudo generar el sitemap.",
    );
  }
}

/**
 * Función HTTP para generar y devolver el sitemap.
 * Se puede usar para pruebas: /generateSitemap
 */
exports.generateSitemapHttp = onRequest(async (req, res) => {
  try {
    // Genera sitemap completo para pruebas
    const sitemapXml = await generateSitemapContent(null);
    res.set("Content-Type", "application/xml");
    res.status(200).send(sitemapXml);
  } catch (error) {
    functions.logger.error("Error en generateSitemapHttp:", error);
    res.status(500).send("Error al generar el sitemap.");
  }
});

/**
 * NUEVA FUNCIÓN: Sirve el sitemap desde Storage para Firebase Hosting
 * Esta función se usa en el rewrite de firebase.json
 */
exports.serveSitemap = onRequest({cors: true}, async (req, res) => {
  try {
    const bucket = getStorage().bucket();
    const file = bucket.file("sitemaps/sitemap.xml");

    // Verificar si el archivo existe
    const [exists] = await file.exists();

    if (!exists) {
      functions.logger.warn("Sitemap no encontrado, generando uno nuevo...");
      // Generar sitemap si no existe
      const sitemapXml = await generateSitemapContent(null);
      await file.save(sitemapXml, {
        contentType: "application/xml",
        public: true,
        metadata: {
          cacheControl: "public, max-age=3600",
        },
      });

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.status(200).send(sitemapXml);
      return;
    }

    // Descargar y servir el archivo
    const [contents] = await file.download();

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.status(200).send(contents);
  } catch (error) {
    functions.logger.error("Error sirviendo sitemap:", error);
    res.status(500).send("Error al servir el sitemap.");
  }
});

/**
 * Función programada que genera el sitemap y lo sube a Firebase Storage.
 * Se ejecuta automáticamente cada 3 días.
 */
exports.updateSitemapScheduled = onSchedule("every 72 hours", async (event) => {
  const sitemapMetaRef = db.collection("settings").doc("sitemap_meta");
  const sitemapMetaSnap = await sitemapMetaRef.get();

  const lastRun = sitemapMetaSnap.exists ?
sitemapMetaSnap.data().lastRun.toDate() :
null;
  const newRunTime = new Date();

  const sitemapXml = await generateSitemapContent(lastRun);

  // Si no hay cambios, no hacemos nada para ahorrar operaciones.
  if (!sitemapXml) return null;

  const tempFilePath = path.join(os.tmpdir(), "sitemap.xml");
  fs.writeFileSync(tempFilePath, sitemapXml);

  const bucket = getStorage().bucket();
  const destination = "sitemaps/sitemap.xml";

  const [file] = await bucket.upload(tempFilePath, {
    destination: destination,
    public: true,
    metadata: {
      contentType: "application/xml",
      cacheControl: "public, max-age=3600", // Cachear por 1 hora
    },
  });

  // Asegurarse de que el archivo sea público.
  await file.makePublic();

  await sitemapMetaRef.set({
    lastRun: newRunTime,
  });

  functions.logger.log(
      `Sitemap actualizado exitosamente a las ${newRunTime.toISOString()}`,
  );
  return null;
});

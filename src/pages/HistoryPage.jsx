import React, { useEffect } from 'react';

function HistoryPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="info-page-container">
      <header className="info-page-header">
        <h1>Historia y Cultura de San Antonio Palopó</h1>
        <p className="info-page-subtitle">
          Una vista profunda a nuestras raíces kaqchikeles, tradiciones milenarias y evolución a orillas del Lago de Atitlán.
        </p>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Atitlan_lake.jpg/1280px-Atitlan_lake.jpg"
          alt="img"
          className="info-page-image"
        />
      </header>

      <section className="info-page-section">
        <h2>Nuestra Historia Ancestral</h2>
        
        <h3>Época Prehispánica</h3>
        <p>
          Los primeros pobladores de <strong>San Antonio Palopó</strong> fueron del linaje <em>Xahil</em> del pueblo kaqchikel, 
          una de las civilizaciones mayas más importantes del altiplano guatemalteco. El centro ceremonial de 
          <strong>Panimaquim</strong> (en kaqchikel: "en el gran pajonal") se estableció en las cercanías de donde 
          actualmente se ubica la cabecera municipal. Este sitio arqueológico conserva montículos y restos de una pequeña plaza 
          que demuestran la importancia del lugar antes de la llegada de los españoles en 1524.
        </p>
        <p>
          Según el <em>Memorial de Sololá</em>, una de las principales fuentes documentales indígenas, el líder local 
          <strong>Xahil Batzín de Palopó</strong> fue asesinado por los tzutujiles el 7 de enero de 1570, hecho que 
          demuestra la antigüedad y relevancia política del asentamiento en la región.
        </p>

        <h3>Período Colonial (1524-1821)</h3>
        <p>
          Durante la época colonial, San Antonio Palopó formó parte del <strong>corregimiento de Tecpán Atitlán</strong> 
          y posteriormente de la alcaldía mayor de Sololá. Estuvo adscrito desde 1540 hasta 1754 a la 
          <em>"Provincia del Santísimo Nombre de Jesús"</em> de los frailes franciscanos, perteneciendo al curato 
          con sede en San Francisco Panajachel.
        </p>
        <p>
          Los franciscanos implementaron un sistema educativo riguroso: diariamente se impartía doctrina cristiana 
          a las niñas a partir de los seis años a las dos de la tarde, y a los niños al ocaso, durante dos horas. 
          La enseñanza incluía recitar toda la doctrina, oraciones y ejercicios del catecismo, a cargo del doctrinero 
          y dos indígenas ancianos llamados fiscales. Los adultos recibían instrucción los domingos después de la misa, 
          con las puertas cerradas de la iglesia, rezando todas las oraciones en idioma kaqchikel.
        </p>
        <p>
          El cronista <strong>Francisco Antonio de Fuentes y Guzmán</strong> registró en su <em>"Recordación Florida"</em> 
          que a finales del siglo XVII, la población era de 190 indígenas kaqchikeles dedicados principalmente a la pesca 
          en el lago. En 1770, el arzobispo <strong>Pedro Cortés y Larraz</strong> describió que habitaban 200 familias 
          indígenas con un total de 654 personas.
        </p>

        <h3>Independencia y Estado de Los Altos (1821-1871)</h3>
        <p>
          Tras la independencia centroamericana, San Antonio Palopó fue parte del distrito de Sololá en el Estado de Guatemala. 
          Del 3 de abril de 1838 al 1840, formó parte del efímero <strong>Estado de Los Altos</strong>, un intento de secesión 
          de la región occidental que fue aplastado por el general Rafael Carrera, quien reintegró el territorio al Estado de Guatemala.
        </p>
        <p>
          En 1825, la Asamblea Legislativa dividió Guatemala en once distritos judiciales, y San Antonio Palopó fue parte 
          del circuito de Sololá en el Distrito N.º7, junto con Concepción, Panajachel, Santa Catarina Palopó, 
          San Andrés Semetabaj y otros municipios de la región.
        </p>

        <h3>Época Liberal y Visita de los Maudslay (1871-presente)</h3>
        <p>
          Tras la Reforma Liberal de 1871, San Antonio Palopó permaneció dentro del departamento de Sololá cuando 
          se creó el departamento de Quiché en 1872. En 1892, el arqueólogo inglés <strong>Alfred Percival Maudslay</strong> 
          y su esposa Anne visitaron el pueblo y documentaron minuciosamente la vida local en el libro 
          <em>"A Glimpse at Guatemala"</em>.
        </p>
        <p>
          Los Maudslay describieron casitas cuadradas de piedras rústicas con armazones de varas de madera y tejados de 
          hojas de palma, cada una rodeada por cercas de piedra. Observaron que solo había cinco ladinos: el maestro 
          de escuela y su esposa, el secretario municipal y dos mujeres comerciantes. El resto de la población era 
          indígena, y la municipalidad estaba completamente gobernada por autoridades indígenas.
        </p>
        <p>
          Documentaron tradiciones fascinantes como la transmisión dominical de instrucciones municipales: los principales 
          del pueblo, ataviados con ropajes negros y varas edilicias, iban de casa en casa dando instrucciones, culminando 
          con gritos sonoros que se respondían a la distancia.
        </p>

        <img
          src="https://upload.wikimedia.org/wikipedia/commons/b/b3/San_Antonio_Palopo_Solola_Guatemala.jpg"
          alt="img"
          className="info-page-image"
        />
      </section>

      <section className="info-page-section">
        <h2>Cultura y Tradiciones Kaqchikeles</h2>
        
        <h3>El Pueblo Kaqchikel</h3>
        <p>
          San Antonio Palopó es hogar de la comunidad <strong>kaqchikel</strong>, una de las etnias mayas más numerosas 
          de Guatemala con aproximadamente 1,068,000 personas. Los kaqchikeles llegaron a Mesoamérica como parte de las 
          primeras migraciones toltecas desde México, estableciéndose en el altiplano del país durante el período postclásico.
        </p>
        <p>
          Según los <em>Anales de los Caqchikeles</em>, una ciudad llamada Tulán fue el punto de partida desde donde 
          emigró esta comunidad hacia el sur de México y Guatemala. El nombre "kaqchikel" proviene de un árbol rojo 
          que trajeron de Tulán y que les sirvió como bastón sagrado.
        </p>

        <h3>Traje Típico y Textiles</h3>
        <p>
          La comunidad kaqchikel conserva una de las tradiciones textiles más variadas y mejor preservadas de Guatemala. 
          El traje típico actual es la fusión de prendas precolombinas como el <em>wex</em> (pantalón tradicional), 
          fajas y faldillas mayas, con vestimentas del siglo XVII de agricultores y artesanos españoles.
        </p>
        <p>
          En San Antonio Palopó, el <em>wex</em> masculino es muy corto, similar a una pantaloneta, quedando completamente 
          oculto por la <em>"rodillera"</em> o <em>"xerca"</em>, una prenda de lana que se porta alrededor de la cintura. 
          El traje femenino se caracteriza por tonos azules y detalles blancos que simbolizan la conexión con el lago y el cielo.
        </p>
        <p>
          Todas las prendas se confeccionan en telares de cintura tradicionales, similares a los que aparecen en códices 
          y manuscritos mexicanos antiguos. Las mujeres pueden verse tejiendo con el telar de espalda en cooperativas 
          que mantienen vivas las tradiciones mientras generan ingresos familiares.
        </p>

        <h3>Idioma y Comunicación</h3>
        <p>
          El <strong>kaqchikel</strong> es el idioma predominante en San Antonio Palopó, hablado por aproximadamente 
          366,845 personas en Guatemala. Se habla en 52 municipios de varios departamentos, siendo Sololá uno de los 
          principales centros de esta lengua maya. El español también es ampliamente conocido, creando una comunidad bilingüe.
        </p>

        <h3>Ceremonias y Espiritualidad Maya</h3>
        <p>
          Los habitantes de San Antonio Palopó mantienen vivas las <strong>ceremonias mayas ancestrales</strong> en sitios 
          sagrados de la región. Estas incluyen rituales para pedir por las cosechas, la salud familiar y el equilibrio 
          espiritual. El calendario maya continúa siendo una guía importante para las actividades agrícolas y ceremoniales.
        </p>
        <p>
          La <em>fiesta patronal</em> se celebra el 13 de junio en honor a <strong>San Antonio de Padua</strong>, 
          combinando tradiciones católicas con elementos de la espiritualidad maya. Las celebraciones incluyen procesiones, 
          danzas tradicionales como el <em>Baile del Negrito</em> y el <em>Baile del Torito</em>, música de marimba, 
          chirimía y tambores.
        </p>

        <img
          src="img"
          alt="Traje típico kaqchikel tradicional"
          className="info-page-image"
        />
      </section>

      <section className="info-page-section">
        <h2>Economía y Artesanías</h2>
        
        <h3>Agricultura Tradicional</h3>
        <p>
          La <strong>agricultura</strong> sigue siendo fundamental para la economía local, representando el 60% de la 
          actividad económica del municipio. Debido a la fertilidad del suelo volcánico y el clima templado, se cultivan 
          principalmente maíz y frijoles, elementos esenciales de la dieta local. Las huertas familiares producen verduras 
          y frutas que complementan la alimentación y generan ingresos adicionales.
        </p>

        <h3>Cerámica Artesanal</h3>
        <p>
          San Antonio Palopó es mundialmente reconocido por su <strong>cerámica distintiva</strong>, una tradición que 
          floreció especialmente desde los años 90 con la influencia del ceramista estadounidense Ken Edwards. 
          Los artesanos locales transformaron esta influencia en su propia forma de arte, creando piezas únicas 
          pintadas a mano con técnicas contemporáneas.
        </p>
        <p>
          Los talleres cerámicos permiten a visitantes observar el proceso completo: desde el moldeado del barro 
          guatemalteco hasta la pintura manual con diseños lineales y colores pintorescos que representan la cultura local. 
          Se producen tazas, platos, jarrones y utensilios decorativos con motivos de colibríes, flores y elementos 
          de la naturaleza del lago.
        </p>

        <h3>Turismo Sostenible</h3>
        <p>
          El <strong>turismo</strong> representa el 40% restante de la actividad económica, aprovechando la ubicación 
          privilegiada a orillas del Lago de Atitlán. Los visitantes pueden disfrutar de ecoturismo, caminatas con vistas 
          espectaculares de los volcanes, paseos en kayak, y visitas culturales a las comunidades locales.
        </p>
        <p>
          Los hoteles, restaurantes y servicios turísticos generan empleo para los residentes y fomentan el crecimiento 
          económico sostenible. El municipio cuenta con muelles públicos, malecones turísticos y miradores naturales 
          que ofrecen perspectivas únicas del lago y los volcanes circundantes.
        </p>

        <h3>Gastronomía Local</h3>
        <p>
          Entre los platillos tradicionales destacan el <em>caldo de gallina criolla</em> para celebraciones familiares, 
          los <em>tamales colorados</em> preparados con maíz y carne envueltos en hojas de plátano, y diversas 
          preparaciones de <em>pescado del lago</em> cocinado frito o en ceviche.
        </p>
      </section>

      <section className="info-page-section">
        <h2>Organización Territorial y Demográfica</h2>
        
        <h3>División Político-Administrativa</h3>
        <p>
          San Antonio Palopó tiene una extensión territorial de <strong>34 km²</strong> y se divide en 14 centros poblados:
        </p>
        <ul>
          <li><strong>Cabecera Municipal:</strong> San Antonio Palopó</li>
          <li><strong>Aldeas:</strong> Agua Escondida, Xequistel</li>
          <li><strong>Caseríos:</strong> Chuiquistel, Chuisajcap, El Porvenir Chipop, Patzaj, San José Xiquinabaj</li>
          <li><strong>Cantones:</strong> Chitulul, Ojo de Agua, Tzampetey, El Naranjo, Tzancorral, San Gabriel</li>
        </ul>

        <h3>Demografía</h3>
        <p>
          La población total es de aproximadamente <strong>15,362 habitantes</strong> según el censo de 2018, 
          con una densidad poblacional de 452 habitantes por km². La distribución es 35% urbana (5,377 habitantes) 
          y 65% rural (9,985 habitantes). Las mujeres representan el 51% de la población total.
        </p>
        <p>
          El 95% de la población se identifica como maya kaqchikel, manteniendo sus tradiciones culturales, 
          indumentaria y idioma ancestral. La tasa de alfabetismo alcanza el 70%, reflejando los esfuerzos 
          educativos de la comunidad.
        </p>

        <h3>Ubicación Geográfica</h3>
        <p>
          Situado a <strong>1,570 metros sobre el nivel del mar</strong> en la orilla oriental del Lago de Atitlán, 
          San Antonio Palopó se encuentra a 27 km de la cabecera departamental de Sololá y a 158 km de la Ciudad de Guatemala. 
          Colinda al norte con San Andrés Semetabaj y Santa Catarina Palopó, al este con Patzún (Chimaltenango), 
          al sur con San Lucas Tolimán, y al oeste con el majestuoso Lago de Atitlán.
        </p>
      </section>

      <section className="info-page-section">
        <h2>Gobierno Municipal Actual</h2>
        <h3>Alcalde Municipal</h3>
        <p>
          <strong>Nombre:</strong> Rufino Caníz Vicente<br />
          <strong>Período:</strong> 2024 - 2028<br />
          <strong>Lema de Administración:</strong> "Con la guía de Dios construimos juntos un mejor San Antonio Palopó"
        </p>
        <p>
          La actual administración municipal se enfoca en proyectos de infraestructura como el mejoramiento de caminos rurales, 
          rehabilitación de servicios de agua y saneamiento en escuelas, construcción de sistemas de alcantarillado sanitario, 
          y la recuperación de la cinta asfáltica que comunica con Santa Catarina Palopó.
        </p>

        <h3>Clasificación Municipal</h3>
        <p>
          San Antonio Palopó está clasificado como <strong>municipalidad de 4ta. categoría</strong> dentro del 
          departamento de Sololá, que cuenta con 19 municipios en total.
        </p>
      </section>

      <section className="info-page-section">
        <h2>Personajes Históricos Relevantes</h2>
        <ul>
          <li><strong>Xahil Batzín de Palopó</strong> – Líder kaqchikel del linaje Xahil, registrado en documentos de 1570 como una figura política importante de la región.</li>
          <li><strong>Alfred Percival Maudslay</strong> – Arqueólogo británico que documentó detalladamente la vida del pueblo en 1892, proporcionando valiosa información etnográfica.</li>
          <li><strong>Anne Maudslay</strong> – Esposa del arqueólogo, autora del libro "A Glimpse at Guatemala" donde plasmó sus observaciones sobre las costumbres locales.</li>
          <li><strong>Pedro Cortés y Larraz</strong> – Arzobispo de Guatemala que visitó y documentó la población del municipio entre 1768-1770.</li>
          <li><strong>Ken Edwards</strong> – Ceramista estadounidense que llegó en los años 90 y cuya influencia transformó la tradición cerámica local.</li>
        </ul>
        <p>
          El municipio también ha visto surgir maestros, artesanos y líderes comunitarios contemporáneos que promueven 
          la educación bilingüe, el turismo sostenible y la preservación del idioma y cultura kaqchikel.
        </p>
      </section>

      <section className="info-page-section">
        <h2>Origen del Nombre</h2>
        <p>
          El vocablo <strong>Palopó</strong> proviene de la fusión de dos palabras: <em>"palo"</em> del castellano (árbol) 
          y <em>"po"</em>, apócope de <em>"poj"</em> en kaqchikel (amate). Se interpreta como <strong>"árbol de amate"</strong>, 
          debido a la abundancia de este árbol tropical (Ficus species) en la región, que ha sido utilizado tradicionalmente 
          para la elaboración de papel amate y tiene importancia cultural en las tradiciones mesoamericanas.
        </p>
      </section>

      <footer className="info-page-footer">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/3/3b/Coat_of_arms_of_Guatemala.svg"
          alt="img"
          className="info-page-logo"
        />
        <p>
          <em>
            Fuentes: Municipalidad de San Antonio Palopó, Memorial de Sololá, "A Glimpse at Guatemala" (Anne Maudslay), 
            Instituto Nacional de Estadística (INE), Sistema de Información Cultural (SIC), 
            Universidad Rafael Landívar - Historia Kaqchikel, y registros del Ministerio de Cultura y Deportes.
          </em>
        </p>
      </footer>
    </div>
  );
}

export default HistoryPage;
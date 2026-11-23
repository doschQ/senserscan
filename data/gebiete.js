/*
 * Klima Chancen – Gebietsgrenzen (Analyseraum, Planungsgebiet)
 * Kopie von data/vaals_gebiete_wgs84.geojson als Skript, damit die App auch direkt
 * aus dem Ordner (file://) läuft. Bei Änderungen beide Dateien gleich halten.
 */
window.SENSERSCAN_GEBIETE = {
 "type": "FeatureCollection",
 "name": "vaals_gebiete_wgs84",
 "features": [
  {
   "type": "Feature",
   "properties": {
    "id": 2,
    "name": "Planungsgebiet Selzerbeek",
    "flaeche_ha": 20.35,
    "umfang_m": 1811,
    "quelle": "Shapefile Lehrstuhl (EPSG 25832), umprojiziert nach WGS84"
   },
   "geometry": {
    "type": "Polygon",
    "coordinates": [
     [
      [
       6.0236076,
       50.7735914
      ],
      [
       6.0198054,
       50.774525
      ],
      [
       6.0174253,
       50.7752913
      ],
      [
       6.0177027,
       50.7756375
      ],
      [
       6.0176705,
       50.776143
      ],
      [
       6.01717,
       50.7766139
      ],
      [
       6.0181392,
       50.7771811
      ],
      [
       6.0198239,
       50.7788291
      ],
      [
       6.0259175,
       50.7762317
      ],
      [
       6.0237269,
       50.7735662
      ],
      [
       6.0236076,
       50.7735914
      ]
     ]
    ]
   }
  },
  {
   "type": "Feature",
   "properties": {
    "id": 4,
    "name": "Analyseraum Kernbereich Vaals",
    "flaeche_ha": 581.2,
    "umfang_m": 9772,
    "quelle": "Shapefile Lehrstuhl (EPSG 25832), umprojiziert nach WGS84"
   },
   "geometry": {
    "type": "Polygon",
    "coordinates": [
     [
      [
       5.9982142,
       50.7637096
      ],
      [
       5.9970359,
       50.782098
      ],
      [
       6.037245,
       50.7831271
      ],
      [
       6.0384075,
       50.764738
      ],
      [
       5.9982142,
       50.7637096
      ]
     ]
    ]
   }
  }
 ]
};

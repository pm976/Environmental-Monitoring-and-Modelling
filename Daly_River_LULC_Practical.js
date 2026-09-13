// ============================================================
// SIMPLE LULC CLASSIFICATION — DALY RIVER CATCHMENT
// Sentinel-2 + FABDEM + Random Forest
// ============================================================


// ------------------------------------------------------------
// 1. STUDY AREA
// ------------------------------------------------------------

var daly = ee.FeatureCollection(
  'projects/ee-mollickporni/assets/Daly'
);

var roi = daly.geometry();

Map.centerObject(daly, 7);
Map.addLayer(daly, {color: 'red'}, 'Daly River catchment', false);


// ------------------------------------------------------------
// 2. CLOUD-MASKING FUNCTION
// ------------------------------------------------------------

// Sentinel-2 SCL classes removed:
// 0  = No data
// 1  = Saturated or defective
// 3  = Cloud shadow
// 8  = Medium-probability cloud
// 9  = High-probability cloud
// 10 = Cirrus
// 11 = Snow or ice

function maskSentinel2(image) {
  var scl = image.select('SCL');

  var clearMask = scl.neq(0)
    .and(scl.neq(1))
    .and(scl.neq(3))
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10))
    .and(scl.neq(11));

  return image
    .updateMask(clearMask)
    .select(
      ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'],
      ['blue', 'green', 'red', 'nir', 'swir1', 'swir2']
    )
    .copyProperties(image, ['system:time_start']);
}

Unsupported Media Type

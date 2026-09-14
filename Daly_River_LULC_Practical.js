// ============================================================
// LULC CLASSIFICATION — DALY RIVER CATCHMENT
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

function maskSentinel2(image) {
  var scl = image.select('SCL');

  var clearMask = scl.neq(0)
    .and(scl.neq(1))
    .and(scl.neq(3))
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10));
  

  return image
    .updateMask(clearMask)
    .select(
      ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'],
      ['blue', 'green', 'red', 'nir', 'swir1', 'swir2']
    )
    .copyProperties(image, ['system:time_start']);
}

// ------------------------------------------------------------
// 3. LOAD SENTINEL-2 IMAGES
// ------------------------------------------------------------

// The end date is exclusive, so 2024-09-01 includes
// all images acquired up to 31 August 2024.

var sentinel2 = ee.ImageCollection(
  'COPERNICUS/S2_SR_HARMONIZED'
)
  .filterBounds(roi)
  .filterDate('2023-09-01', '2024-09-01')
  .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskSentinel2);

print('Number of Sentinel-2 images:', sentinel2.size());


// Create the annual median composite.

var sentinel2Median = sentinel2
  .median()
  .clip(roi);

var rgbVis = {
  bands: ['red', 'green', 'blue'],
  min: 0,
  max: 3000,
  gamma: 1.4
};

Map.addLayer(
  sentinel2Median,
  rgbVis,
  'Sentinel-2 median composite',
  true
);


// ------------------------------------------------------------
// 4. CALCULATE SPECTRAL INDICES
// ------------------------------------------------------------

var ndvi = sentinel2Median
  .normalizedDifference(['nir', 'red'])
  .rename('NDVI');

var ndwi = sentinel2Median
  .normalizedDifference(['green', 'nir'])
  .rename('NDWI');

var mndwi = sentinel2Median
  .normalizedDifference(['green', 'swir1'])
  .rename('MNDWI');


// ------------------------------------------------------------
// 5. LOAD ELEVATION 
// ------------------------------------------------------------

var fabdem = ee.Image(
  'projects/ee-mollickporni/assets/FABDEM'
);

// Select the first DEM band and give it a consistent name.

var elevation = fabdem
  .select([0], ['Elevation'])
  .clip(roi);


Map.addLayer(
  elevation,
  {
    min: 0,
    max: 200,
    palette: ['0015ff', '00ffff', 'ffff00', '8b4513']
  },
  'Elevation',
  false
);


// ------------------------------------------------------------
// 6. CREATE THE CLASSIFICATION IMAGE
// ------------------------------------------------------------

var classificationImage = sentinel2Median
  .addBands(ndvi)
  .addBands(ndwi)
  .addBands(mndwi)
  .addBands(elevation)
  .clip(roi);

// Predictor variables used by the Random Forest classifier.

var inputProperties = [
  'blue',
  'green',
  'red',
  'nir',
  'swir1',
  'swir2',
  'NDVI',
  'NDWI',
  'MNDWI',
  'Elevation'
];

print(
  'Classification image bands:',
  classificationImage.bandNames()
);


// ------------------------------------------------------------
// 7. LOAD AND SPLIT THE TRAINING SAMPLES
// ------------------------------------------------------------

// The training data must contain a numeric field called "Id".

var samples = ee.FeatureCollection(
  'projects/ee-mollickporni/assets/TrainingSamples'
);

print('Total number of sample features:', samples.size());
print('Sample attribute fields:', samples.first());

// Add a reproducible random value.

var samplesWithRandom = samples.randomColumn(
  'random',
  42
);

// Use 70% for training and 30% for validation.

var trainingSamples = samplesWithRandom.filter(
  ee.Filter.lt('random', 0.7)
);

var validationSamples = samplesWithRandom.filter(
  ee.Filter.gte('random', 0.7)
);

print('Training features:', trainingSamples.size());
print('Validation features:', validationSamples.size());


// Show the class distribution.

var trainingHistogram = trainingSamples.aggregate_histogram('Id');
var validationHistogram = validationSamples.aggregate_histogram('Id');

print('Training samples by class:', trainingHistogram);
print('Validation samples by class:', validationHistogram);


// ------------------------------------------------------------
// 8. EXTRACT PIXEL VALUES AT TRAINING LOCATIONS
// ------------------------------------------------------------

var trainingData = classificationImage.sampleRegions({
  collection: trainingSamples,
  properties: ['Id'],
  scale: 10,
  tileScale: 4,
  geometries: false
});

print('Valid training pixels:', trainingData.size());


// ------------------------------------------------------------
// 9. TRAIN THE RANDOM FOREST CLASSIFIER
// ------------------------------------------------------------

var classifier = ee.Classifier
  .smileRandomForest({
    numberOfTrees: 150,
    seed: 42
  })
  .train({
    features: trainingData,
    classProperty: 'Id',
    inputProperties: inputProperties
  });


// ------------------------------------------------------------
// 10. CLASSIFY THE DALY RIVER CATCHMENT
// ------------------------------------------------------------

var classifiedImage = classificationImage
  .classify(classifier)
  .rename('LULC');


// Change this palette to match your class names and Id values.
// The following palette assumes class values from 0 to 12.

var lulcPalette = [
  '0000ff', // Class 0
  '1f78b4', // Class 1
  '00ffff', // Class 2
  '9ecae1', // Class 3
  'ffff00', // Class 4
  'ff7f00', // Class 5
  '33a02c', // Class 6
  '006400', // Class 7
  '004529', // Class 8
  'c2e699', // Class 9
  '8c510a', // Class 10
  'bdbdbd', // Class 11
  'f7f7f7'  // Class 12
];

Map.addLayer(
  classifiedImage,
  {
    min: 0,
    max: 12,
    palette: lulcPalette
  },
  'Random Forest LULC classification',
  true
);


// ------------------------------------------------------------
// 11. VALIDATION
// ------------------------------------------------------------

// Extract predictor values at independent validation locations.

var validationData = classificationImage.sampleRegions({
  collection: validationSamples,
  properties: ['Id'],
  scale: 10,
  tileScale: 4,
  geometries: false
});

print('Valid validation pixels:', validationData.size());


// Apply the trained classifier to the validation data.

var validatedData = validationData.classify(classifier);


// Obtain the class values in ascending order.
// This helps identify the order of rows and columns in the matrix.

var classOrder = ee.List(
  samples.aggregate_array('Id')
).distinct().sort();

print('Class order used in accuracy results:', classOrder);


// Create the validation confusion matrix.
// Rows and columns follow the printed class order.

var confusionMatrix = validatedData.errorMatrix(
  'Id',
  'classification',
  classOrder
);

print('Validation confusion matrix:', confusionMatrix);

print(
  'Overall accuracy:',
  confusionMatrix.accuracy()
);

print(
  "User's accuracy:",
  confusionMatrix.consumersAccuracy()
);

print(
  "Producer's accuracy:",
  confusionMatrix.producersAccuracy()
);

print(
  'Kappa coefficient:',
  confusionMatrix.kappa()
);


// ------------------------------------------------------------
// 12.  TRAINING ACCURACY
// ------------------------------------------------------------

// Training accuracy is normally higher than validation accuracy.
// It should not be reported as the main map accuracy.

var trainingConfusionMatrix = classifier.confusionMatrix();

print(
  'Training confusion matrix:',
  trainingConfusionMatrix
);

print(
  'Training overall accuracy:',
  trainingConfusionMatrix.accuracy()
);


// ------------------------------------------------------------
// 13.  EXPORT
// ------------------------------------------------------------


Export.image.toDrive({
  image: classifiedImage.toByte(),
  description: 'Daly_LULC_2023_2024',
  folder: 'GEE_Exports',
  fileNamePrefix: 'Daly_LULC_2023_2024',
  region: roi,
  scale: 10,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});


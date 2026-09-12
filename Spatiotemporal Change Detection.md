# Acknowledgements

Google Earth Engine Developers

Google Earth Engine Team

Malak Malak Rangers and Traditional Owners from Daly River region

# Introduction

This practical activity demonstrates how geospatial monitoring and modelling techniques can be used to detect and analyse land use and land cover (LULC). The resulting outputs provide baseline information for assessing changes in landscape extent and supporting ecological, hydrological and agricultural monitoring. Through this activity, you will gain practical experience in applying remote-sensing methods to environmental monitoring and natural-resource management.


# Learning Outcomes

- Replicate existing techniques to prepare data for classification
- Apply existing trained Random Forest classification model to new data
- Reclassify classification images
- Identify changed areas
- Transition between cover classes
- Estimate changes in habitats using a baseline data

# Task

You have been provided a baseline landscape map of the Daly River Catchment, this is a product from the practical 2 activity, to estimate the latest changes in the spatial extent of landscapes.  
Collect Sentinel-2 imagery (this should be surface reflectance product) of the study area with acquisition dates similar to baseline data and produce a new habitat map using Random Forest classification. Once you have the new LULC map, estimate changes in the spatial extent of the cover types. Critically evaluate your results, including:

- description of the task
- description of the methods you applied to complete the task
- description of the results obtained
- discuss the results you agree and/or disagree (and why)
- discuss how you think the results can be improved
- conclusion 

# Workflow

The change analysis among land cover and land use classes

// Study area: Daly River catchment, Northern Territory, Australia
// Data: Sentinel-2 surface reflectance and FABDEM
// Method: Supervised Random Forest classification
// Platform: Google Earth Engine (JavaScript Code Editor)

# Learning Objectives

By completing this practical, students will learn how to:
//   1. load and display a study-area boundary in Google Earth Engine;
//   2. filter and cloud-mask Sentinel-2 surface-reflectance imagery;
//   3. create an annual median composite;
//   4. calculate NDVI, NDWI and MNDWI;
//   5. add elevation and slope as predictor variables;
//   6. train a Random Forest classifier;
//   7. produce a LULC map; and
//   8. assess classification accuracy using independent validation samples.



// ----------------------------------------------------------------------------
// STEP 1: DEFINE THE PRACTICAL SETTINGS
// ----------------------------------------------------------------------------

// Replace these paths if the assets are stored in a different account.
var boundaryAsset = 'projects/ee-mollickporni/assets/Daly';
var demAsset = 'projects/ee-mollickporni/assets/FABDEM';
var sampleAsset =
    'projects/ee-mollickporni/assets/TrainingSamples_SwampForest';

// Study period: 1 September 2023 to 31 August 2024.
// Earth Engine treats the ending date as exclusive; therefore, the ending date
// below is 1 September 2024.
var startDate = '2023-09-01';
var endDate = '2024-09-01';

var cloudPercentage = 30; 
var trainingFraction = 0.70;
var randomSeed = 42;
var numberOfTrees = 150;
var analysisScale = 10;

// ----------------------------------------------------------------------------
// STEP 2: LOAD THE DALY RIVER CATCHMENT
// ----------------------------------------------------------------------------

var daly = ee.FeatureCollection(boundaryAsset);
var roi = daly.geometry();

Map.centerObject(daly, 7);
Map.addLayer(daly, {color: 'red'}, 'Daly River catchment', false);

print('Daly River catchment:', daly);

// ----------------------------------------------------------------------------
// STEP 3: MASK CLOUDS AND UNSUITABLE SENTINEL-2 PIXELS
// ----------------------------------------------------------------------------

// The Sentinel-2 Scene Classification Layer (SCL) assigns a class to each
// pixel. This function removes no-data pixels, defective pixels, cloud shadows,
// medium- and high-probability clouds, and cirrus.

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

// ----------------------------------------------------------------------------
// STEP 4: LOAD SENTINEL-2 AND CREATE A MEDIAN COMPOSITE
// ----------------------------------------------------------------------------

var sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(roi)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', cloudPercentage))
    .map(maskSentinel2);

print('Number of Sentinel-2 images:', sentinel2.size());

// A median composite reduces remaining clouds, shadows and short-term noise.
var sentinel2Median = sentinel2.median().clip(roi);

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


// ----------------------------------------------------------------------------
// STEP 5: CALCULATE SPECTRAL INDICES
// ----------------------------------------------------------------------------

// NDVI highlights photosynthetically active green vegetation.
var ndvi = sentinel2Median
    .normalizedDifference(['nir', 'red'])
    .rename('NDVI');

// NDWI can help distinguish surface water from vegetation.
var ndwi = sentinel2Median
    .normalizedDifference(['green', 'nir'])
    .rename('NDWI');

// MNDWI uses SWIR1 and can improve open-water identification in some settings.
var mndwi = sentinel2Median
    .normalizedDifference(['green', 'swir1'])
    .rename('MNDWI');

Map.addLayer(
    ndvi,
    {min: -1, max: 1, palette: ['brown', 'yellow', 'darkgreen']},
    'NDVI',
    false
);

Map.addLayer(
    mndwi,
    {min: -1, max: 1, palette: ['brown', 'white', 'blue']},
    'MNDWI',
    false
);


// ----------------------------------------------------------------------------
// STEP 6: ADD ELEVATION AND SLOPE
// ----------------------------------------------------------------------------

var fabdem = ee.Image(demAsset);

// Select the first DEM band and assign a consistent name.
var elevation = fabdem
    .select([0], ['Elevation'])
    .clip(roi);

var slope = ee.Terrain
    .slope(elevation)
    .rename('Slope')
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

Map.addLayer(
    slope,
    {
      min: 0,
      max: 20,
      palette: ['white', 'yellow', 'orange', 'red']
    },
    'Slope',
    false
);

// ------------------------------------------------------------
// 7. LOAD AND SPLIT THE TRAINING SAMPLES
// ------------------------------------------------------------

// The training data must contain a numeric field called "Id".

var samples = ee.FeatureCollection(
  'projects/ee-mollickporni/assets/TrainingSamples_SwampForest'
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
// 12. OPTIONAL: TRAINING ACCURACY
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


// ----------------------------------------------------------------------------
// STEP 13: EXPORT RESULTS TO GOOGLE DRIVE
// ----------------------------------------------------------------------------

Export.image.toDrive({
  image: classifiedImage.toByte(),
  description: 'Daly_LULC_2023_2024',
  folder: 'GEE_Exports',
  fileNamePrefix: 'Daly_LULC_2023_2024',
  region: roi,
  scale: analysisScale,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});

// --------------------------------------The End--------------------------------------------

# Practical Questions

1. How many Sentinel-2 images were used to create the median composite?
2. What landscape characteristics are represented by NDVI, NDWI and MNDWI?
3. Why might elevation and slope improve a LULC classification?
4. How many reference features were used for training and validation?
5. Which class has the highest and lowest user's accuracy? What is the main justification for that instance?
6. Which class has the highest and lowest producer's accuracy? What is the main justification for that instance?
7. What does the overall accuracy indicate about the resulting map?
8. What changes occur when the number of Random Forest trees is modified?



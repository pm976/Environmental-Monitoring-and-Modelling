<img width="235" height="110" alt="image" src="https://github.com/user-attachments/assets/accf59fd-96d3-42b0-b72e-5afaf1dc020d" />

# Acknowledgements

Google Earth Engine Developers

Malak Malak Rangers and Traditional Owners from Daly River region

# Introduction

This practical activity demonstrates how geospatial monitoring and modelling techniques can be used to detect and analyse land use and land cover (LULC). The resulting outputs provide baseline information for assessing changes in landscape extent and supporting ecological, hydrological and agricultural monitoring. Through this activity, you will gain practical experience in applying remote-sensing methods to environmental monitoring and natural-resource management.


# Learning Outcomes

- Replicate existing techniques to prepare data for classification
- Apply existing trained Random Forest classification model to new data
- Classify satellite images based on various landscape patterns
- Identify changed areas 
- Transition between land cover classes from past to present
- Estimate changes in land cover using a baseline data

# Tasks

You have been provided a baseline LULC map of the Daly River Catchment for hydrological year 2024-2025, your main task to develop a LULC map of the Daly River Catchment for hydrological year 2017-2018 using the datasets (i.e., Study site, Reference samples, DEM) which are provided.

* Background of tasks

Collect Sentinel-2 imagery (this should be surface reflectance product) of the study area with acquisition dates similar to baseline data and produce a new LULC map using Random Forest classification in Google Earth Engine (GEE) platform. Before mapping LULC you have pre-processing stages where you calculate indices using Sentinel-2 spectral bands and slope using elevation data from Forest and Building Removed DEM (FABDEM) (Hawker et al., 2022). Once you have the new LULC map, estimate changes in the spatial extent of the land cover types. Critically evaluate your results, including:

- Description of the task
- Description of the methods you applied to complete the task
- Description of the results obtained
- Discuss the results you agree and/or disagree (and why)
- If you do not agree discuss how you think the results can be improved with reference 
- Calculate area of each class from your classified map
- Report change among LULC classes based on past and present classified maps (from 2017 to 2025)
- Try to justify why the change happened based on existing literature (mostly focus on global tropical systems, then narrow down to Daly River and NT based references) 
- Conclusion (conclude with key summary of your work and any recommendations for others who want to use these methods and results)


# Learning Objectives

By completing this practical, students will be able to:

1.	Load and display a study-area boundary in Google Earth Engine.
2.	Filter and cloud-mask Sentinel-2 surface reflectance imagery.
3.	Create an annual median composite.
4.	Explain what NDVI, NDWI and MNDWI represent and why they are useful for LULC classification.
5.	Calculate NDVI, NDWI and MNDWI from Sentinel-2 imagery.
6.	Incorporate elevation and slope as predictor variables.
7.	Train a Random Forest classifier using reference samples.
8.	Generate a land use and land cover (LULC) map.
9.	Assess classification accuracy using independent validation samples.
10.	Calculate the area of each LULC class in hectares.
11.	Compare LULC maps from different periods to quantify changes in class areas.
12.	Interpret LULC changes while considering classification accuracy and potential sources of uncertainty.


# Workflows

The change area analysis of LULC classes are conducted in two different stages minimise the computational resource in the non-commercial GEE account, i.e., Stage 1 and Stage 2

# Stage 1

Add Study Site: Daly River catchment, Northern Territory, Australia

Import Study site (which I have provided, named "DalyRiver_Catchment") Shapefile 

Go to Assests - New - Table Upload - Shapefiles

See this below snapshot

Step 1: <img width="235" height="293" alt="image" src="https://github.com/user-attachments/assets/7c839557-3207-4cda-84f2-c7cb9b45e9fb" />

Step 2: <img width="407" height="547" alt="image" src="https://github.com/user-attachments/assets/e61d9860-391f-4199-9b5d-da003c245011" />

Select- Upload

Select file extensions - shp, dbf, prj, shx, cpg, sbn (6 files)

Add Data: DEM datasets FABDEM

Import DEM data (which I have provided, named "FABDEM") GeoTIFF file

Go to Assests - New - Image Upload - GeoTIFF 

Step 1: <img width="235" height="293" alt="image" src="https://github.com/user-attachments/assets/7c839557-3207-4cda-84f2-c7cb9b45e9fb" />

Step 2: <img width="407" height="517" alt="image" src="https://github.com/user-attachments/assets/852ce452-88cb-40cb-ac2f-53283298ee4f" />

Add Data: Reference Samples 

Import Reference samples (which I have provided, named "Reference_Samples") GeoTIFF file

Go to Assests - New - Table Upload - Shapefiles

Step 1: <img width="235" height="293" alt="image" src="https://github.com/user-attachments/assets/7c839557-3207-4cda-84f2-c7cb9b45e9fb" />

Step 2: <img width="407" height="547" alt="image" src="https://github.com/user-attachments/assets/e61d9860-391f-4199-9b5d-da003c245011" />

Select file extensions - shp, dbf, prj, shx, cpg, sbn (6 files)

Select- Upload



# STEP 1: Define the Practical Settings


* Replace these paths as your assets are stored in a different account.

```javascript 
var boundaryAsset = 'projects/ee-mollickporni/assets/Daly';
```
```javascript 
var demAsset = 'projects/ee-mollickporni/assets/FABDEM';
```
var sampleAsset =
    'projects/ee-mollickporni/assets/TrainingSamples_SwampForest';

# STEP 2: Pre-Processing of the Mapping (Cloud-Masking)

* Sentinel-2 SCL classes for removing clouds
// 0  = No data
// 1  = Saturated or defective
// 3  = Cloud shadow
// 8  = Medium-probability cloud
// 9  = High-probability cloud
// 10 = Cirrus
// 11 = Snow or ice

```javascript
function maskSentinel2(image) {
  var scl = image.select('SCL');

  var clearMask = scl.neq(0)
    .and(scl.neq(1))
    .and(scl.neq(3))
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10))
    .and(scl.neq(11));
```
* Selecting bands from Sentinel-2 images to run cloud masks
  
```javascript

return image
    .updateMask(clearMask)
    .select(
      ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'],
      ['blue', 'green', 'red', 'nir', 'swir1', 'swir2']
    )
    .copyProperties(image, ['system:time_start']);
}

```
# Step 3: Load Sentinel-2 Imagery

* Study period: 1 September 2024 to 31 August 2025.

Earth Engine treats the ending date as exclusive; therefore, the ending date below is 1 September 2025.

```javascript

var sentinel2 = ee.ImageCollection(
  'COPERNICUS/S2_SR_HARMONIZED'
)
  .filterBounds(roi)
  .filterDate('2024-09-01', '2025-09-01')
  .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskSentinel2);

print('Number of Sentinel-2 images:', sentinel2.size());

```

* Create the annual median composite.

```javascript

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

```

# Step 4:  Calculate Spectral Indices

```javascript

var ndvi = sentinel2Median
  .normalizedDifference(['nir', 'red'])
  .rename('NDVI');
  
```
```javascript

var ndwi = sentinel2Median
  .normalizedDifference(['green', 'nir'])
  .rename('NDWI');
  
```

```javascript

var mndwi = sentinel2Median
  .normalizedDifference(['green', 'swir1'])
  .rename('MNDWI');
  
```

# Step 5: Load Elevation and Calculate Slope

```javascript

var fabdem = ee.Image(
  'projects/ee-mollickporni/assets/FABDEM'
);

```

* Select the DEM band (Your DEM data has only one band) and give it a consistent name.

```javascript

var elevation = fabdem
  .select([0], ['Elevation'])
  .clip(roi);
  
```

```javascript

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

```

# Step 6: Create the Classification Image

```javascript

var classificationImage = sentinel2Median
  .addBands(ndvi)
  .addBands(ndwi)
  .addBands(mndwi)
  .addBands(elevation)
  .clip(roi);

```

* Predictor variables used by the Random Forest classifier.

```javascript

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

```

```javascript

print(
  'Classification image bands:',
  classificationImage.bandNames()
);

```


# Step 7: Load and Split the Reference Samples


* The training data must contain a numeric field called "Id".

```javascript

var samples = ee.FeatureCollection(
  'projects/ee-mollickporni/assets/Reference_Samples'
);

print('Total number of sample features:', samples.size());
print('Sample attribute fields:', samples.first());

```

* Add a reproducible random value.

```javascript

var samplesWithRandom = samples.randomColumn(
  'random',
  42
);

```
* Use 70% for training and 30% for validation.

```javascript

var trainingSamples = samplesWithRandom.filter(
  ee.Filter.lt('random', 0.7)
);

```

```javascript

var validationSamples = samplesWithRandom.filter(
  ee.Filter.gte('random', 0.7)
);

print('Training features:', trainingSamples.size());
print('Validation features:', validationSamples.size());

```

* Show the class distribution.

```javascript

var trainingHistogram = trainingSamples.aggregate_histogram('Id');
var validationHistogram = validationSamples.aggregate_histogram('Id');

print('Training samples by class:', trainingHistogram);
print('Validation samples by class:', validationHistogram);

```


# Step 8: Extract Pixel Values in the Reference Locations

```javascript

var trainingData = classificationImage.sampleRegions({
  collection: trainingSamples,
  properties: ['Id'],
  scale: 10,
  tileScale: 4,
  geometries: false
});

print('Valid training pixels:', trainingData.size());

```

# Step 9: Train Random Forest Classifier

```javascript

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
  
```


# Step 10: LULC Classification 

```javascript

var classifiedImage = classificationImage
  .classify(classifier)
  .rename('LULC');
  
```

* Change this palette to match your class names and Id values. The following palette assumes class values from 0 to 12.

```javascript

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

```

* 12 LULC Classes

1= Water
2= Grass swamp
3=Forested swamp
4=Floodplain
5= Floodplain woodland
6= Mangrove
7= Riparian vegetation
8= Open forest
9= Open woodland
10= Farm
11= Plantation
12= Barren land or other landscape

* Results 

<img width="481" height="434" alt="image" src="https://github.com/user-attachments/assets/b0e6c61f-3ce7-4f2e-841c-193cb482993e" />


# Step 11: Validation of Classified Map


* Extract predictor values at independent validation locations.

```javascript

var validationData = classificationImage.sampleRegions({
  collection: validationSamples,
  properties: ['Id'],
  scale: 10,
  tileScale: 4,
  geometries: false
});

print('Valid validation pixels:', validationData.size());

```

* Apply the trained classifier to the validation data.

```javascript

var validatedData = validationData.classify(classifier);

```
* Obtain the class values in ascending order.  This helps identify the order of rows and columns in the matrix.

```javascript

var classOrder = ee.List(
  samples.aggregate_array('Id')
).distinct().sort();

print('Class order used in accuracy results:', classOrder);

```

* Create the validation confusion matrix. Rows and columns follow the class order as same as the "Id" Column in your Reference_Samples shapefile (Assest) .

```javascript

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

```
* Accuracy Assessment

<img width="556" height="1218" alt="Accuracy" src="https://github.com/user-attachments/assets/61f13215-46a5-4137-834a-7694d7908a1f" />


# Step 12: Training Accuracy 

* Training accuracy is normally higher than validation accuracy.

** Please Note: It should not be reported as the main map accuracy.

```javascript

var trainingConfusionMatrix = classifier.confusionMatrix();

print(
  'Training confusion matrix:',
  trainingConfusionMatrix
);

print(
  'Training overall accuracy:',
  trainingConfusionMatrix.accuracy()
);

```

# Step 13:  Export as Asset

```javascript

Export.image.toAsset({
  image: classifiedImage,
  description: 'Daly_LULCMap_2024_2025',
  assetId: 'projects/ee-mollickporni/assets/Daly_LULCMap_2024_2025',
  region: roi,
  crs: 'EPSG:3577',
  maxPixels: 1e13,
  scale: 10,
  pyramidingPolicy: {'.default': 'mode'}
});

```

* If you want to export the LULC map to your Google Drive (Optional).

```javascript

Export.image.toDrive({
  image: classifiedImage.toByte(),
  description: 'Daly_LULCMap_2024_2025',
  folder: 'GEE_Exports', (you can change to any other names)
  fileNamePrefix: 'Daly_LULCMap_2024_2025',
  region: roi,
  scale: 10,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});

```

# Stage 2

# Calculate LULC Class Areas (Hectres)

* Define the region of interest

```javascript

var assetAddress = 'projects/ee-mollickporni/assets/DalyRiver_Catchment'; # Change to your Asset file location
var daly = ee.FeatureCollection(assetAddress);

```

* Load the classified image you exported in Stage 1

```javascript

var classifiedImage = ee.Image('projects/ee-mollickporni/assets/Daly_LULCMap_2024_2025'); # Change to your Asset file

```

* Define the scale for area calculation

```javascript
var scale = 10; // Set to match the resolution of the classification

```

* Calculate area per class

```javascript

var areaImage = ee.Image.pixelArea().addBands(classifiedImage);

```

* Check the band names of the classified image

```javascript

print('Classified Image Bands:', classifiedImage.bandNames());

```

```javascript

* Ensure that the band name is correctly referenced as 'LULC'
var classBand = classifiedImage.select('LULC');

```

* Calculate area per class

```javascript

var areaImage = ee.Image.pixelArea().addBands(classBand);

```

* Use reduceRegion to calculate the total area for each class

```javascript

var classArea = areaImage.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1, // Set to 0 if there's only one band
    groupName: 'LULC'
  }),
  geometry: daly.geometry(),
  scale: scale,
  maxPixels: 1e13
});

```

```javascript

* Print the class areas

```javascript

// print('Class Area (sq meters):', classArea);

```

* Convert areas to hectares (1 hectare = 10,000 m²)

```javascript

var classAreasHectares = ee.List(classArea.get('groups')).map(function(item) {
  var area = ee.Dictionary(item);
  return area.set('area_ha', ee.Number(area.get('sum')).divide(10000)); // Dividing by 10,000 for hectares
});

```

* Print the class areas in hectare

```javascript

print('Class Area (hectare):', classAreasHectares);

```

* Export to GoogleDrive

```javascript

Export.table.toDrive({
  collection: classAreasHectares,
  description: 'Daly_LULC_2023_2024_Areas',
  folder: 'GEE_Exports', // Change to your Google Drive folder
  fileNamePrefix: 'Daly_LULC_2023_2024_Areas',
  fileFormat: 'CSV'
});

```

// --------------------------------------The End--------------------------------------------

# Practical Questions

1.	Run the LULC classification for the historical period 1 September 2017–31 August 2018.
2.	How many Sentinel-2 images were used to generate the median composite for this period after applying the filtering criteria?
3.	What landscape characteristics do NDVI, NDWI and MNDWI represent, and how can these indices help distinguish different LULC classes?
4.	Why might including elevation improve the accuracy of a LULC classification?
5.	How many reference features were used for training and validation, respectively? Report the number for each class and the total.
6.	Which classes have the highest and lowest user’s accuracy? Explain the likely reasons for these results, referring to misclassification patterns in the confusion matrix.
7.	Which classes have the highest and lowest producer’s accuracy? Explain the likely reasons for these results, referring to misclassification patterns in the confusion matrix.
8.	What does the overall accuracy indicate about the resulting LULC map?
9.	Compare the LULC maps for 1 September 2017-31 August 2018 and 1 September 2024-31 August 2025. How much did the area of each class change, and which classes experienced the greatest and smallest absolute changes?
10.	Present a table showing the area of each LULC class in both periods, the net change in hectares (ha) and the percentage change relative to 2017–2018. Identify the classes with the largest increase and largest decrease in area.

# References

Hawker, L., Uhe, P., Paulo, L., Sosa, J., Savage, J., Sampson, C., & Neal, J. (2022). A 30 m global map of elevation with forests and buildings removed. Environmental Research Letters, 17(2), 024016. DOI 10.1088/1748-9326/ac4d4f. URL: https://iopscience.iop.org/article/10.1088/1748-9326/ac4d4f/meta

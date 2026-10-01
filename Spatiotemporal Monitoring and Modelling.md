<img width="235" height="110" alt="image" src="https://github.com/user-attachments/assets/accf59fd-96d3-42b0-b72e-5afaf1dc020d" /># Acknowledgements

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
Collect Sentinel-2 imagery (this should be surface reflectance product) of the study area with acquisition dates similar to baseline data and produce a new land use land cover (LULC) map using Random Forest classification in Google Earth Engine (GEE) platform. Before mapping LULC you have pre-processing stages where you calculate indices using Sentinel-2 spectral bands and slope using elevation data from Forest and Building Removed DEM (FABDEM) (Hawker et al., 2022). Once you have the new LULC map, estimate changes in the spatial extent of the cover types. Critically evaluate your results, including:

- description of the task
- description of the methods you applied to complete the task
- description of the results obtained
- discuss the results you agree and/or disagree (and why)
- if you do not agree discuss how you think the results can be improved
- conclusion 

# Workflow

The change analysis among land cover and land use classes

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

// Replace these paths as your assets are stored in a different account.

```javascript 
var boundaryAsset = 'projects/ee-mollickporni/assets/Daly';
```
```javascript 
var demAsset = 'projects/ee-mollickporni/assets/FABDEM';
```
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

// 12 LULC Classes

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

// ----------------------------------------------------------------------------

# Results 

<img width="481" height="434" alt="image" src="https://github.com/user-attachments/assets/b0e6c61f-3ce7-4f2e-841c-193cb482993e" />

// ----------------------------------------------------------------------------

# Accuracy Assessment

<img width="556" height="1218" alt="Accuracy" src="https://github.com/user-attachments/assets/61f13215-46a5-4137-834a-7694d7908a1f" />

// ----------------------------------------------------------------------------

// --------------------------------------The End--------------------------------------------

# Practical Questions

1. How many Sentinel-2 images were used to create the median composite?
2. What landscape characteristics are represented by NDVI, NDWI and MNDWI?
3. Why might elevation improve a LULC classification?
4. How many reference features were used for training and validation?
5. Which class has the highest and lowest user's accuracy? What is the main justification for that instance?
6. Which class has the highest and lowest producer's accuracy? What is the main justification for that instance?
7. What does the overall accuracy indicate about the resulting map?
8. What changes occur when the number of Random Forest trees is modified?

# References

Hawker, L., Uhe, P., Paulo, L., Sosa, J., Savage, J., Sampson, C., & Neal, J. (2022). A 30 m global map of elevation with forests and buildings removed. Environmental Research Letters, 17(2), 024016. https://doi.org/DOI 10.1088/1748-9326/ac4d4f 

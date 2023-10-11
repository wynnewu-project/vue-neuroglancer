import { SegmentationUserLayer } from "@feng-lab/neuroglancer/dist/module/neuroglancer/segmentation_user_layer";

const segmentStatedColorStack = {};

const getViewerState = (viewer) => {
  return viewer?.state;
} 

const getLayerSelectedValues = (viewer) => {
  const selectedValues = viewer.layerSelectedValues.toJSON();
  const result = {};
  for(let [layer, values] of Object.entries(selectedValues)) {
    if(Object.keys(values).length) {
      result[layer] = values;
    }
  }
  return result;
}


const getManagedLayers = (viewer) => {
  return viewer?.layerManager?.managedLayers ?? [];
}

const getLayer = (viewer, name) => {
  const layer = viewer?.layerManager?.managedLayers?.filter(layer => layer.name === name)[0];
  return layer?.layer;
}

const getManagedLayer = (viewer, name) => {
  const layer = viewer?.layerManager?.managedLayers?.filter(layer => layer.name === name)[0];
  return layer;
}

const manualPointAnnotation  = (viewer, name) => {
  const oldState = getViewerState(viewer) ?? {};
  const { layers=[] } = oldState;
  viewer.state.reset();
  viewer.state.restoreState({
    ...oldState,
    layers: [
      ...layers,
      {
        type: "pointAnnotation",
        name, 
        points: [],
        tab: "annotations"
      }
    ],
    layout: "4panel",
    selectedLayer: {
      layer: name,
      visible: true
    }
  })
}

const getLayerAnnotations = (viewer, name) => {
  const { layers=[] } = viewer.state.toJSON();
  const specLayer = layers.filter(layer => layer.name === name)[0];
  return specLayer?.annotations ?? [];
}

const setSegmentColor = (viewer, name, id, color) => {
  const layer = getLayer(viewer, name);
  if(layer && layer instanceof SegmentationUserLayer) {
    let colorSetObj = {
      id,
      color,
      oColor: null
    }
    if(layer.hasSegmentColor(id)) {
      const statedColor = layer.getSegmentColor(id);
      colorSetObj.oColor = statedColor;
      layer.deleteSegmentColor(id);
    }
    layer.setSegmentColor(id, color);
    segmentStatedColorStack[name] = segmentStatedColorStack[name] ?? []; 
    segmentStatedColorStack[name].push(colorSetObj);
  } else {
    throw new Error(`${name} is not a instance of SegmentationUserLayer`);
  }
}

const setSegmentOpacity = (viewer, name, id, opacity) => {
  const layer = getLayer(viewer, name);
  if(layer && layer instanceof SegmentationUserLayer) {
    layer.setSegmentOpacity(id, opacity);
  } else {
    throw new Error(`${name} is not a instance of SegmentationUserLayer`);
  }
}

const redoSetSegmentColor = (viewer, name) => {
  const layer = getLayer(viewer, name);
  if(layer && layer instanceof SegmentationUserLayer) {
    const lastSet = segmentStatedColorStack[name]?.pop();
    if(lastSet) {
      const { id, oColor } = lastSet;
      layer.deleteSegmentColor(id);
      oColor && layer.setSegmentColor(id, oColor);
    } else {
      throw new Error(`${name}'s segment with id: ${id} never be set`);
    }
  } else {
    throw new Error(`${name} is not a instance of SegmentationUserLayer`);
  }
}

const setVisibleSegments = (viewer, name, ids) => {
  console.log('select segments', ids)
  const layer = getLayer(viewer, name);
  const group = layer.displayState.segmentationGroupState.value;
  group.visibleSegments.clear();
  group.setVisibleSegments(ids);
}

const getSelectedSegment = (viewer, name) => {
  const layer = getLayer(viewer, name);
  if(layer && layer instanceof SegmentationUserLayer) {
    return layer.displayState.segmentSelectionState.toJSON()
  } else {
    throw new Error(`${name} is not a instance of SegmentationUserLayer`);
  }
}

export default {
  getViewerState,
  getManagedLayers,
  getLayer,
  manualPointAnnotation,
  getLayerAnnotations,
  setSegmentColor,
  redoSetSegmentColor,
  setVisibleSegments,
  setSegmentOpacity,
  getSelectedSegment,
  getLayerSelectedValues,
  getManagedLayer
}
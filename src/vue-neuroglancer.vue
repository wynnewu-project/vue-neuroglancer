<template>
  <div 
    ref="brainMapsClientId"
    class="vue-neuroglancer"
  />
  
</template>
<script setup>
import { setupDefaultViewer } from "@feng-lab/neuroglancer";
import { onMounted, ref, watch, computed } from "vue";
import { SegmentationUserLayer } from "@feng-lab/neuroglancer/dist/module/neuroglancer/segmentation_user_layer";
import { registerEventListener } from "@feng-lab/neuroglancer/dist/module/neuroglancer/util/disposable";
import initFromUrl from "./util/initFromUrl";
import debounce from "lodash/debounce";
import PROPS from "./props";
import APIS from "./api";
import EVENTS from "./events";

const brainMapsClientId = ref();
let viewer = null;
let registerLayer = {};

const props = defineProps(PROPS);

const emits = defineEmits(EVENTS);

const viewerState = computed(() => {
  const layers = props.layers;
  const selected = props.selectedLayer ?? layers[0]?.name;
  return {
    layers,
    selectedLayer: {
      layer: selected,
      visible: !!selected 
    },
    ...props.state,
  }
})

onMounted(() => {
  // init viewer
  viewer = setupDefaultViewer({
    brainMapsClientId,
    bundleRoot: "/",
    target: brainMapsClientId.value
  });

  // set callback for viewer's state changed event
  handleStateChanged();

  // set extra eventBindings 
  if(props.eventBindings) {
    props.eventBindings.forEach(({ event, callback })=> {
      registerEventListener(viewer.element, event, callback);
    })
  }
  if(viewer.selectionDetailsState) {
    viewer.selectionDetailsState.changed.add(
      debounce(() => {
        emits("selectionDetailsStateChanged");
      }, 200) 
    )
  }

  if(props.stateUrl) {
    // Prioritize getting viewer's status from props.stateUrl
    initFromUrl(viewer, props.stateUrl);
  } else {
    // getting viewer's state from props.layers or props.state
    // props.state.layers will override props.layers
    viewer.state.restoreState(viewerState.value);
  }
  // set callback for layer focus or selected value changed
  handleLayerSelectedValueChanged();
})

watch(viewerState, (newState) => {
  viewer.state.reset();
  viewer.state.restoreState(newState);
  registerLayer = {};
  handleLayerSelectedValueChanged();
}, {
  deep: true
});

const handleStateChanged = () => {
  viewer.state.changed.add( 
    debounce(
      () => { emits("stateChanged", viewer.state.toJSON()); }
      , 200
    )
  );
}


const handleSegmentationChanged = (layer) => {
  const { segmentSelectionState, segmentFocusState, segmentationGroupState } = layer.layer.displayState;
  layer.layer.toggleSegment.changed.add(() => {
    const toggleSegment = layer.layer.toggleSegment.value;
    emits("toggleSegment", toggleSegment, layer);
  })
  segmentSelectionState.changed.add(debounce(
    () => {
      const selectedSegment = segmentSelectionState.toJSON();
      emits("selectedSegmentChanged", selectedSegment, layer);
    }, 
    200)
  );
  segmentFocusState.changed.add(debounce(
    () => {
      const focusSegment = segmentFocusState.toJSON();
      emits("focusSegmentChanged", focusSegment, layer);
    }, 
    200)
  );
  const { visibleSegments } = segmentationGroupState.value;
  visibleSegments.changed.add(() => {
      emits("visibleSegmentsChanged", visibleSegments.toJSON(), layer);
  })
}

const handleAnnotationSelectedValueChanged = (layer) => {
  const { hoverState } = layer.layer.annotationDisplayState;
  hoverState.changed.add(debounce(
    () => {
      emits("focusAnnotationChanged", hoverState.value?.id, layer);
    },
    200)
  );
}

const layerSelectedValueChangedHandler = {
  "annotation": handleAnnotationSelectedValueChanged,
  "segmentation": handleSegmentationChanged,
  //"notsupport": (layer) => {
  //  throw new Error(`${layer.name} is not a instance of SegmentationUserLayer`);
  //}
}

const handleLayerSelectedValueChanged = () =>{
  viewer.layerManager.layersChanged.add(() => {
    //const layers = viewer.layerManager.managedLayers?.filter(layer => layer.layer instanceof SegmentationUserLayer)??[];
    for(let layer of viewer.layerManager.managedLayers) {
      if(registerLayer[layer.name]) continue;
      registerLayer[layer.name] = true;
      const handler = layerSelectedValueChangedHandler[layer.layer.type]; 
      if(handler) {
        handler(layer);
      }
    }
  })
}


defineExpose({
  getViewerState: () => APIS.getViewerState(viewer),
  getManagedLayers: () => APIS.getManagedLayers(viewer),
  getLayer: (name) => APIS.getLayer(viewer, name),
  manualPointAnnotation: (name="pointAnnotations") => APIS.manualPointAnnotation(viewer, name),
  getLayerAnnotations: (name="pointAnnotations") => APIS.getLayerAnnotations(viewer, name),
  setSegmentColor: (name, id, color) => APIS.setSegmentColor(viewer, name, id, color),
  redoSetSegmentColor: (name) => APIS.redoSetSegmentColor(viewer, name),
  setVisibleSegments: (name, ids) => APIS.setVisibleSegments(viewer, name, ids),
  setSegmentOpacity: (name, id, opacity) => APIS.setSegmentOpacity(viewer, name, id, opacity),
  getSelectedSegment: (name) => APIS.getSelectedSegment(viewer, name),
  getLayerSelectedValues: () => APIS.getLayerSelectedValues(viewer),
  getManagedLayer: (name) => APIS.getManagedLayer(viewer, name)
})


</script>

<style lang="scss">
.vue-neuroglancer {
  color: white;
  height: 100%;
}
.neuroglancer-display-dimensions-widget input {
  width: 1em !important;
}
</style>

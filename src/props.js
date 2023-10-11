const DEFAULT_STATE = {
  showSlices: false,
  layout: "3d",
  dimensions: {
    "x": [
        0.00001,
        "m"
    ],
    "y": [
        0.00001,
        "m"
    ],
    "z": [
        0.0001,
        "m"
    ]
  },
  crossSectionScale: 3,
  projectionOrientation: [
    0.10651738196611404,
    0.7164360880851746,
    -0.046973973512649536,
    -0.6878712177276611
  ],
  projectionScale: 3000
}

export default {
  stateUrl: String,
  layers: {
    type: Array,
    default: []
  },
  selectedLayer: String,
  state: {
    type: Object,
    default: DEFAULT_STATE
  },
  eventBindings: {
    type: Array,
    default: []
  }
}
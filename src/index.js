import VueNeuroglancer from "./vue-neuroglancer.vue";

export { VueNeuroglancer };

const components = [VueNeuroglancer];

const install = (App) => {
  components.forEach( item => {
    App.component(item.__name, item)
  })
}

export default { install };
import { responseJson } from "@feng-lab/neuroglancer/dist/module/neuroglancer/util/http_request";
import { urlSafeParse, verifyObject } from "@feng-lab/neuroglancer/dist/module/neuroglancer/util/json";
import { parseSpecialUrl, cancellableFetchSpecialOk } from "@feng-lab/neuroglancer/dist/module/neuroglancer/util/special_protocol_request"

export default function(viewer, stateUrl) {
  try {
    let s = stateUrl.replace(/^[^#]+/, '');
    if (s === '' || s === '#' || s === '#!') {
      s = '#!' + {};
    }
    // Handle remote JSON state
    if (s.match(/^#!([a-z][a-z\d+-.]*):\/\//)) {
      const url = s.substring(2);
      const {url: parsedUrl, credentialsProvider} = parseSpecialUrl(url, viewer.dataSourceProvider.credentialsManager);
      cancellableFetchSpecialOk(credentialsProvider, parsedUrl, {}, responseJson)
          .then(json => {
            verifyObject(json);
            viewer.state.reset();
            viewer.state.restoreState(json);
          })
    } else if (s.startsWith('#!+')) {
      s = s.slice(3);
      // Firefox always %-encodes the URL even if it is not typed that way.
      s = decodeURIComponent(s);
      let state = urlSafeParse(s);
      verifyObject(state);
      viewer.restoreState(state);
      prevStateString = undefined;
    } else if (s.startsWith('#!')) {
      s = s.slice(2);
      s = decodeURIComponent(s);
      if (s === prevStateString) {
        return;
      }
      prevStateString = s;
      viewer.state.reset();
      let state = urlSafeParse(s);
      verifyObject(state);
      viewer.state.restoreState(state);
    } else {
      throw new Error(`URL hash is expected to be of the form "#!{...}" or "#!+{...}".`);
    }
  } catch (parseError) {
    console.log('parseError', parseError)
  }
}
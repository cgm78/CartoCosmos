import AstroProj from "./AstroProj";
import LayerCollection from "./LayerCollection";
import "leaflet-fullscreen";
/*
 * @class AstroMap
 * @aka L.Map.AstroMap
 * @inherits L.Map
 *
 * The central class that creates an interactive map in the HTML.
 * Works with all target bodies supported by the USGS by loading the body's
 * base layers and overlays in a LayerCollection. Allows users to change
 * the projection of the map.
 *
 * @example
 *
 * ```js
 * // initialize the map on the "map" div with the target Mars
 * L.Map.AstroMap("map", "Mars", {});
 * ```
 */
export default L.Map.AstroMap = L.Map.extend({
  options: {
    center: [0, 0],
    zoom: 1,
    maxZoom: 8,
    attributionControl: false,
    fullscreenControl: true
  },

  /**
   * @details Initializes the map by loading the LayerCollection for
   *          each supported projection and setting default options.
   *
   * @param {String} mapDiv - ID of the div for the map.
   *
   * @param {String} target - Name of target to display layers for.
   *
   * @param {Object} options - Options for the map.
   */
  initialize: function(mapDiv, target, options) {
    this._mapDiv = mapDiv;
    this._target = target;
    this._astroProj = new AstroProj();
    this._radii = this._astroProj.getRadii(this._target);

    this._currentLayer = null;

    // Could not work with _
    this.layers = {
      northPolar: new LayerCollection(
        this._target,
        "north-polar stereographic"
      ),
      southPolar: new LayerCollection(
        this._target,
        "south-polar stereographic"
      ),
      cylindrical: new LayerCollection(this._target, "cylindrical")
    };

    this._hasNorthPolar = !this.layers["northPolar"].isEmpty();
    this._hasSouthPolar = !this.layers["southPolar"].isEmpty();

    this._defaultProj = L.extend({}, L.CRS.EPSG4326, { R: this._radii["a"] });
    this.options["crs"] = this._defaultProj;
    this._currentProj = "EPSG:4326";

    L.setOptions(this, options);
    L.Map.prototype.initialize.call(this, this._mapDiv, this.options);
    this.loadLayerCollection("cylindrical");

    // Listen to baselayerchange event so that we can set the current layer being
    // viewed by the map.
    this.on("baselayerchange", function(e) {
      this.setCurrentLayer(e["layer"]);
    });
  },

  /**
   * @details Adds the LayerCollection with the requrested projection name.
   *
   * @param {String} name - Name of the projection.
   */
  loadLayerCollection: function(name) {
    this.layers[name].addTo(this);
  },

  /**
   * @details Changes the projection of the map and resets the center and view.
   *
   * @param {String} name - Name of Projection.
   *
   * @param {List} center - Center of map based off of projection.
]   */
  changeProjection: function(name, center) {
    let newCRS = null;
    if (name == "cylindrical") {
      newCRS = this._defaultProj;
    } else {
      let proj = this._astroProj.getStringAndCode(this._target, name);
      newCRS = new L.Proj.CRS(proj["code"], proj["string"], {
        resolutions: [8192, 4096, 2048, 1024, 512, 256, 128],
        origin: [0, 0]
      });
      this._currentProj = proj["code"];
    }

    this.options.crs = newCRS;
    this.setView(center, 1, true);
    this.loadLayerCollection(name);

    // this.fire("projChange", { proj: this._currentProj });
  },

  /**
   * @details Checks if the map has a layer collection for northPolar.
   *
   * @return {Boolean} Returns true if there is a northPolar collection.
   */
  hasNorthPolar: function() {
    return this._hasNorthPolar;
  },

  /**
   * @details Checks if the map has a layer collection for southPolar.
   *
   * @return {Boolean} Returns true if there is a southPolar collection.
   */
  hasSouthPolar: function() {
    return this._hasSouthPolar;
  },

  /**
   * @details Returns the name of the target.
   *
   * @return {String} Name of target.
   */
  target: function() {
    return this._target;
  },

  /**
   * @details Returns the name of the current projection of the map.
   *
   * @return {String} Proj-code of the projection.
   */
  projection: function() {
    return this._currentProj;
  },

  /**
   * @details Sets the value of the current layer of the map.
   *          Set by the LayerCollection in the onAdd method.
   */
  setCurrentLayer: function(layer) {
    this._currentLayer = layer;
  },

  /**
   * @details Returns the current layer of the map. Used by the LayerCollection
   *          so that it can remove the layer of the map without having to
   *          remove all layers, including drawn shapes.
   *
   * @return {L.Layer} Current layer of the map.
   */
  currentLayer: function() {
    return this._currentLayer;
  }
});

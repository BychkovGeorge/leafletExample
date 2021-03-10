<template>
  <main class="col-12 container mt-5">
    <div class="row justify-content-center">
      <div class="col-6">
        <div>
          <b-form-group label="Название метки" label-for="name">
            <b-form-input v-model="name" id="name" type="text" placeholder="Введите название метки"></b-form-input>
          </b-form-group>
          <b-form-group label="Широта" label-for="latitude">
            <b-form-input v-model="latitude" id="latitude" type="number" placeholder="Введите широту"></b-form-input>
          </b-form-group>
          <b-form-group label="Долгота" label-for="longitude">
            <b-form-input v-model="longitude" id="longitude" type="number" placeholder="Введите долготу"></b-form-input>
          </b-form-group>
          <button @click="addLabel" class="btn btn-primary">Добавить</button>
        </div>
      </div>
      <div class="col-6">
        <l-map
          id="map"
          :zoom="zoom"
          :center="center"
          :options="mapOptions"
          @update:center="centerUpdate"
          @update:zoom="zoomUpdate"
        >
          <l-tile-layer
            :url="url"
            :attribution="attribution"
          />
          <l-marker :lat-lng="el.coordinates" v-for="el in labels">
            <l-tooltip :options="tooltipOptions">
              <div>{{ el.name }}</div>
            </l-tooltip>
          </l-marker>
        </l-map>
      </div>
    </div>
  </main>
</template>

<script>
import { latLng } from 'leaflet';
import "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/images/marker-icon.png";
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from "vue2-leaflet";
import 'leaflet/dist/leaflet.css';

export default {
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LTooltip
  },

  data() {
    return {
      name: '',
      latitude: '',
      longitude: '',
      zoom: 13,
      center: latLng(47.41322, -1.219482),
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      withPopup: latLng(47.41322, -1.219482),
      withTooltip: latLng(47.41422, -1.250482),
      currentZoom: 11.5,
      currentCenter: latLng(47.41322, -1.219482),
      showParagraph: false,
      mapOptions: {
        zoomSnap: 0.5
      },
      worker: null,
      labels: [],
      tooltipOptions: {
        permanent: true,
      },
      clock: null,
      timer: null,
    };
  },

  created() {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });

    this.worker = this.$worker.createWorker();
    this.worker.addEventListener('message', this.workerResponseHandler);
  },

  methods: {
    addLabel() {
      if (this.validateForm() !== 0) {
        alert('Ошибка при вводе имени');
        return;
      }
      this.worker.postMessage({
        'name': this.name,
        'latitude': this.latitude,
        'longitude': this.longitude
      });
    },

    validateForm() {
      if (this.name.length < 3) {
        this.name = '';
        this.latitude = '';
        this.longitude = '';
        return -1;
      }
      else if (this.name.length > 75) {
        this.name = '';
        this.latitude = '';
        this.longitude = '';
        return 1;
      }
      else {
        return 0;
      }
    },

    workerResponseHandler: function (event) {
      let result = {name: event.data.name, coordinates: latLng(event.data.coordinates[0], event.data.coordinates[1])}
      this.labels.forEach((el, index) => {
        if (el.name === result.name) {
          this.labels.splice(index, 1);
        }
      });
      this.labels.push(result);
      this.clock = Date.now();
      this.timer = setInterval(this.checkTimer, 1000);
    },

    checkTimer() {
      if (Date.now() - this.clock >= 15000) {
        clearInterval(this.timer);
        this.labels = [];
      }
    },

    zoomUpdate(zoom) {
      this.currentZoom = zoom;
    },

    centerUpdate(center) {
      this.currentCenter = center;
    },
  },
}
</script>

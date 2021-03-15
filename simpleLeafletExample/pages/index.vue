<template>
  <main class="col-12 container pt-5 position-relative" style="background: linear-gradient(#35495e, #3b8070); height: 100vh">
    <div class="row justify-content-center position-absolute w-100" style="top: 20%">
      <div class="col-12">
        <h1 class="text-center mb-5" style="color: #ECEFF1">Добавление меток на карту</h1>
      </div>
      <div class="col-5 mr-4 card-container">
        <p class="text-center" style="color: #ECEFF1; font-weight: 700; font-size: 20px">Введите название метки и её координаты для отображения на карте</p>
        <div>
          <b-form-group label="Название метки" label-for="name" style="color: #ECEFF1">
            <b-form-input v-model="formData.name" id="name" type="text" placeholder="Введите название метки"></b-form-input>
          </b-form-group>
          <b-form-group label="Широта" label-for="latitude" style="color: #ECEFF1">
            <b-form-input v-model="formData.latitude" id="latitude" type="number" placeholder="Введите широту"></b-form-input>
          </b-form-group>
          <b-form-group label="Долгота" label-for="longitude" style="color: #ECEFF1">
            <b-form-input v-model="formData.longitude" id="longitude" type="number" placeholder="Введите долготу"></b-form-input>
          </b-form-group>
          <button @click="addLabel" class="btn btn-light mt-2">Добавить</button>
        </div>
      </div>
      <div class="col-5 ml-4 card-container">
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
      formData: {
        name: '', // название точки на карте
        latitude: '', // широта
        longitude: '', // долгота
      },
      zoom: 13,
      center: latLng(47.41322, -1.219482), // начальное положение центра карты
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png', // ссылка на карту
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      currentZoom: 11.5,
      currentCenter: latLng(47.41322, -1.219482),
      showParagraph: false,
      mapOptions: {
        zoomSnap: 0.5
      },
      worker: null, // web-worker
      labels: [], // массив точек на карте
      tooltipOptions: {
        permanent: true,
      },
      clock: null, // время добавления новой точки и таймер для удаления точкии через 15 секунд
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
        'name': this.formData.name,
        'latitude': this.formData.latitude,
        'longitude': this.formData.longitude
      });
    },

    validateForm() {
      if (this.formData.name.length < 3) {
        this.formData.name = '';
        this.formData.latitude = '';
        this.formData.longitude = '';
        return -1;
      }
      else if (this.formData.name.length > 75) {
        this.formData.name = '';
        this.formData.latitude = '';
        this.formData.longitude = '';
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

<style>
.card-container {
  padding: 1.5rem;
  border: 1px solid #ECEFF1;
  border-radius: 6px;
  box-shadow: rgba(0, 7, 0, .9);
}
</style>

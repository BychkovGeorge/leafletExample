self.addEventListener('message', (event) => {
  let data = event.data;

  let result = {name: data.name, coordinates: [data.latitude, data.longitude]};

  self.postMessage(result);
});

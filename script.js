'use strict';

let map, mapEvent;
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let workout; //variabile che diventera l'oggetto

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; //[]
    this.distance = distance;
    this.duration = duration;
  }
  setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/*
const run1=new Running([39,-12],5.2,24,39)

const ciclyng1=new Cycling([39,-12],27,24,539)

console.log(run1,ciclyng1)
*/

class App {
  #map;
  #mapEvent; //attrib privati di classe
  #workouts = [];
  constructor() {
    this._getPosition(); //messa qui in modo che carichi subito e non la dobbiamo richiamare ogni volta che creiamo un oggetto
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    //permette di recuperare coord
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          //usiamo il bind in quanto essendo una callback function crea una nuova funzione,senza bind il this sarebbe undefined proprio xk è callback
          alert('errore');
        }
      );
  }
  _loadMap(position) {
    //funzione geoloc TRUE
    //api interna browser, vuole 2 funzioni:la prima in caso di successo(bisogna metterli l'item),la seconda in caso di errore
    //console.log(position);//stampo l' oggetto..se voglio i dati:
    const latitude = position.coords.latitude;
    const { longitude } = position.coords; //alternativa a scrivere positio.coords.longitude
    console.log(latitude, longitude);
    this.#map = L.map('map').setView([latitude, longitude], 13); //prende l'id map del dive html

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      .openPopup();

    this.#map.on('click', this._showForm.bind(this)); //è tipo l'add event listener ,solo che è un metodo di lifety(sito cartina)
    this.#workouts.forEach(work => {
      this.renderWorkout(work);
      this.renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    //mostra il form quando schiacchiamo sulla mappa (riga 101)
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputElevation.value =
      inputDistance.value =
      inputCadence.value =
      inputDuration.value =
        '';
    form.classList.remove('hidden');
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    //creazione corsa o ciclismo
    //const validInput=(...inputs)=>inputs.every(inp=>Number.isFinite(inp)) //validazione se l'input n° è un numero finito(restituisce array con ...inputs)
    const allPositive = (...inputs) => inputs.every(inp => inp > 0); //check input vari e presa elementi dom
    e.preventDefault();
    const type = inputType.value;
    const distance = +inputDistance.value; //il piu x convertire la str in n°
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      //usando la validInput if(!validInputs(distance,duration,cadence))
      if (
        !Number.isFinite(distance) ||
        isNaN(duration) ||
        isNaN(cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('errore'); // check se distance non è un n°.. alternativa --->     if(isNaN(distance)) return alert('errore')

      workout = new Running([lat, lng], distance, duration, cadence); // crea oggetto corsa,latlng sono su array in quanto coords raccoglie entrambe nel costruttore. lat lng sono la destruct dell oggetto quando le prendiamo percio basta richiamare quelle
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !Number.isFinite(distance) ||
        isNaN(duration) ||
        isNaN(elevation) ||
        !allPositive(distance, duration)
      )
        return alert('errore');
      workout = new Cycling([lat, lng], distance, duration, elevation); // crea oggetto ciclismo
    }

    this.#workouts.push(workout); //metti dentro l'array creato prima all' inizio
    console.log(workout);

    this.renderWorkoutMarker(workout); //richiamo funzione mettendo oggetto creato a 142
    this.renderWorkout(workout);
    this._setLocalStorage();
  }

  renderWorkoutMarker(i) {
    //riguarda il popup

    L.marker(i.coords) //vuole un array,come su riga 28
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          //tutti questi attributi presi dalla documentaz del sito
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${i.type}-popup`,
        })
      )
      .setPopupContent(`${i.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${i.description}`)
      .openPopup();
  }

  renderWorkout(i) {
    let html = `
<li class=workout workout--${i.type}" data-id="${i.id}">
          <h2 class="workout__title">${i.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              i.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${i.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${i.duration}</span>
            <span class="workout__unit">min</span>
          </div>
`;

    if (i.type === 'running') {
      html += `<div class="workout__details">
  <span class="workout__icon">⚡️</span>
  <span class="workout__value">${i.pace.toFixed(1)}</span>
  <span class="workout__unit">min/km</span>
</div>
<div class="workout__details">
  <span class="workout__icon">🦶🏼</span>
  <span class="workout__value">${i.cadence}</span>
  <span class="workout__unit">spm</span>
</div>
</li>`;
      form.insertAdjacentHTML('afterend', html);
    }

    if (i.type === 'cycling') {
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${i.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${i.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
      form.insertAdjacentHTML('afterend', html);
    }
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(function (i) {
      return i.id === workoutEl.dataset.id;
    });
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
  }

  reset(){ //chiamalo in console per cancellare tutto App.reset()
    localStorage.removeItem('workouts')
    location.reload();
  }
}

const app = new App();

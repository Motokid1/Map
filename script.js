'use strict';

class Emotion {
  id = (Date.now() + '').slice(-10);

  constructor(coords, description) {
    this.coords = coords; // [lat, lng]
    this.description = description; // Use the description directly
  }
}

class Happy extends Emotion {
  type = 'happy';

  constructor(coords, description) {
    super(coords, description); // Pass the description directly
  }
}

class Sad extends Emotion {
  type = 'sad';

  constructor(coords, description) {
    super(coords, description); // Pass the description directly
  }
}

class Anxiety extends Emotion {
  type = 'anxiety';

  constructor(coords, description) {
    super(coords, description); // Pass the description directly
  }
}

class Depression extends Emotion {
  type = 'depression';

  constructor(coords, description) {
    super(coords, description); // Pass the description directly
  }
}

///////////////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerEmotions = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDescription = document.querySelector('.form__input--cadence');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #emotions = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newEmotion.bind(this));
    containerEmotions.addEventListener('click', this._moveToPopup.bind(this));
    containerEmotions.addEventListener('click', this._showFullInfo.bind(this)); // Attach full info display event
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#emotions.forEach(emotion => {
      this._renderEmotionMarker(emotion);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDescription.focus();
  }

  _hideForm() {
    inputDescription.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _newEmotion(e) {
    e.preventDefault();

    const type = inputType.value;
    const description = inputDescription.value; // User's input description
    const { lat, lng } = this.#mapEvent.latlng;
    let emotion;

    if (type === 'happy') emotion = new Happy([lat, lng], description);
    if (type === 'sad') emotion = new Sad([lat, lng], description);
    if (type === 'anxiety') emotion = new Anxiety([lat, lng], description);
    if (type === 'depression')
      emotion = new Depression([lat, lng], description);

    // Add new object to emotions array
    this.#emotions.push(emotion);

    // Render emotion on map as marker
    this._renderEmotionMarker(emotion);

    // Render emotion in the list
    this._renderEmotion(emotion);

    // Hide form + clear input fields
    this._hideForm();

    // Save emotions to local storage
    this._setLocalStorage();
  }

  _renderEmotionMarker(emotion) {
    L.marker(emotion.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${emotion.type}-popup`,
        })
      )
      // Show the type of emotion on the pin
      .setPopupContent(
        `${emotion.type.charAt(0).toUpperCase() + emotion.type.slice(1)}`
      )
      .openPopup();
  }

  // need to change this section
  _renderEmotion(emotion) {
    let html = `
      <li class="workout workout--${emotion.type}" data-id="${emotion.id}">
        <h2 class="workout__title">${emotion.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            emotion.type === 'happy'
              ? '😊'
              : emotion.type === 'sad'
              ? '😢'
              : emotion.type === 'anxiety'
              ? '😰'
              : '😔'
          }</span>
        </div>
      </li>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    if (!this.#map) return;

    const emotionEl = e.target.closest('.workout');

    if (!emotionEl) return;

    const emotion = this.#emotions.find(
      emotion => emotion.id === emotionEl.dataset.id
    );

    this.#map.setView(emotion.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // Show full information when pin is clicked
  _showFullInfo(e) {
    const emotionEl = e.target.closest('.workout');

    if (!emotionEl) return;

    const emotion = this.#emotions.find(
      emotion => emotion.id === emotionEl.dataset.id
    );

    const popup = L.popup({
      maxWidth: 300,
      minWidth: 100,
      autoClose: false,
      closeOnClick: true,
    })
      .setLatLng(emotion.coords)
      .setContent(
        `<strong>${
          emotion.type.charAt(0).toUpperCase() + emotion.type.slice(1)
        }</strong><br>
        Description: ${emotion.description}` // Show user-provided description
      )
      .openOn(this.#map);
  }

  _setLocalStorage() {
    localStorage.setItem('emotions', JSON.stringify(this.#emotions));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('emotions'));

    if (!data) return;

    this.#emotions = data;

    this.#emotions.forEach(emotion => {
      this._renderEmotion(emotion);
    });
  }

  reset() {
    localStorage.removeItem('emotions');
    location.reload();
  }
}

const app = new App();

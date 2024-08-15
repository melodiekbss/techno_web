const cityInput = $(".city-input");
const searchButton = $(".search-btn");
const locationButton = $(".location-btn");
const currentWeatherDiv = $(".current-weather");
const weatherCardsDiv = $(".weather-cards");
const generateGraphButton = $(".search-btn");
const weatherGraph = $("#weather-graph");

const API_KEY = "a58641f830345ed45f5dd3544f09b11d"; // Clé API pour l'API OpenWeatherMap
// https://api.openweathermap.org/data/2.5/forecast?lat=50.59324&lon=5.867828&appid=a58641f830345ed45f5dd3544f09b11d

// avoir une date formatée
const getFormattedDate = (dateString) => {
  const days = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const date = new Date(dateString);

  const dayOfWeek = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayOfWeek} ${day}-${("0" + (date.getMonth() + 1)).slice(
    -2
  )}-${year}`;
};

// rendu carte mateo principale
const createWeatherCard = (cityName, weatherItem, index) => {
  const date = weatherItem.dt_txt.split(" ")[0]; // Date au format 'YYYY-MM-DD'
  const formattedDate = getFormattedDate(weatherItem.dt_txt); // Date formatée avec jour de la semaine

  if (index === 0) {
    // HTML pour la carte météo principale
    return `<div class="details">
                    <h2>${cityName} (${formattedDate})</h2>
                    <h6>Température: ${(weatherItem.main.temp - 273.15).toFixed(
                      2
                    )}°C</h6>
                    <h6>Vent: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidité: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${
                      weatherItem.weather[0].icon
                    }.png" alt="icône météo">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
  } else {
    // HTML pour les prévisions des cinq jours suivants
    return `<li class="card">
                    <h3>${formattedDate}</h3>
                    <img src="https://openweathermap.org/img/wn/${
                      weatherItem.weather[0].icon
                    }.png" alt="icône météo">
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(
                      2
                    )}°C</h6>
                    <h6>Vent: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidité: ${weatherItem.main.humidity}%</h6>
                </li>`;
  }
};

const traitementData = (data) => {

  const dataToUse = data.list
  console.log(dataToUse)


  const uniqueForecastDays = [];
  const fiveDaysForecast = data.list.filter((forecast) => {
    const forecastDate = new Date(forecast.dt_txt).getDate();
    if (!uniqueForecastDays.includes(forecastDate)) {
      return uniqueForecastDays.push(forecastDate);
    }
  });

  // Effacer les données météo précédentes
  cityInput.val("");
  currentWeatherDiv.empty();
  weatherCardsDiv.empty();

  // Créer les cartes météo et les ajouter au DOM
  fiveDaysForecast.forEach((weatherItem, index) => {
    const html = createWeatherCard(cityName, weatherItem, index);
    if (index === 0) {
      currentWeatherDiv.append(html);
    } else {
      weatherCardsDiv.append(html);
    }
  })
}

// rendu des sous cartes méteo
const getWeatherDetails = async (cityName, latitude, longitude) => {
  const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

  try {
    // Effectuer la requête API et attendre la réponse
    const response = await fetch(WEATHER_API_URL);

    // Vérifier si la réponse est correcte
    if (!response.ok) {
      throw new Error("La réponse du réseau pas correcte.");
    }

    // Convertir la réponse en JSON
    const data = await response.json();

    // Filtrer les prévisions pour obtenir une prévision par jour
    const uniqueForecastDays = [];
    const fiveDaysForecast = data.list.filter((forecast) => {
      const forecastDate = new Date(forecast.dt_txt).getDate();
      if (!uniqueForecastDays.includes(forecastDate)) {
        return uniqueForecastDays.push(forecastDate);
      }
    });

    // Effacer les données météo précédentes
    cityInput.val("");
    currentWeatherDiv.empty();
    weatherCardsDiv.empty();

    // Créer les cartes météo et les ajouter au DOM
    fiveDaysForecast.forEach((weatherItem, index) => {
      const html = createWeatherCard(cityName, weatherItem, index);
      if (index === 0) {
        currentWeatherDiv.append(html);
      } else {
        weatherCardsDiv.append(html);
      }
    });
  } catch (error) {
    // Gérer les erreurs
    alert(
      "Une erreur s'est produite lors de la récupération des prévisions météo : " +
        error.message
    );
  }
};

// Obtenir lattitude et longitude de la ville fournie par l'utilisateur
const getCityCoordinates = () => {
  const cityName = cityInput.val().trim();
  if (cityName === "") return;

  const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

  $.ajax({
    url: API_URL,
    method: "GET",
    success: (data) => {
      // Vérifier si des coordonnées ont été trouvées
      if (data.length === 0) {
        alert(`Aucune coordonnée trouvée pour ${cityName}`);
        return;
      }

      // Extraire les coordonnées et appeler la fonction pour obtenir les détails météo
      const { lat, lon, name } = data[0];
      getWeatherDetails(name, lat, lon);
    },
    error: (jqXHR, textStatus, errorThrown) => {
      // Gérer les erreurs
      alert(
        "Une erreur s'est produite lors de la récupération des coordonnées : " +
          textStatus +
          " " +
          errorThrown
      );
    },
  });
};

// Obtient les coordonnées depuis le navigateur
const getUserCoordinates = async () => {
  try {
    // Obtenir les coordonnées de l'utilisateur en utilisant une Promise
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const { latitude, longitude } = position.coords;

    // Obtenir le nom de la ville à partir des coordonnées en utilisant l'API de géocodage inverse
    const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

    // Effectuer la requête API et attendre la réponse
    const response = await fetch(API_URL);

    // Vérifier si la réponse est correcte
    if (!response.ok) {
      throw new Error("La réponse du réseau pas correcte.");
    }

    // Convertir la réponse en JSON
    const data = await response.json();

    // Vérifier si des coordonnées ont été trouvées
    if (!data.length) {
      alert("Aucun nom de ville trouvé pour vos coordonnées.");
      return;
    }

    // Extraire le nom de la ville et appeler la fonction pour obtenir les détails météo
    const { name } = data[0];
    getWeatherDetails(name, latitude, longitude);
  } catch (error) {
    // Gérer les erreurs liées à la géolocalisation et à la requête API
    if (error.message.includes("PERMISSION_DENIED")) {
      alert(
        "Demande de géolocalisation refusée. Veuillez réinitialiser l'autorisation de localisation pour accorder à nouveau l'accès."
      );
    } else {
      alert(
        "Erreur lors de la récupération des coordonnées ou des données météo : " +
          error.message
      );
    }
  }
};

// Post City Name
const sendCityName = (cityName) => {
  return $.ajax({
      url: "/city", 
      type: 'POST', 
      contentType: 'application/json', 
      data: JSON.stringify({ city_name: cityName }),
      success: function(response) {
          console.log("Response:", response);
      },
      error: function(xhr, status, error) {
          console.error("Error:", status, error);
      }
  });
}

// Get Weather data brut
const getWeatherDataBrut = () => {
  return $.ajax({
      url: "/weather", 
      type: 'GET', 
      success: function(response) {
          console.log("Response:", response);
      },
      error: function(xhr, status, error) {
          console.error("Error:", status, error);
      }
  });
}

// Get le graphique des previsions sur les 5 jours
const getWeatherGraph = (cityName) => {
  postCityName(cityName)
    .done((response) => {
      // Supposons que la réponse contient un identifiant de graphique
      const graphId = response.graph_id;

      // Maintenant, obtenons le graphique avec une requête GET
      $.ajax({
        url: `/weather-graph/${graphId}`,
        method: "GET",
        success: (response) => {
          if (response.image) {
            weatherGraph.attr("src", `data:image/png;base64,${response.image}`);
            weatherGraph.show();
          } else {
            alert("Aucune donnée disponible pour afficher le graphique.");
          }
        },
        error: () => {
          alert(
            "Une erreur s'est produite lors de la récupération du graphique."
          );
        },
      });
    })
    .fail(() => {
      alert("Une erreur s'est produite lors de l'envoi du nom de la ville.");
    });
};

// Fonction pour charger les données météo par défaut lors du chargement de la page
const loadDefaultWeather = async () => {
  try {
    // Effectuer la requête pour obtenir les données météo par défaut
    const response = await fetch("/default-weather");

    // Vérifier si la réponse est correcte
    if (!response.ok) {
      throw new Error("La réponse du réseau pas correcte.");
    }

    // Convertir la réponse en JSON
    const data = await response.json();

    if (data && data.list) {
      // Effacer les données météo précédentes
      currentWeatherDiv.empty();
      weatherCardsDiv.empty();

      // Filtrer les prévisions pour obtenir une prévision par jour
      const uniqueForecastDays = [];
      const fiveDaysForecast = data.list.filter((forecast) => {
        const forecastDate = new Date(forecast.dt_txt).getDate();
        if (!uniqueForecastDays.includes(forecastDate)) {
          return uniqueForecastDays.push(forecastDate);
        }
      });

      // Créer les cartes météo et les ajouter au DOM
      fiveDaysForecast.forEach((weatherItem, index) => {
        const html = createWeatherCard(data.city.name, weatherItem, index); // Utiliser le nom de la ville retourné par le serveur
        if (index === 0) {
          currentWeatherDiv.append(html);
        } else {
          weatherCardsDiv.append(html);
        }
      });

      // Afficher le graphique pour la ville par défaut
      await getWeatherGraph(data.city.name); // Appel de la fonction pour obtenir le graphique avec la ville par défaut
    }
  } catch (error) {
    // Gérer les erreurs de récupération des données météo
    alert(
      "Une erreur s'est produite lors de la récupération des données météo par défaut : " +
        error.message
    );
  }
};

// Appels des fonctions pour initialiser la page
$(document).ready(() => {
  
  generateGraphButton.on("click", () => {
    if (cityName) {
      getWeatherGraph(cityName);
    } else {
      alert("Veuillez entrer le nom d'une ville.");
    }
  });
  locationButton.on("click", getUserCoordinates);
  searchButton.on("click", getCityCoordinates);
  cityInput.on("keyup", (e) => {
    if (e.key === "Enter") {
      getCityCoordinates();
    }
  });
});

generateGraphButton.on("click", () => {
  const cityName = cityInput.val().trim();
  if (cityName) {
    sendCityName(cityName)
    data = getWeatherDataBrut()
    traitementData(data)
    getWeatherGraph(cityName);
  } else {
    alert("Veuillez entrer le nom d'une ville.");
  }
});

locationButton.on("click", getUserCoordinates);
searchButton.on("click", getCityCoordinates);
cityInput.on("keyup", (e) => {
  if (e.key === "Enter") {
    getCityCoordinates();
  }
});


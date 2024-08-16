import * as dico from './dictionnary_vf.js'

// Declaration variables jQuery
const cityInput = $(".city-input");
const locationButton = $(".location-btn");
const currentWeatherDiv = $(".current-weather");
const weatherCardsDiv = $(".weather-cards");
const generateGraphButton = $(".search-btn");

// avoir une date formatée from "YYYY-MM-DD" to "Day DD Month Year"
const getFormattedDate = (dateString) => {
  const days = [
    "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"
  ];
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", 
    "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const date = new Date(dateString);
  const dayOfWeek = days[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayOfWeek} ${day} ${month} ${year}`;
};

// rendu carte mateo principale
const createWeatherCard = (cityName, weatherItem, index) => {
  const formattedDate = getFormattedDate(weatherItem.date); // Date formatée avec jour de la semaine depuis le forme "YYYY-MM-DD"

  if (index === 0) {
    // HTML pour la carte météo principale
    return `<div class="details">
              <h2>${cityName} ( ${formattedDate} )</h2>
              <h6>Température: ${weatherItem.avg_temp}°C</h6>
              <h6>Vent: ${weatherItem.avg_wind_speed} M/S</h6>
              <h6>Humidité: ${weatherItem.avg_humidity}%</h6>
            </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather_icon}.png" alt="icône météo">
                </div>`;
  } else {
    // HTML pour les prévisions des cinq jours suivants
    return `<li class="card">
              <h3>${formattedDate}</h3>
              <img src="https://openweathermap.org/img/wn/${weatherItem.weather_icon}.png" alt="icône météo">
              <h6>Temp: ${weatherItem.avg_temp}°C</h6>
              <h6>Vent: ${weatherItem.avg_wind_speed} M/S</h6>
              <h6>Humidité: ${weatherItem.avg_humidity}%</h6>
            </li>`;
  }
};

// fonction pour supprimer les anciens rendu afin d'afficher les nouveaux
const resetRender = () =>{
  cityInput.val("");
  currentWeatherDiv.empty();
  weatherCardsDiv.empty();
}

// Fonction traitement
const haveDataAndTraitement = async(cityName) =>{
  if (cityName) {
    await sendCityName(cityName);
    const data = await getWeatherData();
    resetRender()
    data.forEach((weatherItem,index)=>{
      const htmlRender = createWeatherCard(cityName,weatherItem,index)
      if(index===0){
        currentWeatherDiv.append(htmlRender)
      }else {
        weatherCardsDiv.append(htmlRender)
      }
    })
    await getWeatherGraph();
  } else {
    alert("Veuillez entrer le nom d'une ville.");
  }
}

// Fonction pour determiner la position geogrphique de l'utilisateur
const detrminatePosition = async() =>{
  try{
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    console.log('position',position)
    const { latitude, longitude } = position.coords;

    return ({ latitude, longitude })
  } catch (error) {
    console.error("error detrminatePosition", error)
  }
}

// Post City Name
const sendCityName = async (cityName) => {
  try {
    const response = await $.ajax({
      url: "/city",
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ city_name: cityName })
    });
    console.log("Response post city name:", response);
  } catch (error) {
    console.error("Error:", error.status, error.statusText);
  }
};

// Post Coordinate position
const sendCordinatePosition = async (latitude, longitude) => {
  try {
    const response = await $.ajax({
      url: "/coordinate",
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ latitude: latitude, longitude: longitude })
    });
    console.log("Response post coordinate position:", response);
    return response
  } catch (error) {
    console.error("Error:", error.status, error.statusText);
  }
};

// Get Weather data
const getWeatherData = async () => {
  try {
    const response = await $.ajax({
      url: "/weather",
      type: 'GET'
    });
    console.log("Response get Weather Data:", response);
    return response;
  } catch (error) {
    console.error("Error:", error.status, error.statusText);
    return null; // Retourner null en cas d'erreur
  }
};

// Get Weather Graph
const getWeatherGraph = async () => {
  try {
    const response = await fetch('/weather_graph');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Vérifier le type de contenu de la réponse
    const contentType = response.headers.get('Content-Type');
    
    if (contentType.startsWith('image/')) {
      // Créer une URL d'objet pour l'image
      const blob = await response.blob();
      const imgURL = URL.createObjectURL(blob);
      
      // Assurer que l'élément #weather-graph existe
      const weatherGraph = document.getElementById('weather-graph');
      
      if (weatherGraph) {
        // Définir la source de l'image et rendre l'image visible
        weatherGraph.src = imgURL;
        weatherGraph.style.display = 'block'; // Rendre l'image visible
      } else {
        console.error('Element with id "weather-graph" not found.');
      }
    } else {
      // Gérer les erreurs de type de contenu inattendu
      throw new Error('La réponse du serveur n\'est pas une image.');
    }

  } catch (error) {
    console.error("Error:", error.message);
    // Gérer les erreurs ici, par exemple en affichant un message à l'utilisateur
    const weatherGraph = document.getElementById('weather-graph');
    if (weatherGraph) {
      weatherGraph.style.display = 'none'; // Masquer l'image en cas d'erreur
      // Afficher un message d'erreur ou d'autres actions nécessaires
    }
  }
};

// Appels des fonctions pour initialiser la page
$(document).ready(() => {
  haveDataAndTraitement("Namur")
});

generateGraphButton.on("click", async () => {
  const cityName = cityInput.val().trim();
  haveDataAndTraitement(cityName)
});

cityInput.on("keyup", (e) => {
  if (e.key === "Enter") {
    const cityName = cityInput.val().trim();
    haveDataAndTraitement(cityName)
  }
});

locationButton.on("click", async () => {
  const position = await detrminatePosition()
  const response = await sendCordinatePosition(position.latitude, position.longitude)
  const data = await getWeatherData();
    resetRender()
    data.forEach((weatherItem,index)=>{
      const htmlRender = createWeatherCard(response.city,weatherItem,index)
      if(index===0){
        currentWeatherDiv.append(htmlRender)
      }else {
        weatherCardsDiv.append(htmlRender)
      }
    })
    await getWeatherGraph()
});
const cityInput = $(".city-input");
const searchButton = $(".search-btn");
const locationButton = $(".location-btn");
const currentWeatherDiv = $(".current-weather");
const weatherCardsDiv = $(".weather-cards");

const generateGraphButton = $(".search-btn");
const weatherGraph = $("#weather-graph");

const API_KEY = "a58641f830345ed45f5dd3544f09b11d"; // Clé API pour l'API OpenWeatherMap


const getFormattedDate = (dateString) => {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const date = new Date(dateString);
    
    const dayOfWeek = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayOfWeek} ${day}-${("0" + (date.getMonth() + 1)).slice(-2)}-${year}`;
}



const createWeatherCard = (cityName, weatherItem, index) => {
    const date = weatherItem.dt_txt.split(" ")[0];  // Date au format 'YYYY-MM-DD'
    const formattedDate = getFormattedDate(weatherItem.dt_txt); // Date formatée avec jour de la semaine

    if (index === 0) { // HTML pour la carte météo principale
        return `<div class="details">
                    <h2>${cityName} (${formattedDate})</h2>
                    <h6>Température: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Vent: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidité: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}.png" alt="icône météo">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else { // HTML pour les prévisions des cinq jours suivants
        return `<li class="card">
                    <h3>${formattedDate}</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}.png" alt="icône météo">
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Vent: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidité: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
}


const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    $.get(WEATHER_API_URL)
        .done(data => {
            // Filtrer les prévisions pour obtenir une prévision par jour
            const uniqueForecastDays = [];
            const fiveDaysForecast = data.list.filter(forecast => {
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
            $.each(fiveDaysForecast, (index, weatherItem) => {
                const html = createWeatherCard(cityName, weatherItem, index);
                if (index === 0) {
                    currentWeatherDiv.append(html);
                } else {
                    weatherCardsDiv.append(html);
                }
            });        
        })
        .fail(() => {
            alert("Une erreur s'est produite lors de la récupération des prévisions météo !");
        });
}


const getCityCoordinates = () => {
    const cityName = cityInput.val().trim();
    if (cityName === "") return;
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    // Obtenir les coordonnées de la ville saisie depuis la réponse de l'API
    $.get(API_URL)
        .done(data => {
            if (!data.length) return alert(`Aucune coordonnée trouvée pour ${cityName}`);
            const { lat, lon, name } = data[0];
            getWeatherDetails(name, lat, lon);
        })
        .fail(() => {
            alert("Une erreur s'est produite lors de la récupération des coordonnées !");
        });
}

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords; // Obtenir les coordonnées de la localisation de l'utilisateur
            // Obtenir le nom de la ville à partir des coordonnées en utilisant l'API de géocodage inverse
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            $.get(API_URL)
                .done(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                })
                .fail(() => {
                    alert("Une erreur s'est produite lors de la récupération du nom de la ville !");
                });
        },
        error => { // Afficher une alerte si l'utilisateur refuse la permission de localisation
            if (error.code === error.PERMISSION_DENIED) {
                alert("Demande de géolocalisation refusée. Veuillez réinitialiser l'autorisation de localisation pour accorder à nouveau l'accès.");
            } else {
                alert("Erreur de demande de géolocalisation. Veuillez réinitialiser l'autorisation de localisation.");
            }
        }
    );
}



//attention pas mettre la méthode getWeatherGraph alors que post methode
const getWeatherGraph = (cityName) => {
    $.ajax({
        url: '/weather-graph',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ city_name: cityName }),
        success: (response) => {
            if (response.image) {
                weatherGraph.attr('src', `data:image/png;base64,${response.image}`);
                weatherGraph.show();
            } else {
                alert("Aucune donnée disponible pour afficher le graphique.");
            }
        },
        error: () => {
            alert("Une erreur s'est produite lors de la récupération du graphique.");
        }
    });
}

// Fonction pour charger les données météo par défaut lors du chargement de la page
const loadDefaultWeather = () => {
    $.get('/default-weather')
        .done(data => {
            if (data && data.list) {
                // Effacer les données météo précédentes
                currentWeatherDiv.empty();
                weatherCardsDiv.empty();

                // Filtrer les prévisions pour obtenir une prévision par jour
                const uniqueForecastDays = [];
                const fiveDaysForecast = data.list.filter(forecast => {
                    const forecastDate = new Date(forecast.dt_txt).getDate();
                    if (!uniqueForecastDays.includes(forecastDate)) {
                        return uniqueForecastDays.push(forecastDate);
                    }
                });

                // Créer les cartes météo et les ajouter au DOM
                $.each(fiveDaysForecast, (index, weatherItem) => {
                    const html = createWeatherCard(data.city.name, weatherItem, index); // Utiliser le nom de la ville retourné par le serveur
                    if (index === 0) {
                        currentWeatherDiv.append(html);
                    } else {
                        weatherCardsDiv.append(html);
                    }
                });        

                // Afficher le graphique pour la ville par défaut
                getWeatherGraph(data.city.name); // Appel de la fonction pour obtenir le graphique avec la ville par défaut
            }
        })
        .fail(() => {
            alert("Une erreur s'est produite lors de la récupération des données météo par défaut.");
        });
}



// Appels des fonctions pour initialiser la page
$(document).ready(() => {
    loadDefaultWeather();
    generateGraphButton.on("click", () => {
        const cityName = cityInput.val().trim();
        if (cityName) {
            getWeatherGraph(cityName);
        } else {
            alert("Veuillez entrer le nom d'une ville.");
        }
    });
    locationButton.on("click", getUserCoordinates);
    searchButton.on("click", getCityCoordinates);
    cityInput.on("keyup", e => {
        if (e.key === "Enter") {
            getCityCoordinates();
        }
    });
});



generateGraphButton.on("click", () => {
    const cityName = cityInput.val().trim();
    if (cityName) {
        getWeatherGraph(cityName);
    } else {
        alert("Veuillez entrer le nom d'une ville.");
    }
});


locationButton.on("click", getUserCoordinates);
searchButton.on("click", getCityCoordinates);
cityInput.on("keyup", e => {
    if (e.key === "Enter") {
        getCityCoordinates();
    }
});

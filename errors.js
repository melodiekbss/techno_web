// errors.js
export const ERROR_MESSAGES = {
    NETWORK_RESPONSE_ERROR: 'La réponse du réseau n\'est pas correcte.',
    WEATHER_DATA_FETCH_ERROR: 'Une erreur s\'est produite lors de la récupération des prévisions météo.',
    COORDINATES_FETCH_ERROR: 'Une erreur s\'est produite lors de la récupération des coordonnées.',
    CITY_NOT_FOUND: 'Aucune coordonnée trouvée pour {cityName}.',
    CITY_NAME_NOT_FOUND: 'Aucun nom de ville trouvé pour vos coordonnées.',
    GRAPH_FETCH_ERROR: 'Une erreur s\'est produite lors de la récupération du graphique.',
    DEFAULT_WEATHER_FETCH_ERROR: 'Une erreur s\'est produite lors de la récupération des données météo par défaut.',
    ENTER_CITY_NAME: 'Veuillez entrer le nom d\'une ville.',
    PERMISSION_DENIED: 'Demande de géolocalisation refusée. Veuillez réinitialiser l\'autorisation de localisation pour accorder à nouveau l\'accès.',
    GEolocation_ERROR: 'Erreur lors de la récupération des coordonnées ou des données météo.'
};

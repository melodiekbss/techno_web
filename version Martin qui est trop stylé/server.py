#!/usr/bin/env python
# -*- coding: utf-8 -*-

import matplotlib
matplotlib.use('Agg')  # Utiliser le backend non interactif 'Agg'

from flask import Flask, send_from_directory, render_template, request, jsonify, redirect, send_file
import matplotlib.pyplot as plt
import io
import base64
import requests
from matplotlib.ticker import MaxNLocator
import os
import uuid
import json
from collections import defaultdict
from datetime import datetime

app = Flask(__name__)


API_KEY = 'a58641f830345ed45f5dd3544f09b11d'  # Clé API pour OpenWeatherMap
CITY_INFO = {
    "name": None,
    "lat": None,
    "lon": None
}

# Fichier pour lire le contenu d'un fichier
def read_file(path):
    with open(path, 'rb') as f:
        return f.read()

# Fonction pour obtenir les coordonnées d'une ville
def get_city_coordinates_from_name(city_name):
    geo_url = f'https://api.openweathermap.org/geo/1.0/direct?q={city_name}&limit=1&appid={API_KEY}'
    response = requests.get(geo_url)
    return response.json()

# Fonction pour obtenir les prévisions météo pour des coordonnées données
def get_weather_from_coords(lat, lon):
    print("je cherche pour,",lat, lon)
    weather_url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}'
    print('url', weather_url)
    response = requests.get(weather_url)
    return response.json()

# Fonction pour parser les data recu de l'API
def process_weather_data(data):
    daily_data = defaultdict(lambda: {
        "max_temp": float('-inf'),
        "min_temp": float('inf'),
        "total_temp": 0,
        "count_temp": 0,
        "max_wind_speed": float('-inf'),
        "avg_wind_speed": 0,
        "total_wind_speed": 0,
        "count_wind_speed": 0,
        "max_humidity": float('-inf'),
        "min_humidity": float('inf'),
        "total_humidity": 0,
        "count_humidity": 0,
        "weather_icons": defaultdict(int)
    })

    for entry in data:
        date_str = entry['dt_txt'].split(' ')[0]
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
        daily = daily_data[date]

        # Températures
        temp = entry['main']['temp']
        daily["max_temp"] = max(daily["max_temp"], entry['main']['temp_max'])
        daily["min_temp"] = min(daily["min_temp"], entry['main']['temp_min'])
        daily["total_temp"] += temp
        daily["count_temp"] += 1

        # Vitesse du vent
        wind_speed = entry['wind']['speed']
        daily["max_wind_speed"] = max(daily["max_wind_speed"], wind_speed)
        daily["total_wind_speed"] += wind_speed
        daily["count_wind_speed"] += 1

        # Humidité
        humidity = entry['main']['humidity']
        daily["max_humidity"] = max(daily["max_humidity"], humidity)
        daily["min_humidity"] = min(daily["min_humidity"], humidity)
        daily["total_humidity"] += humidity
        daily["count_humidity"] += 1

        # Météo
        icon = entry['weather'][0]['icon']
        daily["weather_icons"][icon] += 1

    # Calculer les moyennes et déterminer le logo le plus fréquent
    result = []
    for date, values in daily_data.items():
        most_frequent_icon = max(values["weather_icons"], key=values["weather_icons"].get, default="01d")
        result.append({
            "date": date.strftime("%Y-%m-%d"),
            "max_temp": round(values["max_temp"] - 273.15, 2) if values["max_temp"] != float('-inf') else None,  
            "min_temp": round(values["min_temp"] - 273.15, 2) if values["min_temp"] != float('inf') else None,    
            "avg_temp": round((values["total_temp"] / values["count_temp"]) - 273.15, 2) if values["count_temp"] > 0 else None, 
            "max_wind_speed": round(values["max_wind_speed"], 2) if values["max_wind_speed"] != float('-inf') else None,  
            "avg_wind_speed": round(values["total_wind_speed"] / values["count_wind_speed"], 2) if values["count_wind_speed"] > 0 else None, 
            "max_humidity": round(values["max_humidity"], 2) if values["max_humidity"] != float('-inf') else None, 
            "min_humidity": round(values["min_humidity"], 2) if values["min_humidity"] != float('inf') else None, 
            "avg_humidity": round(values["total_humidity"] / values["count_humidity"], 2) if values["count_humidity"] > 0 else None,  
            "weather_icon": most_frequent_icon
        })


    return result

# Fonction pour générer un graphique météo
GRAPHICS_DIR = 'static/graphs'
def generate_weather_graph(city_name):
    # Assurer que le répertoire pour les graphiques existe
    if not os.path.exists(GRAPHICS_DIR):
        os.makedirs(GRAPHICS_DIR)

    # Supprimer les anciens fichiers graphiques pour éviter l'encombrement
    for filename in os.listdir(GRAPHICS_DIR):
        file_path = os.path.join(GRAPHICS_DIR, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)

    latitude = CITY_INFO['lat']
    longitude = CITY_INFO['lon']
    weather_data = get_weather_from_coords(latitude, longitude)

    dates = []
    temps = []
    for item in weather_data['list']:
        date = item['dt_txt'].split(' ')[0]
        temp = item['main']['temp'] - 273.15  # Convertir Kelvin à Celsius
        if date not in dates:
            dates.append(date)
            temps.append(temp)
        if len(dates) >= 5:
            break

    fig, ax = plt.subplots()
    ax.plot(dates, temps, marker='o')
    ax.set_xlabel('Date')
    ax.set_ylabel('Température (°C)')
    ax.set_title(f'Températures pour {city_name}')
    ax.xaxis.set_major_locator(MaxNLocator(integer=True))
    plt.xticks(rotation=45)
    plt.tight_layout()

    # Générer un nom unique pour le fichier
    graph_filename = f'{uuid.uuid4()}.png'
    graph_path = os.path.join(GRAPHICS_DIR, graph_filename)
    plt.savefig(graph_path)
    plt.close(fig)

    return graph_filename

# Routes pour les fichiers statiques
@app.route('/')
def redirection():
    return redirect('index.html', code=302)

@app.route('/index.html')
def index():
    return send_file('index.html')

@app.route('/script.js')
def javascript():
    return send_file('script.js', mimetype='text/javascript')

@app.route('/dictionnary_vf.js')
def dictionary_vf_js():
    return send_file('dictionnary_vf.js', mimetype='text/javascript')

@app.route('/style.css')
def css():
    return send_file('style.css', mimetype='text/css')

# Route pour obtenir les données météo pour une ville par défaut
@app.route('/city', methods=['POST'])
def post_city():
    global CITY_INFO
    data = request.json  # On récupère les données JSON de la requête POST

    if 'city_name' in data:
        CITY_NAME = data['city_name']  # On stocke le nom de la ville dans la variable locale

        # Envoi de la requête à l'API OpenWeather
        city_dat_url = f'https://api.openweathermap.org/geo/1.0/direct?q={CITY_NAME}&limit=1&appid={API_KEY}'
        response = requests.get(city_dat_url)

        if response.status_code == 200:
            city_data = response.json()  # Conversion de la réponse JSON en un objet Python (liste)

            if city_data:  # Vérifier si la liste n'est pas vide
                CITY_INFO = {
                    "name": city_data[0]["name"],
                    "lat": city_data[0]["lat"],
                    "lon": city_data[0]["lon"]
                }

                print(CITY_INFO)
                print("City name stored:", CITY_NAME)
                return jsonify({'message': 'City name received', 'city': CITY_NAME}), 200
            else:
                return jsonify({'error': 'No city data found'}), 404
        else:
            return jsonify({'error': 'Failed to retrieve city data'}), response.status_code
    else:
        return jsonify({'error': 'No city name provided'}), 400


    city_name = DEFAULT_CITY
    geo_data = get_city_coordinates_from_name(city_name)
    if not geo_data:
        return jsonify({'error': 'City not found'}), 404

    lat = geo_data[0]['lat']
    lon = geo_data[0]['lon']
    weather_data = get_weather_from_coords(lat, lon)
    return jsonify(weather_data)

@app.route('/coordinate', methods=['POST'])
def post_coordinate():
    global CITY_INFO
    data = request.json  # On récupère les données JSON de la requête POST

    if 'latitude' in data and 'longitude' in data:
        latitude = data['latitude']
        longitude = data['longitude']

        # Envoi de la requête à l'API OpenWeather pour obtenir le nom de la ville
        coord_url = f'https://api.openweathermap.org/geo/1.0/reverse?lat={latitude}&lon={longitude}&limit=1&appid={API_KEY}'
        response = requests.get(coord_url)

        if response.status_code == 200:
            city_data = response.json()  # Conversion de la réponse JSON en un objet Python (liste)

            if city_data:  # Vérifier si la liste n'est pas vide
                CITY_INFO = {
                    "name": city_data[0]["name"],
                    "lat": latitude,
                    "lon": longitude
                }

                print(CITY_INFO)
                print("City information stored:", CITY_INFO)
                return jsonify({'message': 'City information received', 'city': CITY_INFO['name']}), 200
            else:
                return jsonify({'error': 'No city data found'}), 404
        else:
            return jsonify({'error': 'Failed to retrieve city data'}), response.status_code
    else:
        return jsonify({'error': 'Invalid coordinates provided'}), 400

@app.route('/weather', methods=['GET'])
def get_weather():
    global CITY_INFO  # Accéder à la variable globale CITY_INFO
    
    # Vérifier que CITY_INFO contient bien les informations de latitude et longitude
    latitude = CITY_INFO['lat']
    longitude = CITY_INFO['lon']
    
    if not latitude or not longitude:
        return jsonify({'error': 'Latitude et longitude ne sont pas définies dans CITY_INFO'}), 400

    # Appeler la fonction pour obtenir les données météo avec les coordonnées
    weather_data = get_weather_from_coords(latitude, longitude)

    # Traiter les données pour en extraire un json par journée
    processed_data = process_weather_data(weather_data['list'])

    # Exporter en JSON
    with open('daily_weather_summary.json', 'w') as f:
        json.dump(processed_data, f, indent=4)
    
    return jsonify(processed_data)

@app.route('/weather_graph', methods=['GET'])
def get_weather_graph_data():
    try:
        global CITY_INFO

        if CITY_INFO['name'] is None or CITY_INFO['lat'] is None or CITY_INFO['lon'] is None:
            return jsonify({'error': 'City information is not set'}), 400

        city_name = CITY_INFO['name']
        graph_filename = generate_weather_graph(city_name)

        # Renvoie le fichier PNG généré
        return send_from_directory(GRAPHICS_DIR, graph_filename, mimetype='image/png')
    
    except Exception as e:
        return jsonify({'error': f'Une erreur s\'est produite: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)

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

app = Flask(__name__)

# https://api.openweathermap.org/geo/1.0/direct?q={CITY_NAME}&limit=1&appid={API_KEY}

# Dossier pour stocker les fichiers temporaires
TEMP_DIR = 'temp_graphs'
os.makedirs(TEMP_DIR, exist_ok=True)

API_KEY = 'a58641f830345ed45f5dd3544f09b11d'  # Clé API pour OpenWeatherMap
DEFAULT_CITY = 'Angleur'  # Ville par défaut    
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

# Fonction pour générer un graphique météo
def generate_weather_graph(city_name):
    geo_data = get_city_coordinates_from_name(city_name)
    if not geo_data:
        return None, 'City not found'

    lat = geo_data[0]['lat']
    lon = geo_data[0]['lon']
    weather_data = get_weather_from_coords(lat, lon)

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

    graph_id = str(uuid.uuid4())
    file_path = os.path.join(TEMP_DIR, f'{graph_id}.png')
    plt.savefig(file_path)
    plt.close(fig)

    return graph_id, None

# Routes pour les fichiers statiques
@app.route('/')
def redirection():
    return redirect('index.html', code=302)

@app.route('/index.html')
def index():
    return read_file('index.html')

@app.route('/script.js')
def javascript():
    return read_file('script.js')

@app.route('/style.css')
def css():
    return send_file('style.css')

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

@app.route('/default-weather', methods=['GET'])
def default_weather():
    city_name = DEFAULT_CITY
    geo_data = get_city_coordinates_from_name(city_name)
    if not geo_data:
        return jsonify({'error': 'City not found'}), 404

    lat = geo_data[0]['lat']
    lon = geo_data[0]['lon']
    weather_data = get_weather_from_coords(lat, lon)
    return jsonify(weather_data)

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
    
    return jsonify(weather_data)


@app.route('/geocode', methods=['GET'])
def get_city_coordinates():
    city_name = request.args.get('q')
    
    if not city_name:
        return jsonify({'error': 'Le nom de la ville est requis'}), 400

    geo_data = get_city_coordinates_from_name(city_name)
    if not geo_data:
        return jsonify({'error': 'Erreur lors de la récupération des coordonnées de la ville'}), 500

    return jsonify(geo_data)

@app.route('/reverse-geocode', methods=['GET'])
def reverse_geocode():
    latitude = request.args.get('lat')
    longitude = request.args.get('lon')
    
    if not latitude or not longitude:
        return jsonify({'error': 'Latitude et longitude sont requis'}), 400

    reverse_geo_url = f'https://api.openweathermap.org/geo/1.0/reverse?lat={latitude}&lon={longitude}&limit=1&appid={API_KEY}'
    response = requests.get(reverse_geo_url)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Erreur lors de la récupération du nom de la ville pour les coordonnées fournies'}), response.status_code

@app.route('/weather-data', methods=['POST'])
def weather_data():
    city_name = request.json.get('city_name')
    if not city_name:
        return jsonify({'error': 'City name is required'}), 400

    graph_id, error = generate_weather_graph(city_name)
    if error:
        return jsonify({'error': error}), 404

    return jsonify({'graph_id': graph_id})

@app.route('/weather-graph/<graph_id>', methods=['GET'])
def get_weather_graph(graph_id):
    file_path = os.path.join(TEMP_DIR, f'{graph_id}.png')

    if os.path.exists(file_path):
        with open(file_path, 'rb') as img_file:
            img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
        return jsonify({'image': img_base64})
    else:
        return jsonify({'error': 'Graphique non trouvé'}), 404

if __name__ == '__main__':
    app.run(debug=True)

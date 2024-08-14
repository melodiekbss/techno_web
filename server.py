#!/usr/bin/env python
# -*- coding: utf-8 -*-

import matplotlib
matplotlib.use('Agg')  # Utiliser le backend non interactif 'Agg'


from flask import Flask, send_from_directory, render_template, request, jsonify, redirect,send_file
import matplotlib.pyplot as plt
import io
import base64
import requests
from matplotlib.ticker import MaxNLocator

app = Flask(__name__)

API_KEY = 'a58641f830345ed45f5dd3544f09b11d'  # Clé API pour OpenWeatherMap
DEFAULT_CITY = 'Angleur'  # Ville par défaut

# Fichier pour lire le contenu d'un fichier.
def ReadFile(path):
    # Attention : il faut bien mettre "rb" plutôt que "r", sinon
    # l'UTF-8 ne fonctionne pas sous Windows.
    with open(path, 'rb') as f:
        return f.read()

@app.route('/')
def redirection():
    # Rediriger "/" vers "/index.html"
    return redirect('index.html', code = 302)

@app.route('/index.html')
def index():
    return ReadFile('index.html')

@app.route('/script.js')
def javascript():
    return ReadFile('script.js')

@app.route('/style.css')
def css():
    return send_file('style.css')

# Route pour obtenir les données météo pour une ville par défaut
@app.route('/default-weather', methods=['GET'])
def default_weather():
    city_name = DEFAULT_CITY
    

    # Obtenir les coordonnées de la ville
    geo_url = f'https://api.openweathermap.org/geo/1.0/direct?q={city_name}&limit=1&appid={API_KEY}'
    geo_response = requests.get(geo_url)
    geo_data = geo_response.json()

    if not geo_data:
        return jsonify({'error': 'City not found'}), 404

    lat = geo_data[0]['lat']
    lon = geo_data[0]['lon']

    # Obtenir les prévisions météo pour la ville
    weather_url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}'
    weather_response = requests.get(weather_url)
    weather_data = weather_response.json()

    return jsonify(weather_data)

@app.route('/weather-graph', methods=['POST'])
def weather_graph():
    city_name = request.json.get('city_name')

    if not city_name:
        return jsonify({'error': 'City name is required'}), 400
       

    # Obtenez les coordonnées de la ville
    geo_url = f'https://api.openweathermap.org/geo/1.0/direct?q={city_name}&limit=1&appid={API_KEY}'
    geo_response = requests.get(geo_url)
    geo_data = geo_response.json()

    if not geo_data:
        return jsonify({'error': 'City not found'}), 404

    lat = geo_data[0]['lat']
    lon = geo_data[0]['lon']

    # Obtenez les prévisions météo
    weather_url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}'
    weather_response = requests.get(weather_url)
    weather_data = weather_response.json()

    # Extraire les données pour les 5 jours
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

    # Créer le graphique
    fig, ax = plt.subplots()
    ax.plot(dates, temps, marker='o')

    ax.set_xlabel('Date')
    ax.set_ylabel('Température (°C)')
    ax.set_title(f'Températures pour {city_name}')
    ax.xaxis.set_major_locator(MaxNLocator(integer=True))
    plt.xticks(rotation=45)
    plt.tight_layout()

    # Enregistrer le graphique dans un buffer en mémoire
    img = io.BytesIO()
    plt.savefig(img, format='png')
    plt.close(fig)
    img.seek(0)

    # Convertir l'image en base64 pour l'envoyer au client
    img_base64 = base64.b64encode(img.getvalue()).decode('utf-8')

    return jsonify({'image': img_base64})

if __name__ == '__main__':
    app.run(debug = True)
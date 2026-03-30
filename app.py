# app.py
# Hlavní aplikace Labirint-AI (Flask + RAG + hra)

import os
from flask import Flask, request, jsonify
import httpx
from openai import OpenAI

# --- Inicializace ---
app = Flask(__name__)

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    base_url=os.environ.get("OPENAI_BASE_URL"),
    http_client=httpx.Client(verify=False)
)

# --- Jednoduchá "RAG databáze" (in-memory pro začátek) ---
dokumenty = []

# --- Pomocné funkce ---

def zavolat_ai(prompt):
    odpoved = client.chat.completions.create(
        model="gemma3:27b",
        messages=[{"role": "user", "content": prompt}]
    )
    return odpoved.choices[0].message.content


def ulozit_dokument(text):
    dokumenty.append(text)


def ziskat_kontext():
    return "\n".join(dokumenty[-3:])  # poslední 3 dokumenty


# --- Generování otázek ---

def generovat_otazky(tema):
    kontext = ziskat_kontext()

    prompt = f"""
    Vytvoř 5 testových otázek (A,B,C) na téma: {tema}
    Pokud je k dispozici kontext, použij ho:

    {kontext}

    Formát:
    OTÁZKA:
    A:
    B:
    C:
    SPRÁVNÁ:
    VYSVĚTLENÍ:
    """

    return zavolat_ai(prompt)


# --- Analýza odpovědí ---

def analyzovat_odpovedi(data):
    prompt = f"""
    Uživatel odpověděl na test:
    {data}

    Udělej:
    - analýzu chyb
    - vysvětlení
    - doporučení co se naučit
    """

    return zavolat_ai(prompt)


# --- Boss fight ---

def boss_otazka():
    prompt = "Vytvoř krátkou jednoduchou otázku (A,B,C)"
    return zavolat_ai(prompt)


# --- API endpointy ---

@app.route("/upload", methods=["POST"])
def upload():
    text = request.json.get("text", "")
    ulozit_dokument(text)
    return jsonify({"status": "ok"})


@app.route("/start", methods=["POST"])
def start():
    tema = request.json.get("tema", "")
    otazky = generovat_otazky(tema)
    return jsonify({"otazky": otazky})


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json.get("data", "")
    vysledek = analyzovat_odpovedi(data)
    return jsonify({"analyza": vysledek})


@app.route("/boss", methods=["GET"])
def boss():
    return jsonify({"otazka": boss_otazka()})


# --- Start serveru ---

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)


# requirements.txt
# flask
# openai
# httpx


# Dockerfile
# FROM python:3.12-slim
# WORKDIR /app
# COPY requirements.txt .
# RUN pip install -r requirements.txt
# COPY . .
# CMD ["python", "app.py"]

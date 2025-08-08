// 📚 SOURCE: Basado en el "Serverless Proxy Pattern" de nuestra guía.
// Archivo: /functions/gemini-proxy.js

const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'El prompt es requerido.' }) };
        }

        // 🔐 Tu API Key de Gemini se obtiene de forma segura de las variables de entorno.
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
             return { statusCode: 500, body: JSON.stringify({ error: 'La API Key no está configurada en el servidor.' }) };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.5,
                topK: 1,
                topP: 1,
                maxOutputTokens: 512,
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorDetails = await apiResponse.text();
            return { statusCode: apiResponse.status, body: JSON.stringify({ error: `Error en la API de Gemini: ${apiResponse.statusText}` }) };
        }

        const responseData = await apiResponse.json();
        const text = responseData.candidates[0]?.content?.parts[0]?.text || 'No se pudo obtener una respuesta.';

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Ha ocurrido un error interno en el servidor.' })
        };
    }
};
<div align="center">
  <img src="./public/web-app-manifest-192x192.png" alt="Thik Achhe Icon" width="128" />

  # Thik Achhe?

  <p>An offline SMS and WhatsApp scam checker powered by local AI.</p>

  **[🔴 Live Demo (Vercel)](https://thik-achhe.devloper.xyz/)**

  <br />

  [![Watch Video Demo](https://img.youtube.com/vi/0lnH-yV-_rI/0.jpg)](https://youtube.com/shorts/0lnH-yV-_rI?si=HwY63dRm5kq8kJSc)

  <br />

  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="https://developers.google.com/mediapipe"><img src="https://img.shields.io/badge/MediaPipe-GenAI-orange" alt="MediaPipe" /></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"><img src="https://img.shields.io/badge/PWA-Enabled-green" alt="PWA Support" /></a>
</div>

## Overview

"Thik Achhe?" is a privacy-first web application designed to help senior citizens verify whether a bank or lottery SMS is a scam. It runs completely offline using Google's MediaPipe Tasks GenAI to execute the gemma-4-E2B-it-web.litertlm model directly in the browser. 

Because the model runs entirely on the client, sensitive information like bank account numbers or OTPs are never sent to any server.

## Features

* Offline AI Analysis: Runs the Gemma 4 E2B LiteRT model locally in the browser.
* Multilingual Support: Interfaces and responses are available in English, Hindi, Bengali, and Nepali.
* Hard Rules Engine: Instantly flags known scam patterns like short links and OTP requests before the AI even evaluates them.
* PWA Enabled: Can be installed on mobile devices for quick access.
* Accessible UI: Extremely large text, high contrast, and simple traffic-light results (Red, Yellow, Green).

## Technology Stack

* Framework: Next.js App Router
* Styling: Tailwind CSS
* AI Integration: @mediapipe/tasks-genai
* Icons: lucide-react

## Local Development

To run the project locally on your machine:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server using the provided Windows script:
   ```cmd
   start.bat
   ```
   Alternatively, run:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 in your browser.

## Model Setup

When launching the application for the first time, you will be prompted to select the model file. You must download the gemma-4-E2B-it-web.litertlm file and select it via the file picker. This file is then securely loaded into your browser memory for all subsequent checks during that session.

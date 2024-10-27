# React Leaflet Map Application

This is a React application that displays a responsive, interactive map using [Leaflet](https://leafletjs.com/) and Material UI for styling. The map shows polling places in St. Louis County, with custom markers representing voter counts based on data fetched from a GeoJSON API.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Folder Structure](#folder-structure)
- [How It Works](#how-it-works)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features
- Interactive map centered on St. Louis County, MO
- Displays polling places with color-coded markers:
  - **Green**: Low voter count (< 25)
  - **Yellow**: Medium voter count (25 - 49)
  - **Red**: High voter count (>= 50)
- Custom popups with polling place details, including a link to Google Maps
- Responsive design using Material UI, ensuring the map adapts to different screen sizes

## Technologies Used
- **React**: Frontend framework
- **Leaflet**: For mapping functionality
- **Material UI**: For responsive UI design
- **JavaScript (ES6)**: Main programming language
- **GeoJSON**: Data format for fetching and displaying geographical data

## Getting Started

### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation
1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2. Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Application
1. Start the development server:
    ```bash
    npm start
    # or
    yarn start
    ```
2. Open your browser and go to: [http://localhost:3000](http://localhost:3000)

The map should load with polling place data displayed as markers.

## Folder Structure

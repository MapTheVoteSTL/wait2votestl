import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-css';
import 'esri-leaflet';

const MapComponent = () => {
    useEffect(() => {
        // Initialize the Leaflet map
        const map = L.map('map').setView([38.627003, -90.329402], 11);

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Ensure the ESRI plugin is available
        if (L.esri && L.esri.featureLayer) {
            // Fetch data from the ESRI FeatureServer
            const featureLayer = L.esri.featureLayer({
                url: 'https://services6.arcgis.com/wkbq75VVf2MvUvs7/arcgis/rest/services/lookup_view_polling_places_2024_11/FeatureServer/0'
            });

            // Add the feature layer to the map
            featureLayer.addTo(map);

            // Set popup for each feature
            featureLayer.bindPopup((layer) => {
                return 'Polling Place: ' + layer.feature.properties.PollingPlace;
            });
        } else {
            console.error('ESRI Leaflet plugin failed to load');
        }

        return () => {
            map.remove(); // Cleanup on component unmount
        };
    }, []);

    return <div id="map" style={{ height: '100vh', width: '150vh' }} />;
};

export default MapComponent;

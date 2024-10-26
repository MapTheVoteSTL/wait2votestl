import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-css';

const MapComponent = () => {
    useEffect(() => {
        // Create a map centered on St. Louis, MO
        const map = L.map('map').setView([38.627003, -90.329402], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Fetch data from the St Louis County GIS server
        const fetchData = async () => {
            try {
                const response = await fetch(
                    'https://services6.arcgis.com/wkbq75VVf2MvUvs7/ArcGIS/rest/services/lookup_view_polling_places_2024_11/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
                );
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();

                // Add GeoJSON data to the map with customized symbology
                const geoJsonLayer = L.geoJSON(data, {
                    onEachFeature: (feature, layer) => {
                        console.log('Feature properties:', feature.properties);
                        // Extract properties from the feature
                        const props = feature.properties;

                        // Create popup content with all available properties
                        const popupContent = `
                        <div style="color: black;">
                            <strong>Name:</strong> ${props.name }<br/>
                            <strong>Address:</strong> ${props.address}<br/>
                            <strong>Zipcode:</strong> ${props.zipcode}<br/>
                            <strong>Line Count:</strong> ${props.inline}<br/>
                            <strong>Google Map Link:</strong> <a href="${props.gmap}" target="_blank">${props.gmap}</a><br/>
                        `;

                        // Bind the popup to the layer
                        layer.bindPopup(popupContent);
                    }
                });

                // Add the GeoJSON layer to the map
                geoJsonLayer.addTo(map);
            } catch (error) {
                console.error('Failed to fetch GeoJSON data:', error);
            }
        };

        fetchData();

        return () => {
            map.remove(); // Cleanup map on component unmount
        };
    }, []);

    return <div id="map" style={{height: '80vh', width: '150vh'}} />;
};

export default MapComponent;

import {useEffect} from 'react';
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
                    'https://services6.arcgis.com/wkbq75VVf2MvUvs7/arcgis/rest/services/lookup_view_polling_places_2024_11/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
                );
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();

                // Add GeoJSON data to the map with customized symbology
                const geoJsonLayer = L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => {
                        // Customize the point marker (e.g., using a circle marker)
                        return L.circleMarker(latlng, {
                            radius: 8, // Radius of the circle
                            fillColor: 'red', // Fill color
                            color: 'black', // Outline color
                            weight: 1, // Outline width
                            opacity: 1, // Outline opacity
                            fillOpacity: 0.8 // Fill opacity
                        });
                    },
                    onEachFeature: (feature, layer) => {
                        // Bind a popup to each feature
                        const popupContent = feature.properties.PollingPlace
                            ? `Polling Place: ${feature.properties.PollingPlace}`
                            : 'No Polling Place Info';

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

    return <div id="map" style={{height: '100vh', width: '150vh'}}/>;
};

export default MapComponent;

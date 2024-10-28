import {useEffect} from 'react';
import L from 'leaflet';
import 'leaflet-css';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

// Extract the voter count from the 'inline' attribute
const extractVoterCount = (inline) => {
    const match = inline.match(/^(\d+)/);
    return match ? parseInt(match[0], 10) : null;
};

// Symbolize the marker color based on the voter count
const getColorByVoterCount = (count) => {
    if (count >= 50) return 'red';    // High voter count
    if (count >= 25) return 'yellow';  // Medium voter count
    return 'green';                   // Low voter count
};

// Custom icon for the marker
const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });
};

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
                    filter: (feature) => {
                        // Only include features with a non-null, non-empty 'inline' attribute
                        return feature.properties.inline !== null && feature.properties.inline !== '';
                    },
                    pointToLayer: (feature, latlng) => {
                        const inlineText = feature.properties.inline;
                        const voterCount = extractVoterCount(inlineText);

                        // Determine marker color based on voter count
                        const markerColor = getColorByVoterCount(voterCount);

                        // Create a marker with a custom icon
                        return L.marker(latlng, {icon: createCustomIcon(markerColor)});
                    },
                    onEachFeature: (feature, layer) => {
                        // Extract properties from the feature
                        const props = feature.properties;

                        // Create popup content with all available properties
                        const popupContent = `
                        <div style="color: black;">
                            <strong>Name:</strong> ${props.name}<br/>
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

        // Set up interval for periodic fetching
        const intervalId = setInterval(() => {
            fetchData();
        }, 30000); // Fetch every 30 seconds

        // Cleanup on component unmount
        return () => {
            clearInterval(intervalId);
            map.remove();
        };
    }, []);

    return (
        <Container maxWidth={false} sx={{ padding: { xs: 2, md: 4 } }}>
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{
                    width: '85vw',
                    height: { xs: '70vh', md: '85vh' }
                }}
            >
                <div id="map" style={{ height: '100%', width: '100%' }} />
            </Box>
        </Container>
    );
};

export default MapComponent;

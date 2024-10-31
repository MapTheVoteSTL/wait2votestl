import {useEffect, useRef} from 'react';
import L from 'leaflet';
import 'leaflet-css';
import {jenks} from 'simple-statistics';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

// Extract the voter count from the 'inline' attribute
const extractVoterCount = (inline) => {
    const match = inline.match(/^(\d+)/);
    return match ? parseInt(match[0], 10) : null;
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
    const mapRef = useRef(null);  // Reference to the map instance
    const legendRef = useRef(null);  // Reference to the legend control

    useEffect(() => {
        // Create a map centered on St. Louis, MO
        mapRef.current = L.map('map').setView([38.627003, -90.329402], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);

        // Function to add a legend to the map
        const addLegend = (breaks, colors) => {
            if (legendRef.current) {
                mapRef.current.removeControl(legendRef.current);  // Remove existing legend
            }

            legendRef.current = L.control({position: 'bottomright'});
            legendRef.current.onAdd = function () {
                const div = L.DomUtil.create('div', 'info legend');
                const labels = [];

                // Loop through the breaks and generate legend items
                for (let i = 0; i < breaks.length - 1; i++) {
                    const color = colors[i];
                    const from = Math.round(breaks[i]);
                    const to = Math.round(breaks[i + 1]);
                    labels.push(
                        `<i style="background:${color}; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> ${from} - ${to}`
                    );
                }

                // Add the last legend item with the greater than sign
                const lastColor = colors[colors.length - 1];
                const lastFrom = Math.round(breaks[breaks.length - 2]);
                labels[labels.length - 1] = (
                    `<i style="background:${lastColor}; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> > ${lastFrom}`
                );

                div.innerHTML = `<strong>Number of People In Line</strong><br>` + labels.join('<br>');
                return div;
            };

            legendRef.current.addTo(mapRef.current);
        };

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

                // Filter features with non-null, non-empty 'inline' attributes
                const inlineFeatures = data.features.filter((feature) => {
                    const inlineValue = feature.properties.inline;
                    if (inlineValue !== null && inlineValue !== '') {
                        return true;
                    } else {
                        console.log(`Filtered out feature with inline: ${inlineValue}`);
                        return false;
                    }
                });


                // Log the number of features with an 'inline' value
                console.log(`Number of points with 'inline' value: ${inlineFeatures.length}`);

                // Extract voter counts for classification
                const voterCounts = inlineFeatures
                    .map((feature) => extractVoterCount(feature.properties.inline))
                    .filter((count) => count !== null);

                // Ensure there are enough data points to classify
                let breaks, colors;
                if (voterCounts.length > 0) {
                    // Use simple-statistics to classify voter counts into 3 classes with Jenks
                    breaks = jenks(voterCounts, 3);
                    console.log(breaks)
                    // Define fixed colors for each class: green, yellow, red
                    colors = ['#1a9641', '#f6f63f', '#d7191c'];
                } else {
                    // Default breaks and colors if no valid voter counts are found
                    breaks = [0, 1, 2, 3];
                    colors = ['gray', 'gray', 'gray'];
                }

                // Create a counter to track the number of displayed markers
                let markerCount = 0;

                // Add GeoJSON data to the map
                const geoJsonLayer = L.geoJSON(data, {
                    filter: (feature) => {
                        // Include all features that have a non-empty 'inline' attribute
                        return feature.properties.inline !== null && feature.properties.inline !== '';
                    },
                    pointToLayer: (feature, latlng) => {
                        const inlineText = feature.properties.inline;
                        const voterCount = extractVoterCount(inlineText);

                        // Determine color based on Jenks classification
                        let markerColor = 'gray'; // Default color if count is null or undefined
                        if (voterCount !== null) {
                            // Find the appropriate class index for the voter count using Jenks breaks
                            let classIndex = breaks.findIndex((breakPoint) => voterCount <= breakPoint);
                            if (classIndex === -1) {
                                classIndex = breaks.length - 1;
                            }
                            // Set color based on class index
                            markerColor = colors[classIndex];
                        }

                        // Increment the marker counter
                        markerCount++;

                        // Create a marker with a custom icon
                        return L.marker(latlng, {icon: createCustomIcon(markerColor)});
                    },
                    onEachFeature: (feature, layer) => {
                        const props = feature.properties;
                        const popupContent = `
                            <div style="color: black; font-size: 14px;"> 
                                <strong>${props.name}</strong><br/>
                                ${props.address}<br/>
                                ${props.inline}<br/>
                                Google Map: <a href="${props.gmap}" target="_blank">${props.gmap}</a><br/>
                            </div>
                        `;
                        layer.bindPopup(popupContent);
                    }
                });

                geoJsonLayer.addTo(mapRef.current);

                // Log the number of markers added to the map
                console.log(`Number of points displayed on the map: ${markerCount}`);

                // Add the legend (only once)
                // addLegend(breaks, colors);
            } catch (error) {
                console.error('Failed to fetch GeoJSON data:', error);
            }
        };

        fetchData();

        // Set up interval for periodic fetching
        const intervalId = setInterval(fetchData, 30000); // Fetch every 30 seconds

        // Cleanup on component unmount
        return () => {
            clearInterval(intervalId);
            mapRef.current.remove();
        };
    }, []);

    return (
        <Container maxWidth={false} sx={{padding: {xs: 2, md: 4}}}>
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{
                    width: '85vw',
                    height: {xs: '70vh', md: '85vh'}
                }}
            >
                <div id="map" style={{height: '100%', width: '100%'}}/>
            </Box>
        </Container>
    );
};

export default MapComponent;

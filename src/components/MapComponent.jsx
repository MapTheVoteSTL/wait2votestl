import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-css';
import { jenks } from 'simple-statistics';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

const extractVoterCount = (inline) => {
    const match = inline.match(/^(\d+)/);
    return match ? parseInt(match[0], 10) : null;
};

const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });
};

const MapComponent = () => {
    const mapRef = useRef(null);
    const legendRef = useRef(null);

    const [geoJsonData, setGeoJsonData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [breaks, setBreaks] = useState([0, 1, 2, 3]);
    const [colors, setColors] = useState(['gray', 'gray', 'gray']);
    const [showLegend, setShowLegend] = useState(true);

    const addLegend = () => {
        if (legendRef.current) {
            mapRef.current.removeControl(legendRef.current);
        }

        legendRef.current = L.control({ position: 'bottomright' });
        legendRef.current.onAdd = () => {
            const div = L.DomUtil.create('div', 'info legend');
            const labels = [];

            for (let i = 0; i < breaks.length - 1; i++) {
                labels.push(
                    `<i style="background:${colors[i]}; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> ${Math.round(breaks[i])} - ${Math.round(breaks[i + 1])}`
                );
            }

            labels.push(
                `<i style="background:${colors[colors.length - 1]}; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> > ${Math.round(breaks[breaks.length - 2])}`
            );

            div.innerHTML = `<strong>Number of People In Line</strong><br>${labels.join('<br>')}`;
            return div;
        };

        if (showLegend) legendRef.current.addTo(mapRef.current);
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                'https://services6.arcgis.com/wkbq75VVf2MvUvs7/ArcGIS/rest/services/lookup_view_polling_places_2024_11/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
            );
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            setGeoJsonData(data);

            const inlineFeatures = data.features.filter((feature) => feature.properties.inline);
            const voterCounts = inlineFeatures.map((feature) => extractVoterCount(feature.properties.inline)).filter((count) => count !== null);

            if (voterCounts.length > 0) {
                const computedBreaks = jenks(voterCounts, 3);
                setBreaks(computedBreaks);
                setColors(['#1a9641', '#f6f63f', '#d7191c']);
            } else {
                setBreaks([0, 1, 2, 3]);
                setColors(['gray', 'gray', 'gray']);
            }
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!mapRef.current && document.getElementById('map')) {
            mapRef.current = L.map('map').setView([38.627003, -90.329402], 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapRef.current);

            fetchData();

            const intervalId = setInterval(fetchData, 30000);
            return () => {
                clearInterval(intervalId);
                if (mapRef.current) mapRef.current.remove();
            };
        }
    }, []);

    useEffect(() => {
        if (!geoJsonData || !mapRef.current) return;

        const inlineFeatures = geoJsonData.features.filter((feature) => feature.properties.inline);

        if (inlineFeatures.length === 0) {
            console.log("No data available to display.");
            return;
        }

        const geoJsonLayer = L.geoJSON(geoJsonData, {
            filter: (feature) => feature.properties.inline,
            pointToLayer: (feature, latlng) => {
                const voterCount = extractVoterCount(feature.properties.inline);
                let markerColor = 'gray';
                if (voterCount !== null) {
                    let classIndex = breaks.findIndex((breakPoint) => voterCount <= breakPoint);
                    if (classIndex === -1) classIndex = breaks.length - 1;
                    markerColor = colors[classIndex];
                }
                return L.marker(latlng, { icon: createCustomIcon(markerColor) });
            },
            onEachFeature: (feature, layer) => {
                const props = feature.properties;
                layer.bindPopup(`
                    <div style="color: black; font-size: 14px;"> 
                        <strong>${props.name}</strong><br/>
                        ${props.address}<br/>
                        ${props.inline}<br/>
                        Google Map: <a href="${props.gmap}" target="_blank">${props.gmap}</a><br/>
                    </div>
                `);
            },
        });

        geoJsonLayer.addTo(mapRef.current);
        if (showLegend) addLegend();

        return () => mapRef.current.removeLayer(geoJsonLayer);
    }, [geoJsonData, breaks, colors, showLegend]);

    return (
        <Container maxWidth={false} sx={{ padding: { xs: 2, md: 4 } }}>
            {isLoading && <div>Loading map data...</div>}
            {error && <div>Error loading map: {error}</div>}
            {!isLoading && !error && geoJsonData && geoJsonData.features.length === 0 && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', borderRadius: '5px' }}>
                    No data available
                </div>
            )}
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

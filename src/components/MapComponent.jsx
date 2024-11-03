import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { jenks } from 'simple-statistics';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

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

// Legend component
const Legend = ({ breaks, colors }) => {
    const map = useMap();
    useEffect(() => {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'info legend');
            const labels = [];
            for (let i = 0; i < breaks.length - 1; i++) {
                const color = colors[i];
                const from = Math.round(breaks[i]);
                const to = Math.round(breaks[i + 1]);
                labels.push(
                    `<i style="background:${color}; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> ${from} - ${to}`
                );
            }
            const lastColor = colors[colors.length - 1];
            const lastFrom = Math.round(breaks[breaks.length - 2]);
            labels.push(
                `<i style="background:${lastColor}; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i> > ${lastFrom}`
            );
            div.innerHTML = `<strong>Number of People In Line</strong><br>${labels.join('<br>')}`;
            return div;
        };
        legend.addTo(map);
        return () => map.removeControl(legend);
    }, [map, breaks, colors]);

    return null;
};

// Data fetcher component
const DataFetcher = ({ setMarkers, setLegend, setShowModal }) => {
    const map = useMap();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                    'https://services6.arcgis.com/wkbq75VVf2MvUvs7/ArcGIS/rest/services/lookup_view_polling_places_2024_11/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
                );
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();

                const inlineFeatures = data.features.filter((feature) => {
                    const inlineValue = feature.properties.inline;
                    return inlineValue !== null && inlineValue !== '';
                });

                const voterCounts = inlineFeatures
                    .map((feature) => extractVoterCount(feature.properties.inline))
                    .filter((count) => count !== null);

                let breaks, colors;
                if (voterCounts.length > 0) {
                    breaks = jenks(voterCounts, 3);
                    colors = ['#1a9641', '#f6f63f', '#d7191c'];
                } else {
                    breaks = [0, 1, 2, 3];
                    colors = ['gray', 'gray', 'gray'];
                }

                const markers = inlineFeatures.map((feature) => {
                    const inlineText = feature.properties.inline;
                    const voterCount = extractVoterCount(inlineText);

                    let markerColor = 'gray';
                    if (voterCount !== null) {
                        let classIndex = breaks.findIndex((breakPoint) => voterCount <= breakPoint);
                        if (classIndex === -1) classIndex = breaks.length - 1;
                        markerColor = colors[classIndex];
                    }

                    return {
                        position: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
                        color: markerColor,
                        name: feature.properties.name,
                        address: feature.properties.address,
                        inline: feature.properties.inline,
                        gmap: feature.properties.gmap,
                    };
                });

                setMarkers(markers);
                setLegend({ breaks, colors });
                if (markers.length === 0) setShowModal(true); // Show modal if no data is available
            } catch (error) {
                console.error('Failed to fetch GeoJSON data:', error);
                setShowModal(true); // Show modal if fetching fails
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 30000);

        return () => clearInterval(intervalId);
    }, [map, setMarkers, setLegend, setShowModal]);

    return null;
};

const MapComponent = () => {
    const [markers, setMarkers] = useState([]);
    const [legend, setLegend] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleClose = () => setShowModal(false);

    return (
        <Container maxWidth={false} sx={{ padding: { xs: 2, md: 4 } }}>
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{ width: '85vw', height: { xs: '70vh', md: '85vh' } }}
            >
                <MapContainer
                    center={[38.627003, -90.329402]}
                    zoom={11}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {markers.map((marker, index) => (
                        <Marker
                            key={index}
                            position={marker.position}
                            icon={createCustomIcon(marker.color)}
                        >
                            <Popup>
                                <div style={{ color: 'black', fontSize: '14px' }}>
                                    <strong>{marker.name}</strong><br />
                                    {marker.address}<br />
                                    {marker.inline}<br />
                                    Google Map: <a href={marker.gmap} target="_blank" rel="noopener noreferrer">{marker.gmap}</a><br />
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    {legend && markers.length > 0 && <Legend breaks={legend.breaks} colors={legend.colors} />}
                    <DataFetcher setMarkers={setMarkers} setLegend={setLegend} setShowModal={setShowModal} />
                </MapContainer>

                {/* Modal */}
                <Modal
                    open={showModal}
                    onClose={handleClose}
                    aria-labelledby="no-data-modal"
                    aria-describedby="no-data-description"
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: { xs: 300, sm: 400 }, // Smaller width on mobile
                            bgcolor: 'background.paper',
                            borderRadius: '8px',
                            boxShadow: 24,
                            p: 4,
                        }}
                    >
                        <Typography id="no-data-modal" variant="h6" component="h2" gutterBottom style={{ color: 'black' }}>
                            No Voter Line Data Available
                        </Typography>
                        <Typography id="no-data-description" sx={{ mt: 2 }} style={{ color: 'black' }}>
                            There is currently no data to display on the map. Please try again when polls are open.
                        </Typography>
                        <Box mt={3} textAlign="center">
                            <Button variant="contained" onClick={handleClose}>
                                Close
                            </Button>
                        </Box>
                    </Box>
                </Modal>
            </Box>
        </Container>
    );
};

export default MapComponent;

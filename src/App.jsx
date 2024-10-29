import MapComponent from './components/MapComponent';
import './App.css';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

function App() {
    return (
        <div>
            <header style={{ 
                backgroundColor: 'lightgray', 
                padding: '1rem', 
                fontSize: '1rem', // Default font size
                '@media (minWidth: 600px)': { // Adjust for larger screens 
                fontSize: '1.5rem', 
                } 
            }}>
            <h1>Wait 2 Vote STL</h1>
            <h3> Stay informed about your community's election day by exploring our interactive map, which provides real-time updates on voting locations and wait times across St Louis</h3>
        </header>
        <MapComponent/>
    </div>
    );
}

export default App;
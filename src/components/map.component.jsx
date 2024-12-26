import React, { useRef,useEffect, useState } from 'react';
import {
  Autocomplete,
  DrawingManager,
  GoogleMap,
  Polygon,
  useJsApiLoader,
} from '@react-google-maps/api';
import deleteIcon from '../assets/images/remove.png';
import { auth } from '../services/FireBaseConfig'; // Adjust the path if needed




const libraries = ['places', 'drawing', 'geometry'];

const MapComponent = () => {
  const mapRef = useRef();
  const polygonRefs = useRef([]);
  const activePolygonIndex = useRef();
  const autocompleteRef = useRef();
  const drawingManagerRef = useRef();

  console.log("key", process.env.REACT_APP_GOOGLE_MAPS_API_KEY);



  const { isLoaded} = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  
  const [polygons, setPolygons] = useState([]);
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [area, setArea] = useState(0);

  const defaultCenter = {
    lat: 28.626137,
    lng: 79.821603,
  };

  const containerStyle = {
    width: '100%',
    height: '400px',
  };

  const autocompleteStyle = {
    boxSizing: 'border-box',
    border: '1px solid transparent',
    width: '240px',
    height: '38px',
    padding: '0 12px',
    borderRadius: '3px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
    fontSize: '14px',
    outline: 'none',
    textOverflow: 'ellipses',
    position: 'absolute',
    right: '8%',
    top: '11px',
    marginLeft: '-120px',
  };

  const deleteIconStyle = {
    cursor: 'pointer',
    backgroundImage: `url(${deleteIcon})`,
    height: '24px',
    width: '24px',
    marginTop: '5px',
    backgroundColor: '#fff',
    position: 'absolute',
    top: '2px',
    left: '52%',
    zIndex: 99999,
  };

  const polygonOptions = {
    fillOpacity: 0.3,
    fillColor: '#ff0000',
    strokeColor: '#ff0000',
    strokeWeight: 2,
    draggable: true,
    editable: true,
  };

  const drawingManagerOptions = {
    polygonOptions: polygonOptions,
    drawingControl: true,
    drawingControlOptions: {
      position: window.google?.maps?.ControlPosition?.TOP_CENTER,
      drawingModes: [window.google?.maps?.drawing?.OverlayType?.POLYGON],
    },
  };

  const onLoadMap = (map) => {
    mapRef.current = map;
  };

  const onLoadPolygon = (polygon, index) => {
    polygonRefs.current[index] = polygon;
  };

  const onClickPolygon = (index) => {
    activePolygonIndex.current = index;
    setSelectedPolygon(polygons[index]);
    calculateArea(polygons[index]);
  };

  const onLoadAutocomplete = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    const { geometry } = autocompleteRef.current.getPlace();
    const bounds = new window.google.maps.LatLngBounds();
    if (geometry.viewport) {
      bounds.union(geometry.viewport);
    } else {
      bounds.extend(geometry.location);
    }
    mapRef.current.fitBounds(bounds);
  };

  const onLoadDrawingManager = (drawingManager) => {
    drawingManagerRef.current = drawingManager;
  };

  const onOverlayComplete = ($overlayEvent) => {
    drawingManagerRef.current.setDrawingMode(null);
    if ($overlayEvent.type === window.google.maps.drawing.OverlayType.POLYGON) {
      const newPolygon = $overlayEvent.overlay
        .getPath()
        .getArray()
        .map((latLng) => ({ lat: latLng.lat(), lng: latLng.lng() }));

      // Ensure the polygon is closed
      if (
        newPolygon.length > 0 &&
        (newPolygon[0].lat !== newPolygon[newPolygon.length - 1].lat ||
          newPolygon[0].lng !== newPolygon[newPolygon.length - 1].lng)
      ) {
        newPolygon.push(newPolygon[0]);
      }

      $overlayEvent.overlay.setMap(null);
      setPolygons([...polygons, newPolygon]);
    }
  };
  

  const onDeleteDrawing = () => {
    const filtered = polygons.filter(
      (polygon, index) => index !== activePolygonIndex.current
    );
    setPolygons(filtered);
    setSelectedPolygon(null);
    setArea(0);
  };

  const onEditPolygon = (index) => {
    const polygonRef = polygonRefs.current[index];
    if (polygonRef) {
      const coordinates = polygonRef
        .getPath()
        .getArray()
        .map((latLng) => ({ lat: latLng.lat(), lng: latLng.lng() }));

      const allPolygons = [...polygons];
      allPolygons[index] = coordinates;
      setPolygons(allPolygons);
      if (index === activePolygonIndex.current) {
        setSelectedPolygon(coordinates);
        calculateArea(coordinates);
      }
    }
  };

  const calculateArea = (polygon) => {
    if (window.google && window.google.maps.geometry) {
      const googlePolygon = new window.google.maps.Polygon({
        paths: polygon,
      });
      const areaInSquareMeters = window.google.maps.geometry.spherical.computeArea(
        googlePolygon.getPath()
      );
      setArea(areaInSquareMeters);
    }
  };
  

  const handleSaveShapes = async () => {
    const user = JSON.parse(localStorage.getItem('user')); // Retrieve logged-in user
    const email = user.email; // Get user's email
    const token = await auth.currentUser.getIdToken(); // Get Firebase token
  
    // Prompt user for a shape name
    const shapeName = prompt('Enter a unique name for this shape:');
    if (!shapeName) {
      alert('Shape name is required!');
      return; // Stop execution if no name provided
    }
   console.log(shapeName);
    const shapeData = polygons.map((polygon) => ({
      name: shapeName, // Add the shape name here
      type: 'polygon',
      coordinates: polygon.map((point) => ({ lat: point.lat, lng: point.lng })), // Save coordinates
    }));
  
    try {
      const response = await fetch('https://mapbackend-deh7.onrender.com/api/shapes/saveShapes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, shapes: shapeData, token }),
      });
  
      const data = await response.json();
      if (response.ok) {
        alert(`Shape "${shapeName}" saved successfully!`); // Display success message with name
      } else {
        alert(`Failed to save shape: ${data.message}`);
      }
    } catch (err) {
      console.error('Save Error:', err.message);
    }
  };
  
  const handleShapeSelection = (index) => {
    const selectedShape = storedShapes[index]; // Get selected shape
  
    if (selectedShape) {
      const newPolygon = selectedShape.coordinates.map((point) => ({
        lat: point.lat,
        lng: point.lng,
      }));
  
      // Update map with selected shape
      setPolygons([newPolygon]); // Replace existing shapes
      setSelectedPolygon(newPolygon); // Highlight it
      calculateArea(newPolygon); // Calculate area
    }
  };
  
  
  const [storedShapes, setStoredShapes] = useState([]);
  
  useEffect(() => {
    const fetchStoredShapes = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      const email = user.email;
      console.log(email)
  
      try {
        const response = await fetch('https://mapbackend-deh7.onrender.com/api/shapes/getShapes', {
          method: 'POST', // Use POST instead of GET
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }), // Send email in the body
        });
    
        const data = await response.json();
        if (response.ok) {
          console.log(data.shapes[0].shapes)
          setStoredShapes(data.shapes[0].shapes); // Save shapes in state
        } else {
          console.error('Failed to fetch shapes:', data.message);
        }
      } catch (err) {
        console.error('Fetch Error:', err.message);
      }
    };
  
    fetchStoredShapes();
  }, []); // Runs only once when component mounts
  

  return isLoaded ? (
    <div className="map-container" style={{ position: 'relative' }}>
      {drawingManagerRef.current && (
        <div
          onClick={onDeleteDrawing}
          title="Delete shape"
          style={deleteIconStyle}
        ></div>
      )}
      <GoogleMap
        zoom={15}
        center={defaultCenter}
        onLoad={onLoadMap}
        mapContainerStyle={containerStyle}
      >
        <DrawingManager
          onLoad={onLoadDrawingManager}
          onOverlayComplete={onOverlayComplete}
          options={drawingManagerOptions}
        />
        {polygons.map((polygon, index) => (
          <Polygon
            key={index}
            onLoad={(event) => onLoadPolygon(event, index)}
            onMouseDown={() => onClickPolygon(index)}
            onMouseUp={() => onEditPolygon(index)}
            onDragEnd={() => onEditPolygon(index)}
            options={polygonOptions}
            paths={polygon}
            draggable
            editable
          />
        ))}
                <Autocomplete
          onLoad={onLoadAutocomplete}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Search Location"
            style={autocompleteStyle}
          />
        </Autocomplete>

      </GoogleMap>
      <div
  style={{
    width: '100%',
    marginTop: '20px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  }}
>
  <h3>Saved Shapes:</h3>

  {storedShapes.length > 0 ? (
    <select
      onChange={(e) => handleShapeSelection(e.target.value)} // Function to load shape
      style={{
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginBottom: '10px',
      }}
    >
      <option value="">Select a Shape</option>
      {storedShapes.map((shape, idx) => (
        <option key={idx} value={idx}>
          {shape.name} {/* Display shape name */}
        </option>
      ))}
    </select>
  ) : (
    <p>No Shapes Stored Yet.</p>
  )}
</div>




      {/* Coordinate and Area Display */}
      <div
  style={{
    marginBottom: '20px',
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
  }}
>
  <button
    onClick={handleSaveShapes}
    style={{
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      backgroundColor: '#4CAF50',
      color: 'white',
      cursor: 'pointer',
    }}
  >
    Save Shape
  </button>
</div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '20px',
        }}
      >
        <div
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            width: '45%',
            marginRight: '10px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h3>Polygon Coordinates:</h3>
          {selectedPolygon ? (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                maxHeight: '150px',
                overflowY: 'auto',
              }}
            >
              {selectedPolygon.map((coord, idx) => (
                <li key={idx}>
                  Lat: {coord.lat.toFixed(6)}, Lng: {coord.lng.toFixed(6)}
                </li>
              ))}
            </ul>
          ) : (
            <p>No Polygon Selected</p>
          )}
        </div>

        <div
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            width: '45%',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h3>Polygon Area:</h3>
          <p>{area.toFixed(2)} m²</p>
        </div>
      </div>
    </div>
  ) : null;
};

export default MapComponent;

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { circle as turfCircle } from "@turf/turf";
import { MEDIA_URL } from "../../../utils/config";
import { getCleanImageUrl } from "../../../utils/common";
import {
  setSelectedQuestion,
  setSelectedQuestions,
} from "../../../slices/gameSlice";
import { useDispatch, useSelector } from "react-redux";
import CrossIcon from "../../../components/svgs/CrossIcon";

const MEDIA_BASE_URL = MEDIA_URL();

const QuestionPlacerMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const selectedQuestionRef = useRef(null);
  const markersInitializedRef = useRef(false);
  const dispatch = useDispatch();
  const [displayPlacedQuestions, setDisplayPlacedQuestions] = useState(false);
  const { selectedQuestion, selectedQuestions } = useSelector(
    (state) => state.games
  );
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const placedQuestions = selectedQuestions.filter((q) => q.isPlaced);

  const circlesCollectionRef = useRef({
    type: "FeatureCollection",
    features: [],
  });

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState(null);

  // Sync ref with state
  useEffect(() => {
    selectedQuestionRef.current = selectedQuestion;
  }, [selectedQuestion]);

  // Get full icon URL
  const getIconUrl = (iconPath) => {
    const finalUrl = getCleanImageUrl(iconPath);
    console.log(`QuestionPlacer Map Icon URL:`, finalUrl, 'Original:', iconPath);
    return finalUrl;
  };

  // Convert hex color to rgba with opacity
  const colorWithOpacity = (color, opacity = 0.1) => {
    if (color.startsWith("rgb(")) {
      return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
    }
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return `rgba(59, 130, 246, ${opacity})`;
  };

  // Add circle layers to map
  const addCircleLayers = useCallback(() => {
    if (!map.current || !map.current.getSource("question-circles")) {
      map.current.addSource("question-circles", {
        type: "geojson",
        data: circlesCollectionRef.current,
      });

      map.current.addLayer({
        id: "question-circles-fill",
        type: "fill",
        source: "question-circles",
        paint: {
          "fill-color": ["get", "fillColor"],
          "fill-opacity": 0.1,
        },
      });

      map.current.addLayer({
        id: "question-circles-outline",
        type: "line",
        source: "question-circles",
        paint: {
          "line-color": ["get", "borderColor"],
          "line-width": 2,
          "line-opacity": 0.8,
        },
      });
    }
  }, []);

  // Update circle source data
  const updateCircleSource = useCallback(() => {
    if (map.current && map.current.getSource("question-circles")) {
      map.current
        .getSource("question-circles")
        .setData(circlesCollectionRef.current);
    }
  }, []);

  // Update question location in Redux state
  const updateQuestionLocation = useCallback(
    (questionId, lng, lat) => {
      dispatch((dispatch, getState) => {
        const currentSelectedQuestions = getState().games.selectedQuestions;
        const updatedQuestions = currentSelectedQuestions.map((field) =>
          field.id === questionId
            ? {
              ...field,
              lng: lng,
              lat: lat,
            }
            : field
        );

        dispatch(setSelectedQuestions(updatedQuestions));
      });
    },
    [dispatch]
  );

  // Update circle position
  const updateCirclePosition = useCallback(
    (questionId, lng, lat) => {
      const circleIndex = circlesCollectionRef.current.features.findIndex(
        (f) => f.properties.id === questionId
      );

      if (circleIndex !== -1) {
        const question = markersRef.current.find(
          (m) => m.id === questionId
        )?.question;
        if (
          question &&
          question.locationRadius &&
          question.locationRadius > 0
        ) {
          const circleRadiusKm = question.locationRadius / 1000;
          const updatedCircle = turfCircle([lng, lat], circleRadiusKm, {
            steps: 64,
            units: "kilometers",
            properties: {
              id: questionId,
              center: [lng, lat],
              radius_m: question.locationRadius,
              fillColor: colorWithOpacity(question.radiusColor, 0.1),
              borderColor: question.radiusColor || "#3B82F6",
            },
          });

          circlesCollectionRef.current.features[circleIndex] = updatedCircle;
          updateCircleSource();
        }
      }
    },
    [updateCircleSource]
  );

  // Create marker with drag functionality
  const createMarker = useCallback(
    (lng, lat, question, isDraggable = true) => {
      if (!map.current || !question) return null;

      try {
        const el = document.createElement("div");
        el.className = "custom-marker";

        const img = document.createElement("img");
        const iconUrl =
          getIconUrl(question.icon) ||
          `https://ui-avatars.com/api/?name=${question.name.slice(
            0
          )}&bold=true`;
        img.src = iconUrl;
        img.alt = question.iconName;
        img.style.width = "40px";
        img.style.height = "40px";
        img.style.borderRadius = "50%";
        img.style.border = `3px solid ${question.radiusColor || "var(--color-accent)"
          }`;
        img.style.background = "white";
        img.style.padding = "2px";
        img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

        // Add cursor style for draggable markers
        if (isDraggable) {
          img.style.cursor = "grab";
        }

        const badge = document.createElement("div");
        badge.style.position = "absolute";
        badge.style.top = "-5px";
        badge.style.right = "-5px";
        badge.style.background = question.radiusColor || "var(--color-accent)";
        badge.style.color = "white";
        badge.style.borderRadius = "50%";
        badge.style.width = "20px";
        badge.style.height = "20px";
        badge.style.fontSize = "10px";
        badge.style.display = "none";
        badge.style.alignItems = "center";
        badge.style.justifyContent = "center";
        badge.style.fontWeight = "bold";
        badge.textContent = "Q";

        el.appendChild(img);
        el.appendChild(badge);

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
          draggable: isDraggable, // Enable dragging for placed markers
        })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-sm">${question.name}</h3>
              <p class="text-xs text-gray-600">${question.iconName}</p>
              <p class="text-xs">Points: ${question.points}</p>
              <p class="text-xs">Radius: ${question.locationRadius}m</p>
              <p class="text-xs">Location: ${lat.toFixed(4)}, ${lng.toFixed(
              4
            )}</p>
              ${isDraggable
                ? '<p class="text-xs text-blue-500">Drag to move</p>'
                : ""
              }
            </div>
          `)
          )
          .addTo(map.current);

        // Add drag event listeners
        if (isDraggable) {
          marker.getElement().addEventListener("dragstart", () => {
            setDraggedQuestion(question);
            img.style.cursor = "grabbing";
            img.style.opacity = "0.7";
          });

          marker.on("drag", () => {
            // Update circle position in real-time during drag
            const newLngLat = marker.getLngLat();
            updateCirclePosition(question.id, newLngLat.lng, newLngLat.lat);
          });

          marker.on("dragend", () => {
            const newLngLat = marker.getLngLat();
            console.log(
              `📍 Marker dragged to: ${newLngLat.lng}, ${newLngLat.lat}`
            );

            // Update question location in state
            updateQuestionLocation(question.id, newLngLat.lng, newLngLat.lat);

            img.style.cursor = "grab";
            img.style.opacity = "1";
            setDraggedQuestion(null);
          });
        }

        return marker;
      } catch (error) {
        console.error("❌ Error creating marker:", error);
        return null;
      }
    },
    [updateCirclePosition, updateQuestionLocation]
  );

  // Place a question on the map
  const placeQuestionOnMap = useCallback(
    (lng, lat, question, skipStateUpdate = false) => {
      if (!map.current || !question) return;

      try {
        // Create marker with drag enabled
        const marker = createMarker(lng, lat, question, true);
        if (!marker) return;

        // Store marker reference using question.id for consistency
        const markerId = question.id;
        markersRef.current.push({ id: markerId, marker, question });

        // Create circle for the question radius
        if (question.locationRadius && question.locationRadius > 0) {
          const circleRadiusKm = question.locationRadius / 1000;
          const circleFeature = turfCircle([lng, lat], circleRadiusKm, {
            steps: 64,
            units: "kilometers",
            properties: {
              id: markerId,
              center: [lng, lat],
              radius_m: question.locationRadius,
              fillColor: colorWithOpacity(question.radiusColor, 0.1),
              borderColor: question.radiusColor || "#3B82F6",
            },
          });

          circlesCollectionRef.current.features.push(circleFeature);
          updateCircleSource();
        }

        // Only update state if not skipping (for existing placed questions)
        if (!skipStateUpdate) {
          dispatch((dispatch, getState) => {
            const currentSelectedQuestions = getState().games.selectedQuestions;
            const updatedQuestions = currentSelectedQuestions.map((field) =>
              field.id === question.id
                ? {
                  ...field,
                  isSelected: false,
                  isPlaced: true,
                  lng: lng,
                  lat: lat,
                }
                : field
            );

            dispatch(setSelectedQuestions(updatedQuestions));
            dispatch(setSelectedQuestion(null));
          });
        }

        console.log(`✅ Placed question: ${question.name}`);
      } catch (error) {
        console.error("❌ Error placing marker:", error);
      }
    },
    [createMarker, updateCircleSource, dispatch]
  );

  // Create markers for existing placed questions when map loads
  useEffect(() => {
    if (
      isMapLoaded &&
      placedQuestions.length > 0 &&
      !markersInitializedRef.current
    ) {
      // console.log(
      //   "🗺️ Creating markers for existing placed questions:",
      //   placedQuestions.length
      // );

      markersInitializedRef.current = true;

      const bounds = new mapboxgl.LngLatBounds();

      placedQuestions.forEach((question) => {
        if (question.lng && question.lat) {
          // Use placeQuestionOnMap but skip state update to avoid infinite loop
          placeQuestionOnMap(question.lng, question.lat, question, true);
          bounds.extend([question.lng, question.lat]);
        }
      });

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15, // Optional: limit max zoom
        });
      }
    }
  }, [isMapLoaded, placedQuestions, placeQuestionOnMap]);

  // Update circles and popups when selectedQuestions changes (e.g. radius update)
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    let circlesUpdated = false;

    selectedQuestions.forEach((question) => {
      if (question.isPlaced) {
        const circleIndex = circlesCollectionRef.current.features.findIndex(
          (f) => f.properties.id === question.id
        );

        if (circleIndex !== -1) {
          const currentFeature =
            circlesCollectionRef.current.features[circleIndex];
          // Check if radius changed
          if (currentFeature.properties.radius_m != question.locationRadius) {
            const circleRadiusKm = question.locationRadius / 1000;
            const updatedCircle = turfCircle(
              currentFeature.properties.center,
              circleRadiusKm,
              {
                steps: 64,
                units: "kilometers",
                properties: {
                  ...currentFeature.properties,
                  radius_m: question.locationRadius,
                },
              }
            );
            circlesCollectionRef.current.features[circleIndex] = updatedCircle;
            circlesUpdated = true;
          }
        }

        // Update marker popup content if needed
        const markerEntry = markersRef.current.find(
          (m) => m.id === question.id
        );
        if (markerEntry) {
          // We update the stored question in markerEntry so we have latest data
          if (markerEntry.question.locationRadius !== question.locationRadius) {
            markerEntry.question = question; // Update reference

            // Update Popup
            const popup = markerEntry.marker.getPopup();
            if (popup) {
              const isDraggable = markerEntry.marker.isDraggable();
              popup.setHTML(`
                  <div class="p-2">
                    <h3 class="font-bold text-sm">${question.name}</h3>
                    <p class="text-xs text-gray-600">${question.iconName}</p>
                    <p class="text-xs">Points: ${question.points}</p>
                    <p class="text-xs">Radius: ${question.locationRadius}m</p>
                    <p class="text-xs">Location: ${question.lat.toFixed(
                      4
                    )}, ${question.lng.toFixed(4)}</p>
                    ${
                      isDraggable
                        ? '<p class="text-xs text-blue-500">Drag to move</p>'
                        : ""
                    }
                  </div>
                `);
            }
          }
        }
      }
    });

    if (circlesUpdated) {
      updateCircleSource();
    }
  }, [selectedQuestions, isMapLoaded, updateCircleSource]);

  // Handle map click
  const handleMapClick = useCallback(
    (e) => {
      const currentSelectedQuestion = selectedQuestionRef.current;
      if (!currentSelectedQuestion) return;

      placeQuestionOnMap(e.lngLat.lng, e.lngLat.lat, currentSelectedQuestion);
    },
    [placeQuestionOnMap]
  );

  // Initialize map
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_API_KEY_PK;

    if (!token || !mapContainer.current) {
      console.error("❌ Missing token or container");
      return;
    }

    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [31.2357, 30.0444], // Cairo, Egypt coordinates
        // zoom: 9,
      });

      map.current.addControl(new mapboxgl.NavigationControl());

      map.current.on("load", () => {
        setIsMapLoaded(true);
        addCircleLayers();
      });

      map.current.on("click", handleMapClick);
    } catch (error) {
      console.error("❌ Failed to create map:", error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
      markersRef.current.forEach((marker) => marker.marker.remove());
    };
  }, [handleMapClick, addCircleLayers]);

  // Remove a placed question
  const removePlacedQuestion = useCallback(
    (questionId) => {
      const markerIndex = markersRef.current.findIndex(
        (m) => m.id === questionId
      );

      if (markerIndex !== -1) {
        const { marker } = markersRef.current[markerIndex];

        // Remove marker from map
        marker.remove();
        markersRef.current.splice(markerIndex, 1);

        // Remove circle from map
        circlesCollectionRef.current.features =
          circlesCollectionRef.current.features.filter(
            (f) => f.properties.id !== questionId
          );
        updateCircleSource();

        // Update Redux state
        dispatch((dispatch, getState) => {
          const currentSelectedQuestions = getState().games.selectedQuestions;
          const updatedQuestions = currentSelectedQuestions.map((field) => {
            if (field.id === questionId) {
              // eslint-disable-next-line no-unused-vars
              const { lng, lat, isPlaced, isSelected, ...rest } = field;
              return rest;
            }
            return field;
          });

          dispatch(setSelectedQuestions(updatedQuestions));
        });

        // console.log(`🗑️ Removed question: ${question.name}`);
      } else {
        console.warn(`⚠️ Marker not found for question ID: ${questionId}`);
      }
    },
    [updateCircleSource, dispatch]
  );

  // Resize map when container changes
  const resizeMap = useCallback(() => {
    if (map.current) {
      setTimeout(() => {
        map.current.resize();
      }, 10);
    }
  }, []);

  // Add Resize Observer to detect container size changes
  useEffect(() => {
    if (!mapContainer.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === mapContainer.current) {
          resizeMap();
        }
      }
    });

    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [resizeMap]);

  useEffect(() => {
    const q = searchValue.trim();
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    const token = import.meta.env.VITE_MAPBOX_API_KEY_PK;
    const controller = new AbortController();
    setIsSearching(true);
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        q
      )}.json?access_token=${token}&limit=5`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((json) => {
        const feats = Array.isArray(json?.features) ? json.features : [];
        setSearchResults(
          feats.map((f) => ({ label: f.place_name, center: f.center }))
        );
      })
      .catch(() => {})
      .finally(() => setIsSearching(false));
    return () => controller.abort();
  }, [searchValue]);

  const handleSelectPlace = (place) => {
    if (!map.current || !place) return;
    map.current.flyTo({ center: place.center, zoom: 14 });
    setSearchResults([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 border border-red-500 min-h-72">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border p-2 z-20 w-64">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search location"
              className="w-full border rounded px-2 py-1 text-sm"
            />
            {isSearching && (
              <div className="text-xs text-gray-500 p-2">Searching...</div>
            )}
            {searchResults.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-auto">
                {searchResults.map((r, idx) => (
                  <li
                    key={idx}
                    className="p-2 text-sm hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectPlace(r)}
                  >
                    {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Placement Instructions */}
          {selectedQuestion && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-10 max-w-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-500 font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-semibold">Place Question</h3>
                  <p className="text-sm opacity-90">
                    Click anywhere on the map to place:{" "}
                    <strong>{selectedQuestion.name}</strong>
                  </p>
                  <p className="text-xs opacity-80 mt-1">
                    Radius: {selectedQuestion.locationRadius}m
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Drag Instructions */}
          {draggedQuestion && (
            <div className="absolute top-20 left-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-10 max-w-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-green-500 font-bold text-xs">↔</span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Dragging: {draggedQuestion.name}
                  </p>
                  <p className="text-xs opacity-90">Drop to update location</p>
                </div>
              </div>
            </div>
          )}

          {/* Placed Questions Panel */}
          {placedQuestions.length > 0 && (
            <div className="w-full absolute top-20 right-4 bg-white rounded-lg shadow-lg border max-w-sm max-h-64 overflow-hidden z-10">
              <div className="w-full p-3 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">
                  Placed Questions ({placedQuestions.length})
                </h3>
                <span
                  onClick={() => setDisplayPlacedQuestions((prev) => !prev)}
                  className="cursor-pointer"
                >
                  {displayPlacedQuestions ? (
                    <CrossIcon />
                  ) : (
                    <CrossIcon className="rotate-45" />
                  )}
                </span>
              </div>
              {displayPlacedQuestions && (
                <div className="overflow-y-auto max-h-48">
                  {placedQuestions.map((placed) => (
                    <div
                      key={placed.id}
                      className="p-3 border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  placed.radiusColor || "var(--color-accent)",
                              }}
                            ></div>
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {placed.name}
                            </h4>
                            <span className="text-xs text-blue-500 font-medium bg-blue-50 px-1 rounded">
                              Drag
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {placed.lat.toFixed(4)}, {placed.lng.toFixed(4)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {placed.points} points • {placed.iconName} •{" "}
                            {placed.locationRadius}m radius
                          </p>
                        </div>
                        <button
                          onClick={() => removePlacedQuestion(placed.id)}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Map Loading Overlay */}
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-20">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionPlacerMap;

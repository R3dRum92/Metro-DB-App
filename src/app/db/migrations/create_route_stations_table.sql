CREATE TABLE IF NOT EXISTS routes_stations ( 
    route_station_id uuid PRIMARY KEY, 
    route_id uuid NOT NULL, 
    station_id uuid NOT NULL, 
    stop_INT INT NOT NULL, 
    arrival_time TIMESTAMP, 
    CONSTRAINT fk_route FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE, 
    CONSTRAINT fk_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE 
)
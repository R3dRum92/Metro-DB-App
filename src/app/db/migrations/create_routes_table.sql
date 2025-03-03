CREATE TABLE IF NOT EXISTS routes ( 
    route_id uuid PRIMARY KEY, 
    route_name VARCHAR(100) NOT NULL, 
    start_station_id uuid NOT NULL, 
    end_station_id uuid NOT NULL, 
    created_at TIMESTAMP DEFAULT now(), 
    CONSTRAINT fk_start_station FOREIGN KEY (start_station_id) REFERENCES stations(station_id) ON DELETE CASCADE, 
    CONSTRAINT fk_end_station FOREIGN KEY (end_station_id) REFERENCES stations(station_id) ON DELETE CASCADE 
)

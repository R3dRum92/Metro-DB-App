CREATE TABLE IF NOT EXISTS stations ( 
    station_id UUID PRIMARY KEY, 
    station_name VARCHAR(100) UNIQUE NOT NULL, 
    location VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP DEFAULT now() 
)

CREATE TABLE IF NOT EXISTS trains( 
    train_id uuid PRIMARY KEY, 
    train_code VARCHAR(50) UNIQUE NOT NULL, 
    route_id UUID NOT NULL, 
    capacity INT NOT NULL, 
    operational_status VARCHAR(20) DEFAULT 'active' CHECK (operational_status IN ('active', 'inactive')), 
    CONSTRAINT fk_route_train FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE 
)
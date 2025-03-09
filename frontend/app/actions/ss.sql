CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(100) UNIQUE,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user'::character varying,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    date_of_birth DATE NOT NULL,
    CONSTRAINT users_role_check CHECK ((role)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying])::text[]))
);

-- Create indexes
CREATE UNIQUE INDEX users_pkey ON users USING BTREE (id);
CREATE UNIQUE INDEX users_email_key ON users USING BTREE (email);
CREATE UNIQUE INDEX users_phone_number_key ON users USING BTREE (phone_number);
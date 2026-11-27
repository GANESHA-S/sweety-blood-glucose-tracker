CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE readings (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    reading_date DATE NOT NULL,

    time_slot VARCHAR(30) NOT NULL,

    glucose_value INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT valid_time_slot
        CHECK (
            time_slot IN (
                'morning',
                'after_breakfast',
                'after_lunch',
                'after_dinner'
            )
        ),

    CONSTRAINT valid_glucose_value
        CHECK (
            glucose_value BETWEEN 40 AND 600
        ),

    CONSTRAINT unique_daily_slot
        UNIQUE (user_id, reading_date, time_slot)
);




CREATE INDEX idx_readings_user_date
ON readings(user_id, reading_date);
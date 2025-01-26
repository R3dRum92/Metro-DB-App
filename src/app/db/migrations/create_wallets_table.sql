CREATE TABLE IF NOT EXISTS wallets( 
    ticket_id uuid PRIMARY KEY, 
    user_id uuid NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 300.00 NOT NULL,
    valid_from timestamp default now(), 
    valid_until timestamp not null, 
    constraint fk_user_wallet foreign key(user_id) references users(id) on delete cascade
)
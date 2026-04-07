# -------- BUILD STAGE --------
    FROM heroiclabs/nakama-pluginbuilder:3.22.0 AS builder

    WORKDIR /backend
    COPY . .
    RUN go mod download
    RUN go build --trimpath --buildmode=plugin -o /backend/backend.so
    
    # -------- RUNTIME STAGE --------
    FROM heroiclabs/nakama:3.22.0
    
    COPY --from=builder /backend/backend.so /nakama/data/modules
    COPY local.yml /nakama/data/local.yml
    
    CMD ["/nakama/nakama", "--name", "nakama1", "--database.address", "postgresql://nakama_postgres_6uya_user:wp0OLVzDByRIMcc5RWyt5C3I1iIdsfr0@dpg-d7aga3nkijhs73dn1ovg-a.singapore-postgres.render.com/nakama_postgres_6uya?sslmode=disable", "--config", "/nakama/data/local.yml", "--logger.level", "DEBUG", "--socket.port", "7350", "--http.port", "7350"]
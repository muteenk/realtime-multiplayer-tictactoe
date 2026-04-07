FROM heroiclabs/nakama-pluginbuilder:3.22.0 AS builder

WORKDIR /backend
COPY . .
RUN go mod download
RUN go build --trimpath --buildmode=plugin -o /backend/backend.so

FROM heroiclabs/nakama:3.22.0

COPY --from=builder /backend/backend.so /nakama/data/modules
COPY local.yml /nakama/data/local.yml

ENTRYPOINT ["/bin/sh", "-c"]

CMD echo "DATABASE_URL=$DATABASE_URL" && \
    /nakama/nakama \
    --name nakama1 \
    --database.address "$DATABASE_URL" \
    --logger.level DEBUG
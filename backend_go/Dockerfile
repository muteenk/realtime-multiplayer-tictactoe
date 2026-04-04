FROM heroiclabs/nakama-pluginbuilder:3.22.0 AS builder

WORKDIR /backend
COPY . .
RUN go mod download
RUN go build --trimpath --buildmode=plugin -o /backend/backend.so

FROM heroiclabs/nakama:3.22.0
COPY --from=builder /backend/backend.so /nakama/data/modules
COPY local.yml /nakama/data/local.yml

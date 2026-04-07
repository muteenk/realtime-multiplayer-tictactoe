FROM heroiclabs/nakama:3.22.0

COPY --from=builder /backend/backend.so /nakama/data/modules
COPY local.yml /nakama/data/local.yml

ENTRYPOINT ["/bin/sh", "-ec"]

CMD echo "Starting Nakama..." && \
    echo "DB: $DATABASE_URL" && \
    /nakama/nakama \
      --name nakama1 \
      --database.address "$DATABASE_URL" \
      --config /nakama/data/local.yml \
      --logger.level DEBUG
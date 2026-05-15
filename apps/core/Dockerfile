FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /blackbox-core ./main.go

FROM gcr.io/distroless/static-debian12
COPY --from=builder /blackbox-core /blackbox-core
EXPOSE 8080 9090
ENTRYPOINT ["/blackbox-core"]

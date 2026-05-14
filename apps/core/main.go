package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"blackbox.io/core/internal/api"
	"blackbox.io/core/internal/storage"
	"blackbox.io/core/internal/worker"
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	db, err := storage.Connect(ctx, os.Getenv("MONGODB_URI"))
	if err != nil {
		log.Fatalf("storage: %v", err)
	}

	pool := worker.NewPool(db)
	pool.Start(ctx)

	srv := api.NewServer(db, pool)
	if err := srv.Run(ctx); err != nil {
		log.Fatalf("server: %v", err)
	}
}

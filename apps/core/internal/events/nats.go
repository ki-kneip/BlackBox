package events

import (
	"fmt"
	"os"

	"github.com/nats-io/nats.go"
)

const (
	SubjectLogsPrefix  = "blackbox.logs."
	SubjectTriggerFire = "blackbox.triggers.fire"
)

type Client struct {
	conn *nats.Conn
}

func Connect() (*Client, error) {
	url := os.Getenv("MESSAGE_BROKER_URL")
	if url == "" {
		url = nats.DefaultURL
	}
	conn, err := nats.Connect(url)
	if err != nil {
		return nil, fmt.Errorf("nats connect: %w", err)
	}
	return &Client{conn: conn}, nil
}

func (c *Client) Publish(subject string, data []byte) error {
	return c.conn.Publish(subject, data)
}

func (c *Client) Subscribe(subject string, handler nats.MsgHandler) (*nats.Subscription, error) {
	return c.conn.Subscribe(subject, handler)
}

func (c *Client) Close() {
	c.conn.Drain()
}

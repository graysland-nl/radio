# Icecast2 Server on Replit

This is a vanilla Icecast2 server running on Replit's free tier. No credit card or paid plan required.

## Configuration

The server uses the following default passwords (you can change these by setting environment variables in Replit):

- Source Password: `hackme`
- Relay Password: `hackme`
- Admin Password: `hackme`

## How to Use

1. Fork this repository to your Replit account
2. Click "Run" to start the server
3. The server will be available at your Replit URL (e.g., `https://your-repl-name.your-username.repl.co`)

## Connecting to the Server

You can connect to the server using any Icecast-compatible source client (like Darkice, Butt, or Mixxx) with the following settings:

- Server: Your Replit URL
- Port: 8000 (or the port specified in your Replit environment)
- Mount Point: /stream
- Password: The source password you configured

## Security Note

The default passwords are set to "hackme". It's highly recommended to change these passwords by setting the following environment variables in your Replit:

- `SOURCE_PASSWORD`
- `RELAY_PASSWORD`
- `ADMIN_PASSWORD`

## Logs

Logs are stored in the `logs` directory and can be accessed through the Replit file explorer. 
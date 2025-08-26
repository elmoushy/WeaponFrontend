# WPC | WeaponpowerCloud App-vue-app

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## WebSocket Management

The application includes WebSocket functionality for real-time notifications. You can easily enable or disable this feature:

### Check WebSocket Status
```sh
npm run ws:status
```

### Enable WebSocket
```sh
npm run ws:enable
```

### Disable WebSocket
```sh
npm run ws:disable
```

### Toggle WebSocket (switch between enabled/disabled)
```sh
npm run ws:toggle
```

**Note:** After changing WebSocket settings, you need to restart your development server for the changes to take effect.

The WebSocket feature is controlled by environment variables in your `.env` file:
- `VITE_WEBSOCKET_ENABLED=true|false` - Main feature flag
- `VITE_WS_BASE_URL` - WebSocket server URL
- `VITE_NOTIFICATIONS_ENDPOINT` - Notifications endpoint path

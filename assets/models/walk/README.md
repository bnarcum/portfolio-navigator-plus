# Walkthrough 3D models (optional)

Drop Cisco-licensed `.glb` files here to override the built-in procedural device meshes in Design Studio walk mode.

## Naming

The loader checks paths in this order:

1. `{stencilId}.glb` — e.g. `c9300-access.glb`, `room-kit-eq.glb`
2. `{template}.glb` — e.g. `switch.glb`, `codec.glb`, `display.glb`

Template keys: `switch`, `switch-chassis`, `router`, `firewall`, `nexus`, `server`, `ap`, `codec`, `camera`, `touch`, `display`, `ceiling-mic`, `table-mic`, `cloud`, `user`, `rack`, `table`, `generic`.

If no file is found, procedural geometry is used automatically.

## Requirements

- glTF 2.0 binary (`.glb`)
- Models should be oriented with the device sitting on the ground plane (Y up)
- Target height roughly 1–2 world units; the runtime scales to fit
- Use only assets you are licensed to redistribute or host in your deployment

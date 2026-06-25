/**
 * Design Studio v3 — Reference architectures & room floor plans
 */
(function () {
  "use strict";

  const ST = id => id; // stencil ids reference design-studio-stencils.js

  const NETWORK_TEMPLATES = {
    campus3tierRedundant: {
      label: "Campus 3-Tier (Redundant)",
      category: "Campus",
      tags: ["enterprise", "hospital", "hq"],
      cvd: "Campus LAN — three-tier with redundant core",
      nodes: [
        { stencilId: "c9500-core", label: "Core-A", x: 280, y: 180 },
        { stencilId: "c9500-core-2", label: "Core-B", x: 280, y: 280 },
        { stencilId: "c9400-dist", label: "Dist-MDF", x: 480, y: 180 },
        { stencilId: "c9400-dist", label: "Dist-IDF-1", x: 480, y: 280 },
        { stencilId: "c9300-access", label: "Access-MDF-1", x: 680, y: 160 },
        { stencilId: "c9300-access", label: "Access-MDF-2", x: 680, y: 220 },
        { stencilId: "c9300-access", label: "Access-IDF-1", x: 680, y: 300 },
        { stencilId: "cw9179f", label: "AP-MDF", x: 860, y: 160 },
        { stencilId: "cw9179f", label: "AP-IDF", x: 860, y: 300 },
        { stencilId: "c8200-sdwan", label: "SD-WAN Edge", x: 80, y: 230 },
        { stencilId: "fpr-2130", label: "DC FW Perimeter", x: 480, y: 80 },
        { stencilId: "ise-pan", label: "ISE PAN", x: 680, y: 80 },
        { stencilId: "ise-psn", label: "ISE PSN", x: 780, y: 80 },
        { stencilId: "cat-center", label: "Catalyst Center", x: 860, y: 80 },
        { stencilId: "internet", label: "Internet DIA", x: 80, y: 80 }
      ],
      links: [
        { fi: 0, ti: 1, media: "fiber-sm", label: "Core VPC", fromPort: "Te1/1/1", toPort: "Te1/1/1" },
        { fi: 0, ti: 2, media: "fiber-sm", label: "Core-Dist-MDF", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 1, ti: 3, media: "fiber-sm", label: "Core-Dist-IDF", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 2, ti: 4, media: "fiber-mm", label: "Dist-Acc1", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 2, ti: 5, media: "fiber-mm", label: "Dist-Acc2", fromPort: "Te1/1/2", toPort: "Te1/1/2" },
        { fi: 3, ti: 6, media: "fiber-mm", label: "Dist-Acc-IDF", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 4, ti: 7, media: "cat6", label: "PoE-AP", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 6, ti: 8, media: "cat6", label: "PoE-AP", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 9, ti: 0, media: "fiber-sm", label: "WAN-Core", fromPort: "Te0/1/0", toPort: "Te1/1/1" },
        { fi: 14, ti: 9, media: "fiber-sm", label: "DIA-WAN", fromPort: "Port1", toPort: "Gi0/0/0" },
        { fi: 10, ti: 2, media: "fiber-sm", label: "FW-Dist", fromPort: "inside", toPort: "Te1/1/2" },
        { fi: 11, ti: 2, media: "cat6a", label: "ISE-RADIUS", fromPort: "Port1", toPort: "Gi1/0/48" },
        { fi: 12, ti: 4, media: "cat6a", label: "ISE-Acc", fromPort: "Port1", toPort: "Gi1/0/24" },
        { fi: 13, ti: 4, media: "cat6a", label: "Mgmt", fromPort: "Port1", toPort: "Gi1/0/24" }
      ]
    },
    campusCollapsed: {
      label: "Campus Collapsed Core",
      category: "Campus",
      tags: ["smb", "500-users"],
      nodes: [
        { stencilId: "c9500-core", label: "Collapsed Core", x: 300, y: 220 },
        { stencilId: "c9200-access", label: "Access-1", x: 520, y: 180 },
        { stencilId: "c9200-access", label: "Access-2", x: 520, y: 280 },
        { stencilId: "cw9179f", label: "AP-1", x: 700, y: 180 },
        { stencilId: "cw9179f", label: "AP-2", x: 700, y: 280 },
        { stencilId: "fpr-1120", label: "Perimeter FW", x: 300, y: 80 },
        { stencilId: "cat-center", label: "Catalyst Center", x: 520, y: 80 }
      ],
      links: [
        { fi: 0, ti: 1, media: "fiber-sm", label: "Core-Acc1", fromPort: "Te1/1/1", toPort: "Te1/1/1" },
        { fi: 0, ti: 2, media: "fiber-sm", label: "Core-Acc2", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 1, ti: 3, media: "cat6", label: "PoE", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 2, ti: 4, media: "cat6", label: "PoE", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 5, ti: 0, media: "fiber-sm", label: "FW-Core", fromPort: "inside", toPort: "Te1/1/1" },
        { fi: 6, ti: 0, media: "cat6a", label: "Mgmt", fromPort: "Port1", toPort: "Mgmt" }
      ]
    },
    sdwanFull: {
      label: "SD-WAN Full Stack",
      category: "WAN",
      tags: ["sd-wan", "multi-site"],
      nodes: [
        { stencilId: "vmanage", label: "vManage", x: 400, y: 60 },
        { stencilId: "cat-center", label: "Cat Center", x: 520, y: 60 },
        { stencilId: "c8200-sdwan", label: "HQ Edge-A", x: 200, y: 200 },
        { stencilId: "c8200-sdwan-2", label: "HQ Edge-B", x: 200, y: 300 },
        { stencilId: "c9500-core", label: "HQ Core", x: 400, y: 250 },
        { stencilId: "fpr-2130", label: "HQ FW", x: 400, y: 140 },
        { stencilId: "internet", label: "Internet", x: 60, y: 200 },
        { stencilId: "mpls", label: "MPLS", x: 60, y: 300 },
        { stencilId: "c8200-sdwan", label: "Branch-1", x: 640, y: 200 },
        { stencilId: "fpr-1120", label: "Branch FW", x: 640, y: 300 },
        { stencilId: "c9200-access", label: "Branch SW", x: 820, y: 250 },
        { stencilId: "cw9179f", label: "Branch AP", x: 980, y: 250 }
      ],
      links: [
        { fi: 6, ti: 2, media: "fiber-sm", label: "DIA-A", fromPort: "Port1", toPort: "Gi0/0/0" },
        { fi: 7, ti: 3, media: "fiber-sm", label: "MPLS-B", fromPort: "Port1", toPort: "Gi0/0/0" },
        { fi: 2, ti: 4, media: "fiber-sm", label: "Edge-Core", fromPort: "Te0/1/0", toPort: "Te1/1/1" },
        { fi: 3, ti: 4, media: "fiber-sm", label: "Edge-Core-B", fromPort: "Te0/1/0", toPort: "Te1/1/2" },
        { fi: 5, ti: 4, media: "fiber-sm", label: "FW-Core", fromPort: "inside", toPort: "Te1/1/1" },
        { fi: 0, ti: 2, media: "cat6a", label: "vManage", fromPort: "Port1", toPort: "Gi0/0/1" },
        { fi: 8, ti: 9, media: "fiber-sm", label: "Branch-WAN", fromPort: "Te0/1/0", toPort: "outside" },
        { fi: 9, ti: 10, media: "cat6a", label: "Branch-LAN", fromPort: "inside", toPort: "Te1/1/1" },
        { fi: 10, ti: 11, media: "cat6", label: "PoE", fromPort: "Gi1/0/1", toPort: "ETH0" }
      ]
    },
    branchStandard: {
      label: "Branch Office Standard",
      category: "Branch",
      tags: ["branch", "retail"],
      nodes: [
        { stencilId: "c8200-sdwan", label: "Branch Edge", x: 200, y: 220 },
        { stencilId: "fpr-1120", label: "Branch FW", x: 380, y: 220 },
        { stencilId: "c9200-access", label: "Access SW", x: 560, y: 220 },
        { stencilId: "cw9179f", label: "Office AP", x: 740, y: 180 },
        { stencilId: "cw9179f", label: "Guest AP", x: 740, y: 280 },
        { stencilId: "internet", label: "Broadband", x: 60, y: 220 }
      ],
      links: [
        { fi: 5, ti: 0, media: "cat6a", label: "WAN", fromPort: "Port1", toPort: "Gi0/0/0" },
        { fi: 0, ti: 1, media: "fiber-sm", label: "Edge-FW", fromPort: "Te0/1/0", toPort: "outside" },
        { fi: 1, ti: 2, media: "cat6a", label: "FW-SW", fromPort: "inside", toPort: "Te1/1/1" },
        { fi: 2, ti: 3, media: "cat6", label: "PoE Corp", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 2, ti: 4, media: "cat6", label: "PoE Guest", fromPort: "Gi1/0/2", toPort: "ETH0" }
      ]
    },
    retailMeraki: {
      label: "Retail Store (Meraki)",
      category: "Branch",
      tags: ["retail", "meraki"],
      nodes: [
        { stencilId: "mx85", label: "Store MX85", x: 240, y: 220 },
        { stencilId: "ms250", label: "Store Switch", x: 420, y: 220 },
        { stencilId: "mr57", label: "Sales Floor AP", x: 600, y: 180 },
        { stencilId: "mr57", label: "Backroom AP", x: 600, y: 280 },
        { stencilId: "internet", label: "Store Internet", x: 80, y: 220 }
      ],
      links: [
        { fi: 4, ti: 0, media: "cat6a", label: "WAN", fromPort: "Port1", toPort: "Gi0/0/0" },
        { fi: 0, ti: 1, media: "cat6a", label: "MX-SW", fromPort: "Te0/1/0", toPort: "Te1/1/1" },
        { fi: 1, ti: 2, media: "cat6", label: "PoE", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 1, ti: 3, media: "cat6", label: "PoE", fromPort: "Gi1/0/2", toPort: "ETH0" }
      ]
    },
    dcSpineLeaf: {
      label: "DC Spine-Leaf (VXLAN)",
      category: "Data Center",
      tags: ["dc", "spine-leaf"],
      nodes: [
        { stencilId: "n9k-spine", label: "Spine-1", x: 400, y: 120 },
        { stencilId: "n9k-spine", label: "Spine-2", x: 400, y: 220 },
        { stencilId: "n9k-leaf", label: "Leaf-1", x: 200, y: 320 },
        { stencilId: "n9k-leaf", label: "Leaf-2", x: 400, y: 320 },
        { stencilId: "n9k-leaf", label: "Leaf-3", x: 600, y: 320 },
        { stencilId: "ucs-x", label: "UCS Server-1", x: 200, y: 440 },
        { stencilId: "ucs-x", label: "UCS Server-2", x: 400, y: 440 },
        { stencilId: "fpr-2130", label: "DC Border FW", x: 600, y: 120 },
        { stencilId: "apic", label: "APIC (3-node)", x: 200, y: 120 }
      ],
      links: [
        { fi: 0, ti: 2, media: "fiber-40g", label: "Spine-Leaf", fromPort: "Eth1/1", toPort: "Eth1/33" },
        { fi: 0, ti: 3, media: "fiber-40g", label: "Spine-Leaf", fromPort: "Eth1/32", toPort: "Eth1/33" },
        { fi: 1, ti: 3, media: "fiber-40g", label: "Spine-Leaf", fromPort: "Eth1/1", toPort: "Eth1/64" },
        { fi: 1, ti: 4, media: "fiber-40g", label: "Spine-Leaf", fromPort: "Eth1/32", toPort: "Eth1/64" },
        { fi: 2, ti: 5, media: "fiber-sm", label: "Compute", fromPort: "Eth1/1", toPort: "Port1" },
        { fi: 3, ti: 6, media: "fiber-sm", label: "Compute", fromPort: "Eth1/1", toPort: "Port1" },
        { fi: 7, ti: 0, media: "fiber-sm", label: "Border", fromPort: "inside", toPort: "Eth1/33" },
        { fi: 8, ti: 2, media: "cat6a", label: "APIC", fromPort: "Port1", toPort: "Eth1/64" }
      ]
    },
    dcAciPod: {
      label: "ACI Pod",
      category: "Data Center",
      tags: ["aci", "dc"],
      nodes: [
        { stencilId: "apic", label: "APIC Cluster", x: 300, y: 80 },
        { stencilId: "n9k-spine", label: "Spine-A", x: 300, y: 200 },
        { stencilId: "n9k-spine", label: "Spine-B", x: 420, y: 200 },
        { stencilId: "n9k-leaf", label: "Leaf-A", x: 240, y: 320 },
        { stencilId: "n9k-leaf", label: "Leaf-B", x: 360, y: 320 },
        { stencilId: "n9k-leaf", label: "Service Leaf", x: 480, y: 320 },
        { stencilId: "ucs-x", label: "UCS Compute", x: 300, y: 440 },
        { stencilId: "fpr-2130", label: "L3Out FW", x: 480, y: 200 }
      ],
      links: [
        { fi: 1, ti: 3, media: "fiber-40g", label: "Spine-Leaf", fromPort: "Eth1/1", toPort: "Eth1/33" },
        { fi: 2, ti: 4, media: "fiber-40g", label: "Spine-Leaf", fromPort: "Eth1/1", toPort: "Eth1/33" },
        { fi: 1, ti: 5, media: "fiber-40g", label: "Svc Leaf", fromPort: "Eth1/32", toPort: "Eth1/33" },
        { fi: 3, ti: 6, media: "fiber-sm", label: "EPG", fromPort: "Eth1/1", toPort: "Port1" },
        { fi: 7, ti: 5, media: "fiber-sm", label: "L3Out", fromPort: "inside", toPort: "Eth1/64" },
        { fi: 0, ti: 3, media: "cat6a", label: "APIC", fromPort: "Port1", toPort: "Eth1/64" }
      ]
    },
    k12District: {
      label: "K-12 District Hub",
      category: "Vertical",
      tags: ["k12", "education"],
      nodes: [
        { stencilId: "c9500-core", label: "District Core", x: 320, y: 220 },
        { stencilId: "c9400-dist", label: "HS Dist", x: 520, y: 180 },
        { stencilId: "c9400-dist", label: "MS Dist", x: 520, y: 280 },
        { stencilId: "c9200-access", label: "HS Access", x: 720, y: 180 },
        { stencilId: "c9200-access", label: "MS Access", x: 720, y: 280 },
        { stencilId: "cw9179f", label: "Gym AP", x: 900, y: 160 },
        { stencilId: "cw9179f", label: "Classroom AP", x: 900, y: 280 },
        { stencilId: "ise-psn", label: "ISE", x: 320, y: 80 },
        { stencilId: "umbrella-va", label: "Umbrella", x: 520, y: 80 },
        { stencilId: "c8200-sdwan", label: "SD-WAN Hub", x: 120, y: 220 }
      ],
      links: [
        { fi: 9, ti: 0, media: "fiber-sm", label: "WAN-Core", fromPort: "Te0/1/0", toPort: "Te1/1/1" },
        { fi: 0, ti: 1, media: "fiber-sm", label: "Core-HS", fromPort: "Te1/1/1", toPort: "Te1/1/1" },
        { fi: 0, ti: 2, media: "fiber-sm", label: "Core-MS", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 1, ti: 3, media: "fiber-mm", label: "Dist-Acc", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 2, ti: 4, media: "fiber-mm", label: "Dist-Acc", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 3, ti: 5, media: "cat6", label: "PoE Gym", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 4, ti: 6, media: "cat6", label: "PoE Class", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 7, ti: 0, media: "cat6a", label: "ISE", fromPort: "Port1", toPort: "Gi1/0/24" }
      ]
    },
    healthcareCampus: {
      label: "Healthcare Campus",
      category: "Vertical",
      tags: ["healthcare", "hospital"],
      nodes: [
        { stencilId: "c9500-core", label: "Clinical Core", x: 300, y: 220 },
        { stencilId: "c9500-core-2", label: "Clinical Core-B", x: 300, y: 320 },
        { stencilId: "fpr-2130", label: "Seg FW", x: 300, y: 100 },
        { stencilId: "ise-pan", label: "ISE PAN", x: 500, y: 100 },
        { stencilId: "ise-psn", label: "ISE PSN", x: 600, y: 100 },
        { stencilId: "c9300-access", label: "Clinical Access", x: 520, y: 220 },
        { stencilId: "c9300-access", label: "Guest Access", x: 520, y: 320 },
        { stencilId: "cw9179f", label: "Clinical AP", x: 720, y: 220 },
        { stencilId: "cat-center", label: "Catalyst Center", x: 720, y: 100 }
      ],
      links: [
        { fi: 0, ti: 1, media: "fiber-sm", label: "Core VPC", fromPort: "Te1/1/1", toPort: "Te1/1/1" },
        { fi: 2, ti: 0, media: "fiber-sm", label: "FW-Core", fromPort: "inside", toPort: "Te1/1/1" },
        { fi: 0, ti: 5, media: "fiber-mm", label: "Clinical", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 1, ti: 6, media: "fiber-mm", label: "Guest", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 5, ti: 7, media: "cat6", label: "PoE", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 3, ti: 5, media: "cat6a", label: "NAC", fromPort: "Port1", toPort: "Gi1/0/24" },
        { fi: 8, ti: 5, media: "cat6a", label: "Mgmt", fromPort: "Port1", toPort: "Gi1/0/24" }
      ]
    },
    zeroTrustEdge: {
      label: "Zero Trust Edge (SASE)",
      category: "Security",
      tags: ["zero-trust", "sase"],
      nodes: [
        { stencilId: "c8200-sdwan", label: "SD-WAN Edge", x: 200, y: 220 },
        { stencilId: "fpr-2130", label: "Secure FW", x: 380, y: 220 },
        { stencilId: "umbrella-va", label: "Umbrella SWG", x: 380, y: 100 },
        { stencilId: "ise-psn", label: "ISE PSN", x: 560, y: 100 },
        { stencilId: "c9300-access", label: "Access", x: 560, y: 320 },
        { stencilId: "users-vlan", label: "Users", x: 740, y: 320 },
        { stencilId: "internet", label: "Internet", x: 60, y: 220 }
      ],
      links: [
        { fi: 6, ti: 0, media: "fiber-sm", label: "WAN", fromPort: "Port1", toPort: "Gi0/0/0" },
        { fi: 0, ti: 1, media: "fiber-sm", label: "Edge-FW", fromPort: "Te0/1/0", toPort: "outside" },
        { fi: 1, ti: 4, media: "cat6a", label: "FW-Access", fromPort: "inside", toPort: "Te1/1/1" },
        { fi: 2, ti: 1, media: "cat6a", label: "SWG", fromPort: "Port1", toPort: "dmz" },
        { fi: 3, ti: 4, media: "cat6a", label: "NAC", fromPort: "Port1", toPort: "Gi1/0/24" },
        { fi: 4, ti: 5, media: "cat6", label: "User VLAN", fromPort: "Gi1/0/1", toPort: "Port1" }
      ]
    },
    hyperflexEdge: {
      label: "HyperFlex Edge + ToR",
      category: "Data Center",
      tags: ["hyperflex", "edge-dc"],
      nodes: [
        { stencilId: "n9k-leaf", label: "ToR-1", x: 280, y: 200 },
        { stencilId: "n9k-leaf", label: "ToR-2", x: 280, y: 300 },
        { stencilId: "ucs-x", label: "HX Node-1", x: 480, y: 200 },
        { stencilId: "ucs-x", label: "HX Node-2", x: 480, y: 300 },
        { stencilId: "ucs-x", label: "HX Node-3", x: 480, y: 400 },
        { stencilId: "fpr-1120", label: "Edge FW", x: 280, y: 80 },
        { stencilId: "cat-center", label: "Intersight", x: 480, y: 80, stencilId: "cat-center" }
      ],
      links: [
        { fi: 0, ti: 1, media: "fiber-sm", label: "ToR VPC", fromPort: "Eth1/32", toPort: "Eth1/32" },
        { fi: 0, ti: 2, media: "fiber-sm", label: "Compute", fromPort: "Eth1/1", toPort: "Port1" },
        { fi: 1, ti: 3, media: "fiber-sm", label: "Compute", fromPort: "Eth1/1", toPort: "Port1" },
        { fi: 1, ti: 4, media: "fiber-sm", label: "Compute", fromPort: "Eth1/2", toPort: "Port1" },
        { fi: 5, ti: 0, media: "fiber-sm", label: "FW-ToR", fromPort: "inside", toPort: "Eth1/33" }
      ]
    }
  };

  const ROOM_TEMPLATES = {
    huddle: {
      name: "Huddle (4–6 seats)",
      category: "Small",
      w: 440, h: 360,
      zones: { display: { x: 180, y: 28, w: 200, h: 100 }, table: { x: 100, y: 150, w: 200, h: 110 }, rack: { x: 24, y: 280, w: 160, h: 72 } },
      items: [
        { stencilId: "room-bar", zone: "display", relX: 0.5, relY: 0.35, label: "Room Bar" },
        { stencilId: "display-75", zone: "display", relX: 0.5, relY: 0.78, label: "Display" },
        { stencilId: "conf-table-8", zone: "table", relX: 0.5, relY: 0.55, label: "Table" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.35, relY: 0.55, label: "PoE Switch" }
      ],
      links: [
        { fi: 3, ti: 0, media: "cat6", label: "PoE-Bar", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 0, ti: 1, media: "hdmi", label: "Video", fromPort: "HDMI1", toPort: "HDMI1" }
      ]
    },
    conference: {
      name: "Conference (8–12 seats)",
      category: "Medium",
      w: 560, h: 420,
      zones: {
        display: { x: 150, y: 20, w: 280, h: 110 },
        ceiling: { x: 80, y: 128, w: 340, h: 32 },
        table: { x: 80, y: 168, w: 340, h: 150 },
        rack: { x: 24, y: 328, w: 280, h: 88 }
      },
      items: [
        { stencilId: "quad-cam", zone: "display", relX: 0.5, relY: 0.22, label: "Quad Cam" },
        { stencilId: "display-75", zone: "display", relX: 0.5, relY: 0.72, label: "Primary Display" },
        { stencilId: "room-kit-eq", zone: "rack", relX: 0.18, relY: 0.38, label: "Room Kit EQ" },
        { stencilId: "touch-10", zone: "rack", relX: 0.42, relY: 0.38, label: "Touch 10" },
        { stencilId: "amp-280", zone: "rack", relX: 0.66, relY: 0.38, label: "Amp 280" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.5, relY: 0.82, label: "Collab Switch" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.62, label: "Conference Table" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.32, relY: 0.5, label: "Ceiling Mic L" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.68, relY: 0.5, label: "Ceiling Mic R" }
      ],
      links: [
        { fi: 5, ti: 2, media: "cat6", label: "PoE-Codec", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 5, ti: 3, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 5, ti: 7, media: "cat6", label: "PoE-Mic-L", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 5, ti: 8, media: "cat6", label: "PoE-Mic-R", fromPort: "Gi1/0/4", toPort: "ETH" },
        { fi: 2, ti: 1, media: "hdmi", label: "Primary Video", fromPort: "HDMI1", toPort: "HDMI1" },
        { fi: 2, ti: 0, media: "hdmi", label: "Camera", fromPort: "HDMI2", toPort: "HDMI" },
        { fi: 5, ti: 4, media: "cat6", label: "Amp-Control", fromPort: "Gi1/0/5", toPort: "LAN" }
      ]
    },
    boardroom: {
      name: "Boardroom (14–20 seats)",
      category: "Large",
      w: 600, h: 440,
      zones: {
        display: { x: 160, y: 20, w: 320, h: 110 },
        table: { x: 80, y: 140, w: 400, h: 180 },
        rack: { x: 24, y: 328, w: 300, h: 96 }
      },
      items: [
        { stencilId: "board-pro", zone: "display", relX: 0.35, relY: 0.62, label: "Board Pro" },
        { stencilId: "display-86", zone: "display", relX: 0.78, relY: 0.62, label: "Aux Display" },
        { stencilId: "quad-cam", zone: "display", relX: 0.35, relY: 0.2, label: "Primary Cam" },
        { stencilId: "touch-10", zone: "rack", relX: 0.2, relY: 0.4, label: "Touch 10" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.5, relY: 0.4, label: "Collab Switch" },
        { stencilId: "amp-280", zone: "rack", relX: 0.8, relY: 0.4, label: "Amp" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.55, label: "Board Table" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.3, relY: 0.15, label: "Mic-1" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.5, relY: 0.1, label: "Mic-2" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.7, relY: 0.15, label: "Mic-3" }
      ],
      links: [
        { fi: 4, ti: 3, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 4, ti: 7, media: "cat6", label: "PoE-Mic1", fromPort: "Gi1/0/2", toPort: "ETH" },
        { fi: 4, ti: 8, media: "cat6", label: "PoE-Mic2", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 4, ti: 9, media: "cat6", label: "PoE-Mic3", fromPort: "Gi1/0/4", toPort: "ETH" },
        { fi: 4, ti: 5, media: "cat6", label: "Amp-Control", fromPort: "Gi1/0/5", toPort: "LAN" },
        { fi: 0, ti: 1, media: "hdmi", label: "Aux Video", fromPort: "HDMI1", toPort: "HDMI1" },
        { fi: 0, ti: 2, media: "hdmi", label: "Camera", fromPort: "HDMI2", toPort: "HDMI" }
      ]
    },
    training: {
      name: "Training Room",
      category: "Medium",
      w: 560, h: 420,
      zones: { display: { x: 200, y: 30, w: 220, h: 90 }, table: { x: 60, y: 140, w: 440, h: 200 }, rack: { x: 30, y: 350, w: 160, h: 70 } },
      items: [
        { stencilId: "board-pro", zone: "display", relX: 0.5, relY: 0.5, label: "Board Pro 75" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.35, relY: 0.55, label: "Collab Switch" },
        { stencilId: "touch-10", zone: "rack", relX: 0.75, relY: 0.55, label: "Touch 10" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.25, relY: 0.2, label: "Mic-1" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.75, relY: 0.2, label: "Mic-2" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.65, label: "Training Tables" }
      ],
      links: [
        { fi: 1, ti: 2, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 1, ti: 3, media: "cat6", label: "Mic-1", fromPort: "Gi1/0/2", toPort: "ETH" },
        { fi: 1, ti: 4, media: "cat6", label: "Mic-2", fromPort: "Gi1/0/3", toPort: "ETH" }
      ]
    },
    executive: {
      name: "Executive Office",
      category: "Small",
      w: 360, h: 300,
      zones: { desk: { x: 80, y: 120, w: 200, h: 120 }, wall: { x: 80, y: 30, w: 200, h: 70 } },
      items: [
        { stencilId: "desk-pro", zone: "desk", relX: 0.5, relY: 0.5, label: "Desk Pro" },
        { stencilId: "display-75", zone: "wall", relX: 0.5, relY: 0.5, label: "Wall Display" },
        { stencilId: "c9200-collab", zone: "desk", relX: 0.15, relY: 0.85, label: "PoE SW" }
      ],
      links: [
        { fi: 2, ti: 0, media: "cat6", label: "PoE", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 0, ti: 1, media: "hdmi", label: "Video", fromPort: "HDMI1", toPort: "HDMI1" }
      ]
    },
    teamsRoom: {
      name: "Microsoft Teams Room",
      category: "Medium",
      w: 520, h: 400,
      zones: {
        display: { x: 160, y: 30, w: 220, h: 90 },
        table: { x: 100, y: 140, w: 300, h: 130 },
        rack: { x: 24, y: 288, w: 260, h: 96 }
      },
      items: [
        { stencilId: "display-75", zone: "display", relX: 0.5, relY: 0.55, label: "Teams Display" },
        { stencilId: "room-kit-eq", zone: "rack", relX: 0.22, relY: 0.38, label: "MTR Codec" },
        { stencilId: "touch-10", zone: "rack", relX: 0.5, relY: 0.38, label: "Teams Panel" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.78, relY: 0.38, label: "Switch" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.5, relY: 0.15, label: "Teams Mic" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.62, label: "Table" }
      ],
      links: [
        { fi: 3, ti: 1, media: "cat6", label: "PoE-Codec", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 3, ti: 2, media: "cat6", label: "PoE-Panel", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 3, ti: 4, media: "cat6", label: "PoE-Mic", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 1, ti: 0, media: "hdmi", label: "Teams Video", fromPort: "HDMI1", toPort: "HDMI1" }
      ]
    },
    zoomRoom: {
      name: "Zoom Room",
      category: "Medium",
      w: 520, h: 400,
      zones: {
        display: { x: 160, y: 30, w: 220, h: 100 },
        table: { x: 100, y: 140, w: 300, h: 130 },
        rack: { x: 24, y: 288, w: 220, h: 96 }
      },
      items: [
        { stencilId: "display-75", zone: "display", relX: 0.5, relY: 0.65, label: "Zoom Display" },
        { stencilId: "room-bar", zone: "display", relX: 0.5, relY: 0.22, label: "Zoom Bar" },
        { stencilId: "touch-10", zone: "rack", relX: 0.35, relY: 0.45, label: "Zoom Controller" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.72, relY: 0.45, label: "Switch" },
        { stencilId: "table-mic", zone: "table", relX: 0.5, relY: 0.4, label: "Table Mic" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.65, label: "Table" }
      ],
      links: [
        { fi: 3, ti: 1, media: "cat6", label: "PoE-Bar", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 3, ti: 2, media: "cat6", label: "PoE-Controller", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 3, ti: 4, media: "cat6", label: "PoE-Mic", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 1, ti: 0, media: "hdmi", label: "Zoom Video", fromPort: "HDMI1", toPort: "HDMI1" }
      ]
    },
    divisible: {
      name: "Divisible All-Hands",
      category: "Large",
      w: 640, h: 460,
      zones: { display: { x: 120, y: 20, w: 400, h: 100 }, table: { x: 60, y: 140, w: 520, h: 200 }, rack: { x: 30, y: 360, w: 110, h: 80 } },
      items: [
        { stencilId: "display-86", zone: "display", relX: 0.25, relY: 0.5, label: "Display-A" },
        { stencilId: "display-86", zone: "display", relX: 0.75, relY: 0.5, label: "Display-B" },
        { stencilId: "room-kit-pro", zone: "rack", relX: 0.35, relY: 0.3, label: "Codec-A" },
        { stencilId: "room-kit-pro", zone: "rack", relX: 0.65, relY: 0.3, label: "Codec-B" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.5, relY: 0.75, label: "Collab SW" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.25, relY: 0.15, label: "Mic-A" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.75, relY: 0.15, label: "Mic-B" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.55, label: "Combined Table" }
      ],
      links: [
        { fi: 4, ti: 2, media: "cat6", label: "PoE-A", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 4, ti: 3, media: "cat6", label: "PoE-B", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 4, ti: 5, media: "cat6", label: "Mic-A", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 4, ti: 6, media: "cat6", label: "Mic-B", fromPort: "Gi1/0/4", toPort: "ETH" },
        { fi: 2, ti: 0, media: "hdmi", label: "Video-A", fromPort: "HDMI1", toPort: "HDMI1" },
        { fi: 3, ti: 1, media: "hdmi", label: "Video-B", fromPort: "HDMI1", toPort: "HDMI1" }
      ]
    }
  };

  function zonePos(zone, relX, relY, w, h) {
    const nw = w || 76, nh = h || 46;
    return { x: zone.x + relX * zone.w - nw / 2, y: zone.y + relY * zone.h - nh / 2 };
  }

  function applyNetworkTemplate(design, key, offsetX, offsetY, STENCILS) {
    const tpl = NETWORK_TEMPLATES[key];
    if (!tpl) return false;
    const ox = offsetX || 0, oy = offsetY || 0;
    const idMap = tpl.nodes.map(n => {
      const sid = n.stencilId;
      const def = STENCILS?.getDef?.(sid, "network");
      const id = "ds-" + Math.random().toString(36).slice(2, 10);
      design.nodes.push({
        id, stencilId: sid, label: n.label, pid: def?.pid || n.pid,
        layer: def?.layer || n.layer || "access", x: ox + n.x, y: oy + n.y,
        canvas: "network", qty: 1, w: def?.w || 76, h: def?.h || 46
      });
      return id;
    });
    tpl.links.forEach((l, i) => {
      design.links.push({
        id: "ds-" + Math.random().toString(36).slice(2, 10),
        from: idMap[l.fi], to: idMap[l.ti], media: l.media,
        label: l.label || tpl.label + "-" + (i + 1), length: l.length || "5m",
        fromPort: l.fromPort || "", toPort: l.toPort || ""
      });
    });
    return tpl;
  }

  function applyRoomTemplate(design, key, roomId, roomName, ox, oy, nodesArr, linksArr, STENCILS) {
    const tpl = ROOM_TEMPLATES[key];
    if (!tpl) return false;
    const idxMap = [];
    tpl.items.forEach(item => {
      const zone = tpl.zones[item.zone];
      const def = STENCILS?.getDef?.(item.stencilId, "room");
      const pos = zone ? zonePos(zone, item.relX, item.relY, def?.w, def?.h) : { x: item.x || 0, y: item.y || 0 };
      const id = "ds-" + Math.random().toString(36).slice(2, 10);
      idxMap.push(id);
      nodesArr.push({
        id, stencilId: item.stencilId, label: item.label,
        pid: def?.pid, x: ox + pos.x, y: oy + pos.y, canvas: "room", roomId,
        w: def?.w || 76, h: def?.h || 46, qty: 1
      });
    });
    tpl.links.forEach((l, i) => {
      linksArr.push({
        id: "ds-" + Math.random().toString(36).slice(2, 10),
        from: idxMap[l.fi], to: idxMap[l.ti], media: l.media,
        label: l.label || "Room-" + (i + 1), length: "5m",
        fromPort: l.fromPort || "", toPort: l.toPort || ""
      });
    });
    return tpl;
  }

  window.__DS_TEMPLATES = {
    NETWORK_TEMPLATES, ROOM_TEMPLATES,
    applyNetworkTemplate, applyRoomTemplate, zonePos
  };
})();

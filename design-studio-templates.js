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
      cvd: "Campus LAN and Wireless LAN Design Guide",
      cvdUrl: "https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-campus-lan-wlan-design-guide.html",
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
      cvd: "Campus LAN and Wireless LAN Design Guide",
      cvdUrl: "https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-campus-lan-wlan-design-guide.html",
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
      cvd: "Cisco Catalyst SD-WAN Design Guide",
      cvdUrl: "https://www.cisco.com/c/en/us/solutions/design-zone/sd-wan.html",
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
      cvd: "Cisco Catalyst SD-WAN Design Guide",
      cvdUrl: "https://www.cisco.com/c/en/us/solutions/design-zone/sd-wan.html",
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
      cvd: "Meraki for Retail",
      cvdUrl: "https://meraki.cisco.com/solutions/retail/",
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
      cvd: "Application-Centric Infrastructure design guide",
      cvdUrl: "https://www.cisco.com/c/en/us/td/docs/solutions/CVD/DataCenter/cisco-aci-design-guide.html",
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
      cvd: "ACI Pod validated design",
      cvdUrl: "https://www.cisco.com/c/en/us/td/docs/solutions/CVD/DataCenter/cisco-aci-design-guide.html",
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
      cvd: "Cisco Validated Profile — Education",
      cvdUrl: "https://www.cisco.com/c/en/us/solutions/industries/education/validated-designs.html",
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
      cvd: "Cisco Validated Profile — Healthcare",
      cvdUrl: "https://www.cisco.com/c/en/us/solutions/industries/healthcare/validated-designs.html",
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
      cvd: "Zero trust access from Cisco",
      cvdUrl: "https://www.cisco.com/c/en/us/solutions/collateral/enterprise/design-zone-zero-trust.html",
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
      cvd: "HyperFlex validated designs",
      cvdUrl: "https://www.cisco.com/c/en/us/solutions/data-center-virtualization/hyperconverged-infrastructure/index.html",
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
    },
    snraCampus: {
      label: "SNRA Secure Campus",
      category: "Campus",
      tags: ["snra", "zero-trust", "enterprise"],
      cvd: "Secure Network Reference Architecture (SNRA) CVD",
      cvdUrl: "https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/SNRA-CVD-Architecture-Guide.html",
      nodes: [
        { stencilId: "internet", label: "Internet / DIA", x: 60, y: 100 },
        { stencilId: "c8200-sdwan", label: "WAN Edge-A", x: 200, y: 180 },
        { stencilId: "c8200-sdwan-2", label: "WAN Edge-B", x: 200, y: 280 },
        { stencilId: "fpr-2130", label: "Secure FW Pair", x: 360, y: 140 },
        { stencilId: "c9500-core", label: "Core-A", x: 360, y: 240 },
        { stencilId: "c9500-core-2", label: "Core-B", x: 360, y: 340 },
        { stencilId: "c9400-dist", label: "Fabric Dist", x: 540, y: 240 },
        { stencilId: "c9300-access", label: "Access-1", x: 720, y: 200 },
        { stencilId: "c9300-access", label: "Access-2", x: 720, y: 300 },
        { stencilId: "cw9179f", label: "Wi-Fi 6E AP", x: 900, y: 200 },
        { stencilId: "ise-pan", label: "ISE PAN", x: 540, y: 80 },
        { stencilId: "ise-psn", label: "ISE PSN", x: 660, y: 80 },
        { stencilId: "cat-center", label: "Catalyst Center", x: 780, y: 80 },
        { stencilId: "umbrella-va", label: "Umbrella / SSE", x: 360, y: 60 }
      ],
      links: [
        { fi: 0, ti: 1, media: "fiber-sm", label: "DIA-A", fromPort: "Port1", toPort: "Gi0/0/0" },
        { fi: 0, ti: 2, media: "fiber-sm", label: "DIA-B", fromPort: "Port1", toPort: "Gi0/0/0" },
        { fi: 1, ti: 4, media: "fiber-sm", label: "Edge-Core-A", fromPort: "Te0/1/0", toPort: "Te1/1/1" },
        { fi: 2, ti: 5, media: "fiber-sm", label: "Edge-Core-B", fromPort: "Te0/1/0", toPort: "Te1/1/1" },
        { fi: 3, ti: 4, media: "fiber-sm", label: "FW-Core", fromPort: "inside", toPort: "Te1/1/1" },
        { fi: 4, ti: 5, media: "fiber-sm", label: "Core VPC", fromPort: "Te1/1/1", toPort: "Te1/1/1" },
        { fi: 4, ti: 6, media: "fiber-sm", label: "Core-Dist", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 6, ti: 7, media: "fiber-mm", label: "Dist-Acc1", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 6, ti: 8, media: "fiber-mm", label: "Dist-Acc2", fromPort: "Te1/1/2", toPort: "Te1/1/2" },
        { fi: 7, ti: 9, media: "cat6", label: "PoE-AP", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 10, ti: 7, media: "cat6a", label: "NAC", fromPort: "Port1", toPort: "Gi1/0/24" },
        { fi: 11, ti: 7, media: "cat6a", label: "SGT", fromPort: "Port1", toPort: "Gi1/0/48" },
        { fi: 12, ti: 7, media: "cat6a", label: "Mgmt", fromPort: "Port1", toPort: "Gi1/0/24" },
        { fi: 13, ti: 3, media: "cat6a", label: "SSE", fromPort: "Port1", toPort: "dmz" }
      ]
    },
    unifiedBranchMed: {
      label: "Unified Branch (Medium)",
      category: "Branch",
      tags: ["unified-branch", "sd-wan", "cvd"],
      cvd: "Cisco Unified Branch — Medium Deployment",
      cvdUrl: "https://www.cisco.com/c/en/us/solutions/design-zone/campus-branch.html",
      nodes: [
        { stencilId: "internet", label: "Broadband", x: 60, y: 200 },
        { stencilId: "mpls", label: "MPLS / LTE", x: 60, y: 300 },
        { stencilId: "c8200-sdwan", label: "Branch Router-A", x: 220, y: 200 },
        { stencilId: "c8200-sdwan-2", label: "Branch Router-B", x: 220, y: 300 },
        { stencilId: "fpr-1120", label: "Branch NGFW", x: 400, y: 250 },
        { stencilId: "c9200-access", label: "Access Stack", x: 580, y: 250 },
        { stencilId: "cw9179f", label: "Branch AP", x: 760, y: 250 },
        { stencilId: "vmanage", label: "SD-WAN Controller", x: 400, y: 80 },
        { stencilId: "ise-psn", label: "ISE / RADIUS", x: 580, y: 80 }
      ],
      links: [
        { fi: 0, ti: 2, media: "cat6a", label: "WAN-1", fromPort: "Port1", toPort: "Gi0/0/0" },
        { fi: 1, ti: 3, media: "fiber-sm", label: "WAN-2", fromPort: "Port1", toPort: "Gi0/0/0" },
        { fi: 2, ti: 4, media: "fiber-sm", label: "HA-FW", fromPort: "Te0/1/0", toPort: "outside" },
        { fi: 3, ti: 4, media: "fiber-sm", label: "HA-FW-B", fromPort: "Te0/1/0", toPort: "outside" },
        { fi: 4, ti: 5, media: "cat6a", label: "FW-LAN", fromPort: "inside", toPort: "Te1/1/1" },
        { fi: 5, ti: 6, media: "cat6", label: "PoE-AP", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 7, ti: 2, media: "cat6a", label: "vManage", fromPort: "Port1", toPort: "Gi0/0/1" },
        { fi: 8, ti: 5, media: "cat6a", label: "802.1X", fromPort: "Port1", toPort: "Gi1/0/24" }
      ]
    },
    universityCampus: {
      label: "University Campus (CVP)",
      category: "Vertical",
      tags: ["university", "higher-ed", "cvp"],
      cvd: "Cisco Validated Profile — University",
      cvdUrl: "https://www.cisco.com/c/en/us/solutions/industries/education/validated-designs.html",
      nodes: [
        { stencilId: "c9500-core", label: "Campus Core-A", x: 300, y: 200 },
        { stencilId: "c9500-core-2", label: "Campus Core-B", x: 300, y: 300 },
        { stencilId: "c9400-dist", label: "Residence Dist", x: 500, y: 180 },
        { stencilId: "c9400-dist", label: "Academic Dist", x: 500, y: 320 },
        { stencilId: "c9300-access", label: "Dorm Access", x: 700, y: 180 },
        { stencilId: "c9300-access", label: "Class Access", x: 700, y: 320 },
        { stencilId: "cw9179f", label: "Student AP", x: 880, y: 160 },
        { stencilId: "cw9179f", label: "Guest AP", x: 880, y: 340 },
        { stencilId: "ise-pan", label: "ISE PAN", x: 500, y: 60 },
        { stencilId: "ise-psn", label: "ISE PSN", x: 620, y: 60 },
        { stencilId: "cat-center", label: "Catalyst Center", x: 740, y: 60 },
        { stencilId: "umbrella-va", label: "Umbrella", x: 300, y: 60 },
        { stencilId: "fpr-2130", label: "Internet FW", x: 300, y: 420 }
      ],
      links: [
        { fi: 0, ti: 1, media: "fiber-sm", label: "Core VPC", fromPort: "Te1/1/1", toPort: "Te1/1/1" },
        { fi: 0, ti: 2, media: "fiber-sm", label: "Core-Res", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 1, ti: 3, media: "fiber-sm", label: "Core-Acad", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 2, ti: 4, media: "fiber-mm", label: "Dist-Acc", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 3, ti: 5, media: "fiber-mm", label: "Dist-Acc", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 4, ti: 6, media: "cat6", label: "PoE-Student", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 5, ti: 7, media: "cat6", label: "PoE-Guest", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 8, ti: 4, media: "cat6a", label: "NAC", fromPort: "Port1", toPort: "Gi1/0/24" },
        { fi: 10, ti: 4, media: "cat6a", label: "Mgmt", fromPort: "Port1", toPort: "Gi1/0/24" },
        { fi: 12, ti: 0, media: "fiber-sm", label: "FW-Edge", fromPort: "inside", toPort: "Te1/1/1" }
      ]
    },
    manufacturingPlant: {
      label: "Manufacturing (IT/OT)",
      category: "Vertical",
      tags: ["manufacturing", "ot", "cvp"],
      cvd: "Cisco Validated Profile — Manufacturing",
      cvdUrl: "https://www.cisco.com/c/en/us/solutions/industries/manufacturing/validated-designs.html",
      nodes: [
        { stencilId: "c9500-core", label: "Plant Core", x: 320, y: 220 },
        { stencilId: "fpr-2130", label: "OT Seg FW", x: 320, y: 100 },
        { stencilId: "c9400-dist", label: "Enterprise Dist", x: 520, y: 180 },
        { stencilId: "c9300-access", label: "Office Access", x: 720, y: 180 },
        { stencilId: "c9200-access", label: "OT Cell Access", x: 720, y: 300 },
        { stencilId: "cw9179f", label: "Warehouse AP", x: 900, y: 180 },
        { stencilId: "ise-psn", label: "ISE", x: 520, y: 80 },
        { stencilId: "cat-center", label: "Catalyst Center", x: 640, y: 80 },
        { stencilId: "users-vlan", label: "SCADA VLAN", x: 900, y: 300 }
      ],
      links: [
        { fi: 1, ti: 0, media: "fiber-sm", label: "FW-Core", fromPort: "inside", toPort: "Te1/1/1" },
        { fi: 0, ti: 2, media: "fiber-sm", label: "Core-Dist", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 2, ti: 3, media: "fiber-mm", label: "IT-Access", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 2, ti: 4, media: "fiber-mm", label: "OT-Access", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 3, ti: 5, media: "cat6", label: "PoE-AP", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 1, ti: 4, media: "cat6a", label: "OT-DMZ", fromPort: "dmz", toPort: "Te1/1/1" },
        { fi: 4, ti: 8, media: "cat6", label: "OT-Zone", fromPort: "Gi1/0/1", toPort: "Port1" },
        { fi: 6, ti: 3, media: "cat6a", label: "NAC", fromPort: "Port1", toPort: "Gi1/0/24" }
      ]
    },
    sdAccessFabric: {
      label: "SD-Access Fabric Campus",
      category: "Campus",
      tags: ["sda", "fabric", "segmentation"],
      cvd: "Cisco Software-Defined Access Design Guide",
      cvdUrl: "https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-sda-design-guide.html",
      nodes: [
        { stencilId: "c9500-core", label: "Border Node", x: 300, y: 220 },
        { stencilId: "c9500-core-2", label: "Border Node-B", x: 300, y: 320 },
        { stencilId: "c9300-access", label: "Fabric Edge-1", x: 520, y: 200 },
        { stencilId: "c9300-access", label: "Fabric Edge-2", x: 520, y: 320 },
        { stencilId: "cw9179f", label: "Fabric AP", x: 700, y: 260 },
        { stencilId: "cat-center", label: "Catalyst Center", x: 520, y: 80 },
        { stencilId: "ise-pan", label: "ISE PAN", x: 640, y: 80 },
        { stencilId: "ise-psn", label: "ISE PSN", x: 760, y: 80 },
        { stencilId: "fpr-2130", label: "Macro Seg FW", x: 300, y: 80 }
      ],
      links: [
        { fi: 0, ti: 1, media: "fiber-sm", label: "Border VPC", fromPort: "Te1/1/1", toPort: "Te1/1/1" },
        { fi: 0, ti: 2, media: "fiber-sm", label: "Fabric-Edge", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 1, ti: 3, media: "fiber-sm", label: "Fabric-Edge", fromPort: "Te1/1/2", toPort: "Te1/1/1" },
        { fi: 2, ti: 4, media: "cat6", label: "PoE-AP", fromPort: "Gi1/0/1", toPort: "ETH0" },
        { fi: 5, ti: 2, media: "cat6a", label: "DNA-C", fromPort: "Port1", toPort: "Gi1/0/48" },
        { fi: 6, ti: 2, media: "cat6a", label: "SGT", fromPort: "Port1", toPort: "Gi1/0/24" },
        { fi: 8, ti: 0, media: "fiber-sm", label: "FW-Border", fromPort: "inside", toPort: "Te1/1/1" }
      ]
    },
    dcAiMlFabric: {
      label: "DC AI/ML Fabric (CVD)",
      category: "Data Center",
      tags: ["ai", "ml", "gpu", "spine-leaf"],
      cvd: "Cisco Data Center Networking Blueprint for AI/ML",
      cvdUrl: "https://www.cisco.com/c/en/us/solutions/data-center-virtualization/artificial-intelligence-machine-learning/index.html",
      nodes: [
        { stencilId: "n9k-spine", label: "AI Spine-1", x: 400, y: 100 },
        { stencilId: "n9k-spine", label: "AI Spine-2", x: 400, y: 200 },
        { stencilId: "n9k-leaf", label: "GPU Leaf-1", x: 200, y: 320 },
        { stencilId: "n9k-leaf", label: "GPU Leaf-2", x: 400, y: 320 },
        { stencilId: "n9k-leaf", label: "GPU Leaf-3", x: 600, y: 320 },
        { stencilId: "ucs-x", label: "GPU Server-1", x: 200, y: 440 },
        { stencilId: "ucs-x", label: "GPU Server-2", x: 400, y: 440 },
        { stencilId: "ucs-x", label: "GPU Server-3", x: 600, y: 440 },
        { stencilId: "fpr-2130", label: "DC Border FW", x: 600, y: 100 },
        { stencilId: "cat-center", label: "Nexus Dashboard", x: 200, y: 100 }
      ],
      links: [
        { fi: 0, ti: 2, media: "fiber-40g", label: "Spine-Leaf", fromPort: "Eth1/1", toPort: "Eth1/33" },
        { fi: 0, ti: 3, media: "fiber-40g", label: "Spine-Leaf", fromPort: "Eth1/32", toPort: "Eth1/33" },
        { fi: 1, ti: 3, media: "fiber-40g", label: "Spine-Leaf", fromPort: "Eth1/1", toPort: "Eth1/64" },
        { fi: 1, ti: 4, media: "fiber-40g", label: "Spine-Leaf", fromPort: "Eth1/32", toPort: "Eth1/64" },
        { fi: 2, ti: 5, media: "fiber-sm", label: "GPU-1", fromPort: "Eth1/1", toPort: "Port1" },
        { fi: 3, ti: 6, media: "fiber-sm", label: "GPU-2", fromPort: "Eth1/1", toPort: "Port1" },
        { fi: 4, ti: 7, media: "fiber-sm", label: "GPU-3", fromPort: "Eth1/1", toPort: "Port1" },
        { fi: 8, ti: 0, media: "fiber-sm", label: "Border", fromPort: "inside", toPort: "Eth1/33" },
        { fi: 9, ti: 2, media: "cat6a", label: "Ops", fromPort: "Port1", toPort: "Eth1/64" }
      ]
    }
  };

  const ROOM_TEMPLATES = {
    huddle: {
      name: "Huddle (4–6 seats)",
      category: "Small",
      ct: "Traditional Huddle Room Design Guide",
      ctUrl: "https://www.cisco.com/c/dam/en/us/solutions/collateral/hybrid-work/webex-nyc-design-guide-traditional-huddle-room.pdf",
      w: 520, h: 360,
      zones: { display: { x: 60, y: 8, w: 400, h: 100 }, table: { x: 60, y: 116, w: 400, h: 100 }, rack: { x: 60, y: 224, w: 400, h: 72 } },
      items: [
        { stencilId: "room-bar", zone: "display", relX: 0.35, relY: 0.5, label: "Room Bar" },
        { stencilId: "display-75", zone: "display", relX: 0.72, relY: 0.5, label: "Display" },
        { stencilId: "conf-table-8", zone: "table", relX: 0.5, relY: 0.5, label: "Table" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.5, relY: 0.5, label: "PoE Switch" }
      ],
      links: [
        { fi: 3, ti: 0, media: "cat6", label: "PoE-Bar", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 0, ti: 1, media: "hdmi", label: "Video", fromPort: "HDMI1", toPort: "HDMI1" }
      ]
    },
    conference: {
      name: "Conference (8–12 seats)",
      category: "Medium",
      ct: "Medium Collaboration Room — Single Display",
      ctUrl: "https://www.cisco.com/c/dam/en/us/solutions/collateral/hybrid-work/webex-nyc-design-guide-medium-collaboration-room-single-display.pdf",
      w: 520, h: 380,
      zones: {
        display: { x: 70, y: 8, w: 360, h: 88 },
        ceiling: { x: 70, y: 104, w: 360, h: 54 },
        table: { x: 70, y: 168, w: 360, h: 56 },
        rack: { x: 70, y: 236, w: 360, h: 104 }
      },
      items: [
        { stencilId: "quad-cam", zone: "display", relX: 0.22, relY: 0.52, label: "Quad Cam" },
        { stencilId: "display-75", zone: "display", relX: 0.76, relY: 0.52, label: "Primary Display" },
        { stencilId: "room-kit-eq", zone: "rack", relX: 0.17, relY: 0.38, label: "Room Kit EQ" },
        { stencilId: "touch-10", zone: "table", relX: 0.42, relY: 0.38, label: "Touch 10" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.83, relY: 0.38, label: "C9200-24P" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.58, label: "Conference Table" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.32, relY: 0.5, label: "Ceiling Mic L" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.68, relY: 0.5, label: "Ceiling Mic R" }
      ],
      links: [
        { fi: 4, ti: 2, media: "cat6", label: "PoE-Codec", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 4, ti: 3, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 4, ti: 6, media: "cat6", label: "PoE-Mic-L", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 4, ti: 7, media: "cat6", label: "PoE-Mic-R", fromPort: "Gi1/0/4", toPort: "ETH" },
        { fi: 2, ti: 1, media: "hdmi", label: "Primary Video", fromPort: "HDMI1", toPort: "HDMI1" },
        { fi: 2, ti: 0, media: "hdmi", label: "Camera", fromPort: "HDMI2", toPort: "HDMI" }
      ]
    },
    boardroom: {
      name: "Boardroom (14–20 seats)",
      category: "Large",
      ct: "Medium Collaboration Room — Video Centric",
      ctUrl: "https://www.cisco.com/c/dam/en/us/solutions/collateral/hybrid-work/webex-nyc-design-guide-medium-collaboration-room-video-centric.pdf",
      w: 540, h: 420,
      zones: {
        display: { x: 70, y: 8, w: 400, h: 108 },
        table: { x: 70, y: 124, w: 400, h: 148 },
        rack: { x: 70, y: 280, w: 400, h: 88 }
      },
      items: [
        { stencilId: "board-pro", zone: "display", relX: 0.3, relY: 0.66, label: "Board Pro" },
        { stencilId: "display-86", zone: "display", relX: 0.78, relY: 0.66, label: "Aux Display" },
        { stencilId: "quad-cam", zone: "display", relX: 0.54, relY: 0.16, label: "Primary Cam" },
        { stencilId: "touch-10", zone: "table", relX: 0.38, relY: 0.35, label: "Touch 10" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.72, relY: 0.42, label: "C9200-24P" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.6, label: "Board Table" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.24, relY: 0.16, label: "Mic-1" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.5, relY: 0.1, label: "Mic-2" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.76, relY: 0.16, label: "Mic-3" }
      ],
      links: [
        { fi: 4, ti: 0, media: "cat6", label: "PoE-Board", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 4, ti: 3, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 4, ti: 6, media: "cat6", label: "PoE-Mic1", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 4, ti: 7, media: "cat6", label: "PoE-Mic2", fromPort: "Gi1/0/4", toPort: "ETH" },
        { fi: 4, ti: 8, media: "cat6", label: "PoE-Mic3", fromPort: "Gi1/0/5", toPort: "ETH" },
        { fi: 0, ti: 1, media: "hdmi", label: "Aux Video", fromPort: "HDMI1", toPort: "HDMI1" },
        { fi: 2, ti: 0, media: "hdmi", label: "Camera", fromPort: "HDMI", toPort: "HDMI2" }
      ]
    },
    training: {
      name: "Training Room",
      category: "Medium",
      ct: "Small Collaboration Room Design Guide",
      ctUrl: "https://www.cisco.com/c/dam/en/us/solutions/collateral/hybrid-work/webex-nyc-design-guide-small-collaboration-room.pdf",
      w: 620, h: 500,
      zones: { display: { x: 180, y: 32, w: 260, h: 120 }, table: { x: 48, y: 180, w: 520, h: 220 }, rack: { x: 32, y: 428, w: 220, h: 96 } },
      items: [
        { stencilId: "board-pro", zone: "display", relX: 0.5, relY: 0.5, label: "Board Pro 75" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.35, relY: 0.55, label: "C9200-24P" },
        { stencilId: "touch-10", zone: "table", relX: 0.55, relY: 0.35, label: "Touch 10" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.25, relY: 0.2, label: "Mic-1" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.75, relY: 0.2, label: "Mic-2" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.65, label: "Training Tables" }
      ],
      links: [
        { fi: 1, ti: 0, media: "cat6", label: "PoE-Board", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 1, ti: 2, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 1, ti: 3, media: "cat6", label: "Mic-1", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 1, ti: 4, media: "cat6", label: "Mic-2", fromPort: "Gi1/0/4", toPort: "ETH" }
      ]
    },
    executive: {
      name: "Executive Office",
      category: "Small",
      ct: "Small Collaboration Room Design Guide",
      ctUrl: "https://www.cisco.com/c/dam/en/us/solutions/collateral/hybrid-work/webex-nyc-design-guide-small-collaboration-room.pdf",
      w: 420, h: 360,
      zones: { desk: { x: 80, y: 140, w: 260, h: 140 }, wall: { x: 80, y: 32, w: 260, h: 88 } },
      items: [
        { stencilId: "desk-pro", zone: "desk", relX: 0.5, relY: 0.45, label: "Desk Pro" },
        { stencilId: "display-75", zone: "wall", relX: 0.5, relY: 0.55, label: "Wall Display" },
        { stencilId: "c9200-collab", zone: "desk", relX: 0.5, relY: 0.88, label: "PoE SW" }
      ],
      links: [
        { fi: 2, ti: 0, media: "cat6", label: "PoE", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 0, ti: 1, media: "hdmi", label: "Video", fromPort: "HDMI1", toPort: "HDMI1" }
      ]
    },
    teamsRoom: {
      name: "Microsoft Teams Room",
      category: "Medium",
      ct: "Microsoft Teams on Cisco Devices",
      ctUrl: "https://www.cisco.com/c/en/us/solutions/collaboration/microsoft-teams/index.html",
      w: 580, h: 460,
      zones: {
        display: { x: 140, y: 32, w: 300, h: 120 },
        table: { x: 80, y: 180, w: 380, h: 156 },
        rack: { x: 32, y: 360, w: 340, h: 112 }
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
      ct: "Zoom on Cisco Devices",
      ctUrl: "https://www.cisco.com/c/en/us/solutions/collaboration/zoom/index.html",
      w: 580, h: 460,
      zones: {
        display: { x: 140, y: 32, w: 300, h: 128 },
        table: { x: 80, y: 188, w: 380, h: 156 },
        rack: { x: 32, y: 368, w: 300, h: 112 }
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
      ct: "Cisco hybrid work — divisible spaces",
      ctUrl: "https://www.cisco.com/c/en/us/solutions/collaboration/workplace-transformation/hybrid-work-design-guides.html",
      w: 720, h: 540,
      zones: { display: { x: 80, y: 28, w: 560, h: 128 }, table: { x: 48, y: 180, w: 620, h: 228 }, rack: { x: 32, y: 440, w: 200, h: 104 } },
      items: [
        { stencilId: "display-86", zone: "display", relX: 0.25, relY: 0.5, label: "Display-A" },
        { stencilId: "display-86", zone: "display", relX: 0.75, relY: 0.5, label: "Display-B" },
        { stencilId: "room-kit-pro", zone: "rack", relX: 0.35, relY: 0.3, label: "Codec-A" },
        { stencilId: "room-kit-pro", zone: "rack", relX: 0.65, relY: 0.3, label: "Codec-B" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.5, relY: 0.75, label: "C9200-24P" },
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
    },
    ctSmallCollab: {
      name: "CT Small Collaboration Room",
      category: "Small",
      ct: "Small Collaboration Room Design Guide",
      ctUrl: "https://www.cisco.com/c/dam/en/us/solutions/collateral/hybrid-work/webex-nyc-design-guide-small-collaboration-room.pdf",
      w: 580, h: 480,
      zones: {
        display: { x: 120, y: 24, w: 340, h: 168 },
        table: { x: 72, y: 216, w: 436, h: 176 },
        rack: { x: 48, y: 412, w: 380, h: 96 }
      },
      items: [
        { stencilId: "room-bar", zone: "display", relX: 0.5, relY: 0.2, label: "Room Bar" },
        { stencilId: "display-75", zone: "display", relX: 0.5, relY: 0.82, label: "Wall Display" },
        { stencilId: "table-mic", zone: "table", relX: 0.5, relY: 0.22, label: "Table Mic" },
        { stencilId: "conf-table-8", zone: "table", relX: 0.5, relY: 0.78, label: "Table" },
        { stencilId: "room-navigator", zone: "rack", relX: 0.28, relY: 0.5, label: "Room Navigator" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.72, relY: 0.5, label: "C9200-24P" }
      ],
      links: [
        { fi: 5, ti: 0, media: "cat6", label: "PoE-Bar", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 5, ti: 4, media: "cat6", label: "PoE-Nav", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 5, ti: 2, media: "cat6", label: "PoE-Mic", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 0, ti: 1, media: "hdmi", label: "Video", fromPort: "HDMI1", toPort: "HDMI1" }
      ]
    },
    ctMediumDualDisplay: {
      name: "CT Medium — Dual Display",
      category: "Medium",
      ct: "Medium Collaboration Room — Video Centric",
      ctUrl: "https://www.cisco.com/c/dam/en/us/solutions/collateral/hybrid-work/webex-nyc-design-guide-medium-collaboration-room-video-centric.pdf",
      w: 660, h: 500,
      zones: {
        display: { x: 100, y: 28, w: 460, h: 140 },
        table: { x: 80, y: 196, w: 420, h: 176 },
        rack: { x: 32, y: 400, w: 360, h: 108 }
      },
      items: [
        { stencilId: "display-75", zone: "display", relX: 0.3, relY: 0.55, label: "People Display" },
        { stencilId: "display-75", zone: "display", relX: 0.7, relY: 0.55, label: "Content Display" },
        { stencilId: "quad-cam", zone: "display", relX: 0.5, relY: 0.18, label: "Quad Cam" },
        { stencilId: "room-kit-eq", zone: "rack", relX: 0.2, relY: 0.4, label: "Room Kit EQ" },
        { stencilId: "touch-10", zone: "table", relX: 0.5, relY: 0.35, label: "Touch 10" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.8, relY: 0.4, label: "C9200-24P" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.35, relY: 0.2, label: "Ceiling Mic L" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.65, relY: 0.2, label: "Ceiling Mic R" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.65, label: "Tapered Table" }
      ],
      links: [
        { fi: 5, ti: 3, media: "cat6", label: "PoE-Codec", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 5, ti: 4, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 5, ti: 6, media: "cat6", label: "PoE-Mic-L", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 5, ti: 7, media: "cat6", label: "PoE-Mic-R", fromPort: "Gi1/0/4", toPort: "ETH" },
        { fi: 3, ti: 0, media: "hdmi", label: "People", fromPort: "HDMI1", toPort: "HDMI1" },
        { fi: 3, ti: 1, media: "hdmi", label: "Content", fromPort: "HDMI2", toPort: "HDMI1" }
      ]
    },

    // ── Cisco Workspace Designer archetypes (webex.com/workspaces) ───────────
    smallRoom: {
      name: "Small Room (4–6 seats)",
      category: "Small",
      ct: "Cisco Workspace Designer — Small Room",
      ctUrl: "https://www.webex.com/workspaces",
      w: 540, h: 400,
      zones: {
        display: { x: 80, y: 12, w: 380, h: 100 },
        table: { x: 80, y: 124, w: 380, h: 120 },
        rack: { x: 80, y: 256, w: 380, h: 88 }
      },
      items: [
        { stencilId: "room-kit-eq", zone: "display", relX: 0.28, relY: 0.55, label: "Room Kit EQ" },
        { stencilId: "display-75", zone: "display", relX: 0.72, relY: 0.55, label: "Display" },
        { stencilId: "quad-cam", zone: "display", relX: 0.5, relY: 0.18, label: "Quad Cam" },
        { stencilId: "touch-10", zone: "table", relX: 0.35, relY: 0.35, label: "Touch 10" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.72, relY: 0.45, label: "C9200-24P" },
        { stencilId: "table-mic", zone: "table", relX: 0.5, relY: 0.25, label: "Table Mic" },
        { stencilId: "conf-table-8", zone: "table", relX: 0.5, relY: 0.72, label: "Table" }
      ],
      links: [
        { fi: 4, ti: 0, media: "cat6", label: "PoE-Codec", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 4, ti: 3, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 4, ti: 5, media: "cat6", label: "PoE-Mic", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 0, ti: 1, media: "hdmi", label: "Video", fromPort: "HDMI1", toPort: "HDMI1" },
        { fi: 0, ti: 2, media: "hdmi", label: "Camera", fromPort: "HDMI2", toPort: "HDMI" }
      ]
    },
    largeRoom: {
      name: "Large Room (11–24 seats)",
      category: "Large",
      ct: "Cisco Workspace Designer — Large Room",
      ctUrl: "https://www.webex.com/workspaces",
      w: 620, h: 480,
      zones: {
        display: { x: 70, y: 10, w: 480, h: 120 },
        ceiling: { x: 70, y: 140, w: 480, h: 60 },
        table: { x: 70, y: 210, w: 480, h: 150 },
        rack: { x: 70, y: 372, w: 480, h: 96 }
      },
      items: [
        { stencilId: "room-kit-pro", zone: "rack", relX: 0.2, relY: 0.42, label: "Room Kit Pro G2" },
        { stencilId: "display-86", zone: "display", relX: 0.5, relY: 0.62, label: "Main Display" },
        { stencilId: "quad-cam", zone: "display", relX: 0.5, relY: 0.2, label: "Quad Camera" },
        { stencilId: "touch-10", zone: "table", relX: 0.48, relY: 0.35, label: "Touch 10" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.78, relY: 0.42, label: "C9200-24P" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.25, relY: 0.5, label: "Mic-1" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.5, relY: 0.5, label: "Mic-2" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.75, relY: 0.5, label: "Mic-3" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.5, relY: 0.2, label: "Mic-4" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.65, label: "Conference Table" }
      ],
      links: [
        { fi: 4, ti: 0, media: "cat6", label: "PoE-Codec", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 4, ti: 3, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 4, ti: 5, media: "cat6", label: "PoE-Mic1", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 4, ti: 6, media: "cat6", label: "PoE-Mic2", fromPort: "Gi1/0/4", toPort: "ETH" },
        { fi: 4, ti: 7, media: "cat6", label: "PoE-Mic3", fromPort: "Gi1/0/5", toPort: "ETH" },
        { fi: 4, ti: 8, media: "cat6", label: "PoE-Mic4", fromPort: "Gi1/0/6", toPort: "ETH" },
        { fi: 0, ti: 1, media: "hdmi", label: "Primary Video", fromPort: "HDMI1", toPort: "HDMI1" },
        { fi: 0, ti: 2, media: "hdmi", label: "Camera", fromPort: "HDMI2", toPort: "HDMI" }
      ]
    },
    largeRoomConfidence: {
      name: "Large Room + Confidence Monitors",
      category: "Large",
      ct: "Workspace Designer — side-wall confidence monitors",
      ctUrl: "https://blog.webex.com/workspaces/whats-new-cisco-workspace-designer-fall-2025/",
      w: 680, h: 500,
      zones: {
        display: { x: 60, y: 8, w: 560, h: 130 },
        table: { x: 60, y: 150, w: 560, h: 160 },
        rack: { x: 60, y: 324, w: 560, h: 96 }
      },
      items: [
        { stencilId: "room-kit-pro", zone: "rack", relX: 0.18, relY: 0.42, label: "Room Kit Pro G2" },
        { stencilId: "display-86", zone: "display", relX: 0.5, relY: 0.55, label: "Front Display" },
        { stencilId: "display-75", zone: "display", relX: 0.12, relY: 0.55, label: "Confidence L" },
        { stencilId: "display-75", zone: "display", relX: 0.88, relY: 0.55, label: "Confidence R" },
        { stencilId: "quad-cam", zone: "display", relX: 0.5, relY: 0.15, label: "Quad Camera" },
        { stencilId: "touch-10", zone: "table", relX: 0.45, relY: 0.35, label: "Touch 10" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.75, relY: 0.42, label: "C9200-24P" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.3, relY: 0.15, label: "Mic-1" },
        { stencilId: "ceiling-mic", zone: "table", relX: 0.7, relY: 0.15, label: "Mic-2" },
        { stencilId: "conf-table-12", zone: "table", relX: 0.5, relY: 0.62, label: "Board Table" }
      ],
      links: [
        { fi: 6, ti: 0, media: "cat6", label: "PoE-Codec", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 6, ti: 5, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 6, ti: 7, media: "cat6", label: "PoE-Mic1", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 6, ti: 8, media: "cat6", label: "PoE-Mic2", fromPort: "Gi1/0/4", toPort: "ETH" },
        { fi: 0, ti: 1, media: "hdmi", label: "Front Video", fromPort: "HDMI1", toPort: "HDMI1" },
        { fi: 0, ti: 2, media: "hdmi", label: "Confidence L", fromPort: "HDMI2", toPort: "HDMI1" },
        { fi: 4, ti: 0, media: "hdmi", label: "Camera", fromPort: "HDMI", toPort: "HDMI2" }
      ]
    },
    auditorium: {
      name: "Auditorium (20–150 seats)",
      category: "Large",
      ct: "Cisco Workspace Designer — Auditorium",
      ctUrl: "https://www.webex.com/workspaces",
      w: 760, h: 560,
      zones: {
        display: { x: 80, y: 16, w: 600, h: 140 },
        ceiling: { x: 80, y: 168, w: 600, h: 72 },
        floor: { x: 80, y: 252, w: 600, h: 180 },
        rack: { x: 80, y: 448, w: 280, h: 100 }
      },
      items: [
        { stencilId: "room-kit-pro", zone: "rack", relX: 0.35, relY: 0.45, label: "Room Kit Pro G2" },
        { stencilId: "display-86", zone: "display", relX: 0.3, relY: 0.55, label: "Display L" },
        { stencilId: "display-86", zone: "display", relX: 0.7, relY: 0.55, label: "Display R" },
        { stencilId: "room-vision-ptz", zone: "display", relX: 0.2, relY: 0.2, label: "PTZ L" },
        { stencilId: "room-vision-ptz", zone: "display", relX: 0.8, relY: 0.2, label: "PTZ R" },
        { stencilId: "touch-10", zone: "table", relX: 0.72, relY: 0.35, label: "Touch 10" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.35, relY: 0.82, label: "C9200-24P" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.2, relY: 0.5, label: "Mic-1" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.4, relY: 0.5, label: "Mic-2" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.6, relY: 0.5, label: "Mic-3" },
        { stencilId: "ceiling-mic", zone: "ceiling", relX: 0.8, relY: 0.5, label: "Mic-4" },
        { stencilId: "conf-table-12", zone: "floor", relX: 0.5, relY: 0.35, label: "Presenter Area" }
      ],
      links: [
        { fi: 6, ti: 0, media: "cat6", label: "PoE-Codec", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 6, ti: 5, media: "cat6", label: "PoE-Touch", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 6, ti: 7, media: "cat6", label: "PoE-Mic1", fromPort: "Gi1/0/3", toPort: "ETH" },
        { fi: 6, ti: 8, media: "cat6", label: "PoE-Mic2", fromPort: "Gi1/0/4", toPort: "ETH" },
        { fi: 6, ti: 9, media: "cat6", label: "PoE-Mic3", fromPort: "Gi1/0/5", toPort: "ETH" },
        { fi: 6, ti: 10, media: "cat6", label: "PoE-Mic4", fromPort: "Gi1/0/6", toPort: "ETH" },
        { fi: 0, ti: 1, media: "hdmi", label: "Display L", fromPort: "HDMI1", toPort: "HDMI1" },
        { fi: 0, ti: 2, media: "hdmi", label: "Display R", fromPort: "HDMI2", toPort: "HDMI1" },
        { fi: 3, ti: 0, media: "hdmi", label: "PTZ L", fromPort: "HDMI", toPort: "USB" },
        { fi: 4, ti: 0, media: "hdmi", label: "PTZ R", fromPort: "HDMI", toPort: "USB" }
      ]
    },
    focusRoom: {
      name: "Focus Room",
      category: "Individual",
      ct: "Workspace Designer — focus / ad-hoc rooms",
      ctUrl: "https://blog.webex.com/workspaces/six-new-ways-to-transform-workspace-reservation/",
      w: 440, h: 360,
      zones: {
        wall: { x: 60, y: 20, w: 320, h: 100 },
        table: { x: 60, y: 132, w: 320, h: 120 },
        rack: { x: 60, y: 264, w: 320, h: 72 }
      },
      items: [
        { stencilId: "room-bar", zone: "wall", relX: 0.35, relY: 0.55, label: "Room Bar" },
        { stencilId: "display-75", zone: "wall", relX: 0.72, relY: 0.55, label: "Display" },
        { stencilId: "room-navigator", zone: "rack", relX: 0.3, relY: 0.5, label: "Room Navigator" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.72, relY: 0.5, label: "PoE Switch" },
        { stencilId: "conf-table-8", zone: "table", relX: 0.5, relY: 0.55, label: "Table" }
      ],
      links: [
        { fi: 3, ti: 0, media: "cat6", label: "PoE-Bar", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 3, ti: 2, media: "cat6", label: "PoE-Nav", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 0, ti: 1, media: "hdmi", label: "Video", fromPort: "HDMI1", toPort: "HDMI1" }
      ]
    },
    openDesk: {
      name: "Open Desk Area",
      category: "Individual",
      ct: "Workspace Designer — open desk scenarios",
      ctUrl: "https://blog.webex.com/workspaces/whats-new-cisco-workspace-designer-fall-2025/",
      w: 720, h: 420,
      zones: {
        row1: { x: 40, y: 40, w: 640, h: 140 },
        row2: { x: 40, y: 200, w: 640, h: 140 },
        rack: { x: 40, y: 352, w: 200, h: 56 }
      },
      items: [
        { stencilId: "desk-mini", zone: "row1", relX: 0.15, relY: 0.5, label: "Desk 1" },
        { stencilId: "desk-mini", zone: "row1", relX: 0.38, relY: 0.5, label: "Desk 2" },
        { stencilId: "desk-mini", zone: "row1", relX: 0.62, relY: 0.5, label: "Desk 3" },
        { stencilId: "desk-mini", zone: "row1", relX: 0.85, relY: 0.5, label: "Desk 4" },
        { stencilId: "desk-mini", zone: "row2", relX: 0.25, relY: 0.5, label: "Desk 5" },
        { stencilId: "desk-mini", zone: "row2", relX: 0.5, relY: 0.5, label: "Desk 6" },
        { stencilId: "desk-mini", zone: "row2", relX: 0.75, relY: 0.5, label: "Desk 7" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.5, relY: 0.5, label: "C9200-24P" }
      ],
      links: [
        { fi: 7, ti: 0, media: "cat6", label: "PoE-D1", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 7, ti: 1, media: "cat6", label: "PoE-D2", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 7, ti: 2, media: "cat6", label: "PoE-D3", fromPort: "Gi1/0/3", toPort: "LAN" },
        { fi: 7, ti: 3, media: "cat6", label: "PoE-D4", fromPort: "Gi1/0/4", toPort: "LAN" },
        { fi: 7, ti: 4, media: "cat6", label: "PoE-D5", fromPort: "Gi1/0/5", toPort: "LAN" },
        { fi: 7, ti: 5, media: "cat6", label: "PoE-D6", fromPort: "Gi1/0/6", toPort: "LAN" },
        { fi: 7, ti: 6, media: "cat6", label: "PoE-D7", fromPort: "Gi1/0/7", toPort: "LAN" }
      ]
    },
    deskEssentials: {
      name: "Desk — Essentials",
      category: "Individual",
      ct: "Workspace Designer — desk essentials preset",
      ctUrl: "https://www.webex.com/workspaces",
      w: 400, h: 320,
      zones: { desk: { x: 80, y: 80, w: 240, h: 160 } },
      items: [
        { stencilId: "desk-phone", zone: "desk", relX: 0.4, relY: 0.45, label: "Desk Phone" },
        { stencilId: "c9200-collab", zone: "desk", relX: 0.75, relY: 0.85, label: "PoE SW" }
      ],
      links: [
        { fi: 1, ti: 0, media: "cat6", label: "PoE-Phone", fromPort: "Gi1/0/1", toPort: "LAN" }
      ]
    },
    deskVoice: {
      name: "Desk — Voice Optimized",
      category: "Individual",
      ct: "Workspace Designer — voice-optimized desk",
      ctUrl: "https://www.webex.com/workspaces",
      w: 420, h: 340,
      zones: { desk: { x: 70, y: 70, w: 280, h: 180 } },
      items: [
        { stencilId: "desk-phone", zone: "desk", relX: 0.35, relY: 0.4, label: "Desk Phone 9841" },
        { stencilId: "desk-mini", zone: "desk", relX: 0.65, relY: 0.4, label: "Desk Mini" },
        { stencilId: "c9200-collab", zone: "desk", relX: 0.5, relY: 0.88, label: "PoE SW" }
      ],
      links: [
        { fi: 2, ti: 0, media: "cat6", label: "PoE-Phone", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 2, ti: 1, media: "cat6", label: "PoE-Mini", fromPort: "Gi1/0/2", toPort: "LAN" }
      ]
    },
    deskHybrid: {
      name: "Desk — Hybrid Video",
      category: "Individual",
      ct: "Workspace Designer — hybrid desk preset",
      ctUrl: "https://www.webex.com/workspaces",
      w: 480, h: 380,
      zones: {
        desk: { x: 60, y: 100, w: 360, h: 160 },
        wall: { x: 120, y: 24, w: 240, h: 64 }
      },
      items: [
        { stencilId: "desk-pro", zone: "desk", relX: 0.4, relY: 0.5, label: "Desk Pro" },
        { stencilId: "display-75", zone: "wall", relX: 0.5, relY: 0.55, label: "Secondary Display" },
        { stencilId: "desk-phone", zone: "desk", relX: 0.72, relY: 0.5, label: "Desk Phone" },
        { stencilId: "c9200-collab", zone: "desk", relX: 0.5, relY: 0.92, label: "PoE SW" }
      ],
      links: [
        { fi: 3, ti: 0, media: "cat6", label: "PoE-DeskPro", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 3, ti: 2, media: "cat6", label: "PoE-Phone", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 0, ti: 1, media: "hdmi", label: "Secondary Screen", fromPort: "HDMI1", toPort: "HDMI1" }
      ]
    },
    deskAllInOne: {
      name: "Desk — All-in-One Video",
      category: "Individual",
      ct: "Workspace Designer — all-in-one desk (Desk Pro G2)",
      ctUrl: "https://blog.webex.com/workspaces/whats-new-in-cisco-workspace-designer-winter-spring-2026/",
      w: 440, h: 360,
      zones: { desk: { x: 80, y: 60, w: 280, h: 200 } },
      items: [
        { stencilId: "desk-pro", zone: "desk", relX: 0.45, relY: 0.45, label: "Desk Pro" },
        { stencilId: "room-navigator", zone: "desk", relX: 0.75, relY: 0.75, label: "Room Navigator" },
        { stencilId: "c9200-collab", zone: "desk", relX: 0.45, relY: 0.9, label: "PoE SW" }
      ],
      links: [
        { fi: 2, ti: 0, media: "cat6", label: "PoE-DeskPro", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 2, ti: 1, media: "cat6", label: "PoE-Nav", fromPort: "Gi1/0/2", toPort: "LAN" }
      ]
    },
    huddleByod: {
      name: "Huddle — BYOD (Room Bar)",
      category: "Small",
      ct: "Workspace Designer — BYOD huddle (Room Bar USB-C)",
      ctUrl: "https://blog.webex.com/workspaces/whats-new-in-cisco-workspace-designer-winter-spring-2026/",
      w: 520, h: 380,
      zones: {
        display: { x: 70, y: 12, w: 380, h: 110 },
        table: { x: 70, y: 132, w: 380, h: 120 },
        rack: { x: 70, y: 264, w: 380, h: 80 }
      },
      items: [
        { stencilId: "room-bar", zone: "display", relX: 0.5, relY: 0.35, label: "Room Bar BYOD" },
        { stencilId: "display-75", zone: "display", relX: 0.5, relY: 0.78, label: "Display" },
        { stencilId: "room-navigator", zone: "rack", relX: 0.32, relY: 0.5, label: "Room Navigator" },
        { stencilId: "c9200-collab", zone: "rack", relX: 0.72, relY: 0.5, label: "C9200-24P" },
        { stencilId: "conf-table-8", zone: "table", relX: 0.5, relY: 0.55, label: "Huddle Table" }
      ],
      links: [
        { fi: 3, ti: 0, media: "cat6", label: "PoE-Bar", fromPort: "Gi1/0/1", toPort: "LAN" },
        { fi: 3, ti: 2, media: "cat6", label: "PoE-Nav", fromPort: "Gi1/0/2", toPort: "LAN" },
        { fi: 0, ti: 1, media: "hdmi", label: "BYOD Video", fromPort: "HDMI1", toPort: "HDMI1" }
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

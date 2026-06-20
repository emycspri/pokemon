export const Colors = {

  primary: "#FF7EB6",
  secondary: "#FFC6E3",


  background: "#FFF1F8",
  surface: "#FFFFFF",
  surfaceCard: "#FFE6F2",
  card: "#FFE0EF",


  text: "#4A2F4F",
  black: "#1B1B1B",
  dark: "#2B2330",
  white: "#ffffff",
  whiteT: "#1B1B1B",

  accent: "#FF9DCA",
  btnPrimary: "#FF5FA2",


  pokeballRed: "#FF4F84",
  pokeballDarkRed: "#D93B6E",


  border: "#E79AC2",
  shadow: "#D88DB5",

  teste: "#833d5a",

  primaryAlpha: {
    "05": "rgba(255,95,162,0.05)",
    "10": "rgba(255,95,162,0.10)",
    "15": "rgba(255,95,162,0.15)",
    "20": "rgba(255,95,162,0.20)",
    "25": "rgba(255,95,162,0.25)",
    "30": "rgba(255,95,162,0.30)",
    "40": "rgba(255,95,162,0.40)",
    "60": "rgba(255,95,162,0.60)",
  },

  whiteAlpha: {
    "05": "rgb(0, 0, 0)",
    "06": "rgb(0, 0, 0)",
    "07": "rgb(0, 0, 0)",
    "08": "rgb(227, 227, 227)",
    "10": "rgb(0, 0, 0)",
    "12": "rgb(0, 0, 0)",
    "15": "rgb(0, 0, 0)",
    "20": "rgb(0, 0, 0)",
    "25": "rgb(0, 0, 0)",
    "30": "rgb(0, 0, 0)",
    "35": "rgb(0, 0, 0)",
    "40": "rgb(0, 0, 0)",
    "45": "rgb(221, 221, 221)",
    "55": "rgb(0, 0, 0)",
    "65": "rgb(0, 0, 0)",
    "75": "rgb(0, 0, 0)",
  },


  overlayDark: "rgba(35,20,35,0.65)",


  game: {
    win: "#57C785",
    loss: "#FF6E8A",
  },


  semantic: {
    warning: {
      bg: "#FFF1C4",
      border: "#FFC857",
      text: "#8B5E00",
    },

    success: {
      bg: "#E7F9EC",
      border: "#57C785",
      text: "#2E7D32",
    },

    error: {
      bg: "#FFE5EA",
      border: "#FF6E8A",
      text: "#B71C45",
    },

    info: {
      bg: "#E7F3FF",
      border: "#69B7FF",
      text: "#1565C0",
    },
  },
};

export const colors = Colors;

export const TYPE_COLORS: Record<
  string,
  {
    bg: string;
    accent: string;
    border: string;
  }
> = {
  normal: {
    bg: "#FFF3F8",
    accent: "#E57AB2",
    border: "#D66BA4",
  },

  fogo: {
    bg: "#FFF0EA",
    accent: "#FF7043",
    border: "#F4511E",
  },

  água: {
    bg: "#EAF5FF",
    accent: "#42A5F5",
    border: "#1E88E5",
  },

  grama: {
    bg: "#EEF9F0",
    accent: "#66BB6A",
    border: "#43A047",
  },

  elétrico: {
    bg: "#FFFBE6",
    accent: "#FFCA28",
    border: "#FFB300",
  },

  psíquico: {
    bg: "#FFEAF2",
    accent: "#EC407A",
    border: "#D81B60",
  },

  gelo: {
    bg: "#E8FCFF",
    accent: "#4DD0E1",
    border: "#00ACC1",
  },

  dragão: {
    bg: "#F0EBFF",
    accent: "#7E57C2",
    border: "#673AB7",
  },

  trevas: {
    bg: "#ECEFF1",
    accent: "#607D8B",
    border: "#455A64",
  },

  fada: {
    bg: "#FFF0F7",
    accent: "#EC87C0",
    border: "#D95FA6",
  },

  lutador: {
    bg: "#FFF0EC",
    accent: "#E57373",
    border: "#D84343",
  },

  veneno: {
    bg: "#F7EEFF",
    accent: "#AB47BC",
    border: "#8E24AA",
  },

  terra: {
    bg: "#F6F0EB",
    accent: "#A1887F",
    border: "#8D6E63",
  },

  pedra: {
    bg: "#F7F7F7",
    accent: "#9E9E9E",
    border: "#757575",
  },

  inseto: {
    bg: "#F5FCEB",
    accent: "#9CCC65",
    border: "#7CB342",
  },

  fantasma: {
    bg: "#F2EEFF",
    accent: "#7E57C2",
    border: "#5E35B1",
  },

  aço: {
    bg: "#EEF2F4",
    accent: "#78909C",
    border: "#546E7A",
  },

  voador: {
    bg: "#EEF8FF",
    accent: "#64B5F6",
    border: "#42A5F5",
  },
};

export const getColor = (types: string[]) => {
  const firstType = types?.[0] || "normal";
  return TYPE_COLORS[firstType] || TYPE_COLORS.normal;
};
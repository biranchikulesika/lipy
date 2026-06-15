export interface TeamMember {
  name: string;
  role: string;
  description: string;
  contributions: string[];
  photoFilename?: string;
  social: {
    github?: string;
    linkedin?: string;
    email?: string;
  };
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Gundala Anushka",
    role: "Project Lead",
    description: "Coordinated project activities, communicated with mentors, managed progress tracking, reviewed implementation work, and led project presentations.",
    contributions: [
      "Project planning",
      "Progress tracking",
      "Mentor communication",
      "Presentation preparation",
      "Code contribution and review"
    ],
    photoFilename: "anushka.webp",
    social: {
      github: "https://github.com/Gundala-Anushka",
      linkedin: "https://www.linkedin.com/in/gundala-anushka-3b9995367",
      email: "mailto:gundalaanushka7@gmail.com"
    }
  },
  {
    name: "Biranchi Kulesika",
    role: "Technical Lead",
    description: "Developed the LiPyD dataset contributor platform, trained the LiPy CNN model, built the OCR application, designed the system architecture, and managed deployment workflows.",
    contributions: [
      "CNN model development",
      "Platform development",
      "Frontend creation",
      "Training pipeline",
      "System architecture"
    ],
    photoFilename: "biranchi.jpeg",
    social: {
      github: "https://github.com/biranchikulesika",
      linkedin: "https://linkedin.com/in/biranchikulesika",
      email: "mailto:biranchikulesika@gmail.com"
    }
  },
  {
    name: "Baibhab Sahu",
    role: "Dataset & Documentation",
    description: "Contributed to project documentation, dataset verification, manual review of collected samples, and filtering of invalid character submissions.",
    contributions: [
      "Dataset validation",
      "Sample verification",
      "Manual data filtering",
      "Documentation support"
    ],
    photoFilename: "baibhab.jpeg",
    social: {
      github: "https://github.com/baibhab911"
    }
  },
  {
    name: "Soumyasmita Mohapatra",
    role: "Dataset & Documentation",
    description: "Contributed to documentation, dataset validation, quality checking, and manual filtering of collected handwritten samples.",
    contributions: [
      "Dataset validation",
      "Sample verification",
      "Manual data filtering",
      "Documentation support"
    ],
    photoFilename: "soumya.jpeg",
    social: {
      github: "https://github.com/soumyasmitamohapatra2005"
    }
  },
  {
    name: "Prajna Dash",
    role: "Dataset & Documentation",
    description: "Contributed to dataset review, sample verification, documentation support, and removal of incorrectly labeled or invalid submissions.",
    contributions: [
      "Dataset review",
      "Sample verification",
      "Manual data filtering",
      "Documentation support"
    ],
    photoFilename: "prajna.jpeg",
    social: {
      github: "https://github.com/prajnadash73-netizen"
    }
  }
];

export const CONTRIBUTIONS = [];

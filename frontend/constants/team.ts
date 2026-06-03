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
      "Code review"
    ],
    photoFilename: "anushka.jpeg",
    social: {
    }
  },
  {
    name: "Biranchi Kulesika",
    role: "Technical Lead",
    description: "Developed the LiPiD dataset contributor platform, trained the LiPi CNN model, built the OCR application, designed the system architecture, and managed deployment workflows.",
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
    }
  }
];

export const CONTRIBUTIONS = [];

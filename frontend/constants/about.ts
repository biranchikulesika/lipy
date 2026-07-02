export const STATS = [
  { label: "Character Classes", value: "43" },
  { label: "Dataset Samples", value: "1370+" },
  { label: "Recognition Model", value: "CNN" },
  { label: "Project Type", value: "Internship Project" },
];

export const CHALLENGES = [
  {
    title: "Handwriting Variability",
    description:
      "Different writers produce the same Odia character using different stroke styles, proportions, and writing habits.",
  },
  {
    title: "Limited Public Datasets",
    description:
      "Handwritten Odia OCR research faces challenges due to the limited availability of large, structured datasets.",
  },
  {
    title: "Character Similarity",
    description:
      "Several Odia characters contain visually similar structures, making accurate classification difficult.",
  },
];

export const STACK = [
  { title: "Frontend", value: "Next.js + Tailwind CSS" },
  { title: "Backend", value: "FastAPI" },
  { title: "Machine Learning", value: "TensorFlow / Keras" },
  { title: "Deployment", value: "Vercel & Railway" },
];

export const STATUS = [
  { title: "Dataset Collection", value: "Active" },
  { title: "Model Training", value: "Active" },
  { title: "OCR Interface", value: "Operational" },
  { title: "LiPyD Platform", value: "Paused" },
];

export const FUTURE_WORK = [
  "Expand dataset coverage",
  "Improve recognition accuracy",
  "Support additional Odia characters",
  "Real-time camera recognition",
  "Sentence-level OCR research",
  "Mobile optimisation",
  "Dataset validation workflow",
  "Contributor management tools",
];

export const STORIES_DATA = [
  {
      id: "s1",
      heading: "What is LiPy?",
      body: "LiPy is a research project focused on handwritten Odia character recognition using artificial intelligence. It combines machine learning with a custom-built dataset to help computers understand handwritten Odia characters.",
      image: "https://images.unsplash.com/photo-1516322073854-c9b208316823?w=800&q=80"
  },
  {
      id: "s2",
      heading: "Why does this matter?",
      body: "Reading handwritten text is easy for humans but surprisingly difficult for computers. Every person writes differently, making handwriting one of the most challenging problems in computer vision.",
      image: "https://images.unsplash.com/photo-1544813545-4827233fc5ce?w=800&q=80"
  },
  {
      id: "s3",
      heading: "Why Odia?",
      body: "While many languages have large datasets and mature OCR systems, handwritten Odia remains largely unexplored. The lack of publicly available datasets has slowed research and development in this area.",
      image: "https://images.unsplash.com/photo-1580531548651-403987abda2a?w=800&q=80"
  },
  {
      id: "s4",
      heading: "How LiPy began",
      body: "LiPy was developed as part of the NIELIT Bhubaneswar Internship Programme by second-year students of the 5-Year Integrated MCA programme at Utkal University. The project was created to explore how deep learning can be applied to handwritten Odia character recognition.",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80"
  },
  {
      id: "s5",
      heading: "Every AI starts with data.",
      body: "Before a model can recognize handwriting, it must first learn from examples. That meant collecting handwritten samples from different people, each with their own writing style.",
      image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80"
  },
  {
      id: "s6",
      heading: "Building the dataset",
      body: "Each handwritten character was collected, organized, labeled, and prepared for training. Creating a clean and consistent dataset was one of the most important parts of the entire project.",
      image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80"
  },
  {
      id: "s7",
      heading: "Teaching the model",
      body: "The prepared dataset was used to train a Convolutional Neural Network (CNN). During training, the model gradually learned to identify patterns and distinguish one handwritten character from another.",
      image: "https://images.unsplash.com/photo-1620825937374-87fc7d62098d?w=800&q=80"
  },
  {
      id: "s8",
      heading: "Not every character is easy.",
      body: "Many Odia characters look very similar. Small differences in curves, loops, or strokes can completely change the meaning. Teaching a computer to notice these subtle differences is one of LiPy's biggest challenges.",
      image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80"
  },
  {
      id: "s9",
      heading: "How LiPy works today",
      body: "A handwritten character is processed, analyzed by the trained model, and matched with the most likely prediction. The entire process happens within a simple web interface designed for experimentation and research.",
      image: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=800&q=80"
  },
  {
      id: "s10",
      heading: "Where we are now",
      body: "LiPy currently focuses on recognizing individual handwritten Odia characters. The project continues to improve through better datasets, model tuning, and ongoing experimentation.",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80"
  },
  {
      id: "s11",
      heading: "Looking ahead",
      body: "Future work includes expanding the dataset, improving recognition accuracy, supporting more Odia characters, enabling real-time camera recognition, and exploring sentence-level OCR.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
  },
  {
      id: "s12",
      heading: "A small contribution to a bigger goal",
      body: "LiPy is more than an academic project. It is a step toward making the Odia language more accessible in the digital world and encouraging further research in handwritten Odia recognition.",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead2708?w=800&q=80"
  },
];

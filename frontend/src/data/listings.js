// Placeholder listings — swap this out for data from your API/Supabase
// once lib/apiClient.js or lib/supabaseClient.js is wired up.
export const LISTINGS = [
  {
    id: "l1",
    title: "TI-84 Plus graphing calculator, barely used",
    category: "Textbooks",
    price: 25,
    condition: "Like new",
    location: "Library",
    seller: "JM",
    isNew: true,
    postedAt: "2 hrs ago",
  },
  {
    id: "l2",
    title: "MacBook Pro 13\" 2020, great condition",
    category: "Electronics",
    price: 420,
    condition: "Like new",
    location: "Upper East Side",
    seller: "RS",
    isNew: false,
    postedAt: "4 hrs ago",
  },
  {
    id: "l3",
    title: "Wooden desk & chair set, dorm-sized",
    category: "Furniture",
    price: 60,
    condition: "Good",
    location: "Dorms",
    seller: "FN",
    isNew: false,
    postedAt: "6 hrs ago",
  },
  {
    id: "l4",
    title: "Wired over-ear headphones, works great",
    category: "Electronics",
    price: 18,
    condition: "Good",
    location: "Library",
    seller: "IK",
    isNew: true,
    postedAt: "8 hrs ago",
  },
  {
    id: "l5",
    title: "Calc I tutoring (per session)",
    category: "Services",
    price: 15,
    condition: null,
    location: "Library",
    seller: "AV",
    isNew: false,
    postedAt: "10 hrs ago",
  },
  {
    id: "l6",
    title: "Folding study chair",
    category: "Furniture",
    price: 30,
    condition: "Good",
    location: "Dorms",
    seller: "TP",
    isNew: false,
    postedAt: "1 day ago",
  },
  {
    id: "l7",
    title: "Intro to Psychology, 6th Ed",
    category: "Textbooks",
    price: 12,
    condition: "Fair",
    location: "Library",
    seller: "CO",
    isNew: false,
    postedAt: "1 day ago",
  },
];

export const CATEGORY_ICON_PATHS = {
  Electronics:
    "M2 4h20v13H2z M8 21h8 M12 17v4",
  Textbooks:
    "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
  Furniture:
    "M4 20v-7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7 M2 20h20 M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4",
  Sports:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 3a15 15 0 0 0 0 18 M12 3a15 15 0 0 1 0 18 M3 12h18",
  Clothing:
    "M6 3l3 2h6l3-2 3 4-3 2v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9L3 7z",
  Services:
    "M12 2l2.9 6.3 6.9.8-5.1 4.6 1.4 6.8L12 17.6l-6.1 2.9 1.4-6.8-5.1-4.6 6.9-.8z",
  Other:
    "M6 6h.01 M18 6h.01 M6 18h.01 M18 18h.01",
};

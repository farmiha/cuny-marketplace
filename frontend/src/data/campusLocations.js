import { getCampusKey } from "./campusThemes";

// Approximate campus reference points, not exact seller or pickup locations.
export const CAMPUS_LOCATIONS = {
  "hunter": {
    "label": "Hunter College",
    "position": [
      40.768538,
      -73.964741
    ]
  },
  "baruch": {
    "label": "Baruch College",
    "position": [
      40.740159,
      -73.98338
    ]
  },
  "brooklyn": {
    "label": "Brooklyn College",
    "position": [
      40.6310463,
      -73.9523602
    ]
  },
  "queens": {
    "label": "Queens College",
    "position": [
      40.737,
      -73.817
    ]
  },
  "csi": {
    "label": "College of Staten Island",
    "position": [
      40.6,
      -74.15
    ]
  },
  "ccny": {
    "label": "City College of New York",
    "position": [
      40.8198,
      -73.95
    ]
  },
  "york": {
    "label": "York College",
    "position": [
      40.702,
      -73.795
    ]
  },
  "lehman": {
    "label": "Lehman College",
    "position": [
      40.87284,
      -73.89458
    ]
  },
  "mec": {
    "label": "Medgar Evers College",
    "position": [
      40.66631,
      -73.95665
    ]
  },
  "jjay": {
    "label": "John Jay College",
    "position": [
      40.7703,
      -73.988
    ]
  },
  "citytech": {
    "label": "New York City College of Technology",
    "position": [
      40.6954,
      -73.987
    ]
  }
};

export function getMapCampusKey(value) {
  const key = getCampusKey(value);
  return key && Object.prototype.hasOwnProperty.call(CAMPUS_LOCATIONS, key)
    ? key
    : null;
}

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
  },
  "bmcc": {
    "label": "Borough of Manhattan Community College",
    "position": [
      40.7178,
      -74.0116
    ]
  },
  "bcc": {
    "label": "Bronx Community College",
    "position": [
      40.8578,
      -73.9117
    ]
  },
  "guttman": {
    "label": "Guttman Community College",
    "position": [
      40.7536,
      -73.9837
    ]
  },
  "hostos": {
    "label": "Hostos Community College",
    "position": [
      40.8165,
      -73.9255
    ]
  },
  "kcc": {
    "label": "Kingsborough Community College",
    "position": [
      40.5779,
      -73.9355
    ]
  },
  "laguardia": {
    "label": "LaGuardia Community College",
    "position": [
      40.7436,
      -73.9378
    ]
  },
  "qcc": {
    "label": "Queensborough Community College",
    "position": [
      40.7571,
      -73.7568
    ]
  }
};

export function getMapCampusKey(value) {
  const key = getCampusKey(value);
  return key && Object.prototype.hasOwnProperty.call(CAMPUS_LOCATIONS, key)
    ? key
    : null;
}
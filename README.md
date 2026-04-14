# Dream Interpretation App (Jungian / Inner Work)

## Overview

This project is an open-source web application for exploring dreams using principles from analytical psychology (Carl Jung) and the dreamwork methodology described by Robert A. Johnson in *Inner Work*.

The application helps users reflect on dreams as symbolic expressions of the unconscious by structuring dream content, eliciting personal associations, and presenting psychologically grounded interpretive hypotheses. It does **not** provide fixed meanings or predictions; instead, it supports self-inquiry and reflective understanding.

---

## What the Application Does

- **Dream capture & structuring**  
  Users record dreams in free text. The system organizes the dream into key elements such as characters, symbols, settings, emotions, and narrative shifts.

- **Personal associations**  
  Users are guided to provide their own associations for dream symbols, emphasizing subjective meaning over universal symbolism.

- **Jungian interpretive hypotheses**  
  The app generates multiple, clearly framed interpretation hypotheses based on:
  - psychological compensation  
  - shadow dynamics  
  - archetypal patterns  
  - relational (anima/animus) themes  
  - individuation and developmental motifs  

  Each hypothesis is supported by evidence from the dream and the user’s associations and can be accepted, refined, or rejected.

- **Inner Work & integration**  
  Inspired by Robert Johnson’s *Inner Work*, the app offers reflective questions and small integration practices to help relate dream insights to waking life.

- **Dream history & patterns**  
  Users can review past dreams and notice recurring symbols, emotions, or themes over time.

---

## Why Jungian Dreamwork?

Jungian dreamwork treats dreams as meaningful symbolic communications from the unconscious rather than as random noise or literal predictions.

Core ideas include:
- Dreams compensate the conscious attitude and reveal what is missing or neglected.
- Symbols are best understood through the dreamer’s own associations, not fixed dictionaries.
- Every figure or event in a dream can be approached as an aspect of the psyche.
- Psychological growth (individuation) emerges through conscious relationship to unconscious material.

Robert A. Johnson’s *Inner Work* translates these ideas into a practical and ethical approach that emphasizes reflection, restraint, and small lived adjustments rather than authoritative interpretations. This project is built to reflect that spirit.

---

## Philosophy & Scope

- Interpretations are hypotheses, not conclusions
- User associations are primary
- No diagnosis, prediction, or therapeutic claims
- Designed for reflection, not authority
- Privacy-first by design

---

## Disclaimer

This project is intended for personal reflection and educational exploration. It is not a substitute for psychotherapy or professional mental health care.

## Development

### Main Tech Stack

React + Vite + TypeScript + Material UI. Firebase Firestore for persistence, Firebase Anonymous Auth for per-user data isolation.

### Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Set up Firebase — see **[documentation/FIREBASE_SETUP.md](documentation/FIREBASE_SETUP.md)** for full instructions. The short version:
   - Create a Firebase project, enable Firestore and Anonymous Auth
   - Copy `.env.example` to `.env` and fill in your Firebase credentials
   - Run `npx firebase-tools deploy --only firestore:rules` to deploy security rules

3. Start the dev server:
   ```bash
   yarn dev
   ```

### Available Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start dev server |
| `yarn build` | Production build |
| `yarn preview` | Preview production build |
| `yarn lint` | Lint source files |
| `yarn test` | Run unit tests |
| `npx firebase-tools emulators:start` | Start Firebase local emulators (Firestore + Auth) |

## Documentation

- [documentation/FIREBASE_SETUP.md](documentation/FIREBASE_SETUP.md)
- [documentation/MVP.md](documentation/MVP.md)
- [documentation/PROJECT_ARCHITECTURE.md](documentation/PROJECT_ARCHITECTURE.md)
- [documentation/TECH_IMPLEMENTATION.md](documentation/TECH_IMPLEMENTATION.md)
- [documentation/UX_FLOW.md](documentation/UX_FLOW.md)

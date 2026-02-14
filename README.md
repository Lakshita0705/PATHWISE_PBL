# PathWise — AI-Powered Career Roadmap & Mentorship Platform

PathWise is an AI-driven career guidance platform that helps students become job-ready through personalized learning roadmaps, adaptive difficulty prediction, and credibility-based mentorship access.

It combines structured learning, analytics, and AI to guide users step-by-step toward their chosen career path.

---

## Overview

PathWise provides:

- Personalized career roadmaps  
- AI-based difficulty prediction  
- Real-time progress tracking  
- Structured learning paths  
- Credibility-based mentor unlocking  
- Performance and engagement analytics  
- Fully responsive UI  

---

## Architecture

**Frontend:** React, TypeScript, Tailwind CSS  
**Backend:** FastAPI  
**Database & Auth:** Supabase (PostgreSQL)  
**AI Model:** scikit-learn  

**Flow:**  
User → Dashboard → Metrics Engine → AI Model → Roadmap Generator → Database

---

## Core Modules

### Data & Metrics Engine
Tracks module completions, user activity, engagement, and learning velocity.  
This data powers personalization and roadmap adjustments.

### AI Roadmap Generator
Generates roadmaps based on user-selected career goals and engagement metrics.  
Modules unlock sequentially to ensure structured progression.

### Mentorship Module
Mentors unlock based on user credibility.  
Credibility increases as users complete milestones and stay consistent.

### Analytics Dashboard
Displays:
- Weekly progress  
- Modules completed  
- Study hours  
- Credibility score  
- Learning velocity  

All metrics update dynamically.

---

## How It Works

1. User registers  
2. Selects a career path  
3. System calculates engagement metrics  
4. AI model adjusts roadmap  
5. Roadmap is generated  
6. Modules unlock progressively  
7. Credibility increases  
8. Mentors unlock  

---

## Tech Stack

**Frontend**
- React  
- TypeScript  
- Tailwind CSS  
- Framer Motion  
- Recharts  

**Backend**
- FastAPI  
- scikit-learn  

**Database**
- Supabase (PostgreSQL)

---

## Problem It Solves

Many students follow unstructured tutorials without clear progression or mentorship access.  

PathWise provides structured learning, AI-guided progression, and credibility-based mentorship in one platform.


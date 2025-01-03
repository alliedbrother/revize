# Spaced Repetition App

A web application designed to help users learn effectively using the **spaced repetition** method. The app allows users to:
- Add study topics with customizable revision schedules.
- View and manage daily revision tasks.
- Track progress and postpone revisions as needed.

---

## **Features**

- **Frontend**: Built with **React.js** for a dynamic, responsive user experience.
- **Backend**: Powered by **Django** and **Django Rest Framework** for efficient API handling.
- **Database**: Uses **MongoDB** for flexible, document-based storage.

---

## **Architecture Overview**

- **Frontend**: 
  - React.js SPA with components for adding topics, viewing revisions, and updating statuses.
- **Backend**:
  - Django REST API for managing study and revision data.
- **Database**:
  - MongoDB to store study topics and revision schedules.

---

## **How It Works**

1. **Add Topics**: Users input what they've studied, and the app automatically calculates spaced repetition dates.
2. **View Revisions**: Users can see what they need to revise each day.
3. **Mark Progress**: Users can mark topics as "completed" or "postpone" them to another day.

---

## **Tech Stack**

- **Frontend**: React.js, Axios
- **Backend**: Django, Django Rest Framework
- **Database**: MongoDB (hosted on MongoDB Atlas)
- **Deployment**:
  - Frontend: Netlify
  - Backend: Heroku or AWS
  - Database: MongoDB Atlas

---

## **Screenshots**

### Home Page
![Homepage Screenshot](https://via.placeholder.com/800x400)

### Add Topics
![Add Topics Screenshot](https://via.placeholder.com/800x400)


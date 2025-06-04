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

## Deployment to AWS

### Prerequisites

- An AWS account
- AWS CLI installed and configured
- EB CLI installed (for Elastic Beanstalk deployment)
- Git

### Deployment Steps

#### 1. Clone the Repository

```bash
git clone https://your-repository-url.git
cd revize
```

#### 2. Backend Deployment (Elastic Beanstalk)

1. Navigate to the backend directory:
```bash
cd spaced-repetition/backend
```

2. Initialize Elastic Beanstalk:
```bash
eb init -p python-3.12 revize
```

3. Create an environment:
```bash
eb create revize-env
```

4. Set environment variables:
```bash
eb setenv \
  DJANGO_SECRET_KEY=your-secret-key \
  DJANGO_DEBUG=False \
  ALLOWED_HOSTS=.elasticbeanstalk.com \
  DJANGO_SU_NAME=admin \
  DJANGO_SU_EMAIL=admin@example.com \
  DJANGO_SU_PASSWORD=secure-password
```

5. Deploy:
```bash
eb deploy
```

#### 3. Frontend Deployment (S3 and CloudFront)

1. Build the frontend:
```bash
cd ../frontend
npm install
npm run build
```

2. Create an S3 bucket:
```bash
aws s3 mb s3://revize-frontend
```

3. Enable website hosting:
```bash
aws s3 website s3://revize-frontend --index-document index.html --error-document index.html
```

4. Upload the build files:
```bash
aws s3 sync dist/ s3://revize-frontend --acl public-read
```

5. Create a CloudFront distribution (optional, for better performance):
   - Go to AWS CloudFront in the AWS console
   - Create a new distribution with the S3 bucket as the origin
   - Configure HTTPS and caching settings as needed

#### 4. Configure Backend API URL

Update the API URL in the frontend code to point to your Elastic Beanstalk environment URL:

Edit `frontend/src/services/api.js`:
```javascript
const API_URL = 'https://your-eb-environment-url.elasticbeanstalk.com/api';
```

#### 5. Database Configuration

For production, consider using AWS RDS (PostgreSQL or MySQL) instead of SQLite:

1. Create an RDS instance in the AWS console
2. Update `backend/spaced_repetition/settings.py` to use the RDS database

## Local Development

### Backend

```bash
cd spaced-repetition/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd spaced-repetition/frontend
npm install
npm run dev
```


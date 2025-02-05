# Backend for TRENDIFY  (Newspaper Aggregation Website)

## Overview
The backend for the Newspaper Aggregation Website is built with Node.js, Express.js, and MongoDB. It manages data storage, authentication, and API endpoints to support the client-side application. Key features include JWT-based authentication, role management, and secure environment variable usage.

---

## Features

1. **Authentication**
   - Email/password-based registration and login.
   - Social login (e.g., Google) support.
   - JWT token generation for private route protection.
   - Persistent login state.

2. **CRUD Operations**
   - **Articles**: Add, update, delete, and fetch articles.
   - **Publishers**: Add and manage publishers.
   - **Users**: Manage user roles (admin, normal user, premium user).

3. **Admin Features**
   - Approve or decline articles with optional comments.
   - Mark articles as premium.
   - View user statistics and article trends.

4. **Data Handling**
   - Pagination for efficient data retrieval.
   - Search and filter functionality for articles.

5. **Subscription Management**
   - Track premium subscriptions with timestamps.
   - Automatically downgrade users after the subscription period expires.

6. **Security**
   - Environment variables for sensitive information.
   - Input validation and error handling.

---

## Tech Stack

- **Backend Framework**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JSON Web Tokens (JWT)
- **Image Hosting**: imgBB or Cloudinary

---

## API Endpoints

### Authentication
- `POST /api/register`: Register a new user.
- `POST /api/login`: User login and JWT token generation.

### Articles
- `GET /api/articles`: Fetch all approved articles.
- `POST /api/articles`: Add a new article.
- `PATCH /api/articles/:id`: Update an article.
- `DELETE /api/articles/:id`: Delete an article.

### Publishers
- `GET /api/publishers`: Fetch all publishers.
- `POST /api/publishers`: Add a new publisher.

### Admin
- `GET /api/admin/users`: Fetch all users.
- `PARCH /api/admin/users/:id/make-admin`: Promote a user to admin.
- `GET /api/admin/articles`: Fetch all articles for review.
- `PATCH /api/admin/articles/:id/approve`: Approve an article.
- `PATCH /api/admin/articles/:id/decline`: Decline an article with a comment.
- `PATCH /api/admin/articles/:id/premium`: Mark an article as premium.

---

## Installation

### Prerequisites
- Node.js installed
- MongoDB Atlas account or local MongoDB setup

### Steps

1. Clone the repository:
   ```bash
   git clone <https://github.com/jui9797/newspaper-project-server>
   ```

2. Navigate to the server directory:
   ```bash
   cd server
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   - Create a `.env` file with the following:
     ```env
     PORT=5000
     MONGO_URI=<your-mongodb-uri>
     JWT_SECRET=<your-jwt-secret>
     IMG_UPLOAD_API_KEY=<your-imgbb-api-key>
     ```

5. Start the server:
   ```bash
   npm start
   ```

---

## Environment Variables

| Key                  | Description                           |
|----------------------|---------------------------------------|
| `PORT`               | Port number for the server           |
| `MONGO_URI`          | MongoDB connection string            |
| `JWT_SECRET`         | Secret key for JWT authentication    |
| `IMG_UPLOAD_API_KEY` | API key for image hosting service    |

---

## Contribution
Feel free to fork the repository and make contributions. For significant changes, open an issue to discuss your proposed modifications.

---

## License
This project is licensed under the MIT License.

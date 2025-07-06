# Organization Microservice

This microservice is part of the Calysta Pro CRM system and is responsible for managing organizations, business profile settings, tags, and Plivo rented numbers.

## Features
- Organization CRUD operations
- Business profile settings management
- Tag management
- Plivo rented number management
- Secure API endpoints with authentication middleware

## Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- AWS SDK
- Plivo
- dotenv
- CORS
- body-parser

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- MongoDB instance

### Installation
1. Clone the repository or copy the microservice folder.
2. Navigate to the `organization-microservice` directory.
3. Install dependencies:
   ```sh
   npm install
   ```
4. Create a `.env` file in the root of the microservice with the following variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   DB_NAME=your_database_name
   PORT=8080 # or any port you prefer
   ```

### Running the Service
- For production:
  ```sh
  npm start
  ```
- For development (with auto-reload):
  ```sh
  npm run server
  ```

The service will be available at `http://localhost:<PORT>`.

## API Endpoints
All endpoints are prefixed with `/api/admin`. See `routers/adminRoutes.js` for detailed routes and usage.

## Project Structure
- `index.js` - Entry point
- `config/` - Database and configuration files
- `controllers/` - Business logic for each resource
- `models/` - Mongoose models
- `routers/` - API route definitions
- `utils/` - Utility functions and validators

## License
ISC

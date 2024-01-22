# Ichi Game

## Getting started
- Clone this repository
- Launch a virtual local server app (Laragon, Xampp, Wamp)
    - Start the Apache and MySQL servers
    - Create a database named 'ichi'
    - Then import the ichi-game database in phpMyAdmin
- Open a command-line interface at the root of the project

### Backend
- At the root of the project, navigate to the backend:
```
cd backend
```
- Install project dependencies:
```
npm install
```
- Create a `.env` file and copy the following lines:
```dosini
DATABASE_HOST="localhost"
DATABASE_NAME="ichi"
DATABASE_USER="root"
DATABASE_PASSWORD=""
DATABASE_PORT=3306
SECRET_KEY="your_really_long_and_really_secret_secret_key"
```
- Finally you can start the backend:
```
# Development (watch mode)
npm run start:dev

# Production
npm run start:prod
```

### Frontend
- At the root of the project, navigate to the frontend:
```
cd frontend
```
- Install project dependencies:
```
npm install
```
- Finally you can start the frontend:
```
ng serve
```
- Then navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.
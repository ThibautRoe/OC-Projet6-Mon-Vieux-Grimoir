# Mon Vieux Grimoire

Project #7 of OpenClassrooms certification / Fullstack Web Developer

## Preview

-   Hosted back-end (fully functional, DB is restored to initial state on a regular basis for security reasons) + OpenAPI / Swagger documentation: https://oc-7-mon-vieux-grimoire-back-end.vercel.app/
-   Hosted front-end: https://oc-7-mon-vieux-grimoire.vercel.app/

## Technologies

-   [Express.js](https://expressjs.com/)
-   [MongoDB Atlas](https://www.mongodb.com/atlas/database)
-   [Cloudinary](https://cloudinary.com/) (for images hosting for back-end hosted on Vercel only, images are stored locally when back-end runs on localhost)

## Back-end

### ⚠️ Important Notes

This project's backend needs a .env file to work properly on local\
It is are not hosted on this Github repo, please get in touch with the author in order to get them

### 🛠️ Install Dependencies

```bash
cd backend
npm install
```

### 🧑🏻‍💻 Usage

```bash
npm run start     # To start Node.js server
npm run dev       # To start Node.js server in watch mode
npm run debug     # To start with debugger
```

_Tested with Node.js 20.9.0 and NPM 10.1.0_

### 🕮 Postman collection

https://github.com/ThibautRoe/OC-Projet7-Mon-Vieux-Grimoire/blob/main/backend/postman.postman_collection.json

## Front-end

### 🛠️ Install Dependencies

```bash
cd frontend
npm install
```

### 🧑🏻‍💻 Usage

```bash
npm run start
npm run build
npm run test
```

_Tested with Node.js 16_
